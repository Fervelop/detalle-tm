import type { APIRoute } from 'astro';
import { and, eq, isNull } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { listCategories, listOccasions } from '@/lib/catalog';

export const GET: APIRoute = async ({ locals, site, url }) => {
  const db = getDb(locals);
  const base = (site ?? url).origin;
  const [cats, occs, prods] = await Promise.all([
    listCategories(db),
    listOccasions(db),
    db
      .select({ slug: schema.products.slug, updatedAt: schema.products.updatedAt })
      .from(schema.products)
      .where(and(eq(schema.products.visible, true), isNull(schema.products.deletedAt))),
  ]);
  const urls = [
    '/', '/catalogo', '/nosotros', '/preguntas-frecuentes', '/galeria',
    ...cats.map((c) => `/categoria/${c.slug}`),
    ...occs.map((o) => `/ocasion/${o.slug}`),
  ].map((p) => `<url><loc>${base}${p}</loc></url>`);
  for (const p of prods) urls.push(`<url><loc>${base}/producto/${p.slug}</loc><lastmod>${p.updatedAt.slice(0, 10)}</lastmod></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
