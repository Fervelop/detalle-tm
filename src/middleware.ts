import { defineMiddleware } from 'astro:middleware';
import { verifyAdmin } from '@/lib/access';

const isAdminPath = (p: string) => p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin');

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (!isAdminPath(pathname)) return next();

  const env = context.locals.runtime.env;

  // En desarrollo local (sin Cloudflare Access) se puede entrar con DEV_ADMIN_EMAIL en .dev.vars.
  if (import.meta.env.DEV && env.DEV_ADMIN_EMAIL) {
    context.locals.admin = { email: env.DEV_ADMIN_EMAIL };
    return next();
  }

  const admin = await verifyAdmin(context.request, env);
  if (!admin) {
    const body = pathname.startsWith('/api/')
      ? JSON.stringify({ error: 'No autorizado' })
      : 'Acceso denegado. Inicia sesión con la cuenta autorizada de GitHub o Google.';
    return new Response(body, {
      status: 403,
      headers: { 'Content-Type': pathname.startsWith('/api/') ? 'application/json' : 'text/plain; charset=utf-8' },
    });
  }
  context.locals.admin = admin;
  const res = await next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex');
  return res;
});
