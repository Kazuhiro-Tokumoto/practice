import https from "https";
import fs from "fs";
import WebSocket, { WebSocketServer } from "ws";
import { createClient } from '@supabase/supabase-js';
import url from "url";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dgram from "dgram";
import { Client as SSHClient } from 'ssh2';
import { Resolver } from "node:dns/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

console.log("--------------------------------------------------");
console.log("🚀 [System] 物理班・統合要塞サーバー 強化版 稼働中");
console.log("🛠️  Auth: Supabase Guard / Health: Heartbeat Enabled");
console.log("--------------------------------------------------");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

let httpsServer;
try {
  httpsServer = https.createServer({
    key: fs.readFileSync("/etc/letsencrypt/live/mail.shudo-physics.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/mail.shudo-physics.com/fullchain.pem"),
  });
} catch (e) {
  httpsServer = https.createServer(); 
}

const wss = new WebSocketServer({ server: httpsServer });
const rooms = new Map();
const clientRoom = new Map();
const connectedUsers = new Map(); // server.mjs からの重複チェック用

// --- server.mjs 機能: 心拍確認 (30秒おき) ---
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`💀 [Health] ゾンビ接続を切断: ${ws.userName || "Unknown"}`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => clearInterval(interval));

wss.on("connection", (ws) => {
  ws.authenticated = false; // 最初は未認証
  ws.isAlive = true;
  let sshConn = null;
  let sshStream = null;

  ws.on('pong', () => { ws.isAlive = true; }); // server.mjs の機能

  ws.on("message", async (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch (e) { return; }

    // SSH 認証 (main.mjs の機能)
    if (msg.type === 'auth') {
      handleSSHAuth(ws, msg, (conn, stream) => {
        sshConn = conn;
        sshStream = stream;
      });
      return;
    }

    // SSH 操作 (認証済みストリームが必要)
    if (msg.type === 'input' && sshStream) { sshStream.write(msg.data); return; }
    if (msg.type === 'resize' && sshStream) { sshStream.setWindow(msg.rows, msg.cols); return; }

    // WebSocket 部屋機能 (server.mjs の認証ガードを適用)
    if (msg.type === "join") {
      await handleJoin(ws, msg);
    }

    if (msg.type === "message" || msg.type === "DH") {
      if (!ws.authenticated) {
        console.warn(`⚠️ [Security] 未認証のリレー試行をブロック: ${ws.userName || "Unknown"}`);
        return;
      }
      const room = clientRoom.get(ws);
      if (room) relayRoom(room, ws, msg);
    }
  });

  ws.on("close", () => {
    if (sshConn) sshConn.end();
    handleLeave(ws);
  });
});

// --- server.mjs 統合: 認証付き Join 処理 ---
async function handleJoin(ws, msg) {
  const { room, name, uuid, token } = msg;

  // 1. パラメータチェック
  if (!room || !name || !token || !uuid) return;

  // 2. 認証チェック (server.mjs の核心機能)
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user || user.id !== uuid) {
    console.error(`🚨 [Auth] 認証失敗: ${name}`);
    ws.send(JSON.stringify({ type: "join-nack", reason: "Authentication failed" }));
    return;
  }

  // 3. 重複ログインチェック
  if (connectedUsers.has(uuid)) {
    console.log(`⛔ [Auth] 重複ログイン拒否: ${name}`);
    ws.send(JSON.stringify({ type: "join-nack", reason: "USER-LOGINED" }));
    return;
  }

  // 4. 定員チェック (2名まで)
  let list = rooms.get(room) || [];
  if (list.length >= 2) {
    ws.send(JSON.stringify({ type: "join-nack", reason: "Room full" }));
    return;
  }

  // 認証成功
  ws.authenticated = true;
  ws.uuid = uuid;
  ws.userName = name;
  connectedUsers.set(uuid, ws);

  list.push({ ws, name, uuid });
  rooms.set(room, list);
  clientRoom.set(ws, room);

  await supabase.from('profile_users').update({ is_active: true }).eq('uuid', uuid);
  ws.send(JSON.stringify({ type: "join-ack", room }));

  console.log(`✅ [Room] 入室成功: ${name} (Room: ${room})`);

  // 2人揃ったら DH 開始
  if (list.length === 2) {
    list.forEach(c => c.ws.send(JSON.stringify({ type: "dh-start", room })));
  }
}

// --- server.mjs 統合: Leave 処理 ---
async function handleLeave(ws) {
  // 1. 重複ログイン管理マップから削除し、DBをオフラインに
  if (ws.uuid && connectedUsers.get(ws.uuid) === ws) {
    connectedUsers.delete(ws.uuid);
    await supabase.from('profile_users').update({ is_active: false }).eq('uuid', ws.uuid);
  }

  // 2. 部屋の処理
  const roomName = clientRoom.get(ws);
  if (!roomName) return;

  const list = rooms.get(roomName);
  if (list) {
    const idx = list.findIndex((c) => c.ws === ws);
    if (idx >= 0) {
      // --- server.mjs のブロードキャスト機能をここに追加 ---
      const { name } = list[idx];
      list.splice(idx, 1); // 自分をリストから消す
      
      // 部屋に残っている相手に「退出したよ」と送る
      relayRoom(roomName, ws, { type: "leave-broadcast", room: roomName, name });
      console.log(`👋 [Room] 退出通知を送信: ${name} (Room: ${roomName})`);
    }

    // 部屋に誰もいなくなったら削除
    if (list.length === 0) {
      rooms.delete(roomName);
    }
  }

  clientRoom.delete(ws);
}
// --- main.mjs 機能: SSH 認証ロジック分離 ---
function handleSSHAuth(ws, msg, callback) {
  const conn = new SSHClient();
  conn.on('ready', () => {
    ws.send("AUTHENTICATED");
    conn.shell({ term: 'xterm-256color', rows: msg.rows || 24, cols: msg.cols || 80 }, (err, s) => {
      if (err) return ws.send("Shell Error: " + err.message);
      s.on('data', (d) => ws.send(d.toString()));
      callback(conn, s);
    });
  }).on('error', (err) => {
    ws.send("SSH Error: " + err.message);
  }).connect({
    host: '127.0.0.1',
    port: 22,
    username: msg.username,
    privateKey: msg.privateKey
  });
}

// --- main.mjs 機能: DNS ゲートウェイ (リクエスト処理) ---
httpsServer.on("request", async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  if (parsedUrl.pathname === "/dns-query") {
    // ... (元の main.mjs の DNS 処理をそのまま維持)
    handleDNSQuery(req, res, parsedUrl);
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("🏰 物理班・統合要塞サーバー (強化版) 稼働中");
});

function relayRoom(roomName, fromWs, obj) {
  const room = rooms.get(roomName);
  if (!room) return;
  const raw = JSON.stringify(obj);
  for (const c of room) if (c.ws !== fromWs && c.ws.readyState === WebSocket.OPEN) c.ws.send(raw);
}

httpsServer.listen(443);