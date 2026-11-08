// scripts/test-direct-upload.mjs
// 直传是默认行为：
//   - 存储支持预签名（Blob）-> 返回 Blob URL + fileUploadType 0（Azure 语义）
//   - 存储不支持（内存）    -> 回退到函数内上传 + fileUploadType 1
//   - 超过 25 MiB（Blob 单对象上限）-> 413
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

const store = getStore(base);

const call = async (method, path, { body, token } = {}) => {
  const headers = {};
  let payload;
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await app.fetch(new Request(`https://x${path}`, { method, headers, body: payload }), base);
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
await call('POST', '/api/accounts/register', {
  body: {
    email,
    masterPasswordHash: 'm',
    userSymmetricKey: 'k',
    userAsymmetricKeys: { encryptedPrivateKey: 'p', publicKey: 'u' },
    kdf: 0,
    kdfIterations: 100000,
  },
});

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

const deletionDate = new Date(Date.now() + 86400e3).toISOString();
const sendBody = (size, name) => ({ type: 1, name, key: 'k', deletionDate, fileLength: size });

// 1) 内存存储不支持预签名 -> 回退到函数内上传，type 1
let r = await call('POST', '/api/sends/file/v2', { token, body: sendBody(1024, 'fallback') });
check(
  '存储不支持预签名时回退到函数地址',
  r.status === 200 && r.data.fileUploadType === 1 && String(r.data.url).includes('/api/sends/'),
  r.data,
);

// 2) 存储支持预签名 -> Blob URL + type 0（Azure 语义）
let lastKey = null;
store.createUploadUrl = async (key) => {
  lastKey = key;
  return `https://blob.example.com/${encodeURI(key)}?signature=stub`;
};
r = await call('POST', '/api/sends/file/v2', { token, body: sendBody(8 * 1024 * 1024, 'presigned') });
check(
  '支持预签名时返回 Blob 地址',
  r.status === 200 && String(r.data.url).startsWith('https://blob.example.com/'),
  r.data,
);
check('直传使用 fileUploadType 0（客户端才会 PUT 到 url）', r.data.fileUploadType === 0, r.data.fileUploadType);
check('直传 key 是 sendFile 布局', String(lastKey ?? '').includes('/sends/'), lastKey);

// 3) 超过 Blob 单对象上限 -> 413（在拿到上传地址之前就拒绝）
r = await call('POST', '/api/sends/file/v2', { token, body: sendBody(30 * 1024 * 1024, 'toobig') });
check('超过 25MiB 返回 413', r.status === 413, r);

// 4) 附件同样走直传
const cipher = await call('POST', '/api/ciphers', {
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
r = await call('POST', `/api/ciphers/${cipherId}/attachment/v2`, {
  token,
  body: { fileName: '2.enc', fileSize: 9 * 1024 * 1024, key: '2.k' },
});
check('附件直传返回 Blob 地址', r.status === 200 && String(r.data.url).startsWith('https://blob.example.com/'), r.data);

r = await call('POST', `/api/ciphers/${cipherId}/attachment/v2`, {
  token,
  body: { fileName: 'big.enc', fileSize: 26 * 1024 * 1024, key: '2.k' },
});
check('附件超过 25MiB 返回 413', r.status === 413, r);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exitCode = failed === 0 ? 0 : 1;
