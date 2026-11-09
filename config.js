// 公開ページ（GitHub Pages）で使う設定。
// googleClientId に Google Cloud の OAuth クライアントID（ウェブアプリケーション）を入れると、
// 公開ページでも Google にログインして、まとめて登録・ダブルブッキング確認・色指定が使えるようになる。
// 空のままなら .ics ファイルで追加する方式になる。claude.ai 上ではこの設定は使わない。
//
// firebase には、日程調整ページ（chousei.html）の回答の保存先にする Firebase の設定を入れる。
// Firebase コンソールの「プロジェクトの設定 → マイアプリ」に出る firebaseConfig をそのまま貼る（公開しても問題ない値）。
// 空（null）のままだと、回答はその端末にだけ保存される「お試しモード」になる。
window.PRACTICE_CONFIG = {
  googleClientId: '',
  firebase: null,
  // 例:
  // firebase: {
  //   apiKey: 'AIza...',
  //   authDomain: 'your-project.firebaseapp.com',
  //   projectId: 'your-project',
  //   storageBucket: 'your-project.appspot.com',
  //   messagingSenderId: '1234567890',
  //   appId: '1:1234567890:web:abcdef',
  // },
};
