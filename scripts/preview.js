#!/usr/bin/env node
'use strict';
// npm run preview — prints each mode's widget layout as text, using fixtures and fixed fake times.
//   npm run preview                       all scenarios, large + medium + small
//   npm run preview -- --family large     one size only
//   npm run preview -- --at 2026-10-22T07:30 [--family small]
//   npm run preview -- --mode evening     scenarios of one mode
//   npm run preview -- --color            ANSI colours instead of 〔紅〕 tags

const T = require('../src/lib/time');
const { scenarioAdapter } = require('../src/dev/scenario');
const { loadConfig, loadWidgetData } = require('../src/widget/data');
const { buildContext } = require('../src/widget/context');
const { buildLayout } = require('../src/widget/layout');
const { renderText } = require('../src/widget/render-text');

const SCENARIOS = [
  { at: '2026-10-22T07:30', name: '早晨（週四，有課，下午會下雨）' },
  { at: '2026-10-23T12:20', name: '上課日白天（週五午休空檔，明天考試置頂）' },
  { at: '2026-10-22T10:35', name: '上課日白天（上課中，台股盤中）' },
  { at: '2026-10-21T15:00', name: '午後（週三下課後，台股收盤）' },
  { at: '2026-10-21T20:30', name: '晚間（週三，明早會下雨）', opts: { weather: { rain: { '2026-10-22': { from: 8, to: 10, pop: 80, mm: 2.5 } } } } },
  { at: '2026-10-28T20:30', name: '晚間（期中考週＋今晚聯準會）' },
  { at: '2026-10-22T01:10', name: '深夜' },
  { at: '2026-10-24T10:00', name: '假日（週六，今天考試）' },
  { at: '2026-10-29T10:00', name: '期中考週的上課日（課表改成本週考試）' },
  { at: '2027-01-10T11:00', name: '寒假（不顯示課表）' },
  { at: '2026-10-22T07:30', name: 'Open-Meteo 抓不到、公告第一次還沒建立、YouBike 過期', opts: { weather: false, notices: false, youbikeAge: 50 } },
];

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : null;
}

async function renderScenario(s, families, opts) {
  const now = T.parseTime(s.at);
  const adapter = scenarioAdapter(now, s.opts || {});
  const cfg = await loadConfig(adapter);
  const data = await loadWidgetData(adapter, cfg);
  const ctx = buildContext(now, cfg, data);
  const out = [];
  out.push('═'.repeat(72));
  out.push(`${s.name}｜${T.mdw(T.dateKey(now))} ${T.hm(now)}｜模式：${ctx.mode.title}（${ctx.mode.reason}）`);
  for (const family of families) {
    out.push(`── ${{ large: '大', medium: '中', small: '小' }[family]}尺寸 ${'─'.repeat(60)}`);
    out.push(renderText(buildLayout(ctx, family), opts));
  }
  const plan = ctx.weather.notification;
  if (plan) out.push(`（本機通知：${plan.action === 'schedule' ? `排 ${T.mdw(T.dateKey(plan.at))} 07:30「${plan.title}」${plan.body}` : '取消帶傘提醒'}）`);
  return { mode: ctx.mode.mode, text: out.join('\n') };
}

async function main() {
  const fam = arg('family');
  const families = fam && fam !== 'all' ? [fam] : ['large', 'medium', 'small'];
  const opts = { ansi: process.argv.includes('--color') };
  const at = arg('at');
  const mode = arg('mode');
  const list = at ? [{ at, name: '自訂時間' }] : SCENARIOS;
  const seen = new Set();
  for (const s of list) {
    const r = await renderScenario(s, families, opts);
    if (mode && r.mode !== mode) continue;
    seen.add(r.mode);
    console.log(r.text);
  }
  if (!at && !mode) console.log(`\n共 ${list.length} 個情境，涵蓋模式：${[...seen].join('、')}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
