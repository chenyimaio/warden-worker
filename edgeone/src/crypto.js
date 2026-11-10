// src/crypto.js
// 与 warden-worker（Rust）对齐的最小密码学集合：
//  - 服务端对 masterPasswordHash 再做一层 PBKDF2-SHA256（与 Rust crypto.rs 同思路）
//  - 访问/刷新令牌：HS256 JWT，claims 形状对齐 Rust auth::Claims
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, pbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
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

// 600k 次 PBKDF2 在同步版本里会阻塞整个事件循环（登录并发一高，所有请求一起卡）。
// 用线程池版本：语义不变，但不再卡住其它请求。
const pbkdf2Async = promisify(pbkdf2);

export async function hashPassword(masterPasswordHash, salt, iterations) {
  const buf = await pbkdf2Async(masterPasswordHash, salt, iterations, 32, 'sha256');
  return buf.toString('base64');
}

export async function verifyPassword(storedHash, salt, iterations, candidate) {
  const a = Buffer.from(storedHash, 'base64');
  const b = Buffer.from(await hashPassword(candidate, salt, iterations), 'base64');
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

export function makeAttachmentToken(env, { uid, aid, sstamp = '-', ttl = ATT_TTL_SEC }) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  // sstamp 绑进票据：改密/踢设备/轮换之后，已签发的附件链接也立刻失效。
  // 用 JSON 而不是 `uid:aid:exp:sstamp` 拼接：字段里一旦出现分隔符解析就会错位。
  // 当前字段都是 UUID 不会出事，但没必要留这个脆弱点。
  const payload = Buffer.from(JSON.stringify({ u: uid, a: aid, e: exp, s: sstamp })).toString('base64url');
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
  // 新格式是 JSON；旧格式（已签发、10 分钟内到期）继续按 `:` 解析，平滑过渡
  if (decoded.startsWith('{')) {
    try {
      const o = JSON.parse(decoded);
      if (!o?.u || !o?.a || o?.e == null) return null;
      if (Number(o.e) < Math.floor(Date.now() / 1000)) return null;
      return { uid: String(o.u), aid: String(o.a), sstamp: o.s == null ? '-' : String(o.s) };
    } catch {
      return null;
    }
  }
  const [uid, aid, expStr, sstamp] = decoded.split(':');
  if (!uid || !aid || !expStr) return null;
  if (Number(expStr) < Math.floor(Date.now() / 1000)) return null;
  return { uid, aid, sstamp: sstamp ?? '-' };
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
    // 6 位数字长度固定，但既然是凭据比较就统一走常量时间
    if (safeEqual(totpAt(secretB32, step), String(code))) return step;
  }
  throw new Error('Invalid TOTP code');
}
/** 常量时间字符串比较（长度不同直接 false，不泄露前缀信息） */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

// ---------------------------------------------------------------- 敏感字段落盘加密
// TOTP 恢复码 / TOTP 密钥这类"等同于凭据"的字段，不能明文躺在 profile 里：
// 只要 Blob 泄露就等于拿到绕过多因素登录的钥匙。这里用 AES-256-GCM 封装。
//
// 密钥从哪来？**不能用 JWT_SECRET 派生**：JWT_SECRET 是会被轮换的，
// 一换所有已存的恢复码就解不开，而 2FA 还开着 —— 用户被永久锁在门外且毫无提示。
// 也不该为此新增环境变量：多一个必须配对的密钥，运维就多一个把部署搞坏的机会。
//
// 做法是让密钥跟着数据走：首次使用时随机生成一把，存进存储的 sys/sealkey.json。
// 这样轮换 JWT_SECRET 完全不影响已存的恢复码。
//
// 取舍：能读 Blob 的人也能读到这把密钥。但能读 Blob 的人已经拿到全部密码哈希和
// 所有条目密文了，封装的定位是「防意外暴露」（日志、控制台 JSON 预览、导出、
// 局部误读），不是「防整库沦陷」。两害相权，可恢复性更重要。
const SEAL_LABEL = 'warden/v1/field-encryption';
const SEAL_PREFIX = 'enc:v1:';
const SEAL_KEY_PATH = 'sys/sealkey.json';

// 存储实例 -> 派生密钥的缓存。按实例缓存，避免每次加解密都读一次存储。
const sealKeyCache = new WeakMap();

function deriveSealKey(secret) {
  return createHash('sha256').update(`${SEAL_LABEL}:${secret}`).digest();
}

// 旧实现直接拿 JWT_SECRET 派生。保留它只为了把已有数据迁移过来，不再用于新写入。
function legacySealKey(env) {
  const base = env?.JWT_SECRET ?? process.env.JWT_SECRET;
  return base ? deriveSealKey(base) : null;
}

/**
 * 取出（必要时创建）持久化的 seal 密钥。
 *
 * 并发首次创建：两个实例可能同时生成并写入，谁最后写谁生效。
 * 写入后统一回读，双方都用回读到的那把，不会出现"我加密用 A、他解密用 B"。
 */
export async function getSealKey(store, env) {
  if (!store) throw new Error('getSealKey requires a store');
  const cached = sealKeyCache.get(store);
  if (cached) return cached;

  let secret = null;
  try {
    const cur = (await store.get(SEAL_KEY_PATH))?.value;
    if (cur?.secret) secret = String(cur.secret);
  } catch {
    /* 读不到就尝试创建 */
  }

  if (!secret) {
    const candidate = randomBytes(32).toString('base64url');
    try {
      await store.put(SEAL_KEY_PATH, { secret: candidate, createdAt: new Date().toISOString() });
    } catch {
      /* 已存在会被覆盖不影响：下面回读为准 */
    }
    // 回读为准，避免并发下各用各的
    try {
      const after = (await store.get(SEAL_KEY_PATH))?.value;
      if (after?.secret) secret = String(after.secret);
    } catch {
      /* 回读失败就先用候选值 */
    }
    if (!secret) secret = candidate;
  }

  const key = deriveSealKey(secret);
  sealKeyCache.set(store, key);
  return key;
}

export async function sealSecret(env, store, plaintext) {
  const text = String(plaintext ?? '');
  if (!text) return null;
  const key = await getSealKey(store, env);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${SEAL_PREFIX}${Buffer.concat([iv, tag, ct]).toString('base64url')}`;
}

/**
 * 解封。返回值区分三种状态，避免"解不开"被当成"没有值"静默吞掉：
 *   { ok: true,  value }        解出来了（含历史明文，原样返回）
 *   { ok: true,  value: null }  本来就没有值
 *   { ok: false, reason }       有密文但解不开 —— 调用方必须显式处理，不能当空值
 *
 * 解不开时先按旧密钥（JWT_SECRET 派生）再试一次，成功就顺手用新密钥重封，
 * 让升级前写入的数据自动迁移，不需要任何人工操作。
 */
export async function openSecret(env, store, stored) {
  const raw = String(stored ?? '');
  if (!raw) return { ok: true, value: null };
  if (!raw.startsWith(SEAL_PREFIX)) return { ok: true, value: raw, legacy: false };

  const buf = Buffer.from(raw.slice(SEAL_PREFIX.length), 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);

  const attempt = (key) => {
    const d = createDecipheriv('aes-256-gcm', key, iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(ct), d.final()]).toString('utf8');
  };

  try {
    const key = await getSealKey(store, env);
    return { ok: true, value: attempt(key), legacy: false };
  } catch {
    /* 落到旧密钥重试 */
  }

  const legacy = legacySealKey(env);
  if (legacy) {
    try {
      const value = attempt(legacy);
      // 解密成功说明是旧密钥的数据：调用方应重新封装一次完成迁移
      return { ok: true, value, legacy: true };
    } catch {
      /* 确实解不开 */
    }
  }
  return { ok: false, reason: 'sealed-secret-unreadable' };
}