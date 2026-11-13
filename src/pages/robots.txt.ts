import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site, url }) => {
  const base = (site ?? url).origin;
  const body = ['User-agent: *', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /carrito', `Sitemap: ${base}/sitemap.xml`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
