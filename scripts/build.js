#!/usr/bin/env node
'use strict';
// npm run build → dist/NSYSU-HUD.js (single file for Scriptable)

const fs = require('fs');
const path = require('path');
const { bundle } = require('./bundle');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

function build() {
  const out = bundle({ entry: path.join(root, 'src', 'widget', 'main.js'), root, version: pkg.version });
  const file = path.join(root, 'dist', 'NSYSU-HUD.js');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, out.code);
  return { file, ...out };
}

if (require.main === module) {
  const r = build();
  console.log(`已產生 ${path.relative(root, r.file)}（${r.modules.length} 個模組，${(r.code.length / 1024).toFixed(1)} KB，build ${r.hash}）`);
}

module.exports = { build };
