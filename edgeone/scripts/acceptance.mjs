#!/usr/bin/env node
// scripts/acceptance.mjs
// 一条命令跑完部署验收（真实 HTTP，不是内存直调）。
//   BASE=https://vault.example.com node scripts/acceptance.mjs
//   BASE=http://127.0.0.1:8799 node scripts/acceptance.mjs   # 本地
// 会注册一个临时账号，跑完自动删号。
import { totpAt } from '../src/crypto.js';

const BASE = (process.env.BASE || 'http://127.0.0.1:8799').replace(/\/+$/, '');
const stamp = Date.now();
const email = process.env.ACC_EMAIL || `acc-${stamp}@example.com`;
const mph = 'acc-master-hash';

let pass = 0;
let fail = 0;
const failures = [];

async function req(method, path, { body, form, token, raw, headers = {} } = {}) {
  const h = { ...headers };
  let payload;
  if (raw !== undefined) {
    payload = raw;
  } else if (form) {
    h['content-type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    h['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) h.authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: payload });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, text };
}

const check = (name, ok, extra) => {
  if (ok) {
    pass++;
    console.log(`✅ ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`❌ ${name}  ${JSON.stringify(extra).slice(0, 220)}`);
  }
};

console.log(`目标: ${BASE}\n账号: ${email}\n`);

// 1. 基础
let r = await req('GET', '/api/alive');
check('GET /api/alive', r.status === 200 && String(r.data).length > 10, r);
r = await req('GET', '/api/config');
check('GET /api/config', r.status === 200 && r.data?.version === '2026.6.0', r);
check('config 指向本域', String(r.data?.environment?.vault || '').includes(new URL(BASE).host), r.data?.environment);

// 2. 注册/登录
r = await req('POST', '/api/accounts/prelogin', { body: { email } });
check('prelogin', r.status === 200 && typeof r.data?.kdf === 'number', r);

r = await req('POST', '/api/accounts/register', {
  body: {
    email,
    name: 'Acceptance',
    masterPasswordHash: mph,
    key: 'k-acc',
    userAsymmetricKeys: { encryptedPrivateKey: 'priv-acc', publicKey: 'pub-acc' },
    kdf: 0,
    kdfIterations: 600000,
    masterPasswordHint: '验收用',
  },
});
check('注册', r.status === 200, r);

const login = async (pw, dev = 'acc-dev', extra = {}) =>
  req('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password',
      username: email,
      password: pw,
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: dev,
      deviceName: dev,
      ...extra,
    },
  });

r = await login(mph);
let token = r.data?.access_token;
check('登录拿 token', r.status === 200 && !!token, r);
check('token 带 Key/Kdf', r.data?.Key === 'k-acc' && r.data?.Kdf === 0, r.data);

// 3. sync + 条目
r = await req('GET', '/api/sync', { token });
check('sync 空库', r.status === 200 && r.data?.ciphers?.length === 0, r);

r = await req('POST', '/api/folders', { token, body: { name: '2.folder' } });
const folderId = r.data?.id;
check('建文件夹', r.status === 200 && !!folderId, r);

r = await req('POST', '/api/ciphers', {
  token,
  body: { type: 1, name: '2.item', login: { username: 'u', password: 'p' }, folderId },
});
const cipherId = r.data?.id;
check('建条目', r.status === 200 && !!cipherId, r);

r = await req('PUT', `/api/ciphers/${cipherId}/partial`, { token, body: { favorite: true } });
check('收藏（partial）', r.status === 200 && r.data?.favorite === true, r);

// 4. 附件
r = await req('POST', `/api/ciphers/${cipherId}/attachment/v2`, {
  token,
  body: { key: 'file-key', fileSize: 5, fileName: 'a.txt' },
});
const attId = r.data?.attachmentId;
check('附件建单', r.status === 200 && !!attId, r);

r = await req('PUT', `/api/ciphers/${cipherId}/attachment/${attId}/data`, {
  token,
  raw: Buffer.from('hello'),
  headers: { 'content-type': 'application/octet-stream' },
});
check('附件上传', r.status === 200, r);

r = await req('GET', `/api/ciphers/${cipherId}/attachment/${attId}/download?token=${encodeURIComponent(token)}`);
check('附件下载字节一致', r.status === 200 && r.text === 'hello', r);

// 5. Send
const del = new Date(Date.now() + 86400_000).toISOString();
r = await req('POST', '/api/sends', {
  token,
  body: { type: 0, key: 'send-key', name: '2.send', text: { text: '2.ct' }, deletionDate: del },
});
const accessId = r.data?.accessId;
check('建文本 Send', r.status === 200 && !!accessId, r);
r = await req('POST', `/api/sends/access/${accessId}`, { body: {} });
check('Send 匿名访问', r.status === 200 && r.data?.object === 'send-access', r);

// 6. 2FA
r = await req('POST', '/api/two-factor/get-authenticator', { token, body: { masterPasswordHash: mph } });
const totpKey = r.data?.key;
check('取 TOTP secret', r.status === 200 && !!totpKey, r);
const step = () => Math.floor(Date.now() / 30000);
r = await req('POST', '/api/two-factor/authenticator', {
  token,
  body: { key: totpKey, token: totpAt(totpKey, step() - 1), masterPasswordHash: mph },
});
check('开启 TOTP', r.status === 200, r);

r = await login(mph, 'acc-dev-2');
check('无验证码登录被要求 2FA', r.status === 400 && r.data?.TwoFactorProviders?.[0] === '0', r);
r = await login(mph, 'acc-dev-2', { twoFactorProvider: '0', twoFactorToken: totpAt(totpKey, step()) });
check('带验证码登录成功', r.status === 200 && !!r.data?.access_token, r);

// 7. 改密 → 旧 token 失效
r = await req('POST', '/api/accounts/password', {
  token,
  body: { masterPasswordHash: mph, newMasterPasswordHash: 'acc-mph-2', key: 'k-acc-2' },
});
check('改密', r.status === 200, r);
r = await req('GET', '/api/sync', { token });
check('改密后旧 token 401', r.status === 401, r);

// 8. 删号收尾
r = await login('acc-mph-2', 'acc-dev-3', { twoFactorProvider: '0', twoFactorToken: totpAt(totpKey, step() + 1) });
const token2 = r.data?.access_token;
check('改密后可登录（新 token）', r.status === 200 && !!token2, r);

if (process.env.ACC_KEEP !== '1' && token2) {
  r = await req('DELETE', '/api/accounts', { token: token2, body: { masterPasswordHash: 'acc-mph-2' } });
  check('删号清理', r.status === 200, r);
}

console.log(`\n${pass}/${pass + fail} 通过`);
if (fail) {
  console.error('失败项: ' + failures.join(' | '));
  process.exit(1);
}
