/** Reglas del formulario de entrega. Sin dependencias, se usan en el navegador y en el servidor. */

/** Celular colombiano: 10 dígitos que empiezan por 3 (se ignoran espacios, guiones y +57). */
export const normalizePhone = (v: string) => v.replace(/[\s\-()]/g, '').replace(/^\+?57(?=3\d{9}$)/, '');
export const isColombianMobile = (v: string) => /^3\d{9}$/.test(normalizePhone(v));

export interface Customer {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  date: string;
  slot: string;
  recipient: string;
  notes: string;
}

export const emptyCustomer = (city = ''): Customer => ({
  name: '', phone: '', address: '', neighborhood: '', city, date: '', slot: '', recipient: '', notes: '',
});

export interface FieldRule {
  id: keyof Customer;
  label: string;
  required: boolean;
}

/** Valida los datos del cliente según los campos configurados en el panel. Devuelve mensajes por campo. */
export function validateCustomer(c: Customer, fields: FieldRule[], cities: string[]): Partial<Record<keyof Customer, string>> {
  const errors: Partial<Record<keyof Customer, string>> = {};
  for (const f of fields) {
    const v = (c[f.id] ?? '').trim();
    if (f.required && !v) {
      errors[f.id] = messages[f.id] ?? `Completa el campo ${f.label.toLowerCase()}.`;
    }
  }
  if (c.name && c.name.trim().length < 3) errors.name = 'Escribe tu nombre completo.';
  if (c.phone && !isColombianMobile(c.phone)) errors.phone = 'Escribe un celular de 10 dígitos que empiece por 3.';
  if (c.city && cities.length && !cities.includes(c.city)) errors.city = 'Por ahora solo entregamos en ' + cities.join(', ') + '.';
  if (c.date) {
    const today = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date)) errors.date = 'Elige una fecha válida.';
    else if (c.date < today) errors.date = 'La fecha de entrega no puede ser pasada.';
  }
  return errors;
}

const messages: Partial<Record<keyof Customer, string>> = {
  name: 'Escribe tu nombre completo.',
  phone: 'Escribe tu celular.',
  address: 'Escribe la dirección de entrega.',
  neighborhood: 'Escribe el barrio.',
  city: 'Elige la ciudad.',
  date: 'Elige la fecha de entrega.',
  slot: 'Elige una franja.',
  recipient: 'Escribe quién recibe.',
  notes: 'Escribe una nota.',
};

