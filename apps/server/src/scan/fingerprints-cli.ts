import { loadConfig } from '../config.js';
import { migrate } from '../db/migrate.js';
import { createPool } from '../db/pool.js';
import { computeMissingFingerprints } from './fingerprint-job.js';

/** Fingerabdrücke für alle Karten nachrechnen, die noch keinen haben: `npm run fingerprints`. */
const config = loadConfig();
const db = createPool(config.databaseUrl, 4);
try {
  await migrate(db);
  const result = await computeMissingFingerprints(db, { log: (message) => console.log(`[scan] ${message}`) });
  console.log(`Fertig: ${result.computed} berechnet, ${result.failed} Bilder nicht verwertbar.`);
} finally {
  await db.end();
}
