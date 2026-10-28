/**
 * screens/screen-router.tsx — 21 屏注册表：ScreenKey → 屏幕组件。
 * 由 App 渲染于 AppShell 之内；参数经导航栈条目传递（屏幕多用 store 自取参）。
 * 新增屏幕：先在 router/screens.ts 登记 key 与参数，再于本文件挂组件。
 */

import { useApp } from '../store/app-store';
import { currentScreen } from '../router/nav';
import { SplashScreen } from './splash-screen';
import { OnboardScreen } from './onboard-screen';
import { HomeScreen } from './home-screen';
import { EventScreen } from './event-screen';
import { InfoScreen } from './info-screen';
import { PeopleScreen } from './people-screen';
import { CalcScreen } from './calc-screen';
import { ResultScreen } from './result-screen';
import { DetailScreen } from './detail-screen';
import { CardScreen } from './card-screen';
import { PayScreen } from './pay-screen';
import { ReportsScreen } from './reports-screen';
import { ReportScreen } from './report-screen';
import { AiScreen } from './ai-screen';
import { KbScreen } from './kb-screen';
import { ArticleScreen } from './article-screen';
import { FavScreen } from './fav-screen';
import { MeScreen } from './me-screen';
import { LangScreen } from './lang-screen';
import { RemindScreen } from './remind-screen';
import { ShareScreen } from './share-screen';
import { LegalScreen } from './legal-screen';

/** ScreenKey → 组件（peopleForm 与 people 同组件：表单为屏内态） */
const SCREEN_COMPONENTS = {
  splash: SplashScreen,
  onboard: OnboardScreen,
  home: HomeScreen,
  event: EventScreen,
  info: InfoScreen,
  people: PeopleScreen,
  peopleForm: PeopleScreen,
  calc: CalcScreen,
  result: ResultScreen,
  detail: DetailScreen,
  card: CardScreen,
  pay: PayScreen,
  reports: ReportsScreen,
  report: ReportScreen,
  ai: AiScreen,
  kb: KbScreen,
  article: ArticleScreen,
  fav: FavScreen,
  me: MeScreen,
  lang: LangScreen,
  remind: RemindScreen,
  share: ShareScreen,
  legal: LegalScreen,
} as const;

/** 按导航栈顶渲染当前屏幕 */
export function ScreenRouter(): JSX.Element {
  const nav = useApp((s) => s.nav);
  const entry = currentScreen(nav);
  const Component = SCREEN_COMPONENTS[entry.key];
  return <Component />;
}

export { SCREEN_COMPONENTS };
