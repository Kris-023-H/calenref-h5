/**
 * screens/onboard-screen.tsx — 首次引导（4 步：通书口径 / 三元 / 交付物 / 业态）。
 * 复刻原型 arts 图示（对比 / 三元 / 交付 / 业态网格）；第 4 步可选业态。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { Btn } from '../components/basics';
import { BrandMark } from '../components/icons';
import { t, termText, tx } from '../i18n';
import type { Lang } from '../engine/types';
import { INDUSTRIES } from '../data/industries';
import { WX_LABEL } from './ui-helpers';
import { useNav } from './types';

const STEP_LABELS: Record<Lang, string[]> = {
  zh: ['通书口径', '三元定课', '交付物', '业态'],
  en: ['Almanac', 'Threefold', 'Deliverables', 'Industry'],
  'zh-Hant': ['通書口徑', '三元定課', '交付物', '業態'],
};

export function OnboardScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const draft = useApp((s) => s.draft);
  const setDraft = useApp((s) => s.setDraft);
  const showToast = useUi((s) => s.showToast);
  const { resetTo } = useNav();
  const [step, setStep] = useState(0);

  const arts: JSX.Element[] = [
    <div className="cmpv" key="a0">
      <div className="cmpv-row">
        <div className="cv-t">{tx('通书', 'ALMANAC', lang)}</div>
        <div className="cv-b">
          <em>{tx('宜纳财栽种 · 忌开市出行', 'Same for everyone', lang)}</em>
          <span>{tx('对所有人一样', 'One answer for all', lang)}</span>
        </div>
      </div>
      <div className="cmpv-row own">
        <div className="cv-t">{tx('你的', 'YOURS', lang)}</div>
        <div className="cv-b">
          <em>{tx('只对你成立', 'Only true for you', lang)}</em>
          <span>{tx('按你的出生年干支', 'By your own birth details', lang)}</span>
        </div>
      </div>
    </div>,
    <div className="tri" key="a1">
      <div className="tri-cell">
        <b>{tx('人', 'Person', lang)}</b>
        <span>{tx('出生年干支', 'Birth details', lang)}</span>
      </div>
      <span className="tri-plus">＋</span>
      <div className="tri-cell">
        <b>{tx('事', 'Matter', lang)}</b>
        <span>{tx('用事 / 业态', 'Event / trade', lang)}</span>
      </div>
      <span className="tri-plus">＋</span>
      <div className="tri-cell">
        <b>{tx('日', 'Day', lang)}</b>
        <span>{tx('月建当日', 'Day lesson', lang)}</span>
      </div>
    </div>,
    <div className="deliv" key="a2">
      <div className="hi">
        <b>{tx('推演报告', 'Report', lang)}</b>
        <span>{tx('九章 · 可导出', '9 chapters', lang)}</span>
      </div>
      <div>
        <b>{tx('吉当日帖', 'Day card', lang)}</b>
        <span>{tx('五版式 · 可传', '5 themes', lang)}</span>
      </div>
      <div>
        <b>{tx('知库', 'Library', lang)}</b>
        <span>{tx('典籍与规则', 'Rules & books', lang)}</span>
      </div>
    </div>,
    <div className="tax-grid" key="a3" style={{ padding: '4px 2px' }}>
      {INDUSTRIES.slice(0, 6).map((x) => (
        <button
          key={x.id}
          type="button"
          className={`tax${draft.industryId === x.id ? ' on' : ''}`}
          onClick={() => setDraft({ industryId: x.id })}
        >
          <div className="tx-c">{termText(x.category, lang)}</div>
          <b>{termText(x.name, lang)}</b>
          <span>{x.subs[lang === 'en' ? 'en' : lang === 'zh-Hant' ? 'zhHant' : 'zh'].split(' / ').slice(0, 2).join(' · ')}</span>
          <span className="tx-w">{WX_LABEL[x.wuxing][lang]}</span>
        </button>
      ))}
    </div>,
  ];

  const steps: Array<{ h: string; p: string; n: string }> = [
    {
      h: tx('通书给你的<br>是「这一天」', 'The almanac answers\n"how is today"', lang),
      p:
        tx('黄历上的宜忌，是按建除十二值日排的<b>通用口径</b>——同一天，对所有人都一样。可你要办的是你自己的事，用的是你自己的出生年。', 'Almanac yi/ji follow the twelve jianchu officers — the same for everyone. But your matter uses your own pillars.', lang),
      n:
        tx('通书答「今天怎么样」，条目答「今天对你这件事怎么样」。两句都对，只是层级不同。', 'The almanac answers "how is today"; the entry set answers "how is today for your matter".', lang),
    },
    {
      h: tx('三层定一次', 'Person + Matter + Day', lang),
      p:
        tx('本工具的本体是<b>人 · 事 · 日</b>三元：先看人（出生年干支），再看事（用事与业态），最后才落到当日。三层不合，日子再好也无用。', 'First the person (birth details), then the matter (event & trade), and only then the day lesson. Without all three, even a "yellow dao" day is useless.', lang),
      n:
        tx('同一天，宜开市不必宜嫁娶——这是传统历法取用的基本前提，也是通用黄历给不了的。', 'The same day suits opening a shop but not a wedding — the premise of day selection.', lang),
    },
    {
      h: tx('交付的是一份推演，<br>不是一句话', 'A full reading,\nnot one word', lang),
      p:
        tx('我们出具<b>推演报告</b>：九章结构，逐层给依据，每一层都可回溯。另有吉当日帖可传、知库可核。', 'We issue a nine-chapter lesson report — every layer traceable — plus a shareable day card and a verifiable library.', lang),
      n:
        tx('报告九章 · 当日帖五版式 · 知库 24 篇 + 25 部典籍索引，每条规则可回溯。', '9 chapters · 5 card themes · 24 articles + 25 books, every rule traceable.', lang),
    },
    {
      h: tx('先定你的业态', 'Pick your trade', lang),
      p:
        tx('业态决定行业属性取用与关键动作时点。做餐饮与做珠宝，同一个日子的条目不同。<b>可跳过</b>，之后在生辰页再选。', 'Your trade decides the attribute taking and the key action hours. Catering and jewelry score differently on the same day. You can skip and pick later.', lang),
      n:
        tx('业态只影响营生与工程类用事。嫁娶、入宅不看行业属性，看的是传统婚月与朝向。', 'Trade affects business & engineering matters only. Marriage and moving-in read the traditional marriage-month table and orientation instead.', lang),
    },
  ];

  const s = steps[step];

  const finish = (): void => {
    void setOnboarded(true).then(() => resetTo('home'));
  };

  return (
    <div className="onb">
      <div className="onb-top">
        <BrandMark size={26} tone="ink" />
        <span className="onb-skip" role="button" tabIndex={0} onClick={finish} onKeyDown={(e) => e.key === 'Enter' && finish()}>
          {t('nav.skip', lang)}
        </span>
      </div>
      <div className="onb-body">
        <div className="onb-art">
          <div className="ph2">{arts[step]}</div>
          <div className="cap">
            {tx(`第 ${step + 1} 步 ／ 共 4 步`, `Step ${step + 1} / 4`, lang)}
          </div>
        </div>
        <h2 className="onb-h" dangerouslySetInnerHTML={{ __html: s.h }} />
        <p className="onb-p" dangerouslySetInnerHTML={{ __html: s.p }} />
        <div className="onb-note" dangerouslySetInnerHTML={{ __html: s.n }} />
      </div>
      <div className="onb-foot">
        <div className="onb-dots">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i === step ? 'on' : ''} />
          ))}
        </div>
        <div className="onb-step">{STEP_LABELS[lang][step]}</div>
        <Btn
          block
          onClick={() => {
            if (step < 3) setStep(step + 1);
            else {
              if (draft.industryId) showToast(t('common.saved', lang));
              finish();
            }
          }}
        >
          {step < 3 ? t('nav.next', lang) : tx('进入应用', 'Enter Zeji', lang)}
        </Btn>
      </div>
    </div>
  );
}

/** 供其他屏幕复用：进入推演流程 */
export function goEvent(push: (k: 'event') => void): void {
  push('event');
}
