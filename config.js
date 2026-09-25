// 公開ページ（GitHub Pages）で使う設定。
// googleClientId に Google Cloud の OAuth クライアントID（ウェブアプリケーション）を入れると、
// 公開ページでも Google にログインして、まとめて登録・ダブルブッキング確認・色指定が使えるようになる。
// 空のままなら .ics ファイルで追加する方式になる。claude.ai 上ではこの設定は使わない。
window.PRACTICE_CONFIG = {
  googleClientId: '',
};
