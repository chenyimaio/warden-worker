#!/usr/bin/env node
// scripts/route-parity.mjs
// 证据脚本：把 warden-worker（Rust）的 router.rs 与我们的 Hono 实际注册路由做集合比对。
// 用法：node scripts/route-parity.mjs [--strict]
//   --strict 时有差异则退出码 1（CI 用）
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import app from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const routerPath = resolve(here, '../../vendor/warden-worker/src/router.rs');

// ---- 1. 解析 Rust router.rs ----
const src = readFileSync(routerPath, 'utf8');
const normalized = new Set();

function normalizePath(p) {
  return (
    p
      .replace(/\{[^}]+\}/g, ':p') // Rust: {id}
      .replace(/\/:[A-Za-z0-9_]+/g, '/:p') // Hono: :id
      .replace(/\/+$/, '') || '/'
  );
}

for (let i = src.indexOf('.route('); i !== -1; i = src.indexOf('.route(', i + 1)) {
  const start = src.indexOf('(', i) + 1;
  let depth = 1;
  let j = start;
  while (j < src.length && depth > 0) {
    if (src[j] === '(') depth++;
    else if (src[j] === ')') depth--;
    j++;
  }
  const expr = src.slice(start, j - 1);
  const m = expr.match(/"([^"]+)"/);
  if (!m) continue;
  const path = normalizePath(m[1]);
  for (const mm of expr.matchAll(/\b(get|post|put|delete|patch)\s*\(/g)) {
    normalized.add(`${mm[1].toUpperCase()} ${path}`);
  }
}

// ---- 2. 取 Hono 实际注册的路由 ----
const ours = new Set();
for (const r of app.routes) {
  if (!r.method || r.method === 'ALL') continue;
  ours.add(`${r.method.toUpperCase()} ${normalizePath(r.path)}`);
}

// ---- 3. 比对 ----
const missing = [...normalized].filter((x) => !ours.has(x)).sort();
const extra = [...ours].filter((x) => !normalized.has(x)).sort();

console.log(`Rust 路由（方法+路径）: ${normalized.size}`);
console.log(`本实现注册路由:        ${ours.size}`);
console.log(`\n未实现 (${missing.length}):`);
for (const x of missing) console.log('  ⬜ ' + x);
console.log(`\n额外/差异路径 (${extra.length}):`);
for (const x of extra) console.log('  ➕ ' + x);

const strict = process.argv.includes('--strict');
const ok = missing.length === 0;
console.log(ok ? '\n✅ Rust 里的每条路由都已注册' : `\n❌ 还差 ${missing.length} 条`);
process.exit(ok || !strict ? 0 : 1);
