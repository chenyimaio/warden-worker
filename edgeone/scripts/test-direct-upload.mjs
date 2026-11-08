// scripts/test-direct-upload.mjs
// 预签名直传：开启 DIRECT_UPLOAD_ENABLED 后，创建附件/文件 Send 返回的 url 应指向 Blob，
// 而不是本函数；超过 DIRECT_UPLOAD_MAX_BYTES 直接 413。
// 用内存存储 + 打桩的 createUploadUrl 验证接线，不依赖真实 Blob。
import app from '../src/index.js';
import { getStore } from '../src/store.js';

let failed = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.error(`❌ ${name}`, extra ?? '');
  }
};

const base = {
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'k',
  JWT_REFRESH_SECRET: 'r',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  BASE_URL: 'https://vault.example.com',
};

// 给内存存储打桩：模拟 SDK 的 createUploadUrl
const store = getStore(base);
let lastKey = null;
store.createUploadUrl = async (key) => {
  lastKey = key;
  return `https://blob.example.com/${encodeURI(key)}?signature=stub`;
};

const call = async (env, method, path, { body, token } = {}) => {
  const headers = {};
  let payload;
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await app.fetch(new Request(`https://x${path}`, { method, headers, body: payload }), env);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const email = `direct-${Date.now()}@example.com`;
await call(base, 'POST', '/api/accounts/register', {
  body: {
    email,
    masterPasswordHash: 'm',
    userSymmetricKey: 'k',
    userAsymmetricKeys: { encryptedPrivateKey: 'p', publicKey: 'u' },
    kdf: 0,
    kdfIterations: 100000,
  },
});
const tok = (
  await call(base, 'POST', '/identity/connect/token', {
    body: undefined,
    token: null,
  })
).status;

// 用 form 拿 token
const formRes = await app.fetch(
  new Request('https://x/identity/connect/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: email,
      password: 'm',
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: 'd1',
      deviceName: 'd1',
    }).toString(),
  }),
  base,
);
const token = (await formRes.json()).access_token;

// 1) 关闭直传：url 指向本函数
let r = await call(base, 'POST', '/api/sends/file/v2', {
  token,
  body: { type: 1, name: 'a', key: 'k', deletionDate: new Date(Date.now() + 86400e3).toISOString(), fileLength: 1024 },
});
check('关闭直传时 url 指向本函数', r.status === 200 && String(r.data.url).includes('/api/sends/'), r.data);

// 2) 开启直传：url 指向 Blob，key 是 sendFile
const directEnv = { ...base, DIRECT_UPLOAD_ENABLED: 'true' };
r = await call(directEnv, 'POST', '/api/sends/file/v2', {
  token,
  body: { type: 1, name: 'b', key: 'k', deletionDate: new Date(Date.now() + 86400e3).toISOString(), fileLength: 8 * 1024 * 1024 },
});
check('开启直传时 url 指向 Blob', r.status === 200 && String(r.data.url).startsWith('https://blob.example.com/'), r.data);
check('直传 key 是 sendFile 布局', String(lastKey ?? '').includes('/sends/'), lastKey);

// 3) 超过直传上限 -> 413
r = await call(directEnv, 'POST', '/api/sends/file/v2', {
  token,
  body: { type: 1, name: 'c', key: 'k', deletionDate: new Date(Date.now() + 86400e3).toISOString(), fileLength: 30 * 1024 * 1024 },
});
check('超过 25MiB 返回 413', r.status === 413, r);

// 4) 附件也走直传
const cipher = await call(base, 'POST', '/api/ciphers', {
  token,
  body: {
    type: 1,
    name: '2.enc',
    notes: null,
    favorite: false,
    folderId: null,
    login: null,
    secureNote: { type: 0 },
    fields: [],
    passwordHistory: [],
    reprompt: 0,
  },
});
const cipherId = cipher.data?.id ?? cipher.data?.Id;
r = await call(directEnv, 'POST', `/api/ciphers/${cipherId}/attachment/v2`, {
  token,
  body: { fileName: '2.enc', fileSize: 9 * 1024 * 1024, key: '2.k' },
});
check('附件直传 url 指向 Blob', r.status === 200 && String(r.data.url).startsWith('https://blob.example.com/'), r.data);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exitCode = failed === 0 ? 0 : 1;
