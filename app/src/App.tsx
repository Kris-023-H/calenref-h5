/**
 * App.tsx — 应用根组件：水合三套 store、分享落地、支付回跳、PWA manifest。
 *
 * 启动时序：
 *   1. settings-store.hydrate()（语言/时区/历法/引导态，IDB 或降级存储）
 *   2. app-store.hydrate()（档案/报告/收藏/提醒/凭证 + AI 配额）
 *   3. 分享落地：URL 带 ?lang&ref&k → 直接进 share 屏（受帖者所见）
 *   4. 支付回跳：URL 带 ?pay=success&sku&session_id → 写本机凭证并水合
 *   5. 法务真路径：/privacy /terms /refund /cookies → 直接进 legal 屏（支付平台审核入口）
 *   6. 语言切换 → 刷新 manifest（blob URL，图标与名称随语言）
 *
 * 引擎为纯函数；本组件是唯一允许读 URL / 时钟入口的组件层（经 store 注入）。
 */

import { useEffect } from 'react';
import { AppShell } from './components/app-shell';
import { ScreenRouter } from './screens/screen-router';
import { useApp } from './store/app-store';
import { useSettings } from './store/settings-store';
import { useUi } from './store/ui-store';
import { parseShareUrl } from './services/share';
import { applyPaymentReturn, parsePaymentReturn } from './services/pay/creem';
import { parseLegalParam, parseLegalPath } from './data/legal';
import { legalPath } from './data/site';
import { applyManifest } from './lib/pwa-manifest';
import { analytics, EVENTS, loadGtag } from './services/analytics';
import { isAnalyticsAllowed } from './services/consent';
import { t } from './i18n';

export default function App(): JSX.Element | null {
  const hydrated = useApp((s) => s.hydrated);
  const hydrate = useApp((s) => s.hydrate);
  const settingsHydrated = useSettings((s) => s.hydrated);
  const hydrateSettings = useSettings((s) => s.hydrate);
  const lang = useSettings((s) => s.lang);
  const resetTo = useApp((s) => s.resetTo);
  const push = useApp((s) => s.push);
  const setLang = useSettings((s) => s.setLang);
  const showToast = useUi((s) => s.showToast);

  // 启动：水合 + 分享落地 + 支付回跳（只跑一次）
  useEffect(() => {
    void (async () => {
      await Promise.all([hydrateSettings(), hydrate()]);
      if (analytics.isEnabled()) analytics.track(EVENTS.appOpen, {});

      // 曾同意统计的用户：启动即加载 GA4（未同意则一行请求都不会发出）
      if (isAnalyticsAllowed()) loadGtag();

      const search = window.location.search;

      // 分享落地优先：受帖者打开即见日课/文章预览
      const share = parseShareUrl(search);
      if (share) {
        if (share.lang !== useSettings.getState().lang) await setLang(share.lang);
        resetTo('share', { ref: share.ref, kind: share.kind });
      }

      // 支付回跳：向 Worker 核验订单已付后写本机凭证（见 services/pay/creem.ts）。
      // 核验要走网络、且 webhook 与回跳之间有秒级时间差需要短暂轮询，所以
      // 不能在这里 await —— 否则首屏要等好几秒。改为后台跑，成功再水合与提示。
      const pay = parsePaymentReturn(search);
      if (pay) {
        void applyPaymentReturn(pay).then(async (written) => {
          if (!written) return;
          await hydrate();
          showToast(t('pay.redeemOk', useSettings.getState().lang));
        });
      }

      // 法务页：/privacy /terms /refund /cookies 是**真 URL**。
      // 支付平台审核会直接点开这些链接并核对返回体，所以路径命中必须立刻渲染法务正文，
      // 不能被 splash / 引导页挡住。旧的 ?legal=privacy 深链保留兼容，命中后把地址栏
      // 纠正为真路径，保证刷新、分享、审核三处看到的是同一个可直达地址。
      const legalFromPath = parseLegalPath(window.location.pathname);
      const legalPage = legalFromPath ?? parseLegalParam(search);
      if (!share && legalPage) {
        // 垫一层底屏，使「返回」有去处（审核方会点返回）
        resetTo(useSettings.getState().onboarded ? 'home' : 'onboard');
        push('legal', { page: legalPage });
        if (!legalFromPath) window.history.replaceState({}, '', legalPath(legalPage));
      }

      // 清理查询串，避免刷新重复落账/重复跳分享屏（法务真路径不受影响）
      if (share || pay) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 启动仅执行一次
  }, []);

  // 语言切换 → 刷新 PWA manifest（名称/图标描述随语言）
  useEffect(() => {
    applyManifest(lang);
  }, [lang]);

  // 水合完成前不渲染屏幕（splash 由导航栈首屏负责）
  if (!hydrated || !settingsHydrated) return null;

  return (
    <AppShell>
      <ScreenRouter />
    </AppShell>
  );
}
