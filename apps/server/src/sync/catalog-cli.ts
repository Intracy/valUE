import { loadConfig } from '../config.js';
import { migrate } from '../db/migrate.js';
import { createPool } from '../db/pool.js';
import { computeMissingFingerprints } from '../scan/fingerprint-job.js';
import { PokemonPriceTrackerSource } from '../sources/pokemon-price-tracker.js';
import { CATALOG_LANGUAGES, createTcgdexClient, type CatalogLanguage } from '../sources/tcgdex.js';
import { removeDemoCatalog, runCatalogSync } from './catalog.js';
import { runApiSync } from './sync.js';

/**
 * Katalog von TCGdex, danach Fingerabdrücke für den Scanner, danach Preise von
 * Pokemon Price Tracker (falls ein Schlüssel gesetzt ist): `npm run catalog`.
 * Der erste Lauf lädt rund 57.000 Karten und dauert eine bis zwei Stunden,
 * spätere Läufe nur noch neue oder geänderte Sets.
 */
const config = loadConfig();
const db = createPool(config.databaseUrl, 4);
const log = (message: string) => console.log(`[katalog] ${new Date().toISOString().slice(11, 19)} ${message}`);

try {
  await migrate(db);
  if (config.catalog.removeDemo) {
    const removed = await removeDemoCatalog(db);
    if (removed > 0) log(`${removed} Demo-Sets entfernt.`);
  }

  const languages = config.catalog.languages.filter((language): language is CatalogLanguage =>
    (CATALOG_LANGUAGES as readonly string[]).includes(language),
  );
  const catalog = await runCatalogSync(db, createTcgdexClient({ baseUrl: config.catalog.tcgdexUrl }), {
    languages,
    concurrency: config.catalog.concurrency,
    refreshDays: config.catalog.refreshDays,
    log,
  });
  log(`Katalog ${catalog.status}: ${catalog.setsSynced} Sets, ${catalog.cardsSynced} Karten.`);
  for (const note of catalog.notes) log(`Hinweis: ${note}`);

  const fingerprints = await computeMissingFingerprints(db, { log, concurrency: config.catalog.concurrency });
  log(`Scanner: ${fingerprints.computed} Fingerabdrücke neu, ${fingerprints.failed} Bilder nicht verwertbar.`);

  if (config.ppt.apiKey) {
    const prices = await runApiSync(
      db,
      new PokemonPriceTrackerSource({
        apiKey: config.ppt.apiKey,
        baseUrl: config.ppt.baseUrl,
        includeGraded: config.sync.includeGraded,
        historyDays: config.sync.historyDays,
      }),
      {
        target: 'prices',
        sets: config.sync.sets,
        language: config.sync.language,
        maxCredits: config.sync.maxCreditsPerRun,
        creditsPerCard: config.sync.historyDays > 0 ? 2 : 1,
        setsRefreshHours: config.sync.setsRefreshHours,
        log,
      },
    );
    log(`Preise ${prices.status}: ${prices.setsSynced} Sets, ${prices.cardsSynced} Katalogkarten, ${prices.creditsUsed} Credits.`);
    for (const note of prices.notes) log(`Hinweis: ${note}`);
  } else {
    log('Kein PPT_API_KEY: Preise übersprungen.');
  }
  process.exitCode = catalog.status === 'failed' ? 1 : 0;
} finally {
  await db.end();
}
