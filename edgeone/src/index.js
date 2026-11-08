// src/index.js
// Bitwarden-compatible backend (EdgeOne Makers / Cloud Functions, Node.js). Behaviour mirrors warden-worker (Rust); route list in README.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHash, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  newId,
  nowIso,
  emailKey,
  randomB64,
  hashPassword,
  verifyPassword,
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
  signRemember,
  verifyRemember,
  deviceTypeName,
  base32Decode,
  totpAt,
  validateTotp,
  generateTotpSecret,
  generateRecoveryCode,
  makeAttachmentToken,
  verifyAttachmentToken,
} from './crypto.js';
import { getStore, keys, mutate } from './store.js';
import { sendPasswordHint, mailConfigured } from './mail.js';
import { readUpload } from './upload.js';

const app = new Hono();
app.use('*', cors());

const envGet = (c, name, dflt) => c.env?.[name] ?? process.env[name] ?? dflt;

// ---------------------------------------------------------------- helpers
async function body(c) {
  const ct = c.req.header('content-type') || '';
  if (ct.includes('application/json')) return (await c.req.json().catch(() => ({}))) ?? {};
  return (await c.req.parseBody().catch(() => ({}))) ?? {};
}

function globToRe(pat) {
  const esc = pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${esc}$`, 'i');
}

function allowedEmail(c, email) {
  const raw = envGet(c, 'ALLOWED_EMAILS', '');
  if (!String(raw).trim()) return false;
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .some((p) => globToRe(p).test(email));
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

async function findUserByEmail(c, email) {
  const store = getStore(c.env);
  const idx = await store.get(keys.email(emailKey(email)));
  if (!idx) return null;
  const p = await store.get(keys.profile(idx.value.userId));
  return p ? { ...p.value } : null;
}

/**
 * ?Blob/lob 
 * ?? *  null ?429 ? */
async function limit(c, kind, id, max, windowSec) {
  const store = getStore(c.env);
  const digest = createHash('sha256').update(`${kind}:${id}`).digest('hex').slice(0, 32);
  const key = keys.rate(`${kind}/${digest}`);
  const now = Date.now();
  const cur = (await store.get(key))?.value;
  const sameWindow = cur && now - cur.start < windowSec * 1000;
  const count = sameWindow ? cur.count : 0;
  if (count >= max) {
    const retry = Math.max(1, Math.ceil((windowSec * 1000 - (now - cur.start)) / 1000));
    return c.json({ error: 'Too many requests. Please try again later.' }, 429, {
      'retry-after': String(retry),
    });
  }
  await store.put(key, { start: sameWindow ? cur.start : now, count: count + 1 });
  return null;
}

// 主密码提示的取值：不同客户端/版本用过的字段名不止一个，
// 个别情况下还会把值塞进空字符串键（历史数据兼容），统一在这里收口。
const HINT_KEYS = ['masterPasswordHint', 'masterPasswordHintB64', ''];
function readHint(p) {
  for (const k of HINT_KEYS) {
    if (p && Object.prototype.hasOwnProperty.call(p, k)) {
      const v = p[k];
      return v == null ? null : String(v);
    }
  }
  return null;
}
const hasHintField = (p) => HINT_KEYS.some((k) => Object.prototype.hasOwnProperty.call(p ?? {}, k));

/** 提示字段：明文存库（邮件通知已移除，不再有密文形态） */
const hintFieldsFrom = (plaintext) => {
  const text = plaintext == null ? '' : String(plaintext).trim();
  return { masterPasswordHint: text || null, masterPasswordHintEnc: null };
};

async function requireAuth(c) {
  const m = (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i);
  if (!m) {
    // 诊断：区分「客户端没带 token」和「token 无效」，日志里按 path 能对上具体请求。
    console.warn('[auth] missing bearer', c.req.method, c.req.path, 'auth-header=' + (c.req.header('authorization') ? 'present-but-unparsable' : 'absent'));
    return { error: c.json({ error: 'unauthorized', reason: 'missing_token' }, 401) };
  }
  try {
    const claims = await verifyAccess(c.env, m[1]);
    //  /  / security-stamp  access token 
    const prof = await getStore(c.env).get(keys.profile(claims.sub));
    if (!prof || prof.value.securityStamp !== claims.sstamp) {
      console.warn('[auth] stamp mismatch', c.req.method, c.req.path, 'sub=' + claims.sub, 'profile=' + Boolean(prof));
      return { error: c.json({ error: 'unauthorized', reason: 'stamp_mismatch' }, 401) };
    }
    return { claims, user: prof.value, token: m[1] };
  } catch (e) {
    console.warn('[auth] token rejected:', c.req.method, c.req.path, e?.code || e?.message || e);
    return { error: c.json({ error: 'unauthorized', reason: 'bad_token' }, 401) };
  }
}

const TYPE_TO_FIELD = {
  1: 'login',
  2: 'secureNote',
  3: 'card',
  4: 'identity',
  5: 'sshKey',
  6: 'bankAccount',
  7: 'driversLicense',
  8: 'passport',
};
const EXTRA_FIELDS = ['fields', 'passwordHistory', 'reprompt', 'key'];

function cipherDataFrom(src) {
  const data = { name: src.name ?? null, notes: src.notes ?? null };
  const field = TYPE_TO_FIELD[src.type];
  if (field && src[field] != null) data[field] = src[field];
  for (const k of EXTRA_FIELDS) if (src[k] != null) data[k] = src[k];
  return data;
}

function cipherToJson(row, attachmentList = null) {
  const d = row.data || {};
  const out = {
    object: 'cipherDetails',
    id: row.id,
    userId: row.userId,
    organizationId: null,
    folderId: row.folderId ?? null,
    type: row.type,
    favorite: Boolean(row.favorite),
    edit: true,
    viewPassword: true,
    permissions: { delete: true, restore: true },
    organizationUseTotp: false,
    collectionIds: [],
    revisionDate: row.updatedAt,
    creationDate: row.createdAt,
    deletedDate: row.deletedAt ?? null,
    archivedDate: row.archivedAt ?? null,
    attachments: attachmentList,
    name: d.name ?? null,
    notes: d.notes ?? null,
    fields: d.fields ?? [],
    passwordHistory: d.passwordHistory ?? [],
    reprompt: d.reprompt ?? 0,
    key: d.key ?? null,
  };
  for (const f of Object.values(TYPE_TO_FIELD)) out[f] = null;
  const field = TYPE_TO_FIELD[row.type];
  if (field) out[field] = d[field] ?? null;
  return out;
}

const folderToJson = (row) => ({
  id: row.id,
  name: row.name,
  revisionDate: row.updatedAt,
  object: 'folder',
});

function profileToJson(u, twoFactorEnabled = false) {
  //  vendor/warden-worker/src/models/sync.rs::Profile
  return {
    name: u.name ?? null,
    avatarColor: u.avatarColor ?? null,
    email: u.email,
    id: u.id,
    securityStamp: u.securityStamp,
    object: 'profile',
    premiumFromOrganization: false,
    culture: 'en-US',
    forcePasswordReset: false,
    emailVerified: true,
    twoFactorEnabled: Boolean(twoFactorEnabled),
    premium: true,
    // 客户端用 maxStorageGb 判断「还能不能传附件」：缺这个字段时安卓端可能直接
    // 隐藏附件入口（或显示存储已满）。Blob 免费版 1 GB，这里就按 1 GB 报。
    maxStorageGb: 1,
    usesKeyConnector: false,
    creationDate: u.createdAt,
    privateKey: u.privateKey,
    key: u.key,
    accountKeys: {
      publicKeyEncryptionKeyPair: {
        wrappedPrivateKey: u.privateKey,
        publicKey: u.publicKey,
        signedPublicKey: null,
        object: 'publicKeyEncryptionKeyPair',
      },
      securityState: null,
      signatureKeyPair: null,
      object: 'privateKeys',
    },
    organizations: [],
    providers: [],
    providerOrganizations: [],
    _status: 0,
  };
}

function tokenResponse({ user, deviceId, accessToken, refreshToken, twoFactorToken }) {
  const hasMasterPassword = Boolean(user.masterPasswordHash);
  return {
    access_token: accessToken,
    expires_in: 3600,
    token_type: 'Bearer',
    refresh_token: refreshToken,
    scope: 'api offline_access',
    Key: user.key,
    PrivateKey: user.privateKey,
    Kdf: user.kdfType,
    KdfIterations: user.kdfIterations,
    KdfMemory: user.kdfMemory ?? null,
    KdfParallelism: user.kdfParallelism ?? null,
    ResetMasterPassword: false,
    ForcePasswordReset: false,
    UserDecryptionOptions: {
      hasMasterPassword,
      ...(hasMasterPassword
        ? {
            masterPasswordUnlock: {
              Kdf: {
                KdfType: user.kdfType,
                Iterations: user.kdfIterations,
                Memory: user.kdfMemory ?? null,
                Parallelism: user.kdfParallelism ?? null,
              },
              MasterKeyEncryptedUserKey: user.key,
              MasterKeyWrappedUserKey: user.key,
              Salt: user.email,
            },
          }
        : {}),
      object: 'userDecryptionOptions',
    },
    AccountKeys: {
      publicKeyEncryptionKeyPair: {
        wrappedPrivateKey: user.privateKey,
        publicKey: user.publicKey,
        Object: 'publicKeyEncryptionKeyPair',
      },
      Object: 'privateKeys',
    },
    ...(twoFactorToken ? { TwoFactorToken: twoFactorToken } : {}),
  };
}

// ---------------------------------------------------------------- meta
app.get('/api/alive', (c) => c.text(nowIso()));
app.get('/api/now', (c) => c.text(nowIso()));
app.get('/api/version', (c) => c.json('2026.6.0'));

app.get('/api/config', (c) => {
  const base = String(envGet(c, 'BASE_URL', new URL(c.req.url).origin)).replace(/\/+$/, '');
  const disableUserRegistration = !String(envGet(c, 'ALLOWED_EMAILS', '')).trim();
  return c.json({
    version: '2026.6.0',
    gitHash: 'edgeone',
    server: { name: 'Warden', url: 'https://github.com/qaz741wsd856/warden-worker' },
    settings: { disableUserRegistration, suppressOnboardingInterstitials: false },
    environment: {
      vault: base,
      api: `${base}/api`,
      identity: `${base}/identity`,
      notifications: `${base}/notifications`,
      sso: '',
      cloudRegion: null,
    },
    push: { pushTechnology: 0, vapidPublicKey: null },
    featureStates: {},
    communication: null,
    object: 'config',
  });
});

// 网页版开关：供前端落地页决定是否跳到 /vault/
app.get('/api/web-status', (c) =>
  c.json({
    enabled: String(envGet(c, 'WEB_VAULT_ENABLED', 'true')).toLowerCase() !== 'false',
    object: 'web-status',
  }),
);

// ---------------------------------------------------------------- accounts
const prelogin = async (c) => {
  const { email } = await body(c);
  const user = email ? await findUserByEmail(c, email) : null;
  const kdf = user?.kdfType ?? 0;
  const iterations = user?.kdfIterations ?? Number(envGet(c, 'PASSWORD_ITERATIONS', 600000));
  return c.json({
    kdf,
    kdfIterations: iterations,
    kdfMemory: user?.kdfMemory ?? null,
    kdfParallelism: user?.kdfParallelism ?? null,
    kdfSettings: { kdfType: kdf, iterations, memory: user?.kdfMemory ?? null, parallelism: user?.kdfParallelism ?? null },
    salt: null,
  });
};

// Upstream exposes both /api/... and /identity/... for these endpoints
for (const p of ['/api/accounts/prelogin', '/identity/accounts/prelogin', '/identity/accounts/prelogin/password']) {
  app.post(p, prelogin);
}

async function register(c) {
  const p = await body(c);
  const email = String(p.email ?? '').trim().toLowerCase();
  const rl = await limit(c, 'register', requestIp(c), 10, 60);
  if (rl) return rl;
  if (!email) return c.json({ error: 'invalid email' }, 400);
  if (!allowedEmail(c, email)) return c.json({ error: 'Not allowed to signup' }, 401);

  const store = getStore(c.env);
  if (await findUserByEmail(c, email)) return c.json({ error: 'email already exists' }, 400);

  const id = newId();
  const now = nowIso();
  const salt = randomB64();
  const iterations = Number(envGet(c, 'PASSWORD_ITERATIONS', 600000));
  const masterPasswordHash = String(p.masterPasswordHash ?? p.masterPasswordHashB64 ?? '');
  if (!masterPasswordHash) return c.json({ error: 'missing masterPasswordHash' }, 400);

  // 真实客户端（Android/iOS/Web）用的是 userSymmetricKey + userAsymmetricKeys，
  // 兼容旧字段名 key / keys，否则会把空串写进 key 字段，客户端解密时直接报
  // "EncString error, Invalid symmetric type, got type 0 with 1 parts"。
  const userSymmetricKey = String(p.userSymmetricKey ?? p.key ?? '');
  if (!userSymmetricKey) return c.json({ error: 'missing userSymmetricKey' }, 400);
  const asym = p.userAsymmetricKeys ?? p.keys ?? {};

  const user = {
    id,
    email,
    name: p.name ?? null,
    emailVerified: false,
    masterPasswordHash: hashPassword(masterPasswordHash, salt, iterations),
    passwordSalt: salt,
    passwordIterations: iterations,
    ...hintFieldsFrom(readHint(p)),
    key: userSymmetricKey,
    privateKey: String(asym.encryptedPrivateKey ?? ''),
    publicKey: String(asym.publicKey ?? ''),
    kdfType: Number(p.kdf ?? 0),
    kdfIterations: Number(p.kdfIterations ?? 600000),
    kdfMemory: p.kdfMemory ?? null,
    kdfParallelism: p.kdfParallelism ?? null,
    securityStamp: newId(),
    avatarColor: null,
    totpRecover: null,
    createdAt: now,
    updatedAt: now,
  };

  await store.put(keys.profile(id), user, { ifNoneMatch: '*' });
  await store.put(keys.email(emailKey(email)), { userId: id }, { ifNoneMatch: '*' });
  return c.json({});
}

app.post('/api/accounts/register', register);
app.post('/api/accounts/register/finish', register);
app.post('/identity/accounts/register', register);
app.post('/identity/accounts/register/finish', register);
app.post('/identity/accounts/register/send-verification-email', (c) => c.json('fixed-token-to-mock'));

// 主密码提示：配了 SMTP_HOST + MAIL_FROM 才真的发信，否则只记一行日志并返回 200。
// 恒定返回 200、且不透露提示内容，避免被用来探测邮箱是否存在。
app.post('/api/accounts/password-hint', async (c) => {
  const { email } = await body(c);
  const rlEmail = email ? await limit(c, 'hint-email', String(email).toLowerCase(), 3, 60) : null;
  if (rlEmail) return rlEmail;
  const rlIp = await limit(c, 'hint-ip', requestIp(c), 10, 60);
  if (rlIp) return rlIp;
  try {
    const user = email ? await findUserByEmail(c, email) : null;
    const hint = (readHint(user) ?? '').trim();
    if (user && hint) {
      const base = String(envGet(c, 'BASE_URL', new URL(c.req.url).origin));
      await sendPasswordHint(c.env, { to: user.email, hint, baseUrl: base });
    }
  } catch (e) {
    console.error('[hint] send failed', e?.message || e);
  }
  return c.json({});
});

// ---------------------------------------------------------------- identity
app.post('/identity/connect/token', async (c) => {
  const p = await body(c);
  const grant = String(p.grant_type ?? '');
  const store = getStore(c.env);

  if (grant === 'password') {
    const email = String(p.username ?? '').trim().toLowerCase();
    const mph = String(p.password ?? '');
    const rlEmail = await limit(c, 'login-email', email, 20, 60);
    if (rlEmail) return rlEmail;
    const rlIp = await limit(c, 'login-ip', requestIp(c), 60, 60);
    if (rlIp) return rlIp;
    const user = await findUserByEmail(c, email);
    if (!user) return c.json({ error: 'invalid_grant' }, 400);

    // login with deviceassword  access code
const authRequestId = String(p.authrequest ?? p.authRequest ?? '');
    if (authRequestId) {
      const ar = (await store.get(keys.authRequest(user.id, authRequestId)))?.value;
      const devId = String(p.device_identifier ?? p.deviceIdentifier ?? '');
      const devType = Number(p.device_type ?? p.deviceType ?? 14);
      if (
        !ar ||
        ar.approved !== 1 ||
        ar.requestIp !== requestIp(c) ||
        Number(ar.deviceType) !== devType ||
        ar.requestDeviceIdentifier !== devId ||
        String(ar.accessCode) !== mph
      ) {
        return c.json({ error: 'Username or access code is incorrect. Try again' }, 400);
      }
    } else if (!mph || !(await checkMasterPassword(c, user, mph))) {
      return c.json({ error: 'invalid_grant' }, 400);
    }

    const deviceId = String(p.device_identifier ?? p.deviceIdentifier ?? newId());
    const deviceType = Number(p.device_type ?? p.deviceType ?? 14);
    const now = nowIso();
// merge instead of overwrite: keep twofactorRemember / pushToken / refreshId
    const device = await mutate(store, keys.device(user.id, deviceId), (cur) => ({
      ...(cur ?? { id: deviceId, userId: user.id, refreshId: newId(), createdAt: now }),
      name: String(p.device_name ?? p.deviceName ?? cur?.name ?? 'device'),
      type: deviceType,
      updatedAt: now,
    }));

    // ---- 2FA OTP(0) / Remember(5) / RecoveryCode(8) ----
    const tf = await getTwoFactor(store, user.id, TFA_AUTHENTICATOR);
    let twoFactorToken;
    if (tf?.enabled) {
      const provider = p.twoFactorProvider != null && p.twoFactorProvider !== ''
        ? Number(p.twoFactorProvider)
        : TFA_AUTHENTICATOR;
      const code = String(p.twoFactorToken ?? '');
      if (!code) return c.json(twoFactorRequired(), 400);

      try {
        if (provider === TFA_AUTHENTICATOR) {
          const step = validateTotp(code, tf.data, tf.lastUsed ?? 0, allowTotpDrift(c));
          await mutate(store, keys.twofactor(user.id, TFA_AUTHENTICATOR), (cur) =>
            cur ? { ...cur, lastUsed: step } : undefined,
          );
        } else if (provider === TFA_REMEMBER) {
          const { payload } = await verifyRemember(c.env, code);
          if (payload.sub !== deviceId || payload.uid !== user.id) throw new Error('remember mismatch');
          const dev = await store.get(keys.device(user.id, deviceId));
          if (!dev || dev.value.twofactorRemember !== code) throw new Error('remember mismatch');
        } else if (provider === TFA_RECOVERY) {
          const stored = String(user.totpRecover ?? '');
          if (!stored || stored.toUpperCase() !== code.trim().toUpperCase()) {
            return c.json({ error: 'Recovery code is incorrect' }, 400);
          }
// recovery code is one-shot: drop 2FA + recover code + remember tokens
          await delTwoFactor(store, user.id, TFA_AUTHENTICATOR);
          await mutate(store, keys.profile(user.id), (cur) =>
            cur ? { ...cur, totpRecover: null, updatedAt: nowIso() } : undefined,
          );
          user.totpRecover = null;
        } else {
          return c.json({ error: 'Invalid two factor provider' }, 400);
        }
      } catch (e) {
        return c.json({ error: 'Two factor token is incorrect' }, 400);
      }

      if (Number(p.twoFactorRemember ?? 0) === 1) {
        twoFactorToken = await signRemember(c.env, { sub: deviceId, uid: user.id });
        await mutate(store, keys.device(user.id, deviceId), (cur) =>
          cur ? { ...cur, twofactorRemember: twoFactorToken } : undefined,
        );
      }
    }

    const claims = {
      sub: user.id,
      sstamp: user.securityStamp,
      premium: true,
      name: user.name ?? 'User',
      email: user.email,
      email_verified: Boolean(user.emailVerified),
      device: deviceId,
      devicetype: deviceTypeName(deviceType),
      client_id: String(p.client_id ?? 'web'),
      scope: ['api', 'offline_access'],
      amr: ['Application'],
    };
    const accessToken = await signAccess(c.env, claims);
    const refreshToken = await signRefresh(c.env, {
      sub: 'password',
      userId: user.id,
      deviceId,
      refreshId: device.refreshId,
      sstamp: user.securityStamp,
    });
    return c.json(tokenResponse({ user, deviceId, accessToken, refreshToken, twoFactorToken }));
  }

  if (grant === 'refresh_token') {
    let payload;
    try {
      payload = await verifyRefresh(c.env, String(p.refresh_token ?? ''));
    } catch {
      return c.json({ error: 'invalid_grant' }, 400);
    }
    const device = await store.get(keys.device(String(payload.userId ?? ''), String(payload.deviceId ?? '')));
    if (!device) return c.json({ error: 'invalid_grant' }, 400);
    const prof = await store.get(keys.profile(device.value.userId));
    if (!prof) return c.json({ error: 'invalid_grant' }, 400);
    const user = prof.value;
    if (payload.refreshId !== device.value.refreshId || payload.sstamp !== user.securityStamp) {
      return c.json({ error: 'invalid_grant' }, 400);
    }
    const accessToken = await signAccess(c.env, {
      sub: user.id,
      sstamp: user.securityStamp,
      premium: true,
      name: user.name ?? 'User',
      email: user.email,
      email_verified: Boolean(user.emailVerified),
      device: device.value.id,
      devicetype: deviceTypeName(device.value.type),
      client_id: String(p.client_id ?? 'web'),
      scope: ['api', 'offline_access'],
      amr: ['Application'],
    });
    return c.json(tokenResponse({ user, accessToken, refreshToken: String(p.refresh_token) }));
  }

// send_access: exchange for a short-lived token scoped to one Send
  if (grant === 'send_access') {
    const accessId = String(p.send_id ?? '');
    const provided = String(p.password_hash_b64 ?? '');
    const store = getStore(c.env);
    const send = await lookupSendByAccessId(store, accessId);
    if (!send) {
      console.warn('[send-access] send not found for accessId', accessId.slice(0, 12) + '…');
      return c.json({ error: 'invalid_grant', send_access_error_type: 'not_found' }, 400);
    }
    const v = validateSendAccess(send);
    if (v.error) {
      console.warn('[send-access] rejected', v.error, JSON.stringify({
        deletionDate: send.deletionDate,
        expirationDate: send.expirationDate ?? null,
        accessCount: send.accessCount ?? 0,
        maxAccessCount: send.maxAccessCount ?? null,
        disabled: Boolean(send.disabled),
      }));
      return c.json({ error: 'invalid_grant', send_access_error_type: 'unavailable' }, 400);
    }
    if (sendHasPassword(send) && !checkSendPassword(send, provided)) {
      console.warn('[send-access] password required/invalid');
      return c.json(
        {
          error: 'invalid_grant',
          send_access_error_type: provided ? 'password_hash_b64_invalid' : 'password_hash_b64_required',
        },
        400,
      );
    }
    await mutate(store, keys.send(send.userId, send.id), (cur) =>
      cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : undefined,
    );
    const accessToken = await signAccess(c.env, {
      sub: 'send-access',
      sid: accessIdFromUuid(send.id),
      scope: ['api.send.access'],
    });
    return c.json({
      access_token: accessToken,
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'api.send.access',
    });
  }

// unsupported grants (client_credentials etc.): see README checklist
return c.json({ error: 'unsupported grant_type' }, 400);
});

// ---------------------------------------------------------------- sync
//  per-request reate/update/soft-delete/restore/archive/move/
// No per-request cache: too many write paths, a stale vault is unacceptable. Parallel Gets keep it fast.
app.get('/api/sync', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const uid = a.claims.sub;
  const store = getStore(c.env);

  const prof = await store.get(keys.profile(uid));
  if (!prof) return c.json({ error: 'not found' }, 404);
  const user = prof.value;

  const [cipherIdx, folderIdx] = await Promise.all([
    store.list(keys.ciphers(uid)),
    store.list(keys.folders(uid)),
  ]);
  const [ciphers, folders] = await Promise.all([
    mapLimit(cipherIdx, 16, async (it) => (await store.get(it.key))?.value).then((xs) => xs.filter(Boolean)),
    mapLimit(folderIdx, 16, async (it) => (await store.get(it.key))?.value).then((xs) => xs.filter(Boolean)),
  ]);

  const attMap = await loadAttachmentsByCipher(store, uid);

  return c.json({
    profile: profileToJson(user),
    folders: folders.map(folderToJson),
    collections: [],
    policies: [],
    ciphers: ciphers.map((row) =>
      cipherToJson(
        row,
        (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env)),
      ),
    ),
    domains: { equivalentDomains: [], globalEquivalentDomains: [], object: 'domains' },
    sends: [],
    userDecryption: {
      masterPasswordUnlock: {
        kdf: {
          kdfType: user.kdfType,
          iterations: user.kdfIterations,
          memory: user.kdfMemory ?? null,
          parallelism: user.kdfParallelism ?? null,
        },
        masterKeyEncryptedUserKey: user.key,
        masterKeyWrappedUserKey: user.key,
        salt: user.email,
      },
    },
    object: 'sync',
  });
});

app.get('/api/accounts/profile', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const prof = await getStore(c.env).get(keys.profile(a.claims.sub));
  if (!prof) return c.json({ error: 'not found' }, 404);
  return c.json(profileToJson(prof.value));
});

async function updateProfile(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const uid = a.claims.sub;
  // 允许单独改主密码提示（传空串/null 表示清除）；不传则保持原值
  const hintFields = hasHintField(p) ? hintFieldsFrom(readHint(p)) : null;
  const next = await mutate(store, keys.profile(uid), (cur) => {
    if (!cur) return undefined;
    return {
      ...cur,
      name: p.name ?? cur.name,
      avatarColor: p.avatarColor ?? cur.avatarColor,
      ...(hintFields ?? {}),
      updatedAt: nowIso(),
    };
  });
  return c.json(profileToJson(next));
}
app.post('/api/accounts/profile', updateProfile);
app.put('/api/accounts/profile', updateProfile);

app.get('/api/accounts/revision-date', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const prof = await getStore(c.env).get(keys.profile(a.claims.sub));
  return c.json(prof ? Date.parse(prof.value.updatedAt) : Date.now());
});

// ---------------------------------------------------------------- folders
app.get('/api/folders', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const idx = await store.list(keys.folders(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  return c.json({
    data: rows.filter(Boolean).map(folderToJson),
    object: 'list',
    continuationToken: null,
  });
});

app.post('/api/folders', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const now = nowIso();
  const row = { id: newId(), userId: a.claims.sub, name: String(p.name ?? ''), createdAt: now, updatedAt: now };
  await getStore(c.env).put(keys.folder(row.userId, row.id), row, { ifNoneMatch: '*' });
  return c.json(folderToJson(row));
});

app.put('/api/folders/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const next = await mutate(store, keys.folder(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, name: String(p.name ?? cur.name), updatedAt: nowIso() } : undefined,
  );
  return c.json(next ? folderToJson(next) : {});
});

app.delete('/api/folders/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  await getStore(c.env).del(keys.folder(a.claims.sub, c.req.param('id')));
  return c.json({});
});

// ---------------------------------------------------------------- ciphers
app.get('/api/ciphers', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const idx = await store.list(keys.ciphers(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  const attMap = await loadAttachmentsByCipher(store, a.claims.sub);
  return c.json({
    data: rows
      .filter(Boolean)
      .map((row) =>
        cipherToJson(
          row,
          (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env)),
        ),
      ),
    object: 'list',
    continuationToken: null,
  });
});

// ------------------------------------------------- bulk / partial / archive
// static paths must be registered before /api/ciphers/:id
async function touchUser(store, uid) {
  await mutate(store, keys.profile(uid), (cur) => (cur ? { ...cur, updatedAt: nowIso() } : undefined));
}

async function bulkMutate(c, fn) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const store = getStore(c.env);
  const now = nowIso();
  for (const id of ids) {
    try {
      await mutate(store, keys.cipher(a.claims.sub, id), (cur) => (cur ? fn(cur, now) : undefined));
    } catch (e) {
      console.warn('[bulk] skip', id, e?.message || e);
    }
  }
  await touchUser(store, a.claims.sub);
  return c.json({});
}

// bulk soft-delete (PUT) vs bulk hard-delete (POST/DELETE), mirrors router.rs
app.put('/api/ciphers/delete', (c) => bulkMutate(c, (cur, now) => ({ ...cur, deletedAt: now, updatedAt: now })));
app.post('/api/ciphers/delete', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const store = getStore(c.env);
  for (const id of ids) await store.del(keys.cipher(a.claims.sub, id));
  await touchUser(store, a.claims.sub);
  return c.json({});
});
app.delete('/api/ciphers', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const store = getStore(c.env);
  for (const id of ids) await store.del(keys.cipher(a.claims.sub, id));
  await touchUser(store, a.claims.sub);
  return c.json({});
});

app.put('/api/ciphers/restore', (c) => bulkMutate(c, (cur, now) => ({ ...cur, deletedAt: null, updatedAt: now })));
app.post('/api/ciphers/import', importCiphers);
app.put('/api/ciphers/archive', (c) => bulkMutate(c, (cur, now) => ({ ...cur, archivedAt: now, updatedAt: now })));
app.put('/api/ciphers/unarchive', (c) => bulkMutate(c, (cur, now) => ({ ...cur, archivedAt: null, updatedAt: now })));

// olderId /null  folder  400
async function moveCiphers(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const folderId = p.folderId ? String(p.folderId) : null;
  if (folderId) {
    const folder = await store.get(keys.folder(a.claims.sub, folderId));
    if (!folder) return c.json({ error: 'Invalid folder: Folder does not exist or belongs to another user' }, 400);
  }
  const ids = Array.isArray(p.ids) ? p.ids.map(String) : [];
  const now = nowIso();
  for (const id of ids) {
    await mutate(store, keys.cipher(a.claims.sub, id), (cur) => (cur ? { ...cur, folderId, updatedAt: now } : undefined));
  }
  await touchUser(store, a.claims.sub);
  return c.json({});
}
app.post('/api/ciphers/move', moveCiphers);
app.put('/api/ciphers/move', moveCiphers);

// purge vault: master password required
app.post('/api/ciphers/purge', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const prof = await store.get(keys.profile(a.claims.sub));
  if (!prof) return c.json({ error: 'not found' }, 404);
  const mph = String(p.masterPasswordHash ?? '');
  if (!mph) return c.json({ error: 'Missing master password hash' }, 400);
  const user = prof.value;
  if (!(await checkMasterPassword(c, user, mph))) {
    return c.json({ error: 'Invalid password' }, 401);
  }
  const [cipherIdx, folderIdx] = await Promise.all([
    store.list(keys.ciphers(a.claims.sub)),
    store.list(keys.folders(a.claims.sub)),
  ]);
  for (const it of [...cipherIdx, ...folderIdx]) await store.del(it.key);
  await touchUser(store, a.claims.sub);
  return c.json({});
});

async function cipherWithAttachments(c, store, uid, row) {
  const attMap = await loadAttachmentsByCipher(store, uid);
  return cipherToJson(
    row,
    (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env)),
  );
}

app.get('/api/ciphers/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const row = (await store.get(keys.cipher(a.claims.sub, c.req.param('id'))))?.value;
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(await cipherWithAttachments(c, store, a.claims.sub, row));
});

async function createCipher(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const src = p.cipher ?? p;
  const now = nowIso();
  const row = {
    id: String(src.id ?? newId()),
    userId: a.claims.sub,
    type: Number(src.type ?? 1),
    data: cipherDataFrom(src),
    favorite: Boolean(src.favorite),
    folderId: src.folderId ?? null,
    deletedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await getStore(c.env).put(keys.cipher(row.userId, row.id), row, { ifNoneMatch: '*' });
  return c.json(cipherToJson(row));
}
app.post('/api/ciphers', createCipher);
app.post('/api/ciphers/create', createCipher);

async function updateCipher(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const src = p.cipher ?? p;
  const store = getStore(c.env);
  const next = await mutate(store, keys.cipher(a.claims.sub, c.req.param('id')), (cur) => {
    if (!cur) return undefined;
// only merge fields the client actually sent, never null out name/notes
    const patch = {};
    if (src.name !== undefined) patch.name = src.name;
    if (src.notes !== undefined) patch.notes = src.notes;
    const field = TYPE_TO_FIELD[Number(src.type ?? cur.type)];
    if (field && src[field] !== undefined) patch[field] = src[field];
    for (const k of EXTRA_FIELDS) if (src[k] !== undefined) patch[k] = src[k];
    return {
      ...cur,
      type: Number(src.type ?? cur.type),
      data: { ...cur.data, ...patch },
      favorite: src.favorite !== undefined ? Boolean(src.favorite) : cur.favorite,
      folderId: src.folderId !== undefined ? src.folderId : cur.folderId,
      updatedAt: nowIso(),
    };
  });
  return c.json(next ? cipherToJson(next) : {});
}
app.put('/api/ciphers/:id', updateCipher);
app.post('/api/ciphers/:id', updateCipher);

app.delete('/api/ciphers/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  await getStore(c.env).del(keys.cipher(a.claims.sub, c.req.param('id')));
  return c.json({});
});

app.put('/api/ciphers/:id/delete', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  await mutate(store, keys.cipher(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, deletedAt: nowIso(), updatedAt: nowIso() } : undefined,
  );
  return c.json({});
});

app.put('/api/ciphers/:id/restore', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  await mutate(store, keys.cipher(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, deletedAt: null, updatedAt: nowIso() } : undefined,
  );
  return c.json({});
});

//  folder/favorite
async function partialCipher(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const folderId = p.folderId === undefined ? undefined : p.folderId || null;
  if (folderId) {
    const folder = await store.get(keys.folder(a.claims.sub, folderId));
    if (!folder) return c.json({ error: 'Invalid folder' }, 400);
  }
  const next = await mutate(store, keys.cipher(a.claims.sub, c.req.param('id')), (cur) => {
    if (!cur) return undefined;
    return {
      ...cur,
      folderId: folderId === undefined ? cur.folderId : folderId,
      favorite: p.favorite === undefined ? cur.favorite : Boolean(p.favorite),
      updatedAt: nowIso(),
    };
  });
  if (!next) return c.json({ error: 'not found' }, 404);
  await touchUser(store, a.claims.sub);
  return c.json(cipherToJson(next));
}
app.put('/api/ciphers/:id/partial', partialCipher);
app.post('/api/ciphers/:id/partial', partialCipher);

app.put('/api/ciphers/:id/archive', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const next = await mutate(store, keys.cipher(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, archivedAt: nowIso(), updatedAt: nowIso() } : undefined,
  );
  return c.json(next ? cipherToJson(next) : {});
});

app.put('/api/ciphers/:id/unarchive', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const next = await mutate(store, keys.cipher(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, archivedAt: null, updatedAt: nowIso() } : undefined,
  );
  return c.json(next ? cipherToJson(next) : {});
});

app.get('/api/ciphers/:id/details', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const row = (await store.get(keys.cipher(a.claims.sub, c.req.param('id'))))?.value;
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(await cipherWithAttachments(c, store, a.claims.sub, row));
});

app.post('/api/folders/:id/delete', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  await getStore(c.env).del(keys.folder(a.claims.sub, c.req.param('id')));
  return c.json({});
});

// ------------------------------------------------------------ 2FA / 
const TFA_AUTHENTICATOR = 0;
const TFA_REMEMBER = 5;
const TFA_RECOVERY = 8;

const allowTotpDrift = (c) => String(envGet(c, 'ALLOW_TOTP_DRIFT', 'true')).toLowerCase() !== 'false';

function twoFactorRequired() {
  return {
    error: 'invalid_grant',
    error_description: 'Two factor required.',
    TwoFactorProviders: [String(TFA_AUTHENTICATOR)],
    TwoFactorProviders2: { [String(TFA_AUTHENTICATOR)]: null },
    MasterPasswordPolicy: { Object: 'masterPasswordPolicy' },
  };
}

const getTwoFactor = async (store, uid, atype) =>
  (await store.get(keys.twofactor(uid, atype)))?.value ?? null;

const putTwoFactor = async (store, uid, atype, data) =>
  store.put(keys.twofactor(uid, atype), { atype, enabled: true, data, lastUsed: 0 });

const delTwoFactor = async (store, uid, atype) => store.del(keys.twofactor(uid, atype));

/**
 * 校验用户提交的 masterPasswordHash（对库里的「二次哈希」再算一遍）。
 * 服务端始终不知道主密码，只见到客户端派生的 mph。
 */
async function checkMasterPassword(c, user, providedHash) {
  if (!user?.masterPasswordHash) return false;
  return verifyPassword(user.masterPasswordHash, user.passwordSalt, user.passwordIterations, providedHash);
}

/**  Rust masterPasswordHashTP  */
async function checkPassword(c, user, p) {
  const mph = String(p.masterPasswordHash ?? '');
  if (!mph) return { error: 'Missing master password hash', status: 400 };
  if (!(await checkMasterPassword(c, user, mph))) {
    return { error: 'Invalid password', status: 401 };
  }
  return { ok: true };
}

async function rotateStamp(store, uid) {
  const stamp = newId();
  await mutate(store, keys.profile(uid), (cur) =>
    cur ? { ...cur, securityStamp: stamp, updatedAt: nowIso() } : undefined,
  );
  return stamp;
}

/** efresh / remember token ?*/
async function revokeDevices(store, uid) {
  const idx = await store.list(keys.devices(uid));
  for (const it of idx) await store.del(it.key);
}

/**  TOTP ?*/
async function clearRecoveryIfNoTwoFactor(store, uid) {
  const tf = await getTwoFactor(store, uid, TFA_AUTHENTICATOR);
  if (tf?.enabled) return;
  await mutate(store, keys.profile(uid), (cur) =>
    cur ? { ...cur, totpRecover: null, updatedAt: nowIso() } : undefined,
  );
}

// ---------------------------------------------------------------- two-factor
app.get('/api/two-factor', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  const data = tf?.enabled ? [{ enabled: true, type: TFA_AUTHENTICATOR, object: 'twoFactorProvider' }] : [];
  return c.json({ data, object: 'list', continuationToken: null });
});

app.post('/api/two-factor/get-authenticator', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const store = getStore(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  return c.json({
    enabled: Boolean(tf?.enabled),
    key: tf?.enabled ? tf.data : generateTotpSecret(),
    object: 'twoFactorAuthenticator',
  });
});

async function activateAuthenticator(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const key = String(p.key ?? '').toUpperCase().replace(/\s+/g, '');
  let decoded;
  try {
    decoded = base32Decode(key);
  } catch {
    return c.json({ error: 'Invalid key' }, 400);
  }
  if (decoded.length !== 20) return c.json({ error: 'Invalid key length' }, 400);

  const store = getStore(c.env);
  const existing = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  let step;
  try {
    step = validateTotp(String(p.token ?? ''), key, existing?.lastUsed ?? 0, allowTotpDrift(c));
  } catch (e) {
    return c.json({ error: 'Invalid TOTP code' }, 400);
  }

  await store.put(keys.twofactor(a.claims.sub, TFA_AUTHENTICATOR), {
    atype: TFA_AUTHENTICATOR,
    enabled: true,
    data: key,
    lastUsed: step,
  });

// generate recovery code on first TOTP activation
if (!a.user.totpRecover) {
    const code = generateRecoveryCode();
    await mutate(store, keys.profile(a.claims.sub), (cur) =>
      cur ? { ...cur, totpRecover: code, updatedAt: nowIso() } : undefined,
    );
  }

  return c.json({ enabled: true, key, object: 'twoFactorAuthenticator' });
}
app.post('/api/two-factor/authenticator', activateAuthenticator);
app.put('/api/two-factor/authenticator', activateAuthenticator);

app.delete('/api/two-factor/authenticator', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? TFA_AUTHENTICATOR) !== TFA_AUTHENTICATOR) {
    return c.json({ error: 'Invalid two factor type' }, 400);
  }
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const store = getStore(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  if (!tf) return c.json({ error: 'TOTP not configured' }, 400);
  if (String(tf.data).toUpperCase() !== String(p.key ?? '').toUpperCase()) {
    return c.json({ error: 'TOTP key does not match recorded value' }, 400);
  }

  await delTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  await clearRecoveryIfNoTwoFactor(store, a.claims.sub);
  return c.json({ enabled: false, type: TFA_AUTHENTICATOR, object: 'twoFactorProvider' });
});

async function disableTwoFactor(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const atype = Number(p.type ?? TFA_AUTHENTICATOR);
  const store = getStore(c.env);
  await delTwoFactor(store, a.claims.sub, atype);
  await clearRecoveryIfNoTwoFactor(store, a.claims.sub);
  return c.json({ enabled: false, type: atype, object: 'twoFactorProvider' });
}
app.post('/api/two-factor/disable', disableTwoFactor);
app.put('/api/two-factor/disable', disableTwoFactor);

app.post('/api/two-factor/get-recover', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);
  return c.json({ code: a.user.totpRecover ?? null, object: 'twoFactorRecover' });
});

// ---------------------------------------------------------------- account ops
app.post('/api/accounts/password', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const newMph = String(p.newMasterPasswordHash ?? '');
  if (!newMph) return c.json({ error: 'Missing newMasterPasswordHash' }, 400);

  const store = getStore(c.env);
  const salt = randomB64();
  const iterations = Number(envGet(c, 'PASSWORD_ITERATIONS', 600000));
  const stamp = newId();
  const hintFields = hasHintField(p) ? hintFieldsFrom(readHint(p)) : null;
  await mutate(store, keys.profile(a.claims.sub), (cur) =>
    cur
      ? {
          ...cur,
          masterPasswordHash: hashPassword(newMph, salt, iterations),
          passwordSalt: salt,
          passwordIterations: iterations,
          key: p.key ?? cur.key,
          ...(hintFields ?? {}),
          securityStamp: stamp,
          updatedAt: nowIso(),
        }
      : undefined,
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});

app.post('/api/accounts/kdf', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const authData = p.authenticationData ?? {};
  const unlockData = p.unlockData ?? {};
  if (String(authData.salt ?? '') !== a.user.email || String(unlockData.salt ?? '') !== a.user.email) {
    return c.json({ error: 'Invalid master password salt' }, 400);
  }
  const kdf = unlockData.kdf ?? {};
  const kdfType = Number(kdf.kdf ?? kdf.kdfType ?? 0);
  const iterations = Number(kdf.kdfIterations ?? kdf.iterations ?? 600000);
  if (![0, 1].includes(kdfType)) return c.json({ error: 'Unsupported KDF type' }, 400);
  if (kdfType === 0 && iterations < 100000) {
    return c.json({ error: 'PBKDF2 iterations must be at least 100000' }, 400);
  }

  const store = getStore(c.env);
  const salt = randomB64();
  const newIterations = Number(envGet(c, 'PASSWORD_ITERATIONS', 600000));
  const newMph = String(authData.masterPasswordAuthenticationHash ?? '');
  if (!newMph) return c.json({ error: 'Missing masterPasswordAuthenticationHash' }, 400);
  const stamp = newId();
  await mutate(store, keys.profile(a.claims.sub), (cur) =>
    cur
      ? {
          ...cur,
          masterPasswordHash: hashPassword(newMph, salt, newIterations),
          passwordSalt: salt,
          passwordIterations: newIterations,
          key: unlockData.masterKeyWrappedUserKey ?? cur.key,
          kdfType,
          kdfIterations: iterations,
          kdfMemory: kdfType === 1 ? Number(kdf.kdfMemory ?? kdf.memory ?? 0) || null : null,
          kdfParallelism: kdfType === 1 ? Number(kdf.kdfParallelism ?? kdf.parallelism ?? 0) || null : null,
          securityStamp: stamp,
          updatedAt: nowIso(),
        }
      : undefined,
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});

app.post('/api/accounts/security-stamp', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const store = getStore(c.env);
  await revokeDevices(store, a.claims.sub);
  await rotateStamp(store, a.claims.sub);
  return c.json({});
});

// ---------------------------------------------------------------- devices
app.get('/api/devices/knowndevice', async (c) => {
  const encoded = c.req.header('x-request-email') || '';
  const id = c.req.header('x-device-identifier') || '';
  if (!encoded || !id) return c.json(false);
  let email = '';
  try {
    email = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  } catch {
    return c.json(false);
  }
  const user = await findUserByEmail(c, email);
  if (!user) return c.json(false);
  const dev = await getStore(c.env).get(keys.device(user.id, id));
  return c.json(Boolean(dev));
});

app.get('/api/devices', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const idx = await store.list(keys.devices(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  return c.json({
    data: rows
      .filter(Boolean)
      .map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        identifier: d.id,
        creationDate: d.createdAt,
        revisionDate: d.updatedAt,
        object: 'device',
      })),
    continuationToken: null,
    object: 'list',
  });
});

// ---------------------------------------------------------------- attachments
const displaySize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = n;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(2)} ${units[unit]}`;
};

/**  cipherId ync ?*/
async function loadAttachmentsByCipher(store, uid) {
  const idx = await store.list(keys.attachments(uid));
  const metaKeys = idx.filter((it) => it.key.endsWith('.json'));
  const metas = await mapLimit(metaKeys, 16, async (it) => (await store.get(it.key))?.value);
  const map = new Map();
  for (const m of metas.filter(Boolean)) {
    if (!map.has(m.cipherId)) map.set(m.cipherId, []);
    map.get(m.cipherId).push(m);
  }
  return map;
}

function attachmentToResponse(meta, base, env) {
  const token = makeAttachmentToken(env, { uid: meta.userId, aid: meta.id });
  const url = `${base}/api/ciphers/${meta.cipherId}/attachment/${meta.id}/download?token=${encodeURIComponent(
    token,
  )}`;
  return {
    id: meta.id,
    url,
    fileName: meta.fileName,
    size: String(meta.fileSize ?? 0),
    sizeName: displaySize(meta.fileSize),
    key: meta.key ?? null,
    object: 'attachment',
  };
}

const baseUrlOf = (c) => String(envGet(c, 'BASE_URL', new URL(c.req.url).origin)).replace(/\/+$/, '');

app.post('/api/ciphers/:id/attachment/v2', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const cipherId = c.req.param('id');
  const cipher = (await store.get(keys.cipher(a.claims.sub, cipherId)))?.value;
  if (!cipher) return c.json({ error: 'not found' }, 404);

  const id = newId();
  const declaredSize = Number(p.fileSize ?? 0) || 0;

  // 大附件走直传（小附件保持函数上传，行为不变）
  if (declaredSize > BLOB_OBJECT_MAX_BYTES) {
    return c.json(
      { error: `Attachment too large: up to ${(BLOB_OBJECT_MAX_BYTES / 1024 / 1024).toFixed(0)} MB`, limit: BLOB_OBJECT_MAX_BYTES },
      413,
    );
  }
  // 附件一律先尝试预签名直传：客户端如果用 url，字节就不经过函数；
  // 如果它仍然 POST 给函数，小文件也能成功（≤ UPLOAD_MAX_BYTES），不会破坏功能。
  const direct = await presignedUploadUrl(c, keys.attachmentData(a.claims.sub, id));

  const meta = {
    id,
    cipherId,
    userId: a.claims.sub,
    fileName: String(p.fileName ?? 'file'),
    fileSize: declaredSize,
    key: p.key ?? null,
    // 探针：记下这次是否给了预签名地址，用来判断客户端会不会真的去用它
    direct: Boolean(direct),
    createdAt: nowIso(),
  };
  await store.put(keys.attachmentMeta(a.claims.sub, id), meta, { ifNoneMatch: '*' });
  console.log('[attachment] create', { id, size: declaredSize, direct: Boolean(direct) });

  // 安卓客户端的 AttachmentJsonResponse.Success 强制要求 fileUploadType 和
  // cipherResponse 两个字段（缺任何一个就抛 MissingFieldException），
  // 而且它会把 cipherResponse 直接渲染出来 —— 所以这里要把刚建的附件一并放进 cipher。
  const metas = (await loadAttachmentsByCipher(store, a.claims.sub)).get(cipherId) ?? [];
  const attachments = metas.map((m) => attachmentToResponse(m, baseUrlOf(c), c.env));
  const touched = await mutate(store, keys.cipher(a.claims.sub, cipherId), (cur) =>
    cur ? { ...cur, updatedAt: nowIso() } : undefined,
  );

  return c.json({
    attachmentId: id,
    url: direct ?? `${baseUrlOf(c)}/api/ciphers/${cipherId}/attachment/${id}/data`,
    // 0 = Azure 语义（客户端 PUT 到 url）；1 = Direct（客户端 POST 到 url）
    fileUploadType: direct ? 0 : 1,
    cipherResponse: cipherToJson(touched ?? cipher, attachments),
  });
});

// multipart2 /
// readUpload 已移到 ./upload.js（手工 multipart 解析，见该文件顶部说明）

// ---- 直传（预签名 URL）----
// 默认就走直传：创建附件/文件 Send 时返回 Blob 的预签名 PUT 地址，
// 客户端把字节直接传上去，不经过函数 —— 因此不受平台「单次请求体约 6MB」限制。
// 只受 Blob 单对象上限约束（25 MiB，硬编码，不需要环境变量）。
const BLOB_OBJECT_MAX_BYTES = 25 * 1024 * 1024;

/** 生成预签名直传 URL；SDK 不支持 / 出错时返回 null（调用方回退到函数内上传） */
async function presignedUploadUrl(c, key) {
  try {
    const url = await getStore(c.env).createUploadUrl(key, { expireSeconds: 3600 });
    return url || null;
  } catch (e) {
    console.warn('[upload] presigned url failed, falling back to function upload:', e?.message || e);
    return null;
  }
}

async function uploadAttachmentBytes(c) {
  // 和文件 Send 一样：EdgeOne 单次请求体上限约 6MB，超了平台会直接 500。
  // UPLOAD_MAX_BYTES 同时管附件和文件 Send。
  const platformMax = Number(envGet(c, 'UPLOAD_MAX_BYTES', 6 * 1024 * 1024)) || 0;
  const declared = Number(c.req.header('content-length') || 0);
  if (platformMax && declared > platformMax) {
    return c.json(
      { error: `Attachment too large: up to ${(platformMax / 1024 / 1024).toFixed(1)} MB (platform request body limit)`, limit: platformMax },
      413,
    );
  }

  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const { id: cipherId, aid } = c.req.param();
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, aid)))?.value;
  if (!meta || meta.cipherId !== cipherId) return c.json({ error: 'not found' }, 404);

  if (meta.direct) {
    console.warn('[attachment] client ignored the presigned url and uploaded through the function', {
      aid,
      size: c.req.header('content-length') ?? null,
      contentType: (c.req.header('content-type') ?? '').slice(0, 60) || null,
    });
  }
  // 字节已经在了（客户端先直传成功、又补发了一次确认请求）：直接当成功返回，
  // 免得重复上传把请求体撑爆。
  const existing = await store.getBinary(keys.attachmentData(a.claims.sub, aid)).catch(() => null);
  if (existing) return c.json({});

  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const bytes = up.bytes;
  if (platformMax && bytes.length > platformMax) return c.json({ error: 'Attachment too large', limit: platformMax }, 413);

  await store.putBinary(keys.attachmentData(a.claims.sub, aid), bytes);
  await mutate(store, keys.attachmentMeta(a.claims.sub, aid), (cur) =>
    cur ? { ...cur, fileSize: bytes.length, updatedAt: nowIso() } : undefined,
  );
  await mutate(store, keys.cipher(a.claims.sub, cipherId), (cur) =>
    cur ? { ...cur, updatedAt: nowIso() } : undefined,
  );
  await touchUser(store, a.claims.sub);
  return c.json({});
}
app.put('/api/ciphers/:id/attachment/:aid/data', uploadAttachmentBytes);
app.put('/api/ciphers/:id/attachment/:aid/azure-upload', uploadAttachmentBytes);
app.post('/api/ciphers/:id/attachment/:aid', uploadAttachmentBytes);

app.get('/api/ciphers/:id/attachment/:aid', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, c.req.param('aid'))))?.value;
  if (!meta || meta.cipherId !== c.req.param('id')) return c.json({ error: 'not found' }, 404);
  return c.json(attachmentToResponse(meta, baseUrlOf(c), c.env));
});

app.get('/api/ciphers/:id/attachment/:aid/download', async (c) => {
  const rl = await limit(c, 'att-download', requestIp(c), 120, 60);
  if (rl) return rl;

  const raw = c.req.query('token') || (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i)?.[1];
  const token = String(raw ?? '');
  if (!token) return c.json({ error: 'unauthorized' }, 401);

// 2-segment token = attachment-scoped; 3-segment = user access token
let uid;
  let aid;
  if (token.split('.').length === 2) {
    const att = verifyAttachmentToken(c.env, token);
    if (!att) return c.json({ error: 'invalid attachment token' }, 401);
    uid = att.uid;
    aid = att.aid;
  } else {
    try {
      const claims = await verifyAccess(c.env, token);
      uid = claims.sub;
      aid = c.req.param('aid');
    } catch {
      return c.json({ error: 'unauthorized' }, 401);
    }
  }

  const store = getStore(c.env);
  const meta = (await store.get(keys.attachmentMeta(uid, aid)))?.value;
  if (!meta || meta.cipherId !== c.req.param('id')) return c.json({ error: 'not found' }, 404);

  const bytes = await store.getBinary(keys.attachmentData(uid, meta.id));
  if (!bytes) return c.json({ error: 'not found' }, 404);
  return c.body(bytes, 200, {
    'content-type': 'application/octet-stream',
    'content-length': String(bytes.length),
    'content-disposition': `attachment; filename="${encodeURIComponent(meta.fileName)}"`,
    'cache-control': 'no-store',
  });
});

async function deleteAttachment(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const { id: cipherId, aid } = c.req.param();
  const meta = (await store.get(keys.attachmentMeta(a.claims.sub, aid)))?.value;
  if (!meta || meta.cipherId !== cipherId) return c.json({ error: 'not found' }, 404);

  await store.del(keys.attachmentMeta(a.claims.sub, aid));
  await store.del(keys.attachmentData(a.claims.sub, aid));
  await mutate(store, keys.cipher(a.claims.sub, cipherId), (cur) =>
    cur ? { ...cur, updatedAt: nowIso() } : undefined,
  );
  await touchUser(store, a.claims.sub);
  return c.json({ id: aid, cipherId, object: 'attachment' });
}
app.delete('/api/ciphers/:id/attachment/:aid', deleteAttachment);
app.post('/api/ciphers/:id/attachment/:aid/delete', deleteAttachment);

// ---------------------------------------------------------------- sends
const SEND_TEXT = 0;
const SEND_FILE = 1;
const SEND_PASSWORD_ITER = 100000;

const accessIdFromUuid = (id) => Buffer.from(String(id).replace(/-/g, ''), 'hex').toString('base64url');

function pbkdf2B64url(value, saltB64, iterations) {
  return pbkdf2Sync(String(value), Buffer.from(saltB64, 'base64url'), iterations, 32, 'sha256').toString(
    'base64url',
  );
}

function sendPasswordHash(password) {
  if (!password) return { passwordHash: null, passwordSalt: null, passwordIter: null };
  const salt = randomBytes(16).toString('base64url');
  return {
    passwordHash: pbkdf2B64url(password, salt, SEND_PASSWORD_ITER),
    passwordSalt: salt,
    passwordIter: SEND_PASSWORD_ITER,
  };
}

function sendHasPassword(s) {
  return Boolean(s.passwordHash);
}

function checkSendPassword(s, candidate) {
  if (!sendHasPassword(s)) return true;
  if (!candidate) return false;
  const computed = pbkdf2B64url(candidate, s.passwordSalt, s.passwordIter ?? SEND_PASSWORD_ITER);
  const a = Buffer.from(computed);
  const b = Buffer.from(String(s.passwordHash));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**  Rust SendDB::validate_access */
function validateSendAccess(s, nowIsoStr = nowIso()) {
  if (s.disabled) return { error: 'Send is not accessible', status: 404 };
  if (String(s.deletionDate) <= nowIsoStr) return { error: 'Send is not accessible', status: 404 };
  if (s.expirationDate && String(s.expirationDate) <= nowIsoStr) {
    return { error: 'Send is not accessible', status: 404 };
  }
  if (s.maxAccessCount != null && Number(s.accessCount ?? 0) >= Number(s.maxAccessCount)) {
    return { error: 'Send is not accessible', status: 404 };
  }
  return { ok: true };
}

function sendToJson(s) {
  const isText = Number(s.type) === SEND_TEXT;
  return {
    id: s.id,
    accessId: accessIdFromUuid(s.id),
    type: Number(s.type),
    name: s.name,
    notes: s.notes ?? null,
    text: isText ? s.data : null,
    file: isText ? null : s.data,
    key: s.akey,
    maxAccessCount: s.maxAccessCount ?? null,
    accessCount: Number(s.accessCount ?? 0),
    revisionDate: s.updatedAt,
    expirationDate: s.expirationDate ?? null,
    deletionDate: s.deletionDate,
    disabled: Boolean(s.disabled),
    hideEmail: Boolean(s.hideEmail),
    password: s.passwordHash ?? null,
    authType: sendHasPassword(s) ? 1 : 0,
    object: 'send',
  };
}

function sendAccessJson(s) {
  const isText = Number(s.type) === SEND_TEXT;
  return {
    id: s.id,
    type: Number(s.type),
    name: s.name,
    text: isText ? s.data : null,
    file: isText ? null : s.data,
    expirationDate: s.expirationDate ?? null,
    creatorIdentifier: null,
    object: 'send-access',
  };
}

function validateSendDates(deletionDate, expirationDate) {
  const del = Date.parse(String(deletionDate ?? ''));
  if (!Number.isFinite(del)) return { error: 'Invalid deletion date format', status: 400 };
  const now = Date.now();
  if (del <= now) return { error: 'Deletion date must be in the future', status: 400 };
  if (del > now + 31 * 86400_000) return { error: 'Deletion date exceeds maximum', status: 400 };
  let exp = null;
  if (expirationDate) {
    const e = Date.parse(String(expirationDate));
    if (!Number.isFinite(e)) return { error: 'Invalid expiration date format', status: 400 };
    if (e > del) return { error: 'Expiration date must be before deletion date', status: 400 };
    exp = new Date(e).toISOString();
  }
  return { deletionDate: new Date(del).toISOString(), expirationDate: exp };
}

app.get('/api/sends', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const idx = await store.list(keys.sends(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  return c.json({
    data: rows.filter(Boolean).map(sendToJson),
    object: 'list',
    continuationToken: null,
  });
});

app.get('/api/sends/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const row = (await getStore(c.env).get(keys.send(a.claims.sub, c.req.param('id'))))?.value;
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(sendToJson(row));
});

async function createTextSend(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? 0) !== SEND_TEXT) return c.json({ error: 'Use /api/sends/file/v2 for file sends' }, 400);

  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);

  const now = nowIso();
  const id = String(p.id ?? newId());
  const send = {
    id,
    userId: a.claims.sub,
    type: SEND_TEXT,
    name: String(p.name ?? ''),
    notes: p.notes ?? null,
    data: p.text ?? null,
    akey: String(p.key ?? ''),
    maxAccessCount: p.maxAccessCount != null ? Number(p.maxAccessCount) : null,
    accessCount: 0,
    createdAt: now,
    updatedAt: now,
    expirationDate: dates.expirationDate,
    deletionDate: dates.deletionDate,
    disabled: Boolean(p.disabled),
    hideEmail: Boolean(p.hideEmail),
    ...sendPasswordHash(p.password),
  };

  const store = getStore(c.env);
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: '*' });
  await store.put(keys.sendIndex(accessIdFromUuid(id)), { userId: a.claims.sub, id });
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(send));
}
app.post('/api/sends', createTextSend);

app.put('/api/sends/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);

  const next = await mutate(store, keys.send(a.claims.sub, c.req.param('id')), (cur) => {
    if (!cur) return undefined;
    const nextPw = p.password !== undefined ? sendPasswordHash(p.password) : {};
    return {
      ...cur,
      name: p.name !== undefined ? String(p.name) : cur.name,
      notes: p.notes !== undefined ? p.notes : cur.notes,
      data: p.text !== undefined ? p.text : cur.data,
      akey: p.key !== undefined ? String(p.key) : cur.akey,
      maxAccessCount: p.maxAccessCount !== undefined ? Number(p.maxAccessCount) : cur.maxAccessCount,
      expirationDate: dates.expirationDate,
      deletionDate: dates.deletionDate,
      disabled: p.disabled !== undefined ? Boolean(p.disabled) : cur.disabled,
      hideEmail: p.hideEmail !== undefined ? Boolean(p.hideEmail) : cur.hideEmail,
      updatedAt: nowIso(),
      ...nextPw,
    };
  });
  if (!next) return c.json({ error: 'not found' }, 404);
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(next));
});

app.delete('/api/sends/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const id = c.req.param('id');
  await store.del(keys.send(a.claims.sub, id));
  await store.del(keys.sendIndex(accessIdFromUuid(id)));
  await touchUser(store, a.claims.sub);
  return c.json({});
});

app.put('/api/sends/:id/remove-password', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const next = await mutate(store, keys.send(a.claims.sub, c.req.param('id')), (cur) =>
    cur
      ? { ...cur, passwordHash: null, passwordSalt: null, passwordIter: null, updatedAt: nowIso() }
      : undefined,
  );
  if (!next) return c.json({ error: 'not found' }, 404);
  return c.json(sendToJson(next));
});

// resolve a Send from its accessId (anonymous access has no session)
async function lookupSendByAccessId(store, idOrAccessId) {
// try the index key first, then treat the id as an accessId (older clients)
let hit = (await store.get(keys.sendIndex(idOrAccessId)))?.value;
  if (!hit) {
    const asAccess = accessIdFromUuid(idOrAccessId);
    hit = (await store.get(keys.sendIndex(asAccess)))?.value;
  }
  if (!hit) return null;
  return (await store.get(keys.send(hit.userId, hit.id)))?.value ?? null;
}

app.post('/api/sends/access/:accessId', async (c) => {
  const rl = await limit(c, 'send-access', requestIp(c), 30, 60);
  if (rl) return rl;
  const store = getStore(c.env);
  const send = await lookupSendByAccessId(store, c.req.param('accessId'));
  console.log('[send-access] lookup', {
    accessId: c.req.param('accessId'),
    found: Boolean(send),
    type: send?.type ?? null,
    sendId: send?.id ?? null,
    declaredSize: send?.data?.size ?? null,
  });
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);

  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);

  const p = await body(c);
  const password = p.password ?? p.passwordHash ?? null;
  if (sendHasPassword(send) && !checkSendPassword(send, password)) {
    return c.json({ error: password ? 'Invalid password' : 'Password required' }, 401);
  }

  await mutate(store, keys.send(send.userId, send.id), (cur) =>
    cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : undefined,
  );
  return c.json(sendAccessJson(send));
});

app.post('/api/sends/access', async (c) => {
// token-based Send access: token in body or Authorization
  const p = await body(c);
  const auth = (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : '');
  let payload;
  try {
    payload = await verifyAccess(c.env, token);
  } catch (e) {
    console.warn('[send-access] token rejected', e?.code || e?.message || e, 'hasToken=' + Boolean(token));
    return c.json({ error: 'invalid access token' }, 401);
  }
  if (!Array.isArray(payload.scope) || !payload.scope.includes('api.send.access') || payload.sid == null) {
    console.warn('[send-access] token scope/sid wrong', JSON.stringify({ scope: payload.scope, sid: payload.sid }));
    return c.json({ error: 'invalid access token' }, 401);
  }
  const store = getStore(c.env);
  const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
  if (!idx) {
    console.warn('[send-access] index miss for sid', String(payload.sid).slice(0, 12) + '…');
    return c.json({ error: 'Send is not accessible' }, 404);
  }
  const send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  if (!send) {
    console.warn('[send-access] send row missing', idx.id);
    return c.json({ error: 'Send is not accessible' }, 404);
  }
  const v = validateSendAccess(send);
  if (v.error) {
    console.warn('[send-access] unavailable at read', v.error, JSON.stringify({
      deletionDate: send.deletionDate,
      expirationDate: send.expirationDate ?? null,
      accessCount: send.accessCount ?? 0,
      maxAccessCount: send.maxAccessCount ?? null,
    }));
    return c.json({ error: v.error }, v.status);
  }
  return c.json(sendAccessJson(send));
});

// file Send: metadata -> binary -> anonymous download
// NOTE: /api/sends/access/file/:fileId must be registered before
// /api/sends/:id/file/:fileId, otherwise "access" is taken as a sendId.
app.post('/api/sends/access/file/:fileId', async (c) => {
  const store = getStore(c.env);
  const p = await body(c);
  const auth = (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : '');

  // 网页版会带 send-access token 请求 /sends/access/file/{file.id}。
  // 新数据里 file.id 就是 Send 的 id，能直接反查；老数据写死成 'file'，所以
  // 优先用 token 里的 sid 定位，再退回按 fileId 反查。
  let send = null;
  if (token) {
    try {
      const payload = await verifyAccess(c.env, token);
      if (payload?.sid != null) {
        const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
        if (idx) send = (await store.get(keys.send(idx.userId, idx.id)))?.value ?? null;
      }
    } catch (e) {
      console.warn('[send-access] file token rejected', e?.code || e?.message || e);
    }
  }
  if (!send) send = await lookupSendByAccessId(store, c.req.param('fileId'));
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) {
    // 典型场景：创建 Send 成功，但客户端上传那一步失败（平台 500 / 直传 URL 用错），
    // 于是记录在、字节不在。网页版会显示「找不到与此 Send 关联的文件」。
    // 顺手把这个用户的 sends 前缀列出来，确认对象是「没写进去」还是「写到了别的 key」。
    const siblings = await store
      .list(`u/${send.userId}/sends/`)
      .then((rows) => rows.map((r) => r.key))
      .catch(() => []);
    console.warn('[send-access] file bytes missing', {
      sendId: send.id,
      expectKey: keys.sendFile(send.userId, send.id),
      declaredSize: send.data?.size ?? null,
      createdAt: send.createdAt ?? null,
      siblings,
    });
    return c.json({ error: 'file not found', reason: 'upload_incomplete' }, 404);
  }

  // 网页版（Vaultwarden 2026.x）拿到的是 JSON，然后自己 fetch(url)：
  //   const t = await sendApiService.getSendFileDownloadData(send, token);
  //   if (isNullOrWhitespace(t.url)) { toast("missingSendFile"); return; }
  //   const n = await fetch(new Request(t.url, { cache: "no-store" }));
  // 所以这里必须返回带 url 的 JSON，而不是字节流。url 里带一个短期令牌，
  // 因为网页版那次 fetch 不会再带 Authorization。
  const downloadToken = await signAccess(c.env, {
    sub: 'send-access',
    sid: accessIdFromUuid(send.id),
    scope: ['api.send.access'],
  });
  const fileId = c.req.param('fileId');
  return c.json({
    id: fileId,
    url: `${baseUrlOf(c)}/api/sends/access/file/${fileId}/data?token=${encodeURIComponent(downloadToken)}`,
    object: 'send-file-download-data',
  });
});

// 真正吐字节的地方：网页版用上一步返回的 url 直接 fetch（不带 header），
// 所以这里用查询串里的短期令牌鉴权。
app.get('/api/sends/access/file/:fileId/data', async (c) => {
  const token = String(c.req.query('token') ?? '');
  let payload;
  try {
    payload = await verifyAccess(c.env, token);
  } catch (e) {
    console.warn('[send-access] download token rejected', e?.code || e?.message || e);
    return c.json({ error: 'invalid access token' }, 401);
  }
  if (!Array.isArray(payload.scope) || !payload.scope.includes('api.send.access') || payload.sid == null) {
    return c.json({ error: 'invalid access token' }, 401);
  }
  const store = getStore(c.env);
  const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
  if (!idx) return c.json({ error: 'Send is not accessible' }, 404);
  const send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) return c.json({ error: 'file not found' }, 404);
  return c.body(bytes, 200, {
    'content-type': 'application/octet-stream',
    'content-length': String(bytes.length),
    'cache-control': 'no-store',
  });
});

app.post('/api/sends/file/v2', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? 1) !== SEND_FILE) return c.json({ error: 'invalid send type' }, 400);

  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);

  const now = nowIso();
  const id = String(p.id ?? newId());
  const fileName = String(p.file?.fileName ?? p.fileName ?? 'file');
  const size = Number(p.fileLength ?? p.file?.size ?? 0) || 0;
  const send = {
    id,
    userId: a.claims.sub,
    type: SEND_FILE,
    name: String(p.name ?? ''),
    notes: p.notes ?? null,
    // 文件 id 直接用 Send 的 id：网页版拼 /sends/access/file/{file.id} 时，
    // 服务端才能通过 accessId 索引反查到这条 Send（之前写死 'file' 会 404）。
    data: { id, fileName, size: String(size), sizeName: displaySize(size) },
    akey: String(p.key ?? ''),
    maxAccessCount: p.maxAccessCount != null ? Number(p.maxAccessCount) : null,
    accessCount: 0,
    createdAt: now,
    updatedAt: now,
    expirationDate: dates.expirationDate,
    deletionDate: dates.deletionDate,
    disabled: Boolean(p.disabled),
    hideEmail: Boolean(p.hideEmail),
    ...sendPasswordHash(p.password),
  };

  const store = getStore(c.env);
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: '*' });
  await store.put(keys.sendIndex(accessIdFromUuid(id)), { userId: a.claims.sub, id });
  await touchUser(store, a.claims.sub);

  // 文件 Send 只能走函数上传：实测 Android 客户端无论 fileUploadType 是 0 还是 1，
  // 都会把字节 POST 到 /api/sends/{id}/file/{id}（忽略我们给的预签名地址），
  // 所以上限就是平台请求体上限。超过时给明确的 413，而不是让平台返回
  // RequestTooLarge（客户端只会显示一句没头没脑的 400/500）。
  const functionMax = Number(envGet(c, 'UPLOAD_MAX_BYTES', 6 * 1024 * 1024)) || 0;
  if (functionMax && size > functionMax) {
    console.warn('[send] create rejected, too large', { id, size, functionMax });
    return c.json(
      {
        error: `File too large: this deployment accepts uploads up to ${(functionMax / 1024 / 1024).toFixed(1)} MB (platform request body limit)`,
        limit: functionMax,
      },
      413,
    );
  }
  console.log('[send] create -> function url', { id, size, functionMax });

  // 回退：客户端 PUT 到本函数（受平台 ~6MB 请求体限制）
  const uploadToken = await signAccess(c.env, {
    sub: 'send-upload',
    sid: accessIdFromUuid(id),
    scope: ['api.send.upload'],
  });

  return c.json({
    sendResponse: sendToJson(send),
    // 1 = Direct：客户端会把加密后的字节 POST/PUT 到下面的 url（multipart 或裸字节）。
    fileUploadType: 1,
    url: `${baseUrlOf(c)}/api/sends/${id}/file/${id}?token=${encodeURIComponent(uploadToken)}`,
  });
});

// 文件字节上传：兼容 Direct（multipart）与 Azure 风格（PUT 裸字节）。
//
// 鉴权两条路：
//   1) 普通客户端：Authorization: Bearer <access token>
//   2) 直传客户端（Android 2026.8 走的是 Azure 风格直传）：不带 header，
//      靠创建文件 Send 时返回的预签名 url 里的 token 授权（绑定该 Send、限时）。
async function uploadSendFile(c) {
  const store = getStore(c.env);
  const id = c.req.param('id');

  // 诊断：只有走到这里才说明客户端把字节发给了函数（而不是预签名直传）。
  // 大文件在这里之前就会被平台按请求体上限拦成 500，所以这行日志是判断
  // 「客户端到底用了哪个 url」的关键证据。
  console.log('[send-upload] hit function', {
    id,
    contentLength: c.req.header('content-length') ?? null,
    contentType: (c.req.header('content-type') ?? '').slice(0, 60) || null,
    auth: c.req.header('authorization') ? 'present' : 'absent',
    token: new URL(c.req.url).search ? 'yes' : 'no',
  });

  // EdgeOne 对单次请求体有硬上限（实测 6MB 可以、7MB 直接被平台拦成 500
  // INTERNAL_CLOUD_FUNCTION_INVOCATION_FAILED）。提前用 Content-Length 拦掉，
  // 给客户端一个明确的 413，而不是让它看到 500。
  const maxBytes = Number(envGet(c, 'UPLOAD_MAX_BYTES', 6 * 1024 * 1024)) || 0;
  const declared = Number(c.req.header('content-length') || 0);
  if (maxBytes && declared > maxBytes) {
    console.warn('[send-upload] rejected by content-length', declared);
    return c.json(
      {
        error: `File too large: this deployment accepts uploads up to ${(maxBytes / 1024 / 1024).toFixed(1)} MB (platform request body limit)`,
        limit: maxBytes,
      },
      413,
    );
  }

  // 鉴权两条路：
  //   1) 普通客户端：Authorization: Bearer <access token>
  //   2) 直传客户端（Android 的 Azure 风格）：不带 header，靠创建时返回的
  //      预签名 url 里的 token 授权（绑定这个 Send、限时）。
  const a = await requireAuth(c);
  let userId = a.error ? null : a.claims.sub;

  if (!userId) {
    const signed = String(c.req.query('token') ?? '');
    if (signed) {
      try {
        const payload = await verifyAccess(c.env, signed);
        const expectSid = accessIdFromUuid(id);
        if (
          Array.isArray(payload.scope) &&
          payload.scope.includes('api.send.upload') &&
          String(payload.sid) === expectSid
        ) {
          const idx = (await store.get(keys.sendIndex(expectSid)))?.value;
          if (idx) userId = idx.userId;
        }
      } catch {
        /* 落到下面的 401 */
      }
    }
  }
  if (!userId) return a.error;

  const send = (await store.get(keys.send(userId, id)))?.value;
  if (!send || Number(send.type) !== SEND_FILE) return c.json({ error: 'not found' }, 404);

  let up;
  try {
    up = await readUpload(c);
  } catch (e) {
    // 平台重放/重试同一个 Request 时，body 可能已被读过（"Body is unusable: Body has
    // already been read"）。如果字节其实已经存好了，就当成功返回，否则客户端会误判失败
    // 并删掉这个 Send。
    const existing = await store.getBinary(keys.sendFile(userId, id)).catch(() => null);
    if (existing) return c.json(sendToJson(send), 200);
    console.error('[send-upload] read body failed', e?.message || e);
    return c.json({ error: 'failed to read upload body' }, 400);
  }
  if (up.error) {
    const existing = await store.getBinary(keys.sendFile(userId, id)).catch(() => null);
    if (existing) return c.json(sendToJson(send), 200);
    return c.json({ error: up.error }, 400);
  }
  const bytes = up.bytes;
  // 防截断：创建 Send 时客户端已经报过大小，收到的字节明显更少就是传输被截断了。
  // 直接拒绝比存一个坏文件好（否则用户下载到的文件打不开，还以为是加密问题）。
  const declaredSize = Number(send.data?.size ?? 0) || 0;
  if (declaredSize && bytes.length + 1024 < declaredSize) {
    console.warn('[send-upload] size mismatch', { declaredSize, received: bytes.length });
    return c.json(
      {
        error: `upload incomplete: received ${bytes.length} of ${declaredSize} bytes`,
        received: bytes.length,
        declared: declaredSize,
      },
      400,
    );
  }
  if (maxBytes && bytes.length > maxBytes) {
    return c.json({ error: `File too large: ${(maxBytes / 1024 / 1024).toFixed(1)} MB max`, limit: maxBytes }, 413);
  }

  try {
    await store.putBinary(keys.sendFile(userId, id), bytes);
  } catch (e) {
    console.error('[send-upload] store failed', bytes.length, e?.message || e);
    return c.json({ error: 'failed to store file' }, 500);
  }
  const next = await mutate(store, keys.send(userId, id), (cur) =>
    cur
      ? {
          ...cur,
          data: { ...cur.data, size: String(bytes.length), sizeName: displaySize(bytes.length) },
          updatedAt: nowIso(),
        }
      : undefined,
  );
  if (!next) return c.json({ error: 'send disappeared during upload' }, 409);
  // 字节已经存好，touchUser 只是更新 revision，失败不该让整次上传变成 500。
  try {
    await touchUser(store, userId);
  } catch (e) {
    console.warn('[send-upload] touchUser failed', e?.message || e);
  }
  return c.json(sendToJson(next));
}
app.post('/api/sends/:id/file/:fileId', uploadSendFile);
app.put('/api/sends/:id/file/:fileId', uploadSendFile);

app.post('/api/sends/:id/access/file/:fileId', async (c) => {
  const p = await body(c);
  const auth = (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : '');
  const store = getStore(c.env);

  let send;
  if (token) {
    let payload;
    try {
      payload = await verifyAccess(c.env, token);
    } catch {
      return c.json({ error: 'invalid access token' }, 401);
    }
    const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
    if (!idx) return c.json({ error: 'Send is not accessible' }, 404);
    send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  } else {
    send = await lookupSendByAccessId(store, c.req.param('id'));
  }
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);

  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  if (sendHasPassword(send) && !checkSendPassword(send, p.password ?? null)) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) return c.json({ error: 'file not found' }, 404);
  return c.body(bytes, 200, {
    'content-type': 'application/octet-stream',
    'content-length': String(bytes.length),
    'cache-control': 'no-store',
  });
});

// ---------------------------------------------------------------- key rotation / import
app.post('/api/accounts/key-management/rotate-user-account-keys', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);

  const check = await checkPassword(c, a.user, { masterPasswordHash: p.oldMasterKeyAuthenticationHash });
  if (check.error) return c.json({ error: check.error }, check.status);

  const unlock = p.accountUnlockData?.masterPasswordUnlockData ?? {};
  const kdfType = Number(unlock.kdfType ?? a.user.kdfType);
  const kdfIterations = Number(unlock.kdfIterations ?? a.user.kdfIterations);
  const kdfMemory = unlock.kdfMemory ?? null;
  const kdfParallelism = unlock.kdfParallelism ?? null;

  if (String(unlock.email ?? '') !== a.user.email) {
    return c.json({ error: 'Invalid master password salt' }, 400);
  }
  if (
    kdfType !== a.user.kdfType ||
    kdfIterations !== a.user.kdfIterations ||
    (kdfMemory ?? null) !== (a.user.kdfMemory ?? null) ||
    (kdfParallelism ?? null) !== (a.user.kdfParallelism ?? null)
  ) {
    return c.json({ error: 'Changing the kdf variant is not supported during key rotation' }, 400);
  }
  if (String(p.accountKeys?.accountPublicKey ?? '') !== a.user.publicKey) {
    return c.json({ error: 'Changing the asymmetric keypair is not supported during key rotation' }, 400);
  }

  const store = getStore(c.env);
  const [cipherIdx, folderIdx] = await Promise.all([
    store.list(keys.ciphers(a.claims.sub)),
    store.list(keys.folders(a.claims.sub)),
  ]);
  const curCiphers = (await mapLimit(cipherIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);
  const curFolders = (await mapLimit(folderIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);

  const reqCiphers = Array.isArray(p.accountData?.ciphers) ? p.accountData.ciphers : [];
  const reqFolders = Array.isArray(p.accountData?.folders) ? p.accountData.folders : [];

  if (reqCiphers.length !== curCiphers.length || reqFolders.length !== curFolders.length) {
    return c.json({ error: 'All existing ciphers and folders must be included in the rotation' }, 400);
  }
  const cipherIds = new Set(curCiphers.map((x) => x.id));
  for (const rc of reqCiphers) {
    if (!rc?.id || !cipherIds.has(rc.id)) {
      return c.json({ error: 'All existing ciphers and folders must be included in the rotation' }, 400);
    }
  }
  const folderIds = new Set(curFolders.map((x) => x.id));
  for (const rf of reqFolders) {
    if (!rf?.id || !folderIds.has(rf.id)) {
      return c.json({ error: 'All existing ciphers and folders must be included in the rotation' }, 400);
    }
  }

// apply rotation: cipher payloads / folder names / attachment keys
  for (const rf of reqFolders) {
    await mutate(store, keys.folder(a.claims.sub, String(rf.id)), (cur) =>
      cur ? { ...cur, name: String(rf.name ?? cur.name), updatedAt: nowIso() } : undefined,
    );
  }
  for (const rc of reqCiphers) {
    const data = cipherDataFrom(rc);
    await mutate(store, keys.cipher(a.claims.sub, String(rc.id)), (cur) =>
      cur
        ? {
            ...cur,
            data: { ...cur.data, ...data },
            folderId: rc.folderId ?? null,
            favorite: rc.favorite !== undefined ? Boolean(rc.favorite) : cur.favorite,
            updatedAt: nowIso(),
          }
        : undefined,
    );
    for (const [aid, att] of Object.entries(rc.attachments2 ?? {})) {
      await mutate(store, keys.attachmentMeta(a.claims.sub, aid), (cur) =>
        cur ? { ...cur, key: att.key ?? cur.key, fileName: att.fileName ?? cur.fileName } : undefined,
      );
    }
  }
  for (const rs of Array.isArray(p.accountData?.sends) ? p.accountData.sends : []) {
    if (!rs?.id) continue;
    await mutate(store, keys.send(a.claims.sub, String(rs.id)), (cur) =>
      cur
        ? {
            ...cur,
            name: rs.name ?? cur.name,
            notes: rs.notes ?? cur.notes,
            akey: rs.key ?? cur.akey,
            data: rs.text ?? rs.file ?? cur.data,
            updatedAt: nowIso(),
          }
        : undefined,
    );
  }

// new salt + hash + keys + security stamp, then revoke all devices
const salt = randomB64();
  const iterations = Number(envGet(c, 'PASSWORD_ITERATIONS', 600000));
  const newMph = String(unlock.masterKeyAuthenticationHash ?? '');
  if (!newMph) return c.json({ error: 'Missing masterKeyAuthenticationHash' }, 400);
  const stamp = newId();
  await mutate(store, keys.profile(a.claims.sub), (cur) =>
    cur
      ? {
          ...cur,
          masterPasswordHash: hashPassword(newMph, salt, iterations),
          passwordSalt: salt,
          passwordIterations: iterations,
          key: unlock.masterKeyEncryptedUserKey ?? cur.key,
          privateKey: p.accountKeys.userKeyEncryptedAccountPrivateKey ?? cur.privateKey,
          securityStamp: stamp,
          updatedAt: nowIso(),
        }
      : undefined,
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});

async function importCiphers(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const store = getStore(c.env);
  const now = nowIso();

  // Bitwarden olders[] + ciphers[] + folderRelationships[{key: cipherIndex, value: folderIndex}]
  const folderIds = [];
  for (const f of Array.isArray(p.folders) ? p.folders : []) {
    const id = newId();
    await store.put(keys.folder(a.claims.sub, id), {
      id,
      userId: a.claims.sub,
      name: String(f.name ?? ''),
      createdAt: now,
      updatedAt: now,
    });
    folderIds.push(id);
  }

  const rels = new Map(
    (Array.isArray(p.folderRelationships) ? p.folderRelationships : []).map((r) => [
      Number(r.key),
      Number(r.value),
    ]),
  );

  let count = 0;
  for (const [index, src] of (Array.isArray(p.ciphers) ? p.ciphers : []).entries()) {
    const folderIndex = rels.get(index);
    const id = newId();
    await store.put(keys.cipher(a.claims.sub, id), {
      id,
      userId: a.claims.sub,
      type: Number(src.type ?? 1),
      data: cipherDataFrom(src),
      favorite: Boolean(src.favorite),
      folderId: folderIndex != null && folderIds[folderIndex] ? folderIds[folderIndex] : null,
      deletedAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    count += 1;
  }

  await touchUser(store, a.claims.sub);
  return c.json({ count, folders: folderIds.length }, 200);
}

// ---------------------------------------------------------------- auth requests (login with device)
const requestIp = (c) =>
  c.req.header('cf-connecting-ip') ||
  c.req.header('x-real-ip') ||
  (c.req.header('x-forwarded-for') || '').split(',')[0].trim() ||
  '127.0.0.1';

const requestDeviceType = (c) =>
  Number(c.req.header('device-type') ?? c.req.header('x-device-type') ?? 14) || 14;

function authRequestToJson(ar, origin) {
  return {
    id: ar.id,
    publicKey: ar.publicKey,
    requestDeviceType: deviceTypeName(ar.deviceType),
    requestIpAddress: ar.requestIp,
    key: ar.encKey ?? null,
    masterPasswordHash: ar.masterPasswordHash ?? null,
    creationDate: ar.creationDate,
    responseDate: ar.responseDate ?? null,
    requestApproved: ar.approved === 1,
    origin,
    object: 'auth-request',
  };
}

app.post('/api/auth-requests', async (c) => {
  const p = await body(c);
  const store = getStore(c.env);
  const email = String(p.email ?? '').toLowerCase();
  const user = await findUserByEmail(c, email);
  if (!user) return c.json({ error: "AuthRequest doesn't exist" }, 400);

  const device = (await store.get(keys.device(user.id, String(p.deviceIdentifier ?? ''))))?.value;
  const devType = requestDeviceType(c);
  if (!device || Number(device.type) !== devType) {
    return c.json({ error: "AuthRequest doesn't exist" }, 400);
  }

  const ar = {
    id: newId(),
    userId: user.id,
    requestDeviceIdentifier: device.id,
    deviceType: devType,
    requestIp: requestIp(c),
    responseDeviceId: null,
    accessCode: String(p.accessCode ?? ''),
    publicKey: String(p.publicKey ?? ''),
    encKey: null,
    masterPasswordHash: null,
    approved: null,
    creationDate: nowIso(),
    responseDate: null,
  };
  await store.put(keys.authRequest(user.id, ar.id), ar, { ifNoneMatch: '*' });
  await store.put(keys.authRequestIndex(ar.id), { userId: user.id, id: ar.id });
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});

async function pendingAuthRequests(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const idx = await store.list(keys.authRequests(a.claims.sub));
  const rows = await mapLimit(idx, 16, async (it) => (await store.get(it.key))?.value);
  const live = rows.filter((r) => r && r.approved == null);
  return c.json({
    data: live.map((r) => authRequestToJson(r, baseUrlOf(c))),
    continuationToken: null,
    object: 'list',
  });
}
app.get('/api/auth-requests', pendingAuthRequests);
app.get('/api/auth-requests/pending', pendingAuthRequests);

app.get('/api/auth-requests/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const ar = (await getStore(c.env).get(keys.authRequest(a.claims.sub, c.req.param('id'))))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});

app.put('/api/auth-requests/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (a.claims.device !== String(p.deviceIdentifier ?? '')) {
    return c.json({ error: "AuthRequest doesn't exist" }, 400);
  }
  const store = getStore(c.env);
  const id = c.req.param('id');
  const ar = (await store.get(keys.authRequest(a.claims.sub, id)))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  if (ar.approved != null) {
    return c.json({ error: 'An authentication request with the same device already exists' }, 400);
  }

  if (p.requestApproved) {
    const next = await mutate(store, keys.authRequest(a.claims.sub, id), (cur) =>
      cur
        ? {
            ...cur,
            approved: 1,
            encKey: String(p.key ?? ''),
            masterPasswordHash: p.masterPasswordHash ?? null,
            responseDeviceId: String(p.deviceIdentifier ?? ''),
            responseDate: nowIso(),
          }
        : undefined,
    );
    return c.json(authRequestToJson(next, baseUrlOf(c)));
  }

  await store.del(keys.authRequest(a.claims.sub, id));
  await store.del(keys.authRequestIndex(id));
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});

app.get('/api/auth-requests/:id/response', async (c) => {
  const store = getStore(c.env);
  const hit = (await store.get(keys.authRequestIndex(c.req.param('id'))))?.value;
  if (!hit) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  const ar = (await store.get(keys.authRequest(hit.userId, hit.id)))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);

  const code = String(c.req.query('code') ?? '');
  if (
    Number(ar.deviceType) !== requestDeviceType(c) ||
    ar.requestIp !== requestIp(c) ||
    String(ar.accessCode) !== code
  ) {
    return c.json({ error: "AuthRequest doesn't exist" }, 400);
  }
  return c.json(authRequestToJson(ar, baseUrlOf(c)));
});

// ust
app.get('/api/folders/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const row = (await getStore(c.env).get(keys.folder(a.claims.sub, c.req.param('id'))))?.value;
  if (!row) return c.json({ error: 'not found' }, 404);
  return c.json(folderToJson(row));
});

// POST /api/ciphers/{id}/delete = UT
app.post('/api/ciphers/:id/delete', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  await store.del(keys.cipher(a.claims.sub, c.req.param('id')));
  await touchUser(store, a.claims.sub);
  return c.json({});
});

// ultipart
app.post('/api/ciphers/:id/attachment', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const cipherId = c.req.param('id');
  const cipher = (await store.get(keys.cipher(a.claims.sub, cipherId)))?.value;
  if (!cipher) return c.json({ error: 'not found' }, 404);

  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);

  const id = newId();
  const meta = {
    id,
    cipherId,
    userId: a.claims.sub,
    fileName: String(up.fields.fileName ?? 'file'),
    fileSize: up.bytes.length,
    key: up.fields.key ?? null,
    createdAt: nowIso(),
  };
  await store.put(keys.attachmentMeta(a.claims.sub, id), meta);
  await store.putBinary(keys.attachmentData(a.claims.sub, id), up.bytes);
  await mutate(store, keys.cipher(a.claims.sub, cipherId), (cur) =>
    cur ? { ...cur, updatedAt: nowIso() } : undefined,
  );
  await touchUser(store, a.claims.sub);
  return c.json(await cipherWithAttachments(c, store, a.claims.sub, (await store.get(keys.cipher(a.claims.sub, cipherId))).value));
});

//  Sendultipart  + 
app.post('/api/sends/file', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  const up = await readUpload(c);
  if (up.error) return c.json({ error: up.error }, 400);
  const f = up.fields;

  const dates = validateSendDates(f.deletionDate, f.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);

  const id = String(f.id ?? newId());
  const send = {
    id,
    userId: a.claims.sub,
    type: SEND_FILE,
    name: String(f.name ?? ''),
    notes: f.notes ?? null,
    data: { id, fileName: String(f.fileName ?? 'file'), size: String(up.bytes.length), sizeName: displaySize(up.bytes.length) },
    akey: String(f.key ?? ''),
    maxAccessCount: f.maxAccessCount != null && f.maxAccessCount !== '' ? Number(f.maxAccessCount) : null,
    accessCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    expirationDate: dates.expirationDate,
    deletionDate: dates.deletionDate,
    disabled: false,
    hideEmail: false,
    ...sendPasswordHash(f.password),
  };
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: '*' });
  await store.put(keys.sendIndex(accessIdFromUuid(id)), { userId: a.claims.sub, id });
  await store.putBinary(keys.sendFile(a.claims.sub, id), up.bytes);
  await touchUser(store, a.claims.sub);
  return c.json(sendToJson(send));
});

// (legacy file Send download 已上移到 file Send 段之前，避免被 :id/file/:fileId 抢占)


// legacy-client compatibility routes (also registered upstream)
app.get('/api/devices/identifier/:id', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const d = (await getStore(c.env).get(keys.device(a.claims.sub, c.req.param('id'))))?.value;
  if (!d) return c.json({ error: 'not found' }, 404);
  return c.json({
    id: d.id,
    name: d.name,
    type: d.type,
    identifier: d.id,
    creationDate: d.createdAt,
    revisionDate: d.updatedAt,
    object: 'device',
  });
});

async function deviceToken(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const token = String(p.pushToken ?? '').trim();
  if (!token) return c.json({ error: 'Missing pushToken' }, 400);
  const store = getStore(c.env);
  await mutate(store, keys.device(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, pushToken: token, updatedAt: nowIso() } : undefined,
  );
  return c.json({});
}
app.post('/api/devices/identifier/:id/token', deviceToken);
app.put('/api/devices/identifier/:id/token', deviceToken);

async function clearDeviceToken(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const store = getStore(c.env);
  await mutate(store, keys.device(a.claims.sub, c.req.param('id')), (cur) =>
    cur ? { ...cur, pushToken: null, pushUuid: null, updatedAt: nowIso() } : undefined,
  );
  return c.json({});
}
app.put('/api/devices/identifier/:id/clear-token', clearDeviceToken);
app.post('/api/devices/identifier/:id/clear-token', clearDeviceToken);

app.put('/api/accounts/avatar', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (p.avatarColor != null && String(p.avatarColor).length !== 7) {
    return c.json({ error: 'Invalid avatar color' }, 400);
  }
  const next = await mutate(getStore(c.env), keys.profile(a.claims.sub), (cur) =>
    cur ? { ...cur, avatarColor: p.avatarColor ?? null, updatedAt: nowIso() } : undefined,
  );
  return c.json(profileToJson(next));
});

app.get('/api/settings/domains', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  return c.json({
    equivalentDomains: a.user.equivalentDomains ?? [],
    globalEquivalentDomains: [],
    object: 'domains',
  });
});

async function setDomains(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  await mutate(getStore(c.env), keys.profile(a.claims.sub), (cur) =>
    cur ? { ...cur, equivalentDomains: p.equivalentDomains ?? [], updatedAt: nowIso() } : undefined,
  );
  return c.json({});
}
app.post('/api/settings/domains', setDomains);
app.put('/api/settings/domains', setDomains);

app.get('/api/tasks', (c) => c.json({ data: [], object: 'list' }));
// no WebSocket on Makers: 426 tells clients to fall back to polling /api/sync
app.get('/notifications/hub', (c) =>
  c.json({ error: 'websocket_not_supported', hint: 'fallback to polling /api/sync' }, 426),
);
app.get('/notifications/anonymous-hub', (c) =>
  c.json({ error: 'websocket_not_supported', hint: 'fallback to polling /api/sync' }, 426),
);
app.get('/api/hibp/breach', (c) => c.json([]));
app.get('/api/webauthn', (c) => c.json({ object: 'list', data: [], continuationToken: null }));
app.get('/api/emergency-access/trusted', (c) =>
  c.json({ data: [], object: 'list', continuationToken: null }),
);
app.get('/api/emergency-access/granted', (c) =>
  c.json({ data: [], object: 'list', continuationToken: null }),
);
app.post('/api/accounts/register/send-verification-email', (c) => c.json('fixed-token-to-mock'));

// delete account: remove every object of this user + the email index
async function deleteAccount(c) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error }, check.status);

  const store = getStore(c.env);
  const root = `u/${a.claims.sub}/`;
  const items = await store.list(root);

// drop the Send accessId index first (derived from id), then the rest
for (const it of items) {
    if (!it.key.includes('/sends/') || !it.key.endsWith('.json')) continue;
    const v = (await store.get(it.key))?.value;
    if (v?.id) await store.del(keys.sendIndex(accessIdFromUuid(v.id)));
  }
  for (const it of items) await store.del(it.key);

  await store.del(keys.email(emailKey(a.user.email)));
  return c.json({});
}
app.delete('/api/accounts', deleteAccount);
app.post('/api/accounts/delete', deleteAccount);

// ---------------------------------------------------------------- fallback
// 网页版没构建出来时，静态文件不存在，请求会一路走到这里。与其返回一行 JSON 501
// 让人以为「服务挂了」，不如给一个能看懂的页面：说明是构建期没下载到 Web Vault。
function missingWebVaultPage(c) {
  const base = baseUrlOf(c);
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>网页版未构建 · Warden</title>
<style>
 body{font-family:-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;max-width:720px;margin:56px auto;padding:0 24px;color:#1f2328;line-height:1.7}
 h1{font-size:22px;margin:0 0 12px} code{background:#f6f8fa;border:1px solid #d0d7de;border-radius:5px;padding:1px 6px;font-size:13px}
 pre{background:#f6f8fa;border:1px solid #d0d7de;border-radius:8px;padding:12px;font-size:13px;overflow:auto}
 .warn{border:1px solid #d4a72c;background:#fff8c5;border-radius:8px;padding:12px 14px;margin:18px 0}
 li{margin:6px 0}
</style></head><body>
<h1>网页版（Web Vault）没有构建出来</h1>
<p>后端是正常的 —— 你现在看到的这个页面，就是函数在响应请求。缺的是构建期应当下载到
<code>public/</code> 的官方网页版静态文件。</p>
<div class="warn">这不是环境变量写错的问题：<code>WEB_VAULT_ENABLED=true</code> 只决定「构建时要不要下载」，下载失败时不会有运行时开关能补救。</div>
<p><b>按顺序检查：</b></p>
<ol>
  <li>看构建日志里有没有 <code>[web-vault]</code> 开头的行：应当出现下载地址、解压结果和最终文件数；</li>
  <li>构建机能否访问 GitHub Releases（国内构建机经常超时）；</li>
  <li>必要时换下载源：<code>WEB_VAULT_BASE_URL</code> 指向一个可达的镜像；</li>
  <li>改完环境变量必须<b>重新部署</b>（Makers 不热加载）。</li>
</ol>
<p><b>现在能用的入口：</b></p>
<ul>
  <li><a href="${base}/api/alive">/api/alive</a> — 服务存活</li>
  <li><a href="${base}/api/config">/api/config</a> — 客户端配置</li>
  <li><a href="${base}/api/web-status">/api/web-status</a> — 网页版开关状态</li>
</ul>
<p>官方客户端（Android / 浏览器扩展）不受影响，可以照常登录使用：在自托管地址里填
<code>${base}</code> 即可。</p>
</body></html>`;
  return c.html(html, 200);
}

app.all('*', (c) => {
  const path = new URL(c.req.url).pathname;
  const method = c.req.method;
  const accept = c.req.header('accept') ?? '';
  // 只把「看起来是在要页面」的请求换成提示页；API 和静态资源仍然返回 501 JSON
  const pageLike =
    (method === 'GET' || method === 'HEAD') &&
    accept.includes('text/html') &&
    !/\/(api|identity)(\/|$)/.test(path) &&
    !/\.[a-z0-9]{2,5}$/i.test(path);
  if (pageLike) return missingWebVaultPage(c);
  return c.json(
    {
      error: 'not_implemented',
      path,
      hint: 'route not implemented yet, see README',
    },
    501,
  );
});

// 网页版部署在 /vault/ 子路径下时，它在拿到 /api/config 之前会用**相对路径**请求：
//   GET  /vault/api/config
//   POST /vault/identity/connect/token
// 这些请求进不到 /api/* 或 /identity/*，于是配置加载失败、客户端退化成相对地址，
// 最终报 "501 Not Implemented against /vault/identity/connect/token"。
// 把同一套路由再挂一份到 /vault 下即可；拿到 config 后客户端会改用其中的绝对地址。
const exported = new Hono();
exported.use('*', cors());
// 落地页（public/index.html）已删除：根路径直接跳到网页版。
// 这两条必须注册在下面两个 route() 之前，否则会被 app 里的 all('*') 兜底先命中；
// 另外它们只挂在 exported 上，不会随 /vault 前缀再挂一次（否则 /vault/ 会自己跳自己）。
// 网页版直接构建在站点根（public/index.html），静态层会先命中，走不到这里。
// 走到这里只可能是「产物里没有 index.html」——给说明页，而不是让平台返回 404。
exported.get('/', (c) => missingWebVaultPage(c));
exported.get('/index.html', (c) => missingWebVaultPage(c));
// 旧书签兼容：/vault 与 /vault/index.html 指回根路径（浏览器会保留 #hash）
exported.get('/vault', (c) => c.redirect('/', 302));
// 网页版会为每个登录项请求 /icons/{域名}/icon.png 拿网站图标。我们没有这个服务，
// 与其让它落到 501 兜底（日志刷屏、界面转圈），不如直接 404 并允许缓存。
exported.get('/icons/*', (c) => {
  c.header('cache-control', 'public, max-age=86400');
  return c.body(null, 404);
});
exported.get('/vault/index.html', (c) => c.redirect('/', 302));
// 先挂 /vault：app 里有一条 all('*') 兜底，若先挂根路径会把它也挂到最前面，
// 导致 /vault/api/config 先被兜底命中（501）。
exported.route('/vault', app);
exported.route('/', app);

export { mailConfigured };
export default exported;
