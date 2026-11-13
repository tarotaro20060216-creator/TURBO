#!/usr/bin/env python3
"""YouTube を検索して、D.LEAGUE 公式チャンネルなどの動画を JSON で一覧にする。

使い方:
  python3 dleague/tools/youtube_search.py "D.LEAGUE 26-27 ROUND.3 KOSÉ 8ROCKS"
  python3 dleague/tools/youtube_search.py --all "calin waacking"   # 公式以外も出す

出力は1行1件の JSON: {"id", "title", "channel", "published", "length", "official"}
official は D.LEAGUE 公式チャンネル（チームとの共同投稿を含む）の動画なら true。
"""
import json
import re
import sys
import urllib.parse
import urllib.request

OFFICIAL = "【公式】D.LEAGUE"


def search(query):
    url = "https://www.youtube.com/results?" + urllib.parse.urlencode({"search_query": query, "hl": "ja", "gl": "JP"})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "ja-JP,ja;q=0.9"})
    with urllib.request.urlopen(req, timeout=30) as res:
        html = res.read().decode("utf-8", "replace")
    m = re.search(r"var ytInitialData = (\{.*?\});</script>", html)
    if not m:
        return []
    data = json.loads(m.group(1))
    out = []

    def walk(o):
        if isinstance(o, dict):
            v = o.get("videoRenderer")
            if v and v.get("videoId"):
                runs = v.get("ownerText", {}).get("runs") or [{}]
                channel = runs[0].get("text", "")
                out.append({
                    "id": v["videoId"],
                    "title": "".join(r.get("text", "") for r in v.get("title", {}).get("runs", [])),
                    "channel": channel,
                    "published": v.get("publishedTimeText", {}).get("simpleText", ""),
                    "length": v.get("lengthText", {}).get("simpleText", ""),
                    "official": channel.startswith(OFFICIAL),
                })
            for x in o.values():
                walk(x)
        elif isinstance(o, list):
            for x in o:
                walk(x)

    walk(data)
    seen, uniq = set(), []
    for v in out:
        if v["id"] not in seen:
            seen.add(v["id"])
            uniq.append(v)
    return uniq


def main(argv):
    show_all = "--all" in argv
    words = [a for a in argv if a != "--all"]
    if not words:
        print(__doc__)
        return 2
    for v in search(" ".join(words)):
        if show_all or v["official"]:
            print(json.dumps(v, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
