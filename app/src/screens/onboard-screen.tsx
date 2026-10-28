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
import { t, termText } from '../i18n';
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
        <div className="cv-t">{lang === 'en' ? 'ALMANAC' : '通书'}</div>
        <div className="cv-b">
          <em>{lang === 'en' ? 'Same for everyone' : '宜纳财栽种 · 忌开市出行'}</em>
          <span>{lang === 'en' ? 'One answer for all' : '对所有人一样'}</span>
        </div>
      </div>
      <div className="cmpv-row own">
        <div className="cv-t">{lang === 'en' ? 'YOURS' : '你的'}</div>
        <div className="cv-b">
          <em>{lang === 'en' ? 'Only true for you' : '只对你成立'}</em>
          <span>{lang === 'en' ? 'By your own pillars' : '按你的四柱年命'}</span>
        </div>
      </div>
    </div>,
    <div className="tri" key="a1">
      <div className="tri-cell">
        <b>{lang === 'en' ? 'Person' : '人'}</b>
        <span>{lang === 'en' ? 'Pillars' : '四柱年命'}</span>
      </div>
      <span className="tri-plus">＋</span>
      <div className="tri-cell">
        <b>{lang === 'en' ? 'Matter' : '事'}</b>
        <span>{lang === 'en' ? 'Event / trade' : '用事 / 业态'}</span>
      </div>
      <span className="tri-plus">＋</span>
      <div className="tri-cell">
        <b>{lang === 'en' ? 'Day' : '日'}</b>
        <span>{lang === 'en' ? 'Day lesson' : '月建日课'}</span>
      </div>
    </div>,
    <div className="deliv" key="a2">
      <div className="hi">
        <b>{lang === 'en' ? 'Report' : '课期报告'}</b>
        <span>{lang === 'en' ? '9 chapters' : '九章 · 可导出'}</span>
      </div>
      <div>
        <b>{lang === 'en' ? 'Day card' : '吉日课帖'}</b>
        <span>{lang === 'en' ? '5 themes' : '五版式 · 可传'}</span>
      </div>
      <div>
        <b>{lang === 'en' ? 'Library' : '知库'}</b>
        <span>{lang === 'en' ? 'Rules & books' : '典籍与规则'}</span>
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
      h: lang === 'en' ? 'The almanac answers\n"how is today"' : '通书给你的<br>是「这一天」',
      p:
        lang === 'en'
          ? 'Almanac yi/ji follow the twelve jianchu officers — the same for everyone. But your matter uses your own pillars.'
          : '黄历上的宜忌，是按建除十二值神排的<b>通用口径</b>——同一天，对所有人都一样。可你要办的是你自己的事，用的是你自己的年命。',
      n:
        lang === 'en'
          ? 'The almanac answers "how is today"; a day lesson answers "how is today for your matter".'
          : '通书答「今天怎么样」，课格答「今天对你这件事怎么样」。两句都对，只是层级不同。',
    },
    {
      h: lang === 'en' ? 'Person + Matter + Day' : '三元定一课',
      p:
        lang === 'en'
          ? 'First the person (pillars), then the matter (event & trade), and only then the day lesson. Without all three, even a "yellow dao" day is useless.'
          : '择吉的本体是<b>人 · 事 · 日</b>三元：先看人（四柱年命），再看事（用事与业态），最后才落到日课。三层不合，日子再「黄道」也无用。',
      n:
        lang === 'en'
          ? 'The same day suits opening a shop but not a wedding — the premise of day selection.'
          : '同一日课，宜开市不必宜嫁娶——这是择日学的基本前提，也是通用黄历给不了的。',
    },
    {
      h: lang === 'en' ? 'A lesson period,\nnot one word' : '交付的是课期，<br>不是一句吉凶',
      p:
        lang === 'en'
          ? 'We issue a nine-chapter lesson report — every layer traceable — plus a shareable day card and a verifiable library.'
          : '我们出具<b>课期报告</b>：九章结构，逐层给依据，每一层都可回溯。另有吉日课帖可传、知库可核。',
      n:
        lang === 'en'
          ? '9 chapters · 5 card themes · 24 articles + 25 books, every rule traceable.'
          : '报告九章 · 课帖五版式 · 知库 24 篇 + 25 部典籍索引，每条规则可回溯。',
    },
    {
      h: lang === 'en' ? 'Pick your trade' : '先定你的业态',
      p:
        lang === 'en'
          ? 'Your trade decides the five-phase taking and the key action hours. Catering and jewelry score differently on the same day. You can skip and pick later.'
          : '业态决定五行取用与关键动作时点。做餐饮与做珠宝，同一个日子的课格不同。<b>可跳过</b>，之后在生辰页再选。',
      n:
        lang === 'en'
          ? 'Trade affects business & engineering matters only. Marriage and moving-in read the marry-month and facing instead.'
          : '业态只影响营生与工程类用事。嫁娶、入宅不看业态五行，看的是女命行嫁月与坐向。',
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
            {lang === 'en' ? `Step ${step + 1} / 4` : `第 ${step + 1} 步 ／ 共 4 步`}
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
          {step < 3 ? t('nav.next', lang) : lang === 'en' ? 'Enter Zeji' : '进入择吉'}
        </Btn>
      </div>
    </div>
  );
}

/** 供其他屏幕复用：进入择日流程 */
export function goEvent(push: (k: 'event') => void): void {
  push('event');
}
