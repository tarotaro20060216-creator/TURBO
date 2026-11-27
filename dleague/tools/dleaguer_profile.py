#!/usr/bin/env python3
"""D.LEAGUE 公式サイトの選手データから、公式プロフィールのURLと本人のInstagramを探す。

使い方:
  python3 dleague/tools/dleaguer_profile.py "KADOKAWA DREAMS" "KELO"
  python3 dleague/tools/dleaguer_profile.py "KADOKAWA DREAMS"        # チーム全員を一覧

出力は1行1件の JSON: {"team","number","name","role","profileUrl","instagram"}
instagram は公式サイトの選手データに載っている本人のリンク（なければ null）。
公式サイトのページが読み込んでいる JSON（/data/teams/<season>/...）を直接読む。
"""
import json
import sys
import unicodedata
import urllib.request

BASE = "https://home.dleague.co.jp"
SEASON = "26-27"


def get(path):
    req = urllib.request.Request(f"{BASE}/{path}", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def norm(s):
    s = unicodedata.normalize("NFKC", str(s or "")).lower()
    return "".join(ch for ch in s if ch.isalnum())


def members(team_id):
    rows = []
    for m in get(f"data/teams/{SEASON}/{team_id}/members/index.json"):
        name = m.get("dancer_name") or (m.get("name") or "").split("　")[-1]
        ig = ((m.get("sns") or {}).get("instagram") or {}).get("follow") or None
        if ig:
            ig = ig.replace("http://", "https://").split("?")[0]
        rows.append({
            "number": m.get("uniform_number"),
            "name": name,
            "type": m.get("type"),
            "member_id": m.get("member_id"),
            "detail": m.get("detail_flag"),
            "instagram": ig,
        })
    return rows


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    team, dancer = argv[0], (argv[1] if len(argv) > 1 else None)
    teams = get(f"data/teams/{SEASON}/index.json")
    hit = next((t for t in teams if norm(t["name"]) == norm(team)), None) or \
        next((t for t in teams if norm(team) in norm(t["name"])), None)
    if not hit:
        print(f"team not found: {team}", file=sys.stderr)
        return 1
    rows = []
    for m in members(hit["team_id"]):
        if dancer and norm(m["name"]) != norm(dancer):
            continue
        # every dancer row (type 0) has a profile page; staff rows (type 1) do not
        url = f"{BASE}/teams/{hit['team_id']}/dancers/{m['member_id']}/" if m["type"] == 0 else None
        rows.append({"team": hit["name"], "number": m["number"], "name": m["name"],
                     "role": "staff" if m["type"] == 1 else "dancer", "profileUrl": url, "instagram": m["instagram"]})
    if dancer:
        if not rows:
            print(f"dancer not found: {dancer}", file=sys.stderr)
            return 1
        # the same person can be listed twice (e.g. staff and dancer rows): merge them
        best = next((r for r in rows if r["profileUrl"]), rows[0])
        best = dict(best)
        best["instagram"] = best["instagram"] or next((r["instagram"] for r in rows if r["instagram"]), None)
        best["number"] = best["number"] if best["number"] is not None else next((r["number"] for r in rows if r["number"] is not None), None)
        rows = [best]
    for r in rows:
        print(json.dumps(r, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
