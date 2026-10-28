/**
 * components/icons.tsx — 原型 IC 图标集（24×24 线性图标）。
 * 颜色随 currentColor，尺寸由 size 控制；与原型逐路径一致。
 */

import type { CSSProperties } from 'react';

export type IconName =
  | 'back'
  | 'home'
  | 'compass'
  | 'doc'
  | 'book'
  | 'user'
  | 'grid'
  | 'info'
  | 'check'
  | 'right'
  | 'share'
  | 'down'
  | 'bell'
  | 'globe'
  | 'shield'
  | 'star'
  | 'clock'
  | 'ai'
  | 'empty'
  | 'plus'
  | 'send'
  | 'lock'
  | 'spark'
  | 'left';

const PATHS: Record<IconName, string[]> = {
  back: ['M15 5l-7 7 7 7'],
  home: ['M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z'],
  compass: ['M12 12', 'M15.5 8.5l-2.2 5-5 2.2 2.2-5z'],
  doc: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 12h6M9 16h6'],
  book: ['M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z', 'M8 7h8M8 11h8'],
  user: ['M12 8a3.4 3.4 0 1 0 0-6.8A3.4 3.4 0 0 0 12 8z', 'M5 20c1.5-3.6 4-5 7-5s5.5 1.4 7 5'],
  grid: ['M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z'],
  info: ['M12 12', 'M12 11v6M12 8h.01'],
  check: ['M4 12l5 5L20 6'],
  right: ['M9 5l7 7-7 7'],
  share: ['M12 16V4M8 8l4-4 4 4', 'M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5'],
  down: ['M6 9l6 6 6-6'],
  bell: ['M18 15V10a6 6 0 1 0-12 0v5l-2 3h16z', 'M10 21h4'],
  globe: ['M12 12', 'M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18'],
  shield: ['M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z', 'M9 12l2 2 4-4'],
  star: ['M12 4l2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7z'],
  clock: ['M12 12', 'M12 7v5l3 2'],
  ai: ['M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z', 'M18 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'],
  empty: ['M4 7h16v12H4z', 'M4 7l3-3h10l3 3', 'M9 13h6'],
  plus: ['M12 5v14M5 12h14'],
  send: ['M4 12l16-8-6 8 6 8z'],
  lock: ['M6 11h12v9H6z', 'M9 11V8a3 3 0 0 1 6 0v3'],
  spark: ['M12 4v4M12 16v4M4 12h4M16 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8'],
  left: ['M15 5l-7 7 7 7'],
};

const CIRCLES: Partial<Record<IconName, Array<[number, number, number]>>> = {
  compass: [[12, 12, 8.5]],
  info: [[12, 12, 9]],
  user: [[12, 4.6, 3.4]],
  globe: [[12, 12, 9]],
  clock: [[12, 12, 9]],
};

export interface IconProps {
  name: IconName;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

/** 线性图标（stroke = currentColor） */
export function Icon({ name, size = 16, style, className }: IconProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {(CIRCLES[name] ?? []).map(([cx, cy, r], i) => (
        <circle key={`c${i}`} cx={cx} cy={cy} r={r} />
      ))}
      {PATHS[name].map((d, i) => (
        <path key={`p${i}`} d={d} />
      ))}
    </svg>
  );
}

/** 圭表测影 Logo（原型 LOGO() 的 React 版） */
export function GuibiaoLogo({ size = 34, tone = 'gold' }: { size?: number; tone?: 'gold' | 'ink' | 'light' }): JSX.Element {
  const k = Math.max(1, Math.min(2.6, 40 / size));
  const sw = (n: number): string => (n * k).toFixed(2);
  const color = tone === 'gold' ? 'var(--gold)' : tone === 'ink' ? 'var(--ink)' : 'var(--on-lacquer)';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ color, display: 'block' }}>
      {size >= 26 && (
        <circle cx="20" cy="20" r="17.6" stroke="currentColor" strokeOpacity=".30" strokeWidth={sw(1)} strokeDasharray="1.2 8.01" />
      )}
      <circle cx="20" cy="20" r={size >= 26 ? 15.2 : 16.4} stroke="currentColor" strokeOpacity=".16" strokeWidth={sw(1)} />
      <path d="M6.4 29.2h27.2" stroke="currentColor" strokeWidth={sw(1.7)} strokeLinecap="round" />
      <path d="M16.6 10.4v18.8" stroke="currentColor" strokeWidth={sw(2.1)} strokeLinecap="round" />
      <path d="M16.6 29.2h9.8" stroke="currentColor" strokeWidth={sw(3.6)} strokeLinecap="round" strokeOpacity=".40" />
      <circle cx="28.2" cy="12.2" r={(3.1 * k).toFixed(2)} fill="currentColor" />
    </svg>
  );
}

/** 品牌字标（图标 + 择吉 + 副标） */
export function BrandMark({
  size = 34,
  tone = 'gold',
  text,
  sub,
  showMark = true,
  titleSize = 15,
}: {
  size?: number;
  tone?: 'gold' | 'ink' | 'light';
  text?: string;
  sub?: string;
  showMark?: boolean;
  titleSize?: number;
}): JSX.Element {
  const color = tone === 'gold' ? 'var(--gold)' : tone === 'ink' ? 'var(--ink)' : 'var(--on-lacquer)';
  return (
    <span className="lg" style={{ color }}>
      {showMark && <GuibiaoLogo size={size} tone={tone} />}
      {text && (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <b className="serif" style={{ fontSize: titleSize, letterSpacing: '.14em', lineHeight: 1 }}>
            {text}
          </b>
          {sub && <span style={{ fontSize: 8, letterSpacing: '.2em', color: tone === 'light' ? 'var(--on-lacquer-2)' : 'var(--muted)', lineHeight: 1 }}>{sub}</span>}
        </span>
      )}
    </span>
  );
}
