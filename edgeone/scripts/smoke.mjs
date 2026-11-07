// scripts/smoke.mjs
// 端到端冒烟：直接调 app.fetch（不经 HTTP 端口），验证路由/鉴权/存储链路。
// 用法：node scripts/smoke.mjs
import app from '../src/index.js';

const env = {
  BASE_URL: 'http://localhost:8787',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'test-access',
  JWT_REFRESH_SECRET: 'test-refresh',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
};

const results = [];
const call = async (method, path, { body, form, raw, token, headers = {} } = {}) => {
  const h = { ...headers };
  let payload;
  if (raw !== undefined) {
    h['content-type'] = 'application/octet-stream';
    payload = raw;
  } else if (form) {
    h['content-type'] = 'application/x-www-form-urlencoded';
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    h['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (token) h.authorization = `Bearer ${token}`;
  const req = new Request(`http://localhost${path}`, { method, headers: h, body: payload });
  const res = await app.fetch(req, env);
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, rawText: text };
};

const check = (name, cond, extra) => {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? '✅' : '❌'} ${name}${cond ? '' : '  ' + JSON.stringify(extra).slice(0, 300)}`);
};

const email = `smoke-${Date.now()}@example.com`;
const mph = 'master-hash-abc';

// 1. config
let r = await call('GET', '/api/config');
check('GET /api/config', r.status === 200 && r.data.version === '2026.6.0', r);

// 2. prelogin（未注册）
r = await call('POST', '/api/accounts/prelogin', { body: { email } });
check('POST prelogin (未注册 -> 默认 KDF)', r.status === 200 && r.data.kdf === 0, r);

// 3. register
r = await call('POST', '/api/accounts/register', {
  body: {
    email,
    name: 'Smoke',
    masterPasswordHash: mph,
    userSymmetricKey: 'user-key',
    userAsymmetricKeys: { encryptedPrivateKey: 'priv', publicKey: 'pub' },
    kdf: 0,
    kdfIterations: 600000,
    masterPasswordHint: '老地方',
  },
});
check('POST register', r.status === 200, r);

// 3b. 重复注册应失败
r = await call('POST', '/api/accounts/register', { body: { email, masterPasswordHash: mph, key: 'k' } });
check('重复注册被拒', r.status === 400, r);

// 4. token
r = await call('POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: email,
    password: mph,
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'dev-1',
    deviceName: 'smoke',
  },
});
const access = r.data?.access_token;
const refresh = r.data?.refresh_token;
check('POST token (password)', r.status === 200 && !!access && !!refresh, r);
check('token 带 Key/Kdf', r.data?.Key === 'user-key' && r.data?.Kdf === 0, r);

// 4b. 错误密码
r = await call('POST', '/identity/connect/token', {
  form: { grant_type: 'password', username: email, password: 'wrong', scope: 'api offline_access', client_id: 'web', deviceType: '10', deviceIdentifier: 'dev-1', deviceName: 'smoke' },
});
check('错误密码被拒', r.status === 400, r);

// 4c. refresh
r = await call('POST', '/identity/connect/token', { form: { grant_type: 'refresh_token', refresh_token: refresh } });
check('POST token (refresh_token)', r.status === 200 && !!r.data?.access_token, r);

// 5. 未授权访问
r = await call('GET', '/api/sync');
check('无 token 访问 sync -> 401', r.status === 401, r);

// 6. sync（空库）
r = await call('GET', '/api/sync', { token: access });
check('GET /api/sync', r.status === 200 && Array.isArray(r.data.ciphers) && r.data.object === 'sync', r);

// 7. folder
r = await call('POST', '/api/folders', { token: access, body: { name: '2.folder-name' } });
const folderId = r.data?.id;
check('POST folder', r.status === 200 && !!folderId, r);

// 8. cipher create
r = await call('POST', '/api/ciphers', {
  token: access,
  body: {
    type: 1,
    name: '2.cipher-name',
    notes: '2.notes',
    login: { username: '2.user', password: '2.pass' },
    favorite: true,
    folderId,
  },
});
const cipherId = r.data?.id;
check('POST cipher', r.status === 200 && !!cipherId && r.data.type === 1, r);

// 9. cipher update（只给 notes，不应清空 name）
r = await call('PUT', `/api/ciphers/${cipherId}`, { token: access, body: { notes: '2.notes-updated' } });
check('PUT cipher 保留 name', r.status === 200 && r.data.name === '2.cipher-name' && r.data.notes === '2.notes-updated', r);

// 10. 软删除 -> 恢复
r = await call('PUT', `/api/ciphers/${cipherId}/delete`, { token: access });
check('soft delete', r.status === 200, r);
r = await call('GET', `/api/ciphers/${cipherId}`, { token: access });
check('软删后仍可读且有 deletedDate', r.status === 200 && !!r.data.deletedDate, r);
r = await call('PUT', `/api/ciphers/${cipherId}/restore`, { token: access });
check('restore 清空 deletedDate', r.status === 200, r);
r = await call('GET', `/api/ciphers/${cipherId}`, { token: access });
check('恢复后 deletedDate 为空', r.data?.deletedDate === null, r);

// 11. sync 应包含 1 条 cipher + 1 个 folder
r = await call('GET', '/api/sync', { token: access });
check('sync 包含条目与文件夹', r.status === 200 && r.data.ciphers.length === 1 && r.data.folders.length === 1, r);

// 12. profile / revision-date
r = await call('GET', '/api/accounts/profile', { token: access });
check('GET profile', r.status === 200 && r.data.email === email, r);
r = await call('GET', '/api/accounts/revision-date', { token: access });
check('GET revision-date', r.status === 200 && typeof r.data === 'number', r);

// 12b. 主密码提示可单独修改（不影响其它字段），空串表示清除
r = await call('PUT', '/api/accounts/profile', { token: access, body: { masterPasswordHint: '2.新提示' } });
check('PUT profile 改主密码提示', r.status === 200, r);
r = await call('PUT', '/api/accounts/profile', { token: access, body: { name: 'SmokeRenamed' } });
check('只改名字不动提示', r.status === 200 && r.data?.name === 'SmokeRenamed', r);
r = await call('PUT', '/api/accounts/profile', { token: access, body: { masterPasswordHint: '' } });
check('空串清除提示', r.status === 200, r);

// 13. password-hint：恒定 200，且不泄露提示内容
r = await call('POST', '/api/accounts/password-hint', { body: { email } });
check('password-hint 返回 200 且不透出提示', r.status === 200 && JSON.stringify(r.data) === '{}', r);
r = await call('POST', '/api/accounts/password-hint', { body: { email: 'nobody@example.com' } });
check('password-hint 未知邮箱同样 200', r.status === 200, r);

// 14. knowndevice
r = await call('GET', '/api/devices/knowndevice', {
  token: access,
  headers: {
    'x-request-email': Buffer.from(email).toString('base64').replace(/=+$/, ''),
    'x-device-identifier': 'dev-1',
  },
});
check('knowndevice = true', r.status === 200 && r.data === true, r);

// 15. 未迁移路由 -> 501
r = await call('GET', '/api/organizations');
check('未迁移路由返回 501', r.status === 501 && r.data.error === 'not_implemented', r);

// 16. 硬删除
r = await call('DELETE', `/api/ciphers/${cipherId}`, { token: access });
check('DELETE cipher', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access });
check('删除后 sync 为空', r.data?.ciphers?.length === 0, r);

// 17. 批量 / 局部 / 归档 / 移动 / 清空
r = await call('POST', '/api/folders', { token: access, body: { name: '2.folder-b' } });
const folderB = r.data?.id;
const ids = [];
for (const n of ['a', 'b', 'c']) {
  r = await call('POST', '/api/ciphers', { token: access, body: { type: 1, name: `2.${n}`, login: { username: n } } });
  ids.push(r.data?.id);
}
check('批量前置：创建 3 条', ids.every(Boolean), ids);

// partial：收藏 + 移入文件夹
r = await call('PUT', `/api/ciphers/${ids[0]}/partial`, { token: access, body: { favorite: true, folderId: folderB } });
check('partial 设置 favorite+folderId', r.status === 200 && r.data.favorite === true && r.data.folderId === folderB, r);

// 单条归档 / 取消归档
r = await call('PUT', `/api/ciphers/${ids[0]}/archive`, { token: access });
check('archive 单条', r.status === 200 && !!r.data.archivedDate, r);
r = await call('PUT', `/api/ciphers/${ids[0]}/unarchive`, { token: access });
check('unarchive 单条', r.status === 200 && r.data.archivedDate === null, r);

// move：合法文件夹 + 非法文件夹
r = await call('POST', '/api/ciphers/move', { token: access, body: { folderId: folderB, ids: [ids[1]] } });
check('move 到合法文件夹', r.status === 200, r);
r = await call('GET', `/api/ciphers/${ids[1]}`, { token: access });
check('move 生效', r.data?.folderId === folderB, r);
r = await call('POST', '/api/ciphers/move', { token: access, body: { folderId: 'no-such-folder', ids: [ids[1]] } });
check('move 非法文件夹 -> 400', r.status === 400, r);

// 批量软删 / 恢复 / 归档
r = await call('PUT', '/api/ciphers/delete', { token: access, body: { ids } });
check('bulk soft delete', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access });
check('bulk 软删后都有 deletedDate', r.data.ciphers.every((x) => x.deletedDate), r);
r = await call('PUT', '/api/ciphers/restore', { token: access, body: { ids } });
check('bulk restore', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access });
check('bulk 恢复后 deletedDate 清空', r.data.ciphers.every((x) => !x.deletedDate), r);
r = await call('PUT', '/api/ciphers/archive', { token: access, body: { ids } });
check('bulk archive', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access });
check('bulk 归档生效', r.data.ciphers.every((x) => x.archivedDate), r);
await call('PUT', '/api/ciphers/unarchive', { token: access, body: { ids } });

// 清空保险库：错误密码拒绝，正确密码清空
r = await call('POST', '/api/ciphers/purge', { token: access, body: { masterPasswordHash: 'wrong' } });
check('purge 错误密码 -> 401', r.status === 401, r);
r = await call('POST', '/api/ciphers/purge', { token: access, body: { masterPasswordHash: mph } });
check('purge 成功', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access });
check('purge 后库为空', r.data.ciphers.length === 0 && r.data.folders.length === 0, r);

// 文件夹删除别名
r = await call('POST', '/api/folders', { token: access, body: { name: '2.folder-c' } });
const folderC = r.data?.id;
r = await call('POST', `/api/folders/${folderC}/delete`, { token: access });
check('folder POST delete 别名', r.status === 200, r);
r = await call('GET', '/api/folders', { token: access });
check('folder 已删除', r.status === 200 && r.data.data.length === 0, r);

// 18. 2FA TOTP 全流程
import { totpAt } from '../src/crypto.js';

const step = () => Math.floor(Date.now() / 30000);
const login = (extra = {}) =>
  call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password',
      username: email,
      password: mph,
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: 'dev-2fa',
      deviceName: 'smoke-2fa',
      ...extra,
    },
  });

r = await call('GET', '/api/two-factor', { token: access });
check('2FA 初始为空', r.status === 200 && r.data.data.length === 0, r);

r = await call('POST', '/api/two-factor/get-authenticator', { token: access, body: { masterPasswordHash: mph } });
const totpKey = r.data?.key;
check('get-authenticator 返回 secret', r.status === 200 && typeof totpKey === 'string' && totpKey.length >= 32, r);

// 用上一步的码激活（-1 允许 drift），后续登录用当前步，避免重放被拦
r = await call('POST', '/api/two-factor/authenticator', {
  token: access,
  body: { key: totpKey, token: totpAt(totpKey, step() - 1), masterPasswordHash: mph },
});
check('开启 TOTP', r.status === 200 && r.data.enabled === true, r);

r = await call('GET', '/api/two-factor', { token: access });
check('2FA 列表含 authenticator', r.data?.data?.[0]?.type === 0, r);

r = await login();
check('无 token 登录 -> 要求 2FA', r.status === 400 && r.data?.TwoFactorProviders?.[0] === '0', r);

r = await login({ twoFactorProvider: '0', twoFactorToken: '000000' });
check('错误 TOTP -> 400', r.status === 400, r);

r = await login({ twoFactorProvider: '0', twoFactorToken: totpAt(totpKey, step()), twoFactorRemember: '1' });
const remember = r.data?.TwoFactorToken;
check('正确 TOTP 登录成功 + 发放 remember token', r.status === 200 && !!r.data?.access_token && !!remember, r);

r = await login({ twoFactorProvider: '5', twoFactorToken: remember });
check('remember token 免 TOTP 登录', r.status === 200 && !!r.data?.access_token, r);

r = await call('POST', '/api/two-factor/get-recover', { token: access, body: { masterPasswordHash: mph } });
const recoverCode = r.data?.code;
check('get-recover 返回恢复码', r.status === 200 && typeof recoverCode === 'string' && recoverCode.length > 0, r);

r = await login({ twoFactorProvider: '8', twoFactorToken: recoverCode });
check('恢复码登录成功', r.status === 200 && !!r.data?.access_token, r);
r = await call('GET', '/api/two-factor', { token: access });
check('恢复码用掉后 2FA 被清除', r.data?.data?.length === 0, r);

// 19. 账号操作：改密 / security-stamp 应让旧 token 立即失效
const mph2 = 'master-hash-new';
r = await call('POST', '/api/accounts/password', {
  token: access,
  body: { masterPasswordHash: mph, newMasterPasswordHash: mph2, key: 'user-key-2', masterPasswordHint: '新提示' },
});
check('改密成功', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access });
check('改密后旧 token -> 401', r.status === 401, r);

r = await call('POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: email,
    password: mph2,
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'dev-3',
    deviceName: 'smoke-3',
  },
});
const access2 = r.data?.access_token;
check('新密码可登录', r.status === 200 && !!access2, r);

r = await call('POST', '/api/accounts/security-stamp', { token: access2, body: { masterPasswordHash: mph2 } });
check('security-stamp 成功', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access2 });
check('security-stamp 后旧 token -> 401', r.status === 401, r);

r = await call('POST', '/api/accounts/security-stamp', { token: access2, body: { masterPasswordHash: 'wrong' } });
check('无有效 token 时 security-stamp 直接 401', r.status === 401, r);

// 20. Send（文本）
const del = new Date(Date.now() + 7 * 86400_000).toISOString();
const login2 = async () => {
  const rr = await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password',
      username: email,
      password: mph2,
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: 'dev-4',
      deviceName: 'smoke-4',
    },
  });
  return rr.data?.access_token;
};
const access3 = await login2();
check('改密后可重新登录拿 token', !!access3, access3);

r = await call('POST', '/api/sends', {
  token: access3,
  body: {
    type: 0,
    key: 'send-key',
    name: '2.send-name',
    notes: '2.send-notes',
    text: { text: '2.ciphertext', hidden: false },
    deletionDate: del,
    maxAccessCount: 3,
  },
});
const sendId = r.data?.id;
const accessId = r.data?.accessId;
check('创建文本 Send', r.status === 200 && !!sendId && !!accessId, r);
check('Send JSON 形状', r.data?.object === 'send' && r.data?.type === 0 && r.data?.accessCount === 0, r);

r = await call('GET', '/api/sends', { token: access3 });
check('Send 列表', r.status === 200 && r.data.data.length === 1, r);

r = await call('POST', `/api/sends/access/${accessId}`, { body: {} });
check('匿名访问（无密码）', r.status === 200 && r.data?.object === 'send-access' && r.data?.text?.text === '2.ciphertext', r);

r = await call('POST', '/api/sends/access', { body: { token: 'bogus' } });
check('坏 access token -> 401', r.status === 401, r);

// 带密码的 Send：错密码 401，对密码 200
r = await call('POST', '/api/sends', {
  token: access3,
  body: { type: 0, key: 'k2', name: 'pw-send', text: { text: 'x' }, deletionDate: del, password: 'send-pass' },
});
const pwAccessId = r.data?.accessId;
r = await call('POST', `/api/sends/access/${pwAccessId}`, { body: {} });
check('有密码未提供 -> 401', r.status === 401, r);
r = await call('POST', `/api/sends/access/${pwAccessId}`, { body: { password: 'wrong' } });
check('错密码 -> 401', r.status === 401, r);
r = await call('POST', `/api/sends/access/${pwAccessId}`, { body: { password: 'send-pass' } });
check('正确密码 -> 200', r.status === 200, r);

// token 流：identity send_access -> /api/sends/access
r = await call('POST', '/identity/connect/token', {
  form: { grant_type: 'send_access', client_id: 'web', send_id: accessId, password_hash_b64: '' },
});
check('identity send_access 发 token', r.status === 200 && !!r.data?.access_token, r);
const sendToken = r.data?.access_token;
r = await call('POST', '/api/sends/access', { body: { token: sendToken } });
check('用 send token 读 Send', r.status === 200 && r.data?.object === 'send-access', r);

// 访问次数上限：maxAccessCount=3。已消耗 2 次（匿名 + token 流），第 3 次仍可访问，第 4 次 404
r = await call('POST', `/api/sends/access/${accessId}`, { body: {} });
check('第 3 次访问仍可用', r.status === 200, r);
r = await call('POST', `/api/sends/access/${accessId}`, { body: {} });
check('超过 maxAccessCount -> 404', r.status === 404, r);

// 更新 / 移除密码 / 删除
r = await call('PUT', `/api/sends/${sendId}`, {
  token: access3,
  body: { type: 0, key: 'send-key', name: 'renamed', text: { text: 'y' }, deletionDate: del, maxAccessCount: 3 },
});
check('更新 Send', r.status === 200 && r.data?.name === 'renamed', r);
r = await call('PUT', `/api/sends/${r.data.id}/remove-password`, { token: access3 });
check('remove-password', r.status === 200, r);
r = await call('DELETE', `/api/sends/${sendId}`, { token: access3 });
check('删除 Send', r.status === 200, r);
r = await call('GET', '/api/sends', { token: access3 });
check('删除后列表少一条', r.data?.data?.length === 1, r);

// 21. 附件（v2 上传 + 下载 + 同步内联 + 删除）
const access4 = await login2();
r = await call('POST', '/api/ciphers', { token: access4, body: { type: 2, name: '2.note-with-file' } });
const fileCipherId = r.data?.id;
check('附件前置：建条目', !!fileCipherId, r);

r = await call('POST', `/api/ciphers/${fileCipherId}/attachment/v2`, {
  token: access4,
  body: { key: 'enc-file-key', fileSize: 5, fileName: 'a.txt' },
});
const attId = r.data?.attachmentId;
check('attachment/v2 返回 attachmentId + url', r.status === 200 && !!attId && !!r.data?.url, r);

// 客户端按返回的 url 上传密文（这里走相对路径，等价于 PUT url）
r = await call('PUT', `/api/ciphers/${fileCipherId}/attachment/${attId}/data`, {
  token: access4,
  raw: Buffer.from('hello'),
});
check('上传附件字节', r.status === 200, r);

r = await call('GET', `/api/ciphers/${fileCipherId}/attachment/${attId}`, { token: access4 });
check('取附件元数据（带下载 url）', r.status === 200 && r.data?.fileName === 'a.txt' && !!r.data?.url, r);

const dlPath = new URL(r.data.url, 'http://localhost').pathname + new URL(r.data.url, 'http://localhost').search;
r = await call('GET', dlPath);
check('附件下载返回原始字节', r.status === 200 && r.rawText === 'hello', r);

// 附件专用短令牌：篡改即失效
const dlToken = new URL(dlPath, 'http://localhost').searchParams.get('token');
const tampered = (dlToken[0] === 'A' ? 'B' : 'A') + dlToken.slice(1);
r = await call('GET', `/api/ciphers/${fileCipherId}/attachment/${attId}/download?token=${encodeURIComponent(tampered)}`);
check('篡改附件 token -> 401', r.status === 401, r);

// 兼容路径：直接带 Authorization 也能下（三段式 access token）
r = await call('GET', `/api/ciphers/${fileCipherId}/attachment/${attId}/download`, { token: access4 });
check('Authorization 直下也支持', r.status === 200 && r.rawText === 'hello', r);

r = await call('GET', '/api/sync', { token: access4 });
const withFile = r.data?.ciphers?.find((x) => x.id === fileCipherId);
check('sync 内联附件列表', withFile?.attachments?.length === 1, r);

r = await call('GET', `/api/ciphers/${fileCipherId}`, { token: access4 });
check('单条 cipher 内联附件', r.data?.attachments?.[0]?.id === attId, r);

r = await call('DELETE', `/api/ciphers/${fileCipherId}/attachment/${attId}`, { token: access4 });
check('删除附件', r.status === 200, r);
r = await call('GET', '/api/sync', { token: access4 });
check('删除后 sync 中附件为空', r.data?.ciphers?.find((x) => x.id === fileCipherId)?.attachments?.length === 0, r);

// 22. login with device（auth-requests）
const access5 = await login2();
r = await call('POST', '/api/auth-requests', {
  headers: { 'device-type': '10' },
  body: { accessCode: '123456', deviceIdentifier: 'dev-4', email, publicKey: 'pub-key' },
});
const arId = r.data?.id;
check('创建 auth-request', r.status === 200 && !!arId && r.data?.object === 'auth-request', r);

r = await call('GET', '/api/auth-requests/pending', { token: access5 });
check('pending 列表包含请求', r.data?.data?.some((x) => x.id === arId), r);

r = await call('PUT', `/api/auth-requests/${arId}`, {
  token: access5,
  body: { deviceIdentifier: 'dev-4', key: 'enc-key', masterPasswordHash: 'x', requestApproved: true },
});
check('批准 auth-request', r.status === 200 && r.data?.requestApproved === true, r);

r = await call('GET', `/api/auth-requests/${arId}/response?code=123456`, { headers: { 'device-type': '10' } });
check('匿名取 response（access code 校验）', r.status === 200 && r.data?.requestApproved === true, r);

r = await call('GET', `/api/auth-requests/${arId}/response?code=wrong`, { headers: { 'device-type': '10' } });
check('错误 access code -> 400', r.status === 400, r);

r = await call('POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: email,
    password: '123456', // access code
    authrequest: arId,
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'dev-4',
    deviceName: 'dev',
  },
});
check('login with device 成功', r.status === 200 && !!r.data?.access_token, r);

// 23. 文件 Send
r = await call('POST', '/api/sends/file/v2', {
  token: access5,
  body: {
    type: 1,
    key: 'file-key',
    name: 'file-send',
    file: { fileName: 'b.txt' },
    fileLength: 5,
    deletionDate: del,
  },
});
const fsId = r.data?.sendResponse?.id;
check('创建文件 Send（返回 sendResponse + url）', r.status === 200 && !!fsId && !!r.data?.url, r);

r = await call('POST', `/api/sends/${fsId}/file/${fsId}`, { token: access5, raw: Buffer.from('world') });
check('上传文件 Send 字节', r.status === 200, r);

r = await call('POST', `/api/sends/${fsId}/access/file/${fsId}`, {});
check('匿名下载文件 Send', r.status === 200 && r.rawText === 'world', r);

// 24. 桩路由 / 小路由 / 删号
r = await call('GET', '/api/tasks', { token: access4 });
check('tasks 空列表', r.status === 200 && Array.isArray(r.data.data), r);
r = await call('GET', '/api/hibp/breach?username=x', { token: access4 });
check('hibp 返回空数组', r.status === 200 && Array.isArray(r.data), r);
r = await call('GET', '/api/webauthn', { token: access4 });
check('webauthn 空列表', r.status === 200 && r.data.data.length === 0, r);
r = await call('GET', '/api/emergency-access/trusted', { token: access4 });
check('emergency-access 空列表', r.status === 200 && r.data.data.length === 0, r);

r = await call('PUT', '/api/accounts/avatar', { token: access4, body: { avatarColor: '#aabbcc' } });
check('设置头像色', r.status === 200 && r.data?.avatarColor === '#aabbcc', r);

r = await call('GET', '/api/settings/domains', { token: access4 });
check('domains 读', r.status === 200 && r.data.object === 'domains', r);
r = await call('PUT', '/api/settings/domains', { token: access4, body: { equivalentDomains: [['a.com', 'b.com']] } });
check('domains 写', r.status === 200, r);
r = await call('GET', '/api/settings/domains', { token: access4 });
check('domains 写后能读到', JSON.stringify(r.data?.equivalentDomains) === JSON.stringify([['a.com', 'b.com']]), r);

r = await call('GET', '/api/devices/identifier/dev-4', { token: access4 });
check('单设备查询', r.status === 200 && r.data?.object === 'device', r);
r = await call('POST', '/api/accounts/register/send-verification-email', { body: { email } });
check('验证邮件接口返回 mock token', r.status === 200, r);

r = await call('DELETE', '/api/accounts', { token: access4, body: { masterPasswordHash: 'wrong' } });
check('删号错密码 -> 401', r.status === 401, r);
r = await call('DELETE', '/api/accounts', { token: access4, body: { masterPasswordHash: mph2 } });
check('删号成功', r.status === 200, r);
r = await call('POST', '/identity/connect/token', {
  form: { grant_type: 'password', username: email, password: mph2, scope: 'api offline_access', client_id: 'web', deviceType: '10', deviceIdentifier: 'dev-x', deviceName: 'x' },
});
check('删号后无法登录', r.status === 400, r);
r = await call('GET', '/api/sync', { token: access4 });
check('删号后旧 token 失效', r.status === 401, r);

// 25. 密钥轮换 + 导入（用全新账号，避免影响前面的状态）
const email2 = `rotate-${Date.now()}@example.com`;
const mphA = 'rotate-mph';
r = await call('POST', '/api/accounts/register', {
  body: {
    email: email2,
    name: 'R',
    masterPasswordHash: mphA,
    key: 'k-a',
    userAsymmetricKeys: { encryptedPrivateKey: 'priv-a', publicKey: 'pub-a' },
    kdf: 0,
    kdfIterations: 600000,
  },
});
check('轮换前置：注册新账号', r.status === 200, r);

const loginAs = async (e, pw, dev) => {
  const rr = await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password',
      username: e,
      password: pw,
      scope: 'api offline_access',
      client_id: 'web',
      deviceType: '10',
      deviceIdentifier: dev,
      deviceName: dev,
    },
  });
  return rr.data?.access_token;
};
const tA = await loginAs(email2, mphA, 'rot-dev');
check('轮换前置：登录', !!tA, tA);

r = await call('POST', '/api/folders', { token: tA, body: { name: '2.rot-folder' } });
const rotFolder = r.data?.id;
r = await call('POST', '/api/ciphers', { token: tA, body: { type: 1, name: '2.rot-cipher', login: { username: 'u' }, folderId: rotFolder } });
const rotCipher = r.data?.id;
check('轮换前置：1 条目 + 1 文件夹', !!rotCipher && !!rotFolder, r);

const rotatePayload = (overrides = {}) => ({
  oldMasterKeyAuthenticationHash: mphA,
  accountUnlockData: {
    masterPasswordUnlockData: {
      kdfType: 0,
      kdfIterations: 600000,
      email: email2,
      masterKeyEncryptedUserKey: 'k-a2',
      masterKeyAuthenticationHash: mphA,
    },
  },
  accountKeys: { accountPublicKey: 'pub-a', userKeyEncryptedAccountPrivateKey: 'priv-a2' },
  accountData: {
    ciphers: [{ id: rotCipher, type: 1, name: '2.rot-cipher-v2', folderId: rotFolder, favorite: false, login: { username: 'u2' } }],
    folders: [{ id: rotFolder, name: '2.rot-folder-v2' }],
    sends: [],
  },
  ...overrides,
});

r = await call('POST', '/api/accounts/key-management/rotate-user-account-keys', {
  token: tA,
  body: rotatePayload({ accountData: { ciphers: [], folders: [], sends: [] } }),
});
check('轮换缺条目 -> 400', r.status === 400, r);

r = await call('POST', '/api/accounts/key-management/rotate-user-account-keys', { token: tA, body: rotatePayload() });
check('密钥轮换成功', r.status === 200, r);

r = await call('GET', '/api/sync', { token: tA });
check('轮换后旧 token -> 401', r.status === 401, r);

const tA2 = await loginAs(email2, mphA, 'rot-dev');
check('轮换后可重新登录', !!tA2, tA2);
r = await call('GET', '/api/sync', { token: tA2 });
check('轮换后内容已更新', r.data?.ciphers?.[0]?.name === '2.rot-cipher-v2', r);
check('轮换后 key/privateKey 已换', r.data?.profile?.key === 'k-a2', r.data?.profile);

r = await call('POST', '/api/ciphers/import', {
  token: tA2,
  body: {
    ciphers: [{ type: 1, name: '2.imp-1' }, { type: 2, name: '2.imp-2' }],
    folders: [{ name: '2.imp-folder' }],
    folderRelationships: [{ key: 0, value: 0 }],
  },
});
check('导入 2 条目 + 1 文件夹', r.status === 200 && r.data?.count === 2 && r.data?.folders === 1, r);

r = await call('GET', '/api/sync', { token: tA2 });
check('导入后条目数 3', r.data?.ciphers?.length === 3, r);
check('导入条目进文件夹', r.data?.ciphers?.some((x) => x.name === '2.imp-1' && x.folderId), r);

// 26. 限流 + WebSocket 降级
const hintEmail = `hint-${Date.now()}@example.com`;
let statuses = [];
for (let i = 0; i < 4; i++) {
  const rr = await call('POST', '/api/accounts/password-hint', { body: { email: hintEmail } });
  statuses.push(rr.status);
}
check('password-hint 4 次后触发限流（3 次 200 + 1 次 429）', statuses.join(',') === '200,200,200,429', statuses);

r = await call('GET', '/notifications/hub');
check('/notifications/hub -> 426 降级', r.status === 426 && r.data?.error === 'websocket_not_supported', r);

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error('failed:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
