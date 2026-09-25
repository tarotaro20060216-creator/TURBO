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
console.log('ok');
