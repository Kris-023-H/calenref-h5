/**
 * components/card-canvas.tsx — 吉当日帖（五版式）+ 3D 倾斜 + 打字机。
 * 当日帖内容：用事 / 出生资料 / 坐向 / 时辰，编号取日期；可存图与转发。
 */

import { useEffect, useRef, type ReactNode } from 'react';
import type { FourPillars } from '../engine/types';
import { isoDate, tx } from '../i18n';
import type { CalDate, Lang } from '../engine/types';

export type CardTheme = 'paper' | 'lacquer' | 'teal' | 'ink' | 'vermilion';

export const CARD_THEMES: Array<{ key: CardTheme; labelZh: string; labelEn: string }> = [
  { key: 'paper', labelZh: '宣纸', labelEn: 'Paper' },
  { key: 'lacquer', labelZh: '漆金', labelEn: 'Lacquer' },
  { key: 'teal', labelZh: '海风', labelEn: 'Teal' },
  { key: 'ink', labelZh: '水墨', labelEn: 'Ink' },
  { key: 'vermilion', labelZh: '朱印', labelEn: 'Vermilion' },
];

export interface CardData {
  date: CalDate;
  weekday: number;
  dayGZ: string;
  jianchu: string;
  eventName: string;
  industryName: string;
  pillars: FourPillars;
  sitDeg: string;
  hourName: string;
  hourRange: string;
  lang: Lang;
}

/** 当日帖本体（div 结构，供截图/分享复用） */
export function DayCardFace({ data, theme }: { data: CardData; theme: CardTheme }): JSX.Element {
  const { lang } = data;
  const dateText = `${data.date.y}.${String(data.date.m).padStart(2, '0')}.${String(data.date.d).padStart(2, '0')}`;
  const rows: Array<[string, string]> = [
    [tx('用事', 'Matter', lang), `${data.eventName}（${data.industryName}）`],
    [tx('出生资料', 'Birth details', lang), `${data.pillars.year} ${data.pillars.month} ${data.pillars.day} ${data.pillars.hour}`],
    [tx('坐向', 'Facing', lang), data.sitDeg],
    [tx('时辰', 'Hour', lang), `${data.hourName}（${data.hourRange}）`],
  ];
  return (
    <div className={`gcard ${theme}`} id="gcard">
      <div className="gc-inner">
        <div className="gc-top">
          <div className="gc-eyebrow">{tx('择 吉 · 吉 日 课 帖', 'ZEJI · DAY CARD', lang)}</div>
          <div className="gc-seal">吉</div>
        </div>
        <div className="gc-date">{dateText}</div>
        <div className="gc-gz">
          {data.dayGZ}
          {tx('日', 'Day', lang)} ／ {data.jianchu} ／{' '}
          {lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][data.weekday] : `周${'日一二三四五六'[data.weekday]}`}
        </div>
        <div className="gc-rows">
          {rows.map((r) => (
            <div key={r[0]}>
              <i>·</i>
              <span>
                {r[0]}：{r[1]}
              </span>
            </div>
          ))}
        </div>
        <div className="gc-foot">
          <span className="gc-brand">{tx('人 · 事 · 日 三层历法参考', 'Person · Matter · Day', lang)}</span>
          <span className="gc-no">
            {tx('编号 ', 'No. ', lang)}
            {isoDate(data.date).replace(/-/g, '')}
          </span>
        </div>
        <div className="qr" />
      </div>
    </div>
  );
}

/** 当日帖舞台（3D 倾斜跟随指针） */
export function CardStage({ children }: { children: ReactNode }): JSX.Element {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const card = stage.querySelector<HTMLElement>('#gcard');
    if (!card) return;
    const onMove = (ev: PointerEvent): void => {
      const r = stage.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width - 0.5;
      const y = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = `rotateY(${(x * 9).toFixed(2)}deg) rotateX(${(-y * 9).toFixed(2)}deg) translateZ(0)`;
    };
    const onLeave = (): void => {
      card.style.transform = '';
    };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', onLeave);
    return () => {
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerleave', onLeave);
    };
  }, []);
  return (
    <div className="cardstage" ref={stageRef}>
      {children}
    </div>
  );
}

/**
 * 打字机：按 3 字 / 14ms 逐字显示，保留 HTML 结构（原文含 <b> 等标签）。
 * 以受控方式逐段吐出：先拆出文本与标签边界，逐字 append。
 */
export function TypeWriter({
  html,
  speed = 14,
  charsPerTick = 3,
  onDone,
  className,
}: {
  html: string;
  speed?: number;
  charsPerTick?: number;
  onDone?: () => void;
  className?: string;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html;
    // 收集文本节点，逐字播放
    const textNodes: Text[] = [];
    const walk = (n: Node): void => {
      for (let i = 0; i < n.childNodes.length; i += 1) {
        const c = n.childNodes[i];
        if (c.nodeType === Node.TEXT_NODE) textNodes.push(c as Text);
        else if (c.nodeType === Node.ELEMENT_NODE) walk(c);
      }
    };
    walk(el);
    const full = textNodes.map((n) => n.nodeValue ?? '');
    textNodes.forEach((n) => {
      n.nodeValue = '';
    });
    let ni = 0;
    let ci = 0;
    const timer = window.setInterval(() => {
      if (ni >= textNodes.length) {
        window.clearInterval(timer);
        onDone?.();
        return;
      }
      const s = full[ni];
      ci += charsPerTick;
      textNodes[ni].nodeValue = s.slice(0, ci);
      if (ci >= s.length) {
        ni += 1;
        ci = 0;
      }
    }, speed);
    return () => window.clearInterval(timer);
  }, [html, speed, charsPerTick, onDone]);
  return <div className={className} ref={ref} />;
}
