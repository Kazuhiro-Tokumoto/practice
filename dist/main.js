"use strict";
function add2(a, b, c) {
    // デフォルトは「不正な操作」の意味で NaN
    let answer = NaN;
    if (c === 1) {
        answer = a + b;
    }
    else if (c === 2) {
        answer = a - b;
    }
    else if (c === 3) {
        answer = a * b;
    }
    else if (c === 4) {
        answer = a / b;
    }
    else if (c === 5) {
        answer = a % b;
    }
    return answer;
}
console.log(add2(10, 5, 1)); // 15
console.log(add2(10, 5, 2));
console.log(add2(10, 5, 3));
console.log(add2(10, 5, 4));
console.log(add2(10, 5, 5));
console.log(add2(10, 5, 6)); // -> NaN（どの if にも入らない）
// ======================================
// ブラウザ(index.html)から使うためのコード
// ======================================
// index.html から呼ぶための関数
function handleCalcButtonClick() {
    // HTML 側の input 要素から値を読む
    const aInput = document.getElementById("input-a");
    const bInput = document.getElementById("input-b");
    const cInput = document.getElementById("input-c");
    const resultSpan = document.getElementById("result");
    if (!aInput || !bInput || !cInput || !resultSpan) {
        console.error("必要な要素が見つかりませんでした。");
        return;
    }
    const a = Number(aInput.value);
    const b = Number(bInput.value);
    const c = Number(cInput.value);
    if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c)) {
        resultSpan.textContent = "a, b, c には数値を入力してください。";
        return;
    }
    const result = add2(a, b, c);
    resultSpan.textContent = `結果: ${result}`;
}
window.handleCalcButtonClick = handleCalcButtonClick;
