// ======================================================
// TypeScript 超入門 ～ main.ts を教科書にして全部覚える計画 ～
//
// 実行方法（このファイルがあるフォルダで）:
//   tsc main.ts   // TypeScript をコンパイルして main.js を作る
//   node main.js  // 生成された JavaScript を実行
// ======================================================
/*------------------------------------------------------
 * 第1章 基本の型と変数宣言
 *  - string / number / boolean
 *  - let / const
 *-----------------------------------------------------*/
// TypeScript の「型付き変数」
// 形式: let 変数名: 型 = 値;
var message = "これは TypeScript の message だぜぇ";
//        ^^^^^^ ここが「型」
console.log("message:", message);
// number 型（数値）
var age = 20;
console.log("age:", age);
// boolean 型（真偽値）: true か false
var isAdult = age >= 18;
console.log("isAdult:", isAdult);
/* ここまでで出てきたキーワードまとめ:
 *  - let        : あとで中身を変えられる変数
 *  - const      : 一度決めたら中身を変えない変数
 *  - string     : 文字列の型
 *  - number     : 数値の型（整数/小数 両方）
 *  - boolean    : true / false
 *  - : 型       : 変数や引数の右側に書く「型注釈」
 */
/*------------------------------------------------------
 * 第2章 条件分岐 if / else / else if
 *  - C/C++ とほぼ同じ書き方
 *-----------------------------------------------------*/
// boolean 型（true/false）をそのまま if に使う
if (isAdult) {
    console.log("大人です。");
}
else {
    console.log("未成年です。");
}
// age の値を変えると結果が変わる
// 例: let age: number = 16; にすると、isAdult が false になり「未成年です。」
// else if で条件を増やす
if (age >= 20) {
    console.log("20歳以上なので、お酒OKです。");
}
else if (age >= 18) {
    console.log("18歳以上20歳未満なので、大人だけどお酒NGです。");
}
else {
    console.log("18歳未満なので未成年です。");
}
/* 練習アイデア:
 *  - 年齢に応じて「映画料金」を変える if を書いてみる
 *    例: 0〜12歳: 子供料金, 13〜64歳: 一般料金, 65歳以上: シニア料金
 */
/*------------------------------------------------------
 * 第3章 型があると何がうれしいか
 *  - JS っぽい書き方 vs TS っぽい書き方
 *-----------------------------------------------------*/
// ↓ これは OK（string に string を代入）
message = "中身を別の文字列に変更";
// ↓ これはコンパイルエラーになる（number を string に入れようとしている）
// 実際にエラーを見てみたいときは、コメントを外して `tsc main.ts` してみて。
// message = 123; // エラー: Type 'number' is not assignable to type 'string'.
// --- JavaScript風 と TypeScript風 の比較 ----------------------
// JavaScript 風（型を書かない）
// TS でも動くけど、型チェックが弱くなる書き方
var jsStyleValue = "文字からスタート";
// jsStyleValue = 999; // ← JS 的には OK だが、何が入っているか分かりにくい
// TypeScript 風（型を書く）
var tsStyleValue = "文字からスタート（TS風）";
// tsStyleValue = 999; // ← これは TS がコンパイルエラーにして止めてくれる
console.log("jsStyleValue:", jsStyleValue);
console.log("tsStyleValue:", tsStyleValue);
/*------------------------------------------------------
 * 第4章 const と型推論
 *  - const でも型を付けられる
 *  - 右辺から型を「推論」してくれる
 *-----------------------------------------------------*/
var userName = "Tokum"; // 明示的に string を指定
console.log("userName:", userName);
// 型推論（型を書かなくても、string と推論される例）
var nickName = "トクム";
// ↑ これは自動的に string 型として扱われる。
//   VS Code で nickName にカーソルを当てると、型ヒントが見えるはず。
console.log("nickName:", nickName);
/*------------------------------------------------------
 * 第5章 テンプレートリテラル
 *  - 文字列の中に変数を埋め込みやすい書き方
 *-----------------------------------------------------*/
// バッククォート ` ... ` で囲んで、${変数} で埋め込む
var profile = "\u540D\u524D\u306F ".concat(userName, "\uFF08").concat(nickName, "\uFF09\u3001\u5E74\u9F62\u306F ").concat(age, " \u6B73\u3067\u3059\u3002");
console.log(profile);
// ※ 普通の "..." + "..." 連結より読みやすいので、現代JS/TSの定番。
/*------------------------------------------------------
 * 第6章 関数と型
 *  - 引数と戻り値に型を付ける
 *-----------------------------------------------------*/
// 形式:
//   function 関数名(引数名: 型, 引数名: 型): 戻り値の型 { ... }
function add(a, b) {
    // a と b は number 型なので、間違って文字列を渡すとコンパイルエラーになる
    return a + b;
}
var sum = add(5, 7);
console.log("5 + 7 =", sum);
// ↓ これはエラーになる例（試したい時だけコメントを外して tsc してみる）
//
// const badSum = add("5", 7);
// console.log("badSum:", badSum);
//
// エラー: Argument of type 'string' is not assignable to parameter of type 'number'.
/*------------------------------------------------------
 * 第7章 any と安全な型
 *  - any は「なんでもアリ」= できるだけ避ける
 *-----------------------------------------------------*/
// JavaScript 的に「なんでもアリ」にしたい時に any が使えるが、危険。
var jsLikeValue = "最初は文字列";
// ↑ any 型にすると「なんでもアリ」になる（= JS に近い危険モード)
jsLikeValue = 123; // 数字を入れてもOK
jsLikeValue = false; // true / false を入れてもOK
console.log("jsLikeValue:", jsLikeValue);
// TypeScript らしく「型を決めておく」と、ミスを早めに止めてくれる：
var strictValue = 10;
// strictValue = "文字"; // ← コメントを外して tsc するとコンパイルエラーになる
console.log("strictValue:", strictValue);
// その型を使って変数を宣言
var user = {
    name: "Tokum",
    age: 20,
    isAdult: true,
};
console.log("user:", user);
console.log("\u30E6\u30FC\u30B6\u30FC\u540D: ".concat(user.name, ", \u5E74\u9F62: ").concat(user.age, ", \u5927\u4EBA\u30D5\u30E9\u30B0: ").concat(user.isAdult));
// interface を使って変数を宣言
var user2 = {
    name: "Interface太郎",
    age: 30,
    isAdult: true,
};
console.log("user2:", user2);
console.log("(interface) \u30E6\u30FC\u30B6\u30FC\u540D: ".concat(user2.name, ", \u5E74\u9F62: ").concat(user2.age, ", \u5927\u4EBA\u30D5\u30E9\u30B0: ").concat(user2.isAdult));
/* type と interface のざっくり違い（今はこれだけでOK）:
 *
 *  - どっちも「オブジェクトの形」を表現できる
 *
 *  - ざっくり使い分けイメージ:
 *      type       : なんでも作れる「別名」（オブジェクト型だけじゃなくユニオン型とかにも使う）
 *      interface  : 主に「オブジェクトの形」を表すのに使う
 *
 *  - 実務では:
 *      - interface をクラスの「設計図」にしたり
 *      - ライブラリ側が interface を公開している
 *    ので、interface の見た目に慣れておくと読みやすくなる。
 */
/* ちょっとした練習:
 *  1. 自分用のインターフェースを作ってみる:
 *
 *     interface MyProfile {
 *       name: string;
 *       age: number;
 *       likeTs: boolean;
 *     }
 *
 *     const me: MyProfile = {
 *       name: "自分の名前",
 *       age: 99,
 *       likeTs: true,
 *     };
 *
 *  2. age を文字列にしてみて、tsc でエラー内容を見てみる。
 *  3. プロパティ名をtypoしてみる（age → ag）と、TS がどう怒るかを見る。
 */
