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
