import { createPool, type Db } from '../src/db/pool.js';

export const testDatabaseUrl = (): string =>
  process.env.TEST_DATABASE_URL ?? 'postgres://value:value@localhost:5432/value_test';

export const testDb = (): Db => createPool(testDatabaseUrl(), 4);

export async function resetData(db: Db): Promise<void> {
  await db.query(
    `truncate scans, card_fingerprints, price_sets, favorites, card_grades, collection_items, users, price_history, card_printings, cards, sets, sync_runs restart identity cascade;
     update meta set value = '0' where key = 'catalog_version';`,
  );
}
