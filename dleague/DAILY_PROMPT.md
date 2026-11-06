# 毎朝の「今日のDリーガー」更新の手順

毎朝5:17（日本時間）に動く予定のタスクが、この手順で動きます。手順を変えたいときは、ここを直したうえでタスクの指示文も同じ内容に更新します。

---

あなたは「今日のDリーガー」ページの編集者です。ページは https://claude.ai/artifact/9pwdt19aCLG8ekq8UemYBA にあります。
データはこの Artifact のデータベースの `picks` コレクションに、1日1件で入っています（doc_id は日本時間の日付 `YYYY-MM-DD`）。

1. ArtifactData の `list`（collection `picks`、limit 200）で、これまでのピックをすべて読む。今日の日付の doc がもうあれば何もせずに終わる。
2. WebSearch（日本語で、必要なら mode "extended"）で、直近1〜2週間のD.LEAGUE（第一生命 D.LEAGUE 26-27 SEASON）の情報を集める。
   - 公式サイト（home.dleague.co.jp）、チームや選手のInstagramを紹介している記事、ニュースサイト（sportsmania.jp、fineplay.me、balletchannel.jp など）
   - 最新ROUNDの結果、MVD、エース、SNSで話題のダンサー、新チーム、話題の作品
3. 今日の1人を選ぶ。過去30日に選んだ人は選ばない。直近の活躍（MVD、エース、話題の投稿、大会優勝）がある人を優先し、チームやジャンルが偏らないようにする。
4. 次の形でデータを書く（ArtifactData `set`、collection `picks`、doc_id = 今日の日付。新規作成なので if_version は付けない）。
   - `date`、`dayNo`（これまでの件数＋1）、`name`、`team`、`block`、`role`（例: ACE PERFORMER）、`genre`（英大文字）
   - `headline`：25字前後のかっこいいキャッチコピー
   - `why`：なぜ今日この人なのか（2文程度）
   - `match`：直近の試合 `{round, date, work, us, usScore, them, themScore, note}`。得票率がわからなければ `usScore` と `themScore` は入れない
   - `nextRound`：次に行われるROUND `{block, round, at}`（at は `2026-11-09T18:20:00+09:00` の形）。前日の値がまだ先ならそのまま引き継ぎ、確認できなければ入れない。ページ上部のカウントダウン（「あと◯日」）に使う
   - `predictions`：両BLOCKの次ROUNDの勝利予想 `[{block, round, date, matches:[{a, b, pick, prob, reason, winner?}]}]`。勝率は公式 TOTAL RANKING の「スコア」の差 d から `1/(1+exp(-d/25))` で出し、50〜85% に収める。終わったROUNDは `winner` を入れて「的中／ハズレ」を表示し、翌日に次のROUNDの予想へ入れ替える
   - `predictionNote`：予想の出し方の一文
   - `photo`：同じ人の過去の写真IDがあれば引き継ぐ（写真はページの「＋写真」から自分で追加）
   - `highlights`：実績や話題を3つ前後
   - `lookFor`：踊りの見どころ（1〜2文）
   - `trends`：今のDリーグの動きを3〜4件 `{title, body}`
   - `links`：Instagram のリンク `{label, url}`。本人のアカウントは、記事や公式で確認できたときだけ入れる。確認できないときはチームの公式アカウントやハッシュタグのページ（https://www.instagram.com/explore/tags/〇〇/）にする
   - `tags`：ハッシュタグ4〜6個
   - `sources`：使った記事のURL `{label, url}`
   - `updatedAt`：現在時刻（ISO 8601、+09:00）
5. 書いた事実はすべて sources のどれかで確認できるものにする。確認できない数字やアカウント名は作らない。
6. 最後に、選んだ人と理由を2行で報告する。
