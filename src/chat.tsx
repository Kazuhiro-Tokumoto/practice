import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatApp from './ChatApp'; // 拡張子は .tsx や .jsx 省略可

// 1. Reactを描画するための場所(div)を作るか、取得する
let container = document.getElementById('root');

// もしHTMLに <div id="root"></div> がない場合、勝手に作る（前のmain()と同じ挙動にするため）
if (!container) {
  container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);
}

// 2. Reactを起動して、ChatAppを表示する
const root = createRoot(container);
root.render(<ChatApp />);

//main();

//geminiは神なので使う　めちゃくちゃ早いし説明早い　神