// NSYSU-HUD 主程式 v1.0.0（build 4e9b4bbb51）
// 這個檔案是 `npm run build` 自動產生的，請不要直接修改；原始碼在 src/。
// 安裝：只要把 install/HUD-Loader.js 貼到 Scriptable，它會自動下載並每天更新這個檔案。
// https://github.com/andrewlin9697/nsysu-hud
'use strict';
const __HUD_BUILD__ = {"version":"1.0.0","hash":"4e9b4bbb51"};
const __HUD_MODULES__ = {
"config/courses.json": [function (module, exports, require) {
module.exports = {"_source":"NSYSU-OpenDev NSYSUCourseAPI 1151/20261021_160131/all.json（2026-10-22 取得），課號與教室已核對","semester":"1151","timezone":"Asia/Taipei","periods":{"1":["08:10","09:00"],"2":["09:10","10:00"],"3":["10:10","11:00"],"4":["11:10","12:00"],"5":["13:10","14:00"],"6":["14:10","15:00"],"7":["15:10","16:00"],"8":["16:10","17:00"],"9":["17:10","18:00"],"C":["12:10","13:00"]},"courses":[{"id":"EE1700B","name":"數位系統設計","short":"數位設計","nameEn":"Design of Digital Systems","teacher":"王朝欽","weekday":1,"periods":"234","room":"工EC 3009","building":"EC"},{"id":"CHEM115","name":"學術英語：化學實驗寫作與表達","short":"英語化學","nameEn":"Academic Writing for Experimental Reports in Chemistry","teacher":"傅安德","weekday":1,"periods":"567","room":"西SW 1007","building":"SW"},{"id":"GENL0001J","name":"中文思辨與表達（一）","short":"中文思辨","nameEn":"Critical Thinking and Expression in Chinese (I)","teacher":"陳明聖","weekday":2,"periods":"234","room":"醫IL 3017","building":"IL"},{"id":"GESP408","name":"國際商務領導英語（高級）","short":"商務英文","nameEn":"English for International Business Leadership (Advanced)","teacher":"傅安德","weekday":2,"periods":"567","room":"管CM 1019","building":"CM"},{"id":"EE1300B","name":"計算機概論","short":"計概","nameEn":"Introduction to Computers","teacher":"翁愷貽","weekday":3,"periods":"234","room":"工EC 2002","building":"EC"},{"id":"EE1301B","name":"計算機程式","short":"C++","nameEn":"Computer Programming","teacher":"魏家博","weekday":4,"periods":"234","room":"工EC 3014","building":"EC"},{"id":"EE1003B","name":"微積分（一）","short":"微積分","nameEn":"Calculus (I)","teacher":"陳美如","weekday":5,"periods":"234","room":"工EC 2011","building":"EC"},{"id":"PHY102E","name":"普通物理（一）","short":"普物","nameEn":"General Physics (I)","teacher":"岩本祥","weekday":5,"periods":"567","room":"工EC 3013","building":"EC"}],"buildingToYouBike":{"EC":"501209051","CM":"501209039","SW":"501209070","IL":"501209052","_note":"EC=工學院、CM=管理學院（社科院與管院之間的站）。SW、IL 沒有確認過最近的站，先用西灣藝廊、圖資大樓，之後可改。"}};
}, {}],

"config/location.json": [function (module, exports, require) {
module.exports = {"name":"中山大學（西子灣）","lat":22.627,"lng":120.266,"timezone":"Asia/Taipei","weather":{"provider":"open-meteo","forecastUrl":"https://api.open-meteo.com/v1/forecast?latitude=22.627&longitude=120.266&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,uv_index,is_day&daily=sunrise,sunset,uv_index_max,precipitation_probability_max,temperature_2m_max,temperature_2m_min&current=temperature_2m,apparent_temperature,weather_code,is_day&timezone=Asia%2FTaipei&forecast_days=2","_note":"Open-Meteo 免費、免金鑰，但限制是「每個 IP 每天」。由手機直接呼叫（手機 IP 用量很小）；不要從 GitHub Actions 或雲端開發環境大量呼叫，共用 IP 很容易被擋（2026-10-22 測試時雲端 IP 已被擋）。"}};
}, {}],

"config/macro-events.json": [function (module, exports, require) {
module.exports = {"_note":"美股大事。at 為台北時間（+08:00），已依美東夏令／冬令時間換算。confirmed=false 表示日期為預估，公司正式公布後要更新。","_sources":["FOMC: https://fedratecalc.com/fomc-meeting-schedule/ （Fed 公布之 2026 與 2027 暫定日程；決議 14:00 ET）","CPI: https://www.bls.gov/schedule/news_release/cpi.htm （08:30 ET）","NVIDIA: https://days.to/nvidia-earnings （預估，尚未官方確認；17:00 ET）"],"events":[{"type":"FOMC","title":"聯準會利率決議","at":"2026-10-29T02:00:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（10 月）","at":"2026-11-10T21:30:00+08:00","confirmed":true},{"type":"EARNINGS","title":"輝達財報（FY27 Q3）","at":"2026-11-19T06:00:00+08:00","confirmed":false},{"type":"FOMC","title":"聯準會利率決議（含經濟預測）","at":"2026-12-10T03:00:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（11 月）","at":"2026-12-10T21:30:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（12 月）","at":"2027-01-13T21:30:00+08:00","confirmed":true},{"type":"FOMC","title":"聯準會利率決議","at":"2027-01-28T03:00:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（1 月）","at":"2027-02-11T21:30:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（2 月）","at":"2027-03-10T21:30:00+08:00","confirmed":true},{"type":"FOMC","title":"聯準會利率決議（含經濟預測）","at":"2027-03-18T02:00:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（3 月）","at":"2027-04-13T20:30:00+08:00","confirmed":true},{"type":"FOMC","title":"聯準會利率決議","at":"2027-04-29T02:00:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（4 月）","at":"2027-05-12T20:30:00+08:00","confirmed":true},{"type":"FOMC","title":"聯準會利率決議（含經濟預測）","at":"2027-06-10T02:00:00+08:00","confirmed":true},{"type":"CPI","title":"美國 CPI（5 月）","at":"2027-06-10T20:30:00+08:00","confirmed":true}]};
}, {}],

"config/semester.json": [function (module, exports, require) {
module.exports = {"_source":"中山大學教務處 115 學年度行事曆 ICAL（115.06.08 更新），https://oaa.nsysu.edu.tw/p/406-1003-377912,r1896.php","semester":"1151","classesStart":"2026-09-07","midtermWeek":{"start":"2026-10-27","end":"2026-10-30","note":"期中考試（授課教師另有規定者依其規定）"},"finalWeek":{"start":"2026-12-21","end":"2026-12-24","note":"期末考試"},"winterBreakStart":"2026-12-28","semesterEnd":"2027-01-31","noClassDays":[{"date":"2026-09-25","name":"中秋節放假"},{"date":"2026-09-28","name":"教師節放假"},{"date":"2026-10-09","name":"國慶紀念日補假"},{"date":"2026-10-10","name":"國慶紀念日放假"},{"date":"2026-10-25","name":"臺灣光復節放假"},{"date":"2026-12-25","name":"行憲紀念日放假"},{"date":"2027-01-01","name":"元旦放假"}],"events":[{"start":"2026-11-02","end":"2026-11-13","name":"校慶系列活動（照常上課）"}],"nextSemesterStart":"2027-02-22"};
}, {}],

"config/watchlist.json": [function (module, exports, require) {
module.exports = {"_note":"market: tse = 上市, otc = 上櫃（TWSE MIS API 用 tse_XXXX.tw / otc_XXXX.tw）。題材分組來自使用者「科技拆解」學習內容。只顯示資訊，不要產生買賣建議或訊號。","pinned":[{"code":"2330","name":"台積電","market":"tse"}],"themes":[{"name":"ABF 載板","stocks":[{"code":"3037","name":"欣興","market":"tse"},{"code":"8046","name":"南電","market":"tse"},{"code":"3189","name":"景碩","market":"tse"}]},{"name":"800V 高壓供電","stocks":[{"code":"2308","name":"台達電","market":"tse"},{"code":"2301","name":"光寶科","market":"tse"},{"code":"6781","name":"AES-KY","market":"tse"},{"code":"3665","name":"貿聯-KY","market":"tse"}]},{"name":"矽電容","stocks":[{"code":"6770","name":"力積電","market":"tse"},{"code":"2344","name":"華邦電","market":"tse"},{"code":"6531","name":"愛普","market":"tse"}]},{"name":"玻璃基板","stocks":[{"code":"4768","name":"晶呈科技","market":"otc"},{"code":"1595","name":"川寶","market":"otc"},{"code":"8027","name":"鈦昇","market":"otc"},{"code":"3481","name":"群創","market":"tse"},{"code":"3673","name":"TPK-KY","market":"tse"},{"code":"3055","name":"蔚華科","market":"tse"}]},{"name":"被動元件","stocks":[{"code":"2327","name":"國巨","market":"tse"},{"code":"2492","name":"華新科","market":"tse"}]}],"index":{"code":"t00","name":"加權指數","market":"tse"}};
}, {}],

"config/youbike.json": [function (module, exports, require) {
module.exports = {"_source":"https://apis.youbike.com.tw/json/station-yb2.json（全台約 9700 站、約 6.3 MB，含即時車數）。2026-10-22 核對過站號。","feedUrl":"https://apis.youbike.com.tw/json/station-yb2.json","fields":{"bikes":"available_spaces（可借車輛）","docks":"empty_spaces（可還空位）","total":"parking_spaces","updated":"updated_at（台北時間字串）"},"stations":[{"no":"501209051","name":"中山大學工學院","lat":22.62666,"lng":120.26659,"favorite":true},{"no":"501209052","name":"中山大學圖資大樓","lat":22.62708,"lng":120.26611,"favorite":true},{"no":"501209054","name":"中山大學材料大樓","lat":22.6271,"lng":120.26689},{"no":"501209069","name":"中山大學體育館","lat":22.62513,"lng":120.26607},{"no":"501209039","name":"中山大學社科院","lat":22.62617,"lng":120.26504},{"no":"501209070","name":"中山大學西灣藝廊","lat":22.62727,"lng":120.26503},{"no":"501209040","name":"中山大學海工館","lat":22.62875,"lng":120.26259},{"no":"501209071","name":"中山大學海資館","lat":22.63037,"lng":120.26234},{"no":"501209032","name":"西子灣風景區","lat":22.61824,"lng":120.26609},{"no":"501209026","name":"捷運哈瑪星站(1號出口)","lat":22.622126,"lng":120.273481,"favorite":true},{"no":"501209023","name":"捷運哈瑪星站(2號出口)","lat":22.62118,"lng":120.27523}]};
}, {}],

"src/lib/macro.js": [function (module, exports, require) {
'use strict';
// US macro events (config/macro-events.json). Shared by the widget and the macro-reminder workflow.

const T = require('./time');

function normalizeEvents(config) {
  const list = (config && config.events) || [];
  return list
    .map((e) => ({ ...e, time: T.parseTime(e.at) }))
    .filter((e) => e.time)
    .sort((a, b) => a.time - b.time);
}

function upcoming(config, now) {
  return normalizeEvents(config).filter((e) => e.time > now);
}

// End of "tonight": the next 06:00 Taipei after now.
function tonightEnd(now) {
  const p = T.parts(now);
  const key = p.minutes < 360 ? p.dateKey : T.addDays(p.dateKey, 1);
  return T.at(key, '06:00');
}

// Events from now until the next 06:00 (inclusive).
function tonight(config, now) {
  const end = tonightEnd(now);
  return upcoming(config, now).filter((e) => e.time <= end);
}

function shortHm(date) {
  const p = T.parts(date);
  return `${p.hh}:${T.pad2(p.mm)}`;
}

// "今晚 21:30" / "凌晨 2:00" / "清晨 6:00" for an event within tonight's window.
function nightLabel(time, now) {
  const p = T.parts(time);
  const sameDay = p.dateKey === T.dateKey(now);
  if (p.hh < 5) return `凌晨 ${shortHm(time)}`;
  if (p.hh < 7) return `清晨 ${shortHm(time)}`;
  if (sameDay && p.hh >= 18) return `今晚 ${T.hm(time)}`;
  return `${sameDay ? '今天' : '明天'} ${T.hm(time)}`;
}

function daysUntil(time, now) {
  return T.diffDays(T.dateKey(now), T.dateKey(time));
}

// "11/10（二）21:30"
function whenText(time) {
  return `${T.mdw(T.dateKey(time))}${T.hm(time)}`;
}

// "美國 CPI（10 月） 11/10（二）21:30，還有 20 天"
function countdownText(event, now) {
  const days = daysUntil(event.time, now);
  const rest = days === 0 ? '今天' : days === 1 ? '明天' : `還有 ${days} 天`;
  return `${event.title} ${whenText(event.time)}，${rest}${event.confirmed === false ? '（預估）' : ''}`;
}

function reminderLine(event, now) {
  return `${nightLabel(event.time, now)} ${event.title}${event.confirmed === false ? '（預估）' : ''}`;
}

module.exports = {
  normalizeEvents,
  upcoming,
  tonight,
  tonightEnd,
  nightLabel,
  daysUntil,
  whenText,
  countdownText,
  reminderLine,
};
}, {"./time":"src/lib/time.js"}],

"src/lib/time.js": [function (module, exports, require) {
'use strict';
// Taipei wall-clock helpers. Taiwan has no DST, so a fixed +08:00 offset is exact,
// and doing the math by hand keeps results identical on the phone, in Actions and in tests.

const OFFSET_MS = 8 * 3600 * 1000;
const DAY_MS = 86400 * 1000;
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parts(date) {
  const t = new Date(date.getTime() + OFFSET_MS);
  const y = t.getUTCFullYear();
  const m = t.getUTCMonth() + 1;
  const d = t.getUTCDate();
  const hh = t.getUTCHours();
  const mm = t.getUTCMinutes();
  return {
    y, m, d, hh, mm,
    ss: t.getUTCSeconds(),
    weekday: t.getUTCDay(),
    minutes: hh * 60 + mm,
    dateKey: `${y}-${pad2(m)}-${pad2(d)}`,
  };
}

function dateKey(date) {
  return parts(date).dateKey;
}

function hm(date) {
  const p = parts(date);
  return `${pad2(p.hh)}:${pad2(p.mm)}`;
}

// "HH:MM" → minutes after midnight
function toMinutes(time) {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToHm(min) {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

// Taipei date "YYYY-MM-DD" (+ optional "HH:MM" or minutes) → Date
function at(key, time) {
  const [y, m, d] = key.split('-').map(Number);
  const min = time == null ? 0 : typeof time === 'number' ? time : toMinutes(time);
  return new Date(Date.UTC(y, m - 1, d) + min * 60000 - OFFSET_MS);
}

function addDays(key, n) {
  return dateKey(new Date(at(key).getTime() + n * DAY_MS));
}

function diffDays(fromKey, toKey) {
  return Math.round((at(toKey).getTime() - at(fromKey).getTime()) / DAY_MS);
}

function weekdayOf(key) {
  return parts(at(key)).weekday;
}

// Monday of the week containing key (weeks run Monday–Sunday)
function weekStart(key) {
  return addDays(key, -((weekdayOf(key) + 6) % 7));
}

function startOfDay(date) {
  return at(dateKey(date));
}

function addMinutes(date, min) {
  return new Date(date.getTime() + min * 60000);
}

// Accepts ISO strings with offset/Z, "YYYY-MM-DD" (Taipei midnight),
// "YYYY-MM-DDTHH:MM[:SS]" or "YYYY-MM-DD HH:MM:SS" without offset (Taipei local).
// JavaScriptCore and V8 disagree on offset-less strings, so those are parsed by hand.
function parseTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  const local = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(s);
  if (local) {
    const [, y, mo, d, h = '0', mi = '0', se = '0'] = local;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +se) - OFFSET_MS);
  }
  const t = new Date(s);
  return isNaN(t.getTime()) ? null : t;
}

function weekdayName(key) {
  return WEEKDAY_NAMES[weekdayOf(key)];
}

// "10/22"
function md(key) {
  const [, m, d] = key.split('-').map(Number);
  return `${m}/${d}`;
}

// "10/22（四）"
function mdw(key) {
  return `${md(key)}（${weekdayName(key)}）`;
}

// "35 分鐘" / "1 小時 40 分" / "2 小時"
function durationText(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} 分鐘`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} 小時 ${r} 分` : `${h} 小時`;
}

// Relative day label used for "next class" style text.
function relDayLabel(fromKey, toKey) {
  const diff = diffDays(fromKey, toKey);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  const weekDiff = diffDays(weekStart(fromKey), weekStart(toKey)) / 7;
  if (weekDiff === 0) return diff === 2 ? '後天' : `週${weekdayName(toKey)}`;
  if (weekDiff === 1) return `下週${weekdayName(toKey)}`;
  return mdw(toKey);
}

module.exports = {
  OFFSET_MS,
  DAY_MS,
  WEEKDAY_NAMES,
  pad2,
  parts,
  dateKey,
  hm,
  toMinutes,
  minutesToHm,
  at,
  addDays,
  diffDays,
  weekdayOf,
  weekStart,
  startOfDay,
  addMinutes,
  parseTime,
  weekdayName,
  md,
  mdw,
  durationText,
  relDayLabel,
};
}, {}],

"src/widget/adapter-scriptable.js": [function (module, exports, require) {
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
}, {"./countdown":"src/widget/countdown.js"}],

"src/widget/app.js": [function (module, exports, require) {
'use strict';
// Full dashboard shown when the widget is tapped (runs inside the Scriptable app) — a native UITable
// with segment-style tabs.

const T = require('../lib/time');
const M = require('../lib/macro');
const K = require('./stocks');
const F = require('./feeds');
const W = require('./weather');
const S = require('./schedule');
const { dayInfo } = require('./semester');

const TABS = [
  ['countdown', '倒數'],
  ['schedule', '課表'],
  ['stocks', '台股'],
  ['youbike', '單車'],
  ['notices', '公告'],
  ['weather', '天氣'],
];

function createApp(deps) {
  const { sc, theme } = deps;
  const table = new sc.UITable();
  table.showSeparators = true;
  const state = { tab: deps.initialTab || 'countdown', youbike: null, youbikeLoading: false };

  const header = (title, subtitle) => {
    const r = new sc.UITableRow();
    r.isHeader = true;
    r.height = subtitle ? 56 : 40;
    const c = subtitle ? r.addText(title, subtitle) : r.addText(title);
    c.titleFont = sc.Font.boldSystemFont(subtitle ? 22 : 17);
    if (subtitle) {
      c.subtitleFont = sc.Font.systemFont(13);
      c.subtitleColor = theme('secondary');
    }
    table.addRow(r);
    return r;
  };

  const section = (title) => {
    const r = new sc.UITableRow();
    r.height = 34;
    r.backgroundColor = theme('card');
    const c = r.addText(title);
    c.titleFont = sc.Font.semiboldSystemFont(13);
    c.titleColor = theme('secondary');
    table.addRow(r);
  };

  // item = { title, subtitle, value, valueColor, titleColor, onSelect, height }
  const item = (o) => {
    const r = new sc.UITableRow();
    r.height = o.height || (o.subtitle ? 58 : 44);
    r.cellSpacing = 8;
    const left = o.subtitle ? r.addText(o.title, o.subtitle) : r.addText(o.title);
    left.titleFont = o.bold ? sc.Font.semiboldSystemFont(15) : sc.Font.systemFont(15);
    left.titleColor = theme(o.titleColor || 'primary');
    left.subtitleFont = sc.Font.systemFont(12);
    left.subtitleColor = theme('secondary');
    left.widthWeight = o.value ? 70 : 100;
    if (o.value) {
      const right = o.valueSub ? r.addText(o.value, o.valueSub) : r.addText(o.value);
      right.rightAligned();
      right.widthWeight = 30;
      right.titleFont = sc.Font.semiboldSystemFont(15);
      right.titleColor = theme(o.valueColor || 'secondary');
      right.subtitleFont = sc.Font.systemFont(11);
      right.subtitleColor = theme('secondary');
    }
    if (o.onSelect) {
      r.onSelect = o.onSelect;
      r.dismissOnSelect = false;
    }
    table.addRow(r);
    return r;
  };

  const note = (text) => item({ title: text, titleColor: 'gray' });

  const tabsRow = () => {
    const r = new sc.UITableRow();
    r.height = 44;
    for (const [key, label] of TABS) {
      const b = r.addButton(label);
      b.centerAligned();
      b.titleColor = key === state.tab ? theme('blue') : theme('secondary');
      b.titleFont = key === state.tab ? sc.Font.boldSystemFont(15) : sc.Font.systemFont(15);
      b.onTap = () => {
        state.tab = key;
        render();
      };
      b.dismissOnTap = false;
    }
    table.addRow(r);
  };

  const alertBox = async (title, message) => {
    const a = new sc.Alert();
    a.title = title;
    a.message = message;
    a.addAction('好');
    await a.presentAlert();
  };

  // ------------------------------------------------------------ tabs

  function countdownTab(ctx) {
    const items = ctx.countdown.items;
    section(`考試與截止（45 天內 · ${items.length} 項）`);
    if (ctx.countdown.error) note(ctx.countdown.error);
    if (!items.length) note('沒有符合關鍵字的行事曆事件');
    for (const e of items) {
      const when = e.allDay ? `${T.mdw(e.startKey)} 全天` : `${T.mdw(e.startKey)} ${T.hm(e.start)}`;
      item({
        title: `${e.kind === 'exam' ? '✎' : '⏰'} ${e.display}`,
        subtitle: `${when}${e.uncertain ? ' · 日期未確定（留意公告）' : ''}${e.location ? ` · ${e.location}` : ''}`,
        titleColor: e.uncertain ? 'gray' : 'primary',
        value: e.label,
        valueColor: e.color,
        onSelect: () => alertBox(e.title, [
          e.allDay ? `${T.mdw(e.startKey)}${e.lastKey !== e.startKey ? `–${T.mdw(e.lastKey)}` : ''}（全天）` : `${T.mdw(e.startKey)} ${T.hm(e.start)}–${T.hm(e.end)}`,
          e.location ? `地點：${e.location}` : null,
          e.calendar ? `行事曆：${e.calendar}` : null,
          e.notes ? `\n${e.notes}` : null,
        ].filter(Boolean).join('\n')),
      });
    }
    section('美股大事（台北時間）');
    const events = M.upcoming(ctx.cfg.macro, ctx.now).slice(0, 6);
    if (!events.length) note('config/macro-events.json 沒有之後的事件');
    for (const e of events) {
      const days = M.daysUntil(e.time, ctx.now);
      item({
        title: e.title,
        subtitle: `${M.whenText(e.time)}${e.confirmed === false ? ' · 預估，尚未正式公布' : ''}`,
        value: days <= 0 ? '今天' : days === 1 ? '明天' : `${days} 天`,
      });
    }
  }

  function scheduleTab(ctx) {
    const st = ctx.status;
    section(`今天 ${T.mdw(ctx.today)}${ctx.todayInfo.exam ? ` · ${ctx.todayInfo.exam.label}` : ''}`);
    if (!ctx.todayInfo.classDay) note(`今天沒有課（${ctx.todayInfo.offLabel || '放假'}）`);
    else if (!st.blocks.length) note('今天沒有課');
    for (const b of st.blocks) {
      const now = st.current && st.current.startMin === b.startMin && st.current.course.id === b.course.id;
      item({
        title: `${b.start}–${b.end}  ${b.course.name}`,
        subtitle: `${b.course.room}${b.course.roomChanged ? `（原 ${b.course.configRoom}，已異動）` : ''} · ${b.course.teacher || ''}`,
        titleColor: b.endAt <= ctx.now ? 'gray' : 'primary',
        value: now ? `剩 ${st.current.minutesLeft} 分` : b.endAt <= ctx.now ? '已下課' : '',
        valueColor: now ? 'blue' : 'gray',
      });
    }
    if (st.next && st.next.dateKey !== ctx.today) {
      item({ title: `下一堂：${st.next.rel} ${st.next.start} ${st.next.course.short || st.next.course.name}`, subtitle: st.next.course.room, titleColor: 'secondary' });
    }
    const monday = T.weekStart(ctx.today);
    section(`本週課表（${T.md(monday)}–${T.md(T.addDays(monday, 4))}）`);
    for (let i = 0; i < 5; i++) {
      const key = T.addDays(monday, i);
      const info = dayInfo(key, ctx.cfg.semester || {});
      const blocks = S.blocksForDate(key, ctx.courses, ctx.cfg.semester || {});
      const text = blocks.length ? blocks.map((b) => `${b.start} ${b.course.short || b.course.name}`).join('、') : info.offLabel || '沒有課';
      item({ title: `週${T.weekdayName(key)} ${T.md(key)}${info.exam ? ' · 考試週' : ''}`, subtitle: text, titleColor: key === ctx.today ? 'blue' : 'primary' });
    }
    const changes = (ctx.courseState && ctx.courseState.changes) || [];
    if (changes.length) {
      section('最近的課程異動');
      for (const c of changes.slice(0, 5)) item({ title: c.message, subtitle: `${T.mdw(T.dateKey(T.parseTime(c.at)))} 偵測到`, titleColor: 'orange' });
    }
  }

  function stocksTab(ctx) {
    const s = ctx.stocks;
    section(`台股觀察清單 · ${s.status.label || '—'}`);
    if (!s.ok) {
      note(`台股資料暫時抓不到${s.error ? `（${s.error}）` : ''}`);
      return;
    }
    const stockItem = (q, name) => item({
      title: `${name || q.name}  ${q.code}`,
      subtitle: `成交量 ${K.formatVolume(q.volume)}${q.priceSource !== 'trade' ? ` · 參考價（${{ bid: '買一', ask: '賣一', prev: '昨收' }[q.priceSource]}）` : ''}`,
      value: K.formatPrice(q.price),
      valueSub: K.formatPct(q.changePct),
      valueColor: K.trendColor(q.changePct),
    });
    for (const q of s.pinned) stockItem(q);
    if (s.index) item({ title: `${s.index.name}`, subtitle: `昨收 ${K.formatPrice(s.index.prev)}`, value: K.formatPrice(s.index.price), valueSub: K.formatPct(s.index.changePct), valueColor: K.trendColor(s.index.changePct) });
    const wl = ctx.cfg.watchlist || {};
    (wl.themes || []).forEach((theme, i) => {
      const sum = s.themes[i];
      section(`${theme.name}　平均 ${K.formatPct(sum && sum.avg)}`);
      for (const st of theme.stocks) {
        const q = s.quotes[st.code];
        if (q) stockItem(q, st.name);
        else item({ title: `${st.name}  ${st.code}`, subtitle: '沒有資料', titleColor: 'gray' });
      }
    });
    note('紅漲綠跌 · 資料來自證交所基本市況報導，僅供參考。');
  }

  function youbikeTab(ctx) {
    const live = state.youbike;
    const fromPages = ctx.youbike.feed;
    const stations = (live && live.stations && live.stations.length ? live.stations : (fromPages && fromPages.stations)) || [];
    const usingLive = !!(live && live.stations && live.stations.length);
    section(usingLive ? `即時資料 · ${live.updatedAt ? T.hm(T.parseTime(live.updatedAt)) : ''}${live.fromCache ? '（2 分鐘內的快取）' : ''}` : '雲端每 10 分鐘更新的資料');
    if (state.youbikeLoading) note('正在抓即時資料（約 6 MB）…');
    if (live && live.error) note(`即時資料抓不到：${live.error}`);
    if (!stations.length) note('沒有 YouBike 資料');
    const sorted = stations.slice().sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
    for (const st of sorted) {
      const upd = F.stationUpdatedAt(st, usingLive ? live : fromPages);
      const stale = F.isStationStale(st, usingLive ? live : fromPages, ctx.now);
      item({
        title: `${st.favorite ? '★ ' : ''}${F.shortStationName(st.name)}`,
        subtitle: `可還 ${st.docks == null ? '—' : st.docks} · 共 ${st.total == null ? '—' : st.total} 位${upd ? ` · ${T.hm(upd)} 更新` : ''}${st.status != null && st.status !== 1 ? ' · 暫停營運' : ''}`,
        value: `可借 ${st.bikes == null ? '—' : st.bikes}`,
        valueColor: stale ? 'gray' : st.bikes <= 2 ? 'orange' : 'primary',
        titleColor: stale ? 'gray' : 'primary',
      });
    }
    item({ title: '重新抓即時資料', titleColor: 'blue', onSelect: () => loadYoubike(true) });
  }

  function noticesTab(ctx) {
    const n = ctx.notices;
    const list = F.sortedNotices(n.feed);
    const recent = new Set(n.recent.map((x) => x.id));
    section(`公告（${list.length} 則${n.checkedAt ? ` · ${T.hm(n.checkedAt)} 檢查` : ''}）`);
    if (!n.feed) note(n.missing ? '公告資料還沒建立（GitHub Actions 第一次執行後就會有）' : '公告資料暫時抓不到');
    for (const e of (n.feed && n.feed.errors) || []) note(`⚠︎ ${e.name || e.source}：${e.message}`);
    for (const x of list.slice(0, 80)) {
      item({
        title: `${recent.has(x.id) ? '🆕 ' : ''}${x.title}`,
        subtitle: `${x.group}${x.unit ? `・${x.unit}` : ''}${x.date ? ` · ${x.date.replace(/-/g, '/')}` : ''}`,
        onSelect: () => sc.Safari.open(x.url),
        height: 64,
      });
    }
  }

  function weatherTab(ctx) {
    const w = ctx.weather;
    section(`天氣（${ctx.cfg.location.name}）${w.fetchedAt ? ` · ${T.hm(w.fetchedAt)} 更新` : ''}`);
    if (!w.ok) {
      note(`天氣暫時抓不到${w.error ? `（${w.error}）` : ''}`);
      return;
    }
    if (w.current) item({ title: `現在 ${Math.round(w.current.temp)}° ${w.current.text}`, subtitle: w.current.apparent != null ? `體感 ${Math.round(w.current.apparent)}°` : null, bold: true });
    const u = w.umbrellaToday;
    if (u) item({ title: u.need ? `要帶傘：${W.rangeText(u.range)} 最可能下雨` : '到 20:00 不用帶傘', subtitle: `降雨機率最高 ${u.maxPop}%`, titleColor: u.need ? 'orange' : 'primary' });
    if (w.sun) item({ title: w.sun.text, titleColor: w.sun.kind === 'strong' ? 'orange' : 'primary' });
    const plan = w.notification;
    if (plan) item({ title: plan.action === 'schedule' ? `已排 ${plan.dayWord} 07:30 帶傘提醒` : '明早不需要帶傘提醒', titleColor: 'secondary' });
    section('逐時預報（溫度 · 降雨機率 · 雨量 · UV）');
    const hours = W.hoursBetween(w.wx, ctx.now, new Date(ctx.now.getTime() + 24 * 3600000));
    for (const h of hours) {
      const d = W.describeCode(h.code, h.isDay);
      item({
        title: `${h.key === ctx.today ? '' : '明天 '}${T.pad2(h.hour)}:00  ${d.text}`,
        subtitle: `降雨 ${h.pop == null ? '—' : h.pop}% · ${h.precip == null ? '—' : h.precip} mm · UV ${h.uv == null ? '—' : Math.round(h.uv)}`,
        value: `${Math.round(h.temp)}°`,
        valueColor: W.isWet(h) ? 'blue' : 'primary',
        height: 50,
      });
    }
  }

  // ------------------------------------------------------------ footer

  function footer(ctx) {
    section('其他');
    if (deps.previewWidget) {
      item({ title: '預覽大尺寸小工具', titleColor: 'blue', onSelect: () => deps.previewWidget('large') });
      item({ title: '預覽中尺寸小工具', titleColor: 'blue', onSelect: () => deps.previewWidget('medium') });
      item({ title: '預覽小尺寸小工具', titleColor: 'blue', onSelect: () => deps.previewWidget('small') });
    }
    if (deps.refresh) item({ title: '重新抓所有資料', titleColor: 'blue', onSelect: () => deps.refresh() });
    if (deps.updateScript) item({ title: '立即更新主程式與設定', subtitle: '平常一天自動檢查一次', titleColor: 'blue', onSelect: () => deps.updateScript() });
    const src = ctx.cfg._sources || {};
    const builtin = Object.keys(src).filter((k) => src[k] === 'builtin');
    item({
      title: `NSYSU HUD ${deps.version || ''}`,
      subtitle: builtin.length ? `設定檔使用內建版本：${builtin.join('、')}` : `模式：${ctx.mode.title}（${ctx.mode.reason}）`,
      titleColor: 'secondary',
    });
  }

  async function loadYoubike(force) {
    if (state.youbikeLoading) return;
    state.youbikeLoading = true;
    render();
    try {
      state.youbike = await deps.loadLiveYoubike({ forceRefresh: !!force });
    } catch (e) {
      state.youbike = { stations: [], error: e.message };
    }
    state.youbikeLoading = false;
    render();
  }

  const TAB_RENDER = { countdown: countdownTab, schedule: scheduleTab, stocks: stocksTab, youbike: youbikeTab, notices: noticesTab, weather: weatherTab };

  function render() {
    const ctx = deps.getContext();
    table.removeAllRows();
    header('NSYSU HUD', `${ctx.mode.title} · ${T.mdw(ctx.today)} ${T.hm(ctx.now)}`);
    tabsRow();
    try {
      TAB_RENDER[state.tab](ctx);
    } catch (e) {
      note(`這一頁暫時無法顯示：${e.message}`);
    }
    footer(ctx);
    table.reload();
    if (state.tab === 'youbike' && !state.youbike && !state.youbikeLoading) loadYoubike(false);
  }

  return {
    table,
    state,
    render,
    loadYoubike,
    async present() {
      render();
      await table.present(true);
    },
  };
}

module.exports = { createApp, TABS };
}, {"../lib/time":"src/lib/time.js","../lib/macro":"src/lib/macro.js","./stocks":"src/widget/stocks.js","./feeds":"src/widget/feeds.js","./weather":"src/widget/weather.js","./schedule":"src/widget/schedule.js","./semester":"src/widget/semester.js"}],

"src/widget/config-defaults.js": [function (module, exports, require) {
'use strict';
// Build-time snapshot of config/*.json, used only when the phone has never downloaded the configs.

module.exports = {
  courses: require('../../config/courses.json'),
  semester: require('../../config/semester.json'),
  location: require('../../config/location.json'),
  watchlist: require('../../config/watchlist.json'),
  'macro-events': require('../../config/macro-events.json'),
  youbike: require('../../config/youbike.json'),
};
}, {"../../config/courses.json":"config/courses.json","../../config/semester.json":"config/semester.json","../../config/location.json":"config/location.json","../../config/watchlist.json":"config/watchlist.json","../../config/macro-events.json":"config/macro-events.json","../../config/youbike.json":"config/youbike.json"}],

"src/widget/constants.js": [function (module, exports, require) {
'use strict';

const REPO = 'andrewlin9697/nsysu-hud';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main`;
const PAGES_BASE = 'https://andrewlin9697.github.io/nsysu-hud';

module.exports = {
  REPO,
  RAW_BASE,
  PAGES_BASE,
  BUNDLE_URL: `${RAW_BASE}/dist/NSYSU-HUD.js`,
  REPO_URL: `https://github.com/${REPO}`,
  CONFIG_NAMES: ['courses', 'semester', 'location', 'watchlist', 'macro-events', 'youbike'],
  CONFIG_TTL_MIN: 6 * 60,
};
}, {}],

"src/widget/context.js": [function (module, exports, require) {
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
}, {"../lib/time":"src/lib/time.js","../lib/macro":"src/lib/macro.js","./semester":"src/widget/semester.js","./schedule":"src/widget/schedule.js","./countdown":"src/widget/countdown.js","./weather":"src/widget/weather.js","./stocks":"src/widget/stocks.js","./feeds":"src/widget/feeds.js","./mode":"src/widget/mode.js"}],

"src/widget/countdown.js": [function (module, exports, require) {
'use strict';
// Exam / deadline countdowns from the iPhone calendar (CalendarEvent.between).

const T = require('../lib/time');

const EXAM_RE = /考試|期中|期末|小考|\b(?:quiz|exam|midterm|final)s?\b/i;
const DEADLINE_RE = /截止|繳交|報名|\b(?:deadline|due)\b/i;
const UNCERTAIN_RE = /^\s*留意公告\s*[:：]\s*/;
// Holiday / birthday calendars are skipped entirely.
const SKIP_CALENDAR_RE = /節日|假日|節慶|holiday|birthday|生日/i;

function classifyTitle(title) {
  const raw = String(title || '').trim();
  const uncertain = UNCERTAIN_RE.test(raw);
  const display = raw.replace(UNCERTAIN_RE, '').trim();
  let kind = null;
  if (EXAM_RE.test(display)) kind = 'exam';
  else if (DEADLINE_RE.test(display)) kind = 'deadline';
  return { kind, uncertain, display };
}

function isSkippedCalendar(name) {
  return SKIP_CALENDAR_RE.test(String(name || ''));
}

// Raw event: { title, start, end, allDay, location?, notes?, calendar? } (Date or string times)
function normalizeEvent(ev) {
  const start = T.parseTime(ev.start);
  if (!start) return null;
  const allDay = !!ev.allDay;
  let end = T.parseTime(ev.end) || start;
  if (allDay && end <= start) end = T.at(T.addDays(T.dateKey(start), 1));
  const startKey = T.dateKey(start);
  // All-day events end at 00:00 of the following day (exclusive). Some sources use 23:59:59 instead.
  let lastKey = T.dateKey(end);
  if (allDay && T.parts(end).minutes === 0 && T.parts(end).ss === 0 && lastKey > startKey) lastKey = T.addDays(lastKey, -1);
  if (allDay) end = T.at(T.addDays(lastKey, 1));
  const c = classifyTitle(ev.title);
  return {
    title: String(ev.title || ''),
    display: c.display,
    kind: c.kind,
    uncertain: c.uncertain,
    allDay,
    start,
    end,
    startKey,
    lastKey,
    location: ev.location || null,
    notes: ev.notes || null,
    calendar: ev.calendar || null,
  };
}

function urgency(days, uncertain) {
  if (uncertain) return 'gray';
  if (days <= 2) return 'red';
  if (days <= 7) return 'orange';
  return 'secondary';
}

function labelFor(item, now) {
  const today = T.dateKey(now);
  const ongoing = item.start <= now && now < item.end;
  const prefix = item.uncertain ? '約 ' : '';
  if (ongoing) return prefix + (item.allDay ? '今天' : '進行中');
  const days = T.diffDays(today, item.startKey);
  if (days === 0) return prefix + (item.allDay ? '今天' : `今天 ${T.hm(item.start)}`);
  if (days === 1) return prefix + (item.allDay ? '明天' : `明天 ${T.hm(item.start)}`);
  return `${prefix}D-${days}`;
}

// Classified, future (or ongoing) events sorted by start; unrelated events are dropped.
function countdownItems(events, now, opts = {}) {
  const today = T.dateKey(now);
  const horizon = opts.days == null ? 45 : opts.days;
  return (events || [])
    .filter((e) => !isSkippedCalendar(e.calendar))
    .map(normalizeEvent)
    .filter((e) => e && e.kind && e.end > now)
    .map((e) => {
      const days = Math.max(0, T.diffDays(today, e.startKey));
      return { ...e, days, label: labelFor(e, now), color: urgency(days, e.uncertain) };
    })
    .filter((e) => e.days <= horizon)
    .sort((a, b) => a.start - b.start || a.display.localeCompare(b.display));
}

// Exams (with a confirmed date) starting within 48 hours, or already in progress.
function examAlerts(items, now) {
  const limit = now.getTime() + 48 * 3600 * 1000;
  return items.filter((e) => e.kind === 'exam' && !e.uncertain && e.start.getTime() <= limit && e.end > now);
}

// Exams in the Monday–Sunday week containing `key` (used during exam weeks).
function examsInWeek(items, key) {
  const from = T.weekStart(key);
  const to = T.addDays(from, 6);
  return items.filter((e) => e.kind === 'exam' && e.startKey <= to && e.lastKey >= from);
}

module.exports = {
  EXAM_RE,
  DEADLINE_RE,
  classifyTitle,
  isSkippedCalendar,
  normalizeEvent,
  countdownItems,
  examAlerts,
  examsInWeek,
  labelFor,
  urgency,
};
}, {"../lib/time":"src/lib/time.js"}],

"src/widget/data.js": [function (module, exports, require) {
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
}, {"../lib/time":"src/lib/time.js","./stocks":"src/widget/stocks.js","./feeds":"src/widget/feeds.js","./constants":"src/widget/constants.js","./config-defaults":"src/widget/config-defaults.js"}],

"src/widget/feeds.js": [function (module, exports, require) {
'use strict';
// Data published by GitHub Actions on GitHub Pages: notices.json, youbike.json.

const T = require('../lib/time');

const YOUBIKE_STALE_MIN = 30;

// Notices first seen in the last `hours` hours. Baseline / old-dated items are "quiet" and never count as new.
function recentNotices(notices, now, hours = 24) {
  const since = now.getTime() - hours * 3600 * 1000;
  return ((notices && notices.items) || [])
    .filter((n) => !n.quiet && n.firstSeen && T.parseTime(n.firstSeen).getTime() >= since)
    .sort((a, b) => String(b.firstSeen).localeCompare(String(a.firstSeen)) || String(b.date || '').localeCompare(String(a.date || '')));
}

function sortedNotices(notices) {
  return ((notices && notices.items) || [])
    .slice()
    .sort((a, b) => String(b.date || b.firstSeen || '').localeCompare(String(a.date || a.firstSeen || '')) ||
      String(b.firstSeen || '').localeCompare(String(a.firstSeen || '')));
}

function stationMap(youbike) {
  const map = {};
  for (const s of (youbike && youbike.stations) || []) map[s.no] = s;
  return map;
}

// Station data age: the station's own timestamp, falling back to when Actions fetched the feed.
function stationAge(station, feed, now) {
  const t = T.parseTime((station && station.updated) || (feed && feed.updatedAt));
  if (!t) return null;
  return Math.max(0, Math.round((now - t) / 60000));
}

function isStationStale(station, feed, now, maxMin = YOUBIKE_STALE_MIN) {
  const age = stationAge(station, feed, now);
  return age == null || age > maxMin;
}

function stationUpdatedAt(station, feed) {
  return T.parseTime((station && station.updated) || (feed && feed.updatedAt));
}

function stationForBuilding(building, coursesCfg) {
  const map = (coursesCfg && coursesCfg.buildingToYouBike) || {};
  return building && map[building] ? map[building] : null;
}

// Short station label: "中山大學工學院" → "工學院"
function shortStationName(name) {
  return String(name || '').replace(/^中山大學/, '').replace(/^捷運/, '') || name;
}

// Only keep the configured stations from the full station-yb2.json feed (array of ~9700 stations).
function pickStations(feed, stationsCfg) {
  const wanted = new Map((stationsCfg || []).map((s) => [String(s.no), s]));
  const found = new Map();
  for (const st of Array.isArray(feed) ? feed : []) {
    const no = String(st.station_no);
    if (!wanted.has(no)) continue;
    const cfg = wanted.get(no);
    found.set(no, {
      no,
      name: cfg.name || st.name_tw,
      bikes: typeof st.available_spaces === 'number' ? st.available_spaces : null,
      docks: typeof st.empty_spaces === 'number' ? st.empty_spaces : null,
      total: typeof st.parking_spaces === 'number' ? st.parking_spaces : null,
      status: st.status,
      updated: st.updated_at ? toIsoTaipei(st.updated_at) : null,
      favorite: !!cfg.favorite,
    });
  }
  const stations = [];
  const missing = [];
  for (const [no, cfg] of wanted) {
    if (found.has(no)) stations.push(found.get(no));
    else missing.push({ no, name: cfg.name });
  }
  return { stations, missing };
}

// "2026-10-22 02:55:33" (Taipei) → "2026-10-22T02:55:33+08:00"
function toIsoTaipei(s) {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(String(s).trim());
  return m ? `${m[1]}T${m[2].length === 5 ? `${m[2]}:00` : m[2]}+08:00` : String(s);
}

module.exports = {
  YOUBIKE_STALE_MIN,
  recentNotices,
  sortedNotices,
  stationMap,
  stationAge,
  isStationStale,
  stationUpdatedAt,
  stationForBuilding,
  shortStationName,
  pickStations,
  toIsoTaipei,
};
}, {"../lib/time":"src/lib/time.js"}],

"src/widget/layout.js": [function (module, exports, require) {
'use strict';
// Builds a renderer-independent layout model for each mode and widget size.
// The Scriptable renderer (render-widget.js) and the text preview (render-text.js) both draw this model.
//
// layout  = { family, mode, title, subtitle, symbol, headerRight, sections, glance, footer, refreshAt }
// section = { id, title, titleRight: [seg], rows: [row], tone }
// row     = { icon, iconColor, left: [seg], right: [seg], big, muted, url }
// seg     = { t: text, c: colour token, b: bold }

const T = require('../lib/time');
const M = require('../lib/macro');
const K = require('./stocks');
const F = require('./feeds');
const W = require('./weather');
const { nextBoundary } = require('./mode');

// Space budget in "row units" (one 13 pt row). Medium has no section titles and at most 2 rows per
// section so that more kinds of information fit.
const FAMILY = {
  large: { maxUnits: 16.5, maxSections: 5, titles: true, headerCost: 0.9, sectionCost: 0.9 },
  medium: { maxUnits: 6.5, maxSections: 4, titles: false, headerCost: 0, sectionCost: 0.3, maxRows: 2 },
  small: { glanceItems: 3 },
};

const seg = (t, c, b) => ({ t: String(t), c: c || null, b: !!b });
const row = (o) => ({ icon: null, iconColor: null, left: [], right: [], big: false, muted: false, url: null, ...o });

// ---------------------------------------------------------------- small helpers

function roomSegs(course) {
  return course.roomChanged ? [seg(`${course.room} ⚠︎`, 'orange')] : [seg(course.room || '', 'secondary')];
}

function classRow(block, opts = {}) {
  const c = block.course;
  const time = opts.range ? `${block.start}–${block.end}` : block.start;
  return row({
    icon: 'book',
    iconColor: 'secondary',
    left: [seg(time, 'secondary'), seg(` ${c.short || c.name}`, opts.muted ? 'secondary' : null, !opts.muted)],
    right: roomSegs(c),
    muted: !!opts.muted,
    big: !!opts.big,
  });
}

function countdownRow(item) {
  return row({
    icon: item.kind === 'exam' ? 'pencil.circle.fill' : 'clock.fill',
    iconColor: item.uncertain ? 'gray' : item.color === 'secondary' ? 'secondary' : item.color,
    left: [seg(item.display, item.uncertain ? 'gray' : null)],
    right: [seg(item.label || '', item.color, item.color === 'red' || item.color === 'orange')],
  });
}

function youbikeRow(ctx, stationNo) {
  if (!stationNo) return null;
  const feed = ctx.youbike.feed;
  const st = ctx.youbike.map[stationNo];
  const cfgSt = ((ctx.cfg.youbike && ctx.cfg.youbike.stations) || []).find((s) => s.no === stationNo);
  const name = F.shortStationName((st && st.name) || (cfgSt && cfgSt.name) || stationNo);
  if (!st || st.bikes == null) {
    return row({ icon: 'bicycle', iconColor: 'secondary', left: [seg(`${name} YouBike 資料暫缺`, 'secondary')], muted: true });
  }
  const stale = F.isStationStale(st, feed, ctx.now);
  const upd = F.stationUpdatedAt(st, feed);
  const suspended = st.status != null && st.status !== 1;
  return row({
    icon: 'bicycle',
    iconColor: 'secondary',
    left: [
      seg(`${name} `, 'secondary'),
      seg(suspended ? '暫停營運' : `可借 ${st.bikes}`, st.bikes <= 2 && !suspended ? 'orange' : null, true),
      seg(suspended ? '' : ` · 可還 ${st.docks}`, 'secondary'),
    ],
    right: stale && upd ? [seg(`${T.hm(upd)} 的資料`, 'gray')] : [],
    muted: stale,
  });
}

function pinnedRow(ctx, opts = {}) {
  const s = ctx.stocks;
  const left = [];
  for (const q of s.pinned) {
    const pct = opts.weekly ? s.weekly[q.code] : q.changePct;
    left.push(seg(`${q.name} `), seg(K.formatPrice(q.price), null, true), seg(' '), seg(K.formatPct(pct), K.trendColor(pct)), seg('　'));
  }
  if (s.index) {
    const pct = opts.weekly ? s.weekly[s.index.code] : s.index.changePct;
    left.push(seg('加權 '), seg(K.formatPrice(Math.round(s.index.price)), null, true), seg(' '), seg(K.formatPct(pct), K.trendColor(pct)));
  }
  if (!left.length) return null;
  if (left[left.length - 1].t === '　') left.pop();
  return row({ left, right: opts.right || [], muted: s.stale && s.status.open });
}

function themeRow(sum) {
  if (!sum || sum.avg == null) return row({ left: [seg(sum ? sum.name : '—', 'secondary')], right: [seg('沒有資料', 'gray')] });
  const right = [];
  if (sum.top) right.push(seg(`${sum.top.name} `, 'secondary'), seg(K.formatPct(sum.top.value, 1), K.trendColor(sum.top.value)));
  if (sum.bottom) right.push(seg(`  ${sum.bottom.name} `, 'secondary'), seg(K.formatPct(sum.bottom.value, 1), K.trendColor(sum.bottom.value)));
  return row({ left: [seg(sum.name), seg(` ${K.formatPct(sum.avg)}`, K.trendColor(sum.avg), true)], right });
}

function weatherNowRow(ctx) {
  const w = ctx.weather;
  const cur = w.current;
  const day = w.today;
  if (!cur && !day) return null;
  const left = [];
  if (cur && cur.temp != null) left.push(seg(`${Math.round(cur.temp)}°`, null, true), seg(` ${cur.text}`));
  else if (day) left.push(seg(day.text, null, true));
  if (day && day.min != null && day.max != null) left.push(seg(` · ${Math.round(day.min)}°–${Math.round(day.max)}°`, 'secondary'));
  const right = [];
  if (cur && cur.apparent != null && Math.abs(cur.apparent - cur.temp) >= 2) right.push(seg(`體感 ${Math.round(cur.apparent)}°`, 'secondary'));
  if (w.stale && w.fetchedAt) right.push(seg(` ${T.hm(w.fetchedAt)} 的資料`, 'gray'));
  return row({ icon: (cur || day).symbol, iconColor: 'secondary', left, right, muted: w.stale });
}

function umbrellaRow(u, muted, dayWord) {
  if (!u) return null;
  if (u.need) {
    const pop = u.peak && u.peak.pop != null ? `（${u.peak.pop}%）` : '';
    return row({
      icon: 'umbrella.fill',
      iconColor: 'orange',
      left: [seg(`${dayWord || ''}要帶傘`, 'orange', true), seg(` · ${W.rangeText(u.range)} 最可能下雨${pop}`, 'secondary')],
      muted,
    });
  }
  const peak = u.peak && u.peak.pop != null ? ` · 降雨機率最高 ${u.maxPop}%（${T.hm(u.peak.time)}）` : '';
  return row({ icon: 'umbrella', iconColor: 'secondary', left: [seg(`${dayWord || ''}不用帶傘`), seg(peak, 'secondary')], muted });
}

function sunRow(ctx) {
  const s = ctx.weather.sun;
  if (!s) return null;
  return row({ icon: 'sun.max.fill', iconColor: s.kind === 'strong' ? 'orange' : 'yellow', left: [seg(s.text, s.kind === 'strong' ? 'orange' : null)] });
}

function weatherMissingRow() {
  return row({ icon: 'cloud', iconColor: 'gray', left: [seg('天氣暫時抓不到', 'gray')], muted: true });
}

function examListRows(list, max = 4) {
  if (!list || !list.length) return [row({ left: [seg('行事曆裡沒有這週的考試', 'secondary')], muted: true })];
  return list.slice(0, max).map((e) => row({
    icon: 'pencil.circle.fill',
    iconColor: e.uncertain ? 'gray' : e.color,
    left: [seg(T.mdw(e.startKey), 'secondary'), seg(` ${e.display}`, e.uncertain ? 'gray' : null)],
    right: [seg(e.label, e.color, !e.uncertain)],
  }));
}

// Countdown items not already shown in the red 48-hour alert.
function listItems(ctx) {
  const shown = new Set(ctx.countdown.alerts.slice(0, 2));
  return ctx.countdown.items.filter((e) => !shown.has(e));
}

function examWeekTitle(exam) {
  return exam ? `本週考試（${exam.label}）` : '本週考試';
}

// ---------------------------------------------------------------- sections

function alertSection(ctx) {
  const a = ctx.countdown.alerts;
  if (!a.length) return null;
  return {
    id: 'alert',
    title: '48 小時內考試',
    tone: 'alert',
    rows: a.slice(0, 2).map((e) => row({
      icon: 'exclamationmark.triangle.fill',
      iconColor: 'red',
      left: [seg(e.display, 'red', true)],
      right: [seg(e.label, 'red', true)],
    })),
  };
}

function weatherTodaySection(ctx, title = '今天天氣') {
  const w = ctx.weather;
  if (!w.ok) return { id: 'weather', title, rows: [weatherMissingRow()] };
  const rows = [weatherNowRow(ctx), umbrellaRow(w.umbrellaToday, w.stale), sunRow(ctx)].filter(Boolean);
  return { id: 'weather', title, rows };
}

function scheduleTodaySection(ctx) {
  if (!ctx.todayInfo.classDay) return null;
  if (ctx.exams.today) {
    return { id: 'exams', title: examWeekTitle(ctx.exams.today), rows: examListRows(ctx.exams.todayWeek) };
  }
  const blocks = ctx.status.blocks;
  if (!blocks.length) return { id: 'schedule', title: '今日課表', rows: [row({ left: [seg('今天沒有課', 'secondary')] })] };
  const first = blocks.find((b) => b.startAt > ctx.now);
  const titleRight = first && first === blocks[0]
    ? [seg(`第一堂還有 ${T.durationText(Math.ceil((first.startAt - ctx.now) / 60000))}`, 'secondary')]
    : [];
  return {
    id: 'schedule',
    title: '今日課表',
    titleRight,
    rows: blocks.map((b) => classRow(b, { range: true, muted: b.endAt <= ctx.now })),
  };
}

function countdownSection(ctx, n, title = '倒數') {
  const items = listItems(ctx).slice(0, n);
  if (ctx.countdown.error && !items.length) {
    return { id: 'countdown', title, rows: [row({ icon: 'calendar', iconColor: 'gray', left: [seg(ctx.countdown.error, 'gray')], muted: true })] };
  }
  if (!items.length) {
    return ctx.countdown.alerts.length ? null : { id: 'countdown', title, rows: [row({ left: [seg('45 天內沒有考試或截止', 'secondary')] })] };
  }
  return { id: 'countdown', title, rows: items.map((e) => countdownRow(e)) };
}

function nowClassSection(ctx) {
  if (ctx.exams.today) {
    return { id: 'exams', title: examWeekTitle(ctx.exams.today), rows: examListRows(ctx.exams.todayWeek, 3) };
  }
  const st = ctx.status;
  if (st.current) {
    const c = st.current.course;
    const left = st.current.minutesLeft;
    return {
      id: 'now',
      title: '現在',
      titleRight: [seg(`${st.current.start}–${st.current.end}`, 'secondary')],
      rows: [row({
        icon: 'book.fill',
        iconColor: 'blue',
        left: [seg(c.short || c.name, null, true), seg(' · ', 'secondary'), ...roomSegs(c)],
        right: [seg(`還有 ${T.durationText(left)}下課`, left <= 10 ? 'orange' : 'secondary', left <= 10)],
      })],
    };
  }
  if (st.nextToday) return null; // break: the "next class" section says it all
  return { id: 'now', title: '現在', rows: [row({ icon: 'checkmark.circle.fill', iconColor: 'green', left: [seg('今天的課上完了', null, true)] })] };
}

function nextClassSection(ctx) {
  if (ctx.exams.today) return null;
  const n = ctx.status.next;
  if (!n) return null;
  const c = n.course;
  const when = n.rel === '今天' ? n.start : `${n.rel} ${n.start}`;
  const right = n.rel === '今天' ? [seg(when, null, true), seg(`（${T.durationText(n.minutesUntil)}後）`, 'secondary')] : [seg(when, null, true)];
  const rows = [row({ icon: 'book.fill', iconColor: 'secondary', left: [seg(c.short || c.name, null, true), seg(' · ', 'secondary'), ...roomSegs(c)], right })];
  // Bikes near the classroom only matter if the class is today.
  const yb = n.rel === '今天' ? youbikeRow(ctx, F.stationForBuilding(c.building, ctx.courses)) : null;
  if (yb) rows.push(yb);
  const st = ctx.status;
  const titleRight = !st.current && st.nextToday ? [seg(st.inBreak ? '下課空檔' : '還沒上課', 'secondary')] : [];
  return { id: 'next', title: '下一堂', titleRight, rows };
}

function stockMiniSection(ctx) {
  const s = ctx.stocks;
  if (!s.ok || !s.status.todayTraded) return null;
  const r = pinnedRow(ctx);
  if (!r) return null;
  return { id: 'stocks', title: '台股', titleRight: [seg(s.status.label, s.status.open ? 'secondary' : 'gray')], rows: [r] };
}

function stocksSection(ctx, opts = {}) {
  const s = ctx.stocks;
  const title = '台股';
  if (!s.ok) {
    return { id: 'stocks', title, rows: [row({ icon: 'chart.bar.fill', iconColor: 'gray', left: [seg('台股資料暫時抓不到', 'gray')], muted: true })] };
  }
  const weekly = opts.weekly && s.hasWeekly;
  const label = weekly ? `截至 ${T.md(s.status.dateKey)}` : s.status.label;
  const rows = [pinnedRow(ctx, { weekly })].filter(Boolean);
  const themes = weekly ? s.weeklyThemes : s.themes;
  for (const t of themes) rows.push(themeRow(t));
  return { id: 'stocks', title: weekly ? '本週台股' : '台股', titleRight: [seg(label, 'secondary')], rows };
}

function afternoonMiscSection(ctx) {
  const rows = [];
  const w = ctx.weather;
  if (w.ok && w.eveningRain) {
    const u = w.eveningRain;
    rows.push(u.need
      ? row({ icon: 'cloud.rain.fill', iconColor: 'orange', left: [seg('晚上可能下雨', 'orange', true), seg(` · ${W.rangeText(u.range)}（${u.peak.pop}%）`, 'secondary')], muted: w.stale })
      : row({ icon: 'moon.stars.fill', iconColor: 'secondary', left: [seg('晚上不會下雨'), seg(` · 降雨機率最高 ${u.maxPop}%`, 'secondary')], muted: w.stale }));
  } else if (!w.ok) rows.push(weatherMissingRow());
  rows.push(noticesCountRow(ctx));
  return { id: 'misc', title: '', rows: rows.filter(Boolean) };
}

function noticesCountRow(ctx) {
  const n = ctx.notices;
  if (!n.feed) {
    return row({ icon: 'megaphone.fill', iconColor: 'gray', left: [seg(n.missing ? '公告資料還沒建立' : '公告資料暫時抓不到', 'gray')], muted: true });
  }
  const count = n.recent.length;
  return row({
    icon: 'megaphone.fill',
    iconColor: count ? 'blue' : 'secondary',
    left: [seg('過去 24 小時新公告 '), seg(`${count} 則`, null, true)],
    right: n.stale && n.checkedAt ? [seg(`${T.hm(n.checkedAt)} 的資料`, 'gray')] : [],
    muted: n.stale,
  });
}

function week7Section(ctx) {
  const items = listItems(ctx).filter((e) => e.days <= 7);
  if (!items.length) {
    return ctx.countdown.alerts.length ? null : { id: 'week7', title: '7 天內考試／截止', rows: [row({ left: [seg('7 天內沒有考試或截止', 'secondary')] })] };
  }
  return { id: 'week7', title: '7 天內考試／截止', rows: items.slice(0, 3).map((e) => countdownRow(e)) };
}

// Next class from the evening / late-night point of view.
function upcomingFirstSection(ctx, opts = {}) {
  const n = ctx.status.next;
  const rows = [];
  // No timetable during winter break, or when there's no class in the next two weeks.
  if (!n || (ctx.nextInfo && ctx.nextInfo.winterBreak) || T.diffDays(ctx.today, n.dateKey) > 14) return null;
  if (ctx.nextInfo && ctx.nextInfo.exam) {
    const title = ctx.todayInfo.exam || n.rel === '今天' ? examWeekTitle(ctx.nextInfo.exam) : `${n.rel}起${ctx.nextInfo.exam.label}`;
    return { id: 'exams', title, rows: examListRows(ctx.exams.next, opts.big ? 2 : 3) };
  }
  rows.push(classRow(n, { big: opts.big }));
  const title = opts.title || (n.rel === '明天' ? '明天第一堂' : n.rel === '今天' ? '第一堂' : `${n.rel}第一堂`);
  // The title already names the day unless it's today's first class.
  rows[rows.length - 1].right = n.rel === '今天' ? [seg('今天', null, true), seg(' · ', 'secondary'), ...roomSegs(n.course)] : roomSegs(n.course);
  return { id: 'first', title, rows };
}

// Evening: tomorrow's first class (or holiday / exam week) and tomorrow's weather in one card.
function tomorrowSection(ctx) {
  const rows = [];
  let title = '明天';
  const n = ctx.status.next;
  const info = ctx.tomorrowInfo;
  const winter = info.winterBreak || (ctx.nextInfo && ctx.nextInfo.winterBreak);
  if (!info.classDay && info.offLabel && !(info.weekend && !n)) {
    const next = ctx.cfg.semester && ctx.cfg.semester.nextSemesterStart;
    const text = info.winterBreak && !ctx.todayInfo.winterBreak ? `明天開始放寒假${next ? `（${T.md(next)} 開學）` : ''}`
      : info.winterBreak ? null : info.weekend ? '明天是週末' : `明天放假：${info.offLabel}`;
    if (text) rows.push(row({ icon: 'calendar', iconColor: 'secondary', left: [seg(text, 'secondary')] }));
  }
  if (!winter && n && T.diffDays(ctx.today, n.dateKey) <= 14) {
    if (ctx.nextInfo && ctx.nextInfo.exam) {
      title = n.rel === '明天' ? `明天 · ${ctx.nextInfo.exam.label}` : `${n.rel} · ${ctx.nextInfo.exam.label}`;
      rows.push(...examListRows(ctx.exams.next, 2));
    } else {
      const c = n.course;
      rows.push(row({
        icon: 'book.fill',
        iconColor: 'secondary',
        left: [seg(n.rel === '明天' ? '第一堂 ' : `${n.rel} `, 'secondary'), seg(n.start, null, true), seg(` ${c.short || c.name}`, null, true)],
        right: roomSegs(c),
      }));
    }
  }
  const w = ctx.weather;
  const d = w.tomorrow;
  if (!w.ok) rows.push(weatherMissingRow());
  else if (d) {
    const u = w.umbrellaTomorrow;
    rows.push(row({
      icon: d.symbol,
      iconColor: 'secondary',
      left: [seg(`${Math.round(d.min)}°–${Math.round(d.max)}°`, null, true), seg(` ${d.text}`), seg(` · 降雨 ${d.popMax}%`, 'secondary')],
      right: u && u.need ? [seg('要帶傘 ', 'orange', true), seg(W.rangeText(u.range), 'orange')] : [seg('不用帶傘', 'secondary')],
      muted: w.stale,
    }));
  }
  return rows.length ? { id: 'tomorrow', title, rows } : null;
}

function noticesTitlesSection(ctx) {
  const n = ctx.notices;
  if (!n.feed) return { id: 'notices', title: '公告', rows: [noticesCountRow(ctx)] };
  const recent = n.recent;
  if (!recent.length) return { id: 'notices', title: '今天新公告', rows: [row({ icon: 'megaphone', iconColor: 'secondary', left: [seg('過去 24 小時沒有新公告', 'secondary')], muted: n.stale })] };
  return {
    id: 'notices',
    title: '今天新公告',
    titleRight: [seg(`${recent.length} 則`, 'secondary')],
    rows: recent.slice(0, 2).map((item) => row({
      left: [seg(item.group || '公告', 'blue'), seg(` ${item.title}`)],
      url: item.url,
      muted: n.stale,
    })),
  };
}

function macroSection(ctx) {
  const m = ctx.macro;
  if (m.tonight.length) {
    return {
      id: 'macro',
      title: '今晚美股大事',
      rows: m.tonight.slice(0, 2).map((e) => row({
        icon: 'chart.bar.fill',
        iconColor: 'orange',
        left: [seg(e.title), seg(e.confirmed === false ? '（預估）' : '', 'secondary')],
        right: [seg(M.nightLabel(e.time, ctx.now), 'orange', true)],
      })),
    };
  }
  if (!m.next) return null;
  return { id: 'macro', title: '', rows: [macroNextRow(ctx, m.next)] };
}

function macroNextRow(ctx, e) {
  const days = M.daysUntil(e.time, ctx.now);
  return row({
    icon: 'chart.bar.fill',
    iconColor: 'secondary',
    left: [seg(e.title), seg(` ${M.whenText(e.time)}`, 'secondary'), seg(e.confirmed === false ? ' 預估' : '', 'gray')],
    right: [seg(days <= 1 ? (days === 0 ? '今天' : '明天') : `還有 ${days} 天`, 'secondary')],
  });
}

function nearestExamSection(ctx, big) {
  const e = ctx.countdown.items.find((x) => x.kind === 'exam');
  if (e && ctx.countdown.alerts.includes(e)) return null; // already in the red alert
  if (!e) return { id: 'exam', title: '最近的考試', rows: [row({ left: [seg('45 天內沒有考試', 'secondary')], big })] };
  const r = countdownRow(e);
  r.big = !!big;
  return { id: 'exam', title: '最近的考試', rows: [r] };
}

function classdayMiscSection(ctx) {
  const rows = [];
  const s = ctx.weather.sun;
  if (s && T.at(ctx.today, s.end) > ctx.now) rows.push(sunRow(ctx));
  if (ctx.weather.ok && ctx.weather.umbrellaToday && ctx.weather.umbrellaToday.need) rows.push(umbrellaRow(ctx.weather.umbrellaToday, ctx.weather.stale));
  if (!rows.length) return null;
  return { id: 'misc', title: '', rows };
}

// ---------------------------------------------------------------- modes

const MODE_SECTIONS = {
  morning: [alertSection, weatherTodaySection, scheduleTodaySection, (ctx) => countdownSection(ctx, 3)],
  classday: [alertSection, nowClassSection, nextClassSection, stockMiniSection, classdayMiscSection, (ctx) => countdownSection(ctx, 2)],
  afternoon: [alertSection, stocksSection, (ctx) => countdownSection(ctx, 3), afternoonMiscSection],
  evening: [alertSection, week7Section, tomorrowSection, noticesTitlesSection, macroSection],
  latenight: [alertSection, (ctx) => upcomingFirstSection(ctx, { big: true }), (ctx) => nearestExamSection(ctx, true)],
  holiday: [alertSection, (ctx) => countdownSection(ctx, 3), weatherTodaySection, (ctx) => upcomingFirstSection(ctx), (ctx) => stocksSection(ctx, { weekly: true })],
};

// ---------------------------------------------------------------- small widget ("glance")

function glanceItems(ctx) {
  const items = [];
  const add = (x) => { if (x) items.push(x); };
  const a = ctx.countdown.alerts[0];
  if (a) add({ icon: 'exclamationmark.triangle.fill', color: 'red', title: a.label, detail: a.display });
  const nextClass = (prefix) => {
    const n = ctx.status.next;
    if (!n || T.diffDays(ctx.today, n.dateKey) > 14 || (ctx.nextInfo && ctx.nextInfo.winterBreak)) return null;
    if (ctx.nextInfo && ctx.nextInfo.exam) {
      const e = (ctx.exams.next || []).find((x) => x !== a);
      return e
        ? { icon: 'pencil.circle.fill', color: e.color, title: `${T.md(e.startKey)} ${e.label}`, detail: e.display }
        : { icon: 'pencil.circle.fill', title: ctx.nextInfo.exam.label, detail: '行事曆裡沒有這週的考試' };
    }
    const rel = n.rel === '今天' ? '' : `${n.rel} `;
    return { icon: 'book.fill', title: `${prefix || rel}${n.start} ${n.course.short || n.course.name}`, detail: n.course.room };
  };
  const topCountdown = () => {
    const e = ctx.countdown.items.find((x) => x !== a);
    return e ? { icon: e.kind === 'exam' ? 'pencil.circle.fill' : 'clock.fill', color: e.color, title: e.label, detail: e.display } : null;
  };
  const umbrella = (u, word) => (u ? { icon: u.need ? 'umbrella.fill' : 'umbrella', color: u.need ? 'orange' : null, title: `${word || ''}${u.need ? '要帶傘' : '不用帶傘'}`, detail: u.need ? W.rangeText(u.range) : `降雨 ${u.maxPop}%` } : null);
  const stocks = () => {
    const s = ctx.stocks;
    const q = s.pinned[0];
    if (!q) return null;
    return { icon: 'chart.bar.fill', color: K.trendColor(q.changePct), title: `${q.name} ${K.formatPct(q.changePct)}`, detail: s.index ? `加權 ${K.formatPct(s.index.changePct)}` : s.status.label };
  };
  const st = ctx.status;
  switch (ctx.mode.mode) {
    case 'morning':
      add(nextClass('第一堂 '));
      add(umbrella(ctx.weather.umbrellaToday));
      add(topCountdown());
      break;
    case 'classday':
      if (st.current) add({ icon: 'book.fill', color: 'blue', title: `${st.current.course.short} 剩 ${st.current.minutesLeft} 分`, detail: st.current.course.room });
      add(nextClass());
      add(topCountdown());
      break;
    case 'afternoon':
      add(stocks());
      add(topCountdown());
      add(umbrella(ctx.weather.eveningRain, '晚上'));
      break;
    case 'evening':
      add(nextClass());
      add(topCountdown());
      add(umbrella(ctx.weather.umbrellaTomorrow, '明天'));
      break;
    case 'latenight':
      add(nextClass());
      add(topCountdown());
      break;
    default:
      add(topCountdown());
      add(ctx.weather.current ? { icon: ctx.weather.current.symbol, title: `${Math.round(ctx.weather.current.temp)}° ${ctx.weather.current.text}`, detail: ctx.weather.today ? `${Math.round(ctx.weather.today.min)}°–${Math.round(ctx.weather.today.max)}°` : '' } : null);
      add(nextClass());
  }
  return items.slice(0, FAMILY.small.glanceItems);
}

// ---------------------------------------------------------------- fitting & assembly

function rowCost(r) {
  return r.big ? 1.5 : 1;
}

function fitSections(sections, family) {
  const f = FAMILY[family] || FAMILY.large;
  const out = [];
  let used = 0;
  for (const s of sections) {
    if (!s || !s.rows || !s.rows.length) continue;
    if (out.length >= f.maxSections) break;
    const head = (s.title && f.titles ? f.headerCost : 0) + f.sectionCost;
    let cost = 0;
    let n = 0;
    for (const r of s.rows.slice(0, f.maxRows || s.rows.length)) {
      if (used + head + cost + rowCost(r) > f.maxUnits + 1e-9) break;
      cost += rowCost(r);
      n++;
    }
    if (!n) continue;
    out.push({ ...s, rows: s.rows.slice(0, n), truncated: n < s.rows.length });
    used += head + cost;
  }
  return out;
}

function safeSections(ctx, builders) {
  return builders.map((b) => {
    try {
      return b(ctx);
    } catch (e) {
      return { id: 'error', title: '', rows: [row({ icon: 'exclamationmark.circle', iconColor: 'gray', left: [seg(`這區暫時無法顯示：${e.message}`, 'gray')], muted: true })] };
    }
  });
}

function buildLayout(ctx, family = 'large') {
  const fam = FAMILY[family] ? family : 'small';
  const modeKey = ctx.mode.mode;
  const subtitleParts = [T.mdw(ctx.today)];
  if (ctx.todayInfo.exam) subtitleParts.push(ctx.todayInfo.exam.label);
  if (modeKey === 'holiday' && ctx.todayInfo.offLabel) subtitleParts.push(ctx.todayInfo.offLabel);
  const cur = ctx.weather.current;
  const layout = {
    family: fam,
    mode: modeKey,
    title: ctx.mode.title,
    symbol: ctx.mode.symbol,
    subtitle: subtitleParts.join(' · '),
    headerRight: cur && cur.temp != null ? { icon: cur.symbol, text: `${Math.round(cur.temp)}°`, muted: ctx.weather.stale } : null,
    showTitles: !!(FAMILY[fam] && FAMILY[fam].titles),
    sections: [],
    glance: [],
    footer: footerFor(ctx),
    refreshAt: refreshAt(ctx),
  };
  if (fam === 'small') {
    try {
      layout.glance = glanceItems(ctx);
    } catch (e) {
      layout.glance = [{ icon: 'exclamationmark.circle', title: '暫時無法顯示', detail: e.message }];
    }
    return layout;
  }
  layout.sections = fitSections(safeSections(ctx, MODE_SECTIONS[modeKey]), fam);
  return layout;
}

function footerFor(ctx) {
  const parts = [seg(`更新 ${T.hm(ctx.now)}`, 'tertiary')];
  if (ctx.weather.wx && ctx.weather.stale && ctx.weather.fetchedAt) parts.unshift(seg(`天氣 ${T.hm(ctx.weather.fetchedAt)} · `, 'gray'));
  return { right: parts };
}

function refreshAt(ctx) {
  const soon = new Date(ctx.now.getTime() + 15 * 60000);
  const boundary = nextBoundary(ctx.now, ctx.courses, ctx.cfg.semester || {});
  const t = boundary < soon ? boundary : soon;
  return new Date(Math.max(t.getTime(), ctx.now.getTime() + 60000));
}

module.exports = {
  FAMILY,
  MODE_SECTIONS,
  buildLayout,
  fitSections,
  glanceItems,
  seg,
  row,
};
}, {"../lib/time":"src/lib/time.js","../lib/macro":"src/lib/macro.js","./stocks":"src/widget/stocks.js","./feeds":"src/widget/feeds.js","./weather":"src/widget/weather.js","./mode":"src/widget/mode.js"}],

"src/widget/main.js": [function (module, exports, require) {
'use strict';
// Entry point of dist/NSYSU-HUD.js. install/HUD-Loader.js downloads the bundle and calls run().

const T = require('../lib/time');
const C = require('./constants');
const { loadConfig, loadWidgetData, loadLiveYoubike } = require('./data');
const { buildContext } = require('./context');
const { buildLayout } = require('./layout');
const { renderWidget, renderError, makeTheme } = require('./render-widget');
const { createApp } = require('./app');
const { createScriptableAdapter } = require('./adapter-scriptable');

/* global __HUD_BUILD__ */
const BUILD = typeof __HUD_BUILD__ !== 'undefined' ? __HUD_BUILD__ : { version: 'dev', hash: 'dev' };

// Scriptable classes are globals on the phone; tests pass fakes via opts.globals.
function scriptableGlobals() {
  const pick = (get) => {
    try {
      return get();
    } catch (e) {
      return undefined;
    }
  };
  /* eslint-disable no-undef */
  return {
    ListWidget: pick(() => ListWidget),
    Color: pick(() => Color),
    Font: pick(() => Font),
    SFSymbol: pick(() => SFSymbol),
    Size: pick(() => Size),
    Request: pick(() => Request),
    FileManager: pick(() => FileManager),
    Calendar: pick(() => Calendar),
    CalendarEvent: pick(() => CalendarEvent),
    Notification: pick(() => Notification),
    Script: pick(() => Script),
    UITable: pick(() => UITable),
    UITableRow: pick(() => UITableRow),
    UITableCell: pick(() => UITableCell),
    Alert: pick(() => Alert),
    Safari: pick(() => Safari),
    config: pick(() => config),
    args: pick(() => args),
  };
  /* eslint-enable no-undef */
}

const FAMILIES = new Set(['small', 'medium', 'large']);

function familyOf(cfg) {
  const f = cfg && cfg.widgetFamily;
  if (FAMILIES.has(f)) return f;
  if (f === 'extraLarge') return 'large';
  return 'small';
}

async function applyNotification(adapter, ctx) {
  const plan = ctx.weather.notification;
  if (!plan) return; // no forecast → leave whatever is scheduled
  try {
    if (plan.action === 'schedule') await adapter.scheduleNotification(plan);
    else await adapter.cancelNotification(plan.id);
  } catch (e) {
    if (adapter.log) adapter.log(`帶傘提醒設定失敗：${e.message}`);
  }
}

// opts: { forceRefresh: refetch live data, forceConfig: re-download config/*.json too }
async function load(adapter, opts = {}) {
  const cfg = await loadConfig(adapter, { forceRefresh: !!opts.forceConfig });
  const data = await loadWidgetData(adapter, cfg, { forceRefresh: !!opts.forceRefresh });
  return { cfg, data, ctx: buildContext(adapter.now(), cfg, data) };
}

async function downloadBundle(sc, adapter, path) {
  const res = await adapter.fetch(C.BUNDLE_URL, { timeout: 20 });
  if (res.status !== 200 || !res.body.includes('NSYSU-HUD')) throw new Error(`下載失敗（HTTP ${res.status}）`);
  if (path) sc.FileManager.local().writeString(path, res.body);
}

async function run(opts = {}) {
  const sc = opts.globals || scriptableGlobals();
  const config = opts.config || sc.config || {};
  const adapter = opts.adapter || createScriptableAdapter(sc);
  const inWidget = !!config.runsInWidget;
  const theme = makeTheme(sc);
  try {
    // Opening the dashboard always fetches fresh data; widget refreshes respect the cache times.
    let state = await load(adapter, { forceRefresh: !inWidget });
    await applyNotification(adapter, state.ctx);

    if (inWidget) {
      const family = familyOf(config);
      sc.Script.setWidget(renderWidget(buildLayout(state.ctx, family), sc));
      sc.Script.complete();
      return { mode: state.ctx.mode.mode, family };
    }

    const app = createApp({
      sc,
      theme,
      version: `${BUILD.version}（${BUILD.hash}）`,
      getContext: () => state.ctx,
      loadLiveYoubike: (o) => loadLiveYoubike(adapter, state.cfg, o),
      previewWidget: async (family) => {
        const w = renderWidget(buildLayout(state.ctx, family), sc);
        if (family === 'large') await w.presentLarge();
        else if (family === 'medium') await w.presentMedium();
        else await w.presentSmall();
      },
      refresh: async () => {
        state = await load(adapter, { forceRefresh: true });
        app.render();
      },
      updateScript: async () => {
        const a = new sc.Alert();
        try {
          await downloadBundle(sc, adapter, opts.path);
          state = await load(adapter, { forceRefresh: true, forceConfig: true });
          app.render();
          a.title = '更新完成';
          a.message = '設定已重新下載；主程式會在下次執行時使用新版。';
        } catch (e) {
          a.title = '更新失敗';
          a.message = `${e.message}\n會繼續使用目前的版本。`;
        }
        a.addAction('好');
        await a.presentAlert();
      },
    });
    await app.present();
    sc.Script.complete();
    return { mode: state.ctx.mode.mode, family: 'app' };
  } catch (e) {
    if (!inWidget) throw e;
    sc.Script.setWidget(renderError(sc, (e && e.message) || String(e), T.hm(new Date())));
    sc.Script.complete();
    return { error: e };
  }
}

module.exports = { run, version: BUILD.version, build: BUILD, familyOf, scriptableGlobals };
}, {"../lib/time":"src/lib/time.js","./constants":"src/widget/constants.js","./data":"src/widget/data.js","./context":"src/widget/context.js","./layout":"src/widget/layout.js","./render-widget":"src/widget/render-widget.js","./app":"src/widget/app.js","./adapter-scriptable":"src/widget/adapter-scriptable.js"}],

"src/widget/mode.js": [function (module, exports, require) {
'use strict';
// Mode selection: which layout the widget shows, from Taipei time, weekday, timetable and semester.
// Pure function so every boundary can be unit-tested with fixed times.

const T = require('../lib/time');
const { dayInfo } = require('./semester');
const { blocksForDate } = require('./schedule');

const MODES = {
  morning: { title: '早晨', symbol: 'sunrise.fill' },
  classday: { title: '上課日', symbol: 'book.fill' },
  afternoon: { title: '午後', symbol: 'cup.and.saucer.fill' },
  evening: { title: '晚間', symbol: 'moon.fill' },
  latenight: { title: '深夜', symbol: 'moon.zzz.fill' },
  holiday: { title: '假日', symbol: 'sun.max.fill' },
};

const MORNING_START = 6 * 60; // 06:00
const CLASS_START = 9 * 60 + 10; // 09:10
const AFTERNOON_START = 13 * 60 + 30; // 13:30
const EVENING_START = 18 * 60; // 18:00

function selectMode(now, coursesCfg, sem) {
  const p = T.parts(now);
  const t = p.minutes;
  const info = dayInfo(p.dateKey, sem);
  const pick = (mode, reason) => ({ mode, reason, ...MODES[mode], day: info });

  // Late night and evening apply every day (Sunday evening needs "tomorrow's first class" too).
  if (t < MORNING_START) return pick('latenight', '00:00–06:00');
  if (t >= EVENING_START) return pick('evening', '18:00–24:00');
  if (!info.classDay) return pick('holiday', info.offLabel || '放假');
  if (t < CLASS_START) return pick('morning', '平日 06:00–09:10');

  const blocks = blocksForDate(p.dateKey, coursesCfg, sem);
  if (blocks.length) {
    if (t < AFTERNOON_START) return pick('classday', '有課的日子 09:10–13:30');
    // After 13:30 stay in class mode while a class is running or still to come.
    if (blocks.some((b) => b.endMin > t)) return pick('classday', '還有課');
  }
  return pick('afternoon', blocks.length ? '下課後' : '今天沒課');
}

// Next time the layout may change (class start/end or a mode boundary), for refreshAfterDate.
function nextBoundary(now, coursesCfg, sem) {
  const p = T.parts(now);
  const marks = [MORNING_START, CLASS_START, AFTERNOON_START, 16 * 60, EVENING_START, 24 * 60];
  for (const b of blocksForDate(p.dateKey, coursesCfg, sem)) marks.push(b.startMin, b.endMin);
  const next = marks.filter((m) => m > p.minutes).sort((a, b) => a - b)[0];
  return T.at(p.dateKey, next == null ? 24 * 60 : next);
}

module.exports = { MODES, selectMode, nextBoundary };
}, {"../lib/time":"src/lib/time.js","./semester":"src/widget/semester.js","./schedule":"src/widget/schedule.js"}],

"src/widget/render-widget.js": [function (module, exports, require) {
'use strict';
// Draws the layout model with Scriptable's ListWidget. All Scriptable classes come in through `sc`
// (the real globals on the phone, fakes in Node tests).

// [light, dark] — iOS system colours
const PALETTE = {
  bg: ['#FFFFFF', '#1C1C1E'],
  card: ['#F2F2F7', '#2C2C2E'],
  alertCard: ['#FFECEB', '#3A1F1D'],
  primary: ['#000000', '#FFFFFF'],
  secondary: ['#3C3C43', '#EBEBF5', 0.6],
  tertiary: ['#3C3C43', '#EBEBF5', 0.35],
  gray: ['#8E8E93', '#8E8E93'],
  red: ['#FF3B30', '#FF453A'],
  orange: ['#FF9500', '#FF9F0A'],
  yellow: ['#FFCC00', '#FFD60A'],
  green: ['#34C759', '#30D158'],
  blue: ['#007AFF', '#0A84FF'],
};
const ALIASES = { up: 'red', down: 'green' };

function makeTheme(sc) {
  const cache = {};
  return (token) => {
    const key = ALIASES[token] || (PALETTE[token] ? token : 'primary');
    if (!cache[key]) {
      const [light, dark, alpha] = PALETTE[key];
      cache[key] = sc.Color.dynamic(new sc.Color(light, alpha == null ? 1 : alpha), new sc.Color(dark, alpha == null ? 1 : alpha));
    }
    return cache[key];
  };
}

const SIZES = {
  large: { pad: [12, 14, 10, 14], title: 15, sub: 12, header: 11, row: 13, big: 18, foot: 9, cardPad: [5, 9, 5, 9], gap: 5, rowGap: 2 },
  medium: { pad: [11, 14, 9, 14], title: 14, sub: 11.5, header: 10.5, row: 12.5, big: 16, foot: 8.5, cardPad: [0, 0, 0, 0], gap: 4, rowGap: 1.5 },
  small: { pad: [12, 12, 10, 12], title: 13, sub: 10.5, header: 10, row: 12.5, big: 15, foot: 8.5, cardPad: [0, 0, 0, 0], gap: 6, rowGap: 1 },
};

function addSymbol(sc, stack, name, size, color) {
  if (!name) return null;
  let sym = sc.SFSymbol.named(name);
  if (!sym || !sym.image) sym = sc.SFSymbol.named('circle.fill');
  if (!sym || !sym.image) return null;
  sym.applyFont(sc.Font.systemFont(size));
  const img = stack.addImage(sym.image);
  img.imageSize = new sc.Size(size + 2, size + 2);
  img.tintColor = color;
  img.resizable = true;
  return img;
}

function addText(sc, stack, text, font, color, opts = {}) {
  const t = stack.addText(text);
  t.font = font;
  t.textColor = color;
  t.lineLimit = opts.lines || 1;
  t.minimumScaleFactor = opts.scale || 0.75;
  return t;
}

function addSegs(sc, stack, segs, size, theme, muted, defaultColor) {
  for (const s of segs || []) {
    if (!s.t) continue;
    const color = muted ? theme('gray') : theme(s.c || defaultColor || 'primary');
    addText(sc, stack, s.t, s.b ? sc.Font.semiboldSystemFont(size) : sc.Font.systemFont(size), color);
  }
}

function renderRow(sc, parent, r, z, theme) {
  const st = parent.addStack();
  st.layoutHorizontally();
  st.centerAlignContent();
  st.spacing = 0;
  const size = r.big ? z.big : z.row;
  if (r.icon) {
    addSymbol(sc, st, r.icon, size - 1, r.muted ? theme('gray') : theme(r.iconColor || 'secondary'));
    st.addSpacer(5);
  }
  addSegs(sc, st, r.left, size, theme, r.muted);
  st.addSpacer();
  if (r.right && r.right.length) {
    st.addSpacer(6);
    addSegs(sc, st, r.right, size - (r.big ? 3 : 1), theme, r.muted, 'secondary');
  }
  if (r.url) st.url = r.url;
  return st;
}

function renderHeader(sc, w, layout, z, theme) {
  const h = w.addStack();
  h.layoutHorizontally();
  h.centerAlignContent();
  addSymbol(sc, h, layout.symbol, z.title - 1, theme('secondary'));
  h.addSpacer(5);
  addText(sc, h, layout.title, sc.Font.boldSystemFont(z.title), theme('primary'));
  h.addSpacer(6);
  addText(sc, h, layout.subtitle, sc.Font.mediumSystemFont(z.sub), theme('secondary'), { scale: 0.6 });
  h.addSpacer();
  if (layout.headerRight) {
    const color = layout.headerRight.muted ? theme('gray') : theme('secondary');
    addSymbol(sc, h, layout.headerRight.icon, z.sub, color);
    h.addSpacer(3);
    addText(sc, h, layout.headerRight.text, sc.Font.semiboldSystemFont(z.sub + 1), layout.headerRight.muted ? theme('gray') : theme('primary'));
  }
}

function renderSection(sc, w, s, z, theme, family) {
  const card = w.addStack();
  card.layoutVertically();
  card.spacing = z.rowGap;
  if (family === 'large') {
    card.backgroundColor = s.tone === 'alert' ? theme('alertCard') : theme('card');
    card.cornerRadius = 12;
    card.setPadding(...z.cardPad);
  }
  if (family === 'large' && (s.title || (s.titleRight && s.titleRight.length))) {
    const h = card.addStack();
    h.layoutHorizontally();
    h.centerAlignContent();
    addText(sc, h, s.title || '', sc.Font.semiboldSystemFont(z.header), s.tone === 'alert' ? theme('red') : theme('secondary'));
    h.addSpacer();
    addSegs(sc, h, s.titleRight, z.header, theme, false, 'secondary');
  }
  for (const r of s.rows) renderRow(sc, card, r, z, theme);
  return card;
}

function renderSmall(sc, w, layout, z, theme) {
  for (const g of layout.glance) {
    const item = w.addStack();
    item.layoutVertically();
    item.spacing = 0;
    const top = item.addStack();
    top.layoutHorizontally();
    top.centerAlignContent();
    addSymbol(sc, top, g.icon, z.row - 1, theme(g.color || 'secondary'));
    top.addSpacer(4);
    addText(sc, top, g.title, sc.Font.semiboldSystemFont(z.row), theme(g.color === 'gray' ? 'gray' : g.color || 'primary'));
    if (g.detail) addText(sc, item, g.detail, sc.Font.systemFont(z.sub), theme('secondary'));
    w.addSpacer(z.gap);
  }
}

function renderFooter(sc, w, layout, z, theme) {
  const f = w.addStack();
  f.layoutHorizontally();
  f.addSpacer();
  addSegs(sc, f, layout.footer.right, z.foot, theme, false, 'tertiary');
}

function renderWidget(layout, sc) {
  const theme = makeTheme(sc);
  const family = layout.family;
  const z = SIZES[family] || SIZES.small;
  const w = new sc.ListWidget();
  w.backgroundColor = theme('bg');
  w.setPadding(...z.pad);
  renderHeader(sc, w, layout, z, theme);
  w.addSpacer(6);
  if (family === 'small') {
    renderSmall(sc, w, layout, z, theme);
  } else {
    layout.sections.forEach((s, i) => {
      if (i) w.addSpacer(z.gap);
      renderSection(sc, w, s, z, theme, family);
    });
  }
  w.addSpacer();
  renderFooter(sc, w, layout, z, theme);
  if (layout.refreshAt) w.refreshAfterDate = layout.refreshAt;
  return w;
}

// Shown when something unexpected breaks before a layout exists.
function renderError(sc, message, now) {
  const theme = makeTheme(sc);
  const w = new sc.ListWidget();
  w.backgroundColor = theme('bg');
  w.setPadding(14, 14, 12, 14);
  const h = w.addStack();
  h.centerAlignContent();
  addSymbol(sc, h, 'exclamationmark.triangle.fill', 13, theme('orange'));
  h.addSpacer(5);
  addText(sc, h, 'NSYSU HUD 暫時出錯', sc.Font.boldSystemFont(14), theme('primary'));
  w.addSpacer(6);
  addText(sc, w, message, sc.Font.systemFont(11), theme('secondary'), { lines: 4 });
  w.addSpacer();
  addText(sc, w, `點一下重試 · ${now}`, sc.Font.systemFont(9), theme('tertiary'));
  w.refreshAfterDate = new Date(Date.now() + 15 * 60000);
  return w;
}

module.exports = { renderWidget, renderError, makeTheme, PALETTE };
}, {}],

"src/widget/schedule.js": [function (module, exports, require) {
'use strict';
// Class schedule (config/courses.json): merge consecutive periods, find current/next class.

const T = require('../lib/time');
const { dayInfo } = require('./semester');

// Period keys sorted by start time. (Object key order can't be trusted: "C" would sort after "9".)
function periodTable(periods) {
  return Object.keys(periods || {})
    .map((key) => {
      const [start, end] = periods[key];
      return { key, start, end, startMin: T.toMinutes(start), endMin: T.toMinutes(end) };
    })
    .sort((a, b) => a.startMin - b.startMin);
}

// One course → one or more blocks; consecutive periods (e.g. "234") merge into 09:10–12:00.
function courseBlocks(course, table) {
  const index = new Map(table.map((p, i) => [p.key, i]));
  const idx = [...new Set(String(course.periods || '').split(''))]
    .filter((k) => index.has(k))
    .map((k) => index.get(k))
    .sort((a, b) => a - b);
  const blocks = [];
  for (const i of idx) {
    const last = blocks[blocks.length - 1];
    if (last && last.lastIndex === i - 1) {
      last.lastIndex = i;
      last.endMin = table[i].endMin;
      last.periods += table[i].key;
    } else {
      blocks.push({ firstIndex: i, lastIndex: i, startMin: table[i].startMin, endMin: table[i].endMin, periods: table[i].key });
    }
  }
  return blocks.map((b) => ({
    course,
    weekday: course.weekday,
    periods: b.periods,
    startMin: b.startMin,
    endMin: b.endMin,
    start: T.minutesToHm(b.startMin),
    end: T.minutesToHm(b.endMin),
  }));
}

function blocksForWeekday(coursesCfg, weekday) {
  const table = periodTable(coursesCfg.periods);
  return (coursesCfg.courses || [])
    .filter((c) => c.weekday === weekday || (weekday === 0 && c.weekday === 7))
    .flatMap((c) => courseBlocks(c, table))
    .sort((a, b) => a.startMin - b.startMin);
}

function blocksForDate(key, coursesCfg, sem) {
  if (!dayInfo(key, sem).classDay) return [];
  return blocksForWeekday(coursesCfg, T.weekdayOf(key));
}

function withTimes(block, key) {
  return { ...block, dateKey: key, startAt: T.at(key, block.startMin), endAt: T.at(key, block.endMin) };
}

// First class strictly after `now`, searching up to maxDays ahead (holidays are skipped).
function findNextClass(now, coursesCfg, sem, maxDays = 30) {
  const today = T.dateKey(now);
  const nowMin = T.parts(now).minutes;
  for (let i = 0; i <= maxDays; i++) {
    const key = T.addDays(today, i);
    const blocks = blocksForDate(key, coursesCfg, sem);
    const b = i === 0 ? blocks.find((x) => x.startMin > nowMin) : blocks[0];
    if (b) {
      const block = withTimes(b, key);
      return {
        ...block,
        rel: T.relDayLabel(today, key),
        minutesUntil: Math.ceil((block.startAt - now) / 60000),
      };
    }
  }
  return null;
}

// Current class, remaining minutes, and the next class (today or a later day).
function classStatus(now, coursesCfg, sem) {
  const p = T.parts(now);
  const today = p.dateKey;
  const info = dayInfo(today, sem);
  const blocks = blocksForDate(today, coursesCfg, sem).map((b) => withTimes(b, today));
  const cur = blocks.find((b) => b.startAt <= now && now < b.endAt) || null;
  const current = cur ? { ...cur, minutesLeft: Math.ceil((cur.endAt - now) / 60000) } : null;
  const next = findNextClass(now, coursesCfg, sem);
  const nextToday = next && next.dateKey === today ? next : null;
  const doneToday = blocks.length > 0 && blocks.every((b) => b.endAt <= now);
  return {
    today: info,
    blocks,
    current,
    next,
    nextToday,
    inBreak: !current && !!nextToday && blocks.some((b) => b.endAt <= now),
    doneToday,
    hasClassToday: blocks.length > 0,
  };
}

// Parses NSYSUCourseAPI room strings such as "五5,6,7(工EC 3013)" → ["工EC 3013"].
function parseRooms(room) {
  const out = [];
  const re = /\(([^()]+)\)/g;
  let m;
  while ((m = re.exec(String(room || '')))) {
    const r = m[1].trim();
    if (r && !out.includes(r)) out.push(r);
  }
  return out;
}

function buildingOf(room) {
  const m = /([A-Z]{2,3})\s*-?\s*\d/.exec(String(room || ''));
  return m ? m[1] : null;
}

// Applies room changes recorded by the course-watch workflow (Pages course-state.json).
// Only unambiguous single-room changes are applied; the original stays in config.
function applyCourseState(coursesCfg, state) {
  if (!state || !state.courses) return coursesCfg;
  const courses = (coursesCfg.courses || []).map((c) => {
    const s = state.courses[c.id];
    if (!s) return c;
    const rooms = s.rooms || parseRooms(s.room);
    if (rooms.length !== 1 || rooms[0] === c.room) return c;
    return { ...c, room: rooms[0], building: buildingOf(rooms[0]) || c.building, roomChanged: true, configRoom: c.room };
  });
  return { ...coursesCfg, courses };
}

module.exports = {
  periodTable,
  courseBlocks,
  blocksForWeekday,
  blocksForDate,
  findNextClass,
  classStatus,
  parseRooms,
  buildingOf,
  applyCourseState,
};
}, {"../lib/time":"src/lib/time.js","./semester":"src/widget/semester.js"}],

"src/widget/semester.js": [function (module, exports, require) {
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
}, {"../lib/time":"src/lib/time.js"}],

"src/widget/stocks.js": [function (module, exports, require) {
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
}, {"../lib/time":"src/lib/time.js"}],

"src/widget/weather.js": [function (module, exports, require) {
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
}, {"../lib/time":"src/lib/time.js"}]
};
const __HUD_CACHE__ = {};
function __hudRequire(id) {
  if (__HUD_CACHE__[id]) return __HUD_CACHE__[id].exports;
  const def = __HUD_MODULES__[id];
  if (!def) throw new Error('NSYSU-HUD: missing module ' + id);
  const mod = { exports: {} };
  __HUD_CACHE__[id] = mod;
  def[0].call(mod.exports, mod, mod.exports, (spec) => __hudRequire(def[1][spec]));
  return mod.exports;
}
module.exports = __hudRequire("src/widget/main.js");
