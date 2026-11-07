#!/usr/bin/env node
// scripts/fetch-web-vault.mjs
// 部署构建时把官方 Web Vault（Vaultwarden 维护的 bw_web_builds）下载并解压到 public/vault/。
//
// 为什么构建时下载而不是入库：整包 ~40 MB（解压后更大），提交进 Git 会让仓库和每次部署都变重。
//
// 环境变量：
//   WEB_VAULT_ENABLED  = "false" 时跳过（不下载，站点只有落地页）
//   WEB_VAULT_VERSION  指定版本，默认 v2026.10.1
//   OUT_DIR            输出目录，默认 <repo>/edgeone/public/vault（测试时可覆盖）
//
// 任何一步失败都只告警并以 0 退出：宁可没有网页版，也不能把部署搞挂。
import { createWriteStream, existsSync, mkdirSync, rmSync, readFileSync, renameSync, readdirSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const VERSION = process.env.WEB_VAULT_VERSION || 'v2026.10.1';
const OUT_DIR = process.env.OUT_DIR || resolve(here, '../public/vault');
const enabled = String(process.env.WEB_VAULT_ENABLED ?? 'true').toLowerCase() !== 'false';

const log = (...a) => console.log('[web-vault]', ...a);

if (!enabled) {
  log('WEB_VAULT_ENABLED=false，跳过下载');
  process.exit(0);
}

const base =
  process.env.WEB_VAULT_BASE_URL ||
  `https://github.com/dani-garcia/bw_web_builds/releases/download/${VERSION}`;
const tarball = `bw_web_${VERSION}.tar.gz`;

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

async function main() {
  const tmp = join(tmpdir(), `bw-web-${VERSION}-${Date.now()}`);
  mkdirSync(tmp, { recursive: true });
  const tgz = join(tmp, tarball);

  log(`下载 ${VERSION} ...`);
  await download(`${base}/${tarball}`, tgz);

  // 校验 sha256
  try {
    const sums = await (await fetch(`${base}/sha256sums.txt`)).text();
    const line = sums.split('\n').find((l) => l.includes(tarball));
    if (line) {
      const want = line.trim().split(/\s+/)[0];
      const got = createHash('sha256').update(readFileSync(tgz)).digest('hex');
      if (want !== got) throw new Error(`sha256 不匹配（期望 ${want}，实际 ${got}）`);
      log('sha256 校验通过');
    } else {
      log('警告：sha256sums.txt 里没有该文件，跳过校验');
    }
  } catch (e) {
    log('警告：校验步骤失败（继续）:', e.message);
  }

  log('解压 ...');
  execFileSync('tar', ['-xzf', tgz, '-C', tmp], { stdio: 'inherit' });

  // 包内通常是一个 package/ 目录
  const inner = existsSync(join(tmp, 'package')) ? join(tmp, 'package') : tmp;
  const files = readdirSync(inner);
  log(`包内文件数: ${files.length}`);

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(dirname(OUT_DIR), { recursive: true });
  try {
    renameSync(inner, OUT_DIR);
  } catch {
    // 跨盘时 rename 会失败，退回 cp -r
    execFileSync('cp', ['-r', `${inner}/.`, OUT_DIR], { stdio: 'inherit' });
  }
  rmSync(tmp, { recursive: true, force: true });
  log(`完成 -> ${OUT_DIR}`);
}

main().catch((e) => {
  log('失败（不影响部署，站点将只有落地页）:', e.message);
  process.exit(0);
});
