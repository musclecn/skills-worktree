# 泰可思新官网系统（Node + SQLite + 双语 + 后台）

基于 Next.js App Router 的“前台官网 + 后台管理”一体化系统，支持中英文内容管理、栏目配置、媒体库、RBAC 权限、自动翻译（OpenAI）。

## 技术栈

- Next.js 16 + TypeScript
- Prisma + SQLite
- 后台鉴权：Cookie Session + RBAC（`ADMIN` / `EDITOR`）
- 双语路由：`/`（中文）与 `/en`（英文）
- Docker 一键部署：`docker-compose up -d`

## 主要能力

- 前台栏目：`首页 / 产品中心 / 解决方案 / 新闻动态 / 关于我们 / 联系我们`
- 后台入口：`/admin`
- 支持内容 CRUD、排序、发布状态、草稿状态
- 支持媒体上传与复用
- 支持一键中译英（写入英文草稿，状态为 `MACHINE_TRANSLATED`）
- 支持 SEO 数据模型（`seo_meta`）

## 初始化与运行

1. 安装依赖

```bash
npm install
```

2. 配置环境变量（复制 `.env.example` 到 `.env` 并修改）

```bash
cp .env.example .env
```

常用配置项：

- `DATABASE_URL`：SQLite 数据库地址
- `SESSION_SECRET`：登录会话密钥
- `OPENAI_API_KEY` / `OPENAI_TRANSLATION_MODEL`：自动翻译（可选）
- `NEXT_PUBLIC_SITE_URL`：站点公开访问地址（用于 SEO metadata、`sitemap.xml`、`robots.txt`）
- `OPENCLAW_INGEST_TOKEN`：OpenClaw 新闻采集入库接口鉴权令牌
- `APPOINTMENT_NOTIFY_TO`：预约表单通知收件人，默认 `szwmg@163.com`
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM`：预约通知邮件 SMTP 配置，可使用阿里云企业邮箱或 DirectMail SMTP
- `SHORT_VIDEO_DIR` / `SHORT_VIDEO_PUBLIC_PATH`：短视频展示栏目目录与公开访问路径，生产环境建议将目录挂载到数据盘

3. 初始化数据库结构 + 种子数据

```bash
npm run db:setup
```

4. 启动开发环境

```bash
npm run dev
```

## 默认账号

- 管理员：`admin@sztaxs.com` / `Admin@12345`
- 编辑：`editor@sztaxs.com` / `Editor@12345`

## 旧站资源导入（_OfficialWebsite.zip）

将旧站 zip 包中的图片导入媒体库，并抽取联系方式候选信息：

```bash
npm run import:legacy -- --zip /Users/musclecn/Desktop/_OfficialWebsite.zip
```

导入报告输出到：

- `scripts/output/legacy-import-report.json`

## Docker 部署

1. 准备环境变量（推荐在服务器上设置）

- `SESSION_SECRET`
- `OPENAI_API_KEY`（可选）
- `OPENAI_TRANSLATION_MODEL`（可选）
- `NEXT_PUBLIC_SITE_URL`（建议设置为生产域名）

2. 启动

```bash
docker-compose up -d --build
```

3. 访问

- 前台：`http://<server>:3000`
- 后台：`http://<server>:3000/admin`

> 容器启动时会自动执行 `db:setup`，首次建表并写入初始数据；`./data` 与 `./public/uploads` 均已挂载持久化。

## API 概览

公开接口（只读）：

- `GET /api/public/site`
- `GET /api/public/menus`
- `GET /api/public/home`
- `GET /api/public/products?lang=zh|en[&slug=...]`
- `GET /api/public/solutions?lang=zh|en[&slug=...]`
- `GET /api/public/news?lang=zh|en[&slug=...]`
  - 支持分类筛选：`GET /api/public/news?lang=zh|en&category=company|industry`

采集发布接口（OpenClaw 推送）：

- `POST /api/openclaw/news`
- 鉴权：`Authorization: Bearer <OPENCLAW_INGEST_TOKEN>` 或 `x-openclaw-token` 头
- 支持单条对象或批量：`{ "items": [ ... ] }`
- 默认按“行业新闻”分类并直接发布，按 `externalId` / `sourceUrl` / `slug` 去重更新

后台接口（需登录）：

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`
- `POST /api/admin/translate`
- 其余 `/api/admin/*` 为栏目、页面、产品、方案、新闻、媒体、用户管理 CRUD。

OpenClaw 推送示例：

```bash
curl -X POST http://localhost:3000/api/openclaw/news \
  -H "Authorization: Bearer ${OPENCLAW_INGEST_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "externalId": "openclaw-20260406-001",
        "category": "INDUSTRY",
        "titleZh": "行业政策更新示例",
        "summaryZh": "这是采集接口推送的行业新闻摘要。",
        "contentZh": "这是采集接口推送的行业新闻正文。",
        "sourceName": "OpenClaw",
        "sourceUrl": "https://example.com/news/1",
        "publishedAt": "2026-04-06T08:00:00.000Z"
      }
    ]
  }'
```

## 短视频上传 CLI

网站的“短视频展示”栏目会读取服务器数据盘目录 `/data/sztaxs-web-media/short-videos`。
本地生成短视频后，可直接用 CLI 上传：

```bash
npm run upload:short-video -- "/path/to/video.mp4"
```

上传某个目录下全部视频：

```bash
npm run upload:short-video -- "/path/to/video-folder"
```

只上传某个目录下最新生成的视频：

```bash
npm run upload:short-video -- --latest "/path/to/video-folder"
```

默认读取 `~/Desktop/keys1.txt` 中的服务器密码，也可以用环境变量覆盖：

```bash
SZTAXS_SSH_PASSWORD="******" npm run upload:short-video -- "/path/to/video.mp4"
```

## 测试

```bash
# 单元 + 集成
npm test

# E2E
npm run test:e2e
```
