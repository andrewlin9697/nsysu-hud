'use strict';
// Runs a built bundle (dist/NSYSU-HUD.js) in an isolated vm context with fake Scriptable globals
// and a frozen clock. The context has no Node APIs (no require, URL, fetch, setTimeout, Buffer),
// just like Scriptable's JavaScriptCore. Dev / test only.

const vm = require('vm');
const { createScriptableEnv } = require('./fake-scriptable');

function freezeClock(ctx, now) {
  vm.runInContext(`(() => {
    const RealDate = Date;
    let fixed = ${now.getTime()};
    class FakeDate extends RealDate {
      constructor(...a) { if (a.length === 0) super(fixed); else super(...a); }
      static now() { return fixed; }
    }
    globalThis.Date = FakeDate;
    globalThis.__setNow = (t) => { fixed = t; };
  })()`, ctx);
}

/**
 * opts: { code, now, runsInWidget, family, fetch(url) → { status, body }, events, files, runOpts }
 * → { result, record, files, logs }
 */
async function runBundle(opts) {
  const env = createScriptableEnv({ ...opts, now: () => opts.now });
  const logs = [];
  const ctx = vm.createContext({ ...env.globals, console: { log: (...a) => logs.push(a.join(' ')), error: (...a) => logs.push(a.join(' ')) } });
  freezeClock(ctx, opts.now);
  const fn = vm.runInContext(`(function (module, exports) {\n${opts.code}\n})`, ctx, { filename: 'NSYSU-HUD.js' });
  const mod = { exports: {} };
  fn(mod, mod.exports);
  const result = await mod.exports.run({ ...(opts.runOpts || {}) });
  return { result, record: env.record, files: env.files, logs, exports: mod.exports, globals: env.globals };
}

module.exports = { runBundle, freezeClock };
