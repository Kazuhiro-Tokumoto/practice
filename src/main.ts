// main.ts

let ws: WebSocket;

let room = "default";


function smain() {
  connect();
  setupSendEvents();
}

async function sendMessage() {
  const text = input.value;
let userName = nameInput.value;  // とりあえず固定
  if (!text) return;

  if (ws.readyState === WebSocket.OPEN) {
    const send = {
      room: room,
      type: "msg",
      name: userName,
      text: text,
    };

    ws.send(JSON.stringify(send));
    box.textContent += "自分: " + text + "\n";

    input.value = "";
    input.focus();
  } else {
    console.log("まだ接続されていません");
  }
}

function connect() {
  let reconnectDelay = 1000;
  const maxDelay = 10000;
let userName = nameInput.value;  // とりあえず固定
  ws = new WebSocket("wss://mail.shudo-physics.com:35000");

  ws.onopen = () => {
    console.log("接続完了");
    box.textContent += "接続されました\n";

    reconnectDelay = 1000;

    const joinMsg = {
      type: "join",
      name: userName,
      room: room,
    };

    ws.send(JSON.stringify(joinMsg));
    console.log("送信:", JSON.stringify(joinMsg));
  };

  ws.onmessage = async (event) => {
    let raw: string;

    // Blob 対策：Blobならテキストに変換
    if (event.data instanceof Blob) {
      raw = await event.data.text();
    } else {
      raw = event.data as string;
    }

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSONパースエラー:", e, raw);
      return;
    }

    if (data.room !== room) return;

    if (data.type === "join") {
      box.textContent += `"${data.name}"さんが参加しました\n`;
    } else if (data.type === "leave") {
      box.textContent += `"${data.name}"さんが退出しました\n`;
    } else if (data.type === "msg") {
      box.textContent += `${data.name}: ${data.text}\n`;
    }

    console.log("受信:", data);
  };

  ws.onerror = () => {
    console.log("エラー → 再接続予定");
  };

  ws.onclose = () => {
    console.log("接続が切れました");
    box.textContent += "切断されました。再接続します...\n";

    setTimeout(() => {
      console.log("再接続中...");
      connect();
    }, reconnectDelay);

    reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
  };
}

function setupSendEvents() {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      void sendMessage();
    }
  });

  button.onclick = () => {
    void sendMessage();
  };
}

console.log("平文チャットモードで起動");

// ======== UI ========
const roomdiv = document.createElement("div");
const nameInput = document.createElement("input");
nameInput.placeholder = "ユーザー名を入力";
const roomInput = document.createElement("input");
roomInput.placeholder = "部屋名を入力";

const roomButton = document.createElement("button");
roomButton.textContent = "入室";
roomdiv.appendChild(roomInput);
roomdiv.appendChild(document.createElement("br"));
roomdiv.appendChild(document.createElement("br"));
roomdiv.appendChild(nameInput);
roomdiv.appendChild(document.createElement("br"));
roomdiv.appendChild(document.createElement("br"));
roomdiv.appendChild(roomButton);

document.body.appendChild(roomdiv);

const box = document.createElement("div");
box.style.width = "800px";
box.style.height = "600px";
box.style.border = "1px solid black";
box.style.overflowY = "scroll";
box.style.whiteSpace = "pre-wrap";

const input = document.createElement("input");
input.placeholder = "メッセージを入力";

const button = document.createElement("button");
button.textContent = "送信";

roomButton.onclick = () => {
  room = roomInput.value || "default";


  roomdiv.style.display = "none";

  document.body.appendChild(box);
  document.body.appendChild(input);
  document.body.appendChild(button);

  smain();
};
