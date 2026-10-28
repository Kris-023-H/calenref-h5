/**
 * screens/event-screen.tsx — 用事选择（四组 18 项 + 本课取用摘要）。
 * 选事后进入 info 录四柱；页面底部给出本课的层数组装。
 */

import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { EVENTS, EVENT_GROUPS, GROUP_DESC, isBizEvent, isEngEvent, hasWuxingLayer, hasSitLayer } from '../data/events';
import { industryById } from '../data/industries';
import { t, termText, tx } from '../i18n';
import { Chip, Btn } from '../components/basics';
import { AppBar, IconBtn } from '../components/app-bar';
import { useNav } from './types';

/** 本课层数（与 engine 的层组装保持一致） */
export function courseLayers(eventKey: string): string[] {
  const base: string[] = [];
  if (eventKey === 'marry' || eventKey === 'engage') base.push('layer.marryMonth');
  else base.push('layer.monthBranch');
  base.push('layer.jianchu');
  if (hasWuxingLayer(eventKey)) base.push('layer.industryWuxing');
  if (hasSitLayer(eventKey)) base.push('layer.sittingFacing');
  base.push('layer.monthHarm', 'layer.dayClashYear', 'layer.liJue', 'layer.virtues', 'layer.goodHours');
  return base;
}

export function EventScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const draft = useApp((s) => s.draft);
  const selectEvent = useApp((s) => s.selectEvent);
  const openSheet = useUi((s) => s.openSheet);
  const { push } = useNav();
  const ind = industryById(draft.industryId);
  const ev = EVENTS.find((e) => e.key === draft.eventKey) ?? EVENTS[0];

  return (
    <div className="screen has-tab">
      <AppBar
        title={t('event.title', lang)}
        actions={
          <>
            <Chip tone="gold">{termText(ind.name, lang)}</Chip>
            <IconBtn name="grid" onClick={() => openSheet('guide')} />
          </>
        }
      />
      <h2 className="tt">
        {tx('所办何事？', 'What is the matter?', lang)}
        <small>
          {tx('用事决定取哪一套课格。同一个日课，宜开市不必宜嫁娶——这是择日学的基本前提。', 'The matter decides which lesson set applies. The same day suits opening but not marrying.', lang)}
        </small>
      </h2>

      {EVENT_GROUPS.map((g) => {
        const list = EVENTS.filter((e) => e.group === g);
        return (
          <div className="ev-group" key={g}>
            <div className="gh">
              <b>{g}</b>
              <i />
              <span>
                {list.length} {tx('项', 'items', lang)}
              </span>
            </div>
            <div className="gd">{GROUP_DESC[g][lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</div>
            <div className="ev-grid">
              {list.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  className={`ev-item${draft.eventKey === e.key ? ' on' : ''}`}
                  onClick={() => selectEvent(e.key)}
                >
                  <div className="eg">{termText(e.name, lang).slice(0, 1)}</div>
                  <b>{termText(e.name, lang)}</b>
                  <span>{e.sub[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <div className="rule-h">
        <span>{tx('本课取用', 'This lesson takes', lang)}</span>
        <i />
      </div>
      <div className="card flat">
        <div style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.85 }}>
          {tx('用事', 'Matter', lang)}　<b style={{ color: 'var(--verm)' }}>{termText(ev.name, lang)}</b>（{ev.group}）
          <br />
          {t('event.needLabel', lang)}　{ev.need[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']}
          <br />
          {tx('课格', 'Layers', lang)}　{courseLayers(draft.eventKey).map((k) => t(k as 'layer.jianchu', lang)).join(' · ')}
          <br />
          {t('event.actsLabel', lang)}　{ev.acts.map((a) => a[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh']).join(' → ')}
          {ev.twoPerson && (
            <>
              <br />
              <span style={{ color: 'var(--verm)', fontWeight: 700 }}>{t('event.twoPerson', lang)}</span>
            </>
          )}
        </div>
      </div>

      <div className="ctabar">
        <Btn block onClick={() => push('info')}>
          {t('nav.next', lang)} · {tx('录当事人四柱', 'enter pillars', lang)}
        </Btn>
      </div>
    </div>
  );
}

export { isBizEvent, isEngEvent };
