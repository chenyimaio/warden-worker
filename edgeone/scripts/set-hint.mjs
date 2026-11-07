#!/usr/bin/env node
// scripts/set-hint.mjs —— 直接改某个账号的「主密码提示」（不走业务接口，改完立即生效）
//
// 用法（外部访问模式，需要控制台生成 API Token）：
//   BLOB_PROJECT_ID=pages-xxxx BLOB_TOKEN=xxx \
//     node scripts/set-hint.mjs <邮箱> <新的提示>
//
//   # 清除提示：
//   BLOB_PROJECT_ID=... BLOB_TOKEN=... node scripts/set-hint.mjs <邮箱> --clear
//
// 说明：hint 是明文存在 u/{userId}/profile.json 的 masterPasswordHint 字段，
// 这里做的是「读 → 改一个字段 → 写回」，其它字段原样保留。
import { BlobStore, keys } from '../src/store.js';
import { emailKey } from '../src/crypto.js';

const [email, ...rest] = process.argv.slice(2);
const clear = rest.includes('--clear');
const hint = clear ? null : rest.join(' ').trim();

if (!email || (!hint && !clear)) {
  console.error('用法: node scripts/set-hint.mjs <邮箱> <新的提示> | --clear');
  process.exit(2);
}
if (!process.env.BLOB_PROJECT_ID || !process.env.BLOB_TOKEN) {
  console.error('缺少 BLOB_PROJECT_ID / BLOB_TOKEN（控制台 → API Token 生成）');
  process.exit(2);
}

const store = new BlobStore({
  BLOB_STORE: process.env.BLOB_STORE || 'warden',
  BLOB_PROJECT_ID: process.env.BLOB_PROJECT_ID,
  BLOB_TOKEN: process.env.BLOB_TOKEN,
});

const idx = await store.get(keys.email(emailKey(email)));
if (!idx?.value?.userId) {
  console.error(`找不到账号: ${email}`);
  process.exit(1);
}

const userId = idx.value.userId;
const key = keys.profile(userId);
const prof = await store.get(key);
if (!prof?.value) {
  console.error(`找不到 profile: ${key}`);
  process.exit(1);
}

const before = prof.value.masterPasswordHint ?? null;
await store.put(key, {
  ...prof.value,
  masterPasswordHint: hint,
  updatedAt: new Date().toISOString(),
});

const after = (await store.get(key))?.value?.masterPasswordHint ?? null;
console.log(`账号:   ${email}`);
console.log(`userId: ${userId}`);
console.log(`对象:   ${key}`);
console.log(`原提示: ${before === null ? '(空)' : before}`);
console.log(`新提示: ${after === null ? '(空)' : after}`);
console.log(after === hint ? '✅ 已写入并回读一致' : '❌ 回读不一致，请重试');
process.exit(after === hint ? 0 : 1);
