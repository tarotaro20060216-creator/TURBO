const assert = require('assert');
const { parse, findMyStatus } = require('../parser.js');
const today = new Date(2026, 8, 25);

const a = `【練習日程】
10/1 21-23
遅刻：のん
やること Break①,Girls①,Lock①,punkin①

10/9 21-23
欠席:かえで
遅刻:あいな、なな
やること Lock②,Break②,jazz①,pop①

11/10 18-20
構成

11/19 21-23
遅刻:すずか
通し`;
const ea = parse(a, { today });
assert.strictEqual(ea.length, 4);
assert.strictEqual(ea[0].start, '2026-10-01T21:00:00+09:00');
assert.strictEqual(ea[0].end, '2026-10-01T23:00:00+09:00');
assert.deepStrictEqual(ea[1].notes, ['欠席:かえで', '遅刻:あいな、なな', 'やること Lock②,Break②,jazz①,pop①']);
assert.strictEqual(ea[2].start, '2026-11-10T18:00:00+09:00');
assert.strictEqual(findMyStatus(ea[1], 'なな'), '遅刻');
assert.strictEqual(findMyStatus(ea[0], 'なな'), null);

const b = `【練習日程】
全７回、毎週日曜11:00~14:00です！（10/11のみ12:00~14:00）

①10/4 11-14 @スペースコウヨウB1ホール
②10/11 ⚠12-14 @ちぇりひろ
⑥11/8 11-14 @D-PARKS国立谷保
⑦11/15 11-14 @ちぇりひろ

欠席、早退、遅刻あれば早めにコメントお願いします!!!!!`;
const eb = parse(b, { today });
assert.strictEqual(eb.length, 4);
assert.strictEqual(eb[0].place, 'スペースコウヨウB1ホール');
assert.strictEqual(eb[1].start, '2026-10-11T12:00:00+09:00');
assert.strictEqual(eb[1].warning, true);
assert.deepStrictEqual(eb[1].notes, []);
assert.strictEqual(eb[3].date, '2026-11-15');

const c = parse('1/10(土) 23:00〜1:00\n場所: 渋谷', { today });
assert.strictEqual(c[0].year, 2027);
assert.strictEqual(c[0].end, '2027-01-11T01:00:00+09:00');
assert.strictEqual(c[0].place, '渋谷');
assert.strictEqual(parse('12/24 本番', { today })[0].allDay, true);
const k = `【練習日程】

1️⃣ 10/3 14-17 @STUDIOFLAG 高田馬場
→ファスユニ
2️⃣ 10/10 14-17 @ソニズ東高円寺F
→ラスユニ
5️⃣ 10/31 14-17 @スパイラル2F
→パート・構成

6️⃣ 11/7 14-17 @スパイラル3F
→構成・通し
🔟 11/28 14-17 @スパイラル3F

欠席、早退、遅刻あれば早めにコメントお願いします📝 （当日の連絡はグループに！）`;
const ek = parse(k, { today });
assert.strictEqual(ek.length, 5);
assert.strictEqual(ek[0].start, '2026-10-03T14:00:00+09:00');
assert.strictEqual(ek[0].end, '2026-10-03T17:00:00+09:00');
assert.strictEqual(ek[0].place, 'STUDIOFLAG 高田馬場');
assert.deepStrictEqual(ek[0].notes, ['ファスユニ']);
assert.deepStrictEqual(ek[2].notes, ['パート・構成']);
assert.strictEqual(ek[3].date, '2026-11-07');
assert.strictEqual(ek[4].date, '2026-11-28');
assert.deepStrictEqual(ek[4].notes, []);

for (const line of ['第3回 10/3 14-17', '【10/3】14-17', '3. 10/3 14-17', '▶10/3 14-17', '#️⃣10/3 14-17']) {
  const e = parse(line, { today });
  assert.strictEqual(e.length, 1, line);
  assert.strictEqual(e[0].start, '2026-10-03T14:00:00+09:00', line);
}
const m = `【練習日程】
全体練除いて全14回
時間は全て18:00-20:00です！
欠席遅刻連絡はコメントへ！

9/21(月)	@チェリひろ
9/28(月)@チェリひろ
10/26(月) @未定
11/20(金) @未定、一橋祭前日なので無いかも。
11/27(金) @未定

11/28か29にリハ

11/30(月) @未定

12/4(金)にラスリハ`;
const em2 = parse(m, { today });
assert.strictEqual(em2.length, 8);
assert.strictEqual(em2[0].start, '2026-09-21T18:00:00+09:00');
assert.strictEqual(em2[0].end, '2026-09-21T20:00:00+09:00');
assert.strictEqual(em2[0].place, 'チェリひろ');
assert.strictEqual(em2[0].commonTime, true);
assert.strictEqual(em2[2].place, '');
assert.strictEqual(em2[2].placeTbd, true);
assert.strictEqual(em2[2].allDay, false);
assert.deepStrictEqual(em2[3].notes, ['一橋祭前日なので無いかも。']);
assert.strictEqual(em2[3].maybeOff, true);
assert.strictEqual(em2[5].tentative, true);
assert.strictEqual(em2[5].label, 'リハ');
assert.strictEqual(em2[5].allDay, true);
assert.strictEqual(em2[6].start, '2026-11-30T18:00:00+09:00');
assert.strictEqual(em2[7].label, 'ラスリハ');
assert.strictEqual(em2[7].allDay, true);

// 「10/11のみ」の時間が共通の時間より優先される
const o = parse('全７回、毎週日曜11:00~14:00です！（10/11のみ12:00~14:00）\n\n①10/4 @A\n②10/11 @B', { today });
assert.strictEqual(o.length, 2);
assert.strictEqual(o[0].start, '2026-10-04T11:00:00+09:00');
assert.strictEqual(o[1].start, '2026-10-11T12:00:00+09:00');
const o2 = parse('毎週日曜11-14\n（10/11のみ12-14）\n\n10/11 @B', { today });
assert.strictEqual(o2.length, 1);
assert.strictEqual(o2[0].start, '2026-10-11T12:00:00+09:00');
console.log('ok');
