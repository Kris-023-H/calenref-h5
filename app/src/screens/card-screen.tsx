/**
 * screens/card-screen.tsx — 吉日课帖（五版式 + 3D 倾斜 + 传帖出口 + 分享落地页预览）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { eventByKey } from '../data/events';
import { industryById } from '../data/industries';
import { sitByKey } from '../data/sits';
import { fourPillarsOf } from '../engine/pillars';
import { ZHI } from '../engine/calendar/sexagenary';
import { t, termText, tx } from '../i18n';
import { Btn, Chip } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { CARD_THEMES, CardStage, DayCardFace, type CardTheme, type CardData } from '../components/card-canvas';
import { buildShareUrl, copyText, systemShare } from '../services/share';
import { useNav } from './types';

export function CardScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const session = useApp((s) => s.session);
  const cursor = useApp((s) => s.session?.cursor ?? 0);
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();
  const [theme, setTheme] = useState<CardTheme>('paper');

  if (!session) {
    return (
      <div className="screen">
        <AppBar title={t('card.title', lang)} onBack={() => pop()} />
        <div className="hint">{t('result.noneBody', lang)}</div>
      </div>
    );
  }

  const s = session.result;
  const day = s.usable[cursor] ?? s.days[0];
  const ev = eventByKey(s.input.eventKey);
  const ind = industryById(s.input.industryId);
  const sit = sitByKey(s.input.sitKey ?? 'ziwu');
  const hour = day.goodHours[0] ?? day.hours[0];
  const fp = fourPillarsOf(day, hour?.index ?? 0);

  const data: CardData = {
    date: day.date,
    weekday: day.weekday,
    dayGZ: day.dayGZ.text,
    jianchu: day.jianchu,
    eventName: termText(ev.name, lang),
    industryName: termText(ind.name, lang),
    pillars: fp,
    sitDeg: `${ZHI[sit.zhi]}${tx('山', ' mountain', lang)}`,
    hourName: hour?.name ?? '—',
    hourRange: hour?.range ?? '',
    lang,
  };

  const shareTargets: Array<{ key: string; label: string; sub: string }> = [
    { key: 'image', label: tx('存为图片', 'Save image', lang), sub: '1080 × 1440' },
    { key: 'social', label: tx('转发至社交平台', 'Share to social', lang), sub: tx('短视频 · 图文社区 · 笔记 · 微信', 'reels · feed · notes · chat', lang) },
    { key: 'landing', label: tx('预览「受帖者」所见', 'Preview recipient view', lang), sub: tx('落地页 · 转化入口', 'landing page', lang) },
  ];

  return (
    <div className="screen">
      <AppBar title={t('card.title', lang)} onBack={() => pop()} actions={<Chip>5 {tx('版式', 'themes', lang)}</Chip>} />
      <h2 className="tt">
        {tx('一纸可传的课帖', 'A card you can pass on', lang)}
        <small>{tx('一纸可传，收到帖的人也能排自己的那一天。', 'Whoever receives it can find their own day too.', lang)}</small>
      </h2>

      <div className="seg" style={{ marginBottom: 14 }}>
        {CARD_THEMES.map((th) => (
          <button key={th.key} type="button" className={theme === th.key ? 'on' : ''} onClick={() => setTheme(th.key)}>
            {lang === 'en' ? th.labelEn : th.labelZh}
          </button>
        ))}
      </div>

      <CardStage>
        <DayCardFace data={data} theme={theme} />
      </CardStage>

      <div style={{ fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', margin: '10px 0 4px', lineHeight: 1.7 }}>
        {lang === 'en'
          ? '“Paper” for elders and formal occasions; “Lacquer” for social headers; “Teal” for SE Asia; “Ink” for study; “Vermilion” for celebrations.'
          : '「宣纸」呈长辈与正式场合，「漆金」作社媒首图，「海风」面向东南亚，「水墨」宜书房茶室，「朱印」宜喜庆与开业。'}
      </div>

      <div className="sect">
        <h3>{tx('传帖', 'Send the card', lang)}</h3>
        <em>{tx('五个出口', '3 exits', lang)}</em>
      </div>
      <div className="menu">
        {shareTargets.map((x) => (
          <div
            key={x.key}
            className="mi"
            role="button"
            tabIndex={0}
            onClick={() => {
              if (x.key === 'image') showToast(t('share.imageSaved', lang));
              else if (x.key === 'social') {
                void systemShare({
                  title: t('card.title', lang),
                  text: `${data.date.y}.${data.date.m}.${data.date.d} ${data.dayGZ}日`,
                  url: buildShareUrl({ lang, kind: 'day', ref: `${data.date.y}-${data.date.m}-${data.date.d}` }),
                }).then((ok) => {
                  if (!ok) showToast(t('share.linkCopied', lang));
                });
              } else push('share');
            }}
            onKeyDown={(e) => e.key === 'Enter' && push('share')}
          >
            <div className="mig">
              <Icon name={x.key === 'social' ? 'share' : x.key === 'landing' ? 'globe' : 'down'} size={15} />
            </div>
            <div className="mib">
              {x.label}
              <small>{x.sub}</small>
            </div>
            <Icon name="right" size={12} />
          </div>
        ))}
        <div
          className="mi"
          role="button"
          tabIndex={0}
          onClick={() => {
            void copyText(buildShareUrl({ lang, kind: 'day', ref: `${data.date.y}-${data.date.m}-${data.date.d}` })).then((ok) => {
              if (ok) showToast(t('share.linkCopied', lang));
            });
          }}
        >
          <div className="mig">
            <Icon name="globe" size={15} />
          </div>
          <div className="mib">
            {t('share.copyLink', lang)}
            <small>{tx('落地页链接', 'landing page URL', lang)}</small>
          </div>
          <Icon name="right" size={12} />
        </div>
      </div>

      <div style={{ height: 12 }} />
      <Btn variant="ghost" block onClick={() => push('pay')}>
        {t('pay.upgrade', lang)} · {tx('课帖去印记', 'remove watermark', lang)}
      </Btn>
    </div>
  );
}
