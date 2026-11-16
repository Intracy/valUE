import { migrate } from '../src/db/migrate.js';
import { createPool } from '../src/db/pool.js';
import { testDatabaseUrl } from './helpers.js';

/** Setzt die Test-Datenbank vor dem Lauf vollständig zurück. */
export default async function setup() {
  const url = testDatabaseUrl();
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error(`Die Tests löschen alle Tabellen. Der Datenbankname muss "test" enthalten: ${url}`);
  }
  const db = createPool(url, 2);
  try {
    await db.query('drop schema public cascade; create schema public;');
    await migrate(db);
  } finally {
    await db.end();
  }
}
