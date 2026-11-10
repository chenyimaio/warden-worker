#!/usr/bin/env node
// scripts/fetch-web-vault.mjs
// 把官方 Web Vault（Vaultwarden 维护的 bw_web_builds）解压到 public/（站点根）。
// 放在根目录而不是 public/vault/：EdgeOne 的静态层不对子目录做 index 解析，
// 放根目录时 / 天然就是入口，不需要任何重定向。
//
// **这个脚本现在只在手动刷新网页版时运行**（npm run webvault）。
// 产物已经入库，部署构建不再调用它 —— 构建不需要网络，产物也能被 review。
// 更新流程：先下好 tar 包，再用 WEB_VAULT_TARBALL 指过去，跑完提交 public/ 的变更。
//
// 环境变量：
//   WEB_VAULT_TARBALL  本地 tar 包路径（跳过下载；离线/内网构建用这个）
//   WEB_VAULT_VERSION  指定版本，默认 v2026.10.1
//   WEB_VAULT_BASE_URL 下载源前缀（默认 GitHub Release；国内下载慢/不通时可换镜像）
//   OUT_DIR            输出目录，默认 <repo>/edgeone/public（站点根，测试时可覆盖）
//   VAULT_MAX_FILE_MB  单个文件上限（默认 20），超过的文件会被删掉
//
// 任何一步失败都只告警并以 0 退出：宁可没有网页版，也不能把部署搞挂。
// 落地页会探测 /vault/index.html，构建失败时不会把用户重定向到空目录。
import { copyFileSync, createWriteStream, existsSync, mkdirSync, rmSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const VERSION = process.env.WEB_VAULT_VERSION || 'v2026.10.1';
const OUT_DIR = process.env.OUT_DIR || resolve(here, '../public');
const MAX_FILE_MB = Number(process.env.VAULT_MAX_FILE_MB || 20);

const log = (...a) => console.log('[web-vault]', ...a);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const base =
  process.env.WEB_VAULT_BASE_URL ||
  `https://github.com/dani-garcia/bw_web_builds/releases/download/${VERSION}`;
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
  const tmp = join(tmpdir(), `bw-web-${VERSION}-${Date.now()}`);
  const extractDir = join(tmp, 'extract');
  mkdirSync(extractDir, { recursive: true });
  const tgz = join(tmp, tarball);

  // 支持从本地 tar 包安装：离线构建、或先在能连 GitHub 的机器上下好再拿过来。
  // 校验逻辑完全一致（哈希还是照查），只是省掉下载这一步。
  const localTarball = process.env.WEB_VAULT_TARBALL;
  if (localTarball) {
    if (!existsSync(localTarball)) throw new Error(`WEB_VAULT_TARBALL 指向的文件不存在：${localTarball}`);
    copyFileSync(localTarball, tgz);
    log(`使用本地包 ${localTarball}`);
  } else {
    log(`下载 ${VERSION} ...`);
    await download(`${base}/${tarball}`, tgz);
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
      const sums = await (await fetch(`${base}/sha256sums.txt`)).text();
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
  log('网页版下载失败，本次部署将没有 /vault/ 网页版（后端功能不受影响）');
  log('原因:', e.message);
  log('下载地址:', `${base}/${tarball}`);
  log('');
  log('处理办法：');
  log('  1) 确认构建机能访问上面这个地址（国内构建机访问 GitHub Releases 常超时）');
  log('  2) 换下载源：设置 WEB_VAULT_BASE_URL 指向可达的镜像，然后重新部署');
  log('注意：镜像属于第三方，网页版会拿到你的主密码，请只使用你信任的源。');
  log('============================================================');
  process.exit(0);
});
