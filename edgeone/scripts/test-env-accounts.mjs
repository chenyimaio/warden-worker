// scripts/test-env-accounts.mjs
// 账号来自环境变量：USEREMAILn / USERPASSWORDn（明文主密码只留在服务端）。
import app from '../src/index.js';
import { deriveMasterPasswordHash } from '../src/env-accounts.js';

let failed = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.error(`❌ ${name}`, extra ?? '');
  }
};

const ITER = 100000; // 测试里调小，加快
const email = 'me@example.com';
const password = 'my-master-password';

const env = {
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'k',
  JWT_REFRESH_SECRET: 'r',
  PASSWORD_ITERATIONS: String(ITER),
  STORE_DRIVER: 'memory',
  USEREMAIL1: email,
  USERPASSWORD1: password,
  USEREMAIL2: 'second@example.com',
  USERPASSWORD2: 'another-pass',
};

const call = async (e, method, path, { body, form } = {}) => {
  const h = {};
  let payload;
  if (form) {
    h['content-type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    h['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await app.fetch(new Request(`https://x${path}`, { method, headers: h, body: payload }), e);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const registerBody = (mail) => ({
  email: mail,
  masterPasswordHash: 'x',
  userSymmetricKey: '2.a|b|c',
  userAsymmetricKeys: { encryptedPrivateKey: '2.d|e|f', publicKey: 'p' },
  kdf: 0,
  kdfIterations: ITER,
});

// 1) prelogin 返回环境变量账号的 KDF 参数
let r = await call(env, 'POST', '/api/accounts/prelogin', { body: { email } });
check('prelogin 返回 kdf=0 且迭代次数一致', r.status === 200 && r.data.kdf === 0 && r.data.kdfIterations === ITER, r.data);

// 2) 名单内的邮箱可以注册，名单外的不行
r = await call(env, 'POST', '/api/accounts/register', { body: registerBody(email) });
check('名单内邮箱可注册', r.status === 200, r);
r = await call(env, 'POST', '/api/accounts/register', { body: registerBody('other@example.com') });
check('名单外邮箱被拒', r.status === 401, r);

// 3) 用环境变量里的明文密码推导出的哈希登录成功
const goodHash = deriveMasterPasswordHash(password, email, ITER);
r = await call(env, 'POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: email,
    password: goodHash,
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'd1',
    deviceName: 'd1',
  },
});
check('正确密码可登录', r.status === 200 && !!r.data.access_token, r);

// 4) 错误密码被拒
const badHash = deriveMasterPasswordHash('wrong-password', email, ITER);
r = await call(env, 'POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: email,
    password: badHash,
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'd1',
    deviceName: 'd1',
  },
});
check('错误密码被拒', r.status === 400, r);

// 5) 没有配环境变量账号时，老账号（库里存哈希）仍能登录
const legacyEnv = {
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'k',
  JWT_REFRESH_SECRET: 'r',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
};
const legacyEmail = `legacy-${Date.now()}@example.com`;
await call(legacyEnv, 'POST', '/api/accounts/register', {
  body: { ...registerBody(legacyEmail), masterPasswordHash: 'legacy-hash' },
});
r = await call(legacyEnv, 'POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: legacyEmail,
    password: 'legacy-hash',
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'd2',
    deviceName: 'd2',
  },
});
check('未配环境变量账号时，老账号仍可登录', r.status === 200 && !!r.data.access_token, r);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exitCode = failed === 0 ? 0 : 1;
