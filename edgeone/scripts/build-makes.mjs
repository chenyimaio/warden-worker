#!/usr/bin/env node
// edgeone/scripts/build-makes.mjs
// 把整个后端（Hono + jose + nodemailer + 我们的 src/**）打成一个自包含的
// `cloud-functions/[[default]].js`，放在仓库根目录。
//
// 为什么必须这样做：
//   EdgeOne Pages 按仓库内容检测「是否含 Node 后端（server-handler）」，
//   只有当 cloud-functions/[[default]].js 存在时才把 /api/* 交给函数；
//   否则构建日志会写「No server-handler detected, generating routes.json for pure project」，
//   所有 /api/* 都会被当成静态资源 → 落到 index.html（我们就是这么被 404 的）。
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// 默认写到「仓库根/cloud-functions/[[default]].js」；本地联调可用 OUT 覆盖
const outfile = process.env.OUT || resolve(here, '../../cloud-functions/[[default]].js');

await build({
  entryPoints: [resolve(here, '../src/makers.js')],
  outfile,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  legalComments: 'none',
  // nodemailer 有可选的动态 require，交给运行时
  external: [],
  banner: {
    js: '// generated at deploy time by edgeone/scripts/build-makes.mjs — do not commit the built output',
  },
});

console.log(`[build-makes] wrote ${outfile}`);
