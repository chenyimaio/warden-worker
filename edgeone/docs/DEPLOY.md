# 部署到 EdgeOne Makers（国内站）

> 目标是「你在控制台点完，就能用官方 Bitwarden 客户端登录」。
> 本文按顺序执行；每一步都有可验证的结果。

## 0. 前置

- 腾讯云账号已实名
- 已备案域名（绑自定义域名必需）
- 一个 Blob 命名空间（首次 `getStore(name)` 会自动创建）
- 一个可发信的域名（腾讯云 SES 或企业邮），配好 SPF/DKIM

## 1. 准备仓库

```bash
# fork 上游后，把本目录内容提交进去（或独立仓库）
git add .
git commit -m "feat: edgeone makers port"
git push
```

本地先自检，别把问题带到云端：

```bash
npm install
npm run check      # 语法
npm run smoke      # 124 项端到端
npm run parity     # 路由对齐（0 缺口）
npm run test:blob  # Blob 适配契约
```

## 2. 建 Makers 项目

1. 控制台 → Makers → 新建项目 → 导入 Git 仓库
2. 框架：**其他 / Node.js**
3. 构建命令：`npm ci --omit=dev`（没有构建产物，纯 ESM）
4. 启动/入口：`src/makers.js`

> `src/makers.js` 同时导出了 `default(request,env,ctx)`、`default.fetch`、`onRequest`、`fetch` 四种形态，
> 控制台模板不管是哪一种都能接上；如果模板要求别的形状，只改这一个文件。

## 3. 绑路由

在 Functions 里把下面两条路由指向该函数：

```
/api/*
/identity/*
```

`/notifications/*` 不要绑（返回 426，客户端会自动回退到轮询 `/api/sync`）。

## 4. 环境变量

| 变量 | 值 |
|---|---|
| `BASE_URL` | `https://vault.example.com` |
| `ALLOWED_EMAILS` | `*@example.com`（留空 = 关闭注册） |
| `JWT_SECRET` | 随机 32+ 字节 |
| `JWT_REFRESH_SECRET` | 另一个随机 32+ 字节 |
| `STORE_DRIVER` | `blob` |
| `BLOB_STORE` | `warden` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` | `smtp.qcloudmail.com` / `465` / `true` |
| `SMTP_USER` / `SMTP_PASS` | 发信账号 |
| `MAIL_FROM` / `MAIL_FROM_NAME` | `no-reply@example.com` / `Warden` |
| `PASSWORD_ITERATIONS` | `600000`（可省） |

## 5. 部署后按顺序验收

```bash
BASE=https://vault.example.com

curl -s $BASE/api/alive            # 期望：时间戳
curl -s $BASE/api/config | head -c 300   # 期望：version/environment
```

**一条命令跑完 24 项验收**（自动注册临时账号、跑完删号）：

```bash
BASE=https://vault.example.com npm run accept
# 想保留账号排查：ACC_KEEP=1 BASE=... npm run accept
```

覆盖：alive/config → prelogin → 注册 → 登录 → sync → 文件夹/条目/收藏 → 附件上传下载（字节比对）→ 文本 Send + 匿名访问 → 开 TOTP → 无码登录被拦 → 带码登录 → 改密后旧 token 401 → 删号。


1. **SMTP 是否真的能出去**（最容易翻车的一步）
   ```bash
   SMTP_HOST=smtp.qcloudmail.com SMTP_USER=... SMTP_PASS=... MAIL_FROM=... \
     node scripts/test-smtp.mjs --send
   ```
   - 465 不通 → 试 587 / 25 / 2525
   - 全不通 → 云函数出站被拦，改走 SES HTTP API 或自建中转

2. **Blob 是否真的可读写**
   ```bash
   BLOB_PROJECT_ID=pages-xxx BLOB_TOKEN=xxx node scripts/blob-selftest.mjs
   ```

3. **客户端登录**：官方 Web/Android 指向 `https://vault.example.com`，注册 → 登录 → sync
4. **条目 CRUD**：建 → 改 → 删除进回收站 → 恢复
5. **附件**：传 1 个小文件 → 下载校验字节一致
6. **Send**：文本 Send + 文件 Send → 匿名打开
7. **2FA**：开 TOTP → 退出 → 重新登录（应要求验证码）
8. **改密**：确认其它设备被踢下线

## 6. 常见故障对照

| 现象 | 原因 | 处理 |
|---|---|---|
| 所有接口 500，日志有 `getStore is not defined` | 没装依赖 | `npm ci --omit=dev` |
| 登录 401，`/api/alive` 正常 | `JWT_SECRET` 每次部署变化 | 用控制台的固定环境变量，别用随机值 |
| 写完立刻读不到 | Blob 默认最终一致 | 本项目所有读都带 `consistency:'strong'`，若仍出现，检查是否绕过了 `store.get` |
| 附件上传 413 | `ATTACHMENT_MAX_BYTES` 太小 / 平台 body 限制 | 调大或改用 `createUploadUrl` 直传 |
| 邮件发不出但接口 200 | SMTP 失败只写日志 | 看 Functions 日志里的 `[mail]` 与 `info.response` |
| TOTP 总是错 | 手机与服务器时间偏差 > 30s | 同步 NTP，或临时 `ALLOW_TOTP_DRIFT=true` |
| 客户端一直转圈 | `/notifications/hub` 被绑到了函数且没降级 | 解绑该路由，或保留 426 让客户端回退轮询 |
| 多设备同时改同一条目丢改动 | Blob 无条件写 | 见 README「Blob 三个限制」；要强一致请换 Postgres |

## 7. 回滚

代码回滚：在 Makers 里回到上一个部署版本即可。
数据回滚：Blob 命名空间本身没有版本控制，**必须自己备份**（见下）。

## 8. 备份建议

Blob 不是数据库，没有 `mysqldump`。最低成本方案：

- 每天用 `list` 把 `u/` 前缀下的对象拉到本地（脚本 30 行）
- 或者定期用客户端「导出加密 JSON」留一份离线副本
- 删除前先导出：删号是不可逆的（会把 `u/{id}/*` 和邮箱索引一起删掉）
