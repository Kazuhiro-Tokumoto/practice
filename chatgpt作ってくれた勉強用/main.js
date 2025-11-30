// ================================
// main.js - 最終完全版（IME対策 / 黒紫テーマ / UUID / AES / Cookie）
// ================================

// ================================
// 黒紫テーマ CSS
// ================================
const style = document.createElement("style");
style.textContent = `
  body {
    background: #0d0d0f;
    font-family: "Noto Sans JP", sans-serif;
    color: #e3d9ff;
    margin: 0;
    padding: 0;
  }

  input, button {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #6d3df8;
    background: #1a1a22;
    color: #e3d9ff;
    font-size: 15px;
    margin-bottom: 6px;
    outline: none;
    box-sizing: border-box;
  }

  input:focus {
    border-color: #b08bff;
    box-shadow: 0 0 6px #b08bff;
  }

  button {
    background: linear-gradient(135deg, #6d3df8, #b08bff);
    border: none;
    cursor: pointer;
    font-weight: bold;
    transition: 0.2s;
  }

  button:hover {
    transform: scale(1.03);
    filter: brightness(1.15);
  }

  .chat-log {
    background: #121217;
    border: 1px solid #6d3df8;
    border-radius: 10px;
    padding: 10px;
  }

  .chat-log p {
    margin: 4px 0;
    padding: 4px 6px;
    word-break: break-word;
  }

  .system-msg { color: #c0a4ff; font-style: italic; }
  .me-msg { color: #9bf0ff; text-align: right; }
  .other-msg { color: #e3d9ff; }

  @media (max-width: 600px) {
    input, button { width: 100% !important; }
    .chat-log { height: 60vh !important; }
  }
`;
document.head.appendChild(style);

// ================================
// UUID Cookie
// ================================
let uuid = document.cookie.match(/uuid=([^;]+)/)?.[1];
if (!uuid) {
  uuid = crypto.randomUUID();
  document.cookie = `uuid=${uuid}; path=/; SameSite=Lax`;
}

// ================================
// nickname Cookie
// ================================
let savedNick = document.cookie.match(/nickname=([^;]+)/)?.[1];
if (savedNick) savedNick = decodeURIComponent(savedNick);

// ================================
// 共通入力欄設定（IME禁止 / 半角英数字）
// ================================
function applyInputRules(elem) {
  elem.inputMode = "latin";
  elem.autocomplete = "off";
  elem.autocorrect = "off";
  elem.autocapitalize = "none";
  elem.spellcheck = false;
}

// ================================
// 接続 UI
// ================================
const ui = document.createElement("div");
ui.style.width = "400px";
ui.style.margin = "40px auto";
ui.style.textAlign = "center";
document.body.appendChild(ui);

const title = document.createElement("h3");
title.textContent = "サーバー接続";
ui.appendChild(title);

// サーバーアドレス
const serverInput = document.createElement("input");
serverInput.type = "text";
serverInput.placeholder = "サーバーアドレス";
serverInput.style.width = "80%";
applyInputRules(serverInput);   // ← 追加！
ui.appendChild(serverInput);

ui.appendChild(document.createElement("br"));
ui.appendChild(document.createElement("br"));

// ニックネーム欄
const nickLabel = document.createElement("label");
nickLabel.innerText = "ニックネーム";
nickLabel.style.display = "block";

const nickInput = document.createElement("input");
nickInput.type = "text";
nickInput.placeholder = "ニックネーム";
nickInput.style.width = "80%";
applyInputRules(nickInput);   // ← 追加！
ui.appendChild(nickLabel);
ui.appendChild(nickInput);

ui.appendChild(document.createElement("br"));
ui.appendChild(document.createElement("br"));

// 暗号鍵
const pwInput = document.createElement("input");
pwInput.type = "password";
pwInput.placeholder = "暗号鍵";
pwInput.style.width = "80%";
applyInputRules(pwInput);   // ← 追加！
ui.appendChild(pwInput);

ui.appendChild(document.createElement("br"));
ui.appendChild(document.createElement("br"));

const startBtn = document.createElement("button");
startBtn.textContent = "接続";
startBtn.style.width = "60%";
ui.appendChild(startBtn);

let nickname = savedNick || null;
if (savedNick) {
  nickInput.style.display = "none";
  nickLabel.style.display = "none";
}

// ================================
// チャット UI
// ================================
const chat = document.createElement("div");
chat.style.display = "none";
chat.style.width = "480px";
chat.style.margin = "20px auto";
document.body.appendChild(chat);

const log = document.createElement("div");
log.style.height = "360px";
log.style.overflowY = "auto";
log.className = "chat-log";
chat.appendChild(log);

// メッセージ入力欄（ここも nickname と完全同仕様に）
const msgInput = document.createElement("input");
msgInput.type = "text";
msgInput.placeholder = "メッセージ";
msgInput.style.width = "72%";
applyInputRules(msgInput);   // ← 今回の本命！！
chat.appendChild(msgInput);

const sendBtn = document.createElement("button");
sendBtn.textContent = "送信";
sendBtn.style.width = "26%";
sendBtn.style.marginLeft = "2%";
chat.appendChild(sendBtn);

let ws = null;

// ================================
// メッセージ追加
// ================================
function addMessage(type, text) {
  const p = document.createElement("p");
  if (type === "system") p.className = "system-msg";
  else if (type === "Me") p.className = "me-msg";
  else p.className = "other-msg";

  p.textContent = type === "Me" ? text : `(${type}) ${text}`;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// ================================
// WebSocket
// ================================
function beginWS() {
  const host = serverInput.value.trim();
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${host}:35000`);

  ws.onopen = () => addMessage("system", "接続完了");
  ws.onerror = () => addMessage("system", "WebSocket エラー");
  ws.onclose = () => addMessage("system", "切断されました");

  ws.onmessage = async (e) => {
    let obj;
    try { obj = JSON.parse(e.data); }
    catch { return; }

    if (obj.name === "system") {
      addMessage("system", obj.data);
      return;
    }

    const sender = obj.nickname || obj.name;
    const enc = obj.data;

    if (obj.uuid === uuid) return;

    try {
      const plain = await DecryptAES(enc, pwInput.value);
      if (sender === nickname) return;
      addMessage(sender, plain);
    } catch {
      addMessage(sender, `[復号失敗] ${enc}`);
    }
  };
}

// ================================
// 送信
// ================================
async function sendMessage() {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addMessage("system", "まだ接続できていません");
    return;
  }

  const txt = msgInput.value.trim();
  if (!txt) return;

  const enc = await EncryptAES(txt, pwInput.value);
  addMessage("Me", txt);

  ws.send(JSON.stringify({
    uuid: uuid,
    name: nickname,
    nickname: nickname,
    data: enc
  }));

  msgInput.value = "";
}

sendBtn.onclick = sendMessage;
msgInput.onkeydown = e => (e.key === "Enter" && sendMessage());

// ================================
// 接続開始
// ================================
startBtn.onclick = () => {
  if (!savedNick && !nickInput.value.trim()) return alert("ニックネームを入力してください");
  if (!pwInput.value.trim()) return alert("暗号鍵を入力してください");

  nickname = savedNick || nickInput.value.trim();
  document.cookie = `nickname=${encodeURIComponent(nickname)}; path=/; SameSite=Lax`;

  ui.style.display = "none";
  chat.style.display = "block";

  beginWS();
};
