/**
 * Carrito en el navegador (localStorage). No se pierde si el cliente cierra la pestaña.
 * Solo guarda lo elegido; el servidor vuelve a validar productos y opciones al enviar.
 */
export interface CartLine {
  key: string;
  productId: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  size: { id: number; name: string } | null;
  color: { id: number; name: string } | null;
  addons: { id: number; name: string }[];
  dedication: string;
  quantity: number;
  unitPrice: number | null;
}

const STORAGE_KEY = 'dtm-cart-v1';
const EVENT = 'dtm-cart';

const read = (): CartLine[] => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const write = (lines: CartLine[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Modo privado o almacenamiento lleno: el carrito sigue funcionando en esta página.
  }
  window.dispatchEvent(new CustomEvent(EVENT));
};

/** Dos líneas con el mismo producto y las mismas opciones se suman en una sola. */
const lineKey = (l: Omit<CartLine, 'key' | 'quantity'>) =>
  [l.productId, l.size?.id ?? '', l.color?.id ?? '', l.addons.map((a) => a.id).sort().join('.'), l.dedication.trim()].join('|');

export const getCart = read;

export function addToCart(line: Omit<CartLine, 'key'>) {
  const lines = read();
  const key = lineKey(line);
  const existing = lines.find((l) => l.key === key);
  if (existing) existing.quantity = Math.min(50, existing.quantity + line.quantity);
  else lines.push({ ...line, key });
  write(lines);
}

export function setQuantity(key: string, quantity: number) {
  write(read().map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(50, quantity)) } : l)));
}

export function removeLine(key: string) {
  write(read().filter((l) => l.key !== key));
}

export function clearCart() {
  write([]);
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);

export function subscribe(fn: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && fn();
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, fn);
    window.removeEventListener('storage', onStorage);
  };
}
