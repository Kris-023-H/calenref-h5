# 择吉 · Zeji — 人 · 事 · 日 三元择日 H5（出海版）

一事一议，因事择日。按中国传统择日法则，以当事人四柱为体、用事为用，八重取用逐日推演，
附三宗派对照、九章报告与可传的吉日课帖。**全部推演在本机完成，档案不离开设备；免登录。**

- 技术栈：Vite 5 + React 18 + TypeScript（strict）+ 自研屏幕栈路由 + Zustand + IndexedDB（localStorage 降级）
- 目标市场：中国大陆 / 港澳台 / 马来西亚 / 新加坡 / 泰国（简中 / 英文 / 繁中三语，五币种）
- 规则版本：`2026.10`（见 `src/engine/types.ts` `RULE_VERSION`）

---

## 快速开始

```bash
npm install          # 安装依赖（Node ≥ 18，建议 20+）
npm run dev          # 开发服务器（默认 http://localhost:5173）
npm run build        # 类型检查 + 生产构建（输出 dist/）
npm run preview      # 预览生产构建
npm test             # 运行全部测试（vitest）
npm run typecheck    # 仅类型检查（tsc --noEmit）
```

## 环境变量（.env，见 .env.example）

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `VITE_AI_ENDPOINT` | 否 | AI 推理端点。配置后 `RemoteAiService` 生效；未配置时使用 `LocalTemplateAiService` 离线模板解读（默认，不出网） |
| `VITE_STRIPE_VERIFY_URL` | 否 | Stripe 支付核验 Worker 地址（上线前部署项，见下）。未配置时支付回跳按 v1 口径直接写本机凭证 |
| `VITE_REDEEM_KEY` | 否 | 兑换码离线 HMAC-SHA-256 密钥。默认 `zeji-redeem-dev-key`；生产经构建注入 |
| `VITE_SHARE_HOST` | 否 | 分享落地页主机；空则用当前 `window.location.origin` |
| `VITE_SITE_URL` | 上线必填 | 站点根地址。**canonical / OG / JSON-LD / robots.txt / sitemap.xml 的唯一来源**，换域名只改这一处。默认 `https://zeji.app` |
| `VITE_GA4_ID` | 上线必填 | GA4 衡量 ID（`G-XXXXXXXXXX`）。留空则完全不加载 GA4；填写后仍只在用户接受 Cookie 统计后才注入脚本 |

## 目录结构（节选）

```
src/
  engine/        纯函数引擎（禁 DOM / fetch / Date.now；时间一律参数注入）
    calendar/    儒略日 / 干支 / 真太阳时 / 节气（Meeus 实现）
    rules/       建除 / 行嫁月 / 四离四绝 / 天德月德 / 冲山冲命 / 吉时
    scoring/     逐层取用与计分（SCORE_MIN = 80）
  data/          静态表：18 用事 / 业态 / 坐向 / 61 城 / 典籍 / 知库 24 篇 / 价格
                 site.ts（域名·邮箱·主体）· legal.ts（法务四页三语正文）
  i18n/          zh.ts 为唯一事实源；en / zh-Hant 由测试保障对齐
  db/            IndexedDB 仓库层（八实体）+ 备份导出导入
  services/      AI 解读（缓存→配额→生成）/ Stripe / 兑换码 / 分享 / 埋点 / consent（Cookie 同意）
  store/         app / settings / ui 三套 Zustand store
  router/        自研屏幕栈（push/pop/replace/switchTab/resetTo + 方向感知动画）
  screens/       22 屏（screen-router.tsx 注册，含 legal 法务屏）
  components/    共享组件（icons/basics/app-bar/sheet/tab-bar/app-shell/cookie-bar/…）
  styles/        tokens → base → components → screens 四层 CSS
build/
  site-meta.ts             站点元信息插件：注入 __SITE_URL__、生成 robots.txt 与 sitemap.xml
scripts/
  gen-icons.mjs            生成 PWA 图标（圭表 Logo，零依赖纯 Node）
  gen-og.py                生成 1200×630 OG 分享图（Pillow + 系统宋体）
  gen_solar_fixture.py     生成节气对拍数据集（--source sxtwl|lunar-python）
tests/
  engine/ i18n/ db/        引擎基准 / 三语对齐 / 仓库与备份集成测试
  services/legal-consent   法务四页完整性 / 深链 / 同意三态 / 关键埋点
```

## 测试与数据基准

```bash
npm test                                   # 全部（引擎 / i18n / db）
npx vitest run tests/engine/prd-measurements.test.ts   # PRD §7.3 测量可复现
```

- **节气对拍**：`tests/fixtures/solar-terms-1900-2100.csv` 与引擎 Meeus 实现逐条对拍（1900–2100）。
  重新生成（托管 venv，勿全局 pip）：

  ```bash
  C:/Users/Administrator/.workbuddy-ai/binaries/python/envs/default/bin/python \
      scripts/gen_solar_fixture.py --source lunar-python
  ```

  `--source` 可选 `auto`（默认）/ `sxtwl`（寿星天文历 C 库，需本机 C++ 编译器）/ `lunar-python`（纯 Python 轮子）。
  两个库与引擎实现互为独立算法家族，可交叉验算。
- **PWA 图标**：`npm run gen:icons` 重新生成 `public/icons/`（192/512/maskable/apple-touch-icon + svg favicon）。

## 上线前一次性清单（D-1 → D0）

顺序按依赖关系排：**法务页与独立域名必须早于支付平台申请**——审核方会打开网站核对法务页与客服邮箱，
顺序错了会白白拉低过审率。

| # | 事项 | 状态 | 说明 |
| --- | --- | --- | --- |
| 1 | 清理设计工具残留 | 已完成 | 全仓 `data-page-node-id` / `inject.js` 均为 0 处（构建产物同样已核） |
| 2 | `<head>` SEO 元素 | 已完成 | title / description / OG / Twitter Card / canonical / JSON-LD（Organization + SoftwareApplication + WebSite），`lang` 保持 `zh-CN` |
| 3 | robots.txt 与 sitemap.xml | 已完成 | 由 `build/site-meta.ts` 在构建时生成（含四个法务深链），dev 服务器同样可访问 |
| 4 | 法务四页 | 已完成，**待人工审定** | Privacy / Terms / Refund / Cookie，三语，见 `/legal/` 路由与 `src/data/legal.ts` |
| 5 | 页脚挂法务链接 | 已完成 | 「我的 → 关于」底部四链 + 版权行 |
| 6 | GA4 + 关键事件 | 已完成，**待填 ID** | `date_check` / `ai_gen_start` / `report_buy`；未填 `VITE_GA4_ID` 时完全不加载 |
| 7 | Cookie 同意 Banner | 已完成 | 自研（零第三方请求），同意前不注入 gtag；可撤回 |
| 8 | OG 分享图 | 已完成 | `public/og-1200x630.png`，`npm run gen:og` 可重出 |

### 上线前必须人工确认的三处（在 `src/data/site.ts`）

```ts
entity: 'LuckyTimely',            // ① 与支付平台注册主体一致（已按 Creem 注册主体填）
supportEmail: 'kris.188h@gmail.com', // ② 必须可收信（审核方会实际发信）
jurisdiction: 'Singapore',        // ③ 准据法属地
```

外加 `.env` 的 `VITE_SITE_URL`（真实域名）与 `VITE_GA4_ID`。

这三项不只作用于法务页：`index.html` 里的 `author`、JSON-LD 的 `Organization.name`
与 `contactPoint.email` 都是 `__ENTITY__` / `__SUPPORT_EMAIL__` 占位符，构建时由
`build/site-meta.ts` 从 `SITE` 注入。**换主体或换邮箱只改 `site.ts` 一处**，不会漏。

### 法务页访问方式

- 站内：「我的 → 关于 → 页脚四链」
- 直接链接（给审核方 / 放支付平台申请表）：`https://<域名>/?legal=privacy|terms|refund|cookie`
- 退款政策的关键条款：**未使用 7 日内可退；报告已生成并可查看、或 AI 次数已消耗后不退**；
  欧盟/英国用户在下单时明示同意立即履行即丧失 14 天撤回权（结账页单独一行提示）。

## 部署（Cloudflare Workers 静态资源）

线上地址：`https://zeji-h5.kris-188h.workers.dev`

**为什么是 Workers 而不是 Pages**：Pages 走「连接 Git 仓库 → 填构建命令 → 填输出目录」，
配置存在云端；Workers 走 `wrangler.toml`，配置在仓库里，一次写对、换人换机器都一样。
代价是 Workers **没有「构建输出目录」这个概念**——必须用 `[assets]` 显式声明，
否则它会把仓库根目录当静态资源发布，结果是首页白屏、`/src/main.tsx` 直接 404。

```toml
# app/wrangler.toml
name = "zeji-h5"
compatibility_date = "2026-10-01"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"   # 深链回退到 index.html
```

部署（`wrangler` 已在 devDependencies，无需全局安装）：

```bash
cd app
VITE_SITE_URL="https://zeji-h5.kris-188h.workers.dev" npm run build
CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ACCOUNT_ID=xxx npx wrangler deploy
```

`VITE_SITE_URL` 决定 canonical / OG / sitemap / robots 里的域名。绑了自定义域名后，
把它换成正式域名重新构建部署即可，源码里没有任何域名硬编码。

**部署后自检五项**（任一不达标说明发的是源码不是产物）：

```bash
B=https://zeji-h5.kris-188h.workers.dev
curl -s $B/ | grep -oE '<script[^>]*src="[^"]*"'   # 应为 /assets/index-<hash>.js
curl -s $B/ | grep -oE '<link rel="canonical"[^>]*>' # 应为真实域名，不能是 __SITE_URL__
curl -s $B/robots.txt                                 # 应为本项目那份（含 Sitemap 行）
curl -s -o /dev/null -w '%{http_code}\n' $B/sitemap.xml
curl -s -o /dev/null -w '%{http_code}\n' $B/og-1200x630.png
```

GitHub Actions（`.github/workflows/ci.yml`）只做 CI（typecheck + test + build），
**不负责部署**——部署由上面那条 `wrangler deploy` 完成。

## 上线前部署项（按优先级）

1. **Stripe 支付核验 Worker（P0，安全）**
   v1 口径：Payment Link 直跳 + 回跳参数（`?pay=success&sku&session_id`）在 `src/App.tsx`
   经 `applyPaymentReturn` 写本机凭证（按 `sessionId` 防重放）。**该口径可被伪造回跳利用**，
   上线前必须部署 Cloudflare Worker 核验 `session_id` 真实性（`.env` 配 `VITE_STRIPE_VERIFY_URL`），
   客户端拿 Worker 签发的授权后再写凭证。价格表：`src/data/prices.ts` 的 `PAYMENT_LINKS`（占位模板，
   上线前替换为真实 Payment Link）。
2. **兑换码密钥**：`VITE_REDEEM_KEY` 随包分发可被提取后离线造码（README 与 `services/pay/redeem.ts`
  均已声明）。权益价值低可接受；如要收紧，改服务端发码 + Worker 核验。
3. **AI 端点（P1，可选）**：默认本地模板解读不出网；如需大模型解读，部署
   `VITE_AI_ENDPOINT`（协议见 `src/services/ai/remote-ai.ts` 的 `AiService` 接口），
   并确保端点不接收可识别个人的信息（只传推演结果结构）。
4. **节气数据源**：本机无 C++ 编译器，fixture 实际由 `lunar-python` 生成；CI 建议固定该来源。

## 已知边界（产品口径，非缺陷）

- 农历**月日**显示为 P1；历法三口径为公历 / 干支年 / 佛历（CE+543）。
- 吉时的**本地时刻参考**未实现：`services/timezone.ts` 的 `cstToLocal`（东八区→所选时区
  换算）尚未接入界面，吉时仅有东八区口径标注（`detail.hoursHint`）；「今日」已按所选时区
  取日（`todayInTz`，PRD 验收 #7）。
- 提醒仅存本机；联网推送为 P1。
- 知库 24 篇：标题 / 导语 / 出处 / 时长齐全；长文正文已收录 3 篇（id 1–3，三语），
  其余篇目以「导语 + 出处 + 试排入口」呈现，正文按内容排期补齐（`KbArticle.body?: L10n`）。
- 分享二维码为样式占位（`qrcode-generator` 已依赖，真实二维码渲染为 P1）；
  支付隐私口径：卡号由 Stripe 处理，本机不接触。

## 架构与合规

- 引擎为纯函数层：禁 DOM / fetch / `Date.now`，时间由 store 层注入；引擎只输出 reason code，
  人类可读文案由 `i18n/engine-text.ts` 组装。
- 颜色只用 `src/styles/tokens.css` CSS 变量；组件内禁硬编码色值。
- 隐私：档案 / 报告 / 收藏 / 提醒仅存本机（IndexedDB，隐私模式下降级 localStorage）；
  AI 解读默认本地生成，不上传任何信息；匿名埋点可在「我的 — 设置」整体关闭。
- 免责：产品提供传统择日规则的工程化推演，不预测结果、不承诺吉凶、不构成医疗 / 法律 / 投资建议。
