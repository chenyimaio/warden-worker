# 安全审查报告 · warden-worker（EdgeOne 移植版）

| 项 | 内容 |
|---|---|
| 审查日期 | 2026-11-10 |
| 代码基线 | `edgeone` 分支 `45878c4`（工作区另有 1 处你自己未提交的文档改动 `docs/edgeone-deploy.md`，本次未触碰） |
| 审查范围 | `edgeone/src/*.js`（index 2947 行 / crypto 193 / store 253 / upload 124 / mail 111）、`edgeone/scripts/fetch-web-vault.mjs` 构建链路、`package-lock.json` 依赖 |
| 审查方式 | 全量静态阅读 + 针对可疑点写脚本动态验证（内存存储，本地跑，未触碰线上） |
| 结论 | **2 个严重问题，2 个高危，4 个中危，9 个低危**。明文密码学设计本身没有问题，问题集中在**访问控制缺口**和**信任边界**上 |

---

## 一、结论摘要

| 编号 | 严重度 | 问题 | 状态 |
|---|---|---|---|
| C-1 | 🔴 严重 | 带密码的**文件 Send 可以完全绕过密码**下载 | ✅ 已修复 + 回归用例 |
| C-2 | 🔴 严重 | 只凭 access token 就能**改掉主密码**，不需要当前密码 | ✅ 已修复 + 回归用例 |
| H-1 | 🟠 高 | `requestIp()` 信任客户端可伪造的头，**IP 限流可绕过** | ✅ 已修复 |
| H-2 | 🟠 高 | 下载/上传令牌放在 URL query 里，会进日志、历史、Referer | ✅ 已修复（限次 + 支持 header + no-referrer） |
| M-1 | 🟡 中 | CORS 全开放 `Access-Control-Allow-Origin: *` | ✅ 已修复 |
| M-2 | 🟡 中 | `/api/accounts/verify-password` 无限流，可当密码校验 oracle | ✅ 已修复 |
| M-3 | 🟡 中 | 签名密钥没有最小长度校验，弱密钥可部署上线 | ✅ 已修复 |
| M-4 | 🟡 中 | 文件 Send 的 `maxAccessCount` / 访问计数实际不生效 | ✅ 已修复 |
| L-1…L-9 | 🔵 低 | 见第四节 | ✅ 除 L-5 外全部处理（见下） |

### 修复记录（本次提交）

| 项 | 改动 |
|---|---|
| C-1 | `/sends/access/file/:fileId` 对带密码的 Send 强制要求票据（`sstamp` 无关的 send-access JWT，`sid` 绑定）；`/sends/access/<accessId>` 现在会返回 `token` 供客户端下载时使用；该路由加 60/min 限流；兼容"内联密码"的客户端 |
| C-2 | 改密只认**显式的新密码字段**（`newMasterPasswordHash` / `authenticationData.masterPasswordAuthenticationHash` / `unlockData.masterKeyAuthenticationHash`），并**始终**校验当前密码；删除了"把 masterPasswordHash 当新密码"的分支。同时补上网页版真正使用的 `authenticationData` / `unlockData` 字段名 —— 之前它被误判成"没给新密码"，等于密码根本没改成功 |
| H-1 | `requestIp()` 改为只信平台头（`eo-connecting-ip` / `cf-connecting-ip` / `true-client-ip`）→ `x-real-ip` → `X-Forwarded-For` 的**最后一跳**；不再取客户端可写的第一个元素 |
| H-2 | 下载令牌 TTL 1h → 10min |
| M-1 | CORS 白名单到 `BASE_URL`（同源 + 其 http 变体），其余源不下发 ACAO |
| M-2 | `verify-password` 加 10/min/账号 限流 |
| M-3 | 密钥长度 < 32 直接抛错（本地 dev/test 的短密钥已同步改长） |
| M-4 | `accessCount` 移到真正吐字节的 `/data`，文件 Send 的下载次数上限才生效 |
| L-2 | `jwtVerify` 全部固定 `algorithms: ['HS256']` |
| L-4 | `bulkMutate` / `importCiphers` 加条目上限（2000 / 5000） |
| L-6 | `PASSWORD_ITERATIONS` 统一走 `pbkdf2Iterations()`，下限 60000 |

### 第二轮修复（低危 + 残留项）

| 项 | 改动 |
|---|---|
| H-2 | 下载路由支持 `Authorization` 头（优先）；票据改为**限次使用**（5 次，覆盖客户端重试），第 6 次 401，即使 URL 进日志也无法反复重放；全局加 `Referrer-Policy: no-referrer` 与 `X-Content-Type-Options: nosniff` |
| L-1 | 注册接口按**邮箱**再加 5/min 限流（IP 已限 10/min），把枚举成本抬起来（保留"邮箱已存在"提示，否则破坏客户端 UX） |
| L-3 | 新增 `safeEqual()`，`securityStamp`、`accessCode`、refresh 的 `refreshId` 比较全部改为常量时间 |
| L-7 | TOTP 恢复码落盘改为 **AES-256-GCM**（密钥由 `JWT_SECRET` 派生，`enc:v1:` 前缀）；读取兼容历史明文；`get-recover` 返回解密后的值 |
| L-8 | 邮件日志的收件人改为 `e***@domain` 形式 |
| L-9 | 构建期改用**仓库内钉住的 sha256**（`PINNED_SHA256`），不再只依赖同源的 `sha256sums.txt`；版本未钉住时校验失败即中止，并在报错里给出计算值 |
| L-5 | **接受**：Blob 没有条件写，改成 `mutate()` 会给每个请求多两趟往返；限流本身是"尽力而为"的防护，按现状记录 |

新增回归：`get-recover` 的值在存储里必须是 `enc:v1:` 密文、且不含明文恢复码；同一票据第 5 次可用、第 6 次被拒。

---

## 九、第二轮审计（外部清单）复核结果

逐条对着 `49c8fe2` 复核，能复现的都修了，复现不了的在"结论"里说明。

| 编号 | 结论 | 处置 |
|---|---|---|
| H-1 上传票据换下载地址 | **成立**（复现：`200` + 下载到明文） | 下载签发与旧通道都要求 `scope` 含 `api.send.access`；上传票据（`api.send.upload`）一律拒绝 |
| H-2 附件下载不校验 securityStamp | **成立**（复现：`/api/sync` 401，附件 200） | 用 access token 下载时比对 `securityStamp`，改密/踢设备后立即失效 |
| M-1 旧通道 `/sends/:id/access/file/:fileId` 不计数、无限流 | **部分成立**（口令**有**校验，但没有限流/计数，作用域也没查） | 加 30/min 限流 + `accessCount` 自增 + scope 校验 |
| M-2 `requestIp` 可伪造 / `pbkdf2Sync` 阻塞 | **前半成立，后半成立** | `requestIp`：只信平台头 → `x-real-ip` → XFF **最后一跳**（无法完全根治，见下）；PBKDF2 改为线程池异步实现，不再阻塞事件循环 |
| M-3 `/api/auth-requests` 无限流/无上限 | **成立**（但需已知邮箱+设备标识，不是完全匿名） | 加 10/min 限流 + 待批准上限 20 |
| M-4 prelogin 泄露账号存在性 | **成立**（已测：1200000 vs 100000） | 加 30/min 限流抬高枚举成本；**无法在协议层消除**（客户端必须拿到真实 KDF 参数才能派生） |
| M-5 id 拼存储键 / 大字段 | **部分成立**（对象键是字面量，不构成真正穿越） | 入口拒绝 `%2F` / `%5C` / `..`；body 里的 `id` 必须是 `[A-Za-z0-9_-]{1,64}`；JSON 体上限 4 MiB |
| M-6 超限文件 Send 先落库后校验 | **成立**（复现：413 但列表里有孤儿） | 大小校验移到落库之前 |
| M-7 未配 BASE_URL 时 CORS 反射任意源 | **CORS 部分成立；404 页 XSS 不成立** | 未配 `BASE_URL` 时不再下发 ACAO（`baseUrlOf` 用的是请求 origin 而非 `Host` 头，故无 HTML 注入） |
| 低危：Send 口令哈希回传 | 成立 | `sendToJson` 的 `password` 恒为 `null`（客户端用 `authType`） |
| 低危：knowndevice 枚举 | 成立 | 加 30/min 限流 |
| 低危：删号单页 `list` | 成立（性能问题，非安全） | **未改**，记录在案 |
| 构建：`edgeone/deploy/` 陈旧 | **成立**（`installCommand` 跳过安装、只下载前端、附 594 B 占位函数） | 整目录删除 |
| 构建：`fetch-web-vault` 往页面注入脚本 | **成立** | 注入块整段删除（页面会处理主密码，不注入任何第三方代码） |
| 构建：bundle 入库 | 成立（工程洁癖层面） | **未改**：保留是为了让"没构建成功也能部署"这条路径存在，删掉会改变现有部署方式，需要你先确认 |

### 未能根治的两条

1. **`requestIp` 的信任边界**：不依赖平台文档无法确定哪个头是"平台注入、客户端不可写"。当前实现是"平台专有头优先 → `x-real-ip` → XFF 最后一跳"，比取第一个元素安全得多，但如果 EdgeOne 只是透传 `X-Forwarded-For`，仍可伪造。**建议**：部署后抓一次真实请求头，确认后把 `PLATFORM_IP_HEADERS` 收敛成唯一那个。
2. **`prelogin` 的账号存在性**：协议决定的（客户端要拿 KDF 参数），只能靠限流。


回归用例已加入 `scripts/smoke.mjs`（第 27、28 节）：带密码文件 Send 的匿名/错误密码/带票据三条路径，以及"只凭 token 改密被拒""网页版结构改密成功且新密码可登录"。

**最需要先处理的是 C-1 和 C-2**：两者都不需要任何特权，影响的是"功能承诺"本身（Send 密码、主密码保护）。

---

## 二、严重问题

### C-1　带密码的文件 Send 可被匿名下载（密码形同虚设）

**位置**：`edgeone/src/index.js:2058-2103`，`POST /api/sends/access/file/:fileId`

**正常设计**：文件 Send 的下载分两步

1. `POST /api/sends/access/:accessId`（`:1989`）核对密码 → 返回访问票据；
2. `POST /api/sends/access/file/:fileId`（`:2058`）拿票据换一个带签名的下载 URL；
3. `GET .../data?token=...`（`:2107`）吐字节。

**问题**：第 2 步**允许完全不带票据**。令牌为空时直接走兜底查找：

```js
// 2058-2082
const token = p.token ?? (auth ? auth[1] : '');
let send = null;
if (token) { /* 校验票据，失败也不拒绝，只是 send 保持 null */ }
if (!send) send = await lookupSendByAccessId(store, c.req.param('fileId'));  // ← 仅凭 accessId
if (!send) return c.json({ error: 'Send is not accessible' }, 404);
const v = validateSendAccess(send);   // ← 只查 禁用/过期/次数，不查密码
```

而 `validateSendAccess`（`:1797-1807`）里**没有任何密码判断**。第 1 步的密码校验被完全跳过，然后第 2 步照样签发下载 URL。

**影响**：任何拿到 Send 链接的人（链接本来就是发给外人的）可以**在没有密码的情况下下载受保护文件**。同时 `accessCount` 不计入，`maxAccessCount` 也随之失效（M-4）。

**复现（本地已跑通）**：

```
创建: status=200 id=true accessId=true
上传字节: 200

---- 正确流程需要密码 ----
无密码访问 /api/sends/access/<accessId>      -> 401 {"error":"Password required"}
错误密码访问                                 -> 401 {"error":"Invalid password"}

---- PoC: 跳过密码，直接走 file 通道 ----
匿名 POST /api/sends/access/file/<accessId>  -> 200
用返回的 url 下载                             -> 200 | 内容 = "TOP-SECRET-FILE-CONTENTS"
```

**修复方向**：

1. 第 2 步**必须**要求票据，且票据的 `sid` 必须等于目标 Send；
2. 更稳妥：把"已验证密码"的凭证做成一次性、短时效的票据（当前 `signAccess` 的 1 小时对匿名下载偏长），并在票据里带上 `pwd: true` 之类的声明；
3. `validateSendAccess` 增加可选的"密码是否已通过"入参，避免以后再有别的路径漏掉。

---

### C-2　只凭 access token 即可修改主密码（无当前密码校验）

**位置**：`edgeone/src/index.js:1302-1333`，`POST /api/accounts/password`

**背景**：为了兼容网页版 2026.x 只发一个 `masterPasswordHash` 的写法，代码新增了这条分支：

```js
let newMph = explicitNew;
if (explicitNew) {
  const check = await checkPassword(c, a.user, p);   // 有独立新密码字段时，校验当前密码
  if (check.error) return ...;
} else if (singleHash) {
  newMph = singleHash;                                // ← 只凭 access token，直接当作新密码
} else { ... }
```

注释里写的是"当前密码由会话令牌保证"。但**会话令牌不等于密码**：它能证明"持有令牌"，不能证明"知道主密码"。Bitwarden 官方的做法是先用 `/accounts/verify-password` 换一个**短时效、专门用途**的凭证，服务端据此放行；这里的实现没有落地这层凭证，等于直接把校验删掉了。

**影响**：任何一次 access token 泄露（XSS、日志、别处复用、设备被盗）+ 一个 POST 请求，就能把账号的主密码换掉，`securityStamp` 随即轮换、所有设备被踢下线——**原主人被锁在门外**，攻击者拿到完整控制权。这是从"临时访问"升级为"永久接管"的典型路径。

**复现（本地已跑通）**：

```
初始登录: 200
改密请求（body 只有 {"masterPasswordHash":"ATTACKER-CHOSEN","key":"attacker-key"}) -> 200 {}
用攻击者设定的密码登录 -> 200
原密码登录             -> 400   ← 原主人被锁在外面
```

**修复方向**（任一，建议 1+2）：

1. 恢复"必须证明当前密码"：只在 `explicitNew` 分支放行，`singleHash` 分支要求同时提供当前密码的独立证明（例如要求服务端在最近 N 分钟收到过成功的 `verify-password`，用一次性 nonce 绑定）；
2. 把 `/accounts/verify-password` 的成功结果做成短时效（如 5 分钟）、单次使用的凭证，改密时必须携带；
3. 无论如何，`key` 的替换应与密码校验同源，避免出现"密码没换成功但密钥已经换了"的半状态。

---

## 三、高危

### H-1　`requestIp()` 信任可伪造的请求头，IP 限流可绕过

**位置**：`edgeone/src/index.js:2532-2536`

```js
const requestIp = (c) =>
  c.req.header('cf-connecting-ip') ||
  c.req.header('x-real-ip') ||
  (c.req.header('x-forwarded-for') || '').split(',')[0].trim() ||   // ← 取第一个，客户端可控
  '127.0.0.1';
```

`X-Forwarded-For` 的**第一个**元素是客户端可以随便写的；`X-Real-IP`、`CF-Connecting-IP` 同理（EdgeOne 并不会替你剥离客户端自带的同名头）。

**影响**：

- 所有按 IP 的限流（登录 60/min、Send 访问 30/min、附件下载 120/min、注册 10/min、提示邮件 10/min）都能用轮换头绕过；
- ":2660" 的「login with device」会把 `ar.requestIp` 与当前请求 IP 做相等比较，伪造后这个绑定也失效。

**复现（本地已跑通）**：

```
同一 email 登录 30 次（每次伪造不同 X-Forwarded-For）：非 429 = 20，429 = 10
```

（20 次非 429 说明"每邮箱 20 次"这一层还在起作用；**IP 那一层已经被完全绕过**——换成 30 个不同邮箱就是 600 次尝试。）

**修复方向**：只采信平台注入的头（EdgeOne 会注入真实客户端 IP，具体头名需按平台文档确认），并且**忽略**客户端自带的 `X-Forwarded-For`/`X-Real-IP`；无法确定时退回"取最右一跳"而不是最左。

### H-2　下载/上传令牌放在 URL query 中

**位置**：

- 附件下载：`index.js:1533`，`/download?token=...`，令牌有效期 `crypto.js:94` **600 秒**；
- 文件 Send 下载：`index.js:2100`，`/data?token=...`，令牌是 `signAccess` 签的 **1 小时** JWT；
- 文件 Send 上传：`index.js` 创建响应里的 `url` 带 `?token=`。

**影响**：URL 会进入平台访问日志、CDN 日志、浏览器历史、以及跨站请求时的 `Referer`。1 小时的下载令牌尤其宽。

另外这些令牌**不绑定 `securityStamp`**（附件令牌是自定义 HMAC，下载令牌虽然用的是 JWT 但校验时不查 profile），所以"改密码 / 踢下线"之后，已泄露的链接在有效期内仍然可用。

**修复方向**：能放 header 的走 header；必须放 URL 的缩短 TTL（下载 60–120 秒、一次性）；把 `sstamp` 写进票据并在校验时比对。

---

## 四、中危

### M-1　CORS 全开放

`index.js:33`、`:2928` 使用 `cors()` 默认配置，响应头是 `Access-Control-Allow-Origin: *`（已确认）。

认证走 `Authorization: Bearer`，不依赖 Cookie，所以**不构成跨站读数据**；但任何站点都能从受害者浏览器发起跨域请求（读不到响应，可做副作用请求），也让"以后再引入 Cookie 会话"变成高危。建议白名单化到 `BASE_URL`。

### M-2　`/api/accounts/verify-password` 无限流

`index.js:1390-1403`。它需要 access token，是个"密码是否正确"的判定接口，没有任何限流。配合 C-2 的现状，等于给攻击者一个高速试密码的入口（每次约 84 ms 的 PBKDF2）。建议与登录同级的限流（每账号 10/min）。

### M-3　签名密钥无最小长度校验

`crypto.js:32-45`：

```js
if (!v) throw new Error(`missing secret: ${name}`);
```

只判空。`JWT_SECRET=a` 也能部署成功，随后全部令牌可被暴力伪造。建议 `< 32 字节` 直接抛错（或在启动时警告）。

### M-4　文件 Send 的访问次数上限不生效

与 C-1 同因：`POST /api/sends/access/file/:fileId` 和 `GET .../data` 都不走 `accessCount` 自增，只走 `validateSendAccess` 的次数判断。因此"最多访问 N 次"的文件 Send 在绕过密码后可以无限次下载。修复 C-1 时一并处理（计数应放在真正吐字节的那一步或票据签发处）。

---

## 五、低危（建议排期处理）

| 编号 | 位置 | 问题 | 建议 |
|---|---|---|---|
| L-1 | `index.js:393` | 注册返回 `email already exists`，可枚举已注册邮箱 | 统一返回 200 + 异步处理，或对已存在邮箱返回与成功一致的结构 |
| L-2 | `crypto.js:56,61` | `jwtVerify` 未固定 `algorithms`（依赖 jose 的默认推断，实际不会接受 `none`） | 显式传 `{ algorithms: ['HS256'] }` |
| L-3 | `index.js:169,514` | `securityStamp`、`accessCode` 用 `!==` 比较，非常量时间 | 统一用 `timingSafeEqual` |
| L-4 | `index.js:864,2480` | `bulkMutate` / `importCiphers` 对 `ids`、`ciphers` 数量无上限，逐个串行写存储 | 加上限（如 5000）并批量并发 |
| L-5 | `index.js:83-140` | 限流是"读-改-写"，非原子，并发下可超过阈值 | 可接受；若要严格可改用存储层条件写 |
| L-6 | `index.js:1276` 附近 | `PASSWORD_ITERATIONS` 无下限，设成 `0` 会让 `pbkdf2Sync` 抛 `RangeError` → 500 | `Math.max(60000, ...)` 兜底 |
| L-7 | `index.js:448,568` | TOTP 恢复码以**明文**存于 `profile.totpRecover` | 与 Vaultwarden 一致；若在意可以存哈希（比对时哈希化） |
| L-8 | `mail.js:111` | `[mail] sent` 日志写入收件人邮箱 | 属于 PII，按需脱敏 |
| L-9 | `scripts/fetch-web-vault.mjs:104-114` | 构建期校验的 `sha256sums.txt` 与 tarball **同源**；缺条目时只告警不失败；`WEB_VAULT_BASE_URL` 指向的镜像被完全信任 | 把期望哈希写进仓库（可锁定版本）；镜像源至少在文档里标注"必须是你信任的源" |

> L-9 补充：网页版是在密码库同源下运行的第三方构建产物，一旦构建期被投毒，等于给主密码开了后门。当前"同源取校验和"只能防传输损坏，防不了源被篡改。

---

## 六、做得好的地方

值得保留的设计：

1. **主密码永不落地**：服务端只存 `PBKDF2(客户端 mph, 随机盐, 600k)`，且比对用 `timingSafeEqual`（`crypto.js:26-30`）；
2. **`securityStamp` 机制**：每个请求都校验，改密/轮换即全端下线（`index.js:158-178`）；
3. **附件令牌**用 HMAC + 显式过期时间，且长度不等直接拒（`crypto.js:103-117`）；
4. **不泄露敏感字段**：`sendAccessJson` 只返回必要字段，`passwordHash` 不出现在任何公开响应里（已确认）；
5. **下载响应**统一 `content-type: application/octet-stream` + `content-disposition: attachment` + `cache-control: no-store`，避免了"上传 HTML 变存储型 XSS"这类经典问题（`index.js:1560-1580,1735`）；
6. **邮件正文做 HTML 转义**（`mail.js:48-54,78-85`），提示内容不会破坏结构；
7. **`mutate()` 在无条件的 Blob 存储上做"强一致回读校验 + 重放"**（`store.js:227-253`），把"最终一致导致的丢更新"挡在了应用层；
8. **上传双保险**：Content-Length 预判 + 实际字节数校验 + 截断检测（`upload.js`）；
9. **未发现**调试接口、硬编码密钥、`eval`、命令执行、SQL 拼接之类的问题；路由清单与文档一致（`npm run parity` 为 0 缺口）。

---

## 七、修复优先级建议

| 顺序 | 事项 | 理由 |
|---|---|---|
| 1 | **C-1** 文件 Send 强制票据 + 密码 | 直接影响对外承诺的安全语义，且利用成本为零 |
| 2 | **C-2** 改密必须证明当前密码 | token 泄露即可永久接管账号 |
| 3 | **H-1** 只信平台注入的真实 IP | 一处修复同时恢复所有 IP 限流与设备绑定 |
| 4 | **H-2** 缩短 URL 令牌 TTL + 绑 `sstamp` | 降低泄露后的可用窗口 |
| 5 | M-1…M-4 | 收敛攻击面 |
| 6 | L-1…L-9 | 排期清理 |

修完 C-1 / C-2 后建议补两条回归测试（现有 `smoke` 里已经有"带密码 Send 的错密码 401"用例，但**没有覆盖文件 Send 的下载通道**，所以这个漏洞一直没被测到）。

---

## 八、复现要点（供修复后做回归）

```js
// C-1 密码绕过
POST /api/sends/file/v2        { type:1, password:'letmein-please', ... }   // 建带密码的文件 Send
POST /api/sends/<id>/file/<id> <bytes>                                      // 上传字节
POST /api/sends/access/file/<accessId>   {}           // ← 期望 401，实际 200
GET  <返回的 url>                                     // ← 期望 401，实际拿到明文

// C-2 无当前密码改密
POST /api/identity/connect/token  {password:'原密码'}  → access_token
POST /api/accounts/password       {masterPasswordHash:'攻击者选的'}          // ← 期望 401，实际 200
POST /api/identity/connect/token  {password:'攻击者选的'} → 200（账号被接管）

// H-1 IP 限流绕过
循环 30 次：POST /identity/connect/token，Header 里 X-Forwarded-For: 10.0.0.<i>
```

---

*本报告只做分析与复现，未修改任何业务代码。文中所有"已复现"均在本地内存存储环境完成，未对线上实例发起测试。*
