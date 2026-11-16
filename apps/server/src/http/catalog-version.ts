import type { Db } from '../db/pool.js';

/**
 * Version des Katalogs für ETag und Cache. Sie ändert sich nur nach einem
 * Abgleich, also etwa einmal am Tag. Der Wert wird kurz im Prozess gehalten,
 * damit nicht jede Anfrage dafür die Datenbank fragt.
 */
export function createCatalogVersion(db: Db, ttlMs = 15_000) {
  let cached: { value: string; at: number } | null = null;
  let pending: Promise<string> | null = null;

  const load = async (): Promise<string> => {
    const result = await db.query<{ value: string }>(`select value from meta where key = 'catalog_version'`);
    const value = result.rows[0]?.value ?? '0';
    cached = { value, at: Date.now() };
    return value;
  };

  return {
    async get(): Promise<string> {
      if (cached && Date.now() - cached.at < ttlMs) return cached.value;
      pending ??= load().finally(() => {
        pending = null;
      });
      return pending;
    },
    reset() {
      cached = null;
    },
  };
}

export type CatalogVersion = ReturnType<typeof createCatalogVersion>;
