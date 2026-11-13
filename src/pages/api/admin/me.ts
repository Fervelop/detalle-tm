import type { APIRoute } from 'astro';

/** Comprueba la sesión del panel. El middleware ya validó Cloudflare Access. */
export const GET: APIRoute = ({ locals }) =>
  new Response(JSON.stringify({ email: locals.admin?.email ?? null }), {
    headers: { 'Content-Type': 'application/json' },
  });
