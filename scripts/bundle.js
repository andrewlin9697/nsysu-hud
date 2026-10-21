'use strict';
// Tiny CommonJS bundler: Scriptable can't load npm modules, so src/widget is merged into one file.
// Only relative require('./x') calls and .json files are allowed — anything else fails the build,
// which also keeps Node-only modules (fs, path, …) out of the phone bundle.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REQUIRE_RE = /\brequire\(\s*(['"])([^'"]+)\1\s*\)/g;

function stripComments(src) {
  // Good enough for our own sources: drop // line comments and /* */ blocks outside strings.
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
}

function resolveFile(fromDir, spec) {
  const base = path.resolve(fromDir, spec);
  for (const cand of [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')]) {
    if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return cand;
  }
  throw new Error(`找不到模組 ${spec}（從 ${fromDir}）`);
}

function collect(entry, root) {
  const modules = new Map();
  const queue = [path.resolve(entry)];
  while (queue.length) {
    const file = queue.shift();
    const id = path.relative(root, file).split(path.sep).join('/');
    if (modules.has(id)) continue;
    const raw = fs.readFileSync(file, 'utf8');
    if (file.endsWith('.json')) {
      modules.set(id, { id, code: `module.exports = ${JSON.stringify(JSON.parse(raw))};`, deps: {} });
      continue;
    }
    const deps = {};
    let m;
    const scan = stripComments(raw);
    REQUIRE_RE.lastIndex = 0;
    while ((m = REQUIRE_RE.exec(scan))) {
      const spec = m[2];
      if (!spec.startsWith('.')) throw new Error(`${id} 用了不能打包的模組 "${spec}"（小工具只能用相對路徑的原始碼）`);
      const target = resolveFile(path.dirname(file), spec);
      deps[spec] = path.relative(root, target).split(path.sep).join('/');
      queue.push(target);
    }
    modules.set(id, { id, code: raw, deps });
  }
  return [...modules.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function bundle({ entry, root, version }) {
  const mods = collect(entry, root);
  const entryId = path.relative(root, path.resolve(entry)).split(path.sep).join('/');
  const hash = crypto.createHash('sha256').update(mods.map((m) => `${m.id}\n${m.code}`).join('\n')).digest('hex').slice(0, 10);
  const body = mods.map((m) => `${JSON.stringify(m.id)}: [function (module, exports, require) {\n${m.code.trim()}\n}, ${JSON.stringify(m.deps)}]`).join(',\n\n');
  const code = `// NSYSU-HUD 主程式 v${version}（build ${hash}）
// 這個檔案是 \`npm run build\` 自動產生的，請不要直接修改；原始碼在 src/。
// 安裝：只要把 install/HUD-Loader.js 貼到 Scriptable，它會自動下載並每天更新這個檔案。
// https://github.com/andrewlin9697/nsysu-hud
'use strict';
const __HUD_BUILD__ = ${JSON.stringify({ version, hash })};
const __HUD_MODULES__ = {
${body}
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
module.exports = __hudRequire(${JSON.stringify(entryId)});
`;
  return { code, hash, modules: mods.map((m) => m.id) };
}

module.exports = { bundle, collect };
