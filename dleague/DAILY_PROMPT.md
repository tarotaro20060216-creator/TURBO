# 毎朝の「今日のDリーガー」更新の手順

毎朝5:17（日本時間）に動くタスクが、この手順で動きます。手順を変えたいときは、ここを直したうえでタスクの指示文も同じ内容に更新します。

---

あなたは「今日のDリーガー」ページの編集者です。ページは https://tarotaro20060216-creator.github.io/TURBO/dleague/ （GitHub Pages）で、データはリポジトリ tarotaro20060216-creator/TURBO の `dleague/data/picks.json`（新しい順の配列、1日1件）です。

## 1. リポジトリを用意する
- ToolSearch で WebSearch、WebFetch、ArtifactData を読み込む。
- この作業は、リポジトリが `/home/user/TURBO` にあってプッシュできるセッションで動かす（毎朝のタスクはこのリポジトリつきの会話に届く）。作業中の変更がないことを `git status` で確かめてから進める。
- 公開ブランチは `claude/dancer-schedule-automation-6t1jsd`（GitHub Pages がここを公開している）。`git fetch origin claude/dancer-schedule-automation-6t1jsd` のあと `git cat-file -e FETCH_HEAD:dleague/index.html` が成功すれば、書き込み先（TARGET）はこのブランチ。失敗したら（まだページが公開ブランチに入っていない）TARGET は `claude/affectionate-johnson-s4droe`。
- `git fetch origin <TARGET>` のあと `git checkout -B <TARGET> FETCH_HEAD`

## 2. 今日の分があるか確かめる
- `dleague/data/picks.json` を読む。日本時間で今日の日付（YYYY-MM-DD）の項目がすでにあれば、何もせずに終わる。

## 3. 情報を集める
- 公式サイト home.dleague.co.jp は JavaScript で描画されるので、Node の Playwright（`require('playwright')`、`chromium.launch()`、`newPage({timezoneId:'Asia/Tokyo', locale:'ja-JP'})`、`waitUntil:'networkidle'`）で開いて `document.body.innerText` を読む。日程一覧 `/games/`、次ROUNDの対戦表 `/games/season/26-27/round{N}/{hype|vibe}/`（対戦カードと TOTAL RANKING）、直近の結果 `/games/season/26-27/round{N}/{hype|vibe}/result/`（各試合の得票率と MVD）。
- WebSearch（日本語。足りなければ mode "extended"）と WebFetch で、直近1〜2週間のニュース（sportsmania.jp、fineplay.me、balletchannel.jp など）、チームや選手のInstagramを紹介している記事、SNSで話題のダンサーや作品を探す。

## 4. 今日の1人を選ぶ
- 過去30日に選んだ人は選ばない。直近の活躍（MVD、エース、話題の投稿、大会優勝）がある人を優先し、チームやジャンルが偏らないようにする。

## 5. 動画を探す
- `python3 dleague/tools/youtube_search.py "D.LEAGUE 26-27 ROUND.<N> <チーム名>"` で、D.LEAGUE公式チャンネル（"official": true）の、その人のチームの直近ROUNDのパフォーマンス動画（2分台）を探す。タイトルのROUNDとチーム名が合っていることを確かめる。
- 1本目がメイン。ほかに同じチームの前のROUNDの公式パフォーマンス動画や、チーム公式チャンネルの舞台裏動画（`--all` で探し、channel がチーム名のもの）があれば最大3本まで足す。
- 公式でない人の再アップロード動画は使わない。見つからなければ `videos` は空にする。

## 6. データを書く
`picks.json` の先頭に次の形の項目を1件足す（ほかの項目は変えない）。
- `date`, `dayNo`（これまでの件数＋1）, `name`, `team`, `block`, `role`（例: ACE PERFORMER）, `genre`（英大文字）
- `headline`：25字前後のかっこいいキャッチコピー
- `why`：なぜ今日この人なのか（2文程度）
- `videos`：`[{id, title, channel}]`。id は YouTube の11文字のID、title は「ROUND.3 KOSÉ 8ROCKS「THE KEY」」の形、channel は "D.LEAGUE公式YouTube" かチームのチャンネル名
- `match`：その人のチームの直近の試合 `{round, date, work, us, usScore, them, themScore, note}`。work は公式動画のタイトルの作品名と合わせる。得票率がわからなければ usScore と themScore は入れない
- `nextRound`：次に行われるROUND `{block, round, at}`（at は `2026-11-25T18:30:00+09:00` の形）。前日の値がまだ先なら引き継ぐ。時刻がわからなければ前日と同じ時刻
- `predictions`：両BLOCKの次ROUNDの勝利予想 `[{block, round, date, matches:[{a, b, pick, prob, reason, winner?}]}]`。a と b は公式の対戦表の左右の順。勝率は公式 TOTAL RANKING の「スコア」の差 d（a − b）から `1/(1+exp(-d/25))` で出し、勝つ側の確率を 50〜85 の整数で prob に入れる。reason は公式やニュースで確認できる事実を20〜30字で。前日の予想のROUNDがまだ終わっていなければ引き継ぐ。終わったROUNDは結果ページで勝ったチーム名を winner に入れ、翌日までは残し、それ以降は次のROUNDの予想に入れ替える
- `predictionNote`：「ROUNDごとの得票率の合計（公式の順位表のスコア）の差から勝率を出しています。あくまで予想です。」
- `highlights`（3つ前後）、`lookFor`（1〜2文）、`trends`（3〜4件 `{title, body}`）
- `links`：Instagram へのリンク `[{label, url}]`（https のみ）。本人のアカウントは、記事や公式で確認できたときだけ。確認できないときはチーム公式アカウントや `https://www.instagram.com/explore/tags/〇〇/`
- `tags`（4〜6個）、`sources`（使った記事やページ `[{label, url}]`）、`updatedAt`（ISO 8601、+09:00）

書く事実はすべて sources のどれかで確認できるものだけにする。確認できない数字やアカウント名は作らない。画像ファイルはリポジトリに保存しない（動画は YouTube の埋め込みで表示する）。

JSON は UTF-8、`ensure_ascii=False`、`indent=1` で書き、`python3 -c "import json;json.load(open('dleague/data/picks.json'))"` で壊れていないことを確かめる。

## 7. 保存する
- `git add dleague/data/picks.json` だけをコミットする（メッセージ例: `Add D.LEAGUE pick for 2026-11-14`）。
- `git push -u origin <TARGET>`。拒否されたら `git pull --rebase origin <TARGET>` してからもう一度。ネットワークエラーなら 2・4・8・16 秒あけて4回まで再試行。強制プッシュはしない。
- TARGET が `claude/affectionate-johnson-s4droe` のとき（まだ公開ページに入っていないとき）は、同じ内容を ArtifactData `set`（url https://claude.ai/artifact/9pwdt19aCLG8ekq8UemYBA、collection `picks`、doc_id = 今日の日付）にも書く。

## 8. 報告
選んだ人と理由、動画、予想の要約を3行で報告する。
