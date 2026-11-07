#!/usr/bin/env node
// scripts/blob-adapter-test.mjs
// 用「假 Store」验证 src/store.js 里 BlobStore 的映射是否正确：
//   - 读写 JSON、二进制、list、getMetadata
//   - 强一致参数是否真的传了（consistency: 'strong'）
//   - 没有条件写时，mutate() 的「回读校验 + 重放」路径是否工作
// 不需要 Blob 凭据，CI 可跑。
import { BlobStore, mutate } from '../src/store.js';

class FakeBlob {
  constructor() {
    this.data = new Map();
    this.calls = [];
  }
  async setJSON(key, value) {
    this.calls.push(['setJSON', key]);
    this.data.set(key, { value: structuredClone(value), type: 'json' });
  }
  async set(key, bytes) {
    this.calls.push(['set', key]);
    this.data.set(key, { value: Buffer.from(bytes), type: 'bin' });
  }
  async get(key, opts = {}) {
    this.calls.push(['get', key, opts.consistency]);
    const hit = this.data.get(key);
    if (!hit) return null;
    return hit.type === 'json' ? structuredClone(hit.value) : hit.value;
  }
  async getMetadata(key, opts = {}) {
    this.calls.push(['getMetadata', key, opts.consistency]);
    return this.data.has(key) ? { etag: `"etag-${key}"` } : null;
  }
  async delete(key) {
    this.calls.push(['delete', key]);
    this.data.delete(key);
  }
  async list({ prefix, consistency } = {}) {
    this.calls.push(['list', prefix, consistency]);
    const blobs = [...this.data.keys()]
      .filter((k) => (prefix ? k.startsWith(prefix) : true))
      .map((key) => ({ key, etag: `"etag-${key}"` }));
    return { blobs, directories: [] };
  }
}

const fake = new FakeBlob();
const store = new BlobStore({}, { store: fake });

let failed = 0;
const check = (name, ok, extra) => {
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

// 1. JSON 读写
await store.put('u/1/profile.json', { id: '1', name: 'a' });
let got = await store.get('u/1/profile.json');
check('put/get JSON', got?.value?.id === '1', got);

// 2. 强一致参数
const getCall = fake.calls.filter((c) => c[0] === 'get').at(-1);
check('读使用 consistency=strong', getCall?.[2] === 'strong', getCall);

// 3. 缺失返回 null
check('不存在的 key 返回 null', (await store.get('nope')) === null, null);

// 4. list 前缀
await store.put('u/1/ciphers/a.json', { id: 'a' });
await store.put('u/1/ciphers/b.json', { id: 'b' });
await store.put('u/2/ciphers/c.json', { id: 'c' });
const listed = await store.list('u/1/ciphers/');
check('list 只返回该前缀', listed.length === 2 && listed.every((x) => x.key.startsWith('u/1/')), listed);

// 5. 二进制
await store.putBinary('u/1/attachments/x.bin', Buffer.from('hello'));
const bin = await store.getBinary('u/1/attachments/x.bin');
check('二进制读写', Buffer.from(bin).toString() === 'hello', bin);

// 6. getMetadata / delete
check('head 返回 etag', (await store.head('u/1/profile.json'))?.etag?.includes('etag'), null);
await store.del('u/2/ciphers/c.json');
check('delete 后读不到', (await store.get('u/2/ciphers/c.json')) === null, null);

// 7. 无条件写时 mutate 的回读校验路径：模拟一次「写后被别人覆盖」
const key = 'u/1/counter.json';
await store.put(key, { n: 1 });
let injected = false;
const origPut = fake.setJSON.bind(fake);
fake.setJSON = async (k, v) => {
  await origPut(k, v);
  if (!injected) {
    injected = true;
    await origPut(k, { n: 999 }); // 模拟并发写覆盖
  }
};
const out = await mutate(store, key, (cur) => ({ n: (cur?.n ?? 0) + 1 }), { retries: 5 });
const finalVal = (await store.get(key))?.value;
check('检测到覆盖后按最新基线重放（999 -> 1000）', out?.n === 1000, out);
check('最终落盘值为重放结果', finalVal?.n === 1000, finalVal);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exit(failed ? 1 : 0);
