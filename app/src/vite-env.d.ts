/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_AI_ENDPOINT?: string;
  readonly VITE_STRIPE_VERIFY_URL?: string;
  readonly VITE_REDEEM_KEY?: string;
  readonly VITE_SHARE_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
