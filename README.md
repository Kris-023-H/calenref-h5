# 择吉 · Zeji（出海版 H5）

海外华人的三元择日工具：免注册免登录、数据只留本机、中英与繁体三语。
本仓库包含可上线的 H5 应用与配套产品文档。

```
app/      Vite 5 + React 18 + TypeScript 的 H5 应用（构建、测试、部署入口）
docs/     出海增量 PRD 与架构设计（32 任务拆分、时序图、类图）
```

## 快速开始

```bash
cd app
npm install
npm run dev        # http://localhost:5173
npm test           # 169 个用例（引擎 / i18n / db / 服务 / 路由 / 合规）
npm run build      # 类型检查 + 生产构建 → app/dist
```

## 部署

推送到 `main` 后，GitHub Actions 自动构建并发布到 GitHub Pages
（见 `.github/workflows/deploy.yml`）。首次使用需在仓库 **Settings → Pages**
把 Source 设为 **GitHub Actions**。

上线前必须替换的配置见 `app/README.md` 的「上线前一次性清单」：
运营主体与客服邮箱（`app/src/data/site.ts`）、站点域名（`VITE_SITE_URL`）、
GA4 衡量 ID（`VITE_GA4_ID`）。

## 目录速览

- `app/src/engine/` — 纯函数择日引擎（禁 DOM / fetch / 时钟；时间由调用方注入）
- `app/src/data/legal.ts` — 法务四页三语正文（隐私 / 条款 / 退款 / Cookie）
- `app/src/services/consent.ts` — Cookie 同意状态（同意前不加载任何分析脚本）
- `app/build/site-meta.ts` — 构建期注入 canonical/OG 并生成 robots.txt、sitemap.xml

设计稿原始文件（`.wb-lib/`）不入库：其中含设计工具的 `data-page-node-id`
标记与 `inject.js` 外链，上线产物必须保持干净。
