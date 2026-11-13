import { useState } from 'react';
import { addToCart } from '@/lib/cart-store';
import { CheckIcon, PlusIcon } from './icons';

interface Props {
  productId: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number | null;
  hasOptions: boolean;
  available: boolean;
}

/** Botón "+" de las tarjetas. Si el producto tiene tamaños o colores, lleva a la ficha para elegirlos. */
export default function QuickAdd({ productId, slug, name, imageUrl, unitPrice, hasOptions, available }: Props) {
  const [done, setDone] = useState(false);
  if (!available) return null;
  if (hasOptions) {
    return (
      <a className="add-round" href={`/producto/${slug}`} aria-label={`Elegir opciones de ${name}`}>
        <PlusIcon />
      </a>
    );
  }
  return (
    <button
      type="button"
      className="add-round"
      data-done={done}
      aria-label={done ? `${name} agregado al carrito` : `Agregar ${name} al carrito`}
      onClick={() => {
        addToCart({ productId, slug, name, imageUrl, size: null, color: null, addons: [], dedication: '', quantity: 1, unitPrice });
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <CheckIcon size={18} /> : <PlusIcon />}
    </button>
  );
}
