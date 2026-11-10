#!/usr/bin/env node
// scripts/test-entry.mjs
// 验证 Makers「文件即路由」的入口文件真的能把请求交给 Hono app。
// 不依赖 Makers 运行时，直接模拟 onRequestXxx(ctx) 的调用形态。
import makers from '../src/makers.js';
import { onRequestGet as aliveGet } from '../cloud-functions/api/alive.js';
import { onRequestPost as preloginPost } from '../cloud-functions/api/accounts/prelogin.js';

const env = {
  BASE_URL: 'http://localhost',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'entry-access-secret-0123456789abcdef',
  JWT_REFRESH_SECRET: 'entry-refresh-secret-0123456789abcd',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
};

let failed = 0;
const check = (name, ok, extra) => {
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

const call = async (fn, path, init) => {
  const res = await fn({ request: new Request(`http://localhost${path}`, init), env, params: {} });
  return { status: res.status, body: await res.text() };
};

let r = await call(aliveGet, '/api/alive');
check('生成的 api/alive.js -> /api/alive', r.status === 200 && r.body.length > 10, r);

r = await call(preloginPost, '/api/accounts/prelogin', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'nobody@example.com' }),
});
check('生成的 api/accounts/prelogin.js -> 200', r.status === 200 && typeof JSON.parse(r.body).kdf === 'number', r);

// 兜底入口（makers.js）仍然可用
r = await call(makers, '/api/config');
check('src/makers.js 兜底入口 -> /api/config', r.status === 200 && JSON.parse(r.body).version === '2026.6.0', r);

// 兼容直接传 Request
r = await (async () => {
  const res = await makers(new Request('http://localhost/api/alive'));
  return { status: res.status, body: await res.text() };
})();
check('兼容直接传 Request 的模板', r.status === 200, r);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exit(failed ? 1 : 0);
