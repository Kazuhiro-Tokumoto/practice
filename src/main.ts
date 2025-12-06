let ws: WebSocket;
ws = new WebSocket("wss://mail.shudo-physics.com:35000");
const names = "testuser";

//html要素の作成
  const input = document.createElement("input");
document.body.appendChild(input);
input.placeholder = "メッセージを入力";

  const button = document.createElement("button");
button.textContent = "送信";
document.body.appendChild(button);


// ここからwsのイベントやら送信やら　なんか受信はコンソール画面しかできないけどまだわからないのでよし

ws.onopen = () => {
  console.log("接続完了");
  ws.send(JSON.stringify({

     type: "join", 
     name: names, 

  }
));
}

button.onclick = () => {
  const text = input.value;
  if (ws.readyState === WebSocket.OPEN) {

    ws.onmessage = (event) => {
  console.log("受信:", event.data);
};

ws.onerror = (err) => {
  console.error("エラー:", err);
};

ws.onclose = () => {
  console.log("切断");
};

    ws.send(
      JSON.stringify({
        type: "msg",
        name: names,   
        text: text,  
      })
    );
    console.log("送信:", text);
  } else {
    console.log("まだ接続されていません");
  }
};

//暗号化できるようにしたいなぁ(´・ω・｀)<- なんかこいつVSコードの変換で出てきたんやが
//wssにもうしているけど、サーバー見れてるんだよなぁ
//↑だからRSAに挑戦したいんやが複数にん(3人以上)でやるときにどうするんやろなぁ
//あと名前入力しても反映されないんやが(´・ω・｀)
//あと接続完了したときに名前も送信したいんやが
//うん　これとるとかれー
// うんこ　れとるとかれー
//　うん　これ　とると　かれー　
