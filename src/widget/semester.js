'use strict';
// Semester calendar (config/semester.json): holidays, exam weeks, winter break.

const T = require('../lib/time');

function inRange(key, range) {
  return !!range && !!range.start && key >= range.start && key <= (range.end || range.start);
}

function examWeekOf(key, sem) {
  if (inRange(key, sem.midtermWeek)) return { kind: 'midterm', label: '期中考週', ...sem.midtermWeek };
  if (inRange(key, sem.finalWeek)) return { kind: 'final', label: '期末考週', ...sem.finalWeek };
  return null;
}

function dayInfo(key, sem) {
  const weekday = T.weekdayOf(key);
  const weekend = weekday === 0 || weekday === 6;
  const holiday = ((sem && sem.noClassDays) || []).find((h) => h.date === key) || null;
  const winterBreak = !!(sem && sem.winterBreakStart) && key >= sem.winterBreakStart &&
    (!sem.nextSemesterStart || key < sem.nextSemesterStart);
  const beforeStart = !!(sem && sem.classesStart) && key < sem.classesStart;
  const exam = sem ? examWeekOf(key, sem) : null;
  const classDay = !weekend && !holiday && !winterBreak && !beforeStart;
  let offLabel = null;
  if (holiday) offLabel = holiday.name;
  else if (winterBreak) offLabel = sem.nextSemesterStart ? `寒假（${T.md(sem.nextSemesterStart)} 開學）` : '寒假';
  else if (beforeStart) offLabel = `開學前（${T.md(sem.classesStart)} 開學）`;
  else if (weekend) offLabel = '週末';
  return {
    dateKey: key,
    weekday,
    weekend,
    holiday: holiday ? holiday.name : null,
    winterBreak,
    beforeStart,
    exam,
    classDay,
    offLabel,
  };
}

module.exports = { dayInfo, examWeekOf, inRange };
