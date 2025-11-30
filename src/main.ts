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

let message: string = "これは TypeScript の message だぜぇ";
//           ^^^^^^ ここが「型」

console.log("message:", message);

// number 型（数値）
let age: number = 20;
console.log("age:", age);

// boolean 型（真偽値）: true か false
let isAdult: boolean = age >= 18;
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
} else {
  console.log("未成年です。");
}

// age の値を変えると結果が変わる
// 例: let age: number = 16; にすると、isAdult が false になり「未成年です。」

// else if で条件を増やす
if (age >= 20) {
  console.log("20歳以上なので、お酒OKです。");
} else if (age >= 18) {
  console.log("18歳以上20歳未満なので、大人だけどお酒NGです。");
} else {
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
let jsStyleValue = "文字からスタート";
// jsStyleValue = 999; // ← JS 的には OK だが、何が入っているか分かりにくい

// TypeScript 風（型を書く）
let tsStyleValue: string = "文字からスタート（TS風）";
// tsStyleValue = 999; // ← これは TS がコンパイルエラーにして止めてくれる

console.log("jsStyleValue:", jsStyleValue);
console.log("tsStyleValue:", tsStyleValue);


/*------------------------------------------------------
 * 第4章 const と型推論
 *  - const でも型を付けられる
 *  - 右辺から型を「推論」してくれる
 *-----------------------------------------------------*/

const userName: string = "Tokum"; // 明示的に string を指定
console.log("userName:", userName);

// 型推論（型を書かなくても、string と推論される例）
const nickName = "トクム";
// ↑ これは自動的に string 型として扱われる。
//   VS Code で nickName にカーソルを当てると、型ヒントが見えるはず。

console.log("nickName:", nickName);


/*------------------------------------------------------
 * 第5章 テンプレートリテラル
 *  - 文字列の中に変数を埋め込みやすい書き方
 *-----------------------------------------------------*/

// バッククォート ` ... ` で囲んで、${変数} で埋め込む
const profile: string = `名前は ${userName}（${nickName}）、年齢は ${age} 歳です。`;
console.log(profile);

// ※ 普通の "..." + "..." 連結より読みやすいので、現代JS/TSの定番。


/*------------------------------------------------------
 * 第6章 関数と型
 *  - 引数と戻り値に型を付ける
 *-----------------------------------------------------*/

// 形式:
//   function 関数名(引数名: 型, 引数名: 型): 戻り値の型 { ... }

function add(a: number, b: number): number {
  // a と b は number 型なので、間違って文字列を渡すとコンパイルエラーになる
  return a + b;
}

const sum: number = add(5, 7);
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
let jsLikeValue: any = "最初は文字列";
// ↑ any 型にすると「なんでもアリ」になる（= JS に近い危険モード)

jsLikeValue = 123;        // 数字を入れてもOK
jsLikeValue = false;      // true / false を入れてもOK
console.log("jsLikeValue:", jsLikeValue);

// TypeScript らしく「型を決めておく」と、ミスを早めに止めてくれる：
let strictValue: number = 10;
// strictValue = "文字"; // ← コメントを外して tsc するとコンパイルエラーになる

console.log("strictValue:", strictValue);

/* ポイント:
 *  - any を多用すると「TS なのに型チェックが効かない」状態になる
 *  - まずは string / number / boolean / 自作の型 を使っていくのがおすすめ
 */


/*------------------------------------------------------
 * 第8章 TS で書いても最終的には JS になる
 *-----------------------------------------------------*/

// このファイル(main.ts)に書いたコードは、tsc すると main.js に変換される。
// その main.js は、普通の JavaScript として Node.js やブラウザで実行されるだけ。
//
// つまり：
//
//   書くとき   -> TypeScript（型付きで安全に書く）
//   動かすとき -> JavaScript（型情報は消える）
//
// という 2 段階になっているだけ、というイメージで OK。


/*------------------------------------------------------
 * 第9章 オブジェクトに型をつける
 *  - 「1人のユーザー情報」などを1つの型にまとめる
 *-----------------------------------------------------*/

// User という「型」を定義する（オブジェクトの形）
type User = {
  name: string;      // ユーザー名は文字列
  age: number;       // 年齢は数値
  isAdult: boolean;  // 大人かどうか
};

// その型を使って変数を宣言
const user: User = {
  name: "Tokum",
  age: 20,
  isAdult: true,
};

console.log("user:", user);
console.log(`ユーザー名: ${user.name}, 年齢: ${user.age}, 大人フラグ: ${user.isAdult}`);

// 間違った型を入れようとするとエラーになる例：
//
// const badUser: User = {
//   name: 123,        // ← 本当は string が必要
//   age: "20",        // ← 本当は number が必要
//   isAdult: "true",  // ← 本当は boolean が必要
// };
//
// tsc main.ts をすると、各プロパティごとに「型違うよ」と怒られる。


/*------------------------------------------------------
 * 第10章 この先に進むとしたら
 *-----------------------------------------------------*/
/*
ここから先で扱いたい「TS の全部（基礎）」の候補:
  - 配列とタプル: number[] / string[] / [string, number] など
  - ユニオン型: string | number みたいな「どちらか」の型
  - 型エイリアスの活用: type ID = number | string; など
  - インターフェース: interface User {...}
  - クラス: class User { ... } とコンストラクタ・メソッド
  - 非同期処理: Promise / async/await
  - ジェネリクス: Array<T> / Promise<T> など
次にどれからやるか 1 個決めてくれれば、
  「第11章 配列と for 文」みたいに、このファイルの下に追記していく。
*/


/*------------------------------------------------------
 * 第11章 インターフェース (interface)
 *  - type とほぼ同じ「オブジェクトの型」の書き方
 *  - C++ の struct にかなり近いイメージ
 *-----------------------------------------------------*/

// これまでの User（type 版）
// type User = {
//   name: string;
//   age: number;
//   isAdult: boolean;
// };

// interface 版（書き方が少し違うだけで、意味はほぼ同じ）
interface UserLike {
  name: string;
  age: number;
  isAdult: boolean;
}

// interface を使って変数を宣言
const user2: UserLike = {
  name: "Interface太郎",
  age: 30,
  isAdult: true,
};

console.log("user2:", user2);
console.log(`(interface) ユーザー名: ${user2.name}, 年齢: ${user2.age}, 大人フラグ: ${user2.isAdult}`);

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
 
/*------------------------------------------------------
 * 第12章 配列と for 文
 *  - number[] / string[] などの配列型
 *  - for / for-of で配列を回す
 *-----------------------------------------------------*/

// number の配列
const scores: number[] = [80, 90, 75];
console.log("scores:", scores);

// string の配列
const fruits: string[] = ["apple", "banana", "orange"];
console.log("fruits:", fruits);

// ふつうの for 文で回す
for (let i = 0; i < scores.length; i++) {
  console.log(`scores[${i}] = ${scores[i]}`);
}

// for-of で「要素だけ」取り出す
for (const fruit of fruits) {
  console.log("fruit:", fruit);
}

/*
練習アイデア:
  - 自分の好きなゲームタイトルを string[] で作って、
    for-of で1つずつ表示してみる。
  - number[] の配列を作って、合計値・平均値を計算する関数を作ってみる。
*/

/*------------------------------------------------------
 * 第13章 ユニオン型 (union type)
 *  - string | number のように「どちらか」の型を表現
 *-----------------------------------------------------*/

// string か number のどちらかを受け取る ID
type ID = string | number;

function printId(id: ID): void {
  // typeof で中身を見て分岐するのが定番
  if (typeof id === "string") {
    console.log("ID (string):", id.toUpperCase());
  } else {
    console.log("ID (number):", id.toFixed(2));
  }
}

printId("user-123");
printId(456);

// 練習: boolean も許す IDLike = string | number | boolean を作ってみる


/*------------------------------------------------------
 * 第14章 型エイリアスの活用
 *  - ユニオン型や複雑な型に「名前」を付ける
 *-----------------------------------------------------*/

// 「成功」か「失敗」かを表す Result 型
type SuccessResult = {
  success: true;
  value: number;
};

type ErrorResult = {
  success: false;
  errorMessage: string;
};

type Result = SuccessResult | ErrorResult;

function divide(a: number, b: number): Result {
  if (b === 0) {
    return {
      success: false,
      errorMessage: "0 で割ることはできません。",
    };
  }
  return {
    success: true,
    value: a / b,
  };
}

const r1 = divide(10, 2);
const r2 = divide(10, 0);

function printResult(result: Result): void {
  if (result.success) {
    // SuccessResult と確定するので value が安全に使える
    console.log("割り算の結果:", result.value);
  } else {
    console.log("エラー:", result.errorMessage);
  }
}

printResult(r1);
printResult(r2);

/*
この先の候補（順番の一例）:
  - 第15章 タプル ([string, number] など)
  - 第16章 クラスとコンストラクタ / メソッド
  - 第17章 非同期処理 (Promise / async/await)
  - 第18章 ジェネリクス (Array<T>, Promise<T> など)
気になるものから 1 つ言ってくれれば、その章をここに続けて書いていく。
*/

/*------------------------------------------------------
 * 第15章 タプル (tuple)
 *  - [string, number] のように「順番」と「長さ」が決まった配列
 *-----------------------------------------------------*/

// 「ユーザー名と年齢」を 1 セットで表すタプル
type UserTuple = [string, number];

const userTuple1: UserTuple = ["Tokum", 20];
console.log("userTuple1:", userTuple1);
console.log(`名前: ${userTuple1[0]}, 年齢: ${userTuple1[1]}`);

// ↓ 型が合わないとエラーになる例（試すときだけコメントアウトを外す）
// const badUserTuple: UserTuple = [20, "Tokum"]; // 順番が逆なのでエラー
// const badUserTuple2: UserTuple = ["Tokum"];    // 要素数が足りないのでエラー

// タプルの配列: ユーザーをたくさん持つ
const userList: UserTuple[] = [
  ["Alice", 18],
  ["Bob", 25],
  ["Carol", 30],
];

for (const [name, age] of userList) {
  // 分割代入で name, age をそれぞれ取り出す
  console.log(`(tuple) 名前: ${name}, 年齢: ${age}`);
}

/*
練習アイデア:
  - [string, number, boolean] で「名前・年齢・大人フラグ」のタプルを作る。
  - そのタプルの配列を作って、for-of + 分割代入で全部表示してみる。
*/
