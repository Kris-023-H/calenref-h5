/**
 * main.tsx — 应用入口：挂载 React、注入样式四层（tokens/base/components/screens）。
 * PWA：service worker 由 vite-plugin-pWA 生成（registerType: prompt），
 *  manifest 由 App 按语言动态注入（lib/pwa-manifest.ts）。
 *  注意：vite.config.ts 设 injectRegister:null 关闭插件自动注入，
 *  故在此显式注册（PRD 验收 #13 断网可用；回归测试 tests/entry/ 守护，防再被删）。
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// PWA：注册 service worker（immediate 安装即生效；断网可用的前提）。
// dev 环境或不支持 SW 的宿主静默降级为纯在线应用，不影响首屏。
try {
  registerSW({ immediate: true });
} catch {
  // 降级路径：无 SW 亦照常运行
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('mount point #root not found');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
