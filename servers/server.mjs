import https from "https";
import fs from "fs";
import WebSocket, { WebSocketServer } from "ws";
import { createClient } from '@supabase/supabase-js';

// --- ここから修正 ---
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env の場所を絶対パスで指定して読み込む
dotenv.config({ path: path.join(__dirname, ".env") });

// デバッグ用（起動時にURLが出れば成功！）
console.log("📍 Supabase URL:", process.env.SUPABASE_URL);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
// --- ここまで ---

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
// ===== TLS (SSL証明書) =====
// ローカル開発などで証明書がない場合でも落ちないように修正
let httpsServer;
try {
  const tlsOptions = {
    key: fs.readFileSync("/etc/letsencrypt/live/mail.shudo-physics.com/privkey.pem"),
    cert: fs.readFileSync("/etc/letsencrypt/live/mail.shudo-physics.com/fullchain.pem"),
  };
  httpsServer = https.createServer(tlsOptions);
} catch (e) {
  console.warn("⚠️ SSL証明書が見つかりません。通常のHTTPサーバーとして動作する可能性があります。");
  // 必要ならここで process.exit(1)
  // 今回はコード提示用なのでこのまま進めます
  httpsServer = https.createServer(); 
}

const wss = new WebSocketServer({ server: httpsServer });

// ===== 管理用 Map =====
const rooms = new Map();      // roomName -> [{ ws, name, uuid }]
const clientRoom = new Map(); // ws -> roomName
const connectedUsers = new Map(); // UUID -> ws

// ===== ユーティリティ =====
function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function relayRoom(roomName, fromWs, obj) {
  const room = rooms.get(roomName);
  if (!room) return;
  const raw = JSON.stringify(obj);
  for (const c of room) {
    if (c.ws !== fromWs && c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(raw);
    }
  }
}

function relayRoomAll(roomName, obj) {
  const room = rooms.get(roomName);
  if (!room) return;
  const raw = JSON.stringify(obj);
  for (const c of room) {
    if (c.ws.readyState === WebSocket.OPEN) {
      c.ws.send(raw);
    }
  }
}

// オンライン状態の一括リセット
async function resetOnlineStatus() {
  console.log("🧹 全ユーザーのオンライン状態をリセット中...");
  await supabase.from('profile_users').update({ is_active: false }).eq('is_active', true);
}

// ★追加★ Ping/Pong (心拍確認)
// 30秒ごとに生存確認を行い、応答がないゾンビ接続を強制切断する
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    // isAliveがfalseのままなら、前回のPingに応答しなかったので切断
    if (ws.isAlive === false) {
      console.log("💀 ゾンビ接続を切断します");
      return ws.terminate();
    }

    // 次のPongが来るまで一旦falseにする
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on("close", () => {
  clearInterval(interval);
});


// ===== JOIN 処理 =====
async function handleJoin(ws, msg) {
  const { room, name, uuid, token } = msg;

  // 1. パラメータチェック
  if (!room || !name || !token || !uuid) {
    send(ws, { type: "join-nack", reason: "Invalid parameters" });
	 ws.close();
    return;
  }

  // 2. 認証チェック
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user || user.id !== uuid) {
    console.error(`🚨 認証失敗: ${name} (UUID: ${uuid})`);
    send(ws, { type: "join-nack", reason: "Authentication failed" });
    ws.close();
    return;
  }

  // 3. 重複チェック (先勝ち仕様: Join-Nack)
  const existingSocket = connectedUsers.get(uuid);
  if (existingSocket && existingSocket.readyState === WebSocket.OPEN) {
    console.log(`⛔ 重複ログイン拒否: ${name}`);
    send(ws, { type: "join-nack", reason: "USER-LOGINED", message: "既にログイン中です。" });
    ws.close();
    return;
  }

  // 4. 部屋の定員チェック (★ここをDB更新の前に移動しました)
  let list = rooms.get(room);
  if (!list) {
    list = [];
    rooms.set(room, list);
  }
  if (list.length >= 2) {
    send(ws, { type: "join-nack", room, reason: "room full" });
    // 部屋に入れないならここで終了（DBも更新しない）
    return;
  }

  // ===== ここまで来てやっと入室確定 =====

  // 5. 登録処理
  connectedUsers.set(uuid, ws);
  ws.authenticated = true;
  ws.uuid = uuid;
  // ★追加: 生存フラグ初期化
  ws.isAlive = true; 

  // DB更新
  await supabase.from('profile_users').update({ is_active: true }).eq('uuid', uuid);

  list.push({ ws, name, uuid });
  clientRoom.set(ws, room);

  console.log(`✅ 入室成功: ${name}`);

  send(ws, { type: "join-ack", room });
  relayRoom(room, ws, { type: "join-broadcast", room, name });

  // 2人揃ったら DH 開始
  if (list.length === 2) {
    console.log(`Room [${room}]: 鍵交換を開始`);
    relayRoomAll(room, { type: "dh-start", room, name: "system" });
  }
}

// ===== LEAVE 処理 =====
async function handleLeave(ws) {
  if (ws.uuid && connectedUsers.get(ws.uuid) === ws) {
    connectedUsers.delete(ws.uuid);
    // DBをオフラインに戻す
    await supabase.from('profile_users').update({ is_active: false }).eq('uuid', ws.uuid);
  }

  const room = clientRoom.get(ws);
  if (!room) return;
  const list = rooms.get(room);
  if (!list) return;

  const idx = list.findIndex((c) => c.ws === ws);
  if (idx >= 0) {
    const { name } = list[idx];
    list.splice(idx, 1);
    relayRoom(room, ws, { type: "leave-broadcast", room, name });
  }

  clientRoom.delete(ws);
  if (list.length === 0) rooms.delete(room);
}

// ===== 接続管理 =====
wss.on("connection", (ws) => {
  ws.authenticated = false;
  ws.isAlive = true;

  // ★追加: Pong受信で生存フラグを回復
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on("message", (data) => {
    let msg;
    try { 
      msg = JSON.parse(data.toString()); 
    } catch (e) { 
      console.error("JSON Parse Error:", e);
      return; 
    }

    switch (msg.type) {
      case "join":
        handleJoin(ws, msg);
        break;
      case "leave":
        handleLeave(ws);
        break;
      case "DH":
      case "message":
        if (!ws.authenticated) {
          console.warn("⚠️ 未認証ブロック");
          return;
        }
        const room = clientRoom.get(ws);
        if (room) relayRoom(room, ws, msg);
        break;
    }
  });

  ws.on("close", () => {
    handleLeave(ws);
  });
});

// 起動処理
resetOnlineStatus().then(() => {
  // ポートは環境に合わせて変更してください (443 or 8080)
  httpsServer.listen(443, () => {
    console.log("🚀 Server Running with Heartbeat & Auth Guard");
  });
});
