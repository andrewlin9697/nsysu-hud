'use strict';
// US macro events (config/macro-events.json). Shared by the widget and the macro-reminder workflow.

const T = require('./time');

function normalizeEvents(config) {
  const list = (config && config.events) || [];
  return list
    .map((e) => ({ ...e, time: T.parseTime(e.at) }))
    .filter((e) => e.time)
    .sort((a, b) => a.time - b.time);
}

function upcoming(config, now) {
  return normalizeEvents(config).filter((e) => e.time > now);
}

// End of "tonight": the next 06:00 Taipei after now.
function tonightEnd(now) {
  const p = T.parts(now);
  const key = p.minutes < 360 ? p.dateKey : T.addDays(p.dateKey, 1);
  return T.at(key, '06:00');
}

// Events from now until the next 06:00 (inclusive).
function tonight(config, now) {
  const end = tonightEnd(now);
  return upcoming(config, now).filter((e) => e.time <= end);
}

function shortHm(date) {
  const p = T.parts(date);
  return `${p.hh}:${T.pad2(p.mm)}`;
}

// "今晚 21:30" / "凌晨 2:00" / "清晨 6:00" for an event within tonight's window.
function nightLabel(time, now) {
  const p = T.parts(time);
  const sameDay = p.dateKey === T.dateKey(now);
  if (p.hh < 5) return `凌晨 ${shortHm(time)}`;
  if (p.hh < 7) return `清晨 ${shortHm(time)}`;
  if (sameDay && p.hh >= 18) return `今晚 ${T.hm(time)}`;
  return `${sameDay ? '今天' : '明天'} ${T.hm(time)}`;
}

function daysUntil(time, now) {
  return T.diffDays(T.dateKey(now), T.dateKey(time));
}

// "11/10（二）21:30"
function whenText(time) {
  return `${T.mdw(T.dateKey(time))}${T.hm(time)}`;
}

// "美國 CPI（10 月） 11/10（二）21:30，還有 20 天"
function countdownText(event, now) {
  const days = daysUntil(event.time, now);
  const rest = days === 0 ? '今天' : days === 1 ? '明天' : `還有 ${days} 天`;
  return `${event.title} ${whenText(event.time)}，${rest}${event.confirmed === false ? '（預估）' : ''}`;
}

function reminderLine(event, now) {
  return `${nightLabel(event.time, now)} ${event.title}${event.confirmed === false ? '（預估）' : ''}`;
}

module.exports = {
  normalizeEvents,
  upcoming,
  tonight,
  tonightEnd,
  nightLabel,
  daysUntil,
  whenText,
  countdownText,
  reminderLine,
};
