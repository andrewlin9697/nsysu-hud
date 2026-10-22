'use strict';
// Mode selection: which layout the widget shows, from Taipei time, weekday, timetable and semester.
// Pure function so every boundary can be unit-tested with fixed times.

const T = require('../lib/time');
const { dayInfo } = require('./semester');
const { blocksForDate } = require('./schedule');

const MODES = {
  morning: { title: '早晨', symbol: 'sunrise.fill' },
  classday: { title: '上課日', symbol: 'book.fill' },
  afternoon: { title: '午後', symbol: 'cup.and.saucer.fill' },
  evening: { title: '晚間', symbol: 'moon.fill' },
  latenight: { title: '深夜', symbol: 'moon.zzz.fill' },
  holiday: { title: '假日', symbol: 'sun.max.fill' },
};

const MORNING_START = 6 * 60; // 06:00
const CLASS_START = 9 * 60 + 10; // 09:10
const AFTERNOON_START = 13 * 60 + 30; // 13:30
const EVENING_START = 18 * 60; // 18:00

function selectMode(now, coursesCfg, sem) {
  const p = T.parts(now);
  const t = p.minutes;
  const info = dayInfo(p.dateKey, sem);
  const pick = (mode, reason) => ({ mode, reason, ...MODES[mode], day: info });

  // Late night and evening apply every day (Sunday evening needs "tomorrow's first class" too).
  if (t < MORNING_START) return pick('latenight', '00:00–06:00');
  if (t >= EVENING_START) return pick('evening', '18:00–24:00');
  if (!info.classDay) return pick('holiday', info.offLabel || '放假');
  if (t < CLASS_START) return pick('morning', '平日 06:00–09:10');

  const blocks = blocksForDate(p.dateKey, coursesCfg, sem);
  if (blocks.length) {
    if (t < AFTERNOON_START) return pick('classday', '有課的日子 09:10–13:30');
    // After 13:30 stay in class mode while a class is running or still to come.
    if (blocks.some((b) => b.endMin > t)) return pick('classday', '還有課');
  }
  return pick('afternoon', blocks.length ? '下課後' : '今天沒課');
}

// Next time the layout may change (class start/end or a mode boundary), for refreshAfterDate.
function nextBoundary(now, coursesCfg, sem) {
  const p = T.parts(now);
  const marks = [MORNING_START, CLASS_START, AFTERNOON_START, 16 * 60, EVENING_START, 24 * 60];
  for (const b of blocksForDate(p.dateKey, coursesCfg, sem)) marks.push(b.startMin, b.endMin);
  const next = marks.filter((m) => m > p.minutes).sort((a, b) => a - b)[0];
  return T.at(p.dateKey, next == null ? 24 * 60 : next);
}

module.exports = { MODES, selectMode, nextBoundary };
