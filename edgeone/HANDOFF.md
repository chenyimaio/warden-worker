# 交付说明（HANDOFF）

> 目标：把 warden-worker 的 Bitwarden 兼容后端移植到 EdgeOne Makers（国内站，已备案域名），
> 存储用 Makers Blob，运行时用 Cloud Functions(Node.js)，发信走项目内 SMTP。

## 一句话状态

**代码、测试、文档已完成并在本地/HTTP 层验证通过；唯一未闭环的是在你的 Makers 账号里真实部署。**

## 交付物

| 文件 | 作用 |
|---|---|
| `src/index.js` | 全部路由（与上游 1:1，`npm run parity` 0 缺口） |
| `src/store.js` | 存储抽象：Memory（本地）/ Blob（Makers），含二进制通道与写冲突策略 |
| `src/crypto.js` | PBKDF2、TOTP、HS256 令牌、remember/refresh、附件短令牌 |
| `src/mail.js` | nodemailer 直连 SMTP + 主密码提示邮件模板 |
| `src/makers.js` | Makers 入口（同时导出 4 种签名形态，适配控制台模板） |
| `src/dev.js` | 本地运行器 |
| `scripts/` | smoke / acceptance / parity / bench-sync / blob-adapter-test / blob-selftest / test-smtp / doc-check |
| `docs/DEPLOY.md` | 部署、验收顺序、8 行故障对照表、备份建议 |
| `.github/workflows/ci.yml` | CI：check → smoke → parity → blob 契约 |

## 已验证的证据

| 项 | 结果 | 怎么复现 |
|---|---|---|
| 端到端（内存） | **126/126** | `npm run smoke` |
| 部署验收（真实 HTTP） | **24/24** | `BASE=http://127.0.0.1:8799 npm run accept` |
| 路由对齐 | **0 缺口 / 109 条注册** | `npm run parity` |
| Blob 适配契约（假 SDK） | **9/9** | `npm run test:blob` |
| 文档漂移（env / scripts） | **0** | `node scripts/doc-check.mjs` |
| `/api/sync` 成本 | 500 条 → 367 KB / CPU 5 ms；Blob ≈ 32 轮 RTT | `node scripts/bench-sync.mjs 500` |

功能覆盖：注册/登录（含 2FA TOTP + remember + 恢复码 + login with device）、sync、条目全量操作与批量、附件上传下载、Send（文本 + 文件 + 三种匿名访问）、设备、改密/KDF/security-stamp/密钥轮换、导入、头像/域设置/删号、限流、全部桩路由。

## 需要你完成的三步

1. 把本目录提交进你的仓库 → Makers 导入 → 入口 `src/makers.js` → 绑 `/api/*`、`/identity/*`
2. 按 `docs/DEPLOY.md` 填环境变量（`STORE_DRIVER=blob`、`BLOB_STORE`、`SMTP_*`、`JWT_*`、`ALLOWED_EMAILS`、`BASE_URL`）
3. 验收：
   ```bash
   BASE=https://你的域名 npm run accept
   BLOB_PROJECT_ID=... BLOB_TOKEN=... npm run blob:selftest
   SMTP_HOST=... SMTP_USER=... SMTP_PASS=... MAIL_FROM=... node scripts/test-smtp.mjs --send
   ```

## 已知限制（都写进了 README 的「风险清单」）

1. **Blob 没有条件写**（SDK 的 `onlyIfNew` 明确不生效）→ 并发改同一对象可能丢改动；已用「强一致回读 + 重放」兜底，非原子。要强一致请换 Postgres。
2. **无 WebSocket**：`/notifications/hub` 返回 426，客户端回退轮询 `/api/sync`（功能正常，不再秒同步）。
3. **限流是近似值**：Blob 最终一致 + 多实例，计数会漂移；挡脚本够用，不能当配额。
4. **免费版 Blob 1 GB**：附件是主要占用方，超额抛 `QuotaExceededError`。
5. **无邮件验证**：注册不验证邮箱归属（与上游一致），靠 `ALLOWED_EMAILS` 白名单兜底。
6. **备份**：Blob 无版本控制，删号不可逆，必须自建导出。

## 维护命令

```bash
npm run dev        # 本地起服务
npm run check      # 语法
npm run smoke      # 126 项端到端
npm run accept     # 部署验收（需 BASE）
npm run parity     # 路由对齐（CI 门禁）
npm run test:blob  # Blob 适配契约
node scripts/doc-check.mjs   # 文档漂移
node scripts/bench-sync.mjs 500  # sync 性能
```
