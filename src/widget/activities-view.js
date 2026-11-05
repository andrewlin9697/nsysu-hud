'use strict';
// EEARS sessions (English Table, Job Talk, English Club…) from Pages activities.json, for the
// widget and the dashboard. The Actions job already marks sessions that clash with a class.

const T = require('../lib/time');

function typeName(feed, code) {
  const t = feed && feed.types && feed.types[code];
  return (t && t.name) || code || '活動';
}

// Upcoming sessions (not started yet) within `days`, sorted by start time.
function upcomingSessions(feed, now, days = 14) {
  const until = now.getTime() + days * T.DAY_MS;
  return ((feed && Array.isArray(feed.events) && feed.events) || [])
    .map((e) => {
      if (!e || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')) || !/^\d{1,2}:\d{2}$/.test(String(e.start || ''))) return null;
      const startAt = T.at(e.date, e.start);
      const openAt = T.parseTime(e.openAt);
      return {
        id: e.id,
        type: e.type,
        name: typeName(feed, e.type),
        dateKey: e.date,
        start: e.start,
        end: e.end || null,
        location: e.location || null,
        avail: Number.isFinite(e.avail) ? e.avail : null,
        conflict: e.conflict || null,
        startAt,
        openAt,
      };
    })
    .filter((s) => s && s.startAt > now && s.startAt.getTime() <= until)
    .sort((a, b) => a.startAt - b.startAt);
}

// Can the user actually go: no class clash and not known to be full.
function attendable(s) {
  return !s.conflict && s.avail !== 0;
}

// Next attendable session on a given day.
function sessionOn(feed, now, dateKey) {
  return upcomingSessions(feed, now, 3).find((s) => s.dateKey === dateKey && attendable(s)) || null;
}

// Booking that opens within the next `hours` hours, for a session the user could attend.
function nextOpening(feed, now, hours = 24) {
  const until = now.getTime() + hours * 3600000;
  return upcomingSessions(feed, now, 14)
    .filter((s) => s.openAt && s.openAt > now && s.openAt.getTime() <= until && !s.conflict)
    .sort((a, b) => a.openAt - b.openAt)[0] || null;
}

function spotsText(s) {
  if (s.avail == null) return '';
  return s.avail === 0 ? '額滿' : `剩 ${s.avail} 位`;
}

module.exports = { upcomingSessions, attendable, sessionOn, nextOpening, spotsText, typeName };
