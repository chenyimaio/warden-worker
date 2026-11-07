// scripts/test-hint-route.mjs
// 回归测试：sealed 模式下，库里只有明文提示的旧账号也要能发出提示（就地加密）。
// 用法：node scripts/test-hint-route.mjs
import app from '../src/index.js';
import { getStore } from '../src/store.js';
import { decryptHint } from '../src/hint.js';

let failed = 0;
const check = (name, ok, extra) => {
  if (ok) console.log(`✅ ${name}`);
  else {
    failed += 1;
    console.error(`❌ ${name}`, extra ?? '');
  }
};

const SECRET = 'test-secret-0123456789abcdef';
const base = {
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'k',
  JWT_REFRESH_SECRET: 'r',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
};

const call = async (env, method, path, body) => {
  const res = await app.fetch(
    new Request(`https://x${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    }),
    env,
  );
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const email = `legacy-${Date.now()}@example.com`;

// 1) 明文模式注册 -> 库里是明文（模拟开启加密之前的老账号）
await call({ ...base, HINT_ENCRYPTION_SECRET: '*' }, 'POST', '/api/accounts/register', {
  email,
  masterPasswordHash: 'm',
  userSymmetricKey: 'k',
  userAsymmetricKeys: { encryptedPrivateKey: 'p', publicKey: 'u' },
  kdf: 0,
  kdfIterations: 600000,
  masterPasswordHint: '老地方',
});

const store = getStore(base);
const profileKey = (await store.list('u/'))
  .map((e) => e.key)
  .find((k) => k.endsWith('/profile.json'));
const before = (await store.get(profileKey)).value;
check('旧账号注册后是明文', before.masterPasswordHint === '老地方' && !before.masterPasswordHintEnc, before);

// 2) sealed 模式请求提示
const sealedEnv = { ...base, HINT_ENCRYPTION_SECRET: SECRET, HINT_EMAIL_MODE: 'sealed' };
const resp = await call(sealedEnv, 'POST', '/api/accounts/password-hint', { email });
check('sealed 模式请求提示返回 200', resp.status === 200, resp);

// 3) 明文被就地升级成密文，且能解回原文
const after = (await store.get(profileKey)).value;
check('旧账号被就地升级为密文', after.masterPasswordHint === null && !!after.masterPasswordHintEnc, after);
check(
  '就地加密的密文能解开',
  (await decryptHint({ HINT_ENCRYPTION_SECRET: SECRET }, after.masterPasswordHintEnc)) === '老地方',
);

// 4) 再请求一次：直接命中密文分支，不再改写数据
const again = await call(sealedEnv, 'POST', '/api/accounts/password-hint', { email });
const after2 = (await store.get(profileKey)).value;
check('第二次请求仍 200 且密文未变', again.status === 200 && after2.masterPasswordHintEnc.ct === after.masterPasswordHintEnc.ct, again);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exitCode = failed === 0 ? 0 : 1;
