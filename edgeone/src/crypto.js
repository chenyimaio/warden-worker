// src/crypto.js
// 与 warden-worker（Rust）对齐的最小密码学集合：
//  - 服务端对 masterPasswordHash 再做一层 PBKDF2-SHA256（与 Rust crypto.rs 同思路）
//  - 访问/刷新令牌：HS256 JWT，claims 形状对齐 Rust auth::Claims
import { createHash, createHmac, randomBytes, randomUUID, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

export const KDF_PBKDF2 = 0;
export const KDF_ARGON2ID = 1;

export const newId = () => randomUUID();
export const nowIso = () => new Date().toISOString();

/** 邮箱 → 稳定索引键（避免明文邮箱出现在对象 key 里） */
export const emailKey = (email) =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex');

export function randomB64(bytes = 16) {
  return randomBytes(bytes).toString('base64');
}

export function hashPassword(masterPasswordHash, salt, iterations) {
  return pbkdf2Sync(masterPasswordHash, salt, iterations, 32, 'sha256').toString('base64');
}

export function verifyPassword(storedHash, salt, iterations, candidate) {
  const a = Buffer.from(storedHash, 'base64');
  const b = Buffer.from(hashPassword(candidate, salt, iterations), 'base64');
  return a.length === b.length && timingSafeEqual(a, b);
}

// 刷新令牌的签名密钥可以从 JWT_SECRET 派生：用带标签的 HMAC-SHA256 做密钥分离，
// 两个用途拿到的是互不相同的密钥，安全性不低于手工填第二个随机串。
// 显式配置 JWT_REFRESH_SECRET 时以它为准（便于轮换，或从旧部署平滑迁移）。
const REFRESH_SECRET_LABEL = 'warden/v1/refresh-token-signing-key';
const MIN_SECRET_LEN = 32;

function secret(env, name) {
  let v = env?.[name] ?? process.env[name];
  if (!v && name === 'JWT_REFRESH_SECRET') {
    const base = env?.JWT_SECRET ?? process.env.JWT_SECRET;
    if (base) v = createHmac('sha256', base).update(REFRESH_SECRET_LABEL).digest('base64url');
  }
  if (!v) throw new Error(`missing secret: ${name}`);
  // 只判空不够：JWT_SECRET=a 也能部署上线，随后全部令牌可被暴力伪造。
  if (String(v).length < MIN_SECRET_LEN) {
    throw new Error(`secret too short: ${name} needs at least ${MIN_SECRET_LEN} characters`);
  }
  return new TextEncoder().encode(v);
}

const JWT_ALGS = ['HS256'];

/** 对齐 Rust TokenResponse 需要的 claims 子集；ttl 可缩短（下载/上传这类短期票据） */
export async function signAccess(env, claims, ttl = '1h') {
  return await new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret(env, 'JWT_SECRET'));
}

export async function signRefresh(env, payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret(env, 'JWT_REFRESH_SECRET'));
}

export async function verifyAccess(env, token) {
  const { payload } = await jwtVerify(token, secret(env, 'JWT_SECRET'), { algorithms: JWT_ALGS });
  return payload;
}

export async function verifyRefresh(env, token) {
  const { payload } = await jwtVerify(token, secret(env, 'JWT_REFRESH_SECRET'), { algorithms: JWT_ALGS });
  return payload;
}

const REMEMBER_ISS = 'warden-edgeone-remember';

/** 「记住此设备」令牌：绑定 deviceId + 用户，随设备记录一起失效 */
export async function signRemember(env, { sub, uid }) {
  return await new SignJWT({ sub, uid, iss: REMEMBER_ISS })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret(env, 'JWT_REFRESH_SECRET'));
}

export async function verifyRemember(env, token) {
  const res = await jwtVerify(token, secret(env, 'JWT_REFRESH_SECRET'), { algorithms: JWT_ALGS });
  if (res.payload.iss !== REMEMBER_ISS) throw new Error('bad remember issuer');
  return res;
}

// ---------------------------------------------------------------- 附件下载令牌
// 不用 JWT：附件 url 会出现在访问日志/浏览器历史里，用 2 段式 HMAC 短令牌，
// 只授予「这一个附件、10 分钟」，泄露也换不到别的数据。
const ATT_TTL_SEC = 600;

export function makeAttachmentToken(env, { uid, aid, ttl = ATT_TTL_SEC }) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const payload = Buffer.from(`${uid}:${aid}:${exp}`).toString('base64url');
  const sig = createHmac('sha256', secret(env, 'JWT_SECRET')).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAttachmentToken(env, token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expect = createHmac('sha256', secret(env, 'JWT_SECRET')).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expect);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const [uid, aid, expStr] = decoded.split(':');
  if (!uid || !aid || !expStr) return null;
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  return { uid, aid };
}

export const deviceTypeName = (t) =>
  ({ 0: 'Android', 1: 'iOS', 2: 'ChromeExtension', 3: 'FirefoxExtension', 4: 'OperaExtension',
     5: 'EdgeExtension', 6: 'WindowsDesktop', 7: 'MacOsDesktop', 8: 'LinuxDesktop', 9: 'Chrome',
     10: 'Firefox', 11: 'Opera', 12: 'Edge', 13: 'IE', 14: 'UnknownBrowser', 15: 'AndroidAmazon',
     16: 'UWP', 17: 'Safari', 18: 'Vivaldi', 19: 'VivaldiExtension', 20: 'SafariExtension',
     21: 'SDK', 22: 'Server', 23: 'WindowsCLI', 24: 'MacOsCLI', 25: 'LinuxCLI' }[t] || 'SDK');

// ---------------------------------------------------------------- TOTP (RFC 6238)
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input) {
  const clean = String(input).toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) throw new Error('Invalid Base32 input');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

export function generateRecoveryCode() {
  return base32Encode(randomBytes(20));
}

/** 6 位数字 TOTP */
export function totpAt(secretB32, step) {
  const key = base32Decode(secretB32);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', key).update(msg).digest();
  const offset = h[h.length - 1] & 0x0f;
  const bin = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
  return String(bin % 1_000_000).padStart(6, '0');
}

/** 校验并返回命中的 time step；lastUsed 之前的 step 一律拒绝（防重放） */
export function validateTotp(code, secretB32, lastUsed = 0, allowDrift = false) {
  if (!/^\d{6}$/.test(String(code))) throw new Error('Invalid TOTP code format');
  const currentStep = Math.floor(Date.now() / 30000);
  const drift = allowDrift ? 1 : 0;
  for (let off = -drift; off <= drift; off++) {
    const step = currentStep + off;
    if (step <= lastUsed) continue;
    if (totpAt(secretB32, step) === String(code)) return step;
  }
  throw new Error('Invalid TOTP code');
}
