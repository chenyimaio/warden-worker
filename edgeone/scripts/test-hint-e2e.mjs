// scripts/test-hint-e2e.mjs
// 端到端：注册/改提示后库里是什么形态（当前模型 = 明文落库），以及读取是否正常。
import app from '../src/index.js';
import { getStore, keys } from '../src/store.js';
import { emailKey } from '../src/crypto.js';
import { readHintValue } from '../src/hint.js';

const env = {
  BASE_URL: 'http://localhost',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'a',
  JWT_REFRESH_SECRET: 'r',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
  HINT_ENCRYPTION_SECRET: 'passphrase-for-test',
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
  const res = await app.fetch(new Request(`http://localhost${path}`, { method, headers: h, body: payload }), env);
  const t = await res.text();
  let d;
  try {
    d = JSON.parse(t);
  } catch {
    d = t;
  }
  return { status: res.status, data: d };
};

let failed = 0;
const check = (n, ok, extra) => {
  if (!ok) failed += 1;
  console.log(`${ok ? '✅' : '❌'} ${n}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

const email = `enc-${Date.now()}@example.com`;
await call('POST', '/api/accounts/register', {
  body: {
    email,
    masterPasswordHash: 'm',
    userSymmetricKey: '2.a|b|c',
    userAsymmetricKeys: { encryptedPrivateKey: '2.d|e|f', publicKey: 'p' },
    masterPasswordHint: '机密提示',
  },
});

const store = getStore(env);
const uid = (await store.get(keys.email(emailKey(email)))).value.userId;
const prof = (await store.get(keys.profile(uid))).value;

check('注册后明文落库', prof.masterPasswordHint === '机密提示', prof.masterPasswordHint);
check('不再写密文字段', !prof.masterPasswordHintEnc, Object.keys(prof));
check('读回明文', (await readHintValue(env, prof)) === '机密提示');

// 登录后改提示
const tok = (
  await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password',
      username: email,
      password: 'm',
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: 'd',
      deviceName: 'd',
    },
  })
).data.access_token;

let r = await call('PUT', '/api/accounts/profile', { token: tok, body: { masterPasswordHint: '新机密' } });
check('改提示 -> 200', r.status === 200, r);
const prof2 = (await store.get(keys.profile(uid))).value;
check('改后明文已更新', prof2.masterPasswordHint === '新机密', prof2.masterPasswordHint);

// 清空
r = await call('PUT', '/api/accounts/profile', { token: tok, body: { masterPasswordHint: '' } });
const prof3 = (await store.get(keys.profile(uid))).value;
check('清空后两个字段都空', prof3.masterPasswordHint == null && prof3.masterPasswordHintEnc == null, prof3);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exitCode = failed ? 1 : 0;
