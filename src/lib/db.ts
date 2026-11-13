import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@db/schema';

export type DB = ReturnType<typeof getDb>;

export function getDb(locals: App.Locals) {
  return drizzle(locals.runtime.env.DB, { schema });
}

export { schema };
