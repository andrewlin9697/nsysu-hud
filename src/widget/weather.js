'use strict';
// Open-Meteo forecast (called from the phone): umbrella check, sunshine window, local reminder.

const T = require('../lib/time');

const RAIN_POP = 50; // %
const RAIN_MM = 0.5; // mm per hour
const UMBRELLA_NOTIFICATION_ID = 'nsysu-hud-umbrella';

function num(v) {
  return typeof v === 'number' && isFinite(v) ? v : null;
}

function parseForecast(json) {
  if (!json || !json.hourly || !Array.isArray(json.hourly.time)) return null;
  const h = json.hourly;
  const hours = h.time.map((t, i) => {
    const time = T.parseTime(t);
    const p = T.parts(time);
    return {
      time,
      key: p.dateKey,
      hour: p.hh,
      temp: num(h.temperature_2m && h.temperature_2m[i]),
      apparent: num(h.apparent_temperature && h.apparent_temperature[i]),
      pop: num(h.precipitation_probability && h.precipitation_probability[i]),
      precip: num(h.precipitation && h.precipitation[i]),
      code: num(h.weather_code && h.weather_code[i]),
      uv: num(h.uv_index && h.uv_index[i]),
      isDay: h.is_day ? h.is_day[i] === 1 : p.hh >= 6 && p.hh < 18,
    };
  }).filter((x) => x.time);
  const d = json.daily || {};
  const days = (d.time || []).map((key, i) => ({
    key,
    max: num(d.temperature_2m_max && d.temperature_2m_max[i]),
    min: num(d.temperature_2m_min && d.temperature_2m_min[i]),
    popMax: num(d.precipitation_probability_max && d.precipitation_probability_max[i]),
    uvMax: num(d.uv_index_max && d.uv_index_max[i]),
    sunrise: d.sunrise ? T.parseTime(d.sunrise[i]) : null,
    sunset: d.sunset ? T.parseTime(d.sunset[i]) : null,
  }));
  const c = json.current || null;
  const current = c ? {
    time: T.parseTime(c.time),
    temp: num(c.temperature_2m),
    apparent: num(c.apparent_temperature),
    code: num(c.weather_code),
    isDay: c.is_day === 1,
  } : null;
  return { hours, days, current };
}

// Hours whose timestamp lies in [floor(from), to].
function hoursBetween(wx, from, to) {
  if (!wx) return [];
  const start = from.getTime() - (from.getTime() % 3600000);
  return wx.hours.filter((h) => h.time.getTime() >= start && h.time <= to);
}

function isWet(h) {
  return (h.pop != null && h.pop >= RAIN_POP) || (h.precip != null && h.precip >= RAIN_MM);
}

function score(h) {
  return (h.pop || 0) * 100 + (h.precip || 0);
}

// { need, maxPop, peak, range: { start, end } } — range is the wet stretch around the peak hour.
function umbrellaCheck(hours) {
  if (!hours.length) return null;
  const need = hours.some(isWet);
  let peakIdx = 0;
  hours.forEach((h, i) => { if (score(h) > score(hours[peakIdx])) peakIdx = i; });
  if (need && !isWet(hours[peakIdx])) peakIdx = hours.findIndex(isWet);
  const peak = hours[peakIdx];
  let range = null;
  if (need) {
    let a = peakIdx;
    let b = peakIdx;
    while (a > 0 && isWet(hours[a - 1])) a--;
    while (b < hours.length - 1 && isWet(hours[b + 1])) b++;
    range = { start: hours[a].time, end: new Date(hours[b].time.getTime() + 3600000) };
  }
  const maxPop = Math.max(...hours.map((h) => h.pop || 0));
  return { need, maxPop, peak, range };
}

// Now until 20:00 today.
function umbrellaToday(wx, now) {
  return umbrellaCheck(hoursBetween(wx, now, T.at(T.dateKey(now), '20:00')));
}

// A whole day, 07:00–20:00.
function umbrellaForDay(wx, key) {
  return umbrellaCheck(hoursBetween(wx, T.at(key, '07:00'), T.at(key, '20:00')));
}

// Tonight 18:00–23:00 (or from now if later).
function eveningRain(wx, now) {
  const key = T.dateKey(now);
  const from = now > T.at(key, '18:00') ? now : T.at(key, '18:00');
  return umbrellaCheck(hoursBetween(wx, from, T.at(key, '23:00')));
}

function rangeText(range) {
  return `${T.hm(range.start)}–${T.hm(range.end)}`;
}

// Sunshine window between 09:00 and 15:00, preferring time without class.
// blocks: today's class blocks ({ startMin, endMin }).
function sunWindow(wx, key, blocks, now) {
  if (!wx) return null;
  const DAY_START = 9 * 60;
  const DAY_END = 15 * 60;
  const busy = (blocks || []).map((b) => [b.startMin, b.endMin]).sort((a, b) => a[0] - b[0]);
  // Free gaps; a gap that starts right after a class gets 10 minutes to walk outside.
  const gaps = [];
  let cursor = DAY_START;
  let afterClass = false;
  for (const [s, e] of busy) {
    if (e <= DAY_START || s >= DAY_END) continue;
    if (s > cursor) gaps.push({ from: cursor + (afterClass ? 10 : 0), to: s });
    cursor = Math.max(cursor, e);
    afterClass = true;
  }
  if (cursor < DAY_END) gaps.push({ from: cursor + (afterClass ? 10 : 0), to: DAY_END });
  const nowMin = T.dateKey(now) === key ? T.parts(now).minutes : -1;
  const hours = wx.hours.filter((h) => h.key === key && h.hour >= 9 && h.hour < 15 && h.uv != null);
  const good = [];
  const strong = [];
  for (const h of hours) {
    const uv = Math.round(h.uv); // the UV index is reported as an integer scale
    const slotStart = h.hour * 60;
    const slotEnd = slotStart + 60;
    for (const g of gaps) {
      if (g.to - g.from < 20) continue; // a few minutes between classes isn't a break outside
      const start = Math.max(g.from, slotStart, nowMin);
      if (start >= slotEnd || start >= g.to) continue;
      const room = g.to - start;
      if (uv >= 3 && uv <= 7 && room >= 15) good.push({ start, end: start + Math.min(30, room), uv });
      else if (uv >= 8 && room >= 10) strong.push({ start, end: start + 10, uv });
    }
  }
  const future = (w) => w.end > nowMin;
  const pick = (list, better) => list.filter(future).reduce((best, w) => (!best || better(w, best) ? w : best), null);
  const g = pick(good, (a, b) => a.uv > b.uv);
  if (g) return { kind: 'good', ...g, text: `曬太陽好時段 ${T.minutesToHm(g.start)}–${T.minutesToHm(g.end)}（UV ${g.uv}）` };
  const s = pick(strong, (a, b) => a.uv < b.uv || (a.uv === b.uv && a.start < b.start)); // the mildest strong hour
  if (s) return { kind: 'strong', ...s, text: `UV 很強（${s.uv}），10 分鐘就夠 ${T.minutesToHm(s.start)}–${T.minutesToHm(s.end)}` };
  return null;
}

// What to do with the 07:30 umbrella reminder. null = no data, leave the existing one alone.
function notificationPlan(wx, now) {
  if (!wx) return null;
  const today = T.dateKey(now);
  const key = now < T.at(today, '07:30') ? today : T.addDays(today, 1);
  const u = umbrellaForDay(wx, key);
  if (!u) return null;
  if (!u.need) return { action: 'cancel', id: UMBRELLA_NOTIFICATION_ID };
  const dayWord = key === today ? '今天' : '明天';
  return {
    action: 'schedule',
    id: UMBRELLA_NOTIFICATION_ID,
    at: T.at(key, '07:30'),
    title: '今天要帶傘 ☂️',
    body: `${rangeText(u.range)} 可能下雨（降雨機率 ${u.peak.pop == null ? '?' : u.peak.pop}%），出門記得帶傘。`,
    forDate: key,
    dayWord,
  };
}

// WMO weather codes → Chinese text and SF Symbol.
function describeCode(code, isDay = true) {
  const c = code == null ? -1 : code;
  const sun = isDay ? 'sun.max.fill' : 'moon.stars.fill';
  if (c === 0) return { text: '晴', symbol: sun };
  if (c === 1) return { text: '晴時多雲', symbol: isDay ? 'sun.max.fill' : 'moon.fill' };
  if (c === 2) return { text: '多雲', symbol: isDay ? 'cloud.sun.fill' : 'cloud.moon.fill' };
  if (c === 3) return { text: '陰', symbol: 'cloud.fill' };
  if (c === 45 || c === 48) return { text: '起霧', symbol: 'cloud.fog.fill' };
  if (c >= 51 && c <= 57) return { text: '毛毛雨', symbol: 'cloud.drizzle.fill' };
  if (c === 61 || c === 66) return { text: '小雨', symbol: 'cloud.rain.fill' };
  if (c === 63) return { text: '下雨', symbol: 'cloud.rain.fill' };
  if (c === 65 || c === 67) return { text: '大雨', symbol: 'cloud.heavyrain.fill' };
  if (c >= 71 && c <= 77) return { text: '下雪', symbol: 'cloud.snow.fill' };
  if (c === 80) return { text: '陣雨', symbol: isDay ? 'cloud.sun.rain.fill' : 'cloud.moon.rain.fill' };
  if (c === 81 || c === 82) return { text: '強陣雨', symbol: 'cloud.heavyrain.fill' };
  if (c === 85 || c === 86) return { text: '陣雪', symbol: 'cloud.snow.fill' };
  if (c >= 95) return { text: '雷雨', symbol: 'cloud.bolt.rain.fill' };
  return { text: '—', symbol: 'cloud.fill' };
}

// Weather for a whole day from hourly data (Open-Meteo daily has no weather_code in our URL).
function daySummary(wx, key) {
  if (!wx) return null;
  const hours = wx.hours.filter((h) => h.key === key);
  if (!hours.length) return null;
  const d = wx.days.find((x) => x.key === key) || {};
  const temps = hours.map((h) => h.temp).filter((t) => t != null);
  const daytime = hours.filter((h) => h.hour >= 8 && h.hour <= 18);
  const noon = hours.find((h) => h.hour === 12) || hours[Math.floor(hours.length / 2)];
  const worst = (daytime.length ? daytime : hours).reduce((a, b) => (score(b) > score(a) ? b : a));
  const codeHour = worst.pop != null && worst.pop >= RAIN_POP ? worst : noon;
  return {
    key,
    max: d.max != null ? d.max : temps.length ? Math.max(...temps) : null,
    min: d.min != null ? d.min : temps.length ? Math.min(...temps) : null,
    popMax: d.popMax != null ? d.popMax : Math.max(...hours.map((h) => h.pop || 0)),
    uvMax: d.uvMax != null ? d.uvMax : Math.max(...hours.map((h) => h.uv || 0)),
    code: codeHour.code,
    ...describeCode(codeHour.code, true),
  };
}

function currentConditions(wx, now) {
  if (!wx) return null;
  const hour = hoursBetween(wx, now, now)[0] || null;
  const c = wx.current && wx.current.temp != null ? wx.current : hour;
  if (!c) return null;
  return {
    temp: c.temp,
    apparent: c.apparent,
    code: c.code,
    isDay: c.isDay,
    ...describeCode(c.code, c.isDay),
  };
}

module.exports = {
  RAIN_POP,
  RAIN_MM,
  UMBRELLA_NOTIFICATION_ID,
  parseForecast,
  hoursBetween,
  isWet,
  umbrellaCheck,
  umbrellaToday,
  umbrellaForDay,
  eveningRain,
  rangeText,
  sunWindow,
  notificationPlan,
  describeCode,
  daySummary,
  currentConditions,
};
