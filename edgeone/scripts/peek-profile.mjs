#!/usr/bin/env node
// scripts/peek-profile.mjs —— 打印某个账号在 Blob 里的原始 profile JSON
//
// 用法：
//   BLOB_PROJECT_ID=pages-xxxx BLOB_TOKEN=xxx node scripts/peek-profile.mjs <邮箱>
//
// 用途：核对「主密码提示」到底落在哪个字段名上（控制台的 JSON 预览可能吞掉键名）。
import { BlobStore, keys } from '../src/store.js';
import { emailKey } from '../src/crypto.js';

const email = process.argv[2];
if (!email) {
  console.error('用法: node scripts/peek-profile.mjs <邮箱>');
  process.exit(2);
}
if (!process.env.BLOB_PROJECT_ID || !process.env.BLOB_TOKEN) {
  console.error('缺少 BLOB_PROJECT_ID / BLOB_TOKEN');
  process.exit(2);
}

const store = new BlobStore({
  BLOB_STORE: process.env.BLOB_STORE || 'warden',
  BLOB_PROJECT_ID: process.env.BLOB_PROJECT_ID,
  BLOB_TOKEN: process.env.BLOB_TOKEN,
});

const idxKey = keys.email(emailKey(email));
const idx = await store.get(idxKey);
console.log(`索引对象: ${idxKey}`);
console.log(`  内容: ${JSON.stringify(idx?.value ?? null)}`);

if (!idx?.value?.userId) {
  console.error('找不到账号');
  process.exit(1);
}

const key = keys.profile(idx.value.userId);
const prof = await store.get(key);
console.log(`\nProfile 对象: ${key}`);
console.log(JSON.stringify(prof?.value ?? null, null, 2));

const v = prof?.value ?? {};
console.log('\n--- 检查 ---');
console.log(`masterPasswordHint: ${JSON.stringify(v.masterPasswordHint ?? null)}`);
const emptyKeys = Object.keys(v).filter((k) => k.trim() === '');
if (emptyKeys.length) {
  console.log(`⚠️ 存在空字符串键: ${emptyKeys.map((k) => JSON.stringify(v[k])).join(', ')}`);
} else {
  console.log('无空字符串键');
}
console.log(`所有字段名: ${Object.keys(v).join(', ')}`);
