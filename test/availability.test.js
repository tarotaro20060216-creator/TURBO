const assert = require('assert');
const A = require('../availability.js');
const { parse, findMyStatus } = require('../parser.js');

assert.strictEqual(A.toMin('19:30'), 1170);
assert.strictEqual(A.hhmm(540), '09:00');
assert.strictEqual(A.fmt(540), '9:00');
assert.deepStrictEqual(A.mergeRanges([[600, 700], [690, 800], [900, 960], [800, 850]]), [[600, 850], [900, 960]]);
assert.strictEqual(A.parseRange('23:00-19:00'), null);

const event = { dates: ['2026-11-12', '2026-11-14', '2026-11-15'], dayStart: '09:00', dayEnd: '24:00', minMinutes: 120 };
const answers = [
  { name: 'のん', slots: { '2026-11-12': ['18:00-23:00'], '2026-11-14': ['10:00-17:00'], '2026-11-15': ['13:00-18:00'] } },
  { name: 'なな', slots: { '2026-11-12': ['19:00-24:00'], '2026-11-14': ['13:00-20:00'], '2026-11-15': ['10:00-12:00', '15:00-18:00'] } },
  { name: 'かえで', slots: { '2026-11-12': ['20:00-23:00'], '2026-11-14': ['09:00-15:00'] } },
];

// 区間分け
const segs = A.segments(answers, '2026-11-12', A.toMin('09:00'), A.toMin('24:00'));
assert.deepStrictEqual(segs.map((s) => [A.fmt(s.start), A.fmt(s.end), s.free.join('')]), [
  ['9:00', '18:00', ''], ['18:00', '19:00', '0'], ['19:00', '20:00', '01'],
  ['20:00', '23:00', '012'], ['23:00', '24:00', '1'],
]);

const c = A.candidates(event, answers);
const show = (x) => [x.date, A.fmt(x.start), A.fmt(x.end), x.missing.map((m) => m.name + ':' + m.kind).join()];
assert.deepStrictEqual(c.map(show), [
  // 全員OK（2時間以上）
  ['2026-11-12', '20:00', '23:00', ''],
  // 11/14 全員は13-15の2時間
  ['2026-11-14', '13:00', '15:00', ''],
  // かえで以外なら 19-23（かえでは20時から＝遅刻）
  ['2026-11-12', '19:00', '23:00', 'かえで:遅刻'],
  // なな以外なら 10-15（ななは13時から）
  ['2026-11-14', '10:00', '15:00', 'なな:遅刻'],
  // かえで以外なら 13-17（かえでは15時まで＝早退）
  ['2026-11-14', '13:00', '17:00', 'かえで:早退'],
  // 11/15 かえでは空きなし
  ['2026-11-15', '15:00', '18:00', 'かえで:欠席'],
]);

// 最低時間の上書き
assert.strictEqual(A.candidates(event, answers, { minMinutes: 240 }).filter((x) => !x.missing.length).length, 0);

// 1人だけでも動く
assert.deepStrictEqual(A.candidates(event, [answers[0]]).map(show)[0], ['2026-11-12', '18:00', '23:00', '']);
assert.deepStrictEqual(A.candidates(event, []), []);

// 練習日程テキストにして、既存のパーサーで読めること
const text = A.toPracticeText([c[5], c[2], c[1]]);
assert.strictEqual(text, '【練習日程】\n\n11/12(木) 19-23\n遅刻:かえで\n\n11/14(土) 13-15\n\n11/15(日) 15-18\n欠席:かえで');
const evs = parse(text, { today: new Date(2026, 10, 9) });
assert.strictEqual(evs.length, 3);
assert.strictEqual(evs[0].start, '2026-11-12T19:00:00+09:00');
assert.strictEqual(evs[1].end, '2026-11-14T15:00:00+09:00');
assert.strictEqual(findMyStatus(evs[0], 'かえで'), '遅刻');
assert.strictEqual(findMyStatus(evs[2], 'かえで'), '欠席');

// 30分刻みと24時まで
const t2 = A.toPracticeText([{ date: '2026-11-12', start: A.toMin('19:30'), end: A.toMin('24:00'), missing: [] }]);
const e2 = parse(t2, { today: new Date(2026, 10, 9) });
assert.strictEqual(e2[0].start, '2026-11-12T19:30:00+09:00');
assert.strictEqual(e2[0].end, '2026-11-13T00:00:00+09:00');

console.log('availability: ok');
