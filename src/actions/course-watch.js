'use strict';
// Course change watcher: compare room / classTime / change of the user's courses in the latest
// NSYSUCourseAPI snapshot against the previous Pages state.

const T = require('../lib/time');
const { parseRooms } = require('../widget/schedule');

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
const KEEP_CHANGES = 30;

// version.json: { latest: "20261021_160131", history: { ... } }
function resolveLatest(version) {
  if (!version) return null;
  if (typeof version.latest === 'string' && version.latest) return version.latest;
  const keys = Object.keys(version.history || {}).filter((k) => /^\d{8}_\d{6}$/.test(k)).sort();
  return keys.pop() || null;
}

function snapshot(course) {
  return {
    name: String(course.name || '').split('\n')[0].trim(),
    room: course.room || '',
    rooms: parseRooms(course.room),
    classTime: Array.isArray(course.classTime) ? course.classTime.map((x) => String(x || '')) : [],
    change: course.change == null ? null : String(course.change),
    changeDescription: course.changeDescription == null ? null : String(course.changeDescription),
    url: course.url || null,
  };
}

// ["", "", "", "", "567", "", ""] → "週五 5、6、7 節"
function classTimeText(ct) {
  const parts = (ct || []).map((p, i) => (p ? `週${DAY_NAMES[i]} ${p.split('').join('、')} 節` : null)).filter(Boolean);
  return parts.length ? parts.join('、') : '（沒有上課時間）';
}

function sameArray(a, b) {
  return JSON.stringify(a || []) === JSON.stringify(b || []);
}

// Returns { messages: [{ courseId, message }], snapshots }.
function diffCourses(prevCourses, allCourses, courseIds, labels = {}, opts = {}) {
  const byId = new Map((allCourses || []).map((c) => [c.id, c]));
  const snapshots = {};
  const messages = [];
  for (const id of courseIds) {
    const label = labels[id] || id;
    const cur = byId.get(id);
    const old = prevCourses ? prevCourses[id] : null;
    if (!cur) {
      if (old && !old.missing && opts.complete !== false) {
        messages.push({ courseId: id, message: `${label}在最新課程資料中找不到（可能停開或改課號）` });
      }
      snapshots[id] = old ? { ...old, missing: true } : { missing: true };
      continue;
    }
    const now = snapshot(cur);
    snapshots[id] = now;
    if (!old || old.missing) continue; // first sighting → baseline only
    const roomsChanged = old.rooms ? !sameArray(old.rooms, now.rooms) : old.room !== now.room;
    if (roomsChanged) messages.push({ courseId: id, message: `${label}教室改到 ${now.rooms.join('、') || now.room || '（未定）'}` });
    if (!sameArray(old.classTime, now.classTime)) messages.push({ courseId: id, message: `${label}上課時間改為 ${classTimeText(now.classTime)}` });
    if (old.change !== now.change || old.changeDescription !== now.changeDescription) {
      if (now.change || now.changeDescription) {
        const desc = [now.change, now.changeDescription].filter(Boolean).join('：');
        messages.push({ courseId: id, message: `${label}課程${now.change === '停開' ? '停開' : '異動'}（${desc}）` });
      }
    }
  }
  return { messages, snapshots };
}

function coursePayload(messages, urls = {}) {
  if (!messages || !messages.length) return null;
  const first = messages[0];
  return {
    title: messages.length === 1 ? '課程異動' : `課程異動 ${messages.length} 則`,
    message: messages.map((m) => m.message).join('\n'),
    click: urls[first.courseId] || undefined,
    tags: ['warning'],
    priority: 4,
  };
}

// Daily fallback for the data workflow: due after 09:00 Taipei if nothing ran today.
function courseDue(prev, now, afterMinutes = 9 * 60) {
  if (T.parts(now).minutes < afterMinutes) return false;
  const t = prev && T.parseTime(prev.checkedAt);
  return !t || T.dateKey(t) !== T.dateKey(now);
}

function buildState(prev, { now, dataVersion, snapshots, messages, errors }) {
  const nowIso = now.toISOString();
  const changes = [
    ...messages.map((m) => ({ at: nowIso, courseId: m.courseId, message: m.message })),
    ...((prev && prev.changes) || []),
  ].slice(0, KEEP_CHANGES);
  return {
    version: 1,
    checkedAt: nowIso,
    dataVersion: dataVersion || (prev && prev.dataVersion) || null,
    firstRun: !prev,
    courses: snapshots || (prev && prev.courses) || {},
    changes,
    errors: errors || [],
  };
}

module.exports = { resolveLatest, snapshot, classTimeText, diffCourses, coursePayload, courseDue, buildState };
