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

---

## 十、第三轮审计复核结果

同样先复现再动手。测试值：修前 / 修后。

| 编号 | 复现结果 | 处置 |
|---|---|---|
| M-1 登录时序枚举 | **成立**：存在账号 72–76 ms，不存在 0–3 ms | 未知邮箱也跑一次同等代价的 PBKDF2（固定 dummy salt）。修后两边都是 **13–14 ms**，无法区分 |
| M-2 4 MiB 守卫 fail-open | **成立**：chunked 5 MiB → `200` | 不再信任 `Content-Length`：文本类请求体整块读入并按真实字节数判定。修后 chunked 与带 CL 都是 **413**；`CL: abc` 不再引发解析异常 |
| M-3 prelogin 真实 KDF | 成立（上轮已承认） | 协议决定，只能限流；见第九节"未能根治" |
| M-4 cipher body id 未校验 | **成立**：`{"id":"../../profile"}` / `{"id":"a/b"}` 均 `200` | `createCipher` 加 `validId`。修后两者都是 **400** |
| M-5 无全局 onError | **成立**：重复 id → `500 text/plain` | 新增 `app.onError`，`PreconditionFailed` 映射 **409 + JSON**（与其它 API 一致） |
| L-1 2 段式附件票据不绑 sstamp | **成立**：改密后旧票据仍 `200` | 票据里加入 `sstamp`，下载时与 profile 比对。修后 **401** |
| L-2 坏 JSON 被吞并落库 | **成立**：`{bad json` → `200` 且生成垃圾条目 | `body()` 改为抛 `HttpError(400)`，由 `onError` 统一返回 |
| L-3 auth-request 响应端点无限流 | 成立 | 加 20/min/账号 |
| L-4 IP 限流仍以可伪造头为键 | 成立（依赖平台头未知） | **未根治**，同第九节第 1 条 |
| L-5 文档/脚本漂移 | 成立 | `ATTACHMENT_MAX_BYTES`→`UPLOAD_MAX_BYTES`；README 137→157；删除引用不存在构建产物的 `scripts/test-entry.mjs`；`bench-sync` 去掉已废弃的 `MAIL_ENABLED` |
| L-6 bundle 入库 / Rust 目录硬编码 workers.dev | 成立 | bundle 保留（同第九节说明）；Rust/Cloudflare 部分属于另一条产品线，未在本次范围内改动 |

新增回归（smoke 第 30 节）：chunked 5 MiB → 413、body id 穿越 → 400、重复 id → 409 JSON、坏 JSON → 400、附件票据改密后失效。

---

## 十一、第四轮审计复核结果

这一轮最严重的一条**完整复现**，其余逐条确认。

### H-1 Send 分享链接可被他人劫持（已复现，已修复）

复现脚本输出（修前）：

```
Alice accessId=Lv9_l0ZHQp2cKqdmsr_MCQ
Bob 构造 id=2eff7f974647429d9c2aa766b2bfcc09
Bob 建 -> 200 | accessId=Lv9_l0ZHQp2cKqdmsr_MCQ | 与Alice相同=true
匿名访问 Alice 链接 -> 200 | name=BOB-OVERWRITE
Bob 删除自己那条 -> 200
Alice 链接现在 -> 404
```

三个条件叠加才成立：

1. `accessId` 是 `id` 的 16 字节 hex → base64url，**可逆**，所以 `hex(别人的 accessId)` 就是一个能算出同一 accessId 的 id；
2. `validId` 允许 32 位十六进制，这个 id 能通过校验；
3. 写索引是普通 `put`，直接覆盖；删除时又按同一公式删索引，**不校验归属**。

修法（三处一起）：

```js
// 1) id 必须是 32 位 hex 或标准 UUID；非十六进制不再静默截断
const SEND_ID_RE = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-...)$/i;
const accessIdFromUuid = (id) => SEND_ID_RE.test(String(id ?? '')) ? Buffer.from(...).toString('base64url') : null;

// 2) 写索引前先读：要么不存在，要么就是我自己这条
async function claimSendIndex(store, s, userId, id) {
  const cur = (await store.get(keys.sendIndex(s)))?.value;
  if (cur && !(cur.userId === userId && cur.id === id)) return SEND_INDEX_CONFLICT;
  await store.put(keys.sendIndex(s), { userId, id });
}

// 3) 删索引前校验 userId
if (idx && String(idx.userId) === String(a.claims.sub)) await store.del(idxKey);
```

修后：

```
Bob 用 hex(accessId) 建 Send -> 409（已拦）
Alice 链接内容 name=ALICE-SECRET
Bob 删除 -> 200
Alice 链接仍然 -> 200
```

### 其余条目

| 编号 | 复现结果 | 处置 |
|---|---|---|
| M-1 旧 multipart 不校验 id | **成立**：`id=../../profile` → `200`，`accessId=""`，索引键退化成全局的 `idx/send/.json` | 加 id 校验（400）+ `claimSendIndex` + `UPLOAD_MAX_BYTES` 上限 |
| M-2 `accessIdFromUuid` 静默截断 | **成立**：`id=zzzz` → `400`（修后）；修前产生空 accessId | 严格正则，非 hex 直接返回 null，调用点全部判空 |
| M-3 限流键空间无上界 | **成立**：换一个伪造 IP 就新建一个 `rl/` 对象，永不过期 | 计数对象写入 `exp`，并每 200 次调用低频清理一次过期键。**非原子性仍接受**（Blob 无条件写，见 L-5） |
| M-4 authrequest 反向时序 | **成立**：已知账号 1 ms（走 accessCode 分支），未知账号 78 ms | 该分支也做一次等价代价哈希。修后两边 **13–15 ms** |
| M-5 prelogin 真实 KDF + 注册提示 | 成立（前几轮已记录） | 协议决定 + 限流，见第九节 |
| 低危：DELETE 返回 200 | 成立，但**删的是 `u/{自己}/...` 路径**，删不到他人数据；幂等 200 是 REST 惯例 | 保留 |
| 低危：删号不清 idx/authreq | 成立 | 删号时一并清理 `sendIndex`（校验归属）与 `authRequestIndex` |
| 低危：2FA 激活消耗当前 step | 成立：刚激活立刻登录必然失败 | 激活写 `lastUsed: 0`，不再占用当前时间步 |
| 低危：旧 multipart 无大小上限 | 成立 | 加 `UPLOAD_MAX_BYTES` 检查（413） |
| 低危：`direct=null` 与文档不符 | 成立（是死变量，但被 `fileUploadType` 引用） | 内联成常量 0，注释说明"没有对象存储预签名能力，一律 DIRECT" |
| 低危：缺 HSTS/CSP | 成立 | 加 `Strict-Transport-Security` 与 `default-src 'none'` 的 CSP（函数只返回 JSON 和自带 404 页） |
| 低危：`test-entry.mjs` 引用不存在文件 | 成立 | 已删除（上一轮） |

新增回归（smoke 第 31 节）：hex(对方 accessId) 建 Send → 409、Alice 链接内容不被替换、删除不影响他人、非 hex / 穿越 id → 400、旧 multipart 通道同样 400。

---

## 十二、L-4 收口：实测出可信 IP 头

用一个独立的单文件探测项目（`probe/`）在 Makers 国内站跑了一次，拿到的原始数据：

```json
"ipLike": {
  "eo-connecting-ip": "123.12.70.167",
  "x-forwarded-for": "123.6.40.114, 11.163.36.137, 10.132.167.133",
  "x-real-ip": "11.163.36.137"
}
```

对照后结论明确：

| 头 | 实际含义 | 能否用作客户端标识 |
|---|---|---|
| `eo-connecting-ip` | 真实客户端 IP | ✅ **唯一可用** |
| `x-real-ip` | `11.163.36.137`，正好是 XFF 的第二段 —— **边缘节点**地址 | ❌ 所有人共用，拿来限流会误伤全部用户 |
| `x-forwarded-for` | 客户端, 边缘节点, `10.132.167.133`(SCF 内网) | ❌ 取第一段可伪造，取最后一段是内网地址 |

### 改动

1. `PLATFORM_IP_HEADERS` 收敛为 `['eo-connecting-ip', 'true-client-ip', 'cf-connecting-ip']`，
   **删除** `x-real-ip` 与 `x-forwarded-for` 两条回退；
2. 拿不到可信头时 `requestIp()` 返回 `null`（不再返回 `'unknown'`）；
3. 限流遇到 `null` 时退到**共享桶**并把阈值放大 10 倍（下限 120）：
   既不误伤正常流量，也不至于完全敞开；
4. `auth-request` 的 IP 绑定改为「任一方缺失就不参与比较」，避免把所有设备判成不匹配。

### 实测验证

| 场景 | 结果 |
|---|---|
| 同一可信 IP 连打 32 次（prelogin 阈值 30） | 触发 429 ✅ |
| 无可信 IP 连打 250 次（共享桶 300） | 未触发 ✅ |
| 无可信 IP 累计 650 次 | 触发 429 ✅ |
| 40 个不同可信 IP 各打 1 次 | 未触发 ✅ |

> 剩余假设：`eo-connecting-ip` 本身是否可被客户端伪造尚未验证（客户端发 `EO-Connecting-IP: 7.7.7.7` 时平台是否覆盖）。
> 从命名与注入位置看应属平台保留头，但严格起见仍建议用 `probe/` 的第 4 个按钮做一次确认。
> 国际站（edgeone.ai）是否注入同名头未测，已保留 `true-client-ip` / `cf-connecting-ip` 作为候选。

### 后续实测（用 `probe/` 打真实部署）

| 测试 | `eo-connecting-ip` | `x-real-ip` | `x-forwarded-for` |
|---|---|---|---|
| 裸请求 | `123.12.70.167` | `11.163.21.148` | `123.6.40.114, 11.163.21.148, 10.132.166.44` |
| 伪造 `EO-Connecting-IP: 7.7.7.7` | **`123.12.70.167`** | `11.163.14.29` | 未污染 |
| 伪造 `X-Real-IP: 8.8.8.8` | `123.12.70.167` | **`11.163.13.218`** | 未污染 |
| 伪造 `X-Forwarded-For: 9.9.9.9` | `123.12.70.167` | `11.163.16.83` | **`9.9.9.9, 123.6.40.114, ...`** |
| 三个一起 | `123.12.70.167` | `11.163.1.93` | `9.9.9.9, 123.6.40.114, ...` |

- `eo-connecting-ip` 平台强制覆盖，**不可伪造** → 唯一正确选择；
- `x-real-ip` 也不可伪造，但五次请求拿到 `21.148 / 14.29 / 13.218 / 16.83 / 1.93`，是边缘节点且每次都变，无法标识客户端；
- `x-forwarded-for` 会把调用方发来的值**前置**，取第一跳即攻击者可控。

**L-4 到此收口，无需再依赖假设。**

---

## 十三、第五轮审计复核结果

### 修复项

| 编号 | 复现 | 处置 |
|---|---|---|
| **M-6** Send 口令无每-Send 失败计数 | 成立：150 次错口令 429=0，77.8 次/秒 | 新增 `verifySendPassword()`：每条 Send 记录 `failedAttempts`，连续 5 次失败锁 15 分钟，成功清零。**换 IP 也挡得住**（实测 6 次错口令后锁定，锁定期内正确口令同样 401） |
| **M-7** bulk 接口 ids 未校验 | 成立：4 处 `200` | 新增 `readBulkIds()`，任一 id 非法整体 400。实测 6 条 bulk 路由全部 400，合法 id 仍 200 |
| **L-13** create/update 不校验 folderId 归属 | 成立 | 新增 `requireOwnFolder()`，create 与 update 都先校验；move 原本就有。他人 folder → 400 |
| **L-14** 恢复码 / TOTP key 用 `!==` | 成立 | 三处（恢复码、TOTP key、remember token）改用 `safeEqual()` |
| **L-15** 注册不校验邮箱格式 | 成立：`a<b>@example.com` → 200 | 加 `EMAIL_RE`（本地部分 + 至少一个点分隔域名，长度 ≤254）。三种非法格式均 400 |
| **L-16** `auth-requests/:id/response` 无限流 | 成立 | 加 20/min 限流 |

### 本轮修复引入的边界（N 系列）

| 编号 | 问题 | 处置 |
|---|---|---|
| **N-1** 共享桶放大导致 DoS 反噬 | 成立：无 IP 头时 31 次 prelogin 就让所有用户 429 | 敏感端点改用**宽松总闸** `SHARED_STRICT_FLOOR = 600`：打满代价从 31 次抬到 601 次。实测 35 次不触发、第 601 次触发；有可信 IP 时仍按原阈值 30 |
| **N-2** `ipMismatch` 缺头时静默失效 | 成立（有意保留） | 保持 fail-open：accessCode 才是主要凭据，IP 只是纵深防御。若改成 fail-closed，国际站上 login-with-device 会完全不可用。已在代码注释与本节写明 |
| **N-3** `claimSendIndex` 读-再-写非原子 | 成立：两用户并发同 id → `[200,200]` | 加**写后回读校验**：写完再读一次，发现被覆盖就返回冲突，把双写降级成"一方失败"。Blob 无条件写，这是能做到的最好程度；且 id 默认 v4 UUID 不可预测 |

### 顺带修正

`sendPasswordHash` / `pbkdf2B64url` 也改成线程池异步实现 —— 之前 Send 口令的 PBKDF2 是同步的，实测把单进程钉在 ~78 次/秒并阻塞其他请求。这也正是 M-6 里"同步 PBKDF2 反成限速器"的来源。

新增回归（smoke 第 32 节，共 15 条）：bulk 6 条路由非法 id → 400、合法 id → 200、三种非法邮箱 → 400、他人 folderId → 400、自己 folderId → 200、Send 口令换 IP 连错 6 次仍锁定、锁定期内正确口令被拒。

---

## 十四、N-4：上一轮修复引入的可用性 DoS

### 问题

上一版按「每条 Send 累计失败 5 次就锁 15 分钟」，且锁定期间**正确口令也被拒**。
后果：任何拿到分享链接的人，发 5 个错口令就能让合法接收方 15 分钟打不开；
每 15 分钟重复一次即可无限期阻断。这是我自己引入的 DoS。

### 修法：把「锁」拆成两件独立的事

```js
// 1) 限速按 (客户端 IP, Send) 二元组，不是按 Send
const bucketKey = keys.rate(`send-pw/${sha256(`${ip}:${send.id}`)}`);
if (sameWindow && cur.count >= 10) return { ok: false, throttled: true };

// 2) 正确口令永远放行，并清零两处计数
if (await checkSendPassword(send, candidate)) { ...clear both...; return { ok: true }; }
```

关键点：

| 项 | 旧 | 新 |
|---|---|---|
| 限速键 | 每条 Send | **(IP, Send)** |
| 阈值 | 5 次 / 15 分钟锁定 | 10 次 / 1 分钟窗口 |
| 正确口令 | 锁定期内被拒 | **永远放行** |
| 第三方影响 | 可锁死他人链接 | **只影响自己那个 IP** |
| 属主可见 | 无 | `failedAttempts` / `suspicious` |

### 实测

```
攻击者用 9.9.9.9 打满 12 次错口令
→ 合法 IP 1.2.3.4 用正确口令 -> 200  ✅（不再被第三方锁死）
→ 攻击者自己的 IP 在窗口内 -> 401 Too many attempts（范围仅限该 IP + 该 Send）
```

> 有一处刻意的取舍：**限流发生在口令校验之前**，所以打满的 IP 在窗口内即使口令正确也会被拒。
> 若改成「先校验再限流」，攻击者就能无限跑 PBKDF2 试口令（每次都拿到 401，但尝试次数不受限），
> 限流就失去意义。影响范围只有「那个 IP + 那条 Send」，1 分钟自动恢复，不波及他人。

### 同类残留（3 处，已修）

| 项 | 实测 | 处置 |
|---|---|---|
| `validId('')` 返回 true | `{ids:[""]}` → 200 | `validId` 改为 `v != null && ID_RE.test(v)`；新增 `optionalId`（缺省允许、给了必须合法）供 create 类接口使用。`{ids:[""]}` → 400，不传 id 创建 → 200 |
| 密钥轮换 `rc.folderId` 未校验归属 | 需主密码，只能写自己的 cipher | 加 `requireOwnFolder`，校验失败跳过该条 |
| 密钥轮换 `rs.id` 未过 `validId` | 需主密码，body 侧键构造 | 改为 `if (!validId(rs?.id)) continue;` |

新增回归（smoke 第 32 节补充）：第三方同 IP 打满后另一 IP 用正确口令仍 200、打满的 IP 在窗口内被限速且提示明确、`{ids:[""]}` → 400、不传 id 创建 → 200。

---

## 十五、M-8：密钥轮换的「半轮换」会静默丢数据

### 路径 A（上一轮我引入的）

```js
for (const rc of reqCiphers) {
  if (!validId(rc?.id)) continue;            // ← 静默跳过
  const folder = await requireOwnFolder(...);
  if (folder.error) continue;                // ← 静默跳过
  await mutate(...);                          // 前面的条目已经用新密钥写完了
}
```

轮换前 `["2.skip", "2.keep"]`，请求里第二条带了他人的 folderId：

```
轮换返回: 200 {}
profile.key: 2.k → 2.NEWKEY
ciphers: ["2.skip"（旧密钥密文，永久解不开）, "2.keep-rot"]
```

接口 200，用户无感知，`2.skip` 的数据永久丢失。

### 路径 B（既有）

ciphers / folders 都有「必须全量包含」的校验，**sends 没有**。
一个旧版客户端不发 `accountData.sends`，轮换就返回 200，profile.key 换了但那些 Send 的 `akey` 还是旧的 → 客户端解不开。

### 修法：所有校验前置，三个集合都要求全量

```js
// 1) 三个集合都取现有数据（sends 过滤掉 .bin，只要元数据）
const curSends = ...;

// 2) 完整性：少提交任何一个都 400
if (reqCiphers.length !== curCiphers.length ||
    reqFolders.length !== curFolders.length ||
    reqSends.length   !== curSends.length) return 400;

// 3) id 必须都属于自己
// 4) folderId 归属全部预校验，任何一条不合法就整体 400（不再 continue）
const rotFolderIdOf = new Map();
for (const rc of reqCiphers) { ...校验... }
// 5) 全部通过后才开始写
```

### 实测

| 场景 | 结果 |
|---|---|
| 轮换带他人 folderId | **400**，cipher 名称仍是 `2.keep,2.skip`（未被改名） |
| 拒绝后旧口令登录 | **200**（profile 未被换，没有半轮换） |
| 轮换不带 sends | **400** |
| 全量轮换 | **200**，cipher 全部改名、send 的 `akey` 更新为 `2.NEW-AKEY` |

---

## 十六、N-5：抗爆破被 N-4 削弱后的补充

N-4 把「每条 Send 硬锁 5 次/15 分钟」换成「(IP, Send) 10 次/分钟」之后，
跨 IP 的累计尝试失去了上限：30 个 IP 各打 1 次，全部被处理。

补充一个**软上限**，兼顾两边：

```js
const SEND_PW_SOFT_CAP = 50;              // 单 Send 累计失败到 50
const SEND_PW_COOLDOWN_DELAY_MS = 600;    // 之后错误口令每次多等 600ms

// 正确口令走的是这条分支，完全不受影响
if (await checkSendPassword(send, candidate)) { ...clear...; return { ok: true }; }

// 到线后只拖慢错误口令
if (fails >= SEND_PW_SOFT_CAP) { await sleep(600); return { ok:false, coolingDown:true, ... }; }
```

实测 30 个 IP × 2 次 = 60 次错口令，速率从 ~100 次/秒降到 **8.0 次/秒**，
而软上限触发后另一个 IP 用正确口令仍然 **200**。

> 为什么不直接硬锁：N-4 的教训就是硬锁会让第三方锁死他人的链接。
> 软上限只作用于错误口令，接收方知道口令就永远进得去。

---

## 十七、N-6：软上限的 sleep 变成了并发槽放大器（我引入的）

### 实测

```
软上限前 单次错口令: 13ms
软上限后 单次错口令: 632ms      ← 每个请求占住并发槽 630ms
6 并发: [631ms,401] ×6, 总耗时 647ms
```

平台单实例并发 20，于是占满槽位只需要 **~33 req/s**（此前要 ~1540 req/s）。
等于把「CPU 爆破」换成了「并发槽耗尽」，成本反而更低。

### 修法

`await sleep(600)` 换成**立即 429 + Retry-After**，并把 `status`/`retryAfter` 透传给 4 个调用点：

```js
if (fails >= SEND_PW_SOFT_CAP) {
  return { ok: false, coolingDown: true, status: 429, retryAfter: 60, error: '...' };
}
```

### 实测（修后）

```
软上限后单次: 12ms status=429 retry-after=60
6 并发: [16ms,429] [15ms,429] [15ms,429] [15ms,429] [28ms,429] [28ms,429]
6 并发总耗时: 28ms     ← 从 647ms 降下来，不再占槽
软上限后正确口令 -> 200
```

---

## 十八、七项低危复核

| 编号 | 复核结论 | 处置 |
|---|---|---|
| **L-17** 流式下载 `content-length` 取自 `head()` | **成立**。根因在 `MemoryStore.head()`：二进制返回 `JSON.stringify(buffer).length`，3 字节变 35。线上 Blob 走元数据所以正常，但一旦偏差就截断/挂起 | `head()` 区分 Buffer 与 JSON 返回真实字节数；流式分支**不再设** `content-length`（chunked 传输没有这个风险）。实测下载 3 字节、无该头、内容正确 |
| **L-18** 未配置分支打印完整邮箱 + `from` 可污染邮件头 | **成立** | 未配置分支改用 `maskEmail`；新增 `isSafeMailAddress()` 挡住 CR/LF 与尖括号，`MAIL_FROM_NAME` 剔除 `"<>` 并截断 120 字符 |
| **L-19** TOTP 用 `===`；`ALLOW_TOTP_DRIFT` 默认 true | **成立** | 改用 `safeEqual`。`validateTotp` 的 `step <= lastUsed` 已经防重放，漂移窗口是可配置项，保留默认 `true` 以兼容时钟偏差，已在 README 表格写明 |
| **L-20** `sealSecret` 密钥由 `JWT_SECRET` 派生 | **成立且后果严重**：轮换 `JWT_SECRET` 后所有已存恢复码失效，而 2FA 还开着 → 用户被永久锁在门外 | 见下方「L-20 修订」 |
| **L-21** `store.list()` 忽略分页 | **误报**。`@edgeone/pages-blob` 的 `ListOptions.paginate` **默认 `true`**，SDK 内部自动聚合全部页（见 `index.d.ts:54-55`） | 不改。已在复核记录中说明依据 |
| **L-22** 运维脚本持有 `BLOB_TOKEN` | **成立**（属凭据等级问题，不是漏洞） | `set-hint` / `peek-profile` / `repair-profile` 三个脚本头部加统一警示：等价于 Blob 完全读写权限、能读任意账号哈希与明文提示、仅限临时运维使用 |
| **L-23** 附件票据用 `:` 拼接再 `split` | **成立**（当前字段都是 UUID 所以安全，但脆弱） | 改成 JSON payload（`{u,a,e,s}`），并**保留旧格式解析**平滑过渡。实测新票据可解析、旧票据仍可用、过期票据返回 null |
| **L-24** `getStore` 缓存只按 driver 名 | **成立**：同进程多 project 时第二个实例会拿到第一个的 `BlobStore`，读写到错误的库 | 缓存键改为 `driver:projectId:storeName` |

> L-17 复核时踩了个测试自身的坑：先用 `POST .../data` 上传，路由其实是 `PUT`，
> 结果 404 被误读成「下载坏了」。和之前 bulk 路由用错方法同一类错误 —— 复核脚本本身也要核对方法。

新增回归（smoke 第 34 节，共 6 条）：软上限触发后立即 429 且 <200ms、6 并发总耗时 <400ms、软上限后正确口令仍 200、附件上传 200、下载不设 content-length、下载字节正确。

### L-20 修订：不新增环境变量，让密钥跟着数据走

第一版修法是加 `SECRET_ENCRYPTION_KEY`。这不对：**多一个必须配对的密钥，
运维就多一个把部署搞坏的机会**，而且漏配时会静默退回有问题的旧行为。

真正的需求是「轮换 `JWT_SECRET` 不能弄坏已存的恢复码」。解法不是再加一把配置密钥，
而是**让 seal 密钥不再依赖任何环境变量**：

```js
// 首次使用时随机生成 32 字节，存进存储的 sys/sealkey.json
const key = await getSealKey(store, env);   // 按 store 实例缓存，不重复读
```

写入后**回读为准**：两个实例同时首次生成时，谁最后写谁生效，双方都用回读到的那把，
不会出现「我加密用 A、他解密用 B」。

同时把三个静默行为修掉：

| 场景 | 旧 | 新 |
|---|---|---|
| 有密文但解不开 | 返回 `null`（看起来像"没有恢复码"） | `{ok:false, reason}`，调用方返回 503 并给出明确指引 |
| 旧密钥写的历史数据 | 解不开 | 用 JWT_SECRET 派生密钥重试，成功则**顺手用新密钥重封**完成迁移 |
| 历史明文 | 原样返回 | 原样返回（保持） |

### 端到端实测

```
开启 TOTP -> 200，恢复码 PCEG****
---- 轮换 JWT_SECRET ----
轮换后登录（应要求 2FA）-> 400 ✅
用 TOTP 登录 -> ✅
轮换后读恢复码 -> ✅ 与轮换前完全一致（核心修复生效）
用恢复码过 2FA -> ✅ 拿到 token
```

单元层 6 条：基本加解密、轮换后仍可解、密钥确实落在 `sys/sealkey.json`、
损坏密文返回 `ok:false`、旧密钥数据可解并标 `legacy`、历史明文原样返回。

### 取舍说明

`sys/sealkey.json` 和密文在同一个存储里。能读 Blob 的人也能读到这把密钥 ——
但那个人已经拿到全部密码哈希和所有条目密文了。封装的定位是「防意外暴露」
（日志、控制台 JSON 预览、导出、局部误读），不是「防整库沦陷」。
两害相权，**可恢复性更重要**：恢复码失效意味着用户永久失去账号。

---

## 十九、N-7：seal 密钥在陈旧读下会分裂（我引入的）

### 复现

用可编排的假存储模拟 Blob 的最终一致（读返回 `null`，写却生效）：

```
[1] 两实例密钥一致: false (已分裂)
[2] 用 B 的密钥解 A 封的数据: ok=false reason=sealed-secret-unreadable
[3] 新实例 C 解 A 的数据:     ok=false
后端最终密钥 = B 的（后写覆盖）
```

`getSealKey` 的「生成 → 写 → 回读一次」挡不住这个窗口：两个实例都读到 `null`，
各写一份，各自回读到自己那份。那一刻诞生的一条数据，此后任何实例都解不开。

### 修法（三处）

```js
// 1) 回读改成 3 次重试，把"恰好落在窗口里"的概率压到很低
async function readSealSecret(store, attempts = 3) { ...await sleep(40 * (i + 1))... }

// 2) 写路径强制绕过缓存：refresh=true。
//    否则密钥文件被替换后，在线实例会用旧密钥继续封装新数据，
//    而别的实例按存储里的新密钥去解 —— 解不开。写是稀有操作（2 个调用点），
//    多一次存储读完全划算。
const key = await getSealKey(store, env, { refresh: true });

// 3) 解密失败时自愈：清缓存 → 重读 → 再试一次，之后才退到旧密钥
if (store && sealKeyCache.has(store)) { sealKeyCache.delete(store); ...retry... }
```

### 实测

```
[1] 陈旧读后两实例一致:               ✅
[2] 新实例解 A 的数据:                ✅
[3] 替换后新写的数据别的实例能解:      ✅
[4] 替换后旧数据: ok:false（密钥真的没了，属预期，但会明确报错而非静默）
```

### 定性

`sys/sealkey.json` 是**部署期资产**：一旦存在就不该被替换或删除。
换掉它等于让所有已存的恢复码永久失效（只能靠 TOTP 登录后重新生成）。
这一点写进了代码注释、`.env.example` 和报告。

---

## 二十、L-21 再复核：SDK 确实自带分页

上一轮判定为误报，本轮再确认一次，直接引用 SDK 实现（`@edgeone/pages-blob/dist/index.js`）：

```js
list(e){
  let n = e?.paginate !== !1,            // paginate 默认 true
      r = e?.limit, s = [], ...;
  for (; d;) {
    let g = Math.min(r !== void 0 ? r - s.length : 1e3, 1e3);
    let u = await this.cosClient.listObjects(..., { marker: i, maxKeys: g, ... });
    for (let f of u.contents) s.push({ key: f.key, etag: f.etag });
    ...
    else if (u.isTruncated) { ... i = u.nextMarker; }   // 继续下一页
    else d = !1;
  }
}
```

即：默认每页 1000 条、`isTruncated` 为真就继续，直到取完。
我们的 `BlobStore.list()` 只传 `{prefix, consistency}` 也在分页范围内。

**但「默认值」是隐式依赖**：上游哪天把默认改成 `false`，
密钥轮换的完整性校验就会因为拿到不完整列表而永远 400，轮换直接做不了。
所以现在显式写死：

```js
const res = await this.#store.list({ prefix, consistency: 'strong', paginate: true });
```

把一个隐式假设变成一个显式契约，成本一行。

---

## 二十一、`Retry-After: 60` 语义修正

上一轮软上限返回的是固定 `Retry-After: 60`，但计数是**累计**且永不回落的 ——
"等一分钟再试"是假话，等多久都没用。

现在冷却期有明确终点：

```js
const cooldownUntil = Number(send.cooldownUntil ?? 0);
const cooling = cooldownUntil > now;
// 触发时：写 cooldownUntil = now + 60s，报整个窗口
// 冷却中：报真实剩余秒数
// 到期后：计数归零重来，链接自己恢复
```

实测：冷却期内 429 且 `Retry-After` 在 1–60 之间；把 `cooldownUntil` 改成过去时间后，
错误口令恢复成 401（不再永久 429），正确口令 200。

### 429 对匿名访问的语义变化（需知）

带口令的 Send，匿名访问现在可能收到 **429** 而不是 401。自研客户端如果只判断
`status === 401` 来做"口令错误"提示，需要同时处理 429（读 `Retry-After`）。
官方客户端不受影响：它把非 2xx 都当作失败展示。











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
