'use strict';
// The only place that touches Scriptable's I/O APIs (Request, FileManager, CalendarEvent,
// Notification). Node tests use src/dev/fake-adapter.js with the same shape instead.

const { isSkippedCalendar } = require('./countdown');

function createScriptableAdapter(sc) {
  const fm = sc.FileManager.local();
  const dir = fm.joinPath(fm.libraryDirectory(), 'nsysu-hud-cache');
  if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
  const file = (key) => fm.joinPath(dir, `${key.replace(/[^a-z0-9_-]/gi, '_')}.json`);

  return {
    now: () => new Date(),

    async fetch(url, opts = {}) {
      const req = new sc.Request(url);
      req.timeoutInterval = opts.timeout || 12;
      req.headers = { Accept: 'application/json, text/plain, */*', ...(opts.headers || {}) };
      const body = await req.loadString();
      return { status: req.response ? req.response.statusCode : 200, body };
    },

    readCache(key) {
      const p = file(key);
      if (!fm.fileExists(p)) return null;
      try {
        return JSON.parse(fm.readString(p));
      } catch (e) {
        return null;
      }
    },

    writeCache(key, value) {
      try {
        fm.writeString(file(key), JSON.stringify(value));
      } catch (e) {
        console.log(`快取寫入失敗：${e}`);
      }
    },

    async calendarEvents(start, end) {
      const calendars = (await sc.Calendar.forEvents()).filter((c) => !isSkippedCalendar(c.title));
      if (!calendars.length) return [];
      const events = await sc.CalendarEvent.between(start, end, calendars);
      return events.map((e) => ({
        title: e.title,
        start: e.startDate,
        end: e.endDate,
        allDay: e.isAllDay,
        location: e.location || null,
        notes: e.notes || null,
        calendar: e.calendar ? e.calendar.title : null,
      }));
    },

    async scheduleNotification(n) {
      const note = new sc.Notification();
      note.identifier = n.id;
      note.title = n.title;
      note.body = n.body;
      note.threadIdentifier = 'nsysu-hud';
      note.setTriggerDate(n.at);
      await note.schedule();
    },

    async cancelNotification(id) {
      await sc.Notification.removePending([id]);
    },

    log(msg) {
      console.log(msg);
    },
  };
}

module.exports = { createScriptableAdapter };
