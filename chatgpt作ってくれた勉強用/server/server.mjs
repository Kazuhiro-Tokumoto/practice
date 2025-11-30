// ================================
// server.mjs - 完全安定版（反射しない）
// ================================

import fs from "fs";
import net from "net";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";

const TCP_PORT = 40000;
const WS_PORT = 35000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// users.json
const DB_FILE = path.join(__dirname, "users.json");

let uuidDB = {};
try {
  uuidDB = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
} catch {
  uuidDB = {};
  fs.writeFileSync(DB_FILE, "{}");
}
function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(uuidDB, null, 2));
}

const tcpClients = new Map(); // sock -> ip
const wsClients = new Set();  // ws

function listParticipants() {
  const tcpNames = [...tcpClients.values()];
  const wsNames = [...wsClients].map(ws => ws.nickname || "noname");
  return [...tcpNames, ...wsNames].join(", ");
}

function now() {
  return new Date().toISOString().replace("T", " ").slice(0,19);
}

function broadcastSystem(text) {
  const msg = `[system] ${text}`;

  for (const sock of tcpClients.keys()) {
    try { sock.write(msg + "\n"); } catch {}
  }

  const obj = { name: "system", data: text };
  const send = JSON.stringify(obj);

  for (const ws of wsClients) {
    try { ws.send(send); } catch {}
  }
}

function broadcastEncrypted(fromNick, uuid, enc) {
  // TCP
  const tcpLine = `[${fromNick}]${enc}\n`;
  for (const [sock, ip] of tcpClients) {
    if (uuid === ip) continue; // ★送信元除外
    try { sock.write(tcpLine); } catch {}
  }

  // WS
  const wsLine = JSON.stringify({
    name: fromNick,
    nickname: fromNick,
    uuid: uuid,
    data: enc
  });

  for (const ws of wsClients) {
    if (ws.uuid === uuid) continue; // ★送信元除外
    try { ws.send(wsLine); } catch {}
  }
}

// ================================
// TCP Server（Python）
// ================================
const tcpServer = net.createServer((sock) => {
  const ip = (sock.remoteAddress || "").replace(/^::ffff:/, "");
  tcpClients.set(sock, ip);

  broadcastSystem(`${ip} が参加しました。`);
  broadcastSystem(`現在の参加者: ${listParticipants()}`);

  let buf = "";
  sock.on("data", (chunk) => {
    buf += chunk.toString("utf8");

    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 1);

      const line = raw.trim();
      if (!line) continue;

      let enc = line;
      const m = line.match(/^\[[^\]]+\](.*)$/);
      if (m) enc = m[1].trim();

      broadcastEncrypted(ip, ip, enc); // TCPはipをuuid扱い
    }
  });

  sock.on("close", () => {
    tcpClients.delete(sock);
    broadcastSystem(`${ip} が退出しました。`);
    broadcastSystem(`現在の参加者: ${listParticipants()}`);
  });

  sock.on("error", () => tcpClients.delete(sock));
});

tcpServer.listen(TCP_PORT, "0.0.0.0");

// ================================
// WebSocket Server
// ================================
const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws, req) => {
  wsClients.add(ws);

  // cookie → uuid
  const raw = req.headers.cookie || "";
  const cookieMap = Object.fromEntries(
    raw.split(";").map(v => v.trim().split("=")).filter(a => a[0])
  );
  ws.uuid = cookieMap.uuid || null;

  ws.nickname = (ws.uuid && uuidDB[ws.uuid]) || null;

  ws.on("message", (msg) => {
    let obj;
    try { obj = JSON.parse(msg.toString()); }
    catch { return; }

    const enc = (obj.data || "").trim();
    const nick = obj.nickname || "noname";
    const uuid = obj.uuid;

    if (!ws.uuid) ws.uuid = uuid;

    const first = !ws.nickname;
    ws.nickname = nick;

    uuidDB[ws.uuid] = nick;
    saveDB();

    if (first) {
      broadcastSystem(`${nick} が参加しました。`);
      broadcastSystem(`現在の参加者: ${listParticipants()}`);
    }

    if (enc) broadcastEncrypted(nick, ws.uuid, enc);
  });

  ws.on("close", () => {
    wsClients.delete(ws);
    if (ws.nickname) broadcastSystem(`${ws.nickname} が退出しました。`);
    broadcastSystem(`現在の参加者: ${listParticipants()}`);
  });
});

console.log(`[WS] ready on port ${WS_PORT}`);
console.log(`[TCP] ready on port ${TCP_PORT}`);
