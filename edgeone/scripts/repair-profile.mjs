#!/usr/bin/env node
// scripts/repair-profile.mjs —— 修复被手工改坏的 profile 对象
//
// ⚠️ 凭据等级：需要 BLOB_TOKEN，等价于对 Blob 的完全读写权限 ——
//    能改任意账号的 profile（包括提示与密钥材料）。仅限运维排查时临时使用。
//
// 典型症状：
//   - 提示值挂在空字符串键上：  "passwordIterations":600000,"":"123"
//   - 字段名被误敲进值里：      "updatedAt":"2026-11-07T1masterPasswordHint4:02:08.311Z"
//
// 用法：
//   BLOB_PROJECT_ID=pages-xxxx BLOB_TOKEN=xxx \
//     node scripts/repair-profile.mjs <邮箱> [--hint "新的提示"] [--dry-run]
//
// 做的事：
//   1) 从 masterPasswordHint / masterPasswordHintB64 / "" 里取出提示值
//   2) 删掉空字符串键
//   3) createdAt / updatedAt 不是合法时间就重置为当前时间
//   4) 提示统一写回 masterPasswordHint
//   5) 写回前打印 before/after，--dry-run 只打印不写
import { BlobStore, keys } from '../src/store.js';
import { emailKey } from '../src/crypto.js';

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** 纯函数：把 profile 修成规范形状，返回 { profile, notes } */
export function sanitizeProfile(input, { hint, now = new Date().toISOString() } = {}) {
  const p = { ...(input ?? {}) };
  const notes = [];

  // 0) 已启用加密存储：脚本不持有密钥，不要动它
  if (p.masterPasswordHintEnc) {
    if (hint !== undefined) {
      notes.push('该账号的提示是加密存储的，脚本无法重新加密；请改用 PUT /api/accounts/profile 修改');
      return { profile: p, notes, refused: true };
    }
    notes.push('提示为加密存储（masterPasswordHintEnc），保持原样');
    for (const k of ['createdAt', 'updatedAt']) {
      const v = p[k];
      if (typeof v !== 'string' || !ISO.test(v) || Number.isNaN(Date.parse(v))) {
        notes.push(`${k} 非法（${JSON.stringify(v)}）→ 重置为当前时间`);
        p[k] = now;
      }
    }
    delete p[''];
    return { profile: p, notes };
  }

  // 1) 取出提示
  let found = null;
  for (const k of ['masterPasswordHint', 'masterPasswordHintB64', '']) {
    if (Object.prototype.hasOwnProperty.call(p, k)) {
      const v = p[k];
      if (v != null && String(v).trim() !== '') {
        found = String(v);
        break;
      }
    }
  }
  if (hint !== undefined) {
    found = hint === null || hint === '' ? null : String(hint);
    notes.push(hint ? '提示按参数覆盖' : '提示被清空');
  }

  // 2) 删除空字符串键
  if (Object.prototype.hasOwnProperty.call(p, '')) {
    notes.push(`删除空字符串键（原值: ${JSON.stringify(p[''])}）`);
    delete p[''];
  }
  delete p.masterPasswordHintB64;

  // 3) 时间字段校验
  for (const k of ['createdAt', 'updatedAt']) {
    const v = p[k];
    if (typeof v !== 'string' || !ISO.test(v) || Number.isNaN(Date.parse(v))) {
      notes.push(`${k} 非法（${JSON.stringify(v)}）→ 重置为当前时间`);
      p[k] = now;
    }
  }

  // 4) 写回规范字段
  p.masterPasswordHint = found;
  if (!found && input && Object.prototype.hasOwnProperty.call(input, 'masterPasswordHint') && input.masterPasswordHint == null) {
    notes.push('提示为空');
  }
  return { profile: p, notes };
}

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const dryRun = args.includes('--dry-run');
  const hintIdx = args.indexOf('--hint');
  const hint = hintIdx >= 0 ? args[hintIdx + 1] : undefined;

  if (!email) {
    console.error('用法: node scripts/repair-profile.mjs <邮箱> [--hint "新的提示"] [--dry-run]');
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

  const idx = await store.get(keys.email(emailKey(email)));
  if (!idx?.value?.userId) {
    console.error(`找不到账号: ${email}`);
    process.exit(1);
  }
  const key = keys.profile(idx.value.userId);
  const cur = await store.get(key);
  if (!cur?.value) {
    console.error(`找不到 profile: ${key}`);
    process.exit(1);
  }

  const { profile, notes, refused } = sanitizeProfile(cur.value, { hint });
  if (refused) {
    console.log(`账号:   ${email}`);
    console.log(`对象:   ${key}`);
    console.log(`\n${notes.map((n) => '• ' + n).join('\n')}`);
    console.log('\n未写入。');
    process.exit(3);
  }

  console.log(`账号:   ${email}`);
  console.log(`对象:   ${key}`);
  console.log(`\n--- 修改前 ---\n${JSON.stringify(cur.value, null, 2)}`);
  console.log(`\n--- 修改后 ---\n${JSON.stringify(profile, null, 2)}`);
  console.log(`\n--- 变更 ---\n${notes.length ? notes.map((n) => '• ' + n).join('\n') : '• 无需变更'}`);

  if (dryRun) {
    console.log('\n[dry-run] 未写入');
    return;
  }
  await store.put(key, profile);
  const back = (await store.get(key))?.value;
  const ok = back && back.masterPasswordHint === profile.masterPasswordHint && !('' in back) && ISO.test(back.updatedAt);
  console.log(ok ? '\n✅ 已写入并回读校验通过' : '\n❌ 回读校验失败');
  process.exit(ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
