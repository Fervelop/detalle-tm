import type { APIRoute } from 'astro';
import { and, eq, inArray, isNull, sql } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { priceVisible } from '@/lib/catalog';
import { buildWhatsAppMessage, normalizePhone, quoteRequestSchema, validateCustomer, waLink, type QuoteLine } from '@/lib/quote';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** Registra la cotización del carrito y devuelve el enlace de WhatsApp con el mensaje armado. */
export const POST: APIRoute = async ({ request, locals }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'La solicitud no es válida.' }, 400);
  }
  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) return json({ error: 'Revisa los productos del carrito y tus datos.' }, 400);
  const { items, customer } = parsed.data;

  const db = getDb(locals);
  const settings = await getSettings(db);

  const errors = validateCustomer(customer, settings.checkout.fields, settings.checkout.cities);
  if (Object.keys(errors).length) return json({ error: 'Faltan datos obligatorios.', fields: errors }, 422);
  customer.phone = normalizePhone(customer.phone);

  const productIds = [...new Set(items.map((i) => i.productId))];
  const [prods, opts, links] = await Promise.all([
    db
      .select()
      .from(schema.products)
      .where(and(inArray(schema.products.id, productIds), eq(schema.products.visible, true), isNull(schema.products.deletedAt))),
    db.select().from(schema.productOptions).where(inArray(schema.productOptions.productId, productIds)),
    db
      .select({ productId: schema.productAddons.productId, id: schema.addons.id, name: schema.addons.name, price: schema.addons.price })
      .from(schema.productAddons)
      .innerJoin(schema.addons, eq(schema.addons.id, schema.productAddons.addonId))
      .where(inArray(schema.productAddons.productId, productIds)),
  ]);

  const lines: QuoteLine[] = [];
  let total = 0;
  let allPriced = true;
  for (const item of items) {
    const p = prods.find((x) => x.id === item.productId);
    if (!p) return json({ error: 'Uno de los productos ya no está disponible. Quítalo del carrito.' }, 409);
    if (!p.available) return json({ error: `"${p.name}" no está disponible en este momento. Quítalo del carrito.` }, 409);

    const size = item.sizeId ? opts.find((o) => o.id === item.sizeId && o.productId === p.id && o.kind === 'size') : undefined;
    const color = item.colorId ? opts.find((o) => o.id === item.colorId && o.productId === p.id && o.kind === 'color') : undefined;
    const chosen = links.filter((l) => l.productId === p.id && item.addonIds.includes(l.id));

    const show = priceVisible(p.priceMode, p.basePrice, settings);
    let unit: number | null = null;
    if (show && p.basePrice != null) {
      unit = p.basePrice + (size?.extraPrice ?? 0) + (color?.extraPrice ?? 0) + chosen.reduce((s, a) => s + (a.price ?? 0), 0);
      total += unit * item.quantity;
    } else {
      allPriced = false;
    }

    lines.push({
      productId: p.id,
      name: p.name,
      quantity: item.quantity,
      size: size?.name ?? null,
      color: color?.name ?? null,
      addons: chosen.map((a) => a.name),
      dedication: item.dedication ?? '',
      unitPrice: unit,
    });
  }
  const estimated = allPriced ? total : null;

  // Consecutivo atómico: DTM-0001, DTM-0002...
  const [counter] = await db
    .insert(schema.settings)
    .values({ key: 'quote_counter', value: '1' })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value: sql`CAST(${schema.settings.value} AS INTEGER) + 1` } })
    .returning({ value: schema.settings.value });
  const code = `DTM-${String(counter.value).padStart(4, '0')}`;

  await db.insert(schema.quotes).values({
    code,
    customer: JSON.stringify(customer),
    items: JSON.stringify(lines),
    estimatedTotal: estimated,
  });

  const message = buildWhatsAppMessage(code, lines, customer, estimated);
  return json({ code, whatsappUrl: waLink(settings.whatsapp.number, message) }, 201);
};
