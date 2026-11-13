/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  ADMIN_EMAILS: string;
  /** Solo para desarrollo local: correo que se toma como administrador sin Access. */
  DEV_ADMIN_EMAIL?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    admin?: { email: string };
  }
}
