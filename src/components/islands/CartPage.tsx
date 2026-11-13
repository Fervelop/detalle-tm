import { useMemo, useRef, useState } from 'react';
import { clearCart, removeLine, setQuantity } from '@/lib/cart-store';
import { emptyCustomer, validateCustomer, type Customer, type FieldRule } from '@/lib/checkout';
import { useCart } from './useCart';
import { WhatsAppIcon } from './icons';

interface Props {
  fields: FieldRule[];
  cities: string[];
}

type Errors = Partial<Record<keyof Customer, string>>;

const cop = (n: number) => '$' + Math.round(n).toLocaleString('es-CO');
const today = () => new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);

const placeholders: Partial<Record<keyof Customer, string>> = {
  name: 'Ej: Laura Pérez',
  phone: '10 dígitos, ej: 300 123 4567',
  address: 'Ej: Cra 15 # 85-20, apto 301',
  neighborhood: 'Ej: Chicó',
  recipient: 'Ej: Ana Gómez, 310 000 0000',
  notes: 'Ej: llamar antes de llegar, es sorpresa',
};

export default function CartPage({ fields, cities }: Props) {
  const { lines, ready } = useCart();
  const [c, setC] = useState<Customer>(() => emptyCustomer(cities.length === 1 ? cities[0] : ''));
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [alert, setAlert] = useState('');
  const [done, setDone] = useState<{ code: string; url: string; name: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);

  const rule = (id: keyof Customer) => fields.find((f) => f.id === id);
  const shown = (id: keyof Customer) => !!rule(id);
  const label = (id: keyof Customer) => `${rule(id)?.label ?? id}${rule(id)?.required ? ' *' : ''}`;

  const total = useMemo(() => {
    if (!lines.length || lines.some((l) => l.unitPrice == null)) return null;
    return lines.reduce((s, l) => s + (l.unitPrice ?? 0) * l.quantity, 0);
  }, [lines]);

  const set = (id: keyof Customer) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setC((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert('');
    const errs = validateCustomer(c, fields, cities);
    const firstBad = Object.keys(errs).find((k) => errs[k as keyof Customer]);
    if (firstBad) {
      setErrors(errs);
      formRef.current?.querySelector<HTMLElement>(`#f-${firstBad}`)?.focus();
      return;
    }

    // Se abre la ventana antes de la espera para que el navegador no la bloquee.
    const win = window.open('', '_blank');
    setSending(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            sizeId: l.size?.id ?? null,
            colorId: l.color?.id ?? null,
            addonIds: l.addons.map((a) => a.id),
            dedication: l.dedication,
          })),
          customer: c,
          website: honeypot.current?.value ?? '',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { code?: string; whatsappUrl?: string; error?: string; fields?: Errors };
      if (!res.ok || !data.code || !data.whatsappUrl) {
        win?.close();
        if (data.fields) setErrors(data.fields);
        setAlert(data.error || 'No pudimos registrar la cotización. Intenta de nuevo en un momento.');
        return;
      }
      if (win) win.location.href = data.whatsappUrl;
      else window.location.href = data.whatsappUrl;
      clearCart();
      setDone({ code: data.code, url: data.whatsappUrl, name: c.name.split(' ')[0] });
      window.scrollTo({ top: 0 });
    } catch {
      win?.close();
      setAlert('No hay conexión. Revisa tu internet e intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="done" role="status">
        <h1>¡Listo, {done.name}!</h1>
        <p style={{ margin: 0 }}>
          Tu cotización <strong>{done.code}</strong> quedó registrada. Revisa WhatsApp y toca Enviar si aún no lo hiciste.
        </p>
        <p className="hint">Te respondemos con el precio y la hora de entrega.</p>
        <a className="btn btn-primary btn-block" href={done.url} target="_blank" rel="noopener">
          <WhatsAppIcon /> Abrir WhatsApp de nuevo
        </a>
        <a className="btn btn-soft btn-block" href="/catalogo">Seguir viendo productos</a>
      </div>
    );
  }

  if (!ready) return <p className="hint">Cargando tu carrito…</p>;

  if (!lines.length) {
    return (
      <div className="empty">
        <h2 style={{ fontSize: 26 }}>Tu carrito está vacío</h2>
        <p>Agrega desayunos, flores o decoraciones y cotízalos por WhatsApp.</p>
        <a className="btn btn-primary" href="/catalogo">Ver catálogo</a>
      </div>
    );
  }

  const input = (id: keyof Customer, type = 'text', extra: Record<string, unknown> = {}) =>
    shown(id) && (
      <div className="field">
        <label htmlFor={`f-${id}`}>{label(id)}</label>
        <input
          id={`f-${id}`}
          className="input"
          type={type}
          value={c[id]}
          onChange={set(id)}
          placeholder={placeholders[id]}
          aria-invalid={!!errors[id]}
          aria-describedby={errors[id] ? `e-${id}` : undefined}
          required={rule(id)?.required}
          {...extra}
        />
        {errors[id] && <p className="error-text" id={`e-${id}`}>{errors[id]}</p>}
      </div>
    );

  return (
    <div className="cart-layout">
      <section aria-labelledby="t-pedido">
        <h2 id="t-pedido" className="sr-only">Productos</h2>
        {lines.map((l) => (
          <article className="cart-line" key={l.key}>
            <a className="thumb" href={`/producto/${l.slug}`} tabIndex={-1} aria-hidden="true">
              <span className="frame">
                {l.imageUrl ? <img src={l.imageUrl} alt="" loading="lazy" /> : <span className="placeholder" style={{ fontSize: 13 }}>{l.name.slice(0, 1)}</span>}
              </span>
            </a>
            <div className="meta">
              <h3><a href={`/producto/${l.slug}`} style={{ textDecoration: 'none' }}>{l.name}</a></h3>
              {(l.size || l.color) && <span className="small">{[l.size?.name, l.color?.name].filter(Boolean).join(' · ')}</span>}
              {l.addons.length > 0 && <span className="small">+ {l.addons.map((a) => a.name).join(', ')}</span>}
              {l.dedication && <span className="small">Dedicatoria: “{l.dedication}”</span>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <div className="qty" aria-label={`Cantidad de ${l.name}`}>
                  <button type="button" aria-label="Quitar uno" onClick={() => setQuantity(l.key, l.quantity - 1)}>−</button>
                  <span>{l.quantity}</span>
                  <button type="button" aria-label="Agregar uno" onClick={() => setQuantity(l.key, l.quantity + 1)}>+</button>
                </div>
                {l.unitPrice != null && <span className="price">{cop(l.unitPrice * l.quantity)}</span>}
                <button type="button" className="link-danger" onClick={() => removeLine(l.key)}>Quitar</button>
              </div>
            </div>
          </article>
        ))}
        <p className="notice">
          {total != null
            ? <>Total estimado: <strong>{cop(total)}</strong>. Te confirmamos el valor final por WhatsApp.</>
            : 'Precios a cotizar. Te respondemos por WhatsApp con el valor y la disponibilidad.'}
        </p>
      </section>

      <form ref={formRef} className="form-grid" onSubmit={submit} noValidate>
        <h2 style={{ fontSize: 26 }}>¿A dónde lo llevamos?</h2>
        <p className="hint" style={{ marginTop: -8 }}>Los campos con * son obligatorios.</p>
        {alert && <p className="alert" role="alert">{alert}</p>}

        {input('name', 'text', { autoComplete: 'name' })}
        {input('phone', 'tel', { autoComplete: 'tel', inputMode: 'tel' })}
        {input('address', 'text', { autoComplete: 'street-address' })}
        {input('neighborhood')}
        {shown('city') && (
          <div className="field">
            <label htmlFor="f-city">{label('city')}</label>
            <select id="f-city" className="input" value={c.city} onChange={set('city')} aria-invalid={!!errors.city}>
              {cities.length !== 1 && <option value="">Elige la ciudad</option>}
              {cities.map((city) => <option key={city}>{city}</option>)}
            </select>
            {errors.city && <p className="error-text">{errors.city}</p>}
          </div>
        )}

        {(shown('date') || shown('slot')) && (
          <div className="two">
            {input('date', 'date', { min: today() })}
            {shown('slot') && (
              <div className="field">
                <label htmlFor="f-slot">{label('slot')}</label>
                <select id="f-slot" className="input" value={c.slot} onChange={set('slot')} aria-invalid={!!errors.slot}>
                  <option value="">Sin preferencia</option>
                  <option>Mañana</option>
                  <option>Tarde</option>
                  <option>Noche</option>
                </select>
                {errors.slot && <p className="error-text">{errors.slot}</p>}
              </div>
            )}
          </div>
        )}
        {input('recipient')}
        {shown('notes') && (
          <div className="field">
            <label htmlFor="f-notes">{label('notes')}</label>
            <textarea id="f-notes" className="input" rows={2} maxLength={500} value={c.notes} onChange={set('notes')} placeholder={placeholders.notes} aria-invalid={!!errors.notes} />
            {errors.notes && <p className="error-text">{errors.notes}</p>}
          </div>
        )}

        <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          <label>No llenar <input ref={honeypot} tabIndex={-1} autoComplete="off" name="website" /></label>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={sending} style={{ minHeight: 58, fontSize: 17 }}>
          <WhatsAppIcon /> {sending ? 'Registrando…' : 'Enviar cotización por WhatsApp'}
        </button>
        <p className="hint" style={{ textAlign: 'center' }}>Se abrirá WhatsApp con tu pedido escrito. Solo tienes que tocar Enviar.</p>
      </form>
    </div>
  );
}
