// src/hint.js
// 主密码提示（master password hint）的可选加密存储。
//
// 环境变量 HINT_ENCRYPTION_SECRET：
//   "*"（默认）  -> 不加密，明文存 masterPasswordHint（与 Vaultwarden 行为一致）
//   其它非空字符串 -> 用该字符串作为口令，Argon2id 派生密钥 + AES-256-GCM 加密，
//                     密文存 masterPasswordHintEnc，masterPasswordHint 置空
//
// 注意：Argon2id 是 KDF 不是加密算法，所以这里是「Argon2id 派生密钥 -> AES-256-GCM 加密」。
import { argon2id } from 'hash-wasm';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

export const PLAINTEXT_MARKER = '*';

const ARGON2 = { memorySize: 19456, iterations: 2, parallelism: 1, hashLength: 32 };
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url');

/** 读取并归一化配置 */
export function hintSecret(env) {
  const raw = env?.HINT_ENCRYPTION_SECRET ?? process.env.HINT_ENCRYPTION_SECRET ?? PLAINTEXT_MARKER;
  const s = String(raw);
  return s === '' ? PLAINTEXT_MARKER : s;
}

export function hintEncryptionEnabled(env) {
  return hintSecret(env) !== PLAINTEXT_MARKER;
}

async function deriveKey(secret, salt) {
  return Buffer.from(
    await argon2id({
      password: secret,
      salt,
      parallelism: ARGON2.parallelism,
      iterations: ARGON2.iterations,
      memorySize: ARGON2.memorySize,
      hashLength: ARGON2.hashLength,
      outputType: 'binary',
    }),
  );
}

/** 明文 -> 加密记录（不含明文字段） */
export async function encryptHint(env, plaintext) {
  const secret = hintSecret(env);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(secret, salt);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    kdf: 'argon2id',
    cipher: 'aes-256-gcm',
    salt: b64u(salt),
    iv: b64u(iv),
    tag: b64u(tag),
    ct: b64u(ct),
  };
}

/** 加密记录 -> 明文；解密失败返回 null（不抛，避免把整个 profile 卡死） */
export async function decryptHint(env, rec) {
  try {
    if (!rec || rec.v !== 1) return null;
    const key = await deriveKey(hintSecret(env), unb64u(rec.salt));
    const decipher = createDecipheriv('aes-256-gcm', key, unb64u(rec.iv));
    decipher.setAuthTag(unb64u(rec.tag));
    const pt = Buffer.concat([decipher.update(unb64u(rec.ct)), decipher.final()]);
    return pt.toString('utf8');
  } catch (e) {
    console.warn('[hint] decrypt failed:', e?.message || e);
    return null;
  }
}

/**
 * 从 profile 里读出提示明文。
 * 兼容：加密记录 / 历史字段名 / 空字符串键。
 */
export async function readHintValue(env, profile) {
  if (!profile) return null;
  if (profile.masterPasswordHintEnc) {
    const pt = await decryptHint(env, profile.masterPasswordHintEnc);
    return pt == null ? null : pt;
  }
  for (const k of ['masterPasswordHint', 'masterPasswordHintB64', '']) {
    if (Object.prototype.hasOwnProperty.call(profile, k)) {
      const v = profile[k];
      if (v != null && String(v).trim() !== '') return String(v);
    }
  }
  return null;
}

/** 生成要写回 profile 的两个字段 */
export async function buildHintFields(env, plaintext) {
  const text = plaintext == null ? '' : String(plaintext).trim();
  if (!text) return { masterPasswordHint: null, masterPasswordHintEnc: null };
  if (!hintEncryptionEnabled(env)) {
    return { masterPasswordHint: text, masterPasswordHintEnc: null };
  }
  return { masterPasswordHint: null, masterPasswordHintEnc: await encryptHint(env, text) };
}
