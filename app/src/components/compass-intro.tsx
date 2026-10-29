/**
 * components/compass-intro.tsx — 启动页罗盘（同心圆 + 十二支 glyph + 圭表核心，2.4s 进入）。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZHI } from '../engine/calendar/sexagenary';
import { GuibiaoLogo } from './icons';
import { t, tx } from '../i18n';
import type { Lang } from '../engine/types';

export function CompassIntro({
  lang,
  onEnter,
  durationMs = 2400,
}: {
  lang: Lang;
  onEnter: () => void;
  durationMs?: number;
}): JSX.Element | null {
  const [out, setOut] = useState(false);
  const enteredRef = useRef(false);

  // 进入动作（计时与点击共用，防重入）
  const enter = useCallback((): void => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    setOut(true);
    window.setTimeout(onEnter, 600);
  }, [onEnter]);

  useEffect(() => {
    const timer = window.setTimeout(enter, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, enter]);

  return (
    <div className={`splash${out ? ' out' : ''}`} onClick={enter}>
      <div className="compass">
        <div className="r r1" />
        <div className="r r2" />
        <div className="r r3" />
        <div className="glyphs">
          {ZHI.map((z, i) => (
            <span key={z} style={{ transform: `rotate(${i * 30}deg) translate(0,-92px)` }}>
              {z}
            </span>
          ))}
        </div>
        <div className="core">
          <GuibiaoLogo size={44} tone="light" />
        </div>
      </div>
      <div className={`brand${lang === 'en' ? ' en' : ''}`}>{tx('中 华 历 法', 'CHINESE DATE PLANNER', lang)}</div>
      <div className="sub">{t('app.slogan', lang)}</div>
      <div className="line" />
      <div className="disc">
        {tx(
          '免责声明：本产品为中国传统历法文化参考工具，仅供学习娱乐，不构成命理预测或灵性指导。',
          'Disclaimer: Traditional Chinese cultural calendar reference for educational use. Not a fortune-telling or spiritual service. No prediction of outcomes.',
          lang,
        )}
      </div>
      <div className="tap">{tx('轻触进入', 'Tap to enter', lang)}</div>
      <div className="foot">{tx('东北亚 · 东南亚 ／ 传统历法规则引擎', 'NE & SE Asia · Traditional calendar engine', lang)}</div>
    </div>
  );
}
