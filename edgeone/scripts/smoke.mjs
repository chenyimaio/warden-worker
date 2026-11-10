// scripts/smoke.mjs
// 端到端冒烟：直接调 app.fetch（不经 HTTP 端口），验证路由/鉴权/存储链路。
// 用法：node scripts/smoke.mjs
import app from '../src/index.js';

const env = {
  BASE_URL: 'http://localhost:8787',
  ALLOWED_EMAILS: '*@example.com',
  JWT_SECRET: 'test-access-secret-0123456789abcdef',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcd',
  PASSWORD_ITERATIONS: '100000',
  STORE_DRIVER: 'memory',
  MAIL_ENABLED: 'false',
};

const results = [];
const call = async (method, path, { body, form, raw, multipart, token, headers = {} } = {}) => {
  const h = { ...headers };
  let payload;
  if (multipart !== undefined) {
    // 不手动设 content-type，让 fetch 自己带 boundary
    const fd = new FormData();
    fd.append(multipart.field || 'data', new Blob([multipart.bytes]), multipart.name || 'file');
    payload = fd;
  } else if (raw !== undefined) {
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
  return { status: res.status, data, rawText: text, headers: res.headers };
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

// 15. 未实现路由 -> 404
r = await call('GET', '/api/organizations');
check('未实现路由返回 404', r.status === 404 && r.data.error === 'not_found', r);

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

// 恢复码等价于凭据，落盘必须是密文（enc:v1: 前缀），不能是明文
{
  const { getStore, keys } = await import('../src/store.js');
  const st = getStore(env);
  const rows = await st.list('u/');
  const profKey = rows.map((x) => x.key).find((k) => k.endsWith('/profile.json'));
  const stored = profKey ? (await st.get(profKey))?.value?.totpRecover : null;
  check('恢复码在存储里是密文', typeof stored === 'string' && stored.startsWith('enc:v1:') && !stored.includes(recoverCode), stored);
}

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
check('fileUploadType=0（DIRECT，客户端 POST 到 url）', r.data?.fileUploadType === 0, r.data?.fileUploadType);
check('upload url 指向本服务 /api/sends/{id}/file/{id}（带签名）', String(r.data?.url).includes(`/api/sends/${fsId}/file/${fsId}?token=`), r.data?.url);

r = await call('POST', `/api/sends/${fsId}/file/${fsId}`, { token: access5, raw: Buffer.from('world') });
check('上传文件 Send 字节', r.status === 200, r);

// 网页版下载文件 Send 的契约：POST 返回 { url }，再自己 fetch(url) 拿字节
const sendFileUrl = async (fileId) => {
  const res = await call('POST', `/api/sends/access/file/${fileId}`, {});
  if (res.status !== 200 || !res.data?.url) return { res, bytes: null };
  const u = new URL(res.data.url, 'http://localhost');
  const bytes = await call('GET', u.pathname + u.search);
  return { res, bytes };
};

const dl1 = await sendFileUrl(fsId);
check('匿名下载文件 Send（先拿 url 再取字节）', dl1.res.status === 200 && !!dl1.res.data?.url && dl1.bytes?.rawText === 'world', dl1);

// 23b. 旧客户端：/api/sends/access/file/{accessId}（不能被 :id/file/:fileId 抢占）
r = await call('POST', '/api/sends/file/v2', {
  token: access5,
  body: { type: 1, key: 'file-key-2', name: 'legacy-file', file: { fileName: 'c.txt' }, fileLength: 3, deletionDate: del },
});
const fsId2 = r.data?.sendResponse?.id;
const fsAccessId = r.data?.sendResponse?.accessId;
r = await call('POST', `/api/sends/${fsId2}/file/${fsId2}`, { token: access5, raw: Buffer.from('abc') });
check('第二个文件 Send 上传', r.status === 200, r);
const dl2 = await sendFileUrl(fsAccessId);
check('legacy /sends/access/file/{accessId} 下载', dl2.res.status === 200 && dl2.bytes?.rawText === 'abc', dl2);

// 23c. multipart（Direct 上传的另一种形态）与 PUT（Azure 风格）都能收
r = await call('POST', `/api/sends/${fsId2}/file/${fsId2}`, {
  token: access5,
  multipart: { field: 'data', name: 'c.txt', bytes: Buffer.from('multipart-bytes') },
});
check('multipart 上传', r.status === 200, r);
const dl3 = await sendFileUrl(fsAccessId);
check('multipart 内容可下载', dl3.res.status === 200 && dl3.bytes?.rawText === 'multipart-bytes', dl3);

r = await call('PUT', `/api/sends/${fsId2}/file/${fsId2}`, { token: access5, raw: Buffer.from('put-bytes') });
check('PUT 上传（Azure 风格）', r.status === 200, r);
const dl4 = await sendFileUrl(fsAccessId);
check('PUT 内容可下载', dl4.res.status === 200 && dl4.bytes?.rawText === 'put-bytes', dl4);

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

// 27. 安全回归：带密码的文件 Send 不能绕过密码 / 改密必须证明当前密码
//     这一段用全新账号，避免受前面轮换/踢下线影响
const secEmail = `sec-${Date.now()}@example.com`;
const secMph = 'sec-master-hash';
r = await call('POST', '/api/accounts/register', {
  body: {
    email: secEmail,
    masterPasswordHash: secMph,
    userSymmetricKey: '2.sec-key|iv|ct',
    userAsymmetricKeys: { encryptedPrivateKey: '2.sec-priv|iv|ct', publicKey: 'sec-pub' },
    kdf: 0,
    kdfIterations: 100000,
  },
});
check('安全回归：注册临时账号', r.status === 200, r);
r = await call('POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: secEmail,
    password: secMph,
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'sec-dev',
    deviceName: 'sec',
  },
});
const secAccess = r.data?.access_token;
check('安全回归：临时账号登录', r.status === 200 && !!secAccess, r);

r = await call('POST', '/api/sends/file/v2', {
  token: secAccess,
  body: {
    type: 1,
    key: 'pw-file-key',
    name: 'pw-file-send',
    file: { fileName: 'secret.txt' },
    fileLength: 6,
    deletionDate: del,
    password: 'letmein-please',
  },
});
const secSend = r.data?.sendResponse ?? {};
const secUploadUrl = r.data?.url ?? '';
const secId = secSend.id;
const secAccessId = secSend.accessId;
await call('POST', `/api/sends/${secId}/file/${secId}`, { token: secAccess, raw: Buffer.from('hidden') });

r = await call('POST', `/api/sends/access/file/${secAccessId}`, {});
check('带密码的文件 Send：匿名请求下载地址 -> 401', r.status === 401, r);

r = await call('POST', `/api/sends/access/file/${secAccessId}`, { body: { password: 'wrong-one' } });
check('带密码的文件 Send：错误密码 -> 401', r.status === 401, r);

r = await call('POST', `/api/sends/access/${secAccessId}`, { body: { password: 'letmein-please' } });
const secToken = r.data?.token;
check('正确密码换到 send-access 票据', r.status === 200 && !!secToken, r);

r = await call('POST', `/api/sends/access/file/${secAccessId}`, { token: secToken });
check('带票据可以拿下载地址', r.status === 200 && !!r.data?.url, r);
if (r.data?.url) {
  const u = new URL(r.data.url, 'http://localhost');
  const bytes = await call('GET', u.pathname + u.search);
  check('带票据可以下载到明文', bytes.rawText === 'hidden', bytes);

  // 票据限次（maxUses=5，第 1 次已在上面用掉）：再 4 次可用，第 6 次被拒
  let lastStatus = 0;
  for (let i = 0; i < 4; i++) lastStatus = (await call('GET', u.pathname + u.search)).status;
  check('同一票据累计第 5 次仍可用', lastStatus === 200, lastStatus);
  const over = await call('GET', u.pathname + u.search);
  check('同一票据超过上限后被拒', over.status === 401, over);
}

// 28. 安全回归：改主密码必须证明当前密码
r = await call('POST', '/api/accounts/password', {
  token: secAccess,
  body: { masterPasswordHash: 'attacker-chosen', key: 'attacker-key' },
});
check('只凭 access token 改主密码 -> 被拒（400/401，不再被当成新密码）', r.status === 400 || r.status === 401, r);

r = await call('POST', '/api/accounts/password', {
  token: secAccess,
  body: { masterPasswordHash: 'wrong-current', newMasterPasswordHash: 'x', key: 'k' },
});
check('当前密码错误 -> 401', r.status === 401, r);

// 网页版结构：masterPasswordHash=当前 + authenticationData/unlockData=新
r = await call('POST', '/api/accounts/password', {
  token: secAccess,
  body: {
    masterPasswordHash: secMph,
    masterPasswordHint: '新提示',
    authenticationData: { masterPasswordAuthenticationHash: 'sec-mph-2', salt: secEmail, kdf: { kdfType: 0, iterations: 100000 } },
    unlockData: { masterKeyWrappedUserKey: '2.sec-key2|iv|ct', salt: secEmail, kdf: { kdfType: 0, iterations: 100000 } },
  },
});
check('用网页版结构（authenticationData）改密 -> 200', r.status === 200, r);
r = await call('POST', '/identity/connect/token', {
  form: {
    grant_type: 'password',
    username: secEmail,
    password: 'sec-mph-2',
    scope: 'api offline_access',
    client_id: 'web',
    deviceType: '10',
    deviceIdentifier: 'sec-dev-2',
    deviceName: 'sec',
  },
});
check('新密码可以登录（旧密码结构没被误写成新密码）', r.status === 200 && !!r.data?.access_token, r);

// 29. 安全回归（第二轮审计）：用途隔离 / securityStamp / 孤儿记录
// 上传票据（api.send.upload）不能换成下载地址
{
  const secUpToken = decodeURIComponent(((secUploadUrl ?? '').split('token=')[1] ?? ''));
  r = await call('POST', `/api/sends/access/file/${secAccessId}`, { token: secUpToken });
  check('上传票据不能换下载地址 -> 401', !secUpToken || r.status === 401, r);
}

// 改密后旧 access token 不能再下载附件
{
  const email3 = `att-${Date.now()}@example.com`;
  const mph3 = 'att-mph';
  await call('POST', '/api/accounts/register', {
    body: {
      email: email3,
      masterPasswordHash: mph3,
      userSymmetricKey: '2.k|iv|ct',
      userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' },
      kdf: 0,
      kdfIterations: 100000,
    },
  });
  const tok3 = (await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password', username: email3, password: mph3, scope: 'api offline_access',
      client_id: 'web', deviceType: '10', deviceIdentifier: 'att-dev', deviceName: 'att',
    },
  })).data?.access_token;
  r = await call('POST', '/api/ciphers', { token: tok3, body: { type: 2, name: '2.n', notes: '2.no', secureNote: { type: 0 } } });
  const cid3 = r.data?.id;
  r = await call('POST', `/api/ciphers/${cid3}/attachment/v2`, { token: tok3, body: { key: '2.ak', fileName: 'a.bin', fileSize: 4 } });
  const aid3 = r.data?.attachmentId;
  await call('POST', `/api/ciphers/${cid3}/attachment/${aid3}`, { token: tok3, raw: Buffer.from('DATA') });
  const okBefore = await call('GET', `/api/ciphers/${cid3}/attachment/${aid3}/download`, { token: tok3 });
  check('改密前附件可下载', okBefore.status === 200, okBefore);
  await call('POST', '/api/accounts/password', {
    token: tok3,
    body: { masterPasswordHash: mph3, newMasterPasswordHash: 'att-mph-2', key: '2.k2|iv|ct' },
  });
  const syncAfter = await call('GET', '/api/sync', { token: tok3 });
  check('改密后 /api/sync -> 401', syncAfter.status === 401, syncAfter);
  const attAfter = await call('GET', `/api/ciphers/${cid3}/attachment/${aid3}/download`, { token: tok3 });
  check('改密后旧 token 下载附件 -> 401', attAfter.status === 401, attAfter);
}

// 超限文件 Send 不应落库（否则孤儿记录可无限制造）
// 上一节改过密码，这里用新密码重新登录拿新 token
{
  const tok4 = (await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password', username: secEmail, password: 'sec-mph-2', scope: 'api offline_access',
      client_id: 'web', deviceType: '10', deviceIdentifier: 'sec-dev-3', deviceName: 'sec',
    },
  })).data?.access_token;
  r = await call('POST', '/api/sends/file/v2', {
    token: tok4,
    body: { type: 1, key: 'k', name: 'too-big', file: { fileName: 'b.bin' }, fileLength: 9 * 1024 * 1024, deletionDate: del },
  });
  check('9 MiB 文件 Send -> 413', r.status === 413, r);
  const after = await call('GET', '/api/sends', { token: tok4 });
  check('超限 Send 没有留下记录', !(after.data?.data ?? []).some((x) => x.name === 'too-big'), after);
}

// 30. 安全回归（第三轮审计）：请求体上限 / body id / 重复 id / 坏 JSON / 附件票据绑 stamp
{
  // 只信 Content-Length 时 chunked 请求可以绕过 4 MiB 上限
  const big = 'z'.repeat(5 * 1024 * 1024);
  const stream = new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(new TextEncoder().encode(`{"name":"${big}"}`));
      ctrl.close();
    },
  });
  const res = await app.fetch(
    new Request('http://localhost/api/ciphers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secAccess}` },
      body: stream,
      duplex: 'half',
    }),
    env,
  );
  check('chunked 5 MiB JSON -> 413', res.status === 413, res.status);
}

{
  // 用新密码登录（第 28 节改过）
  const tok = (await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password', username: secEmail, password: 'sec-mph-2', scope: 'api offline_access',
      client_id: 'web', deviceType: '10', deviceIdentifier: 'sec-dev-4', deviceName: 'sec',
    },
  })).data?.access_token;

  r = await call('POST', '/api/ciphers', { token: tok, body: { id: '../../profile', type: 1, name: 'trav', login: {} } });
  check('cipher body id=../../profile -> 400', r.status === 400, r);
  r = await call('POST', '/api/ciphers', { token: tok, body: { id: 'a/b', type: 1, name: 'trav', login: {} } });
  check('cipher body id=a/b -> 400', r.status === 400, r);

  r = await call('POST', '/api/ciphers', { token: tok, body: { id: 'dup-smoke', type: 1, name: 'd1', login: {} } });
  check('自定义 id 创建 -> 200', r.status === 200, r);
  r = await call('POST', '/api/ciphers', { token: tok, body: { id: 'dup-smoke', type: 1, name: 'd2', login: {} } });
  check('重复 id -> 409 且是 JSON', r.status === 409 && typeof r.data === 'object', r);

  // 坏 JSON：直接用 fetch 构造（call() 的 raw 分支会强制 octet-stream）
  const badRes = await app.fetch(
    new Request('http://localhost/api/ciphers', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${tok}` },
      body: '{bad json',
    }),
    env,
  );
  check('坏 JSON -> 400（不再吞成空对象落库）', badRes.status === 400, badRes.status);

  // 附件票据绑 securityStamp：改密后旧票据失效
  const email5 = `tok-${Date.now()}@example.com`;
  await call('POST', '/api/accounts/register', {
    body: {
      email: email5, masterPasswordHash: 'tok-mph', userSymmetricKey: '2.k|iv|ct',
      userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
    },
  });
  const t5 = (await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password', username: email5, password: 'tok-mph', scope: 'api offline_access',
      client_id: 'web', deviceType: '10', deviceIdentifier: 'tok-dev', deviceName: 'tok',
    },
  })).data?.access_token;
  r = await call('POST', '/api/ciphers', { token: t5, body: { type: 2, name: '2.n', notes: '2.no', secureNote: { type: 0 } } });
  const cid5 = r.data?.id;
  r = await call('POST', `/api/ciphers/${cid5}/attachment/v2`, { token: t5, body: { key: '2.ak', fileName: 'a.bin', fileSize: 4 } });
  const aid5 = r.data?.attachmentId;
  await call('POST', `/api/ciphers/${cid5}/attachment/${aid5}`, { token: t5, raw: Buffer.from('DATA') });
  r = await call('GET', `/api/ciphers/${cid5}`, { token: t5 });
  const attUrl = r.data?.attachments?.[0]?.url ?? '';
  const u5 = new URL(attUrl, 'http://localhost');
  const ok5 = await call('GET', u5.pathname + u5.search);
  check('2 段式附件票据改密前可用', ok5.status === 200, ok5);
  await call('POST', '/api/accounts/password', {
    token: t5,
    body: { masterPasswordHash: 'tok-mph', newMasterPasswordHash: 'tok-mph-2', key: '2.k2|iv|ct' },
  });
  const dead5 = await call('GET', u5.pathname + u5.search);
  check('改密后同一附件票据 -> 401', dead5.status === 401, dead5);
}

// 31. 安全回归（第四轮审计）：Send 分享链接不能被他人顶掉 / id 必须合法
{
  const mkUser = async (tag) => {
    const addr = `${tag}-${Date.now()}@example.com`;
    await call('POST', '/api/accounts/register', {
      body: {
        email: addr, masterPasswordHash: `${tag}-mph`, userSymmetricKey: '2.k|iv|ct',
        userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
      },
    });
    return (await call('POST', '/identity/connect/token', {
      form: {
        grant_type: 'password', username: addr, password: `${tag}-mph`, scope: 'api offline_access',
        client_id: 'web', deviceType: '10', deviceIdentifier: `dev-${tag}`, deviceName: tag,
      },
    })).data?.access_token;
  };
  const alice = await mkUser('alice');
  const bob = await mkUser('bob');

  r = await call('POST', '/api/sends', {
    token: alice,
    body: { type: 0, key: 'k', name: 'ALICE-SECRET', text: { text: 'secret' }, deletionDate: del },
  });
  const aliceAccess = r.data?.accessId;
  check('Alice 建 Send', r.status === 200 && !!aliceAccess, r);

  // accessId 是公开的；用 hex(accessId) 当 id 可以算出同一个 accessId
  const hijackId = Buffer.from(String(aliceAccess), 'base64url').toString('hex');
  r = await call('POST', '/api/sends', {
    token: bob,
    body: { id: hijackId, type: 0, key: 'k2', name: 'BOB-OVERWRITE', text: { text: 'bob' }, deletionDate: del },
  });
  check('用 hex(对方 accessId) 建 Send -> 409', r.status === 409, r);

  r = await call('POST', `/api/sends/access/${aliceAccess}`, { body: {} });
  check('Alice 的链接内容没被替换', r.data?.name === 'ALICE-SECRET', r);

  r = await call('DELETE', `/api/sends/${hijackId}`, { token: bob });
  const afterDel = await call('POST', `/api/sends/access/${aliceAccess}`, { body: {} });
  check('Bob 删除自己的 Send 不影响 Alice 链接', afterDel.status === 200, afterDel);

  // id 必须是 32 位十六进制或 UUID
  r = await call('POST', '/api/sends', { token: bob, body: { id: 'zzzz', type: 0, key: 'k', name: 'x', text: { text: 'x' }, deletionDate: del } });
  check('非十六进制 send id -> 400', r.status === 400, r);
  r = await call('POST', '/api/sends', { token: bob, body: { id: '../../profile', type: 0, key: 'k', name: 'x', text: { text: 'x' }, deletionDate: del } });
  check('路径穿越 send id -> 400', r.status === 400, r);

  // 旧 multipart 通道同样要校验
  const fd = new FormData();
  fd.append('id', '../../profile');
  fd.append('type', '1');
  fd.append('name', 'legacy');
  fd.append('deletionDate', del);
  fd.append('file', new Blob([Buffer.from('x')]), 'x.bin');
  const legacyRes = await app.fetch(
    new Request('http://localhost/api/sends/file', { method: 'POST', headers: { authorization: `Bearer ${bob}` }, body: fd }),
    env,
  );
  check('旧 multipart 通道 id=../../profile -> 400', legacyRes.status === 400, legacyRes.status);
}

// 32. 安全回归（第五轮审计）：bulk ids / 邮箱格式 / folderId 归属 / 每 Send 口令失败计数
{
  const mkUser = async (tag) => {
    const addr = `${tag}-${Date.now()}@example.com`;
    await call('POST', '/api/accounts/register', {
      body: {
        email: addr, masterPasswordHash: `${tag}-mph`, userSymmetricKey: '2.k|iv|ct',
        userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
      },
    });
    return (await call('POST', '/identity/connect/token', {
      form: {
        grant_type: 'password', username: addr, password: `${tag}-mph`, scope: 'api offline_access',
        client_id: 'web', deviceType: '10', deviceIdentifier: `dev-${tag}`, deviceName: tag,
      },
    })).data?.access_token;
  };
  const ua = await mkUser('r5a');
  const ub = await mkUser('r5b');

  // bulk 接口的 ids 必须校验（否则会拼进存储键）
  for (const [m, p] of [
    ['PUT', '/api/ciphers/delete'],
    ['POST', '/api/ciphers/delete'],
    ['PUT', '/api/ciphers/restore'],
    ['PUT', '/api/ciphers/archive'],
    ['PUT', '/api/ciphers/unarchive'],
    ['POST', '/api/ciphers/move'],
  ]) {
    r = await call(m, p, { token: ua, body: { ids: ['../../victim/profile'], folderId: null } });
    check(`bulk ${m} ${p} 非法 id -> 400`, r.status === 400, r);
  }

  // 正常 id 仍然可用
  r = await call('POST', '/api/ciphers', { token: ua, body: { type: 1, name: 'ok', login: {} } });
  const okCipher = r.data?.id;
  r = await call('PUT', '/api/ciphers/delete', { token: ua, body: { ids: [okCipher] } });
  check('bulk 合法 id -> 200', r.status === 200, r);

  // 邮箱格式
  for (const bad of ['a<b>@example.com', 'not-an-email', 'a@b']) {
    r = await call('POST', '/api/accounts/register', {
      body: {
        email: bad, masterPasswordHash: 'x', userSymmetricKey: '2.k|iv|ct',
        userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
      },
    });
    check(`注册邮箱 ${bad} -> 400`, r.status === 400, r);
  }

  // folderId 归属：用别人的 folder 应被拒
  r = await call('POST', '/api/folders', { token: ub, body: { name: 'bob-folder' } });
  const bobFolder = r.data?.id;
  r = await call('POST', '/api/ciphers', { token: ua, body: { type: 1, name: 'x', login: {}, folderId: bobFolder } });
  check('create 用他人 folderId -> 400', r.status === 400, r);
  r = await call('POST', '/api/ciphers', { token: ua, body: { type: 1, name: 'y', login: {} } });
  const ownCipher = r.data?.id;
  r = await call('PUT', `/api/ciphers/${ownCipher}`, { token: ua, body: { folderId: bobFolder } });
  check('update 用他人 folderId -> 400', r.status === 400, r);
  r = await call('POST', '/api/folders', { token: ua, body: { name: 'alice-folder' } });
  const ownFolder = r.data?.id;
  r = await call('POST', '/api/ciphers', { token: ua, body: { type: 1, name: 'z', login: {}, folderId: ownFolder } });
  check('create 用自己的 folderId -> 200', r.status === 200, r);

  // 每 Send 的口令尝试：按 (IP, Send) 限速，且正确口令永远放行
  const delDate = new Date(Date.now() + 86400e3).toISOString();
  r = await call('POST', '/api/sends', {
    token: ua,
    body: { type: 0, key: 'k', name: 'pw-send', text: { text: 'x' }, deletionDate: delDate, password: 'letmein' },
  });
  const pwAccess = r.data?.accessId;

  // 第三方用一个 IP 连打错口令，把自己这个 (IP, Send) 桶打满
  const attacker = [];
  for (let i = 0; i < 12; i++) {
    const x = await call('POST', `/api/sends/access/${pwAccess}`, {
      body: { password: `wrong${i}` },
      headers: { 'eo-connecting-ip': '10.9.9.9' },
    });
    attacker.push(x.status);
  }
  check('第三方同 IP 连打 12 次错口令 -> 后段被 429 限速', attacker.slice(-1)[0] === 429 && attacker.includes(429), attacker);

  // 关键：另一个 IP 用正确口令必须仍然放行（不能被第三方锁死）
  r = await call('POST', `/api/sends/access/${pwAccess}`, {
    body: { password: 'letmein' },
    headers: { 'eo-connecting-ip': '10.7.7.7' },
  });
  check('他人打满后，另一个 IP 用正确口令仍可访问', r.status === 200 && !!r.data?.token, r);

  // 打满的那个 IP 在窗口内被拒——这是有意的：
  // 限流必须发生在校验之前，否则攻击者仍能无限跑 PBKDF2 试口令。
  // 影响范围只有「这个 IP + 这条 Send」，1 分钟后自动恢复，不波及他人。
  r = await call('POST', `/api/sends/access/${pwAccess}`, {
    body: { password: 'letmein' },
    headers: { 'eo-connecting-ip': '10.9.9.9' },
  });
  check('打满的 IP 在窗口内被 429 限速（范围仅限该 IP + 该 Send）', r.status === 429 && /Too many/i.test(String(r.data?.error ?? '')), r);
}

// 33. 安全回归（第六轮）：密钥轮换必须是全有或全无，不能半轮换丢数据
{
  const mkUser = async (tag) => {
    const addr = `${tag}-${Date.now()}@example.com`;
    await call('POST', '/api/accounts/register', {
      body: {
        email: addr, masterPasswordHash: `${tag}-mph`, userSymmetricKey: '2.k|iv|ct',
        userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
      },
    });
    return { addr, tok: (await call('POST', '/identity/connect/token', {
      form: {
        grant_type: 'password', username: addr, password: `${tag}-mph`, scope: 'api offline_access',
        client_id: 'web', deviceType: '10', deviceIdentifier: `dev-${tag}`, deviceName: tag,
      },
    })).data?.access_token };
  };
  const owner = await mkUser('rot');
  const other = await mkUser('rotother');

  const d = new Date(Date.now() + 86400e3).toISOString();
  r = await call('POST', '/api/ciphers', { token: owner.tok, body: { type: 1, name: '2.skip', login: { username: 'u' } } });
  const rk1 = r.data?.id;
  r = await call('POST', '/api/ciphers', { token: owner.tok, body: { type: 1, name: '2.keep', login: { username: 'u2' } } });
  const rk2 = r.data?.id;
  r = await call('POST', '/api/sends', {
    token: owner.tok,
    body: { type: 0, key: '2.OLD-AKEY', name: '2.send', text: { text: '2.old' }, deletionDate: d },
  });
  const rSend = r.data?.id;

  r = await call('POST', '/api/folders', { token: other.tok, body: { name: 'other-folder' } });
  const otherFolder = r.data?.id;

  const rotBase = {
    oldMasterKeyAuthenticationHash: 'rot-mph',
    accountUnlockData: {
      masterPasswordUnlockData: {
        kdfType: 0, kdfIterations: 100000, email: owner.addr,
        masterKeyAuthenticationHash: 'rot-mph-2', masterKeyEncryptedUserKey: '2.NEWKEY|iv|ct',
      },
    },
    accountKeys: { accountPublicKey: 'pub' },
  };

  // 路径 A：条目带他人的 folderId -> 必须整体 400，且一条都不能被改
  r = await call('POST', '/api/accounts/key-management/rotate-user-account-keys', {
    token: owner.tok,
    body: {
      ...rotBase,
      accountData: {
        ciphers: [
          { id: rk1, type: 1, name: '2.skip-rot', login: { username: 'u' } },
          { id: rk2, type: 1, name: '2.keep-rot', login: { username: 'u2' }, folderId: otherFolder },
        ],
        folders: [],
        sends: [{ id: rSend, key: '2.NEW-AKEY', name: '2.send-rot' }],
      },
    },
  });
  check('轮换带他人 folderId -> 400（整体拒绝）', r.status === 400, r);

  // 数据必须原封不动
  r = await call('GET', '/api/sync', { token: owner.tok });
  const namesAfter = (r.data?.ciphers ?? []).map((x) => x.name).sort();
  check('拒绝后 cipher 未被改名（没有半轮换）', namesAfter.join(',') === '2.keep,2.skip', namesAfter);

  // 旧口令仍能登录，说明 profile 没被换
  r = await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password', username: owner.addr, password: 'rot-mph', scope: 'api offline_access',
      client_id: 'web', deviceType: '10', deviceIdentifier: 'rot-check', deviceName: 'chk',
    },
  });
  check('拒绝后旧口令仍可登录（profile 未被换）', r.status === 200, r);

  // 路径 B：用户有 Send 但不提交 -> 必须 400，否则那条 Send 永久解不开
  r = await call('POST', '/api/accounts/key-management/rotate-user-account-keys', {
    token: owner.tok,
    body: {
      ...rotBase,
      accountData: {
        ciphers: [
          { id: rk1, type: 1, name: '2.skip', login: { username: 'u' } },
          { id: rk2, type: 1, name: '2.keep', login: { username: 'u2' } },
        ],
        folders: [],
      },
    },
  });
  check('轮换不带 sends -> 400（不静默丢数据）', r.status === 400, r);

  // 正常全量轮换应当成功，且所有东西都换了
  r = await call('POST', '/api/accounts/key-management/rotate-user-account-keys', {
    token: owner.tok,
    body: {
      ...rotBase,
      accountData: {
        ciphers: [
          { id: rk1, type: 1, name: '2.skip-rot', login: { username: 'u' } },
          { id: rk2, type: 1, name: '2.keep-rot', login: { username: 'u2' } },
        ],
        folders: [],
        sends: [{ id: rSend, key: '2.NEW-AKEY', name: '2.send-rot' }],
      },
    },
  });
  check('全量轮换 -> 200', r.status === 200, r);

  // 轮换会换 securityStamp 踢掉旧 token，用新口令重新登录再验证
  r = await call('POST', '/identity/connect/token', {
    form: {
      grant_type: 'password', username: owner.addr, password: 'rot-mph-2', scope: 'api offline_access',
      client_id: 'web', deviceType: '10', deviceIdentifier: 'rot-after', deviceName: 'after',
    },
  });
  const tokAfter = r.data?.access_token;
  check('轮换后新口令可登录', !!tokAfter, r);

  r = await call('GET', '/api/sync', { token: tokAfter });
  check('轮换后 cipher 全部改名', (r.data?.ciphers ?? []).map((x) => x.name).sort().join(',') === '2.keep-rot,2.skip-rot', r.data?.ciphers);
  r = await call('GET', '/api/sends', { token: tokAfter });
  const rotSend = (r.data?.data ?? [])[0];
  check('轮换后 send akey 已更新', rotSend?.key === '2.NEW-AKEY', rotSend);
}

// 34. 安全回归（第七轮）：N-6 槽位放大 + 7 项低危
{
  // N-6：软上限触发后必须立即返回 429，不能 sleep 占住并发槽
  const mkUser = async (tag) => {
    const addr = `${tag}-${Date.now()}@example.com`;
    await call('POST', '/api/accounts/register', {
      body: {
        email: addr, masterPasswordHash: `${tag}-mph`, userSymmetricKey: '2.k|iv|ct',
        userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
      },
    });
    return { addr, tok: (await call('POST', '/identity/connect/token', {
      form: {
        grant_type: 'password', username: addr, password: `${tag}-mph`, scope: 'api offline_access',
        client_id: 'web', deviceType: '10', deviceIdentifier: `dev-${tag}`, deviceName: tag,
      },
    })).data?.access_token };
  };
  const u = await mkUser('n6');
  const dd = new Date(Date.now() + 86400e3).toISOString();
  r = await call('POST', '/api/sends', {
    token: u.tok,
    body: { type: 0, key: 'k', name: 'slow', text: { text: 'x' }, deletionDate: dd, password: 'right' },
  });
  const slowAccess = r.data?.accessId;

  // 打满单 Send 累计失败（50 次）：30 个 IP × 2 次
  for (let i = 0; i < 25; i++) {
    for (let j = 0; j < 2; j++) {
      await call('POST', `/api/sends/access/${slowAccess}`, {
        body: { password: `x${i}_${j}` },
        headers: { 'eo-connecting-ip': `10.2.${i}.${j}` },
      });
    }
  }
  const t0 = Date.now();
  r = await call('POST', `/api/sends/access/${slowAccess}`, {
    body: { password: 'nope' },
    headers: { 'eo-connecting-ip': '10.9.9.9' },
  });
  const elapsed = Date.now() - t0;
  check('软上限触发后立即 429（不 sleep）', r.status === 429 && elapsed < 200, { status: r.status, elapsed });

  // 6 并发必须几乎同时完成（若每个占 600ms，总耗时会到 600ms+）
  const t1 = Date.now();
  const par = await Promise.all([0, 1, 2, 3, 4, 5].map((i) =>
    call('POST', `/api/sends/access/${slowAccess}`, {
      body: { password: `c${i}` },
      headers: { 'eo-connecting-ip': `10.8.8.${i}` },
    }),
  ));
  const parMs = Date.now() - t1;
  check('6 并发软上限请求总耗时 < 400ms（不占槽）', parMs < 400 && par.every((x) => x.status === 429), { parMs, codes: par.map((x) => x.status) });

  // 软上限后正确口令仍放行
  r = await call('POST', `/api/sends/access/${slowAccess}`, {
    body: { password: 'right' },
    headers: { 'eo-connecting-ip': '10.7.7.7' },
  });
  check('软上限触发后正确口令仍 200', r.status === 200, r);

  // L-17：附件下载不声明 content-length，且字节正确
  r = await call('POST', '/api/ciphers', { token: u.tok, body: { type: 2, name: 'f', secureNote: { type: 0 } } });
  const attCipher = r.data?.id;
  r = await call('POST', `/api/ciphers/${attCipher}/attachment/v2`, {
    token: u.tok,
    body: { key: '2.akey|iv|ct', fileName: 'a.bin', fileSize: 3, adminRequest: false },
  });
  const attId = r.data?.attachmentId;
  const upPath = String(r.data?.url ?? '').replace(/^https?:\/\/[^/]+/, '');
  r = await call('PUT', upPath, { token: u.tok, raw: Buffer.from('XYZ') });
  check('附件上传(PUT) -> 200', r.status === 200, r);
  r = await call('GET', `/api/ciphers/${attCipher}/attachment/${attId}`, { token: u.tok });
  const dlPath = String(r.data?.url ?? '').replace(/^https?:\/\/[^/]+/, '');
  r = await call('GET', dlPath, { token: u.tok });
  check(
    '附件下载不设 content-length（避免声明错误的长度）',
    r.headers?.get?.('content-length') === null,
    r.headers?.get?.('content-length'),
  );
  check('附件下载字节正确', r.rawText === 'XYZ' || r.data === 'XYZ' || String(r.rawText) === 'XYZ', r.rawText);
}

// 35. L-20：轮换 JWT_SECRET 不能弄坏已存的恢复码（seal 密钥持久化在存储里）
{
  const { sealSecret, openSecret } = await import('../src/crypto.js');
  const { MemoryStore } = await import('../src/store.js');

  const store = new MemoryStore();
  const before = { JWT_SECRET: 'rotate-test-secret-BEFORE-0123456789' };
  const after = { JWT_SECRET: 'rotate-test-secret-AFTER-9999999999' };

  const sealed = await sealSecret(before, store, 'RECOVERY-CODE-XYZ');
  const o1 = await openSecret(before, store, sealed);
  check('seal 基本加解密', o1.ok && o1.value === 'RECOVERY-CODE-XYZ', o1);

  const o2 = await openSecret(after, store, sealed);
  check('轮换 JWT_SECRET 后仍能解开（核心）', o2.ok && o2.value === 'RECOVERY-CODE-XYZ', o2);

  const keyFile = (await store.get('sys/sealkey.json'))?.value;
  check('seal 密钥持久化在 sys/sealkey.json（不依赖环境变量）', Boolean(keyFile?.secret), keyFile);

  // 损坏的密文必须 ok:false，不能静默当成"没有恢复码"
  const bogus = sealed.slice(0, -6) + 'AAAAAA';
  const o3 = await openSecret(after, store, bogus);
  check('损坏密文返回 ok:false（不静默吞掉）', o3.ok === false && o3.reason === 'sealed-secret-unreadable', o3);

  // 旧密钥（JWT_SECRET 派生）写的历史数据要能解，并标记 legacy 供调用方迁移
  const { createHash, createCipheriv, randomBytes } = await import('node:crypto');
  const legacyKey = createHash('sha256').update(`warden/v1/field-encryption:${before.JWT_SECRET}`).digest();
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', legacyKey, iv);
  const ctBuf = Buffer.concat([c.update('OLD-CODE-ABC', 'utf8'), c.final()]);
  const legacyBlob = `enc:v1:${Buffer.concat([iv, c.getAuthTag(), ctBuf]).toString('base64url')}`;
  const fresh = new MemoryStore();
  const o4 = await openSecret(before, fresh, legacyBlob);
  check('旧密钥历史数据可解并标记 legacy', o4.ok && o4.value === 'OLD-CODE-ABC' && o4.legacy === true, o4);

  // 历史明文（未封装）原样返回
  const o5 = await openSecret(after, fresh, 'PLAIN-HINT');
  check('历史明文原样返回', o5.ok && o5.value === 'PLAIN-HINT', o5);
}

// 36. N-7：seal 密钥在陈旧读/替换下的收敛与自愈；软上限冷却期必须真的会结束
{
  const { sealSecret, openSecret, getSealKey } = await import('../src/crypto.js');

  // 模拟 Blob 最终一致：stale=true 时读不到刚写的值
  class FakeBackend {
    constructor() { this.m = new Map(); }
    async get(k, stale) { if (stale) return null; return this.m.has(k) ? { value: this.m.get(k) } : null; }
    async put(k, v) { this.m.set(k, v); }
  }
  const mkView = (be) => {
    const ctx = { stale: false };
    return { ctx, async get(k) { return be.get(k, ctx.stale); }, async put(k, v) { return be.put(k, v); } };
  };

  const be = new FakeBackend();
  const viewA = mkView(be);
  viewA.ctx.stale = true;                       // A 一开始全是陈旧读
  const pending = getSealKey(viewA, { JWT_SECRET: 'n7-secret-0123456789abcdefghij' });
  setTimeout(() => { viewA.ctx.stale = false; }, 30);
  const keyA = await pending;
  const keyB = await getSealKey(mkView(be), { JWT_SECRET: 'n7-secret-0123456789abcdefghij' });
  check('N-7 陈旧读下两个实例最终收敛到同一把密钥', Buffer.compare(keyA, keyB) === 0);

  // 写路径必须用存储里当前的密钥（缓存不能让它继续用旧的）
  const be2 = new FakeBackend();
  const cView = mkView(be2);
  const envN7 = { JWT_SECRET: 'n7-secret-0123456789abcdefghij' };
  await getSealKey(cView, envN7);
  be2.m.set('sys/sealkey.json', { secret: 'n7-replaced-key-0123456789abcdef' });
  const blobNew = await sealSecret(envN7, cView, 'AFTER-REPLACE');
  const opened = await openSecret(envN7, mkView(be2), blobNew);
  check('N-7 密钥文件被替换后，新写入的数据别的实例仍能解', opened.ok && opened.value === 'AFTER-REPLACE', opened);

  // 软上限冷却期：到点后会自己结束，不能永久卡住
  const { getStore, keys } = await import('../src/store.js');
  const st = getStore(env);
  const mkU = async (tag) => {
    const addr = `${tag}-${Date.now()}@example.com`;
    await call('POST', '/api/accounts/register', {
      body: {
        email: addr, masterPasswordHash: `${tag}-mph`, userSymmetricKey: '2.k|iv|ct',
        userAsymmetricKeys: { encryptedPrivateKey: '2.p|iv|ct', publicKey: 'pub' }, kdf: 0, kdfIterations: 100000,
      },
    });
    const r2 = await call('POST', '/identity/connect/token', {
      form: {
        grant_type: 'password', username: addr, password: `${tag}-mph`, scope: 'api offline_access',
        client_id: 'web', deviceType: '10', deviceIdentifier: `dev-${tag}`, deviceName: tag,
      },
    });
    return r2.data?.access_token;
  };
  const u2 = await mkU('n7');
  const dstr = new Date(Date.now() + 86400e3).toISOString();
  r = await call('POST', '/api/sends', {
    token: u2,
    body: { type: 0, key: 'k', name: 'cd', text: { text: 'x' }, deletionDate: dstr, password: 'right' },
  });
  const cdAccess = r.data?.accessId;

  // 直接把这 60 次失败写进记录，省掉真实打点
  const idx = (await st.get(keys.sendIndex(cdAccess)))?.value;
  const sendRec = (await st.get(keys.send(idx.userId, idx.id))).value;
  await st.put(keys.send(idx.userId, idx.id), {
    ...sendRec,
    failedAttempts: 60,
    cooldownUntil: Date.now() + 60000,
  });

  r = await call('POST', `/api/sends/access/${cdAccess}`, {
    body: { password: 'wrong' },
    headers: { 'eo-connecting-ip': '10.6.6.6' },
  });
  check('冷却期内错误口令 -> 429', r.status === 429, r);
  check('Retry-After 报的是真实剩余时间（≤60 且 >0）', (() => {
    const v = Number(r.headers?.get?.('retry-after'));
    return v > 0 && v <= 60;
  })(), r.headers?.get?.('retry-after'));

  // 把冷却改成已过期，计数应归零重来（不再永久 429）
  const cur = (await st.get(keys.send(idx.userId, idx.id))).value;
  await st.put(keys.send(idx.userId, idx.id), { ...cur, cooldownUntil: Date.now() - 1000 });
  r = await call('POST', `/api/sends/access/${cdAccess}`, {
    body: { password: 'wrong' },
    headers: { 'eo-connecting-ip': '10.6.6.7' },
  });
  check('冷却过期后恢复普通失败语义（不再永久 429）', r.status === 401, r);

  r = await call('POST', `/api/sends/access/${cdAccess}`, {
    body: { password: 'right' },
    headers: { 'eo-connecting-ip': '10.6.6.8' },
  });
  check('冷却过期后正确口令仍可访问', r.status === 200, r);
}

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.error('failed:', failed.map((f) => f.name).join(', '));
  process.exit(1);
}
