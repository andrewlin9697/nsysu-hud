'use strict';
// Realistic fake data for a given moment, built from fixtures/ (real samples) plus generated
// weather / quotes where no fixture exists. Used by `npm run preview` and the tests.

const fs = require('fs');
const path = require('path');
const T = require('../lib/time');
const R = require('../actions/rpage');
const N = require('../actions/notices');
const { makeForecast } = require('./weather-gen');
const { createFakeAdapter } = require('./fake-adapter');
const C = require('../widget/constants');

const ROOT = path.join(__dirname, '..', '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const readText = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function loadConfigs() {
  return {
    courses: readJson('config/courses.json'),
    semester: readJson('config/semester.json'),
    location: readJson('config/location.json'),
    watchlist: readJson('config/watchlist.json'),
    macro: readJson('config/macro-events.json'),
    youbike: readJson('config/youbike.json'),
    notices: readJson('config/notices.json'),
  };
}

// fixtures/calendar-events.json → raw events with Date times (like Scriptable's CalendarEvent)
function calendarEvents() {
  return readJson('fixtures/calendar-events.json').events.map((e) => ({
    title: e.title,
    start: T.parseTime(e.start),
    end: T.parseTime(e.end),
    allDay: e.allDay,
    location: e.location || null,
    notes: e.notes || null,
    calendar: '個人',
  }));
}

// Real TWSE MIS sample; missing watchlist codes get deterministic synthetic quotes so theme rows have data.
function twseResponse(now, watchlist, opts = {}) {
  const fixture = readJson('fixtures/twse-mis.json');
  const rows = fixture.msgArray.map((r) => ({ ...r }));
  const have = new Set(rows.map((r) => r.c));
  const all = [...(watchlist.pinned || []), ...(watchlist.themes || []).flatMap((t) => t.stocks)];
  for (const s of all) {
    if (have.has(s.code)) continue;
    have.add(s.code);
    const n = Number(s.code);
    const y = 20 + (n % 400);
    const pct = (((n * 37) % 90) - 45) / 10; // -4.5% … +4.4%
    rows.push({ c: s.code, n: s.name, z: (y * (1 + pct / 100)).toFixed(2), y: y.toFixed(2), o: y.toFixed(2), h: (y * 1.03).toFixed(2), l: (y * 0.97).toFixed(2), v: String(500 + (n % 9000)), d: '20261021', t: '13:30:00', ex: s.market, b: '-', a: '-' });
  }
  const p = T.parts(now);
  const trading = p.weekday >= 1 && p.weekday <= 5 && p.minutes >= 9 * 60 && !opts.keepDate;
  if (trading) {
    const d = p.dateKey.replace(/-/g, '');
    const t = p.minutes > 13 * 60 + 30 ? '13:30:00' : `${T.hm(now)}:00`;
    for (const r of rows) { r.d = d; r.t = t; }
  }
  if (opts.noTradeCode) {
    const r = rows.find((x) => x.c === opts.noTradeCode);
    if (r) r.z = '-';
  }
  return { msgArray: rows, rtcode: '0000', rtmessage: 'OK' };
}

const HTML_FIXTURES = {
  'ee-all': 'fixtures/rpage-403-ee.html',
  'oaa-course': 'fixtures/rpage-403-oaa.html',
  'main-activity': 'fixtures/rpage-422-main.html',
};

function parsedSources(noticesCfg) {
  return Object.entries(HTML_FIXTURES).map(([id, file]) => {
    const source = noticesCfg.sources.find((s) => s.id === id);
    return { source, items: R.parseList(readText(file), source.layout, source.url) };
  });
}

// notices.json as GitHub Actions would publish it: a baseline a day ago, then a few new posts.
function noticesFeed(now, noticesCfg) {
  const full = parsedSources(noticesCfg);
  const partial = full.map((r) => ({ ...r, items: r.source.layout === 'rpage-422' ? r.items.slice(1) : r.source.id === 'ee-all' ? r.items.slice(2) : r.items }));
  const base = N.mergeNotices(null, partial, new Date(now.getTime() - 26 * 3600 * 1000)).state;
  const next = N.mergeNotices(base, full, new Date(now.getTime() - 3 * 3600 * 1000)).state;
  // A later quiet round: nothing new, but checkedAt is recent like on the real site.
  return N.mergeNotices(next, full, new Date(now.getTime() - 12 * 60000)).state;
}

// youbike.json as published by Actions; ageMin makes the data look old.
function youbikeFeed(now, youbikeCfg, ageMin = 3) {
  const sample = readJson('fixtures/youbike-station-sample.json')[0];
  const updated = new Date(now.getTime() - ageMin * 60000);
  const iso = `${T.dateKey(updated)}T${T.hm(updated)}:00+08:00`;
  return {
    version: 1,
    updatedAt: updated.toISOString(),
    source: youbikeCfg.feedUrl,
    stations: youbikeCfg.stations.map((s) => {
      const n = Number(s.no.slice(-3));
      const bikes = s.no === sample.station_no ? sample.available_spaces : n % 13;
      const total = s.no === sample.station_no ? sample.parking_spaces : 20;
      return { no: s.no, name: s.name, bikes, docks: total - bikes, total, status: 1, updated: iso, favorite: !!s.favorite };
    }),
    errors: [],
  };
}

const DEFAULT_RAIN = (key) => ({ [key]: { from: 15, to: 17, pop: 70, mm: 1.2 } });

/**
 * Builds a fake adapter whose network looks like the real services at `now`.
 * opts: { weather: false | { rain, uvPeak }, stocks: false, youbikeAge, notices: false, calendar: 'deny' }
 */
function scenarioAdapter(now, opts = {}) {
  const cfg = loadConfigs();
  const today = T.dateKey(now);
  const routes = [];
  if (opts.weather !== false) {
    const w = opts.weather || {};
    routes.push({ match: 'api.open-meteo.com', json: makeForecast(today, { rain: w.rain || DEFAULT_RAIN(today), uvPeak: w.uvPeak, currentHour: T.parts(now).hh }) });
  }
  if (opts.stocks !== false) routes.push({ match: 'mis.twse.com.tw', json: twseResponse(now, cfg.watchlist, opts.stockOpts || {}) });
  if (opts.notices !== false) routes.push({ match: `${C.PAGES_BASE}/data/notices.json`, json: noticesFeed(now, cfg.notices) });
  else routes.push({ match: `${C.PAGES_BASE}/data/notices.json`, status: 404, body: 'Not Found' });
  routes.push({ match: `${C.PAGES_BASE}/data/youbike.json`, json: youbikeFeed(now, cfg.youbike, opts.youbikeAge == null ? 3 : opts.youbikeAge) });
  routes.push({ match: `${C.PAGES_BASE}/data/course-state.json`, status: 404, body: 'Not Found' });
  for (const name of C.CONFIG_NAMES) {
    routes.push({ match: `${C.RAW_BASE}/config/${name}.json`, json: cfg[name === 'macro-events' ? 'macro' : name] });
  }
  return createFakeAdapter({ now, routes, calendar: opts.calendar || calendarEvents(), cache: opts.cache });
}

module.exports = { ROOT, loadConfigs, calendarEvents, twseResponse, noticesFeed, youbikeFeed, scenarioAdapter, readJson, readText };
