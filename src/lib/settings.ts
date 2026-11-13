import { schema, type DB } from './db';

export interface Theme {
  primary: string;
  pink: string;
  pinkLight: string;
  gold: string;
  lilac: string;
  ink: string;
  muted: string;
  background: string;
  fontDisplay: string;
  fontBody: string;
  imageRatio: string;
  radius: number;
}

export interface CheckoutField {
  id: 'name' | 'phone' | 'address' | 'neighborhood' | 'city' | 'date' | 'slot' | 'recipient' | 'notes';
  label: string;
  required: boolean;
}

export interface Settings {
  business: { name: string; tagline: string; coverage: string; owner?: string };
  theme: Theme;
  whatsapp: { number: string; genericMessage: string };
  prices: { showGlobal: boolean; currency: string };
  checkout: { cities: string[]; fields: CheckoutField[] };
  social: { instagram?: string; facebook?: string; tiktok?: string };
  seo: { title: string; description: string };
  analytics: { ga4: string };
}

export const DEFAULT_SETTINGS: Settings = {
  business: { name: 'Detalle TM', tagline: 'Detalles | Decoraciones | Floristería', coverage: 'Bogotá' },
  theme: {
    primary: '#D64F48',
    pink: '#F7C5D5',
    pinkLight: '#FBE3EB',
    gold: '#F2B84B',
    lilac: '#E6DDF3',
    ink: '#2A1F24',
    muted: '#6A5560',
    background: '#FFFFFF',
    fontDisplay: 'Fredoka',
    fontBody: 'Nunito',
    imageRatio: '4 / 5',
    radius: 24,
  },
  whatsapp: { number: '573108540601', genericMessage: 'Hola Detalle TM, quiero hacer una consulta.' },
  prices: { showGlobal: false, currency: 'COP' },
  checkout: {
    cities: ['Bogotá'],
    fields: [
      { id: 'name', label: 'Nombre completo', required: true },
      { id: 'phone', label: 'Celular', required: true },
      { id: 'address', label: 'Dirección', required: true },
      { id: 'neighborhood', label: 'Barrio', required: true },
      { id: 'city', label: 'Ciudad', required: true },
      { id: 'date', label: 'Fecha de entrega', required: false },
      { id: 'slot', label: 'Franja', required: false },
      { id: 'recipient', label: '¿Quién recibe? (nombre y celular)', required: false },
      { id: 'notes', label: 'Notas', required: false },
    ],
  },
  social: { instagram: 'https://www.instagram.com/detalletm/' },
  seo: {
    title: 'Detalle TM — Detalles, decoraciones y floristería en Bogotá',
    description: 'Desayunos sorpresa, flores, anchetas y decoraciones con globos en Bogotá. Arma tu pedido y cotízalo por WhatsApp.',
  },
  analytics: { ga4: '' },
};

const KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

/** Lee todos los ajustes y completa con los valores por defecto lo que falte. */
export async function getSettings(db: DB): Promise<Settings> {
  const rows = await db.select().from(schema.settings);
  const out = structuredClone(DEFAULT_SETTINGS) as Settings;
  for (const row of rows) {
    const key = row.key as keyof Settings;
    if (!KEYS.includes(key)) continue;
    try {
      const parsed = JSON.parse(row.value);
      (out as unknown as Record<string, unknown>)[key] = { ...(DEFAULT_SETTINGS[key] as object), ...parsed };
    } catch {
      // Un valor dañado no debe tumbar la tienda: se usa el valor por defecto.
    }
  }
  return out;
}

/** Variables CSS del tema, para inyectar en :root. */
export function themeCss(t: Theme): string {
  const safe = (v: string) => v.replace(/[;{}<>]/g, '');
  return [
    `--c-primary:${safe(t.primary)}`,
    `--c-pink:${safe(t.pink)}`,
    `--c-pink-light:${safe(t.pinkLight)}`,
    `--c-gold:${safe(t.gold)}`,
    `--c-lilac:${safe(t.lilac)}`,
    `--c-ink:${safe(t.ink)}`,
    `--c-muted:${safe(t.muted)}`,
    `--c-bg:${safe(t.background)}`,
    `--f-display:'${safe(t.fontDisplay)}',system-ui,sans-serif`,
    `--f-body:'${safe(t.fontBody)}',system-ui,sans-serif`,
    `--img-ratio:${safe(t.imageRatio)}`,
    `--radius:${Number(t.radius) || 24}px`,
  ].join(';');
}

export function googleFontsHref(t: Theme): string {
  const fam = (name: string, weights: string) => `family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@${weights}`;
  return `https://fonts.googleapis.com/css2?${fam(t.fontDisplay, '500;600')}&${fam(t.fontBody, '400;600;700;800')}&display=swap`;
}
