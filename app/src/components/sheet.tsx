/**
 * components/sheet.tsx — 底部抽屉（遮罩 + 圆角面板，sheetUp 360ms）。
 */

import type { ReactNode } from 'react';
import { Icon } from './icons';

export function Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}): JSX.Element | null {
  if (!open) return null;
  return (
    <>
      <div className="sheet-mask" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sheet-grab" />
        <button type="button" className="icon-btn" style={{ position: 'absolute', right: 12, top: 10 }} aria-label="关闭" onClick={onClose}>
          <Icon name="back" size={14} style={{ transform: 'rotate(90deg)' }} />
        </button>
        {title && <h3 className="serif" style={{ margin: '0 0 3px', fontSize: 16 }}>{title}</h3>}
        {subtitle && <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '0 0 14px' }}>{subtitle}</p>}
        {children}
      </div>
    </>
  );
}
