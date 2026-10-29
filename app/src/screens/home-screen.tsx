/**
 * screens/home-screen.tsx — 今日（通书口径 + 你的推演 + 起一课 + 知库入口）。
 * 通书宜忌取建除口径（JC_YI/JC_JI 数据层，对所有人一致）；
 * 「最近可用推演」按当前草稿（用事/当事人/业态）推演 120 天取首个可用日。
 */

import { useMemo } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { dayGZ, ZHI } from '../engine/calendar/sexagenary';
import { termIndexOfDate } from '../engine/calendar/solar-terms';
import { jianchuOf } from '../engine/rules/jianchu';
import { runScan } from '../engine/scan';
import { eventByKey, isTwoPerson } from '../data/events';
import { industryById } from '../data/industries';
import { JC_YI, JC_JI } from '../data/jc-tables';
import { KB_ARTICLES } from '../data/kb';
import { todayInTz } from '../services/timezone';
import { t, jianchuName, termText, tx } from '../i18n';
import { Ring, Chip } from '../components/basics';
import { BrandMark, Icon } from '../components/icons';
import { IconBtn, AppBar } from '../components/app-bar';
import { monthDay, weekdayShort, dottedDate, monthFullName, monthZhiName } from './ui-helpers';
import { useNav } from './types';
import type { DayResult, Person } from '../engine/types';
import type { CalDate } from '../engine/types';

export function HomeScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const tz = useSettings((s) => s.tz);
  const draft = useApp((s) => s.draft);
  const people = useApp((s) => s.people);
  const scans = useApp((s) => s.scans);
  const setDraft = useApp((s) => s.setDraft);
  const finishScan = useApp((s) => s.finishScan);
  const openSheet = useUi((s) => s.openSheet);
  const { push, switchTab } = useNav();

  // 「今日」按所选时区（PRD 验收 #7 时区双口径）；时区切换即重算
  const today = useMemo(() => todayInTz(Date.now(), tz), [tz]);
  const dg = dayGZ(today);
  const jc = jianchuOf(today, eventByKey(draft.eventKey).group);
  // jc.name 是建除 key（如 'man'）；JC_YI/JC_JI 以值神汉字（如 '满'）为键，需先转汉字再查表
  const jcChar = jianchuName(jc.name, 'zh');
  const ev = eventByKey(draft.eventKey);
  const ind = industryById(draft.industryId);

  const nextGood: DayResult | null = useMemo(() => {
    const persons: Person[] = draft.personIds
      .map((id) => people.find((p) => p.id === id))
      .filter((p): p is Person => Boolean(p));
    const two = isTwoPerson(draft.eventKey);
    if (!draft.generic && (persons.length === 0 || (two && persons.length < 2))) return null;
    const res = runScan(
      {
        eventKey: draft.eventKey,
        people: persons,
        industryId: draft.industryId,
        sitKey: draft.sitKey,
        startDate: today,
        span: 120,
        generic: draft.generic,
        school: draft.school,
      },
      Date.now(),
    );
    return res.usable[0] ?? null;
  }, [draft, people, today]);

  const greeting = (): string => {
    const h = new Date().getHours();
    if (lang === 'en') return h < 11 ? 'Good morning' : h < 14 ? 'Good noon' : h < 19 ? 'Good afternoon' : 'Good evening';
    const zhText = h < 11 ? '早上好' : h < 14 ? '午安' : h < 19 ? '下午好' : '晚上好';
    return tx(zhText, '', lang);
  };

  const quick: Array<[string, string, string]> = [
    ['open', '開', tx('开业参考', 'Opening', lang)],
    ['sign', '契', tx('签约参考', 'Contract', lang)],
    ['marry', '囍', tx('婚嫁参考', 'Wedding', lang)],
    ['move', '遷', tx('迁居参考', 'Relocation', lang)],
  ];

  const article = KB_ARTICLES[0];

  return (
    <div className="screen has-tab">
      <AppBar
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span className="applogo">
              <BrandMark size={20} tone="gold" />
            </span>
            <BrandMark showMark={false} text={t('app.name', lang)} tone="ink" sub={tx('历法参考', 'Almanac reference', lang)} titleSize={15} />
          </div>
        }
        actions={
          <>
            <IconBtn name="grid" label={tx('场景导览', 'Guide', lang)} onClick={() => openSheet('guide')} />
            <IconBtn name="bell" label={tx('提醒', 'Reminders', lang)} onClick={() => push('remind')} />
          </>
        }
      />

      <div className="hero">
        <div className="hz">
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            {t('home.todayTitle', lang)} ／ {greeting()}
          </div>
          <div className="hdate">
            <b>{today.d}</b>
            <span>
              {monthFullName(monthZhiOf(today))} · {monthZhiName(monthZhiOf(today))}
              {tx('月', ' month', lang)}
            </span>
          </div>
          <div className="hgz">
            {dg.text}
            {tx('日', ' Day', lang)} ／ {t('home.todayJianchu', lang)} {jianchuName(jc.name, lang)}
            {tx('日', ' Day', lang)} ／ {tx('冲', 'clash ', lang)}
            {ZHI[(dg.zhi + 6) % 12]}
          </div>
          <div className="hi-cap" role="button" tabIndex={0} onClick={() => openSheet('why')} onKeyDown={(e) => e.key === 'Enter' && openSheet('why')}>
            {tx('今日历法参考', 'Today\'s calendar reference', lang)} · {tx('通用信息', 'general info', lang)}
            <b>?</b>
            <Icon name="right" size={10} />
          </div>
          <div className="hrow">
            <div className="hi">
              <em>{t('home.todayYi', lang)}</em>
              <b>{JC_YI[jcChar] ?? '—'}</b>
            </div>
            <div className="hi">
              <em>{t('home.todayJi', lang)}</em>
              <b>{JC_JI[jcChar] ?? '—'}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="home-disc">
        {tx(
          '传统历法文化参考工具 · 仅供文化学习与研究参考，不提供任何预测、咨询或灵性指导',
          'Traditional Chinese almanac reference tool · For cultural study and research only. No predictions, consulting, or spiritual guidance.',
          lang,
        )}
      </div>

      <div className="whybar" role="button" tabIndex={0} onClick={() => openSheet('why')} onKeyDown={(e) => e.key === 'Enter' && openSheet('why')}>
        <Icon name="info" size={13} />
        <div
          dangerouslySetInnerHTML={{
            __html: tx(
              '以上为<b>传统历法通用信息</b>，按建除十二值日排，对所有人一致，<b>不针对你的出生年</b>。具体场景的参考要看人·事·日三层。',
              'Above is <b>general traditional calendar information</b> — same for everyone, <b>not tuned to your birth details</b>. A scenario query weighs person · matter · day.',
              lang,
            ),
          }}
        />
        <Icon name="right" size={11} className="ar" />
      </div>

      {nextGood && (
        <div
          className="nextday"
          style={{ marginTop: 14 }}
          role="button"
          tabIndex={0}
          onClick={() => {
            setDraft({ generic: false });
            finishScan(
              runScan(
                {
                  eventKey: draft.eventKey,
                  people: draft.personIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => Boolean(p)),
                  industryId: draft.industryId,
                  sitKey: draft.sitKey,
                  startDate: today,
                  span: 120,
                  school: draft.school,
                },
                Date.now(),
              ),
            );
            push('detail');
          }}
          onKeyDown={(e) => e.key === 'Enter' && push('detail')}
        >
          <Ring value={nextGood.score} />
          <div className="nd">
            <em>
              {t('result.nextUsable', lang)} · {termText(ev.name, lang)}（{termText(ind.name, lang)}）
            </em>
            <b>{monthDay(nextGood.date, lang)}</b>
            <span>
              {weekdayShort(nextGood.weekday, lang)} ／ {nextGood.dayGZ.text}
              {tx('日', ' Day', lang)} ／ {jianchuName(nextGood.jianchu, lang)}
              {tx('日', ' Day', lang)} ／ {tx('时辰 ', 'hour ', lang)}
              {nextGood.goodHours[0]?.name ?? '—'}
              {tx('时', '', lang)}
            </span>
          </div>
          <Icon name="right" size={14} />
        </div>
      )}

      <div className="sect">
        <h3>{tx('进行中的查询', 'Active queries', lang)}</h3>
        <em>{tx('进行中', 'Active', lang)}</em>
        <a role="button" tabIndex={0} onClick={() => switchTab('reports')} onKeyDown={(e) => e.key === 'Enter' && switchTab('reports')}>
          {t('common.all', lang)}
        </a>
      </div>
      <div className="card flat" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => switchTab('reports')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <Chip tone="gold">{termText(ind.name, lang)}</Chip>
              <Chip>
                {draft.span} {tx('天', 'days', lang)}
              </Chip>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>
              {scans.length > 0
                ? scans[0].title
                : `${termText(ev.name, lang)} · ${tx('尚未查询', 'not queried yet', lang)}`}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
              {scans.length > 0
                ? `${t('reports.count', lang, { n: scans.length })} · ${t('reports.createdAt', lang, { date: dottedDate(today) })}`
                : t('home.noRecent', lang)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="serif" style={{ fontSize: 20, fontWeight: 700, color: 'var(--gold)' }}>
              {scans.length}
            </div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em' }}>{tx('份', 'reports', lang)}</div>
          </div>
        </div>
      </div>

      <div className="sect">
        <h3>{tx('新建查询', 'New query', lang)}</h3>
        <em>{tx('New Query', 'New Query', lang)}</em>
      </div>
      <div className="quick">
        {quick.map((x) => (
          <button key={x[0]} type="button" onClick={() => push('event')}>
            <div className="qg">{x[1]}</div>
            <span>{x[2]}</span>
          </button>
        ))}
      </div>

      <div className="sect">
        <h3>{t('home.kbEntry', lang)}</h3>
        <em>{tx('典籍索引', 'Sources', lang)}</em>
        <a role="button" tabIndex={0} onClick={() => switchTab('kb')} onKeyDown={(e) => e.key === 'Enter' && switchTab('kb')}>
          {tx('浏览全部文章', 'Browse all articles', lang)}
        </a>
      </div>
      <div className="mini-art" role="button" tabIndex={0} onClick={() => push('article', { articleId: String(article.id) })}>
        <div className="thumb">
          <i />
          <b>曆</b>
        </div>
        <div className="mt">
          <b>{article.title[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</b>
          <span>
            {termText(article.category, lang)} ／ {t('kb.minutes', lang, { n: article.minutes })}
          </span>
        </div>
      </div>
      <div style={{ height: 8 }} />
    </div>
  );
}

// 节气月索引（与 engine termIndexOfDate 同源，首页展示用）
function monthZhiOf(d: CalDate): number {
  return termIndexOfDate(d).monthZhi;
}
