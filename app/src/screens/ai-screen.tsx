/**
 * screens/ai-screen.tsx — AI 解读页（配额条 + 四段生成 + 追问 + 边界声明）。
 * 生成走 app-store.generateAi（runAiReading 编排：缓存 → 付费 → 免费 → 本地/远程生成）。
 */

import { useState } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { useUi } from '../store/ui-store';
import { t, tx } from '../i18n';
import { Btn, Chip, EmptyState, Bar } from '../components/basics';
import { AppBar } from '../components/app-bar';
import { Icon } from '../components/icons';
import { useNav } from './types';

const AI_QA: Record<'zh' | 'en' | 'zh-Hant', string[]> = {
  zh: ['这一天和我属相合吗？', '如果只能选一个时辰，选哪个？', '这个日子有什么需要避开的？'],
  en: ['Does this day suit my zodiac?', 'If only one hour, which?', 'What should be avoided?'],
  'zh-Hant': ['這一天和我屬相合嗎？', '如果只能選一個時辰，選哪個？', '這個日子有什麼需要避開的？'],
};

const SECTION_TITLES: Record<'zh' | 'en' | 'zh-Hant', string[]> = {
  zh: ['一、这一日的基本盘', '二、八重取用说了什么', '三、对这件事的意味', '四、落地建议'],
  en: ['1. The day at a glance', '2. What the eight layers say', '3. What it means for this matter', '4. Practical advice'],
  'zh-Hant': ['一、這一日的基本盤', '二、八重取用說了什麼', '三、對這件事的意味', '四、落地建議'],
};

export function AiScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const session = useApp((s) => s.session);
  const quota = useApp((s) => s.quota);
  const aiSections = useApp((s) => s.aiSections);
  const aiLoading = useApp((s) => s.aiLoading);
  const generateAi = useApp((s) => s.generateAi);
  const askFollowup = useApp((s) => s.askFollowup);
  const followups = useApp((s) => s.aiFollowups);
  const showToast = useUi((s) => s.showToast);
  const { pop, push } = useNav();
  const [q, setQ] = useState('');

  const left = quota.unlimited ? 99 : quota.freeLeft;
  const titles = SECTION_TITLES[lang];

  return (
    <div className="screen">
      <AppBar
        title={t('ai.title', lang)}
        onBack={() => pop()}
        actions={<Chip tone={left > 0 ? 'gold' : 'verm'}>{left > 0 ? t('ai.quotaLeft', lang, { n: left }) : t('ai.noQuota', lang)}</Chip>}
      />
      <h2 className="tt">
        {t('ai.title', lang)}
        <small>
          {tx('解读不是重新算一遍，是把已算出的八重依据，按你的业态与用事串成可执行的一段话。每条都引规则出处。', 'A reading does not recompute — it strings the computed layers into actionable prose for your trade and matter. Every line cites its rule.', lang)}
        </small>
      </h2>

      <div className={`aibar${left <= 0 ? ' off' : ''}`}>
        <div className="ab-ic">
          <Icon name="ai" size={14} />
        </div>
        <div className="ab-t">
          <b>{left > 0 ? t('ai.quotaLeft', lang, { n: left }) : t('ai.noQuota', lang)}</b>
          <span>{tx('免费 3 次 / 月 · 年卡无限 · 追问同计 1 次', '3/month free · unlimited on yearly · follow-ups count 1', lang)}</span>
        </div>
        <div className="ab-q">
          {quota.unlimited ? '∞' : left}
          <i>{quota.unlimited ? '' : '/3'}</i>
        </div>
      </div>
      <div className="quota">
        <div className="qbar">
          <Bar percent={quota.unlimited ? 100 : Math.round((left / 3) * 100)} />
        </div>
        <span>
          {tx('已用 ', 'used ', lang)}
          <b>{quota.unlimited ? 0 : 3 - left}</b> {tx(' 次 · 每月 1 日重置', '· resets on the 1st', lang)}
        </span>
      </div>

      {aiSections.length === 4 ? (
        aiSections.map((sec, i) => (
          <div className="aicard" key={i}>
            <div className="ai-h">
              <b>{titles[i]}</b>
              <span>{tx('智能解读', 'AI', lang)}</span>
            </div>
            <div className="ai-p" dangerouslySetInnerHTML={{ __html: sec }} />
          </div>
        ))
      ) : aiLoading ? (
        <EmptyState mark="ai" title={t('ai.generating', lang)} />
      ) : left > 0 ? (
        <EmptyState
          mark="ai"
          title={tx('尚未生成解读', 'No reading yet', lang)}
          body={
            tx('点下方生成，AI 会按「结论口径 → 业态适配 → 风险与化解 → 执行建议」四段展开，每段引规则出处。', 'Tap generate — the reading unfolds in four sections, each citing its rule source.', lang)
          }
          action={
            <Btn variant="gold" onClick={() => void generateAi()}>
              {t('ai.gen', lang)} · {tx('扣 1 次', 'uses 1', lang)}
            </Btn>
          }
        />
      ) : (
        <div className="aipay">
          <div className="ap-t">{tx('本月 3 次已用完', 'Monthly quota used up', lang)}</div>
          <div
            className="ap-s"
            dangerouslySetInnerHTML={{
              __html: tx(
                'AI 解读按次计。可购买解读包（10 次不清零），或升级年卡享无限次。<br>课期筛选与逐层依据始终免费，不受影响。',
                'Readings count per use. Buy the 10-pack (never expires) or go yearly for unlimited.<br>Screening and per-layer basis stay free.',
                lang,
              ),
            }}
          />
          <Btn variant="gold" onClick={() => push('pay')}>
            {t('ai.upgrade', lang)}
          </Btn>
        </div>
      )}

      {followups.map((m, i) => (
        <div className="aicard" key={`f${i}`}>
          <div className="ai-h">
            <b>{tx('追问', 'Follow-up', lang)}</b>
            <span>{tx('问', 'Q', lang)}</span>
          </div>
          <div className="ai-p" style={{ color: 'var(--muted)', fontSize: 10.5, marginBottom: 7 }}>
            {m.q}
          </div>
          <div className="ai-p" dangerouslySetInnerHTML={{ __html: m.a }} />
        </div>
      ))}

      {aiSections.length === 4 && (
        <>
          <div className="rule-h">
            <span>{tx('追问', 'Follow-up', lang)}</span>
            <i />
          </div>
          <div className="aichips">
            {AI_QA[lang].map((x) => (
              <button
                key={x}
                type="button"
                onClick={() => {
                  if (left <= 0) {
                    showToast(t('ai.noQuota', lang));
                    push('pay');
                    return;
                  }
                  askFollowup(x, answerFor(x, lang));
                  showToast(t('ai.cached', lang));
                }}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="aiask">
            <input
              type="text"
              value={q}
              placeholder={tx('就这一课继续问，如「门朝西有影响吗」', 'Ask about this lesson, e.g. “door faces west?”', lang)}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              type="button"
              aria-label="send"
              onClick={() => {
                const question = q.trim() || (tx('这一课还有别的要注意的吗', 'Anything else to note?', lang));
                if (left <= 0) {
                  showToast(t('ai.noQuota', lang));
                  push('pay');
                  return;
                }
                askFollowup(question, answerFor(question, lang));
                setQ('');
              }}
            >
              <Icon name="send" size={15} />
            </button>
          </div>
          <div className="hint" style={{ fontSize: 10, marginTop: 10 }}>
            {tx('追问计 1 次。AI 只依据本课已算出的依据作答，不引入新神煞，也不预测经营结果。', 'Follow-ups count 1 each. The AI answers only from this lesson’s computed basis — it introduces no new sha and predicts no business results.', lang)}
          </div>
        </>
      )}

      <div className="card flat" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.8 }}>
          <b>{t('ai.boundaryTitle', lang)}</b>
          <br />
          {t('ai.b1', lang)}
          <br />
          {t('ai.b4', lang)}
          <br />
          {t('ai.localNote', lang)}
        </div>
      </div>
      {!session && <div style={{ height: 12 }} />}
    </div>
  );
}

/** 追问的本地答复（依据本课已算出的层，不引入新神煞） */
function answerFor(q: string, lang: 'zh' | 'en' | 'zh-Hant'): string {
  const session = useApp.getState().session;
  const day = session?.result.usable[session.cursor] ?? session?.result.days[0];
  if (!day) return t('err.notFound', lang);
  if (q.includes('属') || q.includes('冲') || q.includes('zodiac') || q.includes('clash')) {
    return tx(
      `日支不冲当事人年支，这一重结论稳定；若出生时刻跨了时辰，时柱可能变，但年支不变。`,
      'The day branch does not clash the subject’s year branch — stable even if the birth hour shifted.',
      lang,
    );
  }
  if (q.includes('时辰') || q.includes('hour') || q.includes('时')) {
    const h = day.goodHours[0] ?? day.hours[0];
    return tx(
      `只能选一个，就取 <b>${h.name}时（${h.range}）</b>——时支与日支成六合或三合，是本日最合的一刻。关键动作必须落在此刻之内。`,
      `Take <b>${h.name}（${h.range}）</b> — the hour branch forms a harmony with the day branch.`,
      lang,
    );
  }
  if (q.includes('避') || q.includes('avoid') || q.includes('风险')) {
    const bad = day.layers.filter((l) => l.cls === 'warn' || l.cls === 'bad');
    if (bad.length === 0) {
      return tx('本课无次级煞，唯一要注意的是「不要改时」。', 'No secondary sha — just do not move the hour.', lang);
    }
    return tx(
      `要避开的是：<b>${bad.map((b) => b.resultKey).join('、')}</b>。制化之法是把关键动作移入吉时、核心环节在室内完成。`,
      `Avoid: <b>${bad.map((b) => b.resultKey).join(', ')}</b>. Move key actions into good hours.`,
      lang,
    );
  }
  return tx(
    '本课的可核依据已在报告第二至六章列出。若不在八重课格之内，不会替你补一层。',
    'Verifiable basis is listed in report chapters 2–6. Anything outside the eight layers is not invented.',
    lang,
  );
}
