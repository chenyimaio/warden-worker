// src/env-accounts.js
// 账号来自环境变量，而不是注册接口：
//   USEREMAIL1 / USERPASSWORD1
//   USEREMAIL2 / USERPASSWORD2
//   ...
//
// 主密码是**明文**存在环境变量里；服务端用它推导 masterPasswordHash 来校验登录，
// 客户端请求里只有派生值，明文密码永远不会出现在网络请求或响应里。
//
// 注意：Bitwarden 的库密钥（userSymmetricKey / 公私钥）由客户端在注册时生成，
// 服务端无法代替，所以「新账号」仍然是：加两个环境变量 + 在客户端注册一次。
import { pbkdf2Sync, timingSafeEqual } from 'node:crypto';

const DEFAULT_ITERATIONS = 600000;

/** env 和 process.env 合并（EdgeOne 有的变量挂在 process.env 上） */
function mergedEnv(env) {
  return { ...(process.env ?? {}), ...(env ?? {}) };
}

/** 解析所有 USEREMAILn / USERPASSWORDn，按序号排序 */
export function envAccounts(env) {
  const all = mergedEnv(env);
  const out = [];
  const seen = new Set();
  for (const key of Object.keys(all)) {
    const m = /^USEREMAIL(\d+)$/i.exec(key);
    if (!m) continue;
    const email = String(all[key] ?? '').trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    const password = all[`USERPASSWORD${m[1]}`] ?? all[`USERPASSWORD${m[1]}`.toLowerCase()];
    if (!password) continue;
    seen.add(email);
    out.push({ index: Number(m[1]), email, password: String(password) });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** 按邮箱找环境变量账号 */
export function findEnvAccount(env, email) {
  const want = String(email ?? '').trim().toLowerCase();
  if (!want) return null;
  return envAccounts(env).find((a) => a.email === want) ?? null;
}

/** 是否启用了环境变量账号（启用后注册只对名单内的邮箱开放） */
export function hasEnvAccounts(env) {
  return envAccounts(env).length > 0;
}

/** 客户端登录时用的 KDF 参数（环境变量账号统一用 PBKDF2 + 固定迭代次数） */
export function envAccountKdf(env) {
  const n = Number((mergedEnv(env).PASSWORD_ITERATIONS ?? DEFAULT_ITERATIONS) || DEFAULT_ITERATIONS);
  return { kdf: 0, kdfIterations: Number.isFinite(n) && n > 0 ? n : DEFAULT_ITERATIONS };
}

/**
 * 由明文主密码推导出 Bitwarden 的 masterPasswordHash（客户端发过来的就是它）：
 *   masterKey          = PBKDF2-SHA256(password, salt=email(小写), iterations, 32)
 *   masterPasswordHash = PBKDF2-SHA256(masterKey, salt=password, 1, 32)  -> base64
 */
export function deriveMasterPasswordHash(password, email, iterations) {
  const masterKey = pbkdf2Sync(String(password), String(email).trim().toLowerCase(), iterations, 32, 'sha256');
  const hash = pbkdf2Sync(masterKey, String(password), 1, 32, 'sha256');
  return hash.toString('base64');
}

/** 校验客户端提交的 masterPasswordHash 是否匹配环境变量里的明文密码 */
export function verifyEnvAccount(account, providedHash, iterations) {
  if (!account) return false;
  const expected = Buffer.from(deriveMasterPasswordHash(account.password, account.email, iterations), 'utf8');
  const given = Buffer.from(String(providedHash ?? ''), 'utf8');
  return expected.length === given.length && timingSafeEqual(expected, given);
}
