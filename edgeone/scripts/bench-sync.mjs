#!/usr/bin/env node
// scripts/bench-sync.mjs
// 量化 /api/sync 的成本：本脚本用内存存储（=网络延迟为 0 的下限），
// 给出 CPU + 序列化的真实开销；Blob 上还要再加 N/16 轮网络往返。
//   node scripts/bench-sync.mjs [条目数]
import app from '../src/index.js';

const N = Number(process.argv[2] || 500);
const env = {
  BASE_URL: 'http://localhost',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'bench-a',
  JWT_REFRESH_SECRET: 'bench-r',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
};

const call = async (method, path, { body, form, token } = {}) => {
  const h = {};
  let payload;
  if (form) {
    h['content-type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body) {
    h['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) h.authorization = `Bearer ${token}`;
  const t0 = performance.now();
  const res = await app.fetch(new Request(`http://localhost${path}`, { method, headers: h, body: payload }), env);
  const text = await res.text();
  const ms = performance.now() - t0;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, size: Buffer.byteLength(text), ms };
};

const email = `bench-${Date.now()}@example.com`;
const mph = 'bench-mph';

await call('POST', '/api/accounts/register', {
  body: {
    email,
    name: 'B',
    masterPasswordHash: mph,
    key: 'k',
    userAsymmetricKeys: { encryptedPrivateKey: 'p', publicKey: 'u' },
    kdf: 0,
    kdfIterations: 600000,
  },
});
const tok = (
  await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password',
      username: email,
      password: mph,
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: 'bench',
      deviceName: 'bench',
    },
  })
).data.access_token;

// 批量导入（比逐条 create 快，也更接近真实恢复场景）
const ciphers = Array.from({ length: N }, (_, i) => ({
  type: 1,
  name: `2.item-${i}`,
  notes: `2.notes-${i}`,
  login: { username: `2.user-${i}`, password: `2.pass-${i}`, uris: [{ uri: `2.uri-${i}` }] },
}));
const imp = await call('POST', '/api/ciphers/import', { token: tok, body: { ciphers, folders: [], folderRelationships: [] } });
console.log(`导入 ${N} 条：${imp.ms.toFixed(0)} ms  (count=${imp.data?.count})`);

const runs = [];
for (let i = 0; i < 6; i++) {
  const r = await call('GET', '/api/sync', { token: tok });
  if (r.status !== 200) {
    console.error('sync 失败', r.status, r.data);
    process.exit(1);
  }
  runs.push({ ms: r.ms, kb: Math.round(r.size / 1024) });
}
runs.shift(); // 丢掉第一发（冷路径）
const times = runs.map((r) => r.ms).sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];

console.log(`sync x${runs.length}: min ${times[0].toFixed(0)} ms / median ${median.toFixed(0)} ms / max ${times.at(-1).toFixed(0)} ms`);
console.log(`响应体: ~${runs[0].kb} KB（${N} 条）`);
console.log(`\n内存存储是下限；Blob 每个对象一次 GET，16 路并发 => 约 ${Math.ceil(N / 16)} 轮网络往返`);
