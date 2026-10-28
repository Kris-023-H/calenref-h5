/**
 * screens/splash-screen.tsx — 启动屏（罗盘 2.4s → 进入应用）。
 * 进入后由 App 决定去向：未引导 → onboard，已引导 → home。
 */

import { useCallback } from 'react';
import { CompassIntro } from '../components/compass-intro';
import { useSettings } from '../store/settings-store';
import { useNav } from './types';

export function SplashScreen(): JSX.Element {
  const lang = useSettings((s) => s.lang);
  const onboarded = useSettings((s) => s.onboarded);
  const { resetTo } = useNav();

  const onEnter = useCallback(() => {
    resetTo(onboarded ? 'home' : 'onboard');
  }, [onboarded, resetTo]);

  return <CompassIntro lang={lang} onEnter={onEnter} />;
}
