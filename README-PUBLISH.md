# 港区ミニ配送オペレーター 公開メモ

このフォルダをそのまま静的サイトとして公開できます。

## ネット公開に必要なもの

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`
- `service-worker.js`
- `icon.svg`

## おすすめ公開先

- Netlify: ZIPをドラッグ&ドロップで公開
- Vercel: Static Project として公開
- GitHub Pages: リポジトリに置いて Pages を有効化

## いちばん簡単な公開手順 Netlify

1. https://app.netlify.com/drop を開く
2. `keikamotsu-dispatch-app.zip` をドラッグ&ドロップする
3. 表示された `https://...netlify.app` のURLをコピーする
4. そのURLを使う人に送る
5. スマホで開いて「ホーム画面に追加」する

## スマホアプリ風に使う条件

カメラ・音声入力・ホーム画面追加は、基本的に `https://` で公開したURLが必要です。

公開後、スマホのブラウザで開いて「ホーム画面に追加」を選ぶと、アプリ風に起動できます。

## 注意

`http://127.0.0.1:49217` や `file://...` は、このMacだけで見るためのURLです。ほかの人には共有できません。
