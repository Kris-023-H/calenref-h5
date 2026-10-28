/**
 * screens/calc-screen.tsx — 排课中（金环 + 逐重步骤 440ms/步 → 自动跳 result）。
 * 推演本身已在进入本屏前由 app-store.startScan 完成；这里只复演节奏。
 */

import { useCallback } from 'react';
import { useSettings } from '../store/settings-store';
import { useApp } from '../store/app-store';
import { eventByKey } from '../data/events';
import { industryById } from '../data/industries';
import { t, termText } from '../i18n';
import type { MsgKey } from '../i18n';
import { AppBar } from '../components/app-bar';
import { Chip } from '../components/basics';
import { ScanRing } from '../components/scan-ring';
import { courseLayers } from './event-screen';
import { useNav } from './types';

const GENERIC_STEPS: Array<'layer.monthBranch' | 'layer.jianchu' | 'layer.liJue' | 'layer.goodHours'> = [
  'layer.monthBranch',
  'layer.jianchu',
  'layer.liJue',
  'layer.goodHours',
];

export function CalcScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const draft = useApp((s) => s.draft);
  const session = useApp((s) => s.session);
  const { push } = useNav();
  const ev = eventByKey(draft.eventKey);
  const ind = industryById(draft.industryId);

  const onDone = useCallback(() => {
    push('result');
  }, [push]);

  const stepKeys = draft.generic ? GENERIC_STEPS : courseLayers(draft.eventKey);
  const steps = stepKeys.map((k) => t(k as MsgKey, lang));

  return (
    <div className="screen">
      <AppBar title={t('calc.title', lang)} actions={<Chip>{lang === 'en' ? 'on-device' : '本机推演'}</Chip>} />
      <ScanRing
        steps={steps}
        span={draft.span}
        onDone={onDone}
        labels={{
          running: t('calc.running', lang),
          pending: t('calc.pending', lang),
          doneStep: t('calc.doneStep', lang),
          spanTitle: t('calc.spanTitle', lang),
          done: t('calc.done', lang),
        }}
      />
      <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 280, margin: '10px auto 0', textAlign: 'center' }}>
        {termText(ev.name, lang)} ／ {termText(ind.name, lang)} ／ {lang === 'en' ? `start in ${draft.startOffset}d` : `起课 ${draft.startOffset} 日后`} ／{' '}
        {lang === 'en' ? 'true solar corrected' : '真太阳时已校正'}
      </div>
      {session && (
        <div style={{ marginTop: 16, fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7 }}>
          {t('result.statTotal', lang, { n: session.result.total })} · {t('result.statUsable', lang, { n: session.result.usable.length })}
        </div>
      )}
    </div>
  );
}
