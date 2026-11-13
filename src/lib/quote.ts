import { z } from 'zod';
import type { Customer } from './checkout';

export { normalizePhone, isColombianMobile, validateCustomer, type FieldRule } from './checkout';

export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(50),
  sizeId: z.number().int().positive().nullable().optional(),
  colorId: z.number().int().positive().nullable().optional(),
  addonIds: z.array(z.number().int().positive()).max(20).default([]),
  dedication: z.string().trim().max(300).optional().default(''),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const customerSchema = z.object({
  name: z.string().trim().max(120).default(''),
  phone: z.string().trim().max(30).default(''),
  address: z.string().trim().max(200).default(''),
  neighborhood: z.string().trim().max(120).default(''),
  city: z.string().trim().max(80).default(''),
  date: z.string().trim().max(10).default(''),
  slot: z.string().trim().max(20).default(''),
  recipient: z.string().trim().max(160).default(''),
  notes: z.string().trim().max(500).default(''),
});

export const quoteRequestSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(30),
  customer: customerSchema,
  /** Campo trampa para bots: debe llegar vacío. */
  website: z.string().max(0).optional(),
});

/** Línea guardada en la cotización: copia de lo elegido en el momento. */
export interface QuoteLine {
  productId: number;
  name: string;
  quantity: number;
  size: string | null;
  color: string | null;
  addons: string[];
  dedication: string;
  unitPrice: number | null;
}

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');

export function buildWhatsAppMessage(code: string, lines: QuoteLine[], c: Customer, total: number | null): string {
  const out: string[] = ['Hola Detalle TM, quiero cotizar:', '', `Cotización: ${code}`, ''];
  lines.forEach((l, i) => {
    const parts = [l.name];
    if (l.size) parts.push(`Tamaño: ${l.size}`);
    if (l.color) parts.push(`Color: ${l.color}`);
    parts.push(`Cant: ${l.quantity}`);
    if (l.unitPrice != null) parts.push(fmt(l.unitPrice * l.quantity));
    out.push(`${i + 1}. ${parts.join(' — ')}`);
    if (l.addons.length) out.push(`   Adicionales: ${l.addons.join(', ')}`);
    if (l.dedication) out.push(`   Dedicatoria: "${l.dedication}"`);
  });
  if (total != null) out.push('', `Total estimado: ${fmt(total)} (sujeto a confirmación)`);
  out.push('', 'Datos de entrega');
  out.push(`Nombre: ${c.name}`);
  out.push(`Celular: ${c.phone}`);
  const addr = [c.address, c.neighborhood, c.city].filter(Boolean).join(', ');
  if (addr) out.push(`Dirección: ${addr}`);
  if (c.date || c.slot) out.push(`Fecha: ${[c.date, c.slot].filter(Boolean).join(' — ')}`);
  if (c.recipient) out.push(`Recibe: ${c.recipient}`);
  if (c.notes) out.push(`Notas: ${c.notes}`);
  return out.join('\n');
}

export const waLink = (number: string, text: string) => `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
