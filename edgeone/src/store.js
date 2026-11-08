// src/store.js
// 存储抽象：业务层只依赖 5 个原语 —— get / put / del / list / head。
//
// 为什么不是「一个用户一个大 JSON」：
//   密码库是「按条目增删改 + 同步时全量读」的模型，单对象会退化成整库读改写，
//   两个设备并发改不同条目也会互相覆盖。
//
// Key 布局（每用户一个前缀，List 只扫单用户，不扫全桶）：
//   idx/email/{sha256(email)}.json     -> { userId }
//   u/{userId}/profile.json
//   u/{userId}/devices/{deviceId}.json
//   u/{userId}/folders/{folderId}.json
//   u/{userId}/ciphers/{cipherId}.json
//   u/{userId}/sends/{sendId}.json
//   u/{userId}/attachments/{attachmentId}   (二进制)
//   u/{userId}/twofactor/{atype}.json
//
// 并发：所有写走 mutate() —— MemoryStore 用 ETag + If-Match 条件写；
//       Makers Blob 没有条件写（SDK 的 onlyIfNew 明确不生效），退化为
//       「强一致读 → 写 → 强一致回读校验 → 不一致按最新基线重试」。
import { getStore as getBlobStore } from '@edgeone/pages-blob';

export const keys = {
  email: (emailHash) => `idx/email/${emailHash}.json`,
  profile: (u) => `u/${u}/profile.json`,
  devices: (u) => `u/${u}/devices/`,
  device: (u, id) => `u/${u}/devices/${id}.json`,
  folders: (u) => `u/${u}/folders/`,
  folder: (u, id) => `u/${u}/folders/${id}.json`,
  ciphers: (u) => `u/${u}/ciphers/`,
  cipher: (u, id) => `u/${u}/ciphers/${id}.json`,
  sends: (u) => `u/${u}/sends/`,
  send: (u, id) => `u/${u}/sends/${id}.json`,
  sendFile: (u, id) => `u/${u}/sends/${id}.bin`,
  authRequests: (u) => `u/${u}/auth-requests/`,
  authRequest: (u, id) => `u/${u}/auth-requests/${id}.json`,
  authRequestIndex: (id) => `idx/authreq/${id}.json`,
  // 限流计数器（近似计数：Blob 最终一致，见 README「风险」）
  rate: (k) => `rl/${k}.json`,
  // accessId -> { userId, id }：匿名访问只有 accessId，没法靠前缀反查
  sendIndex: (accessId) => `idx/send/${accessId}.json`,
  attachment: (u, id) => `u/${u}/attachments/${id}`,
  attachmentMeta: (u, id) => `u/${u}/attachments/${id}.json`,
  attachmentData: (u, id) => `u/${u}/attachments/${id}.bin`,
  attachments: (u) => `u/${u}/attachments/`,
  twofactor: (u, atype) => `u/${u}/twofactor/${atype}.json`,
};

export class PreconditionFailed extends Error {
  constructor(key) {
    super(`precondition failed: ${key}`);
    this.name = 'PreconditionFailed';
  }
}

/** 本地开发 / 单测用；进程内，重启即丢 */
export class MemoryStore {
  #m = new Map();

  async get(key) {
    const v = this.#m.get(key);
    return v ? { value: structuredClone(v.value), etag: v.etag } : null;
  }

  async head(key) {
    const v = this.#m.get(key);
    return v ? { etag: v.etag, size: JSON.stringify(v.value ?? '').length } : null;
  }

  async put(key, value, opts = {}) {
    const cur = this.#m.get(key);
    if (opts.ifNoneMatch === '*' && cur) throw new PreconditionFailed(key);
    if (opts.ifMatch && (!cur || cur.etag !== opts.ifMatch)) throw new PreconditionFailed(key);
    const etag = `"${Math.random().toString(36).slice(2)}"`;
    this.#m.set(key, { value: structuredClone(value), etag });
    return { etag };
  }

  async del(key) {
    this.#m.delete(key);
  }

  async list(prefix) {
    return [...this.#m.keys()]
      .filter((k) => k.startsWith(prefix))
      .sort()
      .map((k) => ({ key: k, etag: this.#m.get(k).etag, size: 0 }));
  }

  // 二进制通道（附件 / 文件 Send）
  async putBinary(key, bytes) {
    this.#m.set(key, { value: Buffer.from(bytes), etag: `"bin-${Date.now()}"` });
  }

  // 内存存储没有预签名直传（本地调试仍走函数内上传）
  async createUploadUrl() {
    return null;
  }

  async getBinary(key) {
    const v = this.#m.get(key);
    return v ? Buffer.from(v.value) : null;
  }
}

/**
 * Makers Blob 适配（@edgeone/pages-blob）
 *
 * 已按 SDK 的实际能力对齐（见 node_modules/@edgeone/pages-blob/dist/index.d.ts）：
 *   get(key, {type:'json', consistency:'strong'}) -> object | null
 *   setJSON(key, value) / set(key, bytes) / delete(key)
 *   list({prefix}) -> { blobs: [{key, etag}] }
 *   getMetadata(key) -> { etag, contentType, ... }
 *
 * 关键限制：SDK 的 set() 只有 `onlyIfNew`，且文档明确写「底层不强制、不要用于加锁」，
 * 因此 **没有 If-Match 条件写**。并发策略退化为「强一致读 → 写 → 强一致回读校验 → 不一致则重试」
 * （见 mutate()），能发现覆盖并按最新基线重放，但不是原子的。
 * 单用户密码库的并发压力很小，这个级别足够；要严格事务请换 Postgres。
 */
export class BlobStore {
  supportsConditional = false;
  #store;

  constructor(env, { store: injected } = {}) {
    const name = env?.BLOB_STORE ?? process.env.BLOB_STORE ?? 'warden';
    const projectId = env?.BLOB_PROJECT_ID ?? process.env.BLOB_PROJECT_ID;
    const token = env?.BLOB_TOKEN ?? process.env.BLOB_TOKEN;
    // Functions 内自动鉴权（只用 name）；脚本/外部访问需要 projectId + token
    // injected 仅用于测试：传入一个实现了同样方法的假 Store
    this.#store =
      injected ??
      (projectId && token
        ? getBlobStore({ name, projectId, token, consistency: 'strong' })
        : getBlobStore(name));
  }

  async get(key) {
    const value = await this.#store.get(key, { type: 'json', consistency: 'strong' });
    return value == null ? null : { value, etag: null };
  }

  async head(key) {
    const meta = await this.#store.getMetadata(key, { consistency: 'strong' });
    return meta ? { etag: meta.etag ?? null, size: 0 } : null;
  }

  async put(key, value) {
    await this.#store.setJSON(key, value);
    return { etag: null };
  }

  /**
   * 预签名 PUT 地址：客户端把字节直接传到 Blob，不经过函数
   * （因此不受平台「单次请求体约 6MB」的限制，只受 Blob 单对象上限约束）。
   * SDK 不支持时返回 null，调用方回退到函数内上传。
   */
  async createUploadUrl(key, opts = {}) {
    if (typeof this.#store.createUploadUrl !== 'function') return null;
    const res = await this.#store.createUploadUrl(key, opts);
    return res?.url ?? null;
  }

  async del(key) {
    await this.#store.delete(key);
  }

  async list(prefix) {
    const res = await this.#store.list({ prefix, consistency: 'strong' });
    return (res?.blobs ?? []).map((b) => ({ key: b.key, etag: b.etag ?? null, size: 0 }));
  }

  // 附件用二进制通道（不经过 JSON 序列化）
  //
  // 注意：type: 'arrayBuffer' 拿回来的是 ArrayBuffer（有 byteLength，没有 length），
  // 而调用方（下载响应）用的是 bytes.length 和 Buffer 语义。这里统一转成 Buffer，
  // 否则 Content-Length 会被写成字符串 "undefined"，平台直接报
  // "bad Content-Length"，下载/文件 Send 全部打不开。
  async getBinary(key) {
    const raw = await this.#store.get(key, { type: 'arrayBuffer', consistency: 'strong' });
    if (raw == null) return null;
    if (Buffer.isBuffer(raw)) return raw;
    if (raw instanceof ArrayBuffer) return Buffer.from(raw);
    if (ArrayBuffer.isView(raw)) return Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength);
    // 某些实现会直接给字符串
    return Buffer.from(String(raw));
  }

  async putBinary(key, bytes) {
    await this.#store.set(key, bytes);
  }
}

const instances = new Map();

export function getStore(env) {
  const driver = env?.STORE_DRIVER ?? process.env.STORE_DRIVER ?? 'memory';
  if (!instances.has(driver)) {
    instances.set(driver, driver === 'blob' ? new BlobStore(env) : new MemoryStore());
  }
  return instances.get(driver);
}

/**
 * 读-改-写。
 *  - 支持条件写的后端（MemoryStore）：ETag + If-Match，冲突重试。
 *  - 不支持的（Blob）：强一致回读校验，发现被别人覆盖就以最新值为基线重放。
 * fn 返回 undefined 表示「不改动」。
 */
export async function mutate(store, key, fn, { retries = 5 } = {}) {
  const conditional = store.supportsConditional !== false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt < retries; attempt++) {
    const cur = await store.get(key);
    const next = fn(cur ? cur.value : null);
    if (next === undefined) return cur ? cur.value : null;

    if (conditional) {
      try {
        await store.put(key, next, { ifMatch: cur ? cur.etag : null });
        return next;
      } catch (e) {
        if (!(e instanceof PreconditionFailed)) throw e;
        await sleep(20 * (attempt + 1));
        continue;
      }
    }

    await store.put(key, next);
    const check = await store.get(key); // strong read on Blob
    if (check && JSON.stringify(check.value) === JSON.stringify(next)) return next;
    await sleep(20 * (attempt + 1));
  }
  throw new Error(`write conflict after ${retries} retries: ${key}`);
}
