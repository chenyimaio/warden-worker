# Warden：面向 Cloudflare Workers 的 Bitwarden 兼容服务端

本项目提供一个可自托管、与 Bitwarden 客户端兼容的服务端，可免费部署到 Cloudflare Workers。
设计目标是**低维护**：部署一次就不用再管，不需要维护服务器，也没有持续费用。

> ### EdgeOne Makers 移植版（Node.js）
>
> 本仓库的 [`edgeone/`](edgeone/) 目录是把后端重写到 **腾讯云 EdgeOne Makers（国内站）** 的版本：
> Cloud Functions (Node.js) + Makers Blob 存储 + 可选的项目内直连 SMTP。
>
> 文档：[edgeone/README.md](edgeone/README.md) · 部署手册：[edgeone/docs/DEPLOY.md](edgeone/docs/DEPLOY.md)
>
> [![使用 EdgeOne Makers 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?project-name=warden-edgeone&repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&build-command=npm%20run%20build&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE)
>
> 图片没显示时：[国内站一键部署（console.cloud.tencent.com）](https://console.cloud.tencent.com/edgeone/pages/new?project-name=warden-edgeone&repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&build-command=npm%20run%20build&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE) · [国际站一键部署（edgeone.ai）](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2Fchenyimaio%2Fwarden-worker%2Ftree%2Fedgeone&root-directory=edgeone&install-command=npm%20ci&env=BASE_URL%2CALLOWED_EMAILS%2CJWT_SECRET%2CJWT_REFRESH_SECRET%2CSTORE_DRIVER%2CBLOB_STORE)
>
> 两个链接都会预填：仓库/分支 `edgeone`、根目录 `edgeone`、安装 `npm ci`、构建 `npm run build`、6 个环境变量名。输出目录留空。

## 为什么还要做一个 Bitwarden 服务端？

像 Vaultwarden 这样的项目已经提供了很好的自托管方案，但它们仍然需要你维护一台服务器或 VPS。
这很麻烦，而且一旦忘记续费，你可能就失去了对所有密码的访问。

Warden 想用 Cloudflare Workers 生态解决这个问题：把 Warden 部署到一个 Worker，用 Cloudflare D1 存数据，
就能得到一个完全免费、无服务器、几乎不用维护的 Bitwarden 服务端。

## 功能

- **核心保险库**：条目的增删改查、文件夹管理全部支持。
- **TOTP 支持**：保存并生成基于时间的一次性密码。
- **Bitwarden 兼容**：可与官方 Bitwarden 浏览器扩展和 Android App 配合使用（iOS 未测试）。
- **免费托管**：跑在 Cloudflare 免费额度内。
- **低维护**：部署一次即可长期不管。
- **数据自持**：数据存在你自己的 Cloudflare D1 数据库里。
- **部署简单**：用 Wrangler CLI 几分钟就能跑起来。

## 当前状态

本项目尚未实现全部功能。目前支持个人保险库的核心能力（含 TOTP），但**不支持**：

- 共享
- Bitwarden Send
- 组织（Organizations）
- 其他 Bitwarden 高级功能

短期内没有实现这些功能的计划。本项目的目标很明确：提供一个简单、免费、低维护的个人密码管理器。

## 兼容性

- **浏览器扩展**：Chrome、Firefox、Safari 等。
- **Android App**：官方 Bitwarden Android 客户端。
- **iOS App**：未测试。如果你有 iOS 设备，欢迎测试并反馈结果。

## 快速开始

### 前置条件

- 一个 Cloudflare 账号。
- 已安装并配置好的 Wrangler CLI。

### 部署

1. 克隆仓库：

```bash
git clone https://github.com/your-username/warden-worker.git
cd warden-worker
```

2. 创建 D1 数据库：

```bash
wrangler d1 create warden-db
```

3. 配置数据库 ID：

创建 D1 数据库时，Wrangler 会输出 `database_id`。为了避免把这个值提交进仓库，本项目通过环境变量传入。

有两种方式：

**方式一（推荐）：使用 `.env` 文件**

在项目根目录新建 `.env`，填入你的 `database_id`：

```
D1_DATABASE_ID="your-database-id-goes-here"
```

记得把 `.env` 加进 `.gitignore`，避免被提交。

**方式二：在 shell 里设置环境变量**

```bash
export D1_DATABASE_ID="your-database-id-goes-here"
wrangler deploy
```

4. 部署 Worker：

```bash
wrangler deploy
```

部署会自动建好所需的数据库表。

5. 设置环境变量：

```
ALLOWED_EMAILS=your-email@example.com
JWT_SECRET=一段很长的随机字符串
JWT_REFRESH_SECRET=另一段很长的随机字符串
```

6. 配置 Bitwarden 客户端：

在客户端的「自托管」登录界面，填入你部署好的 Worker 地址（例如 `https://warden-worker.your-username.workers.dev`）。

## 配置

本项目几乎不需要配置，主要配置项都在 `wrangler.toml` 里，用于指定 D1 数据库绑定。

## 参与贡献

欢迎贡献！如果发现 bug、想要新功能，或者想改进代码，欢迎提交 issue 或 pull request。

## 许可证

本项目基于 MIT 许可证发布，详见 [LICENSE](LICENSE) 文件。
