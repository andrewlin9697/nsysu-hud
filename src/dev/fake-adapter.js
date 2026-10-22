'use strict';
// Fake adapter for Node tests and `npm run preview`: canned HTTP responses, in-memory cache,
// fake calendar and notification bookkeeping. Dev / test only — not bundled.

function clone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

/**
 * routes: [{ match: RegExp | string | (url) => bool, status?, json?, body?, error? }]
 * calendar: array of raw events, or 'deny' to simulate a missing permission
 */
function createFakeAdapter(opts = {}) {
  let now = opts.now || new Date();
  const cache = opts.cache || {};
  const routes = opts.routes || [];
  const requests = [];
  const notifications = { scheduled: [], cancelled: [] };
  const logs = [];
  const matches = (r, url) => (typeof r.match === 'function' ? r.match(url) : r.match instanceof RegExp ? r.match.test(url) : url.includes(r.match));
  return {
    requests,
    notifications,
    logs,
    cache,
    setNow(d) { now = d; },
    now: () => now,
    async fetch(url) {
      requests.push(url);
      const r = routes.find((x) => matches(x, url));
      if (!r) throw new Error(`離線（假的網路沒有這個網址）`);
      if (r.error) throw new Error(r.error);
      const body = r.body != null ? r.body : JSON.stringify(typeof r.json === 'function' ? r.json(url) : r.json);
      return { status: r.status || 200, body };
    },
    readCache(key) { return key in cache ? clone(cache[key]) : null; },
    writeCache(key, value) { cache[key] = clone(value); },
    async calendarEvents(start, end) {
      if (opts.calendar === 'deny') throw new Error('permission denied');
      return (opts.calendar || []).filter((e) => new Date(e.end || e.start) > start && new Date(e.start) < end);
    },
    async scheduleNotification(n) { notifications.scheduled.push(n); },
    async cancelNotification(id) { notifications.cancelled.push(id); },
    log(msg) { logs.push(msg); },
  };
}

module.exports = { createFakeAdapter };
