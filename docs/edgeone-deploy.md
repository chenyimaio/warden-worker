# 用 EdgeOne Makers 部署一套 Bitwarden 兼容密码库

> 构建原理、环境变量与完整部署步骤。

---

## 一、这个项目是什么
```bash
https://github.com/chenyimaio/warden-worker
```
`warden-worker` 是一个 **Bitwarden 兼容服务端**（协议与 Vaultwarden 对齐）

能做的事：

| 能力 | 状态 |
|---|---|
| 注册 / 登录 / 刷新令牌 | ✅ |
| 条目、文件夹、收藏、软删除与恢复 | ✅ |
| 文本 Send / 文件 Send | ✅（文件 ≤ 6 MB） |
| 附件上传下载 | ✅（≤ 6 MB） |
| TOTP  | ✅ |
| 主密码提示邮件 | ✅（可选 SMTP） |
| 网页版 Web Vault | ✅ |
| WebSocket 实时推送 | ❌（返回 426，客户端自动降级为轮询） |
| 组织 / 集合 / SSO / 通行密钥 | ❌（未实现） |

架构大致是这样：

```
浏览器 / 手机客户端
        │  HTTPS
        ▼
   EdgeOne 静态层 ── 命中 public/ 里的文件就直接返回
        │  未命中
        ▼
  Cloud Function (Node 20.19)
        │
        ├── @edgeone/pages-blob  ──►  Blob 存储（单对象 ≤ 25 MB）
        └── SMTP（可选）        ──►  邮件服务商
```

---

## 二、部署前需要准备什么

1. **一个 EdgeOne 账号**，并开通 Makers（Pages）能力
2. **一个域名**（Makers 会分配测试域名，但密码库建议绑自己的）
3. **仓库访问权限**：Fork 该仓库

---

## 三、三种部署方式

### 方式 A：一键部署（最快）

仓库 README 里有两个按钮，分别是**国内站（console.cloud.tencent.com）**和**国际站（edgeone.ai）**。点击后 EdgeOne 会引导你填入环境变量，选择离你近的那个站点即可。

### 方式 B：从 Git 导入（推荐）

1. 打开 EdgeOne 控制台 → **Pages / Makers** → **新建项目 → 导入 Git 仓库**
2. 选择你的仓库和分支（移植版在 `edgeone` 分支）
3. **关键：项目根目录填 `edgeone`**，不是仓库根
4. 构建配置一般会被 `edgeone/edgeone.json` 自动识别：

   ```json
   {
     "installCommand": "npm ci --include=dev",
     "buildCommand": "OUT=cloud-functions/[[default]].js npm run build && node scripts/fetch-web-vault.mjs && node scripts/sync-handler.mjs",
     "outputDirectory": "public",
     "nodeVersion": "20.18.0",
     "cloudFunctions": { "maxDuration": 60 }
   }
   ```

5. 填环境变量（见第四节），点部署

### 方式 C：命令行上传

适合调试，但每次都要手工同步产物，长期不如 Git 导入。

---

## 四、环境变量

### 4.1 必填（3 个）

| 变量 | 说明 | 示例 |
|---|---|---|
| `BASE_URL` | 对外访问地址，影响邮件链接和客户端配置 | `https://vault.example.com` |
| `ALLOWED_EMAILS` | 允许注册的邮箱，glob 写法，逗号分隔；**留空 = 禁止任何人注册** | `me@example.com` 或 `*@example.com` `*@example.com,me@example.com` |
| `JWT_SECRET` | 令牌签名密钥，**至少 32 位随机串** | 见下方生成命令 |

生成密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```


### 4.2 存储

| 变量 | 说明 |
|---|---|
| `STORE_DRIVER` | 存储驱动，**留空即 `blob`**；只有本地调试才需要写 `memory`（`npm run dev` 会自动使用） |
| `BLOB_STORE` | Blob 命名空间名，默认 `warden`。**改名等于换了一个空桶** |
| `BLOB_PROJECT_ID` / `BLOB_TOKEN` | 仅外部脚本 / CI 使用；函数内部会自动鉴权 |

### 4.3 可选开关

| 变量 | 默认 | 说明 |
|---|---|---|
| `PASSWORD_ITERATIONS` | `600000` | 服务端二次哈希迭代数（**不是**用户 KDF），只影响新写入的记录 |
| `UPLOAD_MAX_BYTES` | `6291456` | 单次上传上限，默认 6 MiB |
| `ALLOW_TOTP_DRIFT` | `true` | 允许 TOTP ±1 个时间步 |
> `JWT_REFRESH_SECRET` 留空时服务端用
> `HMAC-SHA256(JWT_SECRET, "warden/v1/refresh-token-signing-key")` 派生一个独立的刷新令牌密钥，

> 两种令牌不能互相冒用。只有需要单独轮换刷新令牌密钥时才显式配置它。

### 4.4 网页版（构建期生效）

| 变量 | 默认 | 说明 |
|---|---|---|
| `WEB_VAULT_ENABLED` | `true` | `false` 则构建时跳过下载，产物体积从 ~80 MB 降到接近 0 为false时send等需要webui的功能不可使用 |
| `WEB_VAULT_VERSION` | `v2026.10.1` | 固定的 Web Vault 版本 |
| `WEB_VAULT_BASE_URL` | GitHub Releases | 换镜像源用（国内构建机拉不动 GitHub 时） |

### 4.5 邮件（全部可选）

不配 `SMTP_HOST` + `MAIL_FROM` 就不发信：主密码提示接口照样返回 200，只是跳过发送。

```ini
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@example.com
SMTP_PASS=********
MAIL_FROM=no-reply@example.com
MAIL_FROM_NAME=Vaultwarden      # 可选，默认 Vaultwarden
MAIL_DRY_RUN=false              # 可选，true = 只打日志不发信
```

### 4.6 本地开发

```ini
PORT=8787
```
