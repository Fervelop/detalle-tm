import { cartCount } from '@/lib/cart-store';
import { useCart } from './useCart';
import { BagIcon } from './icons';

export default function CartButton() {
  const { lines } = useCart();
  const n = cartCount(lines);
  return (
    <a className="cart-pill" href="/carrito" aria-label={`Carrito, ${n} ${n === 1 ? 'producto' : 'productos'}`}>
      <BagIcon />
      <span aria-hidden="true">{n}</span>
    </a>
  );
}
