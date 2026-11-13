import { getDb } from './db';
import { getSettings } from './settings';
import { listCategories } from './catalog';

/** Lo que necesita cualquier página de la tienda: base de datos, ajustes y categorías del menú. */
export async function loadShell(locals: App.Locals) {
  const db = getDb(locals);
  const [settings, categories] = await Promise.all([getSettings(db), listCategories(db)]);
  return { db, settings, categories };
}
