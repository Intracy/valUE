import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Db } from './pool.js';

const here = dirname(fileURLToPath(import.meta.url));
export const migrationsDir = join(here, '..', '..', 'migrations');

// Feste Zahl für pg_advisory_lock: Zwei Prozesse migrieren nie gleichzeitig.
const MIGRATION_LOCK = 4_711_001;

/** Wendet alle noch fehlenden SQL-Dateien in Namensreihenfolge an. */
export async function migrate(db: Db, dir = migrationsDir): Promise<string[]> {
  const client = await db.connect();
  const applied: string[] = [];
  try {
    await client.query('select pg_advisory_lock($1)', [MIGRATION_LOCK]);
    await client.query(`
      create table if not exists schema_migrations (
        name        text primary key,
        applied_at  timestamptz not null default now()
      )`);
    const done = new Set(
      (await client.query<{ name: string }>('select name from schema_migrations')).rows.map((row) => row.name),
    );
    const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = await readFile(join(dir, file), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into schema_migrations (name) values ($1)', [file]);
        await client.query('commit');
        applied.push(file);
      } catch (error) {
        await client.query('rollback');
        throw new Error(`Migration ${file} fehlgeschlagen: ${(error as Error).message}`);
      }
    }
  } finally {
    await client.query('select pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => undefined);
    client.release();
  }
  return applied;
}
