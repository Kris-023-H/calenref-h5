/**
 * screens/pay-screen.tsx — 解锁页：四 SKU（USD）+ Creem 结账 + 离线兑换码。
 * 双路径（主理人拍板）：(a) 经 Worker 建 Creem checkout 后跳转，回跳由 App 核验落账；
 * (b) 兑换码离线 HMAC 校验（services/pay/redeem.ts）。
 */

import { useEffect, useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { CURRENCIES, formatPrice, SKUS, type Sku, type Currency } from '../data/prices';
import { createCheckout } from '../services/pay/creem';
import { redeemCode } from '../services/pay/redeem';
import { licenseRepo } from '../db/repos/license.repo';
import { analytics, EVENTS } from '../services/analytics';
import { t, tx } from '../i18n';
import { Btn, Chip, Seg, Ring } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';
import type { Lang } from '../engine/types';

const SKU_DESC: Record<Lang, Record<Sku, string>> = {
  zh: {
    once: '一次完整九章报告',
    ai10: '十次白话解读额度',
    pair: '双方出生资料合参一报',
    year: '全年不限次报告',
  },
  en: {
    once: 'One full nine-chapter report',
    ai10: 'Ten plain-language readings',
    pair: 'One report for both parties',
    year: 'Unlimited reports all year',
  },
  'zh-Hant': {
    once: '一次完整九章報告',
    ai10: '十次白話解讀額度',
    pair: '雙方出生资料合參一報',
    year: '全年不限次報告',
  },
};

export function PayScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const currency = useSettings((s) => s.currency);
  const setCurrency = useSettings((s) => s.setCurrency);
  const quota = useApp((s) => s.quota);
  const refreshQuota = useApp((s) => s.refreshQuota);
  const showToast = useUi((s) => s.showToast);
  const { pop } = useNav();
  const [sku, setSku] = useState<Sku>('once');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  // 固定一次的客户端标识：每次渲染重算会让同一笔订单的 clientRef 前后不一致
  const [clientRef] = useState(() => `zj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

  // 页面曝光（与点击购买的 report_buy 区分：前者是到达，后者是意图）
  useEffect(() => {
    if (analytics.isEnabled()) analytics.track(EVENTS.payView, { sku: 'entry' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅挂载时上报一次
  }, []);

  const buy = (): void => {
    if (busy) return;
    // 下单要等 Worker 调 Creem 建单，是异步的。而 window.open 一旦离开用户手势的
    // 同步上下文就会被浏览器拦截，所以先同步开一个空白窗，拿到地址后再导航进去。
    // 注意不能用 noopener 特性——它会让 window.open 返回 null，就没法回填地址了。
    const win = window.open('about:blank', '_blank');
    if (win) win.opener = null;
    setBusy(true);

    void createCheckout({ sku, lang, clientRef }).then((url) => {
      setBusy(false);
      if (!url) {
        win?.close();
        showToast(t('pay.linkFail', lang));
        return;
      }
      // 关键事件 ③：点击购买（跳转前上报，避免被新标签页打断）
      if (analytics.isEnabled()) analytics.track(EVENTS.reportBuy, { sku, currency });
      if (win) win.location.href = url;
      else window.location.href = url; // 弹窗被拦截时降级为当前页跳转
    });
  };

  const redeem = (): void => {
    if (!code.trim()) {
      showToast(t('pay.redeemEmpty', lang));
      return;
    }
    setBusy(true);
    void redeemCode(code).then(async (res) => {
      setBusy(false);
      if (!res.ok) {
        showToast(t('pay.redeemFail', lang));
        return;
      }
      if (analytics.isEnabled()) analytics.track(EVENTS.payRedeem, { sku: res.value.sku });
      showToast(t('pay.redeemOk', lang));
      setCode('');
      await refreshQuota();
    });
  };

  const restore = (): void => {
    void licenseRepo.list().then((rows) => {
      if (rows.length === 0) {
        showToast(t('pay.restoreNone', lang));
        return;
      }
      showToast(t('pay.restored', lang));
      void refreshQuota();
    });
  };

  return (
    <div className="screen">
      <AppBar title={t('pay.title', lang)} onBack={() => pop()} />

      <div className="card lacquer" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ring value={quota.unlimited ? 100 : Math.round((quota.freeLeft / 3) * 100)} dark label={quota.unlimited ? '∞' : `${quota.freeLeft}/3`} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>
              {quota.unlimited
                ? t('pay.quotaUnlimited', lang)
                : t('ai.quotaLeft', lang, { n: quota.freeLeft })}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--on-lacquer-2)', lineHeight: 1.6 }}>
              {tx('免费额度：每月 3 次 AI 解读。推演筛选不限次，报告与解读须解锁。', 'Free quota: 3 AI readings per month. Screening is unlimited; reports and readings need unlocking.', lang)}
            </div>
          </div>
        </div>
      </div>

      {/* 币种只剩 USD：单选项的分段控件没有意义，直接不渲染；将来加 EUR 会自动出现 */}
      {CURRENCIES.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <Seg options={CURRENCIES.map((c) => ({ value: c, label: t(`cur.${c}` as 'cur.CNY', lang) }))} value={currency} onChange={(c: Currency) => void setCurrency(c)} />
        </div>
      )}

      {SKUS.map((k) => (
        <div key={k} className={`plan${sku === k ? ' on' : ''}`} role="button" tabIndex={0} onClick={() => setSku(k)} onKeyDown={(e) => e.key === 'Enter' && setSku(k)}>
          {k === 'ai10' && <div className="badge">{tx('新', 'NEW', lang)}</div>}
          {k === 'year' && <div className="badge">{tx('最超值', 'BEST', lang)}</div>}
          <div className="pt">
            <b>{t(`sku.${k}` as 'sku.once', lang)}</b>
            <span className="pp">
              {formatPrice(k, currency)}
              <small>{k === 'year' ? ` / ${tx('年', 'yr', lang)}` : k === 'ai10' ? ` / 10 ${tx('次', 'uses', lang)}` : ` / ${tx('次', 'use', lang)}`}</small>
            </span>
          </div>
          <div className="pd">
            <b style={{ color: 'var(--ink-2)' }}>{SKU_DESC[lang][k]}</b>
            <br />
            {k === 'year'
              ? tx('所有用事不限次 · AI 解读无限 · 知库全解锁 · 当日帖去印记', 'Unlimited matters · unlimited AI · full library · no card watermark', lang)
              : k === 'ai10'
                ? tx('次数不清零，随用随扣', 'Readings never expire; deduct as you go', lang)
                : tx('含逐层依据、当日干支、出局归因、关键动作时点与传统条目边界声明', 'Nine chapters with per-layer basis, clash attribution, action hours', lang)}
          </div>
        </div>
      ))}

      <div className="card flat" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10.5, letterSpacing: '.16em', color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>
          {tx('兑换码', 'Redeem code', lang)}
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <input
            className="input grow"
            type="text"
            value={code}
            placeholder={t('pay.redeemPh', lang)}
            onChange={(e) => setCode(e.target.value)}
          />
          <Btn variant="gold" disabled={busy} onClick={redeem}>
            {t('pay.redeemBtn', lang)}
          </Btn>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7 }}>{t('pay.offlineNote', lang)}</div>
      </div>

      <div className="card flat" style={{ marginTop: 10 }}>
        <div style={{ fontSize: 10.5, letterSpacing: '.16em', color: 'var(--muted)', fontWeight: 700, marginBottom: 8 }}>
          {tx('支付方式', 'Payment methods', lang)}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {/* 以 Creem 实际支持为准：卡、PayPal、Apple Pay、Google Pay、支付宝
              （微信支付尚未上线；银行转账只是提现方式，非买家付款方式） */}
          {[
            ['信用卡 / 借记卡', 'Cards'],
            ['PayPal', 'PayPal'],
            ['Apple Pay', 'Apple Pay'],
            ['Google Pay', 'Google Pay'],
            ['支付宝', 'AliPay'],
          ].map(([zh, en]) => (
            <Chip key={en}>{tx(zh, en, lang)}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.7, display: 'flex', gap: 6 }}>
          <Icon name="shield" size={12} />
          {t('pay.privacy', lang)}
        </div>
      </div>

      <div style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center', marginTop: 14, lineHeight: 1.7 }}>
        {tx('购买即表示你理解：本产品提供传统历法规则的工程化推演，不预测结果、不承诺宜忌、不涉及医疗与投资建议。', 'Buying means you understand: this product engineers the traditional calendar rules — it predicts no outcomes, promises no luck, and gives no medical or investment advice.', lang)}
      </div>

      <div className="ctabar">
        <Btn block variant="gold" onClick={buy}>
          {t('pay.buy', lang)} · {formatPrice(sku, currency)}
        </Btn>
      </div>
      <Btn variant="ghost" block onClick={restore} style={{ marginTop: 8 }}>
        {t('pay.restore', lang)}
      </Btn>
    </div>
  );
}
