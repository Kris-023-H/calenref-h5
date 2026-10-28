/**
 * components/app-bar.tsx — 顶栏（返回 + 标题 + 右侧动作区）。
 */

import type { ReactNode } from 'react';
import { Icon, type IconName } from './icons';

export function AppBar({
  title,
  onBack,
  actions,
}: {
  title?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
}): JSX.Element {
  return (
    <div className="appbar">
      {onBack && (
        <button type="button" className="icon-btn" aria-label="返回" onClick={onBack}>
          <Icon name="back" size={16} />
        </button>
      )}
      {title && <div className="appbar-title">{title}</div>}
      {actions && <div className="appbar-act">{actions}</div>}
    </div>
  );
}

export function IconBtn({ name, onClick, label }: { name: IconName; onClick?: () => void; label?: string }): JSX.Element {
  return (
    <button type="button" className="icon-btn" aria-label={label} onClick={onClick}>
      <Icon name={name} size={16} />
    </button>
  );
}
