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
