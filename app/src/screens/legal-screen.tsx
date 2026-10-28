/**
 * screens/legal-screen.tsx — 法务四页（隐私 / 条款 / 退款 / Cookie）。
 *
 * 为什么做成屏内页而不是独立 HTML 文件：
 *   ① 站点是单页应用，独立 .html 要额外配置多入口与 SW 预缓存；
 *   ② 审核方需要一个能点到的链接——`/?legal=privacy` 直接深链到本屏，
 *      与站内点击看到的内容完全一致，不会出现「页脚说 A、独立页写 B」的不一致。
 *
 * 页内四个 Tab 用 replace 切换，避免导航栈被法务页塞满。
 */

import { useSettings } from '../store/settings-store';
import { t } from '../i18n';
import { LEGAL_PAGES, LEGAL_TITLE_KEY, legalDoc, type LegalPage } from '../data/legal';
import { SITE, mailto } from '../data/site';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav, useNavParams } from './types';

export function LegalScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const params = useNavParams('legal');
  const page: LegalPage = params?.page ?? 'privacy';
  const doc = legalDoc(page, lang);
  const { pop, replace } = useNav();

  const go = (next: LegalPage): void => {
    if (next === page) return;
    replace('legal', { page: next });
  };

  return (
    <div className="screen">
      <AppBar title={t('legal.title', lang)} onBack={() => pop()} />

      {/* ---------- 页内四页切换 ---------- */}
      <div className="legal-tabs" role="tablist">
        {LEGAL_PAGES.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={p === page}
            className={`legal-tab${p === page ? ' on' : ''}`}
            onClick={() => go(p)}
          >
            {t(LEGAL_TITLE_KEY[p], lang)}
          </button>
        ))}
      </div>

      {/* ---------- 正文 ---------- */}
      <div className="card flat legal-doc">
        <h2 className="legal-h1">{doc.title}</h2>
        <div className="legal-meta">{t('legal.updated', lang, { date: doc.updated })}</div>
        <p className="legal-lead">{doc.lead}</p>

        {doc.sections.map((sec) => (
          <section key={sec.h} className="legal-sec">
            <h3>{sec.h}</h3>
            {sec.p.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            {sec.list && (
              <ul>
                {sec.list.map((li, i) => (
                  <li key={i}>{li}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="divider" />

        {/* ---------- 联系与主体 ---------- */}
        <div className="legal-contact">
          <div className="legal-contact-h">
            <Icon name="send" size={13} />
            <span>{t('legal.contactTitle', lang)}</span>
          </div>
          <a className="legal-mail" href={mailto(page === 'privacy' || page === 'cookie' ? SITE.privacyEmail : SITE.supportEmail)}>
            {page === 'privacy' || page === 'cookie' ? SITE.privacyEmail : SITE.supportEmail}
          </a>
          <p className="legal-note">{t('legal.contactBody', lang, { email: page === 'privacy' || page === 'cookie' ? SITE.privacyEmail : SITE.supportEmail })}</p>
          <p className="legal-note">{t('legal.entityLine', lang, { entity: SITE.entity, jurisdiction: SITE.jurisdiction })}</p>
        </div>

        <p className="legal-disclaimer">{t('legal.disclaimer', lang)}</p>
      </div>

      <div style={{ height: 14 }} />
    </div>
  );
}
