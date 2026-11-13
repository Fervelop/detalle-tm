import { sql } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
};

/** Qué es el producto: Decoraciones, Floristería, Desayunos, Detalles y anchetas. */
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  imageKey: text('image_key'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
});

/** Para qué sirve: Cumpleaños, Día de la madre, Baby shower... Puede activarse por temporada. */
export const occasions = sqliteTable('occasions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  imageKey: text('image_key'),
  color: text('color'),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  activeFrom: text('active_from'),
  activeUntil: text('active_until'),
  ...timestamps,
});

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  shortDescription: text('short_description'),
  description: text('description'),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  basePrice: integer('base_price'),
  /** inherit = sigue el interruptor global; show/hide lo fuerza para este producto. */
  priceMode: text('price_mode', { enum: ['inherit', 'show', 'hide'] }).notNull().default('inherit'),
  /** JSON: ["nuevo","mas-pedido"] */
  tags: text('tags').notNull().default('[]'),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  deletedAt: text('deleted_at'),
  ...timestamps,
});

export const productOccasions = sqliteTable(
  'product_occasions',
  {
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    occasionId: integer('occasion_id').notNull().references(() => occasions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.occasionId] })],
);

/** Hasta 8 por producto. El punto focal (0–1) decide qué parte se ve en el recorte 4:5. */
export const productImages = sqliteTable('product_images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  r2Key: text('r2_key').notNull(),
  alt: text('alt'),
  sortOrder: integer('sort_order').notNull().default(0),
  isMain: integer('is_main', { mode: 'boolean' }).notNull().default(false),
  focusX: real('focus_x').notNull().default(0.5),
  focusY: real('focus_y').notNull().default(0.5),
});

/** Tamaños y colores. extraPrice suma al precio base cuando se muestran precios. */
export const productOptions = sqliteTable('product_options', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['size', 'color'] }).notNull(),
  name: text('name').notNull(),
  colorHex: text('color_hex'),
  extraPrice: integer('extra_price'),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const addons = sqliteTable('addons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  price: integer('price'),
  imageKey: text('image_key'),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const productAddons = sqliteTable(
  'product_addons',
  {
    productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    addonId: integer('addon_id').notNull().references(() => addons.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.addonId] })],
);

/** Cada envío del carrito. items guarda una copia de lo elegido para que el historial no cambie. */
export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  customer: text('customer').notNull(),
  items: text('items').notNull(),
  estimatedTotal: integer('estimated_total'),
  status: text('status', { enum: ['new', 'quoted', 'sold', 'cancelled'] }).notNull().default('new'),
  internalNotes: text('internal_notes'),
  ...timestamps,
});

/** Ajustes clave/valor (JSON): tema, WhatsApp, precios, formulario, redes, SEO. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
});

export const pages = sqliteTable('pages', {
  slug: text('slug').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  updatedAt: text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
});

export const banners = sqliteTable('banners', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  text: text('text'),
  buttonLabel: text('button_label'),
  buttonUrl: text('button_url'),
  desktopImageKey: text('desktop_image_key'),
  mobileImageKey: text('mobile_image_key'),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
});

export const testimonials = sqliteTable('testimonials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  author: text('author').notNull(),
  text: text('text').notNull(),
  imageKey: text('image_key'),
  sortOrder: integer('sort_order').notNull().default(0),
  visible: integer('visible', { mode: 'boolean' }).notNull().default(true),
});

/** Historial básico: quién cambió qué y cuándo. */
export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  at: text('at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`),
});
