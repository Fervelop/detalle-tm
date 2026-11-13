import { useState } from 'react';
import { addToCart } from '@/lib/cart-store';
import { CheckIcon } from './icons';

interface Option { id: number; name: string; extraPrice: number | null }
interface Props {
  productId: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  basePrice: number | null;
  available: boolean;
  sizes: Option[];
  colors: (Option & { hex: string | null })[];
  addons: { id: number; name: string; price: number | null }[];
}

const cop = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');

export default function AddToCart(p: Props) {
  const [sizeId, setSizeId] = useState<number | null>(p.sizes[0]?.id ?? null);
  const [colorId, setColorId] = useState<number | null>(p.colors[0]?.id ?? null);
  const [addonIds, setAddonIds] = useState<number[]>([]);
  const [dedication, setDedication] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const size = p.sizes.find((s) => s.id === sizeId) ?? null;
  const color = p.colors.find((c) => c.id === colorId) ?? null;
  const chosenAddons = p.addons.filter((a) => addonIds.includes(a.id));
  const unitPrice =
    p.basePrice == null
      ? null
      : p.basePrice + (size?.extraPrice ?? 0) + (color?.extraPrice ?? 0) + chosenAddons.reduce((s, a) => s + (a.price ?? 0), 0);

  const toggleAddon = (id: number) => setAddonIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const add = () => {
    addToCart({
      productId: p.productId,
      slug: p.slug,
      name: p.name,
      imageUrl: p.imageUrl,
      size: size ? { id: size.id, name: size.name } : null,
      color: color ? { id: color.id, name: color.name } : null,
      addons: chosenAddons.map((a) => ({ id: a.id, name: a.name })),
      dedication: dedication.trim(),
      quantity,
      unitPrice,
    });
    setAdded(true);
  };

  if (!p.available) {
    return <p className="notice">Este producto no está disponible por ahora. Escríbenos por WhatsApp y te ayudamos con una alternativa.</p>;
  }

  return (
    <div>
      {p.sizes.length > 0 && (
        <fieldset className="opt-group">
          <legend>Tamaño</legend>
          <div className="pills">
            {p.sizes.map((s) => (
              <button key={s.id} type="button" className="pill" aria-pressed={s.id === sizeId} onClick={() => setSizeId(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {p.colors.length > 0 && (
        <fieldset className="opt-group">
          <legend>
            Color: <span style={{ fontWeight: 600 }}>{color?.name}</span>
          </legend>
          <div className="pills" style={{ gap: 12 }}>
            {p.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                className="swatch"
                aria-pressed={c.id === colorId}
                aria-label={c.name}
                title={c.name}
                style={{ background: c.hex || '#eee' }}
                onClick={() => setColorId(c.id)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {p.addons.length > 0 && (
        <fieldset className="opt-group">
          <legend>Adicionales</legend>
          <p className="hint" style={{ marginTop: -6, marginBottom: 10 }}>Opcional. Elige los que quieras.</p>
          {p.addons.map((a) => {
            const on = addonIds.includes(a.id);
            return (
              <button key={a.id} type="button" className="addon" aria-pressed={on} onClick={() => toggleAddon(a.id)}>
                <span>{a.name}</span>
                {a.price != null && <span className="price-muted">+{cop(a.price)}</span>}
                <span className="tick"><CheckIcon /></span>
              </button>
            );
          })}
        </fieldset>
      )}

      <div className="field opt-group">
        <label htmlFor="dedicatoria">Dedicatoria para la tarjeta</label>
        <textarea
          id="dedicatoria"
          className="input"
          rows={3}
          maxLength={300}
          placeholder="Ej: ¡Feliz cumpleaños, mamá! Te amamos."
          value={dedication}
          onChange={(e) => setDedication(e.target.value)}
        />
        <p className="hint">Opcional · {300 - dedication.length} caracteres disponibles</p>
      </div>

      <div className="opt-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="opt-label" style={{ margin: 0 }}>Cantidad</span>
        <div className="qty">
          <button type="button" aria-label="Quitar uno" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
          <span aria-live="polite">{quantity}</span>
          <button type="button" aria-label="Agregar uno" onClick={() => setQuantity((q) => Math.min(50, q + 1))}>+</button>
        </div>
      </div>

      <div className="sticky-cta">
        {unitPrice != null && (
          <p style={{ margin: '0 0 10px', fontWeight: 800 }}>
            Total estimado: {cop(unitPrice * quantity)} <span className="price-muted">(sujeto a confirmación)</span>
          </p>
        )}
        {added ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <a className="btn btn-primary btn-block" href="/carrito">Ver carrito y cotizar</a>
            <button type="button" className="btn btn-soft btn-block" onClick={() => setAdded(false)}>Agregar otro</button>
            <p role="status" className="hint" style={{ textAlign: 'center' }}>Agregado al carrito.</p>
          </div>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={add}>Agregar al carrito</button>
        )}
      </div>
    </div>
  );
}
