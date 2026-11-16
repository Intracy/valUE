import pg from 'pg';

// DATE als Text (YYYY-MM-DD) lassen. Der Standard würde ein lokales Date-Objekt
// bauen und den Tag je nach Zeitzone verschieben.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);
// NUMERIC als Zahl. Preise bleiben weit unter der Grenze sicherer Gleitkommazahlen.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));
// COUNT(*) liefert BIGINT.
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => Number(value));

export type Db = pg.Pool;
export type DbClient = pg.PoolClient;

export function createPool(databaseUrl: string, max = 10): Db {
  return new pg.Pool({
    connectionString: databaseUrl,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Eine einzelne Abfrage darf die API nicht blockieren.
    statement_timeout: 10_000,
  });
}

export async function withTransaction<T>(db: Db, work: (client: DbClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('begin');
    const result = await work(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
