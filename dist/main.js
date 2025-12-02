"use strict";
// add2 関数:
//   2つの数値 (a, b) と、どの演算をするかを表す番号 c を受け取る。
//   c の意味:
//     1: 足し算 (a + b)
//     2: 引き算 (a - b)
//     3: 掛け算 (a * b)
//     4: 割り算 (a / b)
//     5: 剰余   (a % b)
//   それ以外の c の値のときは NaN を返す。
function add2(a, b, c) {
    // デフォルトは「不正な操作」の意味で NaN
    // どの if にも入らなかった場合、この NaN がそのまま返る
    let answer = NaN;
    // c の値に応じて、実際に計算する内容を分けている
    if (c === 1) {
        // 1 のとき: 足し算
        answer = a + b;
    }
    else if (c === 2) {
        // 2 のとき: 引き算
        answer = a - b;
    }
    else if (c === 3) {
        // 3 のとき: 掛け算
        answer = a * b;
    }
    else if (c === 4) {
        // 4 のとき: 割り算
        answer = a / b;
    }
    else if (c === 5) {
        // 5 のとき: 剰余 (あまり)
        answer = a % b;
    }
    // 計算結果 answer を返す
    return answer;
}
// ここから下は、add2 がどう動くかをコンソールで確認するためのテストコード
console.log(add2(10, 5, 1)); // 15  (10 + 5)
console.log(add2(10, 5, 2)); // 5   (10 - 5)
console.log(add2(10, 5, 3)); // 50  (10 * 5)
console.log(add2(10, 5, 4)); // 2   (10 / 5)
console.log(add2(10, 5, 5)); // 0   (10 % 5)
console.log(add2(10, 5, 6)); // NaN (どの if にも入らないので NaN のまま)
// ===============================
// ここから HTML に行(要素)を追加する処理
// ===============================
// add2 関数はそのまま（省略）
// ===============================
// ここから HTML に行(要素)を追加する処理
// ===============================
const box = document.createElement("div");
box.id = "box";
// 最初の文字列
const result1 = document.createElement("p");
result1.textContent = add2(10, 5, 1).toString();
// 追加の行
const result2 = document.createElement("p");
result2.textContent = "4545したいよねぇ";
// box の中に追加
box.appendChild(result1);
box.appendChild(result2);
// ===============================
// ここから削除ボタンを追加する処理（TSだけ）
// ===============================
// 削除ボタンを作る
const btn = document.createElement("button");
btn.textContent = "削除";
// body に追加
box.appendChild(btn);
// ボタンが押されたら、box の中身を削除
btn.addEventListener("click", () => {
    // 最後の行を削除
    const last = box.lastElementChild;
    if (last) {
        last.remove(); // ← 完全に削除！
    }
});
// body に追加
document.body.appendChild(box);
