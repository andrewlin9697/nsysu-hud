'use strict';
// Turns raw inputs (configs + fetched data) into everything the layouts need. Pure.

const T = require('../lib/time');
const M = require('../lib/macro');
const { dayInfo } = require('./semester');
const S = require('./schedule');
const C = require('./countdown');
const W = require('./weather');
const K = require('./stocks');
const F = require('./feeds');
const { selectMode } = require('./mode');

const WEATHER_STALE_MIN = 180;
const STOCK_STALE_MIN = 20;

function ageMin(t, now) {
  const d = T.parseTime(t);
  return d ? Math.round((now - d) / 60000) : null;
}

function noticesStale(feed, now) {
  const age = ageMin(feed && (feed.checkedAt || feed.updatedAt), now);
  if (age == null) return true;
  const m = T.parts(now).minutes;
  return m >= 7 * 60 + 30 ? age > 90 : age > 8 * 60;
}

function buildWeather(src, now, blocks) {
  const wx = src && src.json ? W.parseForecast(src.json) : null;
  const today = T.dateKey(now);
  const tomorrow = T.addDays(today, 1);
  const age = src ? ageMin(src.fetchedAt, now) : null;
  return {
    wx,
    ok: !!wx,
    error: src && src.error,
    fetchedAt: src && src.fetchedAt ? T.parseTime(src.fetchedAt) : null,
    stale: !wx || age == null || age > WEATHER_STALE_MIN,
    current: W.currentConditions(wx, now),
    today: W.daySummary(wx, today),
    tomorrow: W.daySummary(wx, tomorrow),
    umbrellaToday: wx ? W.umbrellaToday(wx, now) : null,
    umbrellaTomorrow: wx ? W.umbrellaForDay(wx, tomorrow) : null,
    eveningRain: wx ? W.eveningRain(wx, now) : null,
    sun: wx ? W.sunWindow(wx, today, blocks, now) : null,
    notification: W.notificationPlan(wx, now),
  };
}

function buildStocks(src, watchlist, history, now) {
  const raw = src && src.json ? K.parseMis(src.json) : {};
  const quotes = K.withNames(watchlist, raw);
  const status = K.marketStatus(now, quotes);
  const age = src ? ageMin(src.fetchedAt, now) : null;
  const ok = Object.keys(quotes).length > 0;
  const refKey = status.dateKey || T.dateKey(now);
  const weekly = {};
  for (const s of K.symbolsOf(watchlist)) {
    const w = K.weeklyChange(history, s.code, refKey);
    if (w != null) weekly[s.code] = w;
  }
  const themes = (watchlist.themes || []).map((t) => K.themeSummary(t, quotes));
  const weeklyThemes = (watchlist.themes || []).map((t) =>
    K.themeSummary(t, quotes, (q) => (weekly[q.code] == null ? null : weekly[q.code])));
  return {
    ok,
    error: src && src.error,
    fetchedAt: src && src.fetchedAt ? T.parseTime(src.fetchedAt) : null,
    stale: !ok || (status.open && (age == null || age > STOCK_STALE_MIN)),
    quotes,
    status,
    pinned: (watchlist.pinned || []).map((s) => quotes[s.code]).filter(Boolean),
    index: watchlist.index ? quotes[watchlist.index.code] || null : null,
    themes,
    weekly,
    weeklyThemes,
    hasWeekly: Object.keys(weekly).length > 0,
  };
}

function buildContext(now, cfg, data = {}) {
  const p = T.parts(now);
  const today = p.dateKey;
  const tomorrow = T.addDays(today, 1);
  const sem = cfg.semester || {};
  const courseState = data.courseState && data.courseState.json;
  const courses = S.applyCourseState(cfg.courses || { periods: {}, courses: [] }, courseState);
  const mode = selectMode(now, courses, sem);
  const status = S.classStatus(now, courses, sem);

  const calendar = data.calendar || {};
  const items = C.countdownItems(calendar.events || [], now);
  const alerts = C.examAlerts(items, now);

  const todayInfo = dayInfo(today, sem);
  const tomorrowInfo = dayInfo(tomorrow, sem);
  const nextInfo = status.next ? dayInfo(status.next.dateKey, sem) : null;

  const noticesFeed = data.notices && data.notices.json;
  const youbikeFeed = data.youbike && data.youbike.json;

  return {
    now,
    p,
    today,
    tomorrow,
    mode,
    cfg,
    courses,
    status,
    todayInfo,
    tomorrowInfo,
    nextInfo,
    countdown: { items, alerts, error: calendar.error || null },
    exams: {
      today: todayInfo.exam,
      todayWeek: todayInfo.exam ? C.examsInWeek(items, today) : null,
      next: nextInfo && nextInfo.exam ? C.examsInWeek(items, status.next.dateKey) : null,
    },
    weather: buildWeather(data.weather, now, status.blocks),
    stocks: buildStocks(data.stocks, cfg.watchlist || {}, data.stockHistory, now),
    macro: { tonight: M.tonight(cfg.macro, now), next: M.upcoming(cfg.macro, now)[0] || null },
    notices: {
      feed: noticesFeed || null,
      missing: !!(data.notices && data.notices.missing),
      error: data.notices && data.notices.error,
      recent: F.recentNotices(noticesFeed, now),
      stale: noticesFeed ? noticesStale(noticesFeed, now) : true,
      checkedAt: noticesFeed ? T.parseTime(noticesFeed.checkedAt || noticesFeed.updatedAt) : null,
    },
    youbike: {
      feed: youbikeFeed || null,
      missing: !!(data.youbike && data.youbike.missing),
      error: data.youbike && data.youbike.error,
      map: F.stationMap(youbikeFeed),
    },
    courseState: courseState || null,
  };
}

module.exports = { buildContext, ageMin, noticesStale };
