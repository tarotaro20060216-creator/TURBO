// 練習日程テキスト（LINEノートなど）を予定の配列に変換する。
// ブラウザでは window.ScheduleParser、Node では module.exports として使える。
(function (root) {
  const CIRCLED = '①-⑳㉑-㉟㊱-㊿';
  // 行頭の日付: 「①10/4」「10/1」「10月4日」「1. 10/4(日)」など
  // 日付の前に付く番号や記号: 「1️⃣」「🔟」「①」「1.」「第1回」「【」など
  const PREFIX =
    '(?:[\\s' + CIRCLED + '・•*＊\\-【\\[（(]' +
    '|[0-9#]\\uFE0F?\\u20E3' +
    '|\\p{Extended_Pictographic}|\\uFE0F' +
    '|第?\\d{1,2}回目?[:：]?' +
    '|\\d{1,2}[.)．）])*';
  const DATE_RE = new RegExp(
    '^' + PREFIX + '(\\d{1,2})\\s*[/／月]\\s*(\\d{1,2})日?[】\\]]?', 'u'
  );
  // 補足行の先頭の矢印: 「→ファスユニ」
  const ARROW_RE = /^[→⇒➡️▶︎▷>＞\s]+/u;
  // 時刻: 「21-23」「11:00~14:00」「12時〜14時半」など
  const TIME_RE =
    /(\d{1,2})(?:[:：](\d{2})|時(半)?)?\s*[-~〜～ー−–—]\s*(\d{1,2})(?:[:：](\d{2})|時(半)?)?/;
  const PLACE_RE = /[@＠]\s*(.+)$/;
  const PLACE_LINE_RE = /^\s*(?:場所|会場|スタジオ)\s*[:：]\s*(.+)$/;
  const WEEKDAY_RE = /^\s*[(（][月火水木金土日祝・]+[)）]/;

  function z(n) { return String(n).padStart(2, '0'); }

  function guessYear(month, today) {
    const y = today.getFullYear();
    // 今日より3か月以上前の月は来年の予定とみなす（例: 11月に届いた1月の日程）
    return month < today.getMonth() + 1 - 3 ? y + 1 : y;
  }

  function toIso(y, m, d, hour, min) {
    const dt = new Date(Date.UTC(y, m - 1, d, hour, min));
    return dt.getUTCFullYear() + '-' + z(dt.getUTCMonth() + 1) + '-' + z(dt.getUTCDate()) +
      'T' + z(dt.getUTCHours()) + ':' + z(dt.getUTCMinutes()) + ':00+09:00';
  }

  // 「13-17」などの一致から時刻を取り出す
  function readTime(tm) {
    const sh = +tm[1], sm = tm[2] ? +tm[2] : tm[3] ? 30 : 0;
    let eh = +tm[4]; const em = tm[5] ? +tm[5] : tm[6] ? 30 : 0;
    // 「23-1」のように日付をまたぐ場合
    if (eh * 60 + em <= sh * 60 + sm) eh += 24;
    if (sh > 30 || eh > 48 || sm > 59 || em > 59) return null;
    return { sh, sm, eh, em };
  }

  function applyTime(ev, t) {
    ev.allDay = false;
    ev.start = toIso(ev.year, ev.month, ev.day, t.sh, t.sm);
    ev.end = toIso(ev.year, ev.month, ev.day, t.eh, t.em);
    ev.timeLabel = z(t.sh) + ':' + z(t.sm) + '–' + z(t.eh % 24) + ':' + z(t.em);
  }

  function parse(text, opts) {
    opts = opts || {};
    const today = opts.today || new Date();
    const events = [];
    let cur = null;
    // 「時間は全て18:00-20:00です」のように日付の外に書かれた共通の時間
    let commonTime = null;
    // 「（10/11のみ12:00~14:00）」のような特定の日だけの時間
    const onlyTimes = {};

    const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    for (const raw of lines) {
      const line = raw.replace(/　/g, ' ').trim();
      if (!line) { cur = null; continue; }

      const dm = line.match(DATE_RE);
      if (dm) {
        const month = +dm[1], day = +dm[2];
        if (month < 1 || month > 12 || day < 1 || day > 31) { cur = null; continue; }
        let rest = line.slice(dm[0].length).replace(WEEKDAY_RE, '');
        const year = opts.year || guessYear(month, today);
        const only = rest.match(/^\s*のみ/) && rest.match(TIME_RE);
        if (only && readTime(only)) {
          onlyTimes[month + '/' + day] = readTime(only);
          continue;
        }
        const ev = {
          year, month, day,
          allDay: true, start: null, end: null,
          place: '', label: '', notes: [], warning: /⚠/.test(rest),
          tentative: false, placeTbd: false, maybeOff: false,
        };
        const pm = rest.match(PLACE_RE);
        if (pm) {
          // 「@未定、一橋祭前日なので無いかも。」→ 場所「未定」＋メモ
          const parts = pm[1].trim().split(/[、,，]\s*/);
          ev.place = parts.shift().trim();
          const extra = parts.join('、').trim();
          if (extra) ev.notes.push(extra);
          rest = rest.slice(0, pm.index);
        }
        if (/^(未定|TBD|調整中)$/i.test(ev.place)) { ev.place = ''; ev.placeTbd = true; }
        const tm = rest.match(TIME_RE);
        const t = tm && readTime(tm);
        if (t) {
          applyTime(ev, t);
          rest = rest.slice(0, tm.index) + rest.slice(tm.index + tm[0].length);
        }
        rest = rest.replace(/⚠️?/g, '').trim();
        // 「11/28か29にリハ」のように日付が決まっていない
        const alt = rest.match(/^(?:か|or|／|\/)\s*(\d{1,2})日?\s*(.*)$/i);
        if (alt) {
          ev.tentative = true;
          ev.notes.unshift(month + '/' + day + 'か' + month + '/' + alt[1] + '（日付未定）');
          rest = alt[2];
        }
        // 「12/4(金)にラスリハ」→ 予定名「ラスリハ」
        ev.label = rest.replace(/^(?:に|は|で|:|：|-|–)\s*/, '').replace(/[。．]$/, '').trim();
        ev.date = year + '-' + z(month) + '-' + z(day);
        events.push(ev);
        cur = ev;
        continue;
      }

      if (!cur && !commonTime) {
        const tm = line.match(TIME_RE);
        const t = tm && readTime(tm);
        if (t) commonTime = t;
        const ONLY_RE = /(\d{1,2})\s*[\/／月]\s*(\d{1,2})日?\s*のみ\s*/g;
        let om;
        while ((om = ONLY_RE.exec(line))) {
          const after = line.slice(om.index + om[0].length).match(TIME_RE);
          const ot = after && after.index === 0 && readTime(after);
          if (ot) onlyTimes[+om[1] + '/' + +om[2]] = ot;
        }
        continue;
      }

      if (cur) {
        const pl = line.match(PLACE_LINE_RE);
        if (pl && !cur.place) cur.place = pl[1].trim();
        else cur.notes.push(line.replace(ARROW_RE, '') || line);
      }
    }
    for (const ev of events) {
      const ot = onlyTimes[ev.month + '/' + ev.day];
      if (ot && (ev.allDay || ev.commonTime)) { applyTime(ev, ot); continue; }
      if (/(無い|ない|なし|中止)かも|未確定/.test(ev.notes.join(' ') + ev.label)) ev.maybeOff = true;
      // 日付だけの行には共通の時間を入れる。「にラスリハ」など別の予定らしい行には入れない
      if (ev.allDay && commonTime && !ev.label && !ev.tentative) {
        applyTime(ev, commonTime);
        ev.commonTime = true;
      }
    }
    return events;
  }

  // 自分の名前が欠席・遅刻・早退の行に含まれていれば、その区分を返す
  function findMyStatus(ev, name) {
    if (!name) return null;
    const names = name.split(/[,、\s]+/).filter(Boolean);
    for (const note of ev.notes) {
      const m = note.match(/^(欠席|遅刻|早退)/);
      if (m && names.some((n) => note.includes(n))) return m[1];
    }
    return null;
  }

  const api = { parse, findMyStatus };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ScheduleParser = api;
})(typeof window !== 'undefined' ? window : this);
