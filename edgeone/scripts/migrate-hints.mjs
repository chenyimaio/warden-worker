#!/usr/bin/env node
// scripts/migrate-hints.mjs —— 把库里遗留的密文提示还原成明文（不参与边缘函数打包）
//
// 当前模型：提示**明文落库**，HINT_ENCRYPTION_SECRET 只决定邮件里发密文还是明文。
// 早期版本会把提示加密后存进 masterPasswordHintEnc；这个脚本负责把它们一次性还原。
//
// 用法（在本地跑，需要线上存储凭据）：
//   STORE_DRIVER=blob BLOB_PROJECT_ID=... BLOB_TOKEN=... \
//   HINT_ENCRYPTION_SECRET='<当初加密用的那个密钥>' \
//     node edgeone/scripts/migrate-hints.mjs [--dry-run]
//
// 说明：
//   - 已经是明文（没有 masterPasswordHintEnc）的账号会跳过；幂等，可重复执行
//   - 解不开的记录（密钥不对）只报告、不改动，并以非零退出
import { getStore, keys } from '../src/store.js';
import { decryptHint } from '../src/hint.js';

const dryRun = process.argv.includes('--dry-run');
const env = process.env;
const secret = env.HINT_ENCRYPTION_SECRET ?? '';

if (!secret || secret === '*') {
  console.error('缺少密钥：HINT_ENCRYPTION_SECRET 必须是当初加密用的那个（不能是 *）。');
  process.exit(2);
}
if ((env.STORE_DRIVER ?? 'memory') !== 'blob') {
  console.warn('[warn] STORE_DRIVER 不是 blob，本次只会改动内存存储（等于空跑）。');
}

const store = getStore(env);
const entries = await store.list('u/');
const profileKeys = entries.filter((e) => String(e.key).endsWith('/profile.json'));
console.log(`发现 ${profileKeys.length} 个 profile${dryRun ? '（dry-run，不写回）' : ''}`);

let restored = 0;
let skippedPlain = 0;
let failed = 0;

for (const entry of profileKeys) {
  const uid = String(entry.key).split('/')[1];
  const prof = (await store.get(entry.key))?.value;
  if (!prof) continue;

  if (!prof.masterPasswordHintEnc) {
    skippedPlain += 1;
    continue;
  }

  const plaintext = await decryptHint({ HINT_ENCRYPTION_SECRET: secret }, prof.masterPasswordHintEnc);
  if (plaintext == null) {
    failed += 1;
    console.error(`✗ ${uid}：用这个密钥解不开（已跳过，数据未改动）`);
    continue;
  }

  if (dryRun) {
    console.log(`[dry-run] ${uid}：会还原成明文（${plaintext.length} 字符）`);
  } else {
    await store.put(keys.profile(uid), {
      ...prof,
      masterPasswordHint: plaintext,
      masterPasswordHintEnc: null,
    });
    console.log(`✓ ${uid}：已还原成明文`);
  }
  restored += 1;
}

console.log(
  `\n完成${dryRun ? '（dry-run，未写回）' : ''}：还原 ${restored} 个，跳过（本来就是明文）${skippedPlain} 个，解不开 ${failed} 个`,
);
if (failed > 0) {
  console.error('有记录解不开：确认 HINT_ENCRYPTION_SECRET 是否是它们加密时用的那个。');
  process.exit(1);
}
