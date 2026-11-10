// src/index.js
// Bitwarden-compatible backend (EdgeOne Makers / Cloud Functions, Node.js). Behaviour mirrors warden-worker (Rust); route list in README.
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createHash, pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);
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
  safeEqual,
  sealSecret,
  openSecret,
} from './crypto.js';
import { getStore, keys, mutate } from './store.js';
import { sendPasswordHint, mailConfigured } from './mail.js';
import { readUpload } from './upload.js';

const app = new Hono();

const envGet = (c, name, dflt) => c.env?.[name] ?? process.env[name] ?? dflt;

// CORS：只放行 BASE_URL 自己的源。认证走 Bearer、不依赖 Cookie，所以全开放不至于直接
// 泄露数据，但也不该给任意站点一个"可以代你发请求"的口子（同时避免以后引入 Cookie
// 会话时变成高危）。
const corsOptions = {
  origin: (origin, c) => {
    if (!origin) return undefined; // 非浏览器请求（手机客户端、curl）
    const base = String(envGet(c, 'BASE_URL', '')).replace(/\/+$/, '');
    if (!base) return undefined; // 没配 BASE_URL 就不下发 ACAO，绝不反射任意源
    const alt = base.replace(/^https:/i, 'http:');
    return origin === base || origin === alt ? origin : undefined;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['authorization', 'content-type', 'device-type', 'x-device-type', 'x-requested-with'],
  maxAge: 600,
};

// 客户端传进来的 id 会直接拼进存储键（u/{uid}/ciphers/{id}.json）。对象键是字面量、
// 不会真的路径穿越，但 %2F、反斜杠、.. 能让键落到意想之外的位置，一律在入口拒绝。
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
// 注意：空串不放行。'' 拼进存储键会得到 u/{uid}/ciphers/.json 这种"目录本身"的键，
// 语义混乱；调用方确实允许缺省时应该自己判断 v == null，而不是依赖这里放行 ''。
const validId = (v) => v != null && ID_RE.test(String(v));
// 可选 id：客户端可以不传（服务端生成），一旦传了就必须合法
const optionalId = (v) => v == null || validId(v);

// 单个 JSON 请求体上限：平台给到 ~6 MB，但业务 JSON 没理由这么大，
// 留 4 MiB 既够导入，又能挡住"一个字段 4 MB"的滥用。
const BODY_MAX_BYTES = 4 * 1024 * 1024;

app.use('*', async (c, next) => {
  const rawPath = new URL(c.req.url).pathname.toLowerCase();
  if (rawPath.includes('%2f') || rawPath.includes('%5c') || rawPath.includes('..')) {
    return c.json({ error: 'invalid path' }, 400);
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const ct = (c.req.header('content-type') || '').toLowerCase();
    const binary = ct.includes('application/octet-stream') || ct.includes('multipart/form-data');
    // 文本类请求体整块读进来量真实字节数：只信 Content-Length 会被 chunked 绕过，
    // 而伪造的 Content-Length 会让后面的解析抛错。
    if (!binary) {
      const text = await c.req.text();
      if (Buffer.byteLength(text, 'utf8') > BODY_MAX_BYTES) {
        return c.json({ error: 'payload too large', limit: BODY_MAX_BYTES }, 413);
      }
      c.set('rawBodyText', text);
    }
  }
  await next();
});

// 统一错误出口：未捕获异常不能再落到框架默认的 text/plain "Internal Server Error"，
// 也不该把 PreconditionFailed（并发写冲突）当成 500。
app.onError((err, c) => {
  const isConflict = err?.name === 'PreconditionFailed';
  const status = Number(err?.status) || (isConflict ? 409 : 500);
  if (status >= 500) console.error('[error]', c.req.method, c.req.path, err?.stack || err);
  const message = status >= 500 ? 'Internal Server Error' : isConflict ? 'resource already exists' : err?.message || 'bad request';
  return c.json({ error: message, message, statusCode: status }, status);
});

// 安全响应头：下载 URL 里带票据，Referer 一律不带出去；同时禁止 MIME 嗅探
app.use('*', async (c, next) => {
  await next();
  c.header('referrer-policy', 'no-referrer');
  c.header('x-content-type-options', 'nosniff');
  c.header('strict-transport-security', 'max-age=31536000; includeSubDomains');
  // 函数只返回 JSON 和自带的 404 页，不需要任何外部资源
  c.header('content-security-policy', "default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'");
});

app.use('*', cors(corsOptions));

// 批量接口的条目上限：防止一个请求塞几万条 id，把函数拖到超时、产生大量存储写入
const BULK_MAX_IDS = 2000;
const IMPORT_MAX_ITEMS = 5000;

// 注册时的邮箱格式：本地部分 + 域名，不允许尖括号/空格等会污染存储键与邮件的字符
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

// 一次性/限次令牌：URL 里的票据会进访问日志、浏览器历史、Referer，泄露后能被重放。
// 这里记录用量（默认最多 3 次，够客户端重试），并低频清理过期标记。
async function consumeToken(store, token, { maxUses = 5, ttlSec = 900 } = {}) {
  const id = createHash('sha256').update(String(token)).digest('hex').slice(0, 32);
  const key = `tok/${id}.json`;
  const now = Math.floor(Date.now() / 1000);
  const cur = (await store.get(key))?.value;
  if (cur && Number(cur.exp) >= now && Number(cur.uses ?? 0) >= maxUses) return false;
  const uses = cur && Number(cur.exp) >= now ? Number(cur.uses ?? 0) + 1 : 1;
  await store.put(key, { exp: now + ttlSec, uses });

  if (Math.random() < 0.02) {
    try {
      const rows = await store.list('tok/');
      const stale = [];
      for (const it of rows) {
        const v = (await store.get(it.key))?.value;
        if (!v || Number(v.exp) < now) stale.push(it.key);
        if (stale.length >= 50) break;
      }
      await Promise.all(stale.map((k) => store.del(k).catch(() => {})));
    } catch {
      /* 清理失败不影响主流程 */
    }
  }
  return true;
}

// ---------------------------------------------------------------- helpers
// 请求体读取：文本类（JSON / 表单）在中间件里整块读入并缓存，顺便量真实字节数。
// 不能只看 Content-Length —— chunked 请求没有它，伪造/畸形的值也不可信。
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function body(c) {
  const cached = c.get('rawBodyText');
  if (cached !== undefined) {
    const ct = (c.req.header('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) {
      if (!cached.trim()) return {};
      try {
        return JSON.parse(cached) ?? {};
      } catch {
        // 以前这里 .catch(() => ({})) 会把坏 JSON 吞成 {}，让请求以空对象继续落库
        throw new HttpError(400, 'invalid json body');
      }
    }
    const out = {};
    for (const [k, v] of new URLSearchParams(cached)) out[k] = v;
    return out;
  }
  const ct = c.req.header('content-type') || '';
  if (ct.includes('application/json')) {
    const text = await c.req.text();
    if (!text.trim()) return {};
    try {
      return JSON.parse(text) ?? {};
    } catch {
      throw new HttpError(400, 'invalid json body');
    }
  }
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
// 限流键是 rl/{kind}/{hash(ip)}：换一个伪造 IP 就新建一个对象，键空间没有上界。
// 这里低频清理已过期的计数对象，避免存储被慢慢撑大（每 200 次限流调用做一次）。
let rateSweepTick = 0;
async function sweepRateKeys(store, now) {
  rateSweepTick += 1;
  if (rateSweepTick % 200 !== 0) return;
  try {
    const rows = await store.list('rl/');
    const dead = [];
    for (const it of rows) {
      const v = (await store.get(it.key))?.value;
      if (!v || Number(v.exp ?? 0) < now) dead.push(it.key);
      if (dead.length >= 50) break;
    }
    await Promise.all(dead.map((k) => store.del(k).catch(() => {})));
  } catch {
    /* 清理失败不影响限流本身 */
  }
}
// 限流分桶：拿不到可信客户端 IP 时退到一个共享桶。
//
// 这里有两个互相拉扯的风险：
//   a) 桶太严 —— 任何人打满就能让所有人在同一窗口被 429（DoS 反噬）；
//   b) 桶太松 —— 等于没有 IP 限流，枚举/爆破畅通。
// 所以按端点分两类：
//   · 敏感端点（登录、注册、prelogin、Send 口令…）用一个**宽松总闸**，
//     把"打满就能锁住全站"的代价从几十次抬到几百次；
//   · 其余端点（下载类）按比例放大，尽量不影响正常流量。
const SHARED_RATE_BUCKET = 'shared-untrusted-ip';
const SHARED_RATE_FACTOR = 10;
const SHARED_RATE_MIN = 120;
const SHARED_STRICT_FLOOR = 600;

// 这些 kind 拿不到 IP 时改用宽松总闸，而不是沿用各自的严格阈值
const SHARED_STRICT_KINDS = new Set([
  'login-ip',
  'register',
  'register-email',
  'prelogin',
  'hint-ip',
  'verify-password',
  'knowndevice',
  'send-access',
  'send-access-legacy',
  'auth-request',
  'auth-request-response',
  'auth-request-approve',
]);

function rateBucket(id, max, kind = '') {
  if (id != null && id !== '') return { id, max };
  const base = Number(max || 0);
  if (SHARED_STRICT_KINDS.has(kind)) {
    return { id: SHARED_RATE_BUCKET, max: Math.max(base, SHARED_STRICT_FLOOR) };
  }
  return { id: SHARED_RATE_BUCKET, max: Math.max(base * SHARED_RATE_FACTOR, SHARED_RATE_MIN) };
}

async function limit(c, kind, id, max, windowSec) {
  const bucket = rateBucket(id, max, kind);
  const store = getStore(c.env);
  const digest = createHash('sha256').update(`${kind}:${bucket.id}`).digest('hex').slice(0, 32);
  const key = keys.rate(`${kind}/${digest}`);
  const now = Date.now();
  const cur = (await store.get(key))?.value;
  const sameWindow = cur && now - cur.start < windowSec * 1000;
  const count = sameWindow ? cur.count : 0;
  if (count >= bucket.max) {
    const retry = Math.max(1, Math.ceil((windowSec * 1000 - (now - cur.start)) / 1000));
    return c.json({ error: 'Too many requests. Please try again later.' }, 429, {
      'retry-after': String(retry),
    });
  }
  const start = sameWindow ? cur.start : now;
  await store.put(key, { start, count: count + 1, exp: start + windowSec * 1000 });
  await sweepRateKeys(store, now);
  return null;
}

/**
 * 多个限流器一次做完：并行读 + 并行写。
 * 每次 Blob 往返约 100ms，串行调用两个 limit() 就是 4 趟 ≈ 400ms，
 * 合成一次只要 2 趟。
 */
async function limits(c, specs) {
  const usable = specs.map((s) => {
    const b = rateBucket(s.id, s.max, s.kind);
    return { ...s, id: b.id, max: b.max };
  });
  const store = getStore(c.env);
  const now = Date.now();
  const entries = usable.map((s) => ({
    spec: s,
    key: keys.rate(`${s.kind}/${createHash('sha256').update(`${s.kind}:${s.id}`).digest('hex').slice(0, 32)}`),
  }));
  const rows = await Promise.all(entries.map((e) => store.get(e.key)));
  const writes = [];
  for (let i = 0; i < entries.length; i++) {
    const { spec, key } = entries[i];
    const cur = rows[i]?.value;
    const sameWindow = cur && now - cur.start < spec.windowSec * 1000;
    const count = sameWindow ? cur.count : 0;
    if (count >= spec.max) {
      const retry = Math.max(1, Math.ceil((spec.windowSec * 1000 - (now - cur.start)) / 1000));
      return {
        blocked: c.json({ error: 'Too many requests. Please try again later.' }, 429, {
          'retry-after': String(retry),
        }),
      };
    }
    const start = sameWindow ? cur.start : now;
    writes.push([key, { start, count: count + 1, exp: start + spec.windowSec * 1000 }]);
  }
  await Promise.all(writes.map(([k, v]) => store.put(k, v)));
  await sweepRateKeys(store, now);
  return { blocked: null };
}

// 主密码提示的取值：不同客户端/版本用过的字段名不止一个，
// 个别情况下还会把值塞进空字符串键（历史数据兼容），统一在这里收口。
// 提示字段名有三代写法：
//   masterPasswordHint  注册接口（RegisterRequest）
//   hint                改主密码接口（PasswordRequest）—— 漏了它会导致"改了提示但没保存"
//   masterPasswordHintB64 / ''  历史兼容
const HINT_KEYS = ['masterPasswordHint', 'hint', 'masterPasswordHintB64', ''];
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

// 服务端二次哈希的迭代数：环境变量可能被写成 0 或极小值（pbkdf2 会直接抛错，
// 而极小的值等于把存储层哈希废掉），这里统一兜一个下限。
const PBKDF2_MIN_ITERATIONS = 60000;
const pbkdf2Iterations = (c) =>
  Math.max(PBKDF2_MIN_ITERATIONS, Number(envGet(c, 'PASSWORD_ITERATIONS', 600000)) || 0);
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
    if (!prof || !safeEqual(prof.value.securityStamp, claims.sstamp)) {
      console.warn('[auth] stamp mismatch', c.req.method, c.req.path, 'sub=' + claims.sub, 'profile=' + Boolean(prof));
      return { error: c.json({ error: 'unauthorized', reason: 'stamp_mismatch' }, 401) };
    }
    c.set('sstamp', prof.value.securityStamp);
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
  // 这个接口会回答「该邮箱的 KDF 参数」，不同参数就等于告诉调用方账号是否存在；限流抬高枚举成本
  const rl = await limit(c, 'prelogin', requestIp(c), 30, 60);
  if (rl) return rl;
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
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return c.json({ error: 'invalid email' }, 400);
  }
  // 按邮箱再限一层：注册接口会回答"邮箱是否已存在"，限流把枚举成本抬起来
  const rlEmail = await limit(c, 'register-email', email, 5, 60);
  if (rlEmail) return rlEmail;
  if (!allowedEmail(c, email)) return c.json({ error: 'Not allowed to signup' }, 401);

  const store = getStore(c.env);
  if (await findUserByEmail(c, email)) return c.json({ error: 'email already exists' }, 400);

  const id = newId();
  const now = nowIso();
  const salt = randomB64();
  const iterations = pbkdf2Iterations(c);

  // 新版客户端（网页版 2026.x / 移动端）不再发扁平字段，而是把注册信息放在
  // masterPasswordAuthenticationData / masterPasswordUnlockData / accountKeys 里。
  // 只认扁平字段会导致注册恒返回 400 missing masterPasswordHash。
  const regAuth = p.masterPasswordAuthenticationData ?? {};
  const regUnlock = p.masterPasswordUnlockData ?? {};
  const regKdf = regUnlock.kdf ?? regAuth.kdf ?? null;

  const masterPasswordHash = String(
    p.masterPasswordHash ?? p.masterPasswordHashB64 ?? regAuth.masterPasswordAuthenticationHash ?? '',
  );
  if (!masterPasswordHash) return c.json({ error: 'missing masterPasswordHash' }, 400);

  // 真实客户端（Android/iOS/Web）用的是 userSymmetricKey + userAsymmetricKeys，
  // 兼容旧字段名 key / keys，以及新版的 masterPasswordUnlockData / accountKeys。
  const userSymmetricKey = String(p.userSymmetricKey ?? p.key ?? regUnlock.masterKeyWrappedUserKey ?? '');
  if (!userSymmetricKey) return c.json({ error: 'missing userSymmetricKey' }, 400);

  const keyPair = p.accountKeys?.publicKeyEncryptionKeyPair ?? null;
  const asym =
    p.userAsymmetricKeys ??
    p.keys ??
    (keyPair
      ? { encryptedPrivateKey: keyPair.wrappedPrivateKey ?? '', publicKey: keyPair.publicKey ?? '' }
      : {});

  const kdfType = Number(p.kdf ?? regKdf?.kdfType ?? regKdf?.type ?? 0) || 0;
  const kdfIterations = Number(p.kdfIterations ?? regKdf?.iterations ?? iterations) || iterations;
  const kdfMemory = p.kdfMemory ?? regKdf?.memory ?? null;
  const kdfParallelism = p.kdfParallelism ?? regKdf?.parallelism ?? null;

  const user = {
    id,
    email,
    name: p.name ?? null,
    emailVerified: false,
    masterPasswordHash: await hashPassword(masterPasswordHash, salt, iterations),
    passwordSalt: salt,
    passwordIterations: iterations,
    ...hintFieldsFrom(readHint(p)),
    key: userSymmetricKey,
    privateKey: String(asym.encryptedPrivateKey ?? ''),
    publicKey: String(asym.publicKey ?? ''),
    kdfType,
    kdfIterations,
    kdfMemory,
    kdfParallelism,
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
    // 限流和查用户互不依赖：合并成一次并行，省掉 2 趟串行往返
    const [rl, user] = await Promise.all([
      limits(c, [
        { kind: 'login-email', id: email, max: 20, windowSec: 60 },
        { kind: 'login-ip', id: requestIp(c), max: 60, windowSec: 60 },
      ]),
      findUserByEmail(c, email),
    ]);
    if (rl.blocked) return rl.blocked;
    if (!user) {
      // 时序侧信道：未知邮箱原本立刻返回（0 ms），已注册账号要跑一次 PBKDF2（~75 ms），
      // 这就等于一个账号枚举器。这里对未知账号也做一次同等代价的哈希，让两者无法区分。
      await hashPassword(String(p.password ?? ''), 'warden-timing-equalizer-salt', pbkdf2Iterations(c)).catch(() => {});
      return c.json({ error: 'invalid_grant', error_description: 'Username or password is incorrect. Try again.', message: 'Username or password is incorrect. Try again.', Message: 'Username or password is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or password is incorrect. Try again.'] } }, 400);
    }
    // login with deviceassword  access code
const authRequestId = String(p.authrequest ?? p.authRequest ?? '');
    if (authRequestId) {
      // 这条分支不校验主密码（用的是 accessCode），原本 1ms 就返回；
      // 而未知邮箱要走一次均衡哈希（~78ms）—— 反差同样能枚举账号。
      // 这里照样做一次等价代价的哈希，结果丢弃。
      const timingFill = hashPassword(String(mph ?? ''), 'warden-timing-equalizer-salt', pbkdf2Iterations(c)).catch(() => {});
      const ar = (await store.get(keys.authRequest(user.id, authRequestId)))?.value;
      const devId = String(p.device_identifier ?? p.deviceIdentifier ?? '');
      const devType = Number(p.device_type ?? p.deviceType ?? 14);
      if (
        !ar ||
        ar.approved !== 1 ||
        ipMismatch(ar.requestIp, requestIp(c)) ||
        Number(ar.deviceType) !== devType ||
        ar.requestDeviceIdentifier !== devId ||
        !safeEqual(ar.accessCode, mph)
      ) {
        await timingFill;
        return c.json({ error: 'invalid_grant', error_description: 'Username or access code is incorrect. Try again.', message: 'Username or access code is incorrect. Try again.', Message: 'Username or access code is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or access code is incorrect. Try again.'] } }, 400);
      }
      await timingFill;
    } else if (!mph || !(await checkMasterPassword(c, user, mph))) {
      return c.json({ error: 'invalid_grant', error_description: 'Username or password is incorrect. Try again.', message: 'Username or password is incorrect. Try again.', Message: 'Username or password is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or password is incorrect. Try again.'] } }, 400);
    }

    const deviceId = String(p.device_identifier ?? p.deviceIdentifier ?? newId());
    const deviceType = Number(p.device_type ?? p.deviceType ?? 14);
    const now = nowIso();
    // 写设备和读 2FA 互不依赖：并行，省一趟往返
// merge instead of overwrite: keep twofactorRemember / pushToken / refreshId
    const [device, tf] = await Promise.all([
      mutate(store, keys.device(user.id, deviceId), (cur) => ({
        ...(cur ?? { id: deviceId, userId: user.id, refreshId: newId(), createdAt: now }),
        name: String(p.device_name ?? p.deviceName ?? cur?.name ?? 'device'),
        type: deviceType,
        updatedAt: now,
      })),
      getTwoFactor(store, user.id, TFA_AUTHENTICATOR),
    ]);

    // ---- 2FA OTP(0) / Remember(5) / RecoveryCode(8) ----
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
          if (!dev || !safeEqual(dev.value.twofactorRemember, code)) throw new Error('remember mismatch');
        } else if (provider === TFA_RECOVERY) {
          const stored = String(openSecret(c.env, user.totpRecover) ?? '');
          if (!stored || !safeEqual(stored.toUpperCase(), code.trim().toUpperCase())) {
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
      return c.json({ error: 'invalid_grant', error_description: 'Username or password is incorrect. Try again.', message: 'Username or password is incorrect. Try again.', Message: 'Username or password is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or password is incorrect. Try again.'] } }, 400);
    }
    // 设备与 profile 互不依赖（都用令牌里的 userId），并行读省一趟往返
    const refreshUid = String(payload.userId ?? '');
    const [device, prof] = await Promise.all([
      store.get(keys.device(refreshUid, String(payload.deviceId ?? ''))),
      store.get(keys.profile(refreshUid)),
    ]);
    if (!device) return c.json({ error: 'invalid_grant', error_description: 'Username or password is incorrect. Try again.', message: 'Username or password is incorrect. Try again.', Message: 'Username or password is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or password is incorrect. Try again.'] } }, 400);
    if (!prof) return c.json({ error: 'invalid_grant', error_description: 'Username or password is incorrect. Try again.', message: 'Username or password is incorrect. Try again.', Message: 'Username or password is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or password is incorrect. Try again.'] } }, 400);
    const user = prof.value;
    if (!safeEqual(payload.refreshId, device.value.refreshId) || !safeEqual(payload.sstamp, user.securityStamp)) {
      return c.json({ error: 'invalid_grant', error_description: 'Username or password is incorrect. Try again.', message: 'Username or password is incorrect. Try again.', Message: 'Username or password is incorrect. Try again.', statusCode: 400, validationErrors: { '': ['Username or password is incorrect. Try again.'] } }, 400);
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
    if (sendHasPassword(send)) {
      const pw = await verifySendPassword(c, store, send, provided);
      if (!pw.ok) {
        console.warn('[send-access] password required/invalid');
        const hdr = pw.retryAfter ? { 'retry-after': String(pw.retryAfter) } : {};
        return c.json(
          {
            error: 'invalid_grant',
            send_access_error_type: provided ? 'password_hash_b64_invalid' : 'password_hash_b64_required',
          },
          pw.status ?? 400,
          hdr,
        );
      }
    }
    // 访问计数是「尽力而为」：乐观锁冲突重试耗尽会抛异常，
    // 以前这里没人捕获 → 整条请求 500（页面就显示"发生意外错误"）。
    try {
      await mutate(store, keys.send(send.userId, send.id), (cur) =>
        cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : undefined,
      );
    } catch (e) {
      console.warn('[send-access] accessCount update failed (ignored)', e?.message || e);
    }
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
        (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env, c.get('sstamp') ?? '-')),
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
          (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env, c.get('sstamp') ?? '-')),
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

// 批量接口的 ids：统一截断 + 校验。任何一个非法就整体拒绝，
// 否则 "../../<victim>/profile" 这种会直接拼进存储键。
function readBulkIds(c, p) {
  const raw = Array.isArray(p.ids) ? p.ids.slice(0, BULK_MAX_IDS).map(String) : [];
  if (raw.some((v) => !validId(v))) return { error: c.json({ error: 'invalid id' }, 400) };
  return { ids: raw };
}

async function bulkMutate(c, fn) {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const bid = readBulkIds(c, p);
  if (bid.error) return bid.error;
  const ids = bid.ids;
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
  const bid = readBulkIds(c, p);
  if (bid.error) return bid.error;
  const ids = bid.ids;
  const store = getStore(c.env);
  for (const id of ids) await store.del(keys.cipher(a.claims.sub, id));
  await touchUser(store, a.claims.sub);
  return c.json({});
});
app.delete('/api/ciphers', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const bid = readBulkIds(c, p);
  if (bid.error) return bid.error;
  const ids = bid.ids;
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
// folderId 归属校验。存储键按当前用户拼（u/{uid}/folders/{id}），
// 所以查不到就说明要么不存在、要么是别人的 folder —— 两种情况都拒绝。
// move 一直是这么做的，create / update 之前漏了。
async function requireOwnFolder(store, userId, folderId) {
  if (folderId == null || folderId === '') return { folderId: null };
  const id = String(folderId);
  if (!validId(id)) return { error: 'invalid folder id' };
  const folder = await store.get(keys.folder(userId, id));
  if (!folder) {
    return { error: 'Invalid folder: Folder does not exist or belongs to another user' };
  }
  return { folderId: id };
}

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
  const bid = readBulkIds(c, p);
  if (bid.error) return bid.error;
  const ids = bid.ids;
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
    (attMap.get(row.id) ?? []).map((m) => attachmentToResponse(m, baseUrlOf(c), c.env, c.get('sstamp') ?? '-')),
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
  // id 会直接拼进存储键（u/{uid}/ciphers/{id}.json），客户端自报的 id 必须是安全字符
  if (!optionalId(src.id)) return c.json({ error: 'invalid id' }, 400);
  const store = getStore(c.env);
  const folder = await requireOwnFolder(store, a.claims.sub, src.folderId);
  if (folder.error) return c.json({ error: folder.error }, 400);
  const now = nowIso();
  const row = {
    id: String(src.id ?? newId()),
    userId: a.claims.sub,
    type: Number(src.type ?? 1),
    data: cipherDataFrom(src),
    favorite: Boolean(src.favorite),
    folderId: folder.folderId,
    deletedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await store.put(keys.cipher(row.userId, row.id), row, { ifNoneMatch: '*' });
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
  // folderId 归属校验要在 mutate 之前做（回调是同步的）
  let nextFolderId;
  if (src.folderId !== undefined) {
    const folder = await requireOwnFolder(store, a.claims.sub, src.folderId);
    if (folder.error) return c.json({ error: folder.error }, 400);
    nextFolderId = folder.folderId;
  }
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
      folderId: nextFolderId !== undefined ? nextFolderId : cur.folderId,
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
  if (!mph) return { error: 'Missing master password hash', message: 'Missing master password hash', statusCode: 400, status: 400 };
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
  // 并行删除：设备多时串行会是好几趟往返
  await Promise.all(idx.map((it) => store.del(it.key).catch(() => {})));
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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

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
    // 激活时不占用当前时间步：否则刚开完两步验证立刻登录必然失败，得等 30 秒
    lastUsed: 0,
  });

// generate recovery code on first TOTP activation
if (!a.user.totpRecover) {
    const code = generateRecoveryCode();
    await mutate(store, keys.profile(a.claims.sub), (cur) =>
      cur ? { ...cur, totpRecover: sealSecret(c.env, code), updatedAt: nowIso() } : undefined,
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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

  const store = getStore(c.env);
  const tf = await getTwoFactor(store, a.claims.sub, TFA_AUTHENTICATOR);
  if (!tf) return c.json({ error: 'TOTP not configured' }, 400);
  if (!safeEqual(String(tf.data).toUpperCase(), String(p.key ?? '').toUpperCase())) {
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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);
  return c.json({ code: openSecret(c.env, a.user.totpRecover) ?? null, object: 'twoFactorRecover' });
});

// ---------------------------------------------------------------- account ops
app.post('/api/accounts/password', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);

  // 客户端有三代写法：
  //   1. 老客户端：masterPasswordHash=当前 + newMasterPasswordHash=新
  //   2. 网页版 2026.x（class Ie）：masterPasswordHash=当前 +
  //      authenticationData.masterPasswordAuthenticationHash=新 + unlockData
  //   3. 新版 SDK：masterPasswordAuthenticationData / masterPasswordUnlockData
  // 三种都要认，但**都必须带当前密码**。早期版本在没有新哈希时把 masterPasswordHash
  // 当成新密码，等于只凭 access token 就能改主密码（token 泄露=账号被永久接管），
  // 而且会把网页版真正发来的 authenticationData 误当成"没给新密码"。
  const authData = p.authenticationData ?? p.masterPasswordAuthenticationData ?? {};
  const unlockData = p.unlockData ?? p.masterPasswordUnlockData ?? {};
  const newMph = String(
    p.newMasterPasswordHash ??
      p.newMasterPasswordHashB64 ??
      authData.masterPasswordAuthenticationHash ??
      unlockData.masterKeyAuthenticationHash ??
      '',
  );
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);
  if (!newMph) {
    return c.json({ error: 'Missing newMasterPasswordHash', message: 'Missing newMasterPasswordHash', statusCode: 400 }, 400);
  }

  const store = getStore(c.env);
  const salt = randomB64();
  const iterations = pbkdf2Iterations(c);
  const stamp = newId();
  const hintFields = hasHintField(p) ? hintFieldsFrom(readHint(p)) : null;
  const newKey =
    p.key ??
    unlockData.masterKeyWrappedUserKey ??
    unlockData.masterKeyEncryptedUserKey ??
    unlockData.key ??
    null;

  // 客户端可能同时换了 KDF：跟着更新，否则 prelogin 会返回旧参数，客户端推导出的
  // masterPasswordHash 永远对不上。
  // 网页版 2026.x 把 KDF 放在顶层的 kdf / kdfIterations（class Gh 的字段），
  // 新版 SDK 放在 masterPasswordUnlockData.kdf，两种都读。
  const kdf = unlockData.kdf ?? null;
  const kdfFields =
    p.kdf != null || p.kdfIterations != null
      ? {
          kdfType: Number(p.kdf ?? 0),
          kdfIterations: Number(p.kdfIterations ?? iterations),
          kdfMemory: p.kdfMemory ?? null,
          kdfParallelism: p.kdfParallelism ?? null,
        }
      : kdf
        ? {
            kdfType: Number(kdf.kdfType ?? kdf.type ?? 0),
            kdfIterations: Number(kdf.iterations ?? iterations),
            kdfMemory: kdf.memory ?? null,
            kdfParallelism: kdf.parallelism ?? null,
          }
        : {};

  // mutate 的回调是同步的：哈希必须先算好
  const newHashPwd = await hashPassword(newMph, salt, iterations);
  await mutate(store, keys.profile(a.claims.sub), (cur) =>
    cur
      ? {
          ...cur,
          masterPasswordHash: newHashPwd,
          passwordSalt: salt,
          passwordIterations: iterations,
          key: newKey ?? cur.key,
          ...kdfFields,
          ...(hintFields ?? {}),
          securityStamp: stamp,
          updatedAt: nowIso(),
        }
      : undefined,
  );
  await revokeDevices(store, a.claims.sub);
  return c.json({});
});

// 网页版改主密码前会先在这里校验当前密码（然后才 POST /accounts/password）。
// 不实现的话它拿不到确认，界面会停在通用错误上。
app.post('/api/accounts/verify-password', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  // 这是个"密码对不对"的判定接口，必须限流，否则拿到 token 就是一个高速试密码入口
  const rl = await limit(c, 'verify-password', a.claims.sub, 10, 60);
  if (rl) return rl;
  const p = await body(c);
  const authData = p.authenticationData ?? p.masterPasswordAuthenticationData ?? {};
  const mph = String(p.masterPasswordHash ?? authData.masterPasswordAuthenticationHash ?? '');
  if (!mph) {
    return c.json({ error: 'Missing master password hash', message: 'Missing master password hash', statusCode: 400 }, 400);
  }
  if (!(await checkMasterPassword(c, a.user, mph))) {
    return c.json({ error: 'Invalid password', message: 'Invalid password', statusCode: 401 }, 401);
  }
  return c.json({});
});

app.post('/api/accounts/kdf', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  const check = await checkPassword(c, a.user, p);
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

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
  const newIterations = pbkdf2Iterations(c);
  const newMph = String(authData.masterPasswordAuthenticationHash ?? '');
  if (!newMph) return c.json({ error: 'Missing masterPasswordAuthenticationHash' }, 400);
  const stamp = newId();
  // mutate 的回调是同步的：哈希必须先算好
  const newHashKdf = await hashPassword(newMph, salt, newIterations);
  await mutate(store, keys.profile(a.claims.sub), (cur) =>
    cur
      ? {
          ...cur,
          masterPasswordHash: newHashKdf,

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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

  const store = getStore(c.env);
  await revokeDevices(store, a.claims.sub);
  await rotateStamp(store, a.claims.sub);
  return c.json({});
});

// ---------------------------------------------------------------- devices
app.get('/api/devices/knowndevice', async (c) => {
  // 这个接口会回答「该邮箱下有没有这台设备」，可用来枚举账号/设备，加限流
  const rl = await limit(c, 'knowndevice', requestIp(c), 30, 60);
  if (rl) return rl;
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

function attachmentToResponse(meta, base, env, sstamp = '-') {
  const token = makeAttachmentToken(env, { uid: meta.userId, aid: meta.id, sstamp });
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

// Bitwarden 客户端的 FileUploadType 序列化值是反的（已在 2026.8 客户端 dex 里确认）：
//   "0" = DIRECT  -> 客户端把字节 POST 给服务端（受平台请求体上限约束）
//   "1" = AZURE   -> 客户端把字节 PUT 到我们返回的 url（真正的直传）
// 所以小文件给 0 + 函数地址，大文件给 1 + 预签名 Blob 地址。

const baseUrlOf = (c) => String(envGet(c, 'BASE_URL', new URL(c.req.url).origin)).replace(/\/+$/, '');

/**
 * 二进制下载：优先**流式**返回，避免把整个对象缓冲进内存
 * （9 MB 文件缓冲时内存峰值到过 95 MB，而且大响应体容易被平台截断）。
 * 流式不可用时退回一次性缓冲，行为与以前一致。
 */
async function streamBinary(c, store, key, contentType = 'application/octet-stream', extraHeaders = {}) {
  try {
    const stream = await store.getStream(key);
    if (stream) {
      // 故意不设 content-length：head() 给出的大小来自元数据，一旦和真实字节
      // 有任何偏差，客户端就会截断或挂起。chunked 传输没有这个问题，
      // 下载功能本身也不依赖声明大小。
      const headers = { ...extraHeaders, 'content-type': contentType, 'cache-control': 'no-store' };
      return c.body(stream, 200, headers);
    }
  } catch (e) {
    console.warn('[download] stream failed, falling back to buffer:', e?.message || e);
  }
  const bytes = await store.getBinary(key);
  if (!bytes) return null;
  return c.body(bytes, 200, {
    ...extraHeaders,
    'content-type': contentType,
    'content-length': String(bytes.length),
    'cache-control': 'no-store',
  });
}

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

  // 平台请求体和响应体都有约 6 MB 限制，附件同样不能更大（传上去也下不来）。
  const uploadMax = Number(envGet(c, 'UPLOAD_MAX_BYTES', 6 * 1024 * 1024)) || 0;
  if (uploadMax && declaredSize > uploadMax) {
    return c.json(
      {
        error: `Attachment too large: this deployment accepts files up to ${(uploadMax / 1024 / 1024).toFixed(1)} MB (platform request/response body limit)`,
        limit: uploadMax,
      },
      413,
    );
  }
  const meta = {
    id,
    cipherId,
    userId: a.claims.sub,
    fileName: String(p.fileName ?? 'file'),
    fileSize: declaredSize,
    key: p.key ?? null,
    createdAt: nowIso(),
  };
  await store.put(keys.attachmentMeta(a.claims.sub, id), meta, { ifNoneMatch: '*' });

  // 安卓客户端的 AttachmentJsonResponse.Success 强制要求 fileUploadType 和
  // cipherResponse 两个字段（缺任何一个就抛 MissingFieldException），
  // 而且它会把 cipherResponse 直接渲染出来 —— 所以这里要把刚建的附件一并放进 cipher。
  const metas = (await loadAttachmentsByCipher(store, a.claims.sub)).get(cipherId) ?? [];
  const attachments = metas.map((m) => attachmentToResponse(m, baseUrlOf(c), c.env, c.get('sstamp') ?? '-'));
  const touched = await mutate(store, keys.cipher(a.claims.sub, cipherId), (cur) =>
    cur ? { ...cur, updatedAt: nowIso() } : undefined,
  );

  return c.json({
    attachmentId: id,
    // 没有对象存储的预签名能力：一律让客户端把字节 POST 回本函数（DIRECT）。
    // fileUploadType 0 = DIRECT（POST 到 url），1 = AZURE（PUT 到 url）。
    url: `${baseUrlOf(c)}/api/ciphers/${cipherId}/attachment/${id}/data`,
    fileUploadType: 0,
    cipherResponse: cipherToJson(touched ?? cipher, attachments),
  });
});

// multipart2 /
// readUpload 已移到 ./upload.js（手工 multipart 解析，见该文件顶部说明）


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

  // 字节已经在了（客户端先直传成功、又补发了一次确认请求）：直接当成功返回，
  // 免得重复上传把请求体撑爆。
  const existing = await store.getBinary(keys.attachmentData(a.claims.sub, aid)).catch(() => null);
  if (existing) return c.json({});

  let up;
  try {
    up = await readUpload(c);
  } catch (e) {
    // 平台重放同一个 Request 时 body 可能已被读过（"Body is unusable"），
    // 以前这里会直接抛成 500，客户端只能看到 Internal Error。
    console.error('[attachment] read body failed', e?.message || e);
    return c.json({ error: 'failed to read upload body' }, 400);
  }
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
  return c.json(attachmentToResponse(meta, baseUrlOf(c), c.env, c.get('sstamp') ?? '-'));
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
  let claimsStamp = null;
  if (token.split('.').length === 2) {
    const att = verifyAttachmentToken(c.env, token);
    if (!att) return c.json({ error: 'invalid attachment token' }, 401);
    uid = att.uid;
    aid = att.aid;
    claimsStamp = att.sstamp ?? '-';
  } else {
    try {
      const claims = await verifyAccess(c.env, token);
      uid = claims.sub;
      aid = c.req.param('aid');
      claimsStamp = claims.sstamp ?? null;
    } catch {
      return c.json({ error: 'unauthorized' }, 401);
    }
  }

  const store = getStore(c.env);

  // 两条路径都要过 securityStamp：否则改密/踢设备/轮换之后 /api/sync 已经 401，
  // 旧的 access token 或已签发的附件票据却还能把附件整个拉走。
  {
    const prof = (await store.get(keys.profile(uid)))?.value;
    if (!prof || !safeEqual(prof.securityStamp, claimsStamp)) {
      return c.json({ error: 'unauthorized' }, 401);
    }
  }

  const meta = (await store.get(keys.attachmentMeta(uid, aid)))?.value;
  if (!meta || meta.cipherId !== c.req.param('id')) return c.json({ error: 'not found' }, 404);

  // 附件票据同样限次，降低"链接进日志后可被反复拉取"的风险
  if (token.split('.').length === 2 && !(await consumeToken(store, token, { maxUses: 5, ttlSec: 900 }))) {
    return c.json({ error: 'attachment token already used' }, 401);
  }

  const res = await streamBinary(c, store, keys.attachmentData(uid, meta.id), 'application/octet-stream', {
    'content-disposition': `attachment; filename="${encodeURIComponent(meta.fileName)}"`,
  });
  return res ?? c.json({ error: 'not found' }, 404);
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

// Send 的 accessId 是从 id 的 16 字节派生出来的，所以 id 必须是 32 位十六进制或标准 UUID。
// 之前的实现用 Buffer.from(x,'hex')，对非十六进制是「静默截断」：'zzzz' 会得到一个空
// accessId，进而把索引写到全局共享的 idx/send/.json 上。这里改成严格判定。
const SEND_ID_RE =
  /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const accessIdFromUuid = (id) => {
  const s = String(id ?? '');
  if (!SEND_ID_RE.test(s)) return null;
  return Buffer.from(s.replace(/-/g, ''), 'hex').toString('base64url');
};

// 索引键是全局的（idx/send/{accessId}），所以写入前必须确认
// 「要么不存在，要么就是我自己这条」——否则任何人都能用
// id = hex(别人的 accessId) 把对方的分享链接顶掉。
const SEND_INDEX_CONFLICT = Symbol('send-index-conflict');
async function claimSendIndex(store, s, userId, id) {
  const key = keys.sendIndex(s);
  const cur = (await store.get(key))?.value;
  if (cur && !(String(cur.userId) === String(userId) && String(cur.id) === String(id))) {
    return SEND_INDEX_CONFLICT;
  }
  await store.put(key, { userId, id });
  // 写后回读：Blob 没有条件写，两个并发请求可能都读到"不存在"然后都写。
  // 回读一次能发现被覆盖的情况，把双写降级成"一方失败"。
  const after = (await store.get(key))?.value;
  if (!after || String(after.userId) !== String(userId) || String(after.id) !== String(id)) {
    return SEND_INDEX_CONFLICT;
  }
  return null;
}

// Send 口令的 PBKDF2 也走线程池：同步版本会阻塞事件循环，
// 实测单进程只能到 ~78 次/秒，等于把暴力破解速率钉死在那，同时拖慢所有并发请求。
async function pbkdf2B64url(value, saltB64, iterations) {
  const buf = await pbkdf2Async(String(value), Buffer.from(saltB64, 'base64url'), iterations, 32, 'sha256');
  return buf.toString('base64url');
}

async function sendPasswordHash(password) {
  if (!password) return { passwordHash: null, passwordSalt: null, passwordIter: null };
  const salt = randomBytes(16).toString('base64url');
  return {
    passwordHash: await pbkdf2B64url(password, salt, SEND_PASSWORD_ITER),
    passwordSalt: salt,
    passwordIter: SEND_PASSWORD_ITER,
  };
}

function sendHasPassword(s) {
  return Boolean(s.passwordHash);
}

async function checkSendPassword(s, candidate) {
  if (!sendHasPassword(s)) return true;
  if (!candidate) return false;
  const computed = await pbkdf2B64url(candidate, s.passwordSalt, s.passwordIter ?? SEND_PASSWORD_ITER);
  const a = Buffer.from(computed);
  const b = Buffer.from(String(s.passwordHash));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Send 口令尝试限速。
//
// 上一版按「每条 Send 累计失败 5 次就锁 15 分钟」，结果是任何拿到链接的人
// 都能用 5 个错口令把别人的分享链接锁死 —— 一个可用性 DoS。
//
// 现在改成两条独立的线：
//   · 限速按 (客户端 IP, Send) 二元组，单 IP 对单 Send 每分钟最多 10 次失败；
//     不同 IP 互不影响，所以第三方无法用自己制造的失败拖住合法接收方。
//   · **正确口令永远放行**，并顺手清零两处计数；锁定状态只作为提示，
//     不用来拒绝正确口令。
// send.failedAttempts 仍然记录，供属主判断"这条链接正在被爆破"。
const SEND_PW_MAX_FAILS_PER_MIN = 10;
const SEND_PW_SUSPICIOUS_AFTER = 5;
// 单条 Send 的累计失败软上限：到线后错误口令直接 429 并给 Retry-After。
// 这里**绝不能 sleep** —— 平台单实例并发只有 20，每个请求睡 600ms 等于把
// 「CPU 爆破」换成「并发槽耗尽」：33 req/s 就能让整个实例排队。
// 立即返回才能让请求马上释放槽位。
// 正确口令走上面的分支，永远放行。
const SEND_PW_SOFT_CAP = 50;
const SEND_PW_COOLDOWN_SEC = 60;

async function verifySendPassword(c, store, send, candidate) {
  if (!sendHasPassword(send)) return { ok: true };

  const ip = requestIp(c) ?? 'no-ip';
  const bucketKey = keys.rate(
    `send-pw/${createHash('sha256').update(`${ip}:${send.id}`).digest('hex').slice(0, 32)}`,
  );
  const now = Date.now();
  const windowMs = 60 * 1000;

  const cur = (await store.get(bucketKey))?.value;
  const sameWindow = cur && now - cur.start < windowMs;
  if (sameWindow && Number(cur.count ?? 0) >= SEND_PW_MAX_FAILS_PER_MIN) {
    return { ok: false, throttled: true, status: 429, retryAfter: SEND_PW_COOLDOWN_SEC, error: 'Too many attempts. Try again later.' };
  }

  if (await checkSendPassword(send, candidate)) {
    // 正确口令：清掉这个 IP 的失败计数和 Send 上的累计
    if (cur) await store.del(bucketKey).catch(() => {});
    if (Number(send.failedAttempts ?? 0) > 0) {
      await mutate(store, keys.send(send.userId, send.id), (x) =>
        x ? { ...x, failedAttempts: 0, updatedAt: nowIso() } : undefined,
      ).catch(() => {});
    }
    return { ok: true };
  }

  const start = sameWindow ? cur.start : now;
  await store.put(bucketKey, { start, count: (sameWindow ? Number(cur.count ?? 0) : 0) + 1, exp: start + windowMs }).catch(
    () => {},
  );
  const fails = Number(send.failedAttempts ?? 0) + 1;
  await mutate(store, keys.send(send.userId, send.id), (x) =>
    x ? { ...x, failedAttempts: fails, updatedAt: nowIso() } : undefined,
  ).catch(() => {});

  if (fails >= SEND_PW_SOFT_CAP) {
    return {
      ok: false,
      coolingDown: true,
      status: 429,
      retryAfter: SEND_PW_COOLDOWN_SEC,
      error: 'Too many failed attempts on this link',
    };
  }
  return {
    ok: false,
    suspicious: fails >= SEND_PW_SUSPICIOUS_AFTER,
    error: 'Invalid password',
  };
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
    // 不回传口令哈希：规格里这个字段恒为 null，客户端靠 authType 判断是否带口令
    password: null,
    authType: sendHasPassword(s) ? 1 : 0,
    // 给属主看的健康状态：这条链接最近被失败尝试了多少次。
    // 客户端不认这个字段，纯属诊断用 —— 否则链接"打不开"时属主完全无从判断。
    failedAttempts: Number(s.failedAttempts ?? 0),
    suspicious: Number(s.failedAttempts ?? 0) >= SEND_PW_SUSPICIOUS_AFTER,
    object: 'send',
  };
}

async function sendAccessJson(env, s) {
  const isText = Number(s.type) === SEND_TEXT;
  // token：通过密码校验后签发的短期票据。网页版下载文件 Send 时把它放进 Authorization
  // 头（sendApiService.getSendFileDownloadData 读的正是 access.token）。没有它就只能
  // 走"按 accessId 反查"的老路，那条路等于绕开密码。
  const token = await signAccess(
    env,
    { sub: 'send-access', sid: accessIdFromUuid(s.id), scope: ['api.send.access'] },
    '10m',
  );
  return {
    id: s.id,
    type: Number(s.type),
    name: s.name,
    text: isText ? s.data : null,
    file: isText ? null : s.data,
    expirationDate: s.expirationDate ?? null,
    creatorIdentifier: null,
    token,
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
  // id 会进存储键，客户端自报的 id 必须是安全字符
  if (!optionalId(p.id)) return c.json({ error: 'invalid id' }, 400);
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
    ...(await sendPasswordHash(p.password)),
  };

  const store = getStore(c.env);
  const accessId = accessIdFromUuid(id);
  if (!accessId) return c.json({ error: 'invalid send id' }, 400);
  if ((await claimSendIndex(store, accessId, a.claims.sub, id)) === SEND_INDEX_CONFLICT) {
    return c.json({ error: 'send id already in use', statusCode: 409 }, 409);
  }
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: '*' });
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

  // mutate 的回调是同步的：口令哈希要先算好
  const nextPw = p.password !== undefined ? await sendPasswordHash(p.password) : {};
  const next = await mutate(store, keys.send(a.claims.sub, c.req.param('id')), (cur) => {
    if (!cur) return undefined;
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
  // 只删属于自己的索引：否则任何人删自己的 Send 就能把别人的分享链接打断
  const accessId = accessIdFromUuid(id);
  if (accessId) {
    const idxKey = keys.sendIndex(accessId);
    const idx = (await store.get(idxKey))?.value;
    if (idx && String(idx.userId) === String(a.claims.sub)) await store.del(idxKey);
  }
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
    if (asAccess) hit = (await store.get(keys.sendIndex(asAccess)))?.value;
  }
  if (!hit) return null;
  return (await store.get(keys.send(hit.userId, hit.id)))?.value ?? null;
}

app.post('/api/sends/access/:accessId', async (c) => {
  const rl = await limit(c, 'send-access', requestIp(c), 30, 60);
  if (rl) return rl;
  const store = getStore(c.env);
  const send = await lookupSendByAccessId(store, c.req.param('accessId'));
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);

  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);

  const p = await body(c);
  const password = p.password ?? p.passwordHash ?? null;
  if (sendHasPassword(send)) {
    const pw = await verifySendPassword(c, store, send, password);
    if (!pw.ok) {
      const hdr = pw.retryAfter ? { 'retry-after': String(pw.retryAfter) } : {};
      return c.json({ error: pw.error }, pw.status ?? 401, hdr);
    }
  }

  try {
    await mutate(store, keys.send(send.userId, send.id), (cur) =>
      cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : undefined,
    );
  } catch (e) {
    console.warn('[send-access] accessCount update failed (ignored)', e?.message || e);
  }
  return c.json(await sendAccessJson(c.env, send));
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
  return c.json(await sendAccessJson(c.env, send));
});

// file Send: metadata -> binary -> anonymous download
// NOTE: /api/sends/access/file/:fileId must be registered before
// /api/sends/:id/file/:fileId, otherwise "access" is taken as a sendId.
app.post('/api/sends/access/file/:fileId', async (c) => {
  const rl = await limit(c, 'send-access-file', requestIp(c), 60, 60);
  if (rl) return rl;

  const store = getStore(c.env);
  const p = await body(c);
  const auth = (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i);
  const token = p.token ?? (auth ? auth[1] : '');

  // 网页版会带 send-access token 请求 /sends/access/file/{file.id}。
  // 新数据里 file.id 就是 Send 的 id，能直接反查；老数据写死成 'file'，所以
  // 优先用 token 里的 sid 定位，再退回按 fileId 反查。
  let send = null;
  let tokenBound = false;
  if (token) {
    try {
      const payload = await verifyAccess(c.env, token);
      // 必须限定用途：上传票据（api.send.upload）同样带 sid，不校验 scope 的话
      // 拿它就能换到带密码 Send 的下载地址，密码门直接失效。
      const scoped = Array.isArray(payload?.scope) && payload.scope.includes('api.send.access');
      if (scoped && payload?.sid != null) {
        const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
        if (idx) {
          send = (await store.get(keys.send(idx.userId, idx.id)))?.value ?? null;
          tokenBound = Boolean(send);
        }
      }
    } catch (e) {
      console.warn('[send-access] file token rejected', e?.code || e?.message || e);
    }
  }
  if (!send) send = await lookupSendByAccessId(store, c.req.param('fileId'));
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);
  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);

  // 带密码的 Send 必须先通过 /sends/access/<accessId> 换到票据才能下载。
  // 早期版本允许不带票据直接按 accessId 反查，等于把密码保护整个绕过去。
  // 兼容：客户端把密码直接内联在这个请求里也认（网页版个别路径会这么发）。
  if (sendHasPassword(send) && !tokenBound) {
    const inline = p.password ?? p.passwordHash ?? null;
    const pw = await verifySendPassword(c, store, send, inline);
    if (!pw.ok) {
      const hdr = pw.retryAfter ? { 'retry-after': String(pw.retryAfter) } : {};
      const code = pw.status ?? 401;
      return c.json({ error: pw.error, message: pw.error, statusCode: code }, code, hdr);
    }
  }

  const bytes = await store.getBinary(keys.sendFile(send.userId, send.id));
  if (!bytes) return c.json({ error: 'file not found' }, 404);

  // 网页版（Vaultwarden 2026.x）拿到的是 JSON，然后自己 fetch(url)：
  //   const t = await sendApiService.getSendFileDownloadData(send, token);
  //   if (isNullOrWhitespace(t.url)) { toast("missingSendFile"); return; }
  //   const n = await fetch(new Request(t.url, { cache: "no-store" }));
  // 所以这里必须返回带 url 的 JSON，而不是字节流。url 里带一个短期令牌，
  // 因为网页版那次 fetch 不会再带 Authorization。
  // TTL 从 1h 收到 10min：URL 会进日志/历史/Referer，暴露面越小越好。
  const downloadToken = await signAccess(
    c.env,
    {
      sub: 'send-access',
      sid: accessIdFromUuid(send.id),
      scope: ['api.send.access'],
    },
    '10m',
  );
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
  // 兼容两种带法：优先 Authorization（不进日志），退回 query（网页版那次 fetch 不带头）
  const auth = (c.req.header('authorization') || '').match(/^Bearer\s+(.+)$/i);
  const token = String(c.req.query('token') ?? (auth ? auth[1] : ''));
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

  // 票据限次使用：即使 URL 进了日志/历史，也无法被反复重放
  if (!(await consumeToken(store, token, { maxUses: 5, ttlSec: 900 }))) {
    return c.json({ error: 'access token already used', message: 'access token already used', statusCode: 401 }, 401);
  }

  // 计数放在真正吐字节这一步：文件 Send 的下载上限才真正生效
  // （此前只在 /sends/access/<accessId> 里加，绕过那条路径就完全不计）
  try {
    await mutate(store, keys.send(send.userId, send.id), (cur) =>
      cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : undefined,
    );
  } catch (e) {
    console.warn('[send-access] accessCount update failed (ignored)', e?.message || e);
  }

  const res = await streamBinary(c, store, keys.sendFile(send.userId, send.id));
  return res ?? c.json({ error: 'file not found' }, 404);
});

app.post('/api/sends/file/v2', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);
  if (Number(p.type ?? 1) !== SEND_FILE) return c.json({ error: 'invalid send type' }, 400);

  const dates = validateSendDates(p.deletionDate, p.expirationDate);
  if (dates.error) return c.json({ error: dates.error }, dates.status);

  const now = nowIso();
  // id 会进存储键，客户端自报的 id 必须是安全字符
  if (!optionalId(p.id)) return c.json({ error: 'invalid id' }, 400);
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
    ...(await sendPasswordHash(p.password)),
  };

  // 平台对**请求体和响应体**都有约 6 MB 的限制（实测 8.95 MB 的下载直接返回 413），
  // 所以即使靠直传把大文件传上去，下载也下不来 —— 干脆在创建时就说清楚。
  // 注意必须放在落库**之前**：先写再拒会留下孤儿记录，可以被无限制造。
  const functionMax = Number(envGet(c, 'UPLOAD_MAX_BYTES', 6 * 1024 * 1024)) || 0;
  if (functionMax && size > functionMax) {
    console.warn('[send] create rejected, too large', { size, functionMax });
    return c.json(
      {
        error: `File too large: this deployment accepts files up to ${(functionMax / 1024 / 1024).toFixed(1)} MB (platform request/response body limit)`,
        limit: functionMax,
      },
      413,
    );
  }

  const store = getStore(c.env);
  const accessId = accessIdFromUuid(id);
  if (!accessId) return c.json({ error: 'invalid send id' }, 400);
  if ((await claimSendIndex(store, accessId, a.claims.sub, id)) === SEND_INDEX_CONFLICT) {
    return c.json({ error: 'send id already in use', statusCode: 409 }, 409);
  }
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: '*' });
  await touchUser(store, a.claims.sub);

  // 回退：客户端 PUT 到本函数（受平台 ~6MB 请求体限制）
  const uploadToken = await signAccess(c.env, {
    sub: 'send-upload',
    sid: accessIdFromUuid(id),
    scope: ['api.send.upload'],
  });

  return c.json({
    sendResponse: sendToJson(send),
    // 0 = DIRECT：客户端会把加密后的字节 POST/PUT 到这个 url（走函数，受平台请求体限制）。
    fileUploadType: 0,
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
  // 旧通道，和 /sends/access/file/:fileId 同样的规则：限流 + 计数 + 用途校验，
  // 否则这里就成了绕过限额和暴力试口令的后门。
  const rl = await limit(c, 'send-access-legacy', requestIp(c), 30, 60);
  if (rl) return rl;

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
    const scoped = Array.isArray(payload?.scope) && payload.scope.includes('api.send.access');
    if (!scoped) return c.json({ error: 'invalid access token' }, 401);
    const idx = (await store.get(keys.sendIndex(String(payload.sid))))?.value;
    if (!idx) return c.json({ error: 'Send is not accessible' }, 404);
    send = (await store.get(keys.send(idx.userId, idx.id)))?.value;
  } else {
    send = await lookupSendByAccessId(store, c.req.param('id'));
  }
  if (!send) return c.json({ error: 'Send is not accessible' }, 404);

  const v = validateSendAccess(send);
  if (v.error) return c.json({ error: v.error }, v.status);
  if (sendHasPassword(send)) {
    const pw = await verifySendPassword(c, store, send, p.password ?? null);
    if (!pw.ok) {
      const hdr = pw.retryAfter ? { 'retry-after': String(pw.retryAfter) } : {};
      return c.json({ error: pw.error }, pw.status ?? 401, hdr);
    }
  }

  try {
    await mutate(store, keys.send(send.userId, send.id), (cur) =>
      cur ? { ...cur, accessCount: Number(cur.accessCount ?? 0) + 1 } : undefined,
    );
  } catch (e) {
    console.warn('[send-access] accessCount update failed (ignored)', e?.message || e);
  }

  const res = await streamBinary(c, store, keys.sendFile(send.userId, send.id));
  return res ?? c.json({ error: 'file not found' }, 404);
});

// ---------------------------------------------------------------- key rotation / import
app.post('/api/accounts/key-management/rotate-user-account-keys', async (c) => {
  const a = await requireAuth(c);
  if (a.error) return a.error;
  const p = await body(c);

  const check = await checkPassword(c, a.user, { masterPasswordHash: p.oldMasterKeyAuthenticationHash });
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

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
  const [cipherIdx, folderIdx, sendIdx] = await Promise.all([
    store.list(keys.ciphers(a.claims.sub)),
    store.list(keys.folders(a.claims.sub)),
    store.list(keys.sends(a.claims.sub)),
  ]);
  const curCiphers = (await mapLimit(cipherIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);
  const curFolders = (await mapLimit(folderIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);
  // sends 目录里还有 .bin（文件 Send 的字节），只取元数据
  const sendMetaIdx = sendIdx.filter((it) => it.key.endsWith('.json'));
  const curSends = (await mapLimit(sendMetaIdx, 16, async (it) => (await store.get(it.key))?.value)).filter(Boolean);

  const reqCiphers = Array.isArray(p.accountData?.ciphers) ? p.accountData.ciphers : [];
  const reqFolders = Array.isArray(p.accountData?.folders) ? p.accountData.folders : [];
  const reqSends = Array.isArray(p.accountData?.sends) ? p.accountData.sends : [];

  // 完整性校验：三个集合都必须全量提交。
  // 少提交任何一个，它就不会被重新加密，而 profile.key 已经换掉 —— 那条数据永久解不开，
  // 接口却返回 200，用户完全无感知。宁可 400 让客户端升级，也不能静默丢数据。
  const INCOMPLETE = 'All existing ciphers, folders and sends must be included in the rotation';
  if (
    reqCiphers.length !== curCiphers.length ||
    reqFolders.length !== curFolders.length ||
    reqSends.length !== curSends.length
  ) {
    return c.json({ error: INCOMPLETE }, 400);
  }
  const cipherIds = new Set(curCiphers.map((x) => x.id));
  for (const rc of reqCiphers) {
    if (!validId(rc?.id) || !cipherIds.has(rc.id)) return c.json({ error: INCOMPLETE }, 400);
  }
  const folderIds = new Set(curFolders.map((x) => x.id));
  for (const rf of reqFolders) {
    if (!validId(rf?.id) || !folderIds.has(rf.id)) return c.json({ error: INCOMPLETE }, 400);
  }
  const sendIds = new Set(curSends.map((x) => x.id));
  for (const rs of reqSends) {
    if (!validId(rs?.id) || !sendIds.has(rs.id)) return c.json({ error: INCOMPLETE }, 400);
  }

  // folderId 归属也要在写入之前全部验完：任何一条不合法就整体 400。
  // 之前是在写入循环里 continue 跳过，前面的条目已经用新密钥重写，
  // 跳过的那些仍是旧密钥 —— 半轮换等于静默数据丢失。
  const rotFolderIdOf = new Map();
  for (const rc of reqCiphers) {
    if (rc.folderId === undefined || rc.folderId === null || rc.folderId === '') {
      rotFolderIdOf.set(rc.id, undefined);
      continue;
    }
    const folder = await requireOwnFolder(store, a.claims.sub, rc.folderId);
    if (folder.error) return c.json({ error: folder.error }, 400);
    rotFolderIdOf.set(rc.id, folder.folderId);
  }

  // 先校验再动数据：下面会重写所有 entries，如果走到最后才发现缺字段而返回 400，
  // 数据已经被新密钥加密过，旧密钥再也解不开 —— 必须提前拦。
  const rotationMph = String(unlock.masterKeyAuthenticationHash ?? '');
  if (!rotationMph) return c.json({ error: 'Missing masterKeyAuthenticationHash' }, 400);
  // 客户端的 masterPasswordUnlockData 里带着 masterPasswordHint；不读它，
  // 「勾选轮换密钥」时改的提示就永远不会落库。
  const rotationHint = hasHintField(unlock) ? hintFieldsFrom(readHint(unlock)) : null;

// apply rotation: cipher payloads / folder names / attachment keys
  for (const rf of reqFolders) {
    await mutate(store, keys.folder(a.claims.sub, String(rf.id)), (cur) =>
      cur ? { ...cur, name: String(rf.name ?? cur.name), updatedAt: nowIso() } : undefined,
    );
  }
  for (const rc of reqCiphers) {
    const data = cipherDataFrom(rc);
    const fid = rotFolderIdOf.get(rc.id);
    await mutate(store, keys.cipher(a.claims.sub, String(rc.id)), (cur) =>
      cur
        ? {
            ...cur,
            data: { ...cur.data, ...data },
            folderId: fid !== undefined ? fid : cur.folderId,
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
  for (const rs of reqSends) {
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
  const iterations = pbkdf2Iterations(c);
  const newMph = rotationMph;
  const stamp = newId();
  // mutate 的回调是同步的：哈希必须先算好
  const newHashPwd = await hashPassword(newMph, salt, iterations);
  await mutate(store, keys.profile(a.claims.sub), (cur) =>
    cur
      ? {
          ...cur,
          masterPasswordHash: newHashPwd,
          passwordSalt: salt,
          passwordIterations: iterations,
          key: unlock.masterKeyEncryptedUserKey ?? unlock.masterKeyWrappedUserKey ?? cur.key,
          privateKey: p.accountKeys.userKeyEncryptedAccountPrivateKey ?? cur.privateKey,
          ...(rotationHint ?? {}),
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
  for (const f of (Array.isArray(p.folders) ? p.folders : []).slice(0, IMPORT_MAX_ITEMS)) {
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
  for (const [index, src] of (Array.isArray(p.ciphers) ? p.ciphers : []).slice(0, IMPORT_MAX_ITEMS).entries()) {
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
// 客户端 IP：只信平台注入的专有头。
//
// 实测（Makers 国内站，2026-11）：
//   eo-connecting-ip : 123.12.70.167                                  <- 真实客户端
//   x-real-ip        : 11.163.36.137                                  <- 边缘节点，不是客户端
//   x-forwarded-for  : 123.6.40.114, 11.163.36.137, 10.132.167.133    <- 客户端, 边缘, SCF 内网
//
// 所以 x-real-ip 和 x-forwarded-for 都不能用来做客户端标识：
// 前者是所有人共用的边缘节点地址（限流会误伤全部用户），
// 后者含内网段，取第一段可被客户端伪造、取最后一段是 10.x。
// 拿不到可信头时返回 null，由调用方跳过这一维度，而不是退化成一个共享值。
const PLATFORM_IP_HEADERS = ['eo-connecting-ip', 'true-client-ip', 'cf-connecting-ip'];

const requestIp = (c) => {
  for (const h of PLATFORM_IP_HEADERS) {
    const v = (c.req.header(h) || '').trim();
    if (v) return v;
  }
  return null;
};

// 请求 IP 与签发时记录的 IP 是否不一致。
// 任何一方缺失（平台没注入可信头）时不参与判断——否则在国际站上
// "login with device 必须同 IP" 会把所有合法设备判成不匹配，功能直接不可用。
// 这个降级是有意的：accessCode 本身才是主要凭据，IP 只是纵深防御的一层。
const ipMismatch = (recorded, current) => Boolean(recorded) && Boolean(current) && String(recorded) !== String(current);
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
  // 这个接口不需要登录就能写存储：必须限流，否则可以被用来刷存储、刷受害者的待批准列表
  const rl = await limit(c, 'auth-request', requestIp(c), 10, 60);
  if (rl) return rl;
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

  // 待批准列表要有上限：否则这个免登录接口能一直往受害者列表里塞记录
  const pending = await store.list(keys.authRequests(user.id));
  if (pending.length >= 20) {
    return c.json({ error: 'Too many pending auth requests', statusCode: 429 }, 429);
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
  // 批准/拒绝时要比对客户端给的 accessCode，错太多次要限流，避免被用来暴力猜
  const rl = await limit(c, 'auth-request-approve', a.claims.sub, 20, 60);
  if (rl) return rl;
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
  // 这个端点要拿 accessCode 去比，必须限流，否则就是一条免认证的爆破通道
  const rl = await limit(c, 'auth-request-response', requestIp(c), 20, 60);
  if (rl) return rl;
  const store = getStore(c.env);
  const hit = (await store.get(keys.authRequestIndex(c.req.param('id'))))?.value;
  if (!hit) return c.json({ error: "AuthRequest doesn't exist" }, 400);
  const ar = (await store.get(keys.authRequest(hit.userId, hit.id)))?.value;
  if (!ar) return c.json({ error: "AuthRequest doesn't exist" }, 400);

  const code = String(c.req.query('code') ?? '');
  if (
    Number(ar.deviceType) !== requestDeviceType(c) ||
    ipMismatch(ar.requestIp, requestIp(c)) ||
    !safeEqual(ar.accessCode, code)
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
    ...(await sendPasswordHash(f.password)),
  };
  // 旧 multipart 通道：同样要校验 id、占用索引前先查冲突、并遵守上传大小上限
  const legacyAccessId = accessIdFromUuid(id);
  if (!legacyAccessId) return c.json({ error: 'invalid send id' }, 400);
  const legacyMax = Number(envGet(c, 'UPLOAD_MAX_BYTES', 6 * 1024 * 1024)) || 0;
  if (legacyMax && up.bytes.length > legacyMax) {
    return c.json({ error: 'File too large', limit: legacyMax }, 413);
  }
  if ((await claimSendIndex(store, legacyAccessId, a.claims.sub, id)) === SEND_INDEX_CONFLICT) {
    return c.json({ error: 'send id already in use', statusCode: 409 }, 409);
  }
  await store.put(keys.send(a.claims.sub, id), send, { ifNoneMatch: '*' });
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
  if (check.error) return c.json({ error: check.error, message: check.error, statusCode: check.status }, check.status);

  const store = getStore(c.env);
  const root = `u/${a.claims.sub}/`;
  const items = await store.list(root);

  // drop the Send accessId index first (derived from id), then the rest
  for (const it of items) {
    if (!it.key.includes('/sends/') || !it.key.endsWith('.json')) continue;
    const v = (await store.get(it.key))?.value;
    if (v?.id) {
      const sendAccess = accessIdFromUuid(v.id);
      if (sendAccess) {
        const idxKey = keys.sendIndex(sendAccess);
        const idx = (await store.get(idxKey))?.value;
        if (idx && String(idx.userId) === String(a.claims.sub)) await store.del(idxKey);
      }
    }
  }
  // 登录批准用的索引是全局键（idx/authreq/{id}），删号时必须一起清掉，否则会留垃圾
  for (const it of items) {
    if (!it.key.includes('/auth-requests/') || !it.key.endsWith('.json')) continue;
    const v = (await store.get(it.key))?.value;
    if (v?.id) await store.del(keys.authRequestIndex(v.id));
  }
  for (const it of items) await store.del(it.key);

  await store.del(keys.email(emailKey(a.user.email)));
  return c.json({});
}
app.delete('/api/accounts', deleteAccount);
app.post('/api/accounts/delete', deleteAccount);

// ---------------------------------------------------------------- fallback
// 不存在的路径一律 404。网页版用的是 hash 路由（/#/login），不存在需要服务端兜底的
// 前端深链接，所以这里不必把未知路径改写成 index.html。
function notFoundPage(c) {
  const base = baseUrlOf(c);
  const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>404 · 页面不存在</title>
<style>
 body{font-family:-apple-system,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;max-width:640px;margin:64px auto;padding:0 24px;color:#1f2328;line-height:1.7}
 .code{font-size:64px;font-weight:600;letter-spacing:-2px;color:#8c959f;margin:0}
 h1{font-size:20px;margin:8px 0 16px}
 a{color:#0969da}
</style></head><body>
<p class="code">404</p>
<h1>这个页面不存在</h1>
<p>地址可能输错了，或者页面已经被移动。</p>
<p><a href="${base}/">返回密码库</a></p>
</body></html>`;
  return c.html(html, 404);
}

// 没部署网页版时（public/ 为空），浏览器的 /favicon.ico 和爬虫的 /robots.txt 也会落到函数，
// 每来一次就是一次冷启动+调用。给这两个固定路径便宜的回答，并让 CDN/浏览器缓存住。
app.get('/favicon.ico', (c) => c.body(null, 204, { 'cache-control': 'public, max-age=86400' }));
app.get('/robots.txt', (c) =>
  c.text('User-agent: *\nDisallow: /\n', 200, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  }),
);

app.all('*', (c) => {
  const path = new URL(c.req.url).pathname;
  const method = c.req.method;
  const accept = c.req.header('accept') ?? '';
  // 浏览器在要页面 -> HTML 404；接口和静态资源 -> JSON 404（别返回 501，
  // 那只会在控制台刷一堆「服务器错误」）
  const hasExt = /\.[a-z0-9]{2,5}$/i.test(path);
  const isHtmlFile = /\.html?$/i.test(path);
  const pageLike =
    (method === 'GET' || method === 'HEAD') &&
    accept.includes('text/html') &&
    !/\/(api|identity)(\/|$)/.test(path) &&
    (!hasExt || isHtmlFile);
  if (pageLike) return notFoundPage(c);
  return c.json({ error: 'not_found', path }, 404, { 'cache-control': 'no-store' });
});

// 网页版部署在 /vault/ 子路径下时，它在拿到 /api/config 之前会用**相对路径**请求：
//   GET  /vault/api/config
//   POST /vault/identity/connect/token
// 这些请求进不到 /api/* 或 /identity/*，于是配置加载失败、客户端退化成相对地址，
// 最终报 "501 Not Implemented against /vault/identity/connect/token"。
// 把同一套路由再挂一份到 /vault 下即可；拿到 config 后客户端会改用其中的绝对地址。
const exported = new Hono();
exported.use('*', cors(corsOptions));
// 网页版直接构建在站点根（public/index.html）。这里不再给 / 和 /index.html 注册
// 任何特殊处理：构建成功时静态层会先命中，构建失败（或 WEB_VAULT_ENABLED=false）
// 就让请求落到下面的兜底 404，交给 CDN/平台自己的处理，函数不插手。
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
