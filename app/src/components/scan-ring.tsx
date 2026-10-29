/**
 * components/scan-ring.tsx — 推演动画：金色进度环 + 逐重步骤点亮（440ms/步）。
 * 推演本身同步完成（< 40ms）；本组件只复演原型的推演节奏。
 */

import { useEffect, useRef, useState } from 'react';
import { fill } from '../i18n/format';

const R = 74;
const C = 2 * Math.PI * R;

export interface ScanRingLabels {
  /** 环心状态词（推演中） */
  running: string;
  /** 步骤待推 */
  pending: string;
  /** 步骤已推 */
  doneStep: string;
  /** 环下标题（含 {n} 重 / {span} 天占位） */
  spanTitle: string;
  /** 完成提示 */
  done: string;
}

export function ScanRing({
  steps,
  onDone,
  span,
  labels,
}: {
  steps: string[];
  onDone: () => void;
  span: number;
  labels: ScanRingLabels;
}): JSX.Element {
  const [i, setI] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    const n = steps.length;
    let cur = 0;
    const timer = window.setInterval(() => {
      cur += 1;
      setI(cur);
      if (cur > n) {
        window.clearInterval(timer);
        if (!doneRef.current) {
          doneRef.current = true;
          window.setTimeout(onDone, 700);
        }
      }
    }, 440);
    return () => window.clearInterval(timer);
  }, [steps.length, onDone]);

  const pct = Math.min(100, Math.round((i / steps.length) * 100));

  return (
    <>
      <div className="calcwrap">
        <div className="calc-ring">
          <svg width="168" height="168" viewBox="0 0 168 168" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="goldgrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" style={{ stopColor: "var(--gold-2)" }} />
                <stop offset="100%" style={{ stopColor: "var(--gold)" }} />
              </linearGradient>
            </defs>
            <circle className="cg" cx="84" cy="84" r={R} fill="none" strokeWidth="5" />
            <circle
              className="cp"
              cx="84"
              cy="84"
              r={R}
              fill="none"
              strokeWidth="5"
              strokeDasharray={C.toFixed(1)}
              strokeDashoffset={(C * (1 - pct / 100)).toFixed(1)}
            />
          </svg>
          <div className="cn">
            <b>
              {pct}
              <i>%</i>
            </b>
            <span>{labels.running}</span>
          </div>
        </div>
        <div className="serif" style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          {fill(labels.spanTitle, { n: steps.length, span })}
        </div>
      </div>
      <div className="calc-steps">
        {steps.map((n, idx) => (
          <div key={n} className={`cstep${idx < i ? ' done' : idx === i ? ' on' : ''}`}>
            <div className="cn2">{idx + 1}</div>
            <div className="cl">{n}</div>
            <div className="cv">{idx < i ? labels.doneStep : labels.pending}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, fontSize: 10.5, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.7 }}>
        {i > steps.length ? labels.done : ''}
      </div>
    </>
  );
}
