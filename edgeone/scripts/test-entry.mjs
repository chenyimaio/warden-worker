#!/usr/bin/env node
// scripts/test-entry.mjs
// 验证 Makers 的文件路由入口（cloud-functions/**/[[default]].js）真的能把请求交给 Hono app。
// 模拟 Makers 的 onRequest(context) 调用形态，不走 HTTP。
import apiEntry from '../cloud-functions/api/[[default]].js';
import identityEntry from '../cloud-functions/identity/[[default]].js';
import notificationsEntry from '../cloud-functions/notifications/[[default]].js';

const env = {
  BASE_URL: 'http://localhost',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'entry-a',
  JWT_REFRESH_SECRET: 'entry-r',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
};

let failed = 0;
const check = (name, ok, extra) => {
  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : '  ' + JSON.stringify(extra)}`);
};

const call = async (entry, path, init) => {
  // Makers 传给 onRequest 的是 context 对象
  const res = await entry({ request: new Request(`http://localhost${path}`, init), env, params: {} });
  return { status: res.status, body: await res.text() };
};

let r = await call(apiEntry, '/api/alive');
check('api 入口 -> /api/alive', r.status === 200 && r.body.length > 10, r);

r = await call(apiEntry, '/api/config');
check('api 入口 -> /api/config', r.status === 200 && JSON.parse(r.body).version === '2026.6.0', r);

r = await call(apiEntry, '/api/accounts/prelogin', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'nobody@example.com' }),
});
check('api 入口 -> prelogin', r.status === 200 && typeof JSON.parse(r.body).kdf === 'number', r);

r = await call(identityEntry, '/identity/connect/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=password&username=nobody@example.com&password=x',
});
check('identity 入口 -> token', r.status === 400 && JSON.parse(r.body).error === 'invalid_grant', r);

r = await call(notificationsEntry, '/notifications/hub');
check('notifications 入口 -> 426', r.status === 426, r);

// 直接传 Request（某些模板会这样调）
r = await (async () => {
  const res = await apiEntry(new Request('http://localhost/api/alive'));
  return { status: res.status, body: await res.text() };
})();
check('兼容直接传 Request 的模板', r.status === 200, r);

console.log(failed ? `\n${failed} failed` : '\n全部通过');
process.exit(failed ? 1 : 0);
