import { loadConfig } from '../config.js';
import { migrate } from './migrate.js';
import { createPool } from './pool.js';

const config = loadConfig();
const db = createPool(config.databaseUrl, 2);
try {
  const applied = await migrate(db);
  console.log(applied.length ? `Angewendet: ${applied.join(', ')}` : 'Schema ist aktuell.');
} finally {
  await db.end();
}
