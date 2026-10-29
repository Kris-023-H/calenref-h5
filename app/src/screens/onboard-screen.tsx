/**
 * screens/onboard-screen.tsx — 首次引导（4 步：典籍索引 / 场景检索 / 交付物 / 业态）。
 * 按第三轮定位重写：这一屏是新用户对产品的第一印象，必须读起来像知识工具，
 * 而不是「按出生年算命」的择日器。
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
  zh: ['典籍索引', '场景检索', '交付物', '业态'],
  en: ['Sources', 'Scenario lookup', 'Deliverables', 'Industry'],
  'zh-Hant': ['典籍索引', '場景檢索', '交付物', '業態'],
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
        <div className="cv-t">{tx('通用日历', 'ALMANAC', lang)}</div>
        <div className="cv-b">
          <em>{tx('宜纳财栽种 · 忌开市出行', 'Same for everyone', lang)}</em>
          <span>{tx('对所有人一样', 'One answer for all', lang)}</span>
        </div>
      </div>
      <div className="cmpv-row own">
        <div className="cv-t">{tx('场景查询', 'YOUR QUERY', lang)}</div>
        <div className="cv-b">
          <em>{tx('按场景检索规则', 'Rules by scenario', lang)}</em>
          <span>{tx('结合你的出生年与条件', 'With your birth year and conditions', lang)}</span>
        </div>
      </div>
    </div>,
    <div className="tri" key="a1">
      <div className="tri-cell">
        <b>{tx('人', 'Person', lang)}</b>
        <span>{tx('出生年参考', 'Birth year', lang)}</span>
      </div>
      <span className="tri-plus">＋</span>
      <div className="tri-cell">
        <b>{tx('事', 'Matter', lang)}</b>
        <span>{tx('场景 / 业态', 'Scenario / trade', lang)}</span>
      </div>
      <span className="tri-plus">＋</span>
      <div className="tri-cell">
        <b>{tx('日', 'Day', lang)}</b>
        <span>{tx('当日历法条目', 'Day entries', lang)}</span>
      </div>
    </div>,
    <div className="deliv" key="a2">
      <div className="hi">
        <b>{tx('查询报告', 'Report', lang)}</b>
        <span>{tx('九章 · 可导出', '9 chapters', lang)}</span>
      </div>
      <div>
        <b>{tx('当日历帖', 'Day card', lang)}</b>
        <span>{tx('五版式 · 可传', '5 themes', lang)}</span>
      </div>
      <div>
        <b>{tx('知识库', 'Library', lang)}</b>
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
      h: tx('26 部经典文献<br>整理成可查的条目', '26 classical texts,\nindexed as entries', lang),
      p:
        tx('《协纪辨方书》《星历考原》《营造法式》……系统把散落在各书里的历法规则整理成可检索的条目，每条都能回溯到书名与卷次。', 'Rules scattered across classical texts become searchable entries, each traceable to a title and chapter.', lang),
      n:
        tx('不是凭经验给答案，而是先把文献整理成结构。', 'Not experience-based guesswork — the texts come first.', lang),
    },
    {
      h: tx('输入场景<br>检索对应规则', 'Enter a scenario,\nlook up the rules', lang),
      p:
        tx('开业、签约、上梁、嫁娶——不同场景对应不同的规则体系。系统按场景检索相关条目，再结合你填的出生年与场地条件给出日期参考。', 'Openings, signings, beam-settings, weddings — each scenario maps to its own rule set. The system retrieves matching entries, then weighs your birth year and site conditions.', lang),
      n:
        tx('同一天，开业与嫁娶适用的条目不同——这是传统历法文化的基本特点。', 'The same day applies different entries to an opening and a wedding — a defining feature of Chinese calendar culture.', lang),
    },
    {
      h: tx('交付的是一份<br>可回溯的查询报告', 'A traceable report,\nnot one line', lang),
      p:
        tx('我们出具<b>九章查询报告</b>：逐层列出应用的规则与依据，每一条都可回溯。另有当日参考卡可分享、知识库可核对。', 'A nine-chapter query report lists the rules applied at every layer, each traceable — plus a shareable day card and a verifiable knowledge base.', lang),
      n:
        tx('报告九章 · 当日卡五版式 · 知识库 24 篇 + 25 部典籍索引，每条规则可回溯。', '9 chapters · 5 card themes · 24 articles + 25 books, every rule traceable.', lang),
    },
    {
      h: tx('先定你的业态', 'Pick your trade', lang),
      p:
        tx('业态决定行业属性参考与关键动作时点。做餐饮与做珠宝，同一个日子的条目不同。<b>可跳过</b>，之后在资料页再选。', 'Your trade sets the industry-attribute reference and the key action hours. Catering and jewellery read differently on the same day. You can skip and pick later.', lang),
      n:
        tx('业态只影响商业与工程类场景。婚嫁、迁居不看行业属性，看的是传统婚月与朝向。', 'Trade affects business and engineering scenarios only. Weddings and relocation read the traditional marriage-month table and orientation instead.', lang),
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
          {step < 3 ? t('nav.next', lang) : tx('进入应用', 'Get started', lang)}
        </Btn>
      </div>
    </div>
  );
}

/** 供其他屏幕复用：进入推演流程 */
export function goEvent(push: (k: 'event') => void): void {
  push('event');
}
