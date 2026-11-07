#!/usr/bin/env node
// scripts/blob-selftest.mjs
// 在**外部**环境验证 Makers Blob 读写（需要 projectId + token，控制台可生成 API Token）。
// 部署后在 Functions 里跑则只需命名空间，无需 token。
//
// 用法：
//   BLOB_PROJECT_ID=pages-xxxx BLOB_TOKEN=xxx BLOB_STORE=warden node scripts/blob-selftest.mjs
import { BlobStore } from '../src/store.js';

const projectId = process.env.BLOB_PROJECT_ID;
const token = process.env.BLOB_TOKEN;
if (!projectId || !token) {
  console.error('缺少 BLOB_PROJECT_ID / BLOB_TOKEN（外部访问模式）。');
  console.error('若在 Makers Functions 内运行，直接 getStore(name) 即可，不需要这两个变量。');
  process.exit(2);
}

const store = new BlobStore({
  BLOB_STORE: process.env.BLOB_STORE || 'warden',
  BLOB_PROJECT_ID: projectId,
  BLOB_TOKEN: token,
});

const key = `selftest/${Date.now()}.json`;
const payload = { ok: true, at: new Date().toISOString() };

await store.put(key, payload);
const got = await store.get(key);
if (!got || got.value?.ok !== true) {
  console.error('❌ 写入后强一致读取失败', got);
  process.exit(1);
}

const listed = await store.list('selftest/');
if (!listed.some((b) => b.key === key)) {
  console.error('❌ list 没找到刚写入的对象', listed.slice(0, 5));
  process.exit(1);
}

const head = await store.head(key);
await store.del(key);
const afterDelete = await store.get(key);

console.log('✅ Blob 读写/列举/元数据/删除 全部通过', {
  key,
  etag: head?.etag ?? null,
  listed: listed.length,
  deleted: afterDelete === null,
});
