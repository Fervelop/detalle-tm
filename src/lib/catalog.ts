import { and, asc, eq, inArray, isNull, like, or, sql } from 'drizzle-orm';
import { schema, type DB } from './db';
import type { Settings } from './settings';

const { categories, occasions, products, productImages, productOccasions, productOptions, productAddons, addons } = schema;

export interface ImageRef {
  url: string;
  alt: string;
  focusX: number;
  focusY: number;
}

export interface ProductCard {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  available: boolean;
  price: number | null;
  showPrice: boolean;
  hasOptions: boolean;
  image: ImageRef | null;
  imageCount: number;
}

export interface ProductDetail extends ProductCard {
  description: string | null;
  images: ImageRef[];
  sizes: { id: number; name: string; extraPrice: number | null }[];
  colors: { id: number; name: string; hex: string | null; extraPrice: number | null }[];
  addons: { id: number; name: string; price: number | null }[];
  occasions: { slug: string; name: string; color: string | null }[];
  seoTitle: string | null;
  seoDescription: string | null;
}

export const imageUrl = (key: string) => `/img/${key.split('/').map(encodeURIComponent).join('/')}`;

const toImage = (r: { r2Key: string; alt: string | null; focusX: number; focusY: number }, fallbackAlt: string): ImageRef => ({
  url: imageUrl(r.r2Key),
  alt: r.alt || fallbackAlt,
  focusX: r.focusX,
  focusY: r.focusY,
});

const parseTags = (raw: string): string[] => {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

/** ¿Se muestra el precio de este producto? Respeta el interruptor global y la excepción por producto. */
export function priceVisible(mode: 'inherit' | 'show' | 'hide', price: number | null, settings: Settings): boolean {
  if (price == null) return false;
  if (mode === 'show') return true;
  if (mode === 'hide') return false;
  return settings.prices.showGlobal;
}

export const formatCop = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

/** Una ocasión de temporada solo se muestra entre sus fechas (si las tiene). */
const occasionActive = (o: { activeFrom: string | null; activeUntil: string | null }, today: string) =>
  (!o.activeFrom || o.activeFrom <= today) && (!o.activeUntil || o.activeUntil >= today);

const todayBogota = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);

export async function listCategories(db: DB) {
  return db.select().from(categories).where(eq(categories.visible, true)).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listOccasions(db: DB) {
  const rows = await db.select().from(occasions).where(eq(occasions.visible, true)).orderBy(asc(occasions.sortOrder), asc(occasions.name));
  const today = todayBogota();
  return rows.filter((o) => occasionActive(o, today));
}

export interface ProductFilter {
  categorySlug?: string;
  occasionSlug?: string;
  query?: string;
  featured?: boolean;
  limit?: number;
}

export async function listProducts(db: DB, settings: Settings, filter: ProductFilter = {}): Promise<ProductCard[]> {
  const conds = [eq(products.visible, true), isNull(products.deletedAt)];
  if (filter.featured) conds.push(eq(products.featured, true));
  if (filter.categorySlug) conds.push(eq(categories.slug, filter.categorySlug));
  if (filter.query) {
    const q = `%${filter.query.trim().toLowerCase()}%`;
    conds.push(
      or(
        like(sql`lower(${products.name})`, q),
        like(sql`lower(coalesce(${products.shortDescription}, ''))`, q),
        like(sql`lower(coalesce(${products.description}, ''))`, q),
      )!,
    );
  }
  if (filter.occasionSlug) {
    conds.push(
      inArray(
        products.id,
        db
          .select({ id: productOccasions.productId })
          .from(productOccasions)
          .innerJoin(occasions, eq(occasions.id, productOccasions.occasionId))
          .where(eq(occasions.slug, filter.occasionSlug)),
      ),
    );
  }

  let q = db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      shortDescription: products.shortDescription,
      basePrice: products.basePrice,
      priceMode: products.priceMode,
      tags: products.tags,
      available: products.available,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...conds))
    .orderBy(asc(products.sortOrder), asc(products.name))
    .$dynamic();
  if (filter.limit) q = q.limit(filter.limit);
  const rows = await q;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [imgs, opts] = await Promise.all([
    db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder)),
    db.select({ productId: productOptions.productId }).from(productOptions).where(inArray(productOptions.productId, ids)),
  ]);
  const withOptions = new Set(opts.map((o) => o.productId));

  return rows.map((r) => {
    const mine = imgs.filter((i) => i.productId === r.id);
    const main = mine.find((i) => i.isMain) ?? mine[0];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      shortDescription: r.shortDescription,
      categoryName: r.categoryName,
      categorySlug: r.categorySlug,
      tags: parseTags(r.tags),
      available: r.available,
      // Si el precio está oculto no se envía al navegador.
      price: priceVisible(r.priceMode, r.basePrice, settings) ? r.basePrice : null,
      showPrice: priceVisible(r.priceMode, r.basePrice, settings),
      hasOptions: withOptions.has(r.id),
      image: main ? toImage(main, r.name) : null,
      imageCount: mine.length,
    };
  });
}

export async function getProduct(db: DB, settings: Settings, slug: string): Promise<ProductDetail | null> {
  const [p] = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.visible, true), isNull(products.deletedAt)))
    .limit(1);
  if (!p) return null;
  const id = p.product.id;

  const [imgs, opts, ads, occs] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder)),
    db.select().from(productOptions).where(eq(productOptions.productId, id)).orderBy(asc(productOptions.sortOrder)),
    db
      .select({ id: addons.id, name: addons.name, price: addons.price })
      .from(productAddons)
      .innerJoin(addons, eq(addons.id, productAddons.addonId))
      .where(and(eq(productAddons.productId, id), eq(addons.visible, true)))
      .orderBy(asc(addons.sortOrder)),
    db
      .select({ slug: occasions.slug, name: occasions.name, color: occasions.color })
      .from(productOccasions)
      .innerJoin(occasions, eq(occasions.id, productOccasions.occasionId))
      .where(and(eq(productOccasions.productId, id), eq(occasions.visible, true)))
      .orderBy(asc(occasions.sortOrder)),
  ]);

  // La imagen principal va primero en la galería.
  const ordered = [...imgs].sort((a, b) => Number(b.isMain) - Number(a.isMain));
  const images = ordered.map((i) => toImage(i, p.product.name));
  const show = priceVisible(p.product.priceMode, p.product.basePrice, settings);

  return {
    id,
    slug: p.product.slug,
    name: p.product.name,
    shortDescription: p.product.shortDescription,
    description: p.product.description,
    categoryName: p.categoryName,
    categorySlug: p.categorySlug,
    tags: parseTags(p.product.tags),
    available: p.product.available,
    price: show ? p.product.basePrice : null,
    showPrice: show,
    hasOptions: opts.length > 0,
    image: images[0] ?? null,
    imageCount: images.length,
    images,
    sizes: opts.filter((o) => o.kind === 'size').map((o) => ({ id: o.id, name: o.name, extraPrice: show ? o.extraPrice : null })),
    colors: opts.filter((o) => o.kind === 'color').map((o) => ({ id: o.id, name: o.name, hex: o.colorHex, extraPrice: show ? o.extraPrice : null })),
    addons: ads.map((a) => ({ id: a.id, name: a.name, price: show ? a.price : null })),
    occasions: occs,
    seoTitle: p.product.seoTitle,
    seoDescription: p.product.seoDescription,
  };
}
