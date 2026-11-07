#!/usr/bin/env node
// scripts/migrate-hints.mjs
// 把库里仍然是明文的主密码提示一次性加密成 masterPasswordHintEnc，
// 并清空明文字段。开了 HINT_ENCRYPTION_SECRET 之后，旧账号的提示不会自动变密文，
// 这个脚本负责补上那一步。
//
// 用法（在本地跑，需要线上存储的凭据）：
//   STORE_DRIVER=blob BLOB_PROJECT_ID=... BLOB_TOKEN=... \
//   HINT_ENCRYPTION_SECRET='<同一个密钥>' \
//     node edgeone/scripts/migrate-hints.mjs [--dry-run]
//
// 说明：
//   - 已经有 masterPasswordHintEnc 的账号会跳过（幂等，可重复执行）
//   - 明文为空、或根本没有提示的账号也会跳过
//   - 只改 profile 里的提示字段，不动别的
import { getStore, keys } from '../src/store.js';
import { buildHintFields, hintEncryptionEnabled } from '../src/hint.js';

const dryRun = process.argv.includes('--dry-run');
const env = process.env;

if (!hintEncryptionEnabled(env)) {
  console.error('HINT_ENCRYPTION_SECRET 未设置或为 "*"（明文模式），不需要迁移。');
  process.exit(2);
}
if ((env.STORE_DRIVER ?? 'memory') !== 'blob') {
  console.warn('[warn] STORE_DRIVER 不是 blob，本次只会改动内存存储（等于空跑）。');
}

const PLAINTEXT_KEYS = ['masterPasswordHint', 'masterPasswordHintB64', ''];

const store = getStore(env);
const entries = await store.list('u/');
const profileKeys = entries.filter((e) => String(e.key).endsWith('/profile.json'));
console.log(`发现 ${profileKeys.length} 个 profile${dryRun ? '（dry-run，不写回）' : ''}`);

let encrypted = 0;
let skippedEncrypted = 0;
let skippedEmpty = 0;

for (const entry of profileKeys) {
  const uid = String(entry.key).split('/')[1];
  const prof = (await store.get(entry.key))?.value;
  if (!prof) continue;

  if (prof.masterPasswordHintEnc) {
    skippedEncrypted += 1;
    continue;
  }

  let plaintext = null;
  for (const k of PLAINTEXT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(prof, k)) {
      const v = prof[k];
      if (v != null && String(v).trim() !== '') {
        plaintext = String(v);
        break;
      }
    }
  }
  if (!plaintext) {
    skippedEmpty += 1;
    continue;
  }

  const fields = await buildHintFields(env, plaintext);
  if (dryRun) {
    console.log(`[dry-run] 会加密 ${uid} 的提示（${plaintext.length} 字符）`);
  } else {
    await store.put(keys.profile(uid), { ...prof, ...fields });
    console.log(`已加密 ${uid} 的提示（${plaintext.length} 字符）`);
  }
  encrypted += 1;
}

console.log(
  `\n完成：加密 ${encrypted} 个，跳过（已加密）${skippedEncrypted} 个，跳过（无提示）${skippedEmpty} 个`,
);
if (dryRun) console.log('这是 dry-run，去掉 --dry-run 才会真正写回。');
