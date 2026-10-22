'use strict';
// Class schedule (config/courses.json): merge consecutive periods, find current/next class.

const T = require('../lib/time');
const { dayInfo } = require('./semester');

// Period keys sorted by start time. (Object key order can't be trusted: "C" would sort after "9".)
function periodTable(periods) {
  return Object.keys(periods || {})
    .map((key) => {
      const [start, end] = periods[key];
      return { key, start, end, startMin: T.toMinutes(start), endMin: T.toMinutes(end) };
    })
    .sort((a, b) => a.startMin - b.startMin);
}

// One course → one or more blocks; consecutive periods (e.g. "234") merge into 09:10–12:00.
function courseBlocks(course, table) {
  const index = new Map(table.map((p, i) => [p.key, i]));
  const idx = [...new Set(String(course.periods || '').split(''))]
    .filter((k) => index.has(k))
    .map((k) => index.get(k))
    .sort((a, b) => a - b);
  const blocks = [];
  for (const i of idx) {
    const last = blocks[blocks.length - 1];
    if (last && last.lastIndex === i - 1) {
      last.lastIndex = i;
      last.endMin = table[i].endMin;
      last.periods += table[i].key;
    } else {
      blocks.push({ firstIndex: i, lastIndex: i, startMin: table[i].startMin, endMin: table[i].endMin, periods: table[i].key });
    }
  }
  return blocks.map((b) => ({
    course,
    weekday: course.weekday,
    periods: b.periods,
    startMin: b.startMin,
    endMin: b.endMin,
    start: T.minutesToHm(b.startMin),
    end: T.minutesToHm(b.endMin),
  }));
}

function blocksForWeekday(coursesCfg, weekday) {
  const table = periodTable(coursesCfg.periods);
  return (coursesCfg.courses || [])
    .filter((c) => c.weekday === weekday || (weekday === 0 && c.weekday === 7))
    .flatMap((c) => courseBlocks(c, table))
    .sort((a, b) => a.startMin - b.startMin);
}

function blocksForDate(key, coursesCfg, sem) {
  if (!dayInfo(key, sem).classDay) return [];
  return blocksForWeekday(coursesCfg, T.weekdayOf(key));
}

function withTimes(block, key) {
  return { ...block, dateKey: key, startAt: T.at(key, block.startMin), endAt: T.at(key, block.endMin) };
}

// First class strictly after `now`, searching up to maxDays ahead (holidays are skipped).
function findNextClass(now, coursesCfg, sem, maxDays = 30) {
  const today = T.dateKey(now);
  const nowMin = T.parts(now).minutes;
  for (let i = 0; i <= maxDays; i++) {
    const key = T.addDays(today, i);
    const blocks = blocksForDate(key, coursesCfg, sem);
    const b = i === 0 ? blocks.find((x) => x.startMin > nowMin) : blocks[0];
    if (b) {
      const block = withTimes(b, key);
      return {
        ...block,
        rel: T.relDayLabel(today, key),
        minutesUntil: Math.ceil((block.startAt - now) / 60000),
      };
    }
  }
  return null;
}

// Current class, remaining minutes, and the next class (today or a later day).
function classStatus(now, coursesCfg, sem) {
  const p = T.parts(now);
  const today = p.dateKey;
  const info = dayInfo(today, sem);
  const blocks = blocksForDate(today, coursesCfg, sem).map((b) => withTimes(b, today));
  const cur = blocks.find((b) => b.startAt <= now && now < b.endAt) || null;
  const current = cur ? { ...cur, minutesLeft: Math.ceil((cur.endAt - now) / 60000) } : null;
  const next = findNextClass(now, coursesCfg, sem);
  const nextToday = next && next.dateKey === today ? next : null;
  const doneToday = blocks.length > 0 && blocks.every((b) => b.endAt <= now);
  return {
    today: info,
    blocks,
    current,
    next,
    nextToday,
    inBreak: !current && !!nextToday && blocks.some((b) => b.endAt <= now),
    doneToday,
    hasClassToday: blocks.length > 0,
  };
}

// Parses NSYSUCourseAPI room strings such as "五5,6,7(工EC 3013)" → ["工EC 3013"].
function parseRooms(room) {
  const out = [];
  const re = /\(([^()]+)\)/g;
  let m;
  while ((m = re.exec(String(room || '')))) {
    const r = m[1].trim();
    if (r && !out.includes(r)) out.push(r);
  }
  return out;
}

function buildingOf(room) {
  const m = /([A-Z]{2,3})\s*-?\s*\d/.exec(String(room || ''));
  return m ? m[1] : null;
}

// Applies room changes recorded by the course-watch workflow (Pages course-state.json).
// Only unambiguous single-room changes are applied; the original stays in config.
function applyCourseState(coursesCfg, state) {
  if (!state || !state.courses) return coursesCfg;
  const courses = (coursesCfg.courses || []).map((c) => {
    const s = state.courses[c.id];
    if (!s) return c;
    const rooms = s.rooms || parseRooms(s.room);
    if (rooms.length !== 1 || rooms[0] === c.room) return c;
    return { ...c, room: rooms[0], building: buildingOf(rooms[0]) || c.building, roomChanged: true, configRoom: c.room };
  });
  return { ...coursesCfg, courses };
}

module.exports = {
  periodTable,
  courseBlocks,
  blocksForWeekday,
  blocksForDate,
  findNextClass,
  classStatus,
  parseRooms,
  buildingOf,
  applyCourseState,
};
