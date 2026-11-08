# warden-edgeone

把 [warden-worker](https://github.com/qaz741wsd856/warden-worker) 的 Bitwarden 兼容后端重写到 **EdgeOne Makers**（国内站，已备案域名）上：
**Cloud Functions (Node.js) + Makers Blob 存储 + 可选的项目内直连 SMTP**。

> 这不是把 Rust/WASM 搬过去，而是按 Rust 源码当行为规范重写：
> EdgeOne 的 Edge Functions 只支持 JS、CPU 200 ms、body 1 MB，没有 SQL、没有 Durable Object、没有 cron，
> 而 warden-worker 的 `D1 + do + worker-build` 全部依赖这些特性。

[![使用 EdgeOne Makers 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?project-name=warden-edgeone&repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&build-command=npm%20run%20build&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE)

## 目录

- [一、能做什么](#一能做什么)
- [二、一键部署](#二一键部署)
- [三、目录结构](#三目录结构)
- [四、环境变量（完整说明）](#四环境变量完整说明)
- [五、手动部署步骤](#五手动部署步骤)
- [六、本地开发](#六本地开发)
- [七、部署后验收](#七部署后验收)
- [八、技术说明](#八技术说明)
- [九、路由对齐清单](#九路由对齐清单)
- [十、里程碑](#十里程碑)
- [十一、风险清单](#十一风险清单)
- [十二、开发注意（踩过的坑）](#十二开发注意踩过的坑)
- [十三、边界说明](#十三边界说明)

## 一、能做什么

| 能力 | 状态 |
|---|---|
| 官方客户端登录（Web Vault / Android / 浏览器扩展） | ✅ |
| 条目 / 文件夹 增删改查、软删、恢复、回收站 | ✅ |
| 附件上传下载（走 Blob 二进制通道） | ✅ |
| 文本 Send / 文件 Send（含匿名访问、次数上限、密码保护） | ✅ |
| TOTP 两步验证、记住设备、恢复码 | ✅ |
| 登录批准（login with device / auth-requests） | ✅ |
| 改主密码、换 KDF、密钥轮换（旧令牌立即失效） | ✅ |
| 主密码提示邮件 | ⬜ 可选（不配 SMTP 就不发） |
| 实时同步（WebSocket） | ⛔ 平台不支持，自动降级为轮询 |
| 组织 / 共享 / SSO / SCIM / 紧急访问 | ⛔ 与上游一致，不做 |

## 二、一键部署

| 站点 | 链接 |
|---|---|
| 国内站 | [一键部署（console.cloud.tencent.com）](https://console.cloud.tencent.com/edgeone/pages/new?project-name=warden-edgeone&repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&build-command=npm%20run%20build&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE) |
| 国际站 | [一键部署（edgeone.ai）](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE) |

两个链接都会预填：仓库/分支 `edgeone`、根目录 `edgeone`、安装 `npm ci`、构建 `npm run build`、6 个必需环境变量名。

手动建项目时的构建配置：

| 项 | 值 |
|---|---|
| 根目录 | **留空（仓库根）** — 平台只在仓库根识别 `cloud-functions/` |
| 安装命令 | `cd edgeone && npm ci` |
| 构建命令 | `cd edgeone && npm run build`（esbuild 打包后端 + 下载网页版） |
| 输出目录 | `edgeone/public` |
| Node 版本 | `20.18.0`（根 `edgeone.json` 已指定） |
| 函数入口 | `cloud-functions/[[default]].js`（构建时生成，仓库里是占位） |

> **为什么必须是仓库根**：EdgeOne 按仓库内容判断"有没有 Node 后端"。缺 `cloud-functions/[[default]].js` 时它会走
> 「pure project」模式，`/api/*` 被当成静态路径落到 `index.html`（踩过这个 404）。

环境变量清单与验收步骤见 [docs/DEPLOY.md](docs/DEPLOY.md)。

## 三、目录结构

```
src/index.js    业务路由（全量对齐上游，见第九节）
src/store.js    存储抽象（get/put/del/list/head + 二进制）+ key 布局 + 写入策略
src/crypto.js   PBKDF2 校验、TOTP、HS256 令牌、remember/refresh 令牌
src/upload.js   手工 multipart 解析（平台不支持 parseBody 的 FormData）
src/mail.js     nodemailer 直连 SMTP + 主密码提示模板（可选功能）
src/makers.js   Makers 入口适配（同时导出 4 种签名形态）
src/dev.js      本地 node 运行器
scripts/        smoke / acceptance / parity / bench-sync / test-upload / test-smtp / blob-selftest …
docs/DEPLOY.md  部署与验收手册（含故障对照表）
```

## 四、环境变量（完整说明）

### 4.1 必填（5 个）

| 变量 | 默认 | 说明 |
|---|---|---|
| `BASE_URL` | 无 | 对外访问地址，**必须与最终域名一致**。文件 Send 的下载链接、附件 url 都基于它 |
| `ALLOWED_EMAILS` | 无 | 允许注册的邮箱白名单，glob 语法、逗号分隔（如 `me@example.com,*@corp.com`）。**留空 = 关闭注册** |
| `JWT_SECRET` | 无 | access token 签名密钥，随机 32+ 字节（`openssl rand -hex 32`）。泄露即可伪造登录态 |
| `JWT_REFRESH_SECRET` | 无 | refresh token 签名密钥，**必须与上面不同** |
| `STORE_DRIVER` | `memory` | 存储后端：`blob`（线上）/ `memory`（本地调试，进程重启即清空） |

### 4.2 存储（Blob）

| 变量 | 默认 | 说明 |
|---|---|---|
| `BLOB_STORE` | `warden` | Blob 命名空间名。首次调用自动创建，免费版 1 GB |
| `BLOB_PROJECT_ID` | 无 | 仅**外部脚本/CI** 需要（如 `scripts/blob-selftest.mjs`）；函数内自动鉴权 |
| `BLOB_TOKEN` | 无 | 同上，控制台生成的 API Token |

### 4.3 账号与安全

| 变量 | 默认 | 说明 |
|---|---|---|
| `PASSWORD_ITERATIONS` | `600000` | 服务端对客户端 `masterPasswordHash` 再套一层 PBKDF2 时的迭代次数。改大更慢更安全，**改小会让老账号登录失败** |
| `ALLOW_TOTP_DRIFT` | `true` | TOTP 是否允许 ±1 个时间步的时钟漂移。`false` 更严格，但客户端时钟偏差会导致验证失败 |
| `UPLOAD_MAX_BYTES` | `6291456`（6 MiB） | 单次上传上限，**同时管附件和文件 Send**。EdgeOne 请求体硬上限约 6 MB，调大没用，只会让客户端拿到平台的 500 而不是明确的 413 |

### 4.4 网页版（构建期，改了要重新部署）

| 变量 | 默认 | 说明 |
|---|---|---|
| `WEB_VAULT_ENABLED` | `true` | `true`：构建时下载官方 Web Vault 到 `/vault/`，根路径 302 过去；`false`：不下载（构建更快、产物更小），但根路径会 404 |
| `WEB_VAULT_VERSION` | `v2026.10.1` | 固定网页版版本号 |
| `WEB_VAULT_BASE_URL` | GitHub 官方 release | 换下载源（国内构建机拉 GitHub 慢时用镜像） |

### 4.5 邮件（**全部可选**）

不配 `SMTP_HOST` + `MAIL_FROM` 就完全不发信：`/api/accounts/password-hint` 仍返回 200，只在日志里留一行
`[mail] not configured (SMTP_HOST / MAIL_FROM missing), skipped`。

| 变量 | 默认 | 说明 |
|---|---|---|
| `SMTP_HOST` | 无 | SMTP 服务器，如 `smtp.qcloudmail.com`。**是启用发信的开关之一** |
| `SMTP_PORT` | `465` | 465 = 隐式 TLS；587/25 会走 STARTTLS |
| `SMTP_SECURE` | 端口为 465 时 `true` | 是否隐式 TLS，一般不用手填 |
| `SMTP_USER` | 无 | 登录用户名；**不填则匿名投递** |
| `SMTP_PASS` | 无 | 密码/授权码 |
| `MAIL_FROM` | 无 | 发件人地址，**是启用发信的开关之一**，必须是已验证的发信域名 |
| `MAIL_FROM_NAME` | `Warden` | 发件人显示名 |
| `MAIL_DRY_RUN` | `false` | `true` 时只打日志不发信，本地联调用 |

### 4.6 本地开发

| 变量 | 默认 | 说明 |
|---|---|---|
| `PORT` | `8787` | 仅 `src/dev.js` 使用 |

### 4.7 配置须知

1. **改完必须重新部署**：Makers 不会热加载环境变量。
2. **密钥类建议用控制台的「加密变量」**：`JWT_SECRET`、`JWT_REFRESH_SECRET`、`SMTP_PASS`。
3. **邮件可以后加**：先不配也能正常注册、登录、同步，只是没有提示邮件。
4. **`BASE_URL` 写错会导致文件 Send 下载失败**：下载链接是拼出来的绝对地址。

## 五、手动部署步骤

1. **建项目**：Makers 控制台 → 导入 Git 仓库（你的 fork）→ 框架选「其他 / Node」。
2. **构建配置**：按[第二节](#二一键部署)的表格填（根目录留空）。
3. **Functions**：Cloud Functions → Node.js，入口指向构建产物 `cloud-functions/[[default]].js`。
4. **路由绑定**：`/api/*`、`/identity/*` → 该云函数。
5. **环境变量**：至少填[4.1](#41-必填5-个)那 5 个。
6. **Blob**：命名空间由首次调用自动创建；免费版 1 GB。
7. **自定义域名**：绑已备案域名 + 免费证书（记得同步改 `BASE_URL`）。
8. **冒烟**：`/api/alive` → `/api/config` → 官方客户端登录。

## 六、本地开发

```bash
cd edgeone
npm ci
cp .env.example .env      # 至少填 ALLOWED_EMAILS / JWT_SECRET / JWT_REFRESH_SECRET
npm run dev               # http://127.0.0.1:8787
```

手动冒烟：

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

# 5) 主密码提示（未配 SMTP 或 MAIL_DRY_RUN=true 时只打日志）
curl -s -X POST localhost:8787/api/accounts/password-hint \
  -H 'content-type: application/json' -d '{"email":"a@example.com"}'
```

> `masterPasswordHash` 必须是客户端真算出来的值，否则第 4 步的 PBKDF2 校验过不了。
> 正式联调请直接用官方客户端指向该地址，而不是手写 curl。

常用脚本：

| 命令 | 用途 |
|---|---|
| `npm run smoke` | 137 项契约测试（memory 存储） |
| `npm run parity` | 与上游 Rust 路由做集合比对 |
| `npm run test:blob` | Blob 适配器测试 |
| `node scripts/test-upload.mjs` | multipart 解析测试 |
| `node scripts/test-smtp.mjs --send` | SMTP 连通性 + 真发一封 |
| `npm run doc` | 文档漂移检查（代码 / README / .env.example 三边一致） |

## 七、部署后验收

建议按顺序走：

1. `GET /api/alive` → 返回时间戳
2. `GET /api/config` → `version/environment/featureStates` 正常
3. 客户端登录 → 拿 token → `/api/sync` 空库
4. 建条目 → 改 → 软删 → 恢复 → 清空回收站
5. 传附件 → 下载附件（验证 Blob 二进制通道）
6. 建文本 Send / 文件 Send → 匿名访问（验证 accessId + 次数上限）
7. 开 TOTP → 重新登录（验证 2FA 挑战 + remember device）
8. 改密 → 确认旧设备被踢

## 八、技术说明

### 8.1 Blob 当库的三个代价

| 能力 | Postgres | Blob（本方案） |
|---|---|---|
| 条件查询 / 二级索引 | ✅ | ❌ 只能前缀 List，索引自己维护 |
| 事务 / 批量原子写 | ✅ | ❌ 逐对象写，失败要补偿 |
| 并发写同一条目 | 行锁 | **乐观锁**：强一致回读校验 + 冲突重放 |
| `/api/sync` | 1 条 SQL | 1 次 List + N 次 Get（16 并发） |

**必须先验证的一件事**：Blob 的 GET/PUT 是否返回 ETag。
- 支持 → `mutate()` 的乐观锁直接生效；
- 不支持 → 语义退化成「后写胜」，**多端同时改同一条目会丢改动**。

Key 布局（每用户一个前缀，List 只扫单用户）：

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

### 8.2 邮件（可选）

- **Edge Functions 发不了信**：没有 TCP socket，只有 `fetch`。
- **Cloud Functions (Node.js) 可以**：`nodemailer` 直连 465/587，代码在 `src/mail.js`，不接第三方 HTTP 邮件 API。
- 唯一风险是**出站端口是否放行**。部署后先在函数里跑一次自测：

```bash
SMTP_HOST=smtp.qcloudmail.com \
SMTP_USER=no-reply@example.com \
SMTP_PASS=*** \
MAIL_FROM=no-reply@example.com \
node scripts/test-smtp.mjs --send
```

会依次探测 `465,587,25,2525`，再真发一封。返回码打到日志（`info.response`），SES 的拒信原因只能从这里看到。

腾讯云 SES 侧要做：验证发信域名 → 配 SPF/DKIM →（若用模板）审核模板。别用 `@qq.com` 之类公共域当发信人。

### 8.3 限流与实时同步降级

**限流**（存进 store，固定窗口，超限返回 429 + `Retry-After`）：

| 目标 | 限制 |
|---|---|
| 注册 | 10 次/分/IP |
| 登录 | 20 次/分/邮箱 + 60 次/分/IP |
| 主密码提示邮件 | **3 次/分/邮箱** + 10 次/分/IP（防邮件轰炸） |
| Send 匿名访问 | 30 次/分/IP |

> 语义是**近似**的：Blob 最终一致 + 多实例并发时可能多放行几次。挡脚本够用，不能当精确配额。

**实时同步**：`/notifications/hub` 返回 `426 websocket_not_supported`。客户端收到后会回退到轮询 `/api/sync`，
功能不受影响，只是不再"秒同步"。Makers 没有 Durable Object 等价物，这条无法补齐。

### 8.4 Blob 适配（已按官方 SDK 接通）

依赖 `@edgeone/pages-blob`，`src/store.js` 的 `BlobStore` 已实现：

```js
store.get(key, { type: 'json', consistency: 'strong' })  // 强一致读
store.setJSON(key, value) / store.set(key, arrayBuffer)   // 写（附件走二进制）
store.delete(key)
store.list({ prefix, consistency: 'strong' })             // -> { blobs: [{ key, etag }] }
store.getMetadata(key)                                    // -> { etag, contentType }
```

**三个必须知道的限制**：

1. **没有条件写**。SDK 的 `onlyIfNew` 明确写「底层不强制、不要用于加锁」，也没有 `If-Match`。
   所以 `mutate()` 退化为「强一致读 → 写 → 强一致回读校验 → 不一致按最新基线重放」。
   能发现覆盖并按新状态重放，**但不是原子的**；单用户密码库够用，要严格事务只能换 Postgres。
2. **默认最终一致**。所有读都显式传 `consistency: 'strong'`，否则登录后立刻 sync 可能读到旧数据。
3. **免费版 1 GB**，超额抛 `QuotaExceededError`（`reason: storage`）。

自测（外部模式，控制台生成 API Token）：

```bash
BLOB_PROJECT_ID=pages-xxxx BLOB_TOKEN=xxx node scripts/blob-selftest.mjs
```

会验证：写入 → 强一致读 → list → getMetadata(etag) → 删除 → 确认已删。

## 九、路由对齐清单

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

图例：✅ 已实现　⬜ 待迁移　⛔ 平台/产品不支持

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

> 鉴权已校验 `securityStamp`：改密 / 换 KDF / security-stamp 之后，旧 access token 立即 401。

**明确不做**
⛔ 组织 / Collections / 共享 / SSO / SCIM / 管理后台 / 审计 / 紧急访问（与上游一致）
⛔ Passkey 登录（上游也只是空列表桩）

## 十、里程碑

| 阶段 | 内容 | 验收 |
|---|---|---|
| M1 | 本地 memory 存储跑通 config/prelogin/register/token/sync | 第六节 curl 全绿 |
| M2 | Blob 五原语接通 + 乐观锁实测 | 并发写同一条目不丢改动 |
| M3 | 官方客户端（Web/Android）登录 + 条目 CRUD 联调 | 客户端可增删改同步 |
| M4 | Send + 附件（走 Blob 二进制） | 客户端能发/收 Send 与附件 |
| M5 | 2FA(TOTP) + 设备 + 密钥轮换 + 改密 | 与上游行为对齐 |

## 十一、风险清单

1. **Blob 没有条件写**（SDK 的 `onlyIfNew` 明确不生效）→ 并发改同一对象可能丢改动；已用「强一致回读 + 重放」兜底，非原子。要强一致请换 Postgres。
2. **SMTP 出站未知** → 465/587 被拦则发信失败（`scripts/test-smtp.mjs` 先测）。邮件是可选功能，不影响主流程。
3. **限流是近似值** → Blob 最终一致 + 多实例，计数会漂移；挡脚本够用，不能当配额。
4. **`/api/sync` 延迟来自网络往返，不是 CPU**：实测 500 条 → 响应 367 KB、CPU+序列化 **5 ms**（内存存储，即网络为 0 的下限）；但 Blob 上每个对象一次 GET，16 路并发 = **32 轮往返**，按 20–50 ms RTT 估 **0.6–1.6 s**。要再快只能把条目聚合成单对象。复现：`node scripts/bench-sync.mjs 500`。
5. **冷启动**：Cloud Functions 冷启动会放大登录首包延迟（客户端有重试，影响可接受）。
6. **实时同步降级**：无 WebSocket，客户端退回轮询（功能正常，不再秒同步）。
7. **客户端字段兼容**：`profile`/`cipher`/`token` 字段集按 Rust 源码对齐，但**必须用真客户端联调**修正。
8. **备份**：Blob 没有版本控制，删号不可逆；必须自建导出（见 DEPLOY.md 第 8 节）。
9. **单次请求体约 6 MB**：超过的文件 Send / 附件无法上传（平台硬限制，返回 413）。要支持大文件只能接对象存储（COS/R2）直传，需要额外凭据。

## 十二、开发注意（踩过的坑）

1. **别用 PowerShell 的 `Get-Content ... | Set-Content` 改本仓库的 `.js`**：Windows 下会按 GBK 重编码，中文注释会变乱码、甚至吃掉换行。请用支持 UTF-8 的编辑器。
2. **新增路由后必须跑 `npm run parity`**：Hono 按注册顺序匹配，静态路径（`/api/ciphers/import`、`/api/sends/file/v2`）如果排在 `/:id` 后面就会被吃掉，表现为"接口返回 200 但什么都没做"。
3. **附件下载 token 是 2 段式 HMAC**（10 分钟、绑定 uid + 附件 id），不要把 access token 拼到 URL 里——URL 会进访问日志和浏览器历史。
4. **上传接口不能用 `c.req.parseBody()`**：平台的 FormData 实现不可用，必须走 `src/upload.js` 的手工 multipart 解析。
5. **改了环境变量要重新部署**：Makers 不热加载。

## 十三、边界说明

已做：全量路由（`npm run parity` 0 缺口）、附件与文件 Send、2FA/remember/恢复码、login with device、密钥轮换、导入、限流、Blob 二进制通道、可选 SMTP 发信、契约测试与 CI。

未做（受平台或凭据限制）：

- **真机部署**：需要你的仓库、控制台和 `BLOB_PROJECT_ID`/`BLOB_TOKEN`。
- **WebSocket 实时同步**：Makers 无 Durable Object 等价物，只能降级为轮询。
- **大文件 Send**：受 6 MB 请求体限制，需要对象存储直传才能突破。
- **`edgeone.json`**：控制台会生成模板，需要时按模板补 `functions` 段。
