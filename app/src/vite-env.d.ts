/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_AI_ENDPOINT?: string;
  readonly VITE_REDEEM_KEY?: string;
  readonly VITE_SHARE_HOST?: string;
  /** 站点根地址（canonical / OG / sitemap 用，构建时注入） */
  readonly VITE_SITE_URL?: string;
  /** GA4 衡量 ID；留空则完全不加载 gtag.js */
  readonly VITE_GA4_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
