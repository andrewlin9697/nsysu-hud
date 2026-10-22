'use strict';
// Exam / deadline countdowns from the iPhone calendar (CalendarEvent.between).

const T = require('../lib/time');

const EXAM_RE = /考試|期中|期末|小考|\b(?:quiz|exam|midterm|final)s?\b/i;
const DEADLINE_RE = /截止|繳交|報名|\b(?:deadline|due)\b/i;
const UNCERTAIN_RE = /^\s*留意公告\s*[:：]\s*/;
// Holiday / birthday calendars are skipped entirely.
const SKIP_CALENDAR_RE = /節日|假日|節慶|holiday|birthday|生日/i;

function classifyTitle(title) {
  const raw = String(title || '').trim();
  const uncertain = UNCERTAIN_RE.test(raw);
  const display = raw.replace(UNCERTAIN_RE, '').trim();
  let kind = null;
  if (EXAM_RE.test(display)) kind = 'exam';
  else if (DEADLINE_RE.test(display)) kind = 'deadline';
  return { kind, uncertain, display };
}

function isSkippedCalendar(name) {
  return SKIP_CALENDAR_RE.test(String(name || ''));
}

// Raw event: { title, start, end, allDay, location?, notes?, calendar? } (Date or string times)
function normalizeEvent(ev) {
  const start = T.parseTime(ev.start);
  if (!start) return null;
  const allDay = !!ev.allDay;
  let end = T.parseTime(ev.end) || start;
  if (allDay && end <= start) end = T.at(T.addDays(T.dateKey(start), 1));
  const startKey = T.dateKey(start);
  // All-day events end at 00:00 of the following day (exclusive). Some sources use 23:59:59 instead.
  let lastKey = T.dateKey(end);
  if (allDay && T.parts(end).minutes === 0 && T.parts(end).ss === 0 && lastKey > startKey) lastKey = T.addDays(lastKey, -1);
  if (allDay) end = T.at(T.addDays(lastKey, 1));
  const c = classifyTitle(ev.title);
  return {
    title: String(ev.title || ''),
    display: c.display,
    kind: c.kind,
    uncertain: c.uncertain,
    allDay,
    start,
    end,
    startKey,
    lastKey,
    location: ev.location || null,
    notes: ev.notes || null,
    calendar: ev.calendar || null,
  };
}

function urgency(days, uncertain) {
  if (uncertain) return 'gray';
  if (days <= 2) return 'red';
  if (days <= 7) return 'orange';
  return 'secondary';
}

function labelFor(item, now) {
  const today = T.dateKey(now);
  const ongoing = item.start <= now && now < item.end;
  const prefix = item.uncertain ? '約 ' : '';
  if (ongoing) return prefix + (item.allDay ? '今天' : '進行中');
  const days = T.diffDays(today, item.startKey);
  if (days === 0) return prefix + (item.allDay ? '今天' : `今天 ${T.hm(item.start)}`);
  if (days === 1) return prefix + (item.allDay ? '明天' : `明天 ${T.hm(item.start)}`);
  return `${prefix}D-${days}`;
}

// Classified, future (or ongoing) events sorted by start; unrelated events are dropped.
function countdownItems(events, now, opts = {}) {
  const today = T.dateKey(now);
  const horizon = opts.days == null ? 45 : opts.days;
  return (events || [])
    .filter((e) => !isSkippedCalendar(e.calendar))
    .map(normalizeEvent)
    .filter((e) => e && e.kind && e.end > now)
    .map((e) => {
      const days = Math.max(0, T.diffDays(today, e.startKey));
      return { ...e, days, label: labelFor(e, now), color: urgency(days, e.uncertain) };
    })
    .filter((e) => e.days <= horizon)
    .sort((a, b) => a.start - b.start || a.display.localeCompare(b.display));
}

// Exams (with a confirmed date) starting within 48 hours, or already in progress.
function examAlerts(items, now) {
  const limit = now.getTime() + 48 * 3600 * 1000;
  return items.filter((e) => e.kind === 'exam' && !e.uncertain && e.start.getTime() <= limit && e.end > now);
}

// Exams in the Monday–Sunday week containing `key` (used during exam weeks).
function examsInWeek(items, key) {
  const from = T.weekStart(key);
  const to = T.addDays(from, 6);
  return items.filter((e) => e.kind === 'exam' && e.startKey <= to && e.lastKey >= from);
}

module.exports = {
  EXAM_RE,
  DEADLINE_RE,
  classifyTitle,
  isSkippedCalendar,
  normalizeEvent,
  countdownItems,
  examAlerts,
  examsInWeek,
  labelFor,
  urgency,
};
