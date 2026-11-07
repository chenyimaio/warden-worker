# warden-edgeone

把 [warden-worker](https://github.com/qaz741wsd856/warden-worker) 的 Bitwarden 兼容后端重写到 **EdgeOne Makers**（国内站，已备案域名）上：
**Cloud Functions (Node.js) + Makers Blob 存储 + 项目内直连 SMTP**。

> 这不是把 Rust/WASM 搬过去，而是按 Rust 源码当行为规范重写：
> EdgeOne 的 Edge Functions 只支持 JS、CPU 200 ms、body 1 MB，没有 SQL、没有 Durable Object、没有 cron，
> 而 warden-worker 的 `D1 + do + worker-build` 全部依赖这些特性。

[![使用 EdgeOne Makers 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?project-name=warden-edgeone&repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&build-command=npm%20run%20build&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE%2CSMTP_HOST%2CSMTP_PORT%2CSMTP_SECURE%2CSMTP_USER%2CSMTP_PASS%2CMAIL_FROM%2CMAIL_FROM_NAME)

## 一键部署（Makers）

| 站点 | 链接 |
|---|---|
| 国内站 | [一键部署（console.cloud.tencent.com）](https://console.cloud.tencent.com/edgeone/pages/new?project-name=warden-edgeone&repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&build-command=npm%20run%20build&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE%2CSMTP_HOST%2CSMTP_PORT%2CSMTP_SECURE%2CSMTP_USER%2CSMTP_PASS%2CMAIL_FROM%2CMAIL_FROM_NAME) |
| 国际站 | [一键部署（edgeone.ai）](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE%2CSMTP_HOST%2CSMTP_PORT%2CSMTP_SECURE%2CSMTP_USER%2CSMTP_PASS%2CMAIL_FROM%2CMAIL_FROM_NAME) |

两个链接都会预填：仓库/分支 `edgeone`、根目录 `edgeone`、安装 `npm ci`、构建 `npm run build`、13 个环境变量名；输出目录留空。

手动建项目时的构建配置：

| 项 | 值 |
|---|---|
| 根目录 | **留空（仓库根）** — 平台只在仓库根识别 `cloud-functions/` |
| 安装命令 | `cd edgeone && npm ci` |
| 构建命令 | `cd edgeone && npm run build`（esbuild 打包后端） |
| 输出目录 | `edgeone/public` |
| Node 版本 | `20.18.0`（根 `edgeone.json` 已指定） |
| 函数入口 | `cloud-functions/[[default]].js`（构建时生成，仓库里是占位） |

> **为什么必须是仓库根**：EdgeOne 按仓库内容判断"有没有 Node 后端"。缺 `cloud-functions/[[default]].js` 时它会走
> 「pure project」模式，`/api/*` 被当成静态路径落到 `index.html`（我们就这么踩过一次 404）。

环境变量清单与验收步骤见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 目录

```
src/index.js    业务路由（全量对齐上游，见第五节）
src/store.js    存储抽象（get/put/del/list/head + 二进制）+ key 布局 + 撰写策略
src/crypto.js   PBKDF2 校验、TOTP、HS256 令牌、remember/refresh 令牌
src/mail.js     nodemailer 直连 SMTP + 主密码提示模板
src/makers.js   Makers 入口适配（同时导出 4 种签名形态）
src/dev.js      本地 node 运行器
scripts/        smoke / acceptance / parity / bench-sync / blob-adapter-test / blob-selftest / test-smtp
docs/DEPLOY.md  部署与验收手册（含故障对照表）
```

## 一、先说清楚：Blob 当库的三个代价

你选了 Makers Blob。可以做，但必须接受下面这些，代码里已经按此设计：

| 能力 | Postgres | Blob（本方案） |
|---|---|---|
| 条件查询 / 二级索引 | ✅ | ❌ 只能前缀 List，索引得自己维护 |
| 事务 / 批量原子写 | ✅ | ❌ 逐对象写，失败要补偿 |
| 并发写同一条目 | 行锁 | **乐观锁**：ETag + `If-Match`，冲突重试 |
| `/api/sync` | 1 条 SQL | 1 次 List + N 次 Get（16 并发，见 `mapLimit`） |
| 密钥轮换的「全量校验」 | `EXCEPT` 一条 SQL | 先 List 再比对（逻辑等价，但非原子） |

**必须先验证的一件事**：Makers Blob 的 GET/PUT 是否返回 / 接受 ETag（`If-Match`、`If-None-Match: *`）。
- 支持 → `mutate()` 的乐观锁直接生效，多设备并发安全。
- 不支持 → 把 `BlobStore.put` 里的条件检查去掉、`mutate()` 的 `retries` 设为 1，语义退化成「后写胜」，**多端同时改同一条目会丢改动**；那种情况建议改成 Postgres。

Key 布局（每用户一个前缀，List 只扫单用户，不扫全桶）：

```
idx/email/{sha256(email)}.json     -> { userId }
u/{userId}/profile.json
u/{userId}/devices/{deviceId}.json
u/{userId}/folders/{folderId}.json
u/{userId}/ciphers/{cipherId}.json
u/{userId}/sends/{sendId}.json
u/{userId}/attachments/{attachmentId}      二进制
u/{userId}/twofactor/{atype}.json
```

## 二、SMTP：项目内直连，但只能在 Cloud Functions

- **Edge Functions 发不了信**：没有 TCP socket，只有 `fetch`。
- **Cloud Functions (Node.js) 可以**：`nodemailer` 直连 465/587，代码就在 `src/mail.js`，不接任何第三方 HTTP 邮件 API。
- 唯一风险是**出站端口是否放行**。部署后先在函数里跑一次自测：

```bash
SMTP_HOST=smtp.qcloudmail.com \
SMTP_USER=no-reply@example.com \
SMTP_PASS=*** \
MAIL_FROM=no-reply@example.com \
node scripts/test-smtp.mjs --send
```

会依次探测 `465,587,25,2525`，再真发一封。返回码会打到日志（`info.response`），SES 的拒信原因只能从这里看到。

腾讯云 SES 侧要做：验证发信域名 → 配 SPF/DKIM →（若用模板）审核模板。个人可申请，别用 `@qq.com` 之类公共域当发信人。

## 三、本地跑通（不依赖 EdgeOne）
```bash
cd warden-edgeone
npm i
cp .env.example .env      # 填 ALLOWED_EMAILS / JWT_* ；MAIL_DRY_RUN=true
npm run dev               # http://127.0.0.1:8787
```

冒烟：

```bash
# 1) 配置
curl -s localhost:8787/api/config | head -c 400

# 2) 预登录（未注册也应返回默认 KDF）
curl -s -X POST localhost:8787/api/accounts/prelogin \
  -H 'content-type: application/json' -d '{"email":"a@example.com"}'

# 3) 注册（kdf.enc 由客户端算；这里只验证链路）
curl -s -X POST localhost:8787/api/accounts/register \
  -H 'content-type: application/json' \
  -d '{"email":"a@example.com","name":"A","masterPasswordHash":"x","key":"k","userAsymmetricKeys":{"encryptedPrivateKey":"p","publicKey":"pub"},"kdf":0,"kdfIterations":600000}'

# 4) 取 token（form 表单，和客户端一致）
curl -s -X POST localhost:8787/identity/connect/token \
  -H 'content-type: application/x-www-form-urlencoded' \
  -d 'grant_type=password&username=a@example.com&password=x&scope=api+offline_access&client_id=web&deviceType=10&deviceIdentifier=d1&deviceName=dev'

# 5) 主密码提示（MAIL_DRY_RUN=true 时只打日志）
curl -s -X POST localhost:8787/api/accounts/password-hint \
  -H 'content-type: application/json' -d '{"email":"a@example.com"}'
```

> `masterPasswordHash` 必须是客户端真算出来的值，否则第 4 步的 PBKDF2 校验过不了。
> 正式联调请直接用官方客户端指向该地址，而不是手写 curl。

## 三·五、限流与实时同步降级

**限流**（存进 store，固定窗口，超限返回 429 + `Retry-After`）：

| 目标 | 限制 |
|---|---|
| 注册 | 10 次/分/IP |
| 登录 | 20 次/分/邮箱 + 60 次/分/IP |
| 主密码提示邮件 | **3 次/分/邮箱** + 10 次/分/IP（防邮件轰炸） |
| Send 匿名访问 | 30 次/分/IP |

> 语义是**近似**的：Blob 最终一致 + 多实例并发时可能多放行几次。挡脚本够用，不能当精确配额。

**实时同步**：`/notifications/hub` 返回 `426 websocket_not_supported`。Bitwarden 客户端收到后会回退到轮询 `/api/sync`，功能不受影响，只是不再"秒同步"。Makers 没有 Durable Object 等价物，这一条无法补齐。



## 四、部署到 EdgeOne Makers（国内站）

完整步骤、验收顺序、故障对照表见 [docs/DEPLOY.md](docs/DEPLOY.md)。下面是速览。

### 环境变量全表

| 变量 | 必填 | 说明 |
|---|---|---|
| `BASE_URL` | ✅ | 对外地址（邮件链接、附件/文件 Send 的 url 都基于它） |
| `ALLOWED_EMAILS` | ✅ | 注册白名单，glob 逗号分隔；留空 = 关闭注册 |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | ✅ | 两个独立随机串，泄露即可伪造令牌 |
| `PASSWORD_ITERATIONS` | ⬜ | 服务端 PBKDF2 迭代数，默认 600000 |
| `STORE_DRIVER` | ✅ | `blob`（Makers）/ `memory`（本地） |
| `BLOB_STORE` | ⬜ | Blob 命名空间，默认 `warden` |
| `BLOB_PROJECT_ID` / `BLOB_TOKEN` | ⬜ | 仅外部脚本/CI 用；Functions 内自动鉴权 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | ✅ | 发信；SES 用 `smtp.qcloudmail.com:465` |
| `SMTP_USER` / `SMTP_PASS` | ✅ | SMTP 凭据 |
| `MAIL_FROM` / `MAIL_FROM_NAME` | ✅ | 发信人，必须是已验证的发信域名 |
| `MAIL_DRY_RUN` | ⬜ | `true` 时只打日志不发信，本地联调用 |
| `MAIL_ENABLED` | ⬜ | `false` 关闭全部发信（缺省开启） |
| `WEB_VAULT_ENABLED` | ⬜ | 默认 `true`：根路径跳 `/vault/`（官方网页版）；`false` 只显示落地页。**关闭后 Send 分享链接仍会转到 `/vault/` 渲染** |
| `HINT_ENCRYPTION_SECRET` | ⬜ | 默认 `*` = 主密码提示明文存储；设为任意随机串则用 **Argon2id 派生密钥 + AES-256-GCM** 加密存储。**启用后不可更换/丢失** |
| `PORT` | ⬜ | 仅 `src/dev.js` 本地调试用，默认 8787 |
| `ATTACHMENT_MAX_BYTES` | ⬜ | 单附件上限，超了返 413 |
| `ALLOW_TOTP_DRIFT` | ⬜ | 默认 `true`，允许 TOTP ±1 步 |

### 步骤

1. **建项目**：Makers 控制台 → 导入 Git 仓库（你的 fork）→ 框架选「其他 / Node」。
2. **构建**：`npm ci --omit=dev`（纯 ESM，无构建步骤）。
3. **Functions**：Cloud Functions → Node.js，入口指向 `src/makers.js`（按控制台模板微调导出签名）。
4. **路由绑定**：`/api/*`、`/identity/*` → 该云函数。
5. **环境变量**：按上表填（密钥类用控制台的加密变量）。
6. **Blob**：命名空间由 `getStore(name)` 首次调用自动创建；免费版 1 GB。
7. **自定义域名**：绑已备案域名 + 免费证书。
8. **冒烟**：`/api/alive` → `/api/config` → 官方客户端登录。

### 联调顺序（建议照着走）

1. `GET /api/alive` → 返回时间戳
2. `GET /api/config` → `version/environment/featureStates` 正常
3. 客户端登录 → 拿 token → `/api/sync` 空库
4. 建条目 → 改 → 软删 → 恢复 → 清空回收站
5. 传附件 → 下载附件（验证 Blob 二进制通道）
6. 建文本 Send / 文件 Send → 匿名访问（验证 accessId + 次数上限）
7. 开 TOTP → 重新登录（验证 2FA 挑战 + remember device）
8. 改密 → 确认旧设备被踢

### Blob 适配（已按官方 SDK 接通）

依赖 `@edgeone/pages-blob`，`src/store.js` 的 `BlobStore` 已实现：

```js
store.get(key, { type: 'json', consistency: 'strong' })  // 强一致读
store.setJSON(key, value) / store.set(key, arrayBuffer)   // 写（附件走二进制）
store.delete(key)
store.list({ prefix, consistency: 'strong' })             // -> { blobs: [{ key, etag }] }
store.getMetadata(key)                                    // -> { etag, contentType }
```

**三个必须知道的限制（已写进代码注释和 mutate()）**：

1. **没有条件写**。SDK 的 `set(..., { onlyIfNew })` 文档明确写「底层不强制、不要用于加锁」，
   也没有 `If-Match`。所以 `mutate()` 退化为「强一致读 → 写 → 强一致回读校验 → 不一致按最新基线重放」。
   能发现覆盖并按新状态重放，**但不是原子的**；单用户密码库够用，要严格事务只能换 Postgres。
2. **默认最终一致**。所有读都显式传 `consistency: 'strong'`，否则登录后立刻 sync 可能读到旧数据。
3. **免费版 1 GB**，超额抛 `QuotaExceededError`（`reason: storage`）。附件是主要占用方，需要在上传前算配额。

命名空间：`BLOB_STORE`（默认 `warden`）。Functions 内自动鉴权只需该名字；外部脚本用 `BLOB_PROJECT_ID` + `BLOB_TOKEN`。

自测（外部模式，控制台生成 API Token）：

```bash
BLOB_PROJECT_ID=pages-xxxx BLOB_TOKEN=xxx node scripts/blob-selftest.mjs
```

会验证：写入 → 强一致读 → list → getMetadata(etag) → 删除 → 确认已删。

## 五、路由对齐清单（全量）

**证据**：`npm run parity` 会解析 `vendor/warden-worker/src/router.rs`，与 Hono 实际注册的路由做集合比对。

```
Rust 路由（方法+路径）: 102
本实现注册路由:        109
未实现 (0):            ✅
额外/差异路径 (7):     ➕ 见下
```

多出来的 7 条都是**有意为之**：

| 额外路由 | 原因 |
|---|---|
| `GET …/attachment/{id}/download` | Blob 没有预签名读取，用带 token 的下载端点代替 |
| `PUT …/attachment/{id}/data`、`PUT …/azure-upload` | 客户端会把 `attachment/v2` 返回的 url 直接 PUT 上来，两个路径都接 |
| `POST /api/accounts/prelogin`、`/register`、`/register/finish`、`/register/send-verification-email` | 上游只挂 `/identity/*`，但 Vaultwarden 客户端两种都调，双挂更稳 |


✅ 已实现　⬜ 待迁移　⛔ 平台/产品不支持

**meta / config**
✅ `/api/config` `/api/alive` `/api/now` `/api/version`　⬜ `/api/hibp/breach`　⬜ `/api/tasks`

**accounts**
✅ `/api/accounts/prelogin` `/api/accounts/prelogin/password` ✅ `/api/accounts/register` `/register/finish`
✅ `/api/accounts/profile`(GET/POST/PUT) ✅ `/api/accounts/revision-date` ✅ `/api/accounts/password-hint`
✅ `/api/accounts/password`（改密）✅ `/api/accounts/kdf` ✅ `/api/accounts/security-stamp`
⬜ `/api/accounts/key-management/rotate-user-account-keys` ⬜ `/api/accounts/avatar`
⬜ `DELETE /api/accounts` `/api/accounts/delete` ⬜ `/identity/accounts/register/send-verification-email`

**identity**
✅ `POST /identity/connect/token`（`password`、`refresh_token`）
⬜ `send_access` grant ⬜ `client_credentials`（API Key，服务端本来也不支持）

**sync**
✅ `/api/sync`　⬜ `excludeDomains` 参数、`sends`/`domains` 真实数据

**ciphers**
✅ list / get / create / create-simple / update / delete / soft-delete / restore
✅ `/details` `/partial` `/archive` `/unarchive`（单条 + 批量）`/move` `/purge` `/delete`(bulk)
✅ **附件**：`attachment/v2` 建单 → `PUT …/data` 上传密文 → `GET …/download?token=` 下载 → `DELETE`
✅ 附件元数据会内联进 `sync` / `list` / `get` 的 cipher（`attachments[]`，含带 token 的下载 url）
⬜ `/import`（客户端已在前端解析后走 create，优先级低）

**folders**
✅ list / create / update / delete　⬜ `POST /{id}/delete`

**sends**
✅ list / create(文本) / get / update / delete / remove-password
✅ `POST /api/sends/access/{accessId}`（匿名访问：密码校验 + `maxAccessCount` + 过期/删除时间）
✅ `POST /api/sends/access`（access token 通道）
✅ `/identity/connect/token` `grant_type=send_access`（发短期 `api.send.access` token）
✅ `accessId` 与 warden-worker 一致：`base64url_nopad(uuid 的 hex 字节)`
✅ **文件 Send**：`/api/sends/file/v2`（返回 `sendResponse + url`）→ `POST /api/sends/{id}/file/{id}` 上传 → `POST /api/sends/{id}/access/file/{id}` 匿名下载（二进制走 store）

**2FA / devices / auth-requests**
✅ `/api/two-factor`(列表) ✅ `/api/two-factor/get-authenticator` ✅ `authenticator`(POST/PUT/DELETE)
✅ `/api/two-factor/disable`(POST/PUT) ✅ `/api/two-factor/get-recover`
✅ 登录 2FA 挑战：TOTP(0) / Remember(5) / RecoveryCode(8)，含重放保护与一次性恢复码
✅ `/api/devices`(list) ✅ `/api/devices/knowndevice`
✅ `/api/devices/identifier/{id}`(GET / token / clear-token)
✅ `/api/accounts/avatar` ✅ `DELETE /api/accounts` `/api/accounts/delete`（校验主密码后清空全部对象）
✅ 桩路由按上游返回：`/api/tasks` `/api/hibp/breach` `/api/webauthn` `/api/emergency-access/*`
✅ `/api/settings/domains`（读/写，存进 profile）
✅ **auth-requests**：`POST /api/auth-requests`、`/pending`、`GET/PUT /{id}`、`GET /{id}/response?code=`
✅ 登录支持 `authrequest`（access code 代替主密码，校验 IP / 设备类型 / 设备标识）
✅ `/api/accounts/key-management/rotate-user-account-keys`（校验主密码 / KDF 一致 / 公钥不变 / 全量包含，轮换后旧 token 立即失效）
✅ `/api/ciphers/import`（`ciphers + folders + folderRelationships` 结构，文件夹关系映射）

> 鉴权已校验 `securityStamp`：改密 / 换 KDF / security-stamp 之后，旧 access token 立即 401（测试里已验）。

**明确不做**
⛔ 组织 / Collections / 共享 / SSO / SCIM / 管理后台 / 审计 / 紧急访问（与上游 warden-worker 一致）
⛔ Passkey 登录（上游也只是空列表桩）

## 六、里程碑

| 阶段 | 内容 | 验收 |
|---|---|---|
| M1 | 本地 memory 存储跑通 config/prelogin/register/token/sync | 本文档第三节 curl 全绿 |
| M2 | Blob 五原语接通 + 乐观锁实测 | 并发写同一条目不丢改动 |
| M3 | 官方客户端（Web/Android）登录 + 条目 CRUD 联调 | 客户端可增删改同步 |
| M4 | Send + 附件（走 Blob 二进制） | 客户端能发/收 Send 与附件 |
| M5 | 2FA(TOTP) + 设备 + 密钥轮换 + 改密 | 与上游行为对齐 |

## 七、风险清单

1. **Blob 没有条件写**（SDK 的 `onlyIfNew` 明确不生效）→ 并发改同一对象可能丢改动；已用「强一致回读 + 重放」兜底，非原子。要强一致请换 Postgres。
2. **SMTP 出站未知** → 465/587 被拦则发信失败（`scripts/test-smtp.mjs` 先测）。
3. **限流是近似值** → Blob 最终一致 + 多实例，计数会漂移；挡脚本够用，不能当配额。
4. **`/api/sync` 延迟来自网络往返，不是 CPU**：实测 500 条 → 响应 367 KB、CPU+序列化 **5 ms**（内存存储，即网络为 0 的下限）；但 Blob 上每个对象一次 GET，16 路并发 = **32 轮往返**，按 20–50 ms RTT 估 **0.6–1.6 s**。要再快只能把条目聚合成单对象（一次 Get 拿全库），代价是写入要改成读改写整包。复现：`node scripts/bench-sync.mjs 500`。
5. **冷启动**：Cloud Functions 冷启动会放大登录首包延迟（客户端有重试，影响可接受）。
6. **实时同步降级**：无 WebSocket，客户端退回轮询（功能正常，不再秒同步）。
7. **客户端字段兼容**：`profile`/`cipher`/`token` 字段集按 Rust 源码对齐，但**必须用真客户端联调**修正（尤其 `userDecryption` / `permissions` / `MasterPasswordUnlock`）。
8. **备份**：Blob 没有版本控制，删号不可逆；必须自建导出（见 DEPLOY.md 第 8 节）。

## 七·五、开发注意（踩过的坑）

1. **别用 PowerShell 的 `Get-Content ... | Set-Content` 改本仓库的 `.js`**：Windows 下会按 GBK 重编码，中文注释会被打成乱码、甚至吃掉换行。本项目踩过一次，靠 `node --check` + 126 项测试才发现并逐行修复。请用支持 UTF-8 的编辑器。
2. **新增路由后必须跑 `npm run parity`**：Hono 按注册顺序匹配，静态路径（`/api/ciphers/import`、`/api/sends/file/v2`）如果排在 `/:id` 后面就会被吃掉，表现为"接口返回 200 但什么都没做"。这个坑踩过两次。
3. **附件下载 token 是 2 段式 HMAC**（10 分钟、绑定 uid + 附件 id），不要图省事把 access token 拼到 URL 里——URL 会进访问日志和浏览器历史。

## 八、边界说明
已做：全量路由（`npm run parity` 0 缺口）、附件与文件 Send、2FA/remember/恢复码、login with device、密钥轮换、导入、限流、Blob 二进制通道、SMTP 发信、契约测试与 CI。

未做（受平台或凭据限制）：

- **真机部署**：需要你的仓库、控制台和 `BLOB_PROJECT_ID/TOKEN`，我没有这些凭据。
- **WebSocket 实时同步**：Makers 无 Durable Object 等价物，只能降级为轮询。
- **`edgeone.json`**：控制台会生成模板，我不凭猜测造配置；需要时按模板补 `functions` 段即可。
