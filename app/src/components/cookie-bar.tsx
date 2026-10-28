/**
 * components/cookie-bar.tsx — Cookie 同意横幅（GDPR 最低要求口径）。
 *
 * 为什么不接 CookieYes 之类的第三方 CMP：
 *   ① 本应用的设计前提是「零第三方请求、<1.2s 可交互」，CMP 脚本本身要 40–80KB
 *      且在国内/东南亚访问不稳，会拖慢首屏并引入额外数据出口；
 *   ② 合规要的是「同意前不加载分析脚本」，这一点自研 40 行更可控：
 *      同意前 gtag.js 连请求都不发（比 consent mode 默认拒绝更彻底）。
 *
 * 两个按钮同等显著（无暗黑模式）：这是 GDPR 对同意有效性的实质要求。
 */

import { useEffect, useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { t } from '../i18n';
import { hasDecided, onConsentChange, saveConsent, type ConsentValue } from '../services/consent';
import { loadGtag } from '../services/analytics';

export function CookieBar(): JSX.Element | null {
  const lang = useSettings((s) => s.lang);
  const push = useApp((s) => s.push);
  const showToast = useUi((s) => s.showToast);
  const [visible, setVisible] = useState<boolean>(false);

  // 首访延迟 1.6s 再出现：不与开屏罗盘动画抢注意力，但仍属「首次访问即询问」。
  // 已作出选择的用户不显示（除非从「我的」里清除选择）。
  useEffect(() => {
    if (hasDecided()) return;
    const timer = window.setTimeout(() => setVisible(!hasDecided()), 1600);
    return () => window.clearTimeout(timer);
  }, []);

  // 从「我的 → Cookie 与统计偏好」清除选择后，横幅重新出现
  useEffect(() => onConsentChange(() => setVisible(!hasDecided())), []);

  if (!visible) return null;

  const choose = (v: ConsentValue): void => {
    saveConsent(v);
    if (v === 'all') loadGtag();
    setVisible(false);
    showToast(t('cookie.saved', lang));
  };

  return (
    <div className="cookie-bar" role="dialog" aria-live="polite" aria-label={t('cookie.title', lang)}>
      <h4>{t('cookie.title', lang)}</h4>
      <p>{t('cookie.body', lang)}</p>
      <div className="cookie-acts">
        <button type="button" className="ck-yes" onClick={() => choose('all')}>
          {t('cookie.accept', lang)}
        </button>
        <button type="button" className="ck-no" onClick={() => choose('essential')}>
          {t('cookie.essential', lang)}
        </button>
      </div>
      <button type="button" className="cookie-more" onClick={() => push('legal', { page: 'cookie' })}>
        {t('legal.cookie', lang)} →
      </button>
    </div>
  );
}
