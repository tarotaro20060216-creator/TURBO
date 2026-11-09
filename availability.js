// 日程調整の計算: 各自の空き時間（日付ごとの「19:00-23:00」のような範囲）から、
// 全員がそろう時間・1人だけ欠ける時間を探す。
// ブラウザでは window.Availability、Node では module.exports として使える。
(function (root) {
  const STEP = 30; // 入力の刻み（分）
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

  function z(n) { return String(n).padStart(2, '0'); }

  // '19:30' -> 1170
  function toMin(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t).trim());
    return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
  }
  // 1170 -> '19:30'（保存用）
  function hhmm(n) { return z(Math.floor(n / 60)) + ':' + z(n % 60); }
  // 1170 -> '19:30'、540 -> '9:00'（表示用）
  function fmt(n) { return Math.floor(n / 60) + ':' + z(n % 60); }

  // '19:00-23:00' -> [1140, 1380]
  function parseRange(s) {
    const [a, b] = String(s).split('-');
    const r = [toMin(a), toMin(b)];
    return r[0] < r[1] ? r : null;
  }
  function rangeText(r) { return hhmm(r[0]) + '-' + hhmm(r[1]); }

  // 重なり・隣り合う範囲をまとめて並べる
  function mergeRanges(ranges) {
    const list = ranges.filter((r) => r && r[0] < r[1]).map((r) => [r[0], r[1]]);
    list.sort((p, q) => p[0] - q[0]);
    const out = [];
    for (const r of list) {
      const last = out[out.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else out.push(r);
    }
    return out;
  }

  function rangesOf(answer, date) {
    const raw = (answer && answer.slots && answer.slots[date]) || [];
    return mergeRanges(raw.map(parseRange));
  }

  function isFree(ranges, a, b) { return ranges.some((r) => r[0] <= a && b <= r[1]); }

  function clip(ranges, a, b) {
    return ranges
      .map((r) => [Math.max(r[0], a), Math.min(r[1], b)])
      .filter((r) => r[0] < r[1]);
  }

  // その日の時間を「空いている人の組み合わせが同じ区間」に分ける
  // 戻り値: [{ start, end, free: [回答の番号...] }]
  function segments(answers, date, lo, hi) {
    const per = answers.map((a) => clip(rangesOf(a, date), lo, hi));
    const pts = new Set([lo, hi]);
    for (const rs of per) for (const r of rs) { pts.add(r[0]); pts.add(r[1]); }
    const sorted = [...pts].filter((p) => p >= lo && p <= hi).sort((p, q) => p - q);
    const out = [];
    for (let i = 0; i + 1 < sorted.length; i++) {
      const a = sorted[i], b = sorted[i + 1];
      const free = [];
      per.forEach((rs, k) => { if (isFree(rs, a, b)) free.push(k); });
      const last = out[out.length - 1];
      if (last && last.end === a && last.free.join(',') === free.join(',')) last.end = b;
      else out.push({ start: a, end: b, free });
    }
    return out;
  }

  // 条件を満たす区間をつなげた、いちばん長い時間帯の一覧
  function windows(segs, ok) {
    const out = [];
    for (const s of segs) {
      if (!ok(s.free)) continue;
      const last = out[out.length - 1];
      if (last && last[1] === s.start) last[1] = s.end;
      else out.push([s.start, s.end]);
    }
    return out;
  }

  function bounds(event) {
    const lo = toMin(event.dayStart || '09:00');
    const hi = toMin(event.dayEnd || '24:00');
    return [lo, hi];
  }

  // 欠ける人の参加の仕方: 時間帯の後半だけ空いていれば「遅刻」、前半だけなら「早退」
  function partOf(free, start, end) {
    if (!free.length) return { kind: '欠席', free };
    if (free.length === 1 && free[0][1] === end) return { kind: '遅刻', free };
    if (free.length === 1 && free[0][0] === start) return { kind: '早退', free };
    return { kind: '一部参加', free };
  }

  // 候補の時間帯: 全員OK → 1人だけ欠ける、の順
  // 戻り値: [{ date, start, end, missing: [{ index, name, kind, free }] }]
  function candidates(event, answers, opts) {
    const total = answers.length;
    if (!total) return [];
    const min = (opts && opts.minMinutes) || event.minMinutes || 60;
    const [lo, hi] = bounds(event);
    const out = [];
    for (const date of event.dates || []) {
      const segs = segments(answers, date, lo, hi);
      for (const w of windows(segs, (f) => f.length === total)) {
        if (w[1] - w[0] >= min) out.push({ date, start: w[0], end: w[1], missing: [] });
      }
      if (total < 2) continue;
      answers.forEach((a, p) => {
        const mine = clip(rangesOf(a, date), lo, hi);
        for (const w of windows(segs, (f) => f.length >= total - 1 && (f.length === total || !f.includes(p)))) {
          if (w[1] - w[0] < min) continue;
          // 全時間空いているなら「全員OK」と同じなので出さない
          if (isFree(mine, w[0], w[1])) continue;
          const part = partOf(clip(mine, w[0], w[1]), w[0], w[1]);
          out.push({
            date, start: w[0], end: w[1],
            missing: [{ index: p, name: a.name, kind: part.kind, free: part.free }],
          });
        }
      });
    }
    out.sort((p, q) =>
      p.missing.length - q.missing.length ||
      (p.date < q.date ? -1 : p.date > q.date ? 1 : 0) ||
      p.start - q.start ||
      (q.end - q.start) - (p.end - p.start));
    return out;
  }

  function dateLabel(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    return m + '/' + d + '(' + WEEK[wd] + ')';
  }

  // 練習日程テキストの時間: 「19-23」「19:30-23:00」
  function shortTime(a, b) {
    if (a % 60 === 0 && b % 60 === 0) return a / 60 + '-' + b / 60;
    return fmt(a) + '-' + fmt(b);
  }

  // 選んだ候補を、練習日程かんたん登録ページで読み込める形のテキストにする
  function toPracticeText(list, opts) {
    const lines = [(opts && opts.heading) || '【練習日程】'];
    const sorted = [...list].sort((p, q) =>
      (p.date < q.date ? -1 : p.date > q.date ? 1 : 0) || p.start - q.start);
    for (const c of sorted) {
      lines.push('');
      lines.push(dateLabel(c.date) + ' ' + shortTime(c.start, c.end));
      const by = {};
      for (const m of c.missing) {
        const name = m.kind === '一部参加'
          ? m.name + '(' + m.free.map((r) => fmt(r[0]) + '〜' + fmt(r[1])).join('、') + ')'
          : m.name;
        (by[m.kind] = by[m.kind] || []).push(name);
      }
      for (const k of ['欠席', '遅刻', '早退', '一部参加']) {
        if (by[k]) lines.push(k + ':' + by[k].join('、'));
      }
    }
    return lines.join('\n');
  }

  const api = {
    STEP, toMin, hhmm, fmt, parseRange, rangeText, mergeRanges, rangesOf, isFree, clip,
    segments, windows, bounds, candidates, dateLabel, shortTime, toPracticeText,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Availability = api;
})(typeof window !== 'undefined' ? window : globalThis);
