import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function getDB(env: { DB?: D1Database }) {
  if (env.DB) {
    // Production: Cloudflare D1
    return drizzle(env.DB, { schema });
  }
  // Local development: fallback
  throw new Error('No D1 database binding found');
}

export { schema };
export type DB = ReturnType<typeof getDB>;
