/**
 * screens/share-screen.tsx — 分享落地预览（受帖者所见 + 二维码 + 三个出口）。
 * 链接形态：{host}/?lang=xx&ref=scanId|articleId&k=day|article（services/share.ts）。
 * 日课分享只带日期：受帖者打开可看到该日通书口径，并被引导起自己的课。
 */

import { useSettings } from '../store/settings-store';
import { useUi } from '../store/ui-store';
import { KB_ARTICLES } from '../data/kb';
import { dayGZ } from '../engine/calendar/sexagenary';
import { dayOfWeek, parseDate } from '../engine/calendar/julian';
import { jianchuOf } from '../engine/rules/jianchu';
import { t, jianchuName, termText, tx } from '../i18n';
import { buildShareUrl, copyText, systemShare } from '../services/share';
import { Btn, Chip } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { BrandMark, Icon } from '../components/icons';
import { analytics, EVENTS } from '../services/analytics';
import { useNav, useNavParams } from './types';
import { dottedDate, monthDay, weekdayShort } from './ui-helpers';
import type { CalDate } from '../engine/types';

export function ShareScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const params = useNavParams('share');
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();

  const ref = params?.ref ?? '';
  const kind = params?.kind ?? 'day';
  const url = buildShareUrl({ lang, ref, kind });

  const article = kind === 'article' ? KB_ARTICLES.find((a) => String(a.id) === ref) : undefined;
  const date: CalDate | null = kind === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(ref) ? parseDate(ref) : null;
  const dg = date ? dayGZ(date) : null;
  const jc = date ? jianchuOf(date, '家庭择日') : null;

  const track = (): void => {
    if (analytics.isEnabled()) analytics.track(EVENTS.shareSend, { kind, ref });
  };

  const copy = (): void => {
    track();
    void copyText(url).then((ok) => {
      if (ok) showToast(t('share.linkCopied', lang));
    });
  };

  const sys = (): void => {
    track();
    const title = kind === 'article' ? (article?.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh'] ?? t('app.name', lang)) : `${t('app.name', lang)} · ${dottedDate(date ?? { y: 1970, m: 1, d: 1 })}`;
    void systemShare({ title, text: title, url }).then((ok) => {
      if (!ok) showToast(t('share.linkCopied', lang));
    });
  };

  return (
    <div className="screen">
      <AppBar title={t('share.title', lang)} onBack={() => pop()} />

      {/* ---------- 受帖者预览 ---------- */}
      <div className="cardstage">
        <div className="gcard" style={{ maxWidth: 300, margin: '0 auto' }}>
          <div className="gc-top">
            <span className="gc-eyebrow">{t('app.nameEn', lang)} · {t('app.name', lang)}</span>
            <BrandMark size={26} tone="gold" />
          </div>
          {kind === 'article' && article ? (
            <>
              <div className="gc-date serif" style={{ fontSize: 20, lineHeight: 1.5 }}>
                {article.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}
              </div>
              <div className="gc-rows">
                <div className="gc-row">
                  <span>{termText(article.category, lang)}</span>
                  <b>{t('kb.minutes', lang, { n: article.minutes })}</b>
                </div>
                <div className="gc-row">
                  <span>{tx('出处', 'Source', lang)}</span>
                  <b>{article.books[0]}</b>
                </div>
              </div>
            </>
          ) : (
            date && (
              <>
                <div className="gc-date serif">{dottedDate(date)}</div>
                <div className="gc-gz">
                  {dg?.text}
                  {tx('日', ' Day', lang)} · {weekdayShort(dayOfWeek(date), lang)} · {monthDay(date, lang)}
                </div>
                <div className="gc-rows">
                  <div className="gc-row">
                    <span>{t('home.todayJianchu', lang)}</span>
                    <b>{jc ? jianchuName(jc.name, lang) : '—'}</b>
                  </div>
                  <div className="gc-row">
                    <span>{tx('受帖', 'Received card', lang)}</span>
                    <b>{t('share.qrHint', lang)}</b>
                  </div>
                </div>
              </>
            )
          )}
          <div className="gc-foot">
            <span className="gc-brand">{t('card.brand', lang)}</span>
            <span className="gc-no">{t('card.watermark', lang)}</span>
          </div>
        </div>
      </div>

      {/* ---------- 二维码 ---------- */}
      <div style={{ textAlign: 'center', margin: '16px 0 6px' }}>
        <div className="qr" aria-label={t('share.qr', lang)}>
          <i />
          <i />
          <i />
          <i />
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 8 }}>{t('share.qrHint', lang)}</div>
        <Chip tone="gold" >
          {url}
        </Chip>
      </div>

      {/* ---------- 出口 ---------- */}
      <div className="menu" style={{ marginTop: 14 }}>
        <div className="mi" role="button" tabIndex={0} onClick={copy} onKeyDown={(e) => e.key === 'Enter' && copy()}>
          <div className="mig">
            <Icon name="globe" size={15} />
          </div>
          <div className="mib">
            {t('share.copyLink', lang)}
            <small>{tx('落地页链接', 'landing page URL', lang)}</small>
          </div>
          <Icon name="right" size={13} />
        </div>
        <div className="mi" role="button" tabIndex={0} onClick={sys} onKeyDown={(e) => e.key === 'Enter' && sys()}>
          <div className="mig">
            <Icon name="share" size={15} />
          </div>
          <div className="mib">
            {t('share.system', lang)}
            <small>{tx('调起系统分享', 'system share sheet', lang)}</small>
          </div>
          <Icon name="right" size={13} />
        </div>
        <div
          className="mi"
          role="button"
          tabIndex={0}
          onClick={() => {
            track();
            showToast(t('share.imageSaved', lang));
          }}
          onKeyDown={(e) => e.key === 'Enter' && showToast(t('share.imageSaved', lang))}
        >
          <div className="mig">
            <Icon name="down" size={15} />
          </div>
          <div className="mib">
            {t('share.saveImage', lang)}
            <small>1080 × 1440</small>
          </div>
          <Icon name="right" size={13} />
        </div>
      </div>

      <div style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', margin: '14px 0 10px', lineHeight: 1.8 }}>
        {tx('收到链接的人看到同一日，也可由此起自己的一课。', 'Whoever opens the link sees the same day — and can run their own lesson from it.', lang)}
      </div>
      <Btn variant="ghost" block onClick={() => push('event')}>
        {t('event.start', lang)}
      </Btn>
      <div style={{ height: 8 }} />
    </div>
  );
}
