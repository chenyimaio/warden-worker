# EdgeOne Makers 请求头探测器

一个**单文件、零依赖、不用构建**的 Makers 项目，只干一件事：把收到的请求头原样吐出来，
用来确认平台注入了什么、客户端自带的同名头会不会被覆盖。

> 存在的理由：`requestIp()` 该信哪个头，取决于平台行为，不能靠猜。
> 这个项目跑一次就能给答案，且完全独立于 `edgeone/`（密码库）项目。

---

## 一、部署

### 方式 A：直接上传文件（最快）

只需要一个文件：

```
cloud-functions/[[default]].js
```

在 EdgeOne Makers 里新建项目，把上面这个文件放到 `cloud-functions/` 目录下即可。
**不需要** `package.json`、**不需要** `npm install`、**不需要**构建命令。

如果控制台要求填构建配置：

| 项 | 值 |
|---|---|
| 安装命令 | `node -e "process.exit(0)"` |
| 构建命令 | `node -e "process.exit(0)"` |
| 输出目录 | `public` |
| Node 版本 | `20.x` |

（`public/` 里放一个 `.gitkeep` 就够，别放 `index.html`——那会抢掉 `/` 的路由。）

### 方式 B：走 Git

把本目录推上去，根目录填 `probe`，其余同上（`edgeone.json` 已经写好了）。

---

## 二、看结果

### 网页版

打开站点根路径 `/`，页面会：

1. 列出**当前请求**的所有头，IP 类的高亮标注；
2. 提供 5 个对比按钮，点一下就用对应的伪造头发一次请求，并自动给结论：

| 结论 | 含义 |
|---|---|
| `可伪造` | 平台**没动**这个头，客户端写什么就是什么 |
| `取最后一跳可信` | 平台把自己的值**追加**在后面，取最后一段是对的 |
| `平台接管` | 平台**覆盖**成真实 IP，这个头可信 |
| `完全没收到` | 平台把这个头**剥掉**了 |

### curl（更准，能测浏览器禁止的头）

```bash
BASE=https://你的域名

# 1) 裸请求：看平台默认注入什么
curl -s $BASE/json | jq '.ipLike'

# 2) 伪造 X-Forwarded-For
curl -s -H 'X-Forwarded-For: 9.9.9.9' $BASE/json | jq '.ipLike'

# 3) 伪造 X-Real-IP
curl -s -H 'X-Real-IP: 8.8.8.8' $BASE/json | jq '.ipLike'

# 4) 伪造平台专有头（把名字换成第 1 步里看到的那个）
curl -s -H 'EO-Connecting-IP: 7.7.7.7' $BASE/json | jq '.ipLike'

# 5) 看全部头 + 运行时信息
curl -s $BASE/json | jq
```

---

## 三、怎么读

关键看**第 1 步（裸请求）**：

- 如果裸请求里**只有** `x-forwarded-for`，且值就是你的真实 IP → 平台注入了它，但**没剥离**客户端自带的；
  这时必须取**最后一段**（平台追加在尾部）。
- 如果裸请求里有 `eo-connecting-ip` / `true-client-ip` 这类**平台专有头** → 用它，并确认第 4 步
  伪造它时会被覆盖或忽略。
- 如果裸请求里**什么 IP 头都没有** → 平台不透传客户端 IP，按 IP 限流在这套部署上做不到，
  只能退化成「按账号/邮箱限流」。

把结论告诉我，我把 `edgeone/src/index.js` 里的 `PLATFORM_IP_HEADERS` 收敛成唯一那个可信头。

---

## 四、JSON 字段

```json
{
  "ok": true,
  "method": "GET",
  "url": "https://.../json",
  "headerCount": 12,
  "ipLike": { "x-forwarded-for": "9.9.9.9, 1.2.3.4" },
  "headers": { "...": "全部头，键名已转小写" },
  "serverTime": "2026-11-10T06:00:00.000Z",
  "runtime": "v20.19.0",
  "region": "ap-shanghai",
  "envKeys": ["TENCENTCLOUD_REGION", "..."]
}
```

`envKeys` 只列**名字**、不列值，用来确认平台注入了哪些环境变量。

---

## 五、路由

| 路径 | 说明 |
|---|---|
| `GET /` | 交互页面 |
| `GET /json` | 当前请求的完整头（JSON） |
| `GET /echo` | 同 `/json` |
| 其它 | `404 {error:'not_found'}` |

全部响应带 `cache-control: no-store`，不会被 CDN 缓存干扰。
