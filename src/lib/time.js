'use strict';
// Taipei wall-clock helpers. Taiwan has no DST, so a fixed +08:00 offset is exact,
// and doing the math by hand keeps results identical on the phone, in Actions and in tests.

const OFFSET_MS = 8 * 3600 * 1000;
const DAY_MS = 86400 * 1000;
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parts(date) {
  const t = new Date(date.getTime() + OFFSET_MS);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth() + 1;
  const d = t.getUTCDate();
  const hh = t.getUTCHours();
  const mm = t.getUTCMinutes();
  return {
    y, m, d, hh, mm,
    ss: t.getUTCSeconds(),
    weekday: t.getUTCDay(),
    minutes: hh * 60 + mm,
    dateKey: `${y}-${pad2(m)}-${pad2(d)}`,
  };
}

function dateKey(date) {
  return parts(date).dateKey;
}

function hm(date) {
  const p = parts(date);
  return `${pad2(p.hh)}:${pad2(p.mm)}`;
}

// "HH:MM" → minutes after midnight
function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToHm(min) {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

// Taipei date "YYYY-MM-DD" (+ optional "HH:MM" or minutes) → Date
function at(key, time) {
  const [y, m, d] = key.split('-').map(Number);
  const min = time == null ? 0 : typeof time === 'number' ? time : toMinutes(time);
  return new Date(Date.UTC(y, m - 1, d) + min * 60000 - OFFSET_MS);
}

function addDays(key, n) {
  return dateKey(new Date(at(key).getTime() + n * DAY_MS));
}

function diffDays(fromKey, toKey) {
  return Math.round((at(toKey).getTime() - at(fromKey).getTime()) / DAY_MS);
}

function weekdayOf(key) {
  return parts(at(key)).weekday;
}

// Monday of the week containing key (weeks run Monday–Sunday)
function weekStart(key) {
  return addDays(key, -((weekdayOf(key) + 6) % 7));
}

function startOfDay(date) {
  return at(dateKey(date));
}

function addMinutes(date, min) {
  return new Date(date.getTime() + min * 60000);
}

// Accepts ISO strings with offset/Z, "YYYY-MM-DD" (Taipei midnight),
// "YYYY-MM-DDTHH:MM[:SS]" or "YYYY-MM-DD HH:MM:SS" without offset (Taipei local).
// JavaScriptCore and V8 disagree on offset-less strings, so those are parsed by hand.
function parseTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  if (local) {
    const [, y, mo, d, h = '0', mi = '0', se = '0'] = local;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se) - OFFSET_MS);
  }
  const t = new Date(s);
  return isNaN(t.getTime()) ? null : t;
}

function weekdayName(key) {
  return WEEKDAY_NAMES[weekdayOf(key)];
}

// "10/22"
function md(key) {
  const [, m, d] = key.split('-').map(Number);
  return `${m}/${d}`;
}

// "10/22（四）"
function mdw(key) {
  return `${md(key)}（${weekdayName(key)}）`;
}

// "35 分鐘" / "1 小時 40 分" / "2 小時"
function durationText(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} 分鐘`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} 小時 ${r} 分` : `${h} 小時`;
}

// Relative day label used for "next class" style text.
function relDayLabel(fromKey, toKey) {
  const diff = diffDays(fromKey, toKey);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  const weekDiff = diffDays(weekStart(fromKey), weekStart(toKey)) / 7;
  if (weekDiff === 0) return diff === 2 ? '後天' : `週${weekdayName(toKey)}`;
  if (weekDiff === 1) return `下週${weekdayName(toKey)}`;
  return mdw(toKey);
}

module.exports = {
  OFFSET_MS,
  DAY_MS,
  WEEKDAY_NAMES,
  pad2,
  parts,
  dateKey,
  hm,
  toMinutes,
  minutesToHm,
  at,
  addDays,
  diffDays,
  weekdayOf,
  weekStart,
  startOfDay,
  addMinutes,
  parseTime,
  weekdayName,
  md,
  mdw,
  durationText,
  relDayLabel,
};
