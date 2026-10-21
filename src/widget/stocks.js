'use strict';
// Taiwan stock watchlist via the TWSE MIS API (called from the phone).
// Information only: no buy/sell suggestions, signals or scores anywhere.

const T = require('../lib/time');

const MIS_BASE = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp';

function symbolsOf(watchlist) {
  const out = [];
  const seen = new Set();
  const add = (s, theme) => {
    if (!s || !s.code) return;
    const key = `${s.market || 'tse'}_${s.code}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ code: s.code, name: s.name, market: s.market || 'tse', theme: theme || null, key });
  };
  (watchlist.pinned || []).forEach((s) => add(s));
  (watchlist.themes || []).forEach((t) => (t.stocks || []).forEach((s) => add(s, t.name)));
  if (watchlist.index) add(watchlist.index);
  return out;
}

// One request for every symbol: ex_ch=tse_2330.tw|otc_4768.tw|tse_t00.tw
function misUrl(watchlist, nowMs) {
  const ch = symbolsOf(watchlist).map((s) => `${s.key}.tw`).join('|');
  return `${MIS_BASE}?ex_ch=${encodeURIComponent(ch)}&json=1&delay=0${nowMs ? `&_=${nowMs}` : ''}`;
}

function toNum(s) {
  if (s == null) return null;
  const n = parseFloat(String(s).replace(/,/g, ''));
  return isFinite(n) ? n : null;
}

// First positive price from "2415.0000_2410.0000_2405.0000_"
function firstLevel(s) {
  for (const part of String(s || '').split('_')) {
    const n = toNum(part);
    if (n != null && n > 0) return n;
  }
  return null;
}

function parseQuote(row) {
  const prev = toNum(row.y);
  let price = toNum(row.z);
  let priceSource = 'trade';
  if (price == null || price <= 0) {
    // z = "-" (no trade yet in this interval): fall back to best bid / ask, then yesterday's close.
    price = firstLevel(row.b);
    priceSource = 'bid';
    if (price == null) { price = firstLevel(row.a); priceSource = 'ask'; }
    if (price == null) { price = prev; priceSource = 'prev'; }
  }
  const change = price != null && prev ? price - prev : null;
  const d = String(row.d || '');
  return {
    code: row.c,
    misName: row.n,
    market: row.ex,
    price,
    priceSource,
    prev,
    change,
    changePct: change != null && prev ? (change / prev) * 100 : null,
    open: toNum(row.o),
    high: toNum(row.h),
    low: toNum(row.l),
    volume: toNum(row.v),
    dateKey: /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : null,
    time: row.t || null,
  };
}

function parseMis(json) {
  const map = {};
  for (const row of (json && json.msgArray) || []) {
    if (!row || !row.c) continue;
    map[row.c] = parseQuote(row);
  }
  return map;
}

function latestDate(quotes) {
  return Object.values(quotes).map((q) => q.dateKey).filter(Boolean).sort().pop() || null;
}

// { open, dateKey, label } — "盤中 10:35" or "收盤 10/21（三）"
function marketStatus(now, quotes) {
  const p = T.parts(now);
  const dateKey = latestDate(quotes || {});
  const weekday = p.weekday >= 1 && p.weekday <= 5;
  const open = weekday && dateKey === p.dateKey && p.minutes >= 9 * 60 && p.minutes <= 13 * 60 + 30;
  const todayTraded = dateKey === p.dateKey;
  let label = '';
  if (open) label = `盤中 ${T.hm(now)}`;
  else if (dateKey) label = todayTraded ? '今日收盤' : `收盤 ${T.mdw(dateKey)}`;
  return { open, todayTraded, dateKey, label };
}

function withNames(watchlist, quotes) {
  const out = {};
  for (const s of symbolsOf(watchlist)) {
    const q = quotes[s.code];
    if (q) out[s.code] = { ...q, name: s.name || q.misName, theme: s.theme };
  }
  return out;
}

// Theme row: average change and the biggest gainer / loser.
function themeSummary(theme, quotes, metric = (q) => q.changePct) {
  const rows = (theme.stocks || [])
    .map((s) => ({ s, q: quotes[s.code] }))
    .filter((x) => x.q && metric(x.q) != null)
    .map((x) => ({ code: x.s.code, name: x.s.name, value: metric(x.q) }));
  if (!rows.length) return { name: theme.name, count: 0, avg: null, top: null, bottom: null };
  const avg = rows.reduce((a, r) => a + r.value, 0) / rows.length;
  const top = rows.reduce((a, b) => (b.value > a.value ? b : a));
  const bottom = rows.reduce((a, b) => (b.value < a.value ? b : a));
  return { name: theme.name, count: rows.length, avg, top, bottom: rows.length > 1 ? bottom : null };
}

// Local history of daily closes, used for the weekend "this week" view.
function updateHistory(history, quotes, keepDays = 15) {
  const h = { ...(history || {}) };
  for (const q of Object.values(quotes || {})) {
    if (!q.dateKey || q.price == null) continue;
    h[q.dateKey] = { ...(h[q.dateKey] || {}), [q.code]: { close: q.price, prev: q.prev } };
  }
  const keys = Object.keys(h).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - keepDays))) delete h[k];
  return h;
}

// Change since last week's close (%), or null when the history doesn't cover it.
function weeklyChange(history, code, refKey) {
  if (!history) return null;
  const monday = T.weekStart(refKey);
  const keys = Object.keys(history).filter((k) => history[k][code]).sort();
  const thisWeek = keys.filter((k) => k >= monday && k <= refKey);
  if (!thisWeek.length) return null;
  const last = history[thisWeek[thisWeek.length - 1]][code].close;
  const before = keys.filter((k) => k < monday).pop();
  let base = before ? history[before][code].close : null;
  if (base == null && T.weekdayOf(thisWeek[0]) === 1) base = history[thisWeek[0]][code].prev;
  if (!base || last == null) return null;
  return ((last - base) / base) * 100;
}

// "2,420" / "341.5" / "46,887.77"
function formatPrice(n) {
  if (n == null) return '—';
  const fixed = Math.abs(n) >= 1000 && Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2).replace(/\.?0+$/, '');
  const [i, f] = fixed.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? `.${f}` : '');
}

// "▲0.62%" / "▼1.73%" / "0.00%"
function formatPct(p, digits = 2) {
  if (p == null) return '—';
  const v = Math.abs(p).toFixed(digits);
  if (Number(v) === 0) return `${(0).toFixed(digits)}%`;
  return `${p > 0 ? '▲' : '▼'}${v}%`;
}

// Taiwan convention: red = up, green = down.
function trendColor(p) {
  if (p == null || Math.abs(p) < 0.005) return 'secondary';
  return p > 0 ? 'up' : 'down';
}

function formatVolume(v) {
  if (v == null) return '—';
  if (v >= 10000) return `${(v / 10000).toFixed(1)} 萬張`;
  return `${formatPrice(Math.round(v))} 張`;
}

module.exports = {
  MIS_BASE,
  symbolsOf,
  misUrl,
  parseQuote,
  parseMis,
  marketStatus,
  withNames,
  themeSummary,
  updateHistory,
  weeklyChange,
  formatPrice,
  formatPct,
  trendColor,
  formatVolume,
};
