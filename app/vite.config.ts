import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { siteMeta, readSiteUrl } from './build/site-meta';
import { legalPages } from './build/legal-pages';

// https://vitejs.dev/config/
export default defineConfig({
  // 子路径部署（如 GitHub Pages 项目站点 /<repo>/）由 CI 注入 VITE_BASE
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    siteMeta(),
    // 法务四页预渲染成静态 HTML：审核方抓 /privacy 必须拿到正文，不能是空壳 index.html
    legalPages(readSiteUrl(process.cwd())),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      strategies: 'generateSW',
      manifest: false, // manifest 由 src/lib/pwa-manifest.ts 按语言动态生成（blob URL）
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // OG 分享图只给社交平台抓取，不必进离线缓存（省 67KB）
        globIgnores: ['og-*.png', 'robots.txt', 'sitemap.xml'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('zustand')) return 'vendor';
            if (id.includes('qrcode-generator')) return 'qrcode';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: true,
  },
});
