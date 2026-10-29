/**
 * components/layer-row.tsx — 逐层依据行（可展开）与时辰行。
 * 层结果文案由 i18n/engine-text 组装，组件只做呈现。
 */

import { useState } from 'react';
import type { HourMark, LayerResult } from '../engine/types';
import { layerName, layerResultText, hourRowText, tx } from '../i18n';
import type { Lang } from '../engine/types';
import { Icon } from './icons';

export function LayerRow({
  layer,
  index,
  lang,
  defaultOpen = false,
}: {
  layer: LayerResult;
  index: number;
  lang: Lang;
  defaultOpen?: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);
  const cls = `layer${open ? ' open' : ''}`;
  return (
    <div className={cls}>
      <button
        type="button"
        className="lh"
        style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="no">{index + 1}</span>
        <span className="ln">{layerName(layer.key, lang)}</span>
        <span className={`res ${layer.cls}`}>{layerResultText(layer, lang)}</span>
        <svg className="arw" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="ld">
        <div className="in">{layerResultText(layer, lang)}</div>
      </div>
    </div>
  );
}

export function HourCell({
  hour,
  lang,
  selected,
  onSelect,
}: {
  hour: HourMark;
  lang: Lang;
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  const cls = ['hour', hour.cls === 'bad' ? 'off' : '', selected ? 'on' : ''].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onSelect}>
      <b>{hour.name}</b>
      <span>{hour.range}</span>
      <div className={`hk${hour.cls === 'bad' ? ' bad' : ''}`}>{hourRowText(hour, lang)}</div>
    </button>
  );
}

/** 次级煞卡（warn/bad 层列表） */
export function SubShaCard({ layers, lang }: { layers: LayerResult[]; lang: Lang }): JSX.Element {
  if (layers.length === 0) {
    return (
      <div className="card flat">
        <div style={{ fontSize: 11.5, color: 'var(--jade)', fontWeight: 700 }}>{tx('此日无次级煞', 'No secondary clash on this day', lang)}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{tx('诸层皆顺，属少见的好课。', 'Every layer runs clean — a rare good reading.', lang)}</div>
      </div>
    );
  }
  return (
    <div className="card flat">
      {layers.map((l) => (
        <div key={l.key} style={{ fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.75, marginBottom: 6 }}>
          <b style={{ color: 'var(--verm)' }}>
            {layerName(l.key, lang)}·{layerResultText(l, lang)}
          </b>
          　{tx('属可调整的次级因素，可把关键动作移入较优时辰。', 'A secondary factor that can be adjusted — move the key action into a favourable hour.', lang)}
        </div>
      ))}
    </div>
  );
}

export { Icon };
