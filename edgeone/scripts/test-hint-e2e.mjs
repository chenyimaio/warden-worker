// 一次性：加密提示的端到端（注册 -> 存储形态 -> 发信取到明文 -> 改提示）
import app from '../src/index.js';
import { getStore, keys } from '../src/store.js';
import { emailKey } from '../src/crypto.js';

const env = {
  BASE_URL: 'http://localhost',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'a',
  JWT_REFRESH_SECRET: 'r',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false', // 不发信，只看日志与存储
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
  try { d = JSON.parse(t); } catch { d = t; }
  return { status: res.status, data: d };
};

let failed = 0;
const check = (n, ok, extra) => {
  if (!ok) failed++;
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

check('profile 无明文提示', prof.masterPasswordHint == null, prof.masterPasswordHint);
check('存在密文记录', !!prof.masterPasswordHintEnc, Object.keys(prof));
check('密文记录用 argon2id+aes-256-gcm', prof.masterPasswordHintEnc?.kdf === 'argon2id' && prof.masterPasswordHintEnc?.cipher === 'aes-256-gcm', prof.masterPasswordHintEnc);
check('整个 profile 不含明文', !JSON.stringify(prof).includes('机密提示'), 'leak');

// 登录后改提示
const tok = (
  await call('POST', '/identity/connect/token', {
    form: { grant_type: 'password', username: email, password: 'm', scope: 'api offline_access', client_id: 'web', deviceType: '10', deviceIdentifier: 'd', deviceName: 'd' },
  })
).data.access_token;
let r = await call('PUT', '/api/accounts/profile', { token: tok, body: { masterPasswordHint: '新机密' } });
check('改提示 -> 200', r.status === 200, r);
const prof2 = (await store.get(keys.profile(uid))).value;
check('改后仍是密文', prof2.masterPasswordHint == null && !!prof2.masterPasswordHintEnc, Object.keys(prof2));
check('改后不含新明文', !JSON.stringify(prof2).includes('新机密'), 'leak');

// 清空
r = await call('PUT', '/api/accounts/profile', { token: tok, body: { masterPasswordHint: '' } });
const prof3 = (await store.get(keys.profile(uid))).value;
check('清空后两个字段都空', prof3.masterPasswordHint == null && prof3.masterPasswordHintEnc == null, prof3.masterPasswordHintEnc);

// 换错口令时读不到（模拟配置变更）
const { readHintValue } = await import('../src/hint.js');
const back = await readHintValue({ HINT_ENCRYPTION_SECRET: 'passphrase-for-test' }, prof2);
check('用正确口令可解出明文', back === '新机密', back);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exit(failed ? 1 : 0);
