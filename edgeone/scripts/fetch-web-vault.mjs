#!/usr/bin/env node
// scripts/fetch-web-vault.mjs
// 部署构建时把官方 Web Vault（Vaultwarden 维护的 bw_web_builds）下载并解压到 public/（站点根）。
// 放在根目录而不是 public/vault/：EdgeOne 的静态层不对子目录做 index 解析，
// 放根目录时 / 天然就是入口，不需要任何重定向。
//
// 为什么构建时下载而不是入库：整包 ~40 MB（解压后更大），提交进 Git 会让仓库和每次部署都变重。
//
// 环境变量：
//   WEB_VAULT_ENABLED  = "false" 时跳过（不下载，站点只有落地页）
//   WEB_VAULT_VERSION  指定版本，默认 v2026.10.1
//   WEB_VAULT_BASE_URL 下载源前缀（默认 GitHub Release；国内构建慢/不通时可换镜像）
//   OUT_DIR            输出目录，默认 <repo>/edgeone/public（站点根，测试时可覆盖）
//   VAULT_MAX_FILE_MB  单个文件上限（默认 20），超过的文件会被删掉
//
// 任何一步失败都只告警并以 0 退出：宁可没有网页版，也不能把部署搞挂。
// 落地页会探测 /vault/index.html，构建失败时不会把用户重定向到空目录。
import { createWriteStream, existsSync, mkdirSync, rmSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
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
const enabled = String(process.env.WEB_VAULT_ENABLED ?? 'true').toLowerCase() !== 'false';

const log = (...a) => console.log('[web-vault]', ...a);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

if (!enabled) {
  // 落地页已删除，public/ 里没有别的东西；这里保证输出目录存在，
  // 否则 EdgeOne 会因为「输出目录不存在」直接判定构建失败。
  mkdirSync(OUT_DIR, { recursive: true });
  log('WEB_VAULT_ENABLED=false，跳过下载');
  process.exit(0);
}

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

  // 上游 index.html 里有一条历史遗留的 <link rel="stylesheet" href="css/vaultwarden.css">，
  // 但包内并没有这个文件。请求会落到函数兜底返回 501，每次加载页面都在控制台留一条错误。
  // 补一个空文件即可（真正的样式在 styles.<hash>.css 里）。
  const indexPath = join(OUT_DIR, 'index.html');
  let indexHtml = readFileSync(indexPath, 'utf8');
  if (indexHtml.includes('css/vaultwarden.css') && !existsSync(join(OUT_DIR, 'css/vaultwarden.css'))) {
    mkdirSync(join(OUT_DIR, 'css'), { recursive: true });
    writeFileSync(join(OUT_DIR, 'css/vaultwarden.css'), '/* placeholder: upstream index.html links this file but does not ship it */\n');
    log('补齐缺失的 css/vaultwarden.css（避免每次加载都 501）');
  }

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
  log('  3) 或者设 WEB_VAULT_ENABLED=false 明确表示「不要网页版」');
  log('注意：镜像属于第三方，网页版会拿到你的主密码，请只使用你信任的源。');
  log('============================================================');
  process.exit(0);
});
