// scripts/test-hint-route.mjs
// 端到端：password-hint 路由在两种配置下分别发什么，以及存储是否保持明文。
// 用 MAIL_DRY_RUN=true + 拦截 console.log 来判断实际走的是哪个分支。
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

const SECRET = 'test-secret-0123456789abcdef';
const base = {
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'k',
  JWT_REFRESH_SECRET: 'r',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  // 现在只要 SMTP_HOST + MAIL_FROM 就认为可发信（MAIL_ENABLED 已移除）
  SMTP_HOST: 'smtp.example.com',
  MAIL_FROM: 'no-reply@example.com',
  MAIL_DRY_RUN: 'true', // 只打日志，不真的发信
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

/** 抓一次请求里 dry-run 邮件日志中的 subject */
const captureMailSubject = async (env, email) => {
  const seen = [];
  const origLog = console.log;
  console.log = (...args) => seen.push(args);
  try {
    await call(env, 'POST', '/api/accounts/password-hint', { email });
  } finally {
    console.log = origLog;
  }
  const line = seen.find((args) => String(args[0]).includes('[mail][dry-run]'));
  return line?.[1]?.subject ?? null;
};

const email = `route-${Date.now()}@example.com`;

// 注册（未配密钥 => 明文落库）
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
const prof = (await store.get(profileKey)).value;
check('注册后是明文', prof.masterPasswordHint === '老地方' && !prof.masterPasswordHintEnc, prof);

// 1) 配了密钥（auto）=> 邮件发密文
const sealedSubject = await captureMailSubject(
  { ...base, HINT_ENCRYPTION_SECRET: SECRET },
  email,
);
check('配了密钥：邮件是密文标题', String(sealedSubject ?? '').includes('已加密'), sealedSubject);

// 2) 存储仍然是明文（不因为发信被改写）
const after = (await store.get(profileKey)).value;
check('发信后存储仍是明文', after.masterPasswordHint === '老地方' && !after.masterPasswordHintEnc, after);

// 3) 没配密钥 => 邮件发明文
const plainSubject = await captureMailSubject({ ...base, HINT_ENCRYPTION_SECRET: '*' }, email);
check('没配密钥：邮件是明文标题', String(plainSubject ?? '').includes('主密码提示') && !String(plainSubject).includes('已加密'), plainSubject);

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 项失败`);
process.exitCode = failed === 0 ? 0 : 1;
