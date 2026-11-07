#!/usr/bin/env node
// scripts/rotate-hints.mjs —— 换 HINT_ENCRYPTION_SECRET 之前/之后的迁移工具（不参与边缘函数打包）
//
// 两个用途：
//   1) 升级前体检：确认库里每条提示都能用「当前密钥」解开
//        node scripts/rotate-hints.mjs --check --old '<当前密钥>'
//   2) 换密钥：用旧密钥解密、用新密钥重新加密（可先 --dry-run）
//        node scripts/rotate-hints.mjs --old '<旧>' --new '<新>' --dry-run
//        node scripts/rotate-hints.mjs --old '<旧>' --new '<新>'
//
// 密钥也可以走环境变量：HINT_ENCRYPTION_SECRET_OLD / HINT_ENCRYPTION_SECRET_NEW。
// 需要线上存储凭据：STORE_DRIVER=blob BLOB_PROJECT_ID=... BLOB_TOKEN=...
//
// 幂等性：已经用新密钥加密的记录，用旧密钥解不开 → 会记一条「跳过（解不开）」，
// 不会破坏数据；重复执行安全。
import { getStore, keys } from '../src/store.js';
import { encryptHint, decryptHint } from '../src/hint.js';

/**
 * @param {{ list: Function, get: Function, put: Function }} store
 */
export async function rotateHints(store, { oldSecret, newSecret, dryRun = false, log = () => {} }) {
  const entries = await store.list('u/');
  const profileKeys = entries.filter((e) => String(e.key).endsWith('/profile.json'));

  const result = { total: profileKeys.length, rotated: 0, failed: 0, skipped: 0, already: 0 };

  for (const entry of profileKeys) {
    const uid = String(entry.key).split('/')[1];
    const prof = (await store.get(entry.key))?.value;
    if (!prof?.masterPasswordHintEnc) {
      result.skipped += 1;
      continue;
    }

    // 已经是新密钥加密的：直接跳过，保证可重复执行
    if (newSecret && newSecret !== oldSecret) {
      const withNew = await decryptHint({ HINT_ENCRYPTION_SECRET: newSecret }, prof.masterPasswordHintEnc);
      if (withNew != null) {
        result.already += 1;
        log(`= ${uid}：已经是新密钥，跳过`);
        continue;
      }
    }

    const plaintext = await decryptHint({ HINT_ENCRYPTION_SECRET: oldSecret }, prof.masterPasswordHintEnc);
    if (plaintext == null) {
      result.failed += 1;
      log(`✗ ${uid}：旧密钥解不开（已跳过，数据未改动）`);
      continue;
    }

    if (dryRun) {
      log(`[dry-run] ${uid}：可解密，将用新密钥重写`);
    } else {
      const enc = await encryptHint({ HINT_ENCRYPTION_SECRET: newSecret }, plaintext);
      await store.put(keys.profile(uid), { ...prof, masterPasswordHint: null, masterPasswordHintEnc: enc });
      log(`✓ ${uid}：已用新密钥重新加密`);
    }
    result.rotated += 1;
  }

  return result;
}

/** 只体检：用给定密钥尝试解开每一条，返回失败清单。 */
export async function checkHints(store, { secret, log = () => {} }) {
  const entries = await store.list('u/');
  const profileKeys = entries.filter((e) => String(e.key).endsWith('/profile.json'));
  const result = { total: profileKeys.length, ok: 0, failed: 0, plaintext: 0 };
  for (const entry of profileKeys) {
    const uid = String(entry.key).split('/')[1];
    const prof = (await store.get(entry.key))?.value;
    if (!prof?.masterPasswordHintEnc) {
      result.plaintext += 1;
      continue;
    }
    const pt = await decryptHint({ HINT_ENCRYPTION_SECRET: secret }, prof.masterPasswordHintEnc);
    if (pt == null) {
      result.failed += 1;
      log(`✗ ${uid}：用这个密钥解不开`);
    } else {
      result.ok += 1;
    }
  }
  return result;
}

// ---------------------------------------------------------------- CLI
const isMain = process.argv[1] && process.argv[1].endsWith('rotate-hints.mjs');
if (isMain) {
  const args = process.argv.slice(2);
  const argOf = (name) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null;
  };
  const dryRun = args.includes('--dry-run');
  const checkOnly = args.includes('--check');
  const oldSecret = argOf('--old') ?? process.env.HINT_ENCRYPTION_SECRET_OLD ?? '';
  const newSecret = argOf('--new') ?? process.env.HINT_ENCRYPTION_SECRET_NEW ?? '';

  if (!oldSecret || oldSecret === '*') {
    console.error('缺少旧密钥：--old <secret>（或 HINT_ENCRYPTION_SECRET_OLD）。');
    process.exit(2);
  }
  if (!checkOnly && (!newSecret || newSecret === '*')) {
    console.error('缺少新密钥：--new <secret>（或 HINT_ENCRYPTION_SECRET_NEW）。');
    process.exit(2);
  }
  if ((process.env.STORE_DRIVER ?? 'memory') !== 'blob') {
    console.warn('[warn] STORE_DRIVER 不是 blob，本次只会动内存存储（等于空跑）。');
  }

  const store = getStore(process.env);
  const log = (msg) => console.log(msg);

  if (checkOnly) {
    const r = await checkHints(store, { secret: oldSecret, log });
    console.log(
      `\n体检结果：共 ${r.total} 个 profile，可解密 ${r.ok}，解不开 ${r.failed}，无密文（明文或未设置）${r.plaintext}`,
    );
    process.exit(r.failed > 0 ? 1 : 0);
  }

  const r = await rotateHints(store, { oldSecret, newSecret, dryRun, log });
  console.log(
    `\n完成${dryRun ? '（dry-run，未写回）' : ''}：共 ${r.total} 个 profile，重写 ${r.rotated}，已是新密钥 ${r.already}，解不开 ${r.failed}，无密文 ${r.skipped}`,
  );
  if (r.failed > 0) {
    console.error('有记录用旧密钥解不开：先确认 --old 是否就是它们加密时用的密钥，再重跑。');
    process.exit(1);
  }
}
