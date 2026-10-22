'use strict';
// Loads configs and live data through the adapter, with a local cache and offline fallbacks.
// adapter: { fetch(url, opts) → { status, body }, readCache(key), writeCache(key, value),
//            calendarEvents(start, end), log(msg) } — see adapter-scriptable.js and dev/fake-adapter.js

const T = require('../lib/time');
const K = require('./stocks');
const F = require('./feeds');
const C = require('./constants');
const DEFAULTS = require('./config-defaults');

function ageMinutes(entry, now) {
  const t = entry && T.parseTime(entry.savedAt);
  return t ? (now - t) / 60000 : Infinity;
}

/**
 * Cached JSON GET. → { json, fetchedAt, fromCache, missing, error }
 * opts: { ttl (minutes), allow404, validate(json) → true | error text, timeout }
 */
async function cachedJson(adapter, key, url, opts = {}) {
  const now = adapter.now();
  const entry = adapter.readCache(key);
  const ttl = opts.ttl == null ? 10 : opts.ttl;
  if (entry && ageMinutes(entry, now) < ttl && !opts.forceRefresh) {
    return { json: entry.json || null, missing: !!entry.missing, fetchedAt: entry.savedAt, fromCache: true, error: null };
  }
  let error = null;
  try {
    const res = await adapter.fetch(url, { timeout: opts.timeout || 12 });
    if (res.status === 404 && opts.allow404) {
      const saved = { savedAt: now.toISOString(), json: null, missing: true };
      adapter.writeCache(key, saved);
      return { json: null, missing: true, fetchedAt: saved.savedAt, fromCache: false, error: null };
    }
    if (res.status && (res.status < 200 || res.status >= 300)) throw new Error(`HTTP ${res.status}`);
    const json = JSON.parse(res.body);
    const ok = opts.validate ? opts.validate(json) : true;
    if (ok !== true) throw new Error(typeof ok === 'string' ? ok : '資料格式不對');
    const saved = { savedAt: now.toISOString(), json };
    adapter.writeCache(key, saved);
    return { json, missing: false, fetchedAt: saved.savedAt, fromCache: false, error: null };
  } catch (e) {
    error = (e && e.message) || String(e);
    if (adapter.log) adapter.log(`${key} 抓取失敗：${error}`);
  }
  if (entry) return { json: entry.json || null, missing: !!entry.missing, fetchedAt: entry.savedAt, fromCache: true, error };
  return { json: null, missing: false, fetchedAt: null, fromCache: false, error };
}

async function loadConfig(adapter, opts = {}) {
  const cfg = {};
  const sources = {};
  await Promise.all(C.CONFIG_NAMES.map(async (name) => {
    const r = await cachedJson(adapter, `config-${name}`, `${C.RAW_BASE}/config/${name}.json`, {
      ttl: opts.forceRefresh ? 0 : C.CONFIG_TTL_MIN,
      validate: (j) => (j && typeof j === 'object' && !Array.isArray(j)) || '設定檔格式不對',
    });
    cfg[name] = r.json || DEFAULTS[name];
    sources[name] = r.json ? (r.fromCache ? 'cache' : 'network') : 'builtin';
  }));
  return {
    courses: cfg.courses,
    semester: cfg.semester,
    location: cfg.location,
    watchlist: cfg.watchlist,
    macro: cfg['macro-events'],
    youbike: cfg.youbike,
    _sources: sources,
  };
}

// Stock quotes barely change outside trading hours, so cache them much longer then.
function stockTtl(now) {
  const p = T.parts(now);
  const weekday = p.weekday >= 1 && p.weekday <= 5;
  return weekday && p.minutes >= 8 * 60 + 55 && p.minutes <= 13 * 60 + 40 ? 2 : 30;
}

async function loadCalendar(adapter, now) {
  try {
    const events = await adapter.calendarEvents(now, new Date(now.getTime() + 45 * T.DAY_MS));
    return { events: events || [], error: null };
  } catch (e) {
    return { events: [], error: '讀不到行事曆（請在 App 裡執行一次並允許取用行事曆）' };
  }
}

async function loadWidgetData(adapter, cfg, opts = {}) {
  const now = adapter.now();
  const pages = (f) => `${C.PAGES_BASE}/data/${f}?v=${Math.floor(now.getTime() / 300000)}`;
  const refresh = !!opts.forceRefresh;
  const [calendar, weather, stocks, notices, youbike, courseState] = await Promise.all([
    loadCalendar(adapter, now),
    cachedJson(adapter, 'weather', cfg.location.weather.forecastUrl, {
      ttl: 30,
      forceRefresh: refresh,
      validate: (j) => (j && j.hourly && Array.isArray(j.hourly.time)) || (j && j.reason) || '天氣資料格式不對',
    }),
    cachedJson(adapter, 'twse', K.misUrl(cfg.watchlist, now.getTime()), {
      ttl: stockTtl(now),
      forceRefresh: refresh,
      validate: (j) => (j && Array.isArray(j.msgArray) && j.msgArray.length > 0) || '證交所沒有回傳資料',
    }),
    cachedJson(adapter, 'notices', pages('notices.json'), { ttl: 10, allow404: true, forceRefresh: refresh }),
    cachedJson(adapter, 'youbike', pages('youbike.json'), { ttl: 5, allow404: true, forceRefresh: refresh }),
    cachedJson(adapter, 'course-state', pages('course-state.json'), { ttl: 60, allow404: true, forceRefresh: refresh }),
  ]);
  let stockHistory = null;
  try {
    const prev = adapter.readCache('stock-history');
    stockHistory = stocks.json ? K.updateHistory(prev && prev.json, K.parseMis(stocks.json)) : prev && prev.json;
    if (stocks.json && !stocks.fromCache) adapter.writeCache('stock-history', { savedAt: now.toISOString(), json: stockHistory });
  } catch (e) {
    stockHistory = null;
  }
  return { calendar, weather, stocks, stockHistory, notices, youbike, courseState };
}

// Live YouBike for the in-app dashboard: the full ~6 MB feed, only on demand, cached 2 minutes
// (the cache keeps just the configured stations).
async function loadLiveYoubike(adapter, cfg, opts = {}) {
  const now = adapter.now();
  const entry = adapter.readCache('youbike-live');
  if (entry && ageMinutes(entry, now) < 2 && !opts.forceRefresh) return { ...entry.json, fromCache: true, error: null };
  try {
    const res = await adapter.fetch(cfg.youbike.feedUrl, { timeout: 30 });
    if (res.status && res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const { stations, missing } = F.pickStations(JSON.parse(res.body), cfg.youbike.stations);
    const json = { updatedAt: now.toISOString(), stations, missing };
    adapter.writeCache('youbike-live', { savedAt: now.toISOString(), json });
    return { ...json, fromCache: false, error: null };
  } catch (e) {
    if (entry) return { ...entry.json, fromCache: true, error: e.message };
    return { updatedAt: null, stations: [], missing: [], fromCache: false, error: (e && e.message) || String(e) };
  }
}

module.exports = { cachedJson, loadConfig, loadWidgetData, loadLiveYoubike, loadCalendar, stockTtl };
