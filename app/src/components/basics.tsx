/**
 * components/basics.tsx — 基础 UI 原语：按钮 / 分段 / 胶囊 / 圆环 / 进度条 / 空态 / Toast。
 * 样式类名与 styles/components.css 对应；颜色只走 tokens 变量。
 */

import type { CSSProperties, ReactNode } from 'react';
import { Icon, type IconName } from './icons';

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'gold';

export interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  block?: boolean;
  disabled?: boolean;
  fixed?: boolean;
  icon?: IconName;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit';
}

export function Btn({
  children,
  onClick,
  variant = 'primary',
  block = false,
  disabled = false,
  fixed = false,
  icon,
  className = '',
  style,
  type = 'button',
}: BtnProps): JSX.Element {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    gold: 'btn-gold',
  }[variant];
  const cls = [
    'btn',
    variantClass,
    block ? 'btn-block' : '',
    fixed ? 'btn-fixed' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} style={style}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function Seg<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<SegOption<T>>;
  value: T;
  onChange: (v: T) => void;
}): JSX.Element {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          className={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type ChipTone = 'plain' | 'gold' | 'jade' | 'verm';

export function Chip({
  children,
  tone = 'plain',
  onClick,
  style,
}: {
  children: ReactNode;
  tone?: ChipTone;
  onClick?: () => void;
  style?: CSSProperties;
}): JSX.Element {
  const toneClass = { plain: '', gold: 'chip-gold', jade: 'chip-jade', verm: 'chip-verm' }[tone];
  const cls = `chip ${toneClass}`.trim();
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} style={{ cursor: 'pointer', ...style }}>
        {children}
      </button>
    );
  }
  return <span className={cls} style={style}>{children}</span>;
}

/** 评分圆环（--p 为 0–100） */
export function Ring({
  value,
  size = 'md',
  dark = false,
  label,
}: {
  value: number;
  size?: 'md' | 'lg';
  dark?: boolean;
  label?: string;
}): JSX.Element {
  const cls = ['ring', size === 'lg' ? 'lg' : '', dark ? 'dark' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls} style={{ ['--p' as string]: String(Math.max(0, Math.min(100, value))) }}>
      <b>
        {value}
        <i>{label ?? '%'}</i>
      </b>
    </div>
  );
}

export function Bar({ percent }: { percent: number }): JSX.Element {
  return (
    <div className="bar">
      <i style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

export function EmptyState({
  mark = 'empty',
  title,
  body,
  action,
}: {
  mark?: IconName;
  title: string;
  body?: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="empty">
      <div className="empty-mark">
        <Icon name={mark} size={26} />
      </div>
      <div className="serif" style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 6 }}>
        {title}
      </div>
      {body && (
        <p style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 250, margin: '0 auto 16px' }}>{body}</p>
      )}
      {action && <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>{action}</div>}
    </div>
  );
}

/** 轻提示（1.9s 自动消失） */
export function Toast({ message }: { message: string | null }): JSX.Element | null {
  if (!message) return null;
  return <div className="toast on">{message}</div>;
}

/** 区块标题（rsec：序号 + 标题 + 右侧注） */
export function SectionHead({
  index,
  title,
  note,
}: {
  index?: string;
  title: string;
  note?: string;
}): JSX.Element {
  return (
    <div className="rsec">
      {index !== undefined && <div className="rn">{index}</div>}
      <h3>{title}</h3>
      {note && <em>{note}</em>}
    </div>
  );
}
