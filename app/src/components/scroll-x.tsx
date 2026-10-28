/**
 * components/scroll-x.tsx — 横滑筛选条（原型 fbar/filters）：
 * 桌面可拖拽与滚轮横滚，两端渐隐 + 细进度条，选中项自动滚入视野。
 */

import { useEffect, useRef, type ReactNode } from 'react';

export interface ScrollXItem {
  key: string;
  label: string;
}

export function ScrollX({
  items,
  activeKey,
  onSelect,
}: {
  items: ScrollXItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}): JSX.Element {
  const innerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = innerRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;

    const sync = (): void => {
      const max = el.scrollWidth - el.clientWidth;
      const sc = el.scrollLeft;
      bar.classList.toggle('scrollable', max > 4);
      bar.classList.toggle('at-start', sc <= 2);
      bar.classList.toggle('at-end', sc >= max - 2);
      const track = bar.querySelector<HTMLElement>('.ftrack i');
      if (track && max > 0) {
        const w = Math.max(0.18, el.clientWidth / el.scrollWidth);
        track.style.width = `${w * 100}%`;
        track.style.transform = `translateX(${(sc / max) * (1 - w) * 100}%)`;
      }
    };

    let down = false;
    let sx0 = 0;
    let sl0 = 0;
    let moved = 0;

    const onPointerDown = (e: PointerEvent): void => {
      down = true;
      moved = 0;
      sx0 = e.clientX;
      sl0 = el.scrollLeft;
      el.classList.add('dragging');
    };
    const onPointerMove = (e: PointerEvent): void => {
      if (!down) return;
      const dx = e.clientX - sx0;
      if (Math.abs(dx) > 4) moved = 1;
      if (moved) {
        el.scrollLeft = sl0 - dx;
        e.preventDefault();
      }
    };
    const onUp = (): void => {
      if (!down) return;
      down = false;
      el.classList.remove('dragging');
      window.setTimeout(() => {
        moved = 0;
      }, 40);
    };
    const onClickCapture = (e: MouseEvent): void => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = 0;
      }
    };
    const onWheel = (e: WheelEvent): void => {
      if (el.scrollWidth <= el.clientWidth + 4) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      el.scrollLeft += d;
      e.preventDefault();
    };

    el.addEventListener('scroll', sync, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('pointerleave', onUp);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('wheel', onWheel, { passive: false });

    // 选中项自动滚入视野
    const on = el.querySelector<HTMLElement>('button.on');
    if (on && el.scrollWidth > el.clientWidth + 4) {
      const target = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2;
      el.scrollLeft = Math.max(0, Math.min(target, el.scrollWidth - el.clientWidth));
    }
    sync();

    return () => {
      el.removeEventListener('scroll', sync);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointerleave', onUp);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('wheel', onWheel);
    };
  }, [items, activeKey]);

  const nudge = (dir: number): void => {
    innerRef.current?.scrollBy({ left: dir * 150, behavior: 'smooth' });
  };

  return (
    <div className="fbar" ref={barRef}>
      <div className="filters" ref={innerRef} data-scrollx="">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            className={it.key === activeKey ? 'on' : ''}
            onClick={() => onSelect(it.key)}
          >
            {it.label}
          </button>
        ))}
      </div>
      <div className="ftrack">
        <i />
      </div>
      <button type="button" className="fnav l" aria-label="向前" onClick={() => nudge(-1)}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button type="button" className="fnav r" aria-label="向后" onClick={() => nudge(1)}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

/** 横滑卡片行（吉时、报告备选等） */
export function HScroll({ children }: { children: ReactNode }): JSX.Element {
  return <div className="hours">{children}</div>;
}
