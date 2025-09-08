/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_BASE?: string;
  readonly MODE?: 'development' | 'production' | string;
  readonly PROD?: boolean;
  readonly DEV?: boolean;
  readonly BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
