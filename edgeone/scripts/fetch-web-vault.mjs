#!/usr/bin/env node
// scripts/fetch-web-vault.mjs
// 把官方 Web Vault（Vaultwarden 维护的 bw_web_builds）解压到 public/（站点根）。
// 放在根目录而不是 public/vault/：EdgeOne 的静态层不对子目录做 index 解析，
// 放根目录时 / 天然就是入口，不需要任何重定向。
//
// **产物已入库，部署构建不调用这个脚本。** 它只在手动升级网页版时跑。
//
// 只有一个开关 WEB_VAULT_VERSION：
//   不设置        -> 什么都不做，继续用仓库里已入库的 public/
//   设置版本号    -> 拉取该版本（例：WEB_VAULT_VERSION=v2026.10.1）
//   设置 tar 路径 -> 用本地包，不联网（例：WEB_VAULT_VERSION=/tmp/bw_web_v2026.10.1.tar.gz）
//
// 其他内部开关（一般不用动）：
//   OUT_DIR            输出目录，默认 <repo>/edgeone/public
//   VAULT_MAX_FILE_MB  单个文件上限（默认 20），超过的文件会被删掉
//
// 任何一步失败都只告警并以 0 退出：宁可没有网页版，也不能把部署搞挂。
import { copyFileSync, createWriteStream, existsSync, mkdirSync, rmSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = process.env.OUT_DIR || resolve(here, '../public');
const MAX_FILE_MB = Number(process.env.VAULT_MAX_FILE_MB || 20);

const log = (...a) => console.log('[web-vault]', ...a);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// 只有一个开关：WEB_VAULT_VERSION。
//   不设      -> 什么都不做，用仓库里已入库的 public/
//   设 vX.Y.Z -> 拉这个版本
//   设一个 .tar.gz 路径 -> 用本地包（离线/内网）
// 值里带路径分隔符或以 .tar.gz/.tgz 结尾就当本地包，否则当版本号。
const ARG = String(process.env.WEB_VAULT_VERSION ?? '').trim();
const looksLocal = /\.(tar\.gz|tgz)$/i.test(ARG) || ARG.includes('/') || ARG.includes('\\');
const LOCAL_TARBALL = looksLocal ? ARG : '';
const VERSION = looksLocal
  ? (/bw_web_(v[0-9][^/\\]*)\.tar\.gz$/i.exec(ARG)?.[1] ?? 'local')
  : ARG || 'v2026.10.1';

const DOWNLOAD_BASE = 'https://github.com/dani-garcia/bw_web_builds/releases/download';
const tarball = `bw_web_${VERSION}.tar.gz`;

async function download(url, dest) {
  // 构建机网络抖动很常见，重试几次比直接放弃划算
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      return;
    } catch (e) {
      lastErr = e;
      log(`下载失败（第 ${attempt}/3 次）:`, e.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
  throw new Error(`${lastErr?.message || 'unknown'} <- ${url}`);
}

/** 递归列出文件（返回 {path, size}）。 */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push({ path: full, size: statSync(full).size });
  }
  return out;
}

/** 删掉 source map 和超大文件：EdgeOne 单文件上限 25MiB，且总包越小越好。 */
function prune(dir) {
  const maxBytes = MAX_FILE_MB * 1024 * 1024;
  let removed = 0;
  let freed = 0;
  for (const f of walk(dir)) {
    const isMap = f.path.endsWith('.map');
    const tooBig = f.size > maxBytes;
    if (isMap || tooBig) {
      unlinkSync(f.path);
      removed += 1;
      freed += f.size;
      if (tooBig && !isMap) log(`  删除超大文件 ${f.path.replace(dir, '')} (${mb(f.size)})`);
    }
  }
  if (removed) log(`  已删除 ${removed} 个文件（source map / 超过 ${MAX_FILE_MB}MB），释放 ${mb(freed)}`);
}

async function main() {
  // 没有 WEB_VAULT_VERSION 就什么都不做：仓库里的 public/ 就是当前使用的版本。
  // 「不设置 = 用仓库的」让这个脚本默认没有副作用，误跑一次不会覆盖已入库的产物。
  if (!ARG) {
    let vendored = '未知';
    try {
      vendored = JSON.parse(readFileSync(join(OUT_DIR, 'vw-version.json'), 'utf8')).version ?? vendored;
    } catch {
      /* 没有 vw-version.json 就只报"未知" */
    }
    log(`未设置 WEB_VAULT_VERSION，保留仓库里已入库的网页版（${vendored}）`);
    log('要更新就设成目标版本号，或设成已下载好的 .tar.gz 路径');
    return;
  }

  const tmp = join(tmpdir(), `bw-web-${VERSION}-${Date.now()}`);
  const extractDir = join(tmp, 'extract');
  mkdirSync(extractDir, { recursive: true });
  const tgz = join(tmp, tarball);

  // 本地包（WEB_VAULT_VERSION 指到 .tar.gz）走这条；否则下载。
  if (LOCAL_TARBALL) {
    if (!existsSync(LOCAL_TARBALL)) throw new Error(`WEB_VAULT_VERSION 指向的本地包不存在：${LOCAL_TARBALL}`);
    copyFileSync(LOCAL_TARBALL, tgz);
    log(`使用本地包 ${LOCAL_TARBALL}`);
  } else {
    log(`下载 ${VERSION} ...`);
    await download(`${DOWNLOAD_BASE}/${VERSION}/${tarball}`, tgz);
  }

  // 校验 sha256：优先用仓库里钉死的哈希，其次用同源的 sha256sums.txt。
  // 只用同源校验和只能防传输损坏 —— 源被篡改时可以同时改包和校验和。
  const PINNED_SHA256 = {
    'v2026.10.1': '354de9056c871e48db84975985e7d57c111ac6537bd4e4720488019e8638060f',
  };
  const gotHash = createHash('sha256').update(readFileSync(tgz)).digest('hex');
  const pinned = PINNED_SHA256[VERSION];
  if (pinned) {
    if (pinned !== gotHash) throw new Error(`sha256 与仓库钉住的值不一致（期望 ${pinned}，实际 ${gotHash}）`);
    log('sha256 校验通过（仓库钉住的哈希）');
  } else {
    try {
      const sums = await (await fetch(`${DOWNLOAD_BASE}/${VERSION}/sha256sums.txt`)).text();
      const line = sums.split('\n').find((l) => l.includes(tarball));
      if (!line) throw new Error(`sha256sums.txt 里没有 ${tarball}`);
      const want = line.trim().split(/\s+/)[0];
      if (want !== gotHash) throw new Error(`sha256 不匹配（期望 ${want}，实际 ${gotHash}）`);
      log('sha256 校验通过（同源 sha256sums.txt；该版本未被仓库钉住，建议补进 PINNED_SHA256）');
    } catch (e) {
      throw new Error(
        `无法校验 ${tarball} 的完整性：${e.message}。` +
          `如果要继续使用这个版本，请把 sha256 ${gotHash} 加进 scripts/fetch-web-vault.mjs 的 PINNED_SHA256。`,
      );
    }
  }

  log('解压 ...');
  // 解压到独立子目录，避免把下载的 tar.gz 一起搬进产物（上次 39MB 的包就是这么进去的）。
  // 用相对路径 + cwd，避免 Windows 上 bsdtar 把 "C:\..." 当成 host:path。
  execFileSync('tar', ['-xzf', tarball, '-C', 'extract'], { cwd: tmp, stdio: 'inherit' });

  // 包内通常是一个顶层目录（web-vault/ 或 package/），取它作为站点根，
  // 这样 public/vault/index.html 才是网页版入口，而不是 public/vault/web-vault/index.html。
  const top = readdirSync(extractDir, { withFileTypes: true });
  const inner =
    top.length === 1 && top[0].isDirectory() ? join(extractDir, top[0].name) : extractDir;
  log(`站点根: ${inner.replace(extractDir, '<archive>')}`);

  const before = walk(inner).reduce((n, f) => n + f.size, 0);
  prune(inner);
  const after = walk(inner).reduce((n, f) => n + f.size, 0);
  log(`体积 ${mb(before)} -> ${mb(after)}`);

  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(dirname(OUT_DIR), { recursive: true });
  try {
    renameSync(inner, OUT_DIR);
  } catch {
    // 跨盘时 rename 会失败，退回 cp -r
    execFileSync('cp', ['-r', `${inner}/.`, OUT_DIR], { stdio: 'inherit' });
  }
  rmSync(tmp, { recursive: true, force: true });

  if (!existsSync(join(OUT_DIR, 'index.html'))) {
    throw new Error('产物里没有 index.html，站点根选错了');
  }

  // 上游 index.html 里有一条 <link rel="stylesheet" href="css/vaultwarden.css">，
  // 但 tar 包里不带这个文件 —— 它由 Vaultwarden 服务端按配置提供。
  //
  // 这个文件**不是可有可无的**。Vaultwarden 的补丁在登录页里无条件渲染了两组元素：
  //   普通登录：input.vw-email-continue / button.vw-continue-login
  //   SSO 登录：input.vw-email-sso / button.vw-sso-login / div.vw-or-text / button.vw-other-login
  // 两组都绑在同一个 formControlName="email" 上，靠 CSS 隐藏不该出现的那组。
  // 之前这里写的是空占位文件，于是登录页同时出现两个邮箱输入框 —— 就是那个"两个邮箱"怪象。
  //
  // 我们不实现 SSO，所以固定隐藏 SSO 那一组。
  const vodCss = `/* Served in place of Vaultwarden's css/vaultwarden.css.
 * The upstream build renders both the normal and the SSO login controls
 * unconditionally (both bound to formControlName="email"); this file hides the
 * SSO variants. This deployment has no SSO backend, so they are always hidden.
 */
.vw-email-sso,
.vw-sso-login,
.vw-or-text,
.vw-other-login {
  display: none !important;
}
`;
  {
    const indexPath0 = join(OUT_DIR, 'index.html');
    const cssPath = join(OUT_DIR, 'css', 'vaultwarden.css');
    const html0 = readFileSync(indexPath0, 'utf8');
    if (html0.includes('css/vaultwarden.css')) {
      mkdirSync(join(OUT_DIR, 'css'), { recursive: true });
      writeFileSync(cssPath, vodCss);
      log('写入 css/vaultwarden.css（隐藏 SSO 专用登录控件）');
    }
  }

  // 注意：这里**不往 index.html 里注入任何脚本**。这个页面会处理主密码，
  // 任何第三方注入都等于在密钥旁边放代码。


  log(`完成 -> ${OUT_DIR} (${mb(after)}, ${walk(OUT_DIR).length} 个文件)`);
}

main().catch((e) => {
  log('============================================================');
  log('网页版更新失败，仓库里已入库的版本保持不动（后端完全不受影响）');
  log('原因:', e.message);
  log('下载地址:', `${DOWNLOAD_BASE}/${VERSION}/${tarball}`);
  log('');
  log('处理办法：');
  log('  1) 确认这台机器能访问上面这个地址');
  log('  2) 访问不了就先在别处把 tar 包下好，再指过去：');
  log(`     WEB_VAULT_VERSION=/path/to/bw_web_${VERSION}.tar.gz npm run webvault`);
  log('注意：网页版会拿到你的主密码，请只使用你信任的来源。');
  log('============================================================');
  process.exit(0);
});
