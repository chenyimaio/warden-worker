#!/usr/bin/env node
// scripts/sync-handler.mjs
// 把构建出的 cloud-functions/[[default]].js 同步到两个可能被 EdgeOne 当成
// 「server-handler」的位置：
//   <repo>/cloud-functions/[[default]].js
//   <repo>/edgeone/cloud-functions/[[default]].js
//
// 因为项目根目录既可能设成仓库根、也可能设成 edgeone/，两种布局都得有新鲜产物；
// 上次部署日志里出现过 "No server-handler detected"，多写一份最省事。
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const edgeoneDir = resolve(here, '..');
const repoRoot = resolve(edgeoneDir, '..');
const NAME = '[[default]].js';

const targets = [
  join(edgeoneDir, 'cloud-functions', NAME),
  join(repoRoot, 'cloud-functions', NAME),
];

const src = targets.find((p) => existsSync(p));
if (!src) {
  console.error('[sync-handler] 没找到构建产物，跳过：', targets.join(' | '));
  process.exit(0);
}

const kb = (p) => `${(statSync(p).size / 1024).toFixed(0)} KB`;
for (const target of targets) {
  if (resolve(target) === resolve(src)) {
    console.log(`[sync-handler] 源文件 ${target} (${kb(target)})`);
    continue;
  }
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(src, target);
  console.log(`[sync-handler] 已复制 -> ${target} (${kb(target)})`);
}
