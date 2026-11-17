import { loadConfig } from '../config.js';
import { migrate } from '../db/migrate.js';
import { createPool } from '../db/pool.js';
import { PokemonPriceTrackerSource } from '../sources/pokemon-price-tracker.js';
import { exportPrintingRows, openExport } from '../sources/ppt-export.js';
import { computeMissingFingerprints } from '../scan/fingerprint-job.js';
import { runPopulationSync } from './population.js';
import { runApiSync, runExportSync } from './sync.js';

/**
 * Abgleich als eigener Prozess. So starten ihn ein Cron-Job oder ein Worker,
 * unabhängig von den API-Servern: `npm run sync`.
 */
const config = loadConfig();
if (!config.ppt.apiKey) {
  console.error('PPT_API_KEY fehlt. Schlüssel in apps/server/.env eintragen.');
  process.exit(1);
}

const db = createPool(config.databaseUrl, 4);
const log = (message: string) => console.log(`[sync] ${message}`);

try {
  await migrate(db);
  const result =
    config.sync.mode === 'export'
      ? await runExportSync(
          db,
          exportPrintingRows(
            await openExport({ apiKey: config.ppt.apiKey, baseUrl: config.ppt.baseUrl, type: 'printings' }),
          ),
          { log },
        )
      : await runApiSync(
          db,
          new PokemonPriceTrackerSource({
            apiKey: config.ppt.apiKey,
            baseUrl: config.ppt.baseUrl,
            includeGraded: config.sync.includeGraded,
            historyDays: config.sync.historyDays,
          }),
          {
            sets: config.sync.sets,
            language: config.sync.language,
            maxCredits: config.sync.maxCreditsPerRun,
            creditsPerCard: config.sync.historyDays > 0 ? 2 : 1,
            setsRefreshHours: config.sync.setsRefreshHours,
            log,
          },
        );

  log(
    `Status ${result.status}: ${result.setsSynced} Sets, ${result.cardsSynced} Karten, ${result.creditsUsed} Credits.`,
  );
  for (const note of result.notes) log(`Hinweis: ${note}`);
  if (result.cardsSynced > 0) {
    // Fingerabdrücke für den Scanner. Lädt die Kartenbilder; nur neue oder geänderte.
    const fingerprints = await computeMissingFingerprints(db, { log });
    log(`Scanner: ${fingerprints.computed} Fingerabdrücke neu, ${fingerprints.failed} Bilder nicht verwertbar.`);
  }
  if (config.sync.populationMaxCards > 0) {
    const population = await runPopulationSync(
      db,
      new PokemonPriceTrackerSource({ apiKey: config.ppt.apiKey, baseUrl: config.ppt.baseUrl }),
      { maxCards: config.sync.populationMaxCards, language: config.sync.language, log },
    );
    log(`Population: ${population.cards} Karten, ${population.creditsUsed} Credits.`);
  }
  process.exitCode = result.status === 'failed' ? 1 : 0;
} finally {
  await db.end();
}
