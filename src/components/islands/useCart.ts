import { useEffect, useState } from 'react';
import { getCart, subscribe, type CartLine } from '@/lib/cart-store';

/** Estado del carrito sincronizado entre componentes y pestañas. */
export function useCart(): { lines: CartLine[]; ready: boolean } {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setLines(getCart());
    sync();
    setReady(true);
    return subscribe(sync);
  }, []);
  return { lines, ready };
}
