/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly CLOUDFLARE_ACCOUNT_ID: string;
  readonly CLOUDFLARE_API_TOKEN: string;
  readonly D1_DATABASE_ID: string;
  readonly DATABASE_URL: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRY: string;
  readonly DOMPETX_API_KEY: string;
  readonly DOMPETX_BASE_URL: string;
  readonly DOMPETX_WEBHOOK_SECRET: string;
  readonly RESEND_API_KEY: string;
  readonly RESEND_FROM_EMAIL: string;
  readonly RESEND_FROM_NAME: string;
  readonly APP_URL: string;
  readonly APP_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        DB: D1Database;
        JWT_SECRET: string;
        DOMPETX_API_KEY: string;
        DOMPETX_BASE_URL: string;
        DOMPETX_WEBHOOK_SECRET: string;
        RESEND_API_KEY: string;
        RESEND_FROM_EMAIL: string;
        RESEND_FROM_NAME: string;
        APP_URL: string;
      };
    };
  }
}
