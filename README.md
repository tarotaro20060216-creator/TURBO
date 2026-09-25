# 練習日程かんたん登録

LINEノートなどで届く【練習日程】のテキストを貼り付けると、日付・時間・場所を読み取って
Googleカレンダーに登録できるページです。

- `10/1 21-23` / `①10/4 11-14 @場所` / `10月4日(日) 11:00〜14:00` などの形式に対応
- 日付の下にある「欠席:」「遅刻:」「やること」などの行は予定のメモに入ります
- 自分の名前を入れると、欠席・遅刻・早退の欄に自分が書かれている日に印が付きます
- claude.ai 上で開くと Google Calendar コネクタ経由でまとめて登録、普通のブラウザでは `.ics` をダウンロード

## 公開ページでGoogleカレンダーに直接登録する（任意）

`config.js` の `googleClientId` に Google Cloud の OAuth クライアントIDを入れると、
公開ページでも Google にログインして、まとめて登録・ダブルブッキング確認・色指定が使えます。

1. Google Cloud Console でプロジェクトを作り、Google Calendar API を有効にする
2. OAuth 同意画面（Google Auth Platform）を「外部」で作り、スコープ `.../auth/calendar.events` を追加して「本番環境」に公開する
3. 「ウェブアプリケーション」のクライアントを作り、承認済みの JavaScript 生成元に `https://tarotaro20060216-creator.github.io` を入れる
4. 表示されたクライアントIDを `config.js` に入れる（公開しても問題ない値）

Google の審査を受けるまでは、ログイン時に「このアプリはGoogleで確認されていません」と表示され、利用できる人数は100人までです。

## ファイル

- `index.html` — ページ本体
- `parser.js` — テキストを予定に変換する処理
- `config.js` — 公開ページ用の設定（Google のクライアントID）
- `test/parser.test.js` — `node test/parser.test.js` で実行
