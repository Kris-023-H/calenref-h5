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

/**
 * 品牌图标：历书日历格（与 public/icons/icon.svg 同几何，viewBox 40×40）。
 *
 * 五版取舍都写在 scripts/gen-icons.mjs 的注释里，这里只记结论：
 *   圭表 + 日影 → 像择日器；节点 + 边 → 像 AI；文档页 → 像备忘录；
 *   日历格 + 单个圆点 → 96px 下像相机；**日历格 + 日期格阵**（当前）。
 *
 * 只有三个元素：外框、顶部月份条、3×3 日期格，首格朱色标「当日」。
 * 没有刻度环、没有放射线、没有节点网络 —— 它说的是「这是一本可查的历法」。
 *
 * 小尺寸（<28）只留轮廓 + 月份条：20px 下 3×3 格会糊成一团灰斑。
 */
const ALMANAC = {
  frame: { x: 10.8, y: 9.6, w: 18.4, h: 20.8, r: 3.2 },
  /** 顶部月份条下沿 */
  headY: 14.4,
  /** 日期格：边长 / 圆角 / 列距 / 行距 / 左上角（行距略紧，否则 44px 下贴框） */
  cell: { size: 2.35, r: 0.5, pitchX: 4.8, pitchY: 4.45, x0: 14.025, y0: 16.025 },
} as const;

export function AlmanacLogo({ size = 34, tone = 'gold' }: { size?: number; tone?: 'gold' | 'ink' | 'light' }): JSX.Element {
  const color = tone === 'gold' ? 'var(--gold)' : tone === 'ink' ? 'var(--ink)' : 'var(--on-lacquer)';
  const todayColor = tone === 'light' ? 'var(--verm-2)' : 'var(--verm)';
  const { frame, headY, cell } = ALMANAC;
  const compact = size < 28;
  // 描边居中于路径，故内缩半个线宽，让外沿仍落在 10.8 / 29.2 上
  const sw = compact ? 2.1 : 1.5;
  const f = { x: frame.x + sw / 2, y: frame.y + sw / 2, w: frame.w - sw, h: frame.h - sw, r: frame.r - sw / 2 };

  const cells: Array<{ x: number; y: number; today: boolean }> = [];
  if (!compact) {
    for (let ri = 0; ri < 3; ri += 1) {
      for (let ci = 0; ci < 3; ci += 1) {
        cells.push({ x: cell.x0 + ci * cell.pitchX, y: cell.y0 + ri * cell.pitchY, today: ri === 0 && ci === 0 });
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ color, display: 'block' }}>
      <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={f.r} stroke="currentColor" strokeWidth={sw} />
      <path
        d={`M${frame.x} ${headY}V${frame.y + frame.r}A${frame.r} ${frame.r} 0 0 1 ${frame.x + frame.r} ${frame.y}H${frame.x + frame.w - frame.r}A${frame.r} ${frame.r} 0 0 1 ${frame.x + frame.w} ${frame.y + frame.r}V${headY}Z`}
        fill="currentColor"
      />
      {cells.map((c) => (
        <rect
          key={`${c.x}-${c.y}`}
          x={c.x}
          y={c.y}
          width={cell.size}
          height={cell.size}
          rx={cell.r}
          fill={c.today ? todayColor : 'currentColor'}
        />
      ))}
    </svg>
  );
}

/** 品牌字标（图标 + 历知 + 副标） */
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
      {showMark && <AlmanacLogo size={size} tone={tone} />}
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
