#!/usr/bin/env node
// scripts/doc-check.mjs
// 文档漂移检查：代码里读的环境变量 vs README 表格 vs .env.example。
// 用法：node scripts/doc-check.mjs
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const srcFiles = readdirSync(join(root, 'src')).filter((f) => f.endsWith('.js'));
const code = srcFiles.map((f) => readFileSync(join(root, 'src', f), 'utf8')).join('\n');

const used = new Set();
for (const m of code.matchAll(/envGet\(\s*c\s*,\s*'([A-Z0-9_]+)'/g)) used.add(m[1]);
for (const m of code.matchAll(/cfg\(\s*env\s*,\s*'([A-Z0-9_]+)'/g)) used.add(m[1]);
for (const m of code.matchAll(/secret\(\s*env\s*,\s*'([A-Z0-9_]+)'/g)) used.add(m[1]);
for (const m of code.matchAll(/process\.env\.([A-Z0-9_]+)/g)) used.add(m[1]);
for (const m of code.matchAll(/env\?\.([A-Z0-9_]{2,})/g)) used.add(m[1]);
for (const m of code.matchAll(/env\?\.\[\s*'([A-Z0-9_]+)'\s*\]/g)) used.add(m[1]);

const readme = readFileSync(join(root, 'README.md'), 'utf8');
const documented = new Set();
for (const line of readme.split('\n')) {
  if (!line.trim().startsWith('|')) continue;
  for (const m of line.matchAll(/`([A-Z][A-Z0-9_]{2,})`/g)) {
    // 过滤 EXCEPT 这类说明性大写词：环境变量要么带下划线，要么是 PORT
    if (!m[1].includes('_') && m[1] !== 'PORT') continue;
    documented.add(m[1]);
  }
}

const examplePath = join(root, '.env.example');
const example = new Set();
if (existsSync(examplePath)) {
  for (const line of readFileSync(examplePath, 'utf8').split('\n')) {
    const m = line.match(/^#?\s*([A-Z0-9_]+)=/);
    if (m) example.add(m[1]);
  }
}

const diff = (a, b) => [...a].filter((x) => !b.has(x)).sort();

// 只在构建期脚本（fetch-web-vault / build-makes）里用，不进 src，不算文档漂移
const BUILD_TIME_ONLY = new Set(['WEB_VAULT_VERSION', 'OUT_DIR', 'VAULT_MAX_FILE_MB', 'OUT']);
for (const v of BUILD_TIME_ONLY) { used.delete(v); documented.delete(v); }

const undocumented = diff(used, documented);
const unusedDocs = diff(documented, used);
const missingExample = diff(used, example);

console.log(`代码中使用: ${used.size} 个变量`);
console.log(`README 记录: ${documented.size} 个`);
console.log(`.env.example: ${example.size} 个\n`);

let bad = 0;
const report = (title, list) => {
  if (!list.length) {
    console.log(`✅ ${title}: 无`);
    return;
  }
  bad += list.length;
  console.log(`❌ ${title} (${list.length}): ${list.join(', ')}`);
};

report('代码用到但 README 未记录', undocumented);
report('README 有但代码没用到', unusedDocs);
report('代码用到但 .env.example 缺失', missingExample);

// package.json 里的脚本必须真的存在
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
  const m = cmd.match(/node\s+(\S+\.m?js)/);
  if (m && !existsSync(join(root, m[1]))) {
    bad++;
    console.log(`❌ npm run ${name} 指向不存在的文件: ${m[1]}`);
  }
}
if (!bad) console.log('✅ npm scripts 指向的文件都存在');

process.exit(bad ? 1 : 0);
