import { loadConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { createPool } from './db/pool.js';
import { buildApp } from './http/app.js';

const config = loadConfig();
const db = createPool(config.databaseUrl, config.databasePoolMax);

await migrate(db);

const app = await buildApp({
  db,
  corsOrigins: config.corsOrigins,
  rateLimitPerMinute: config.rateLimitPerMinute,
  trustProxy: config.trustProxy,
  logger: config.env !== 'test',
});

// Beim Beenden laufende Anfragen fertig bedienen, dann die Datenbank schließen.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app
      .close()
      .then(() => db.end())
      .finally(() => process.exit(0));
  });
}

await app.listen({ port: config.port, host: config.host });
