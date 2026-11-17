/**
 * Messung der Erkennung mit simulierten Fotos aller Demo-Karten:
 *   DATABASE_URL=... npx tsx test/scan-benchmark.ts [Varianten je Karte] [Schwierigkeit 0..1]
 * Die Datenbank wird mit Demo-Daten befüllt. Nur eine Wegwerf-Datenbank verwenden.
 */
import { createPool } from '../src/db/pool.js';
import { migrate } from '../src/db/migrate.js';
import { seedDemo } from '../src/db/seed-demo.js';
import { createCatalogVersion } from '../src/http/catalog-version.js';
import { computeMissingFingerprints } from '../src/scan/fingerprint-job.js';
import { identifyCard } from '../src/scan/identify.js';
import { createOcrPool } from '../src/scan/ocr.js';
import { VisualIndex } from '../src/scan/visual-index.js';
import { syntheticPhoto } from './support/synthetic-photo.js';

const variants = Number(process.argv[2] ?? 3);
const difficulty = Number(process.argv[3] ?? 0.6);
const db = createPool(process.env.DATABASE_URL!, 4);
const ocr = createOcrPool(2);
try {
  await migrate(db);
  await seedDemo(db, 1);
  await computeMissingFingerprints(db);
  const version = createCatalogVersion(db, 0);
  const index = new VisualIndex(db, () => version.get());
  const cards = (await db.query<{ id: string; image_url: string }>(`select id, image_url from cards where id like 'demo-%' order by id`)).rows;

  const stats = { total: 0, top1: 0, listed: 0, match: 0, unsure: 0, none: 0, wrongMatch: 0, nameRead: 0, numberRead: 0, ms: 0 };
  const failures: string[] = [];
  for (const card of cards) {
    for (let v = 0; v < variants; v += 1) {
      const photo = await syntheticPhoto(card.image_url, { seed: stats.total + 1, difficulty });
      const result = await identifyCard(photo, { db, index, ocr });
      stats.total += 1;
      stats.ms += result.durationMs;
      stats[result.outcome] += 1;
      if (result.ocrName) stats.nameRead += 1;
      if (result.ocrNumber) stats.numberRead += 1;
      const rank = result.candidates.findIndex((c) => c.cardId === card.id);
      if (rank === 0) stats.top1 += 1;
      if (rank >= 0) stats.listed += 1;
      if (result.outcome === 'match' && rank !== 0) {
        stats.wrongMatch += 1;
        failures.push(`FALSCH SICHER ${card.id} -> ${result.candidates[0]?.cardId} (${result.ocrName} | ${result.ocrNumber})`);
      } else if (rank < 0) {
        failures.push(`NICHT GELISTET ${card.id} [${result.outcome}] name=${result.ocrName} nr=${result.ocrNumber} top=${result.candidates.slice(0, 2).map((c) => `${c.cardId}:${c.score.toFixed(2)}`).join(',')}`);
      }
    }
  }
  const pct = (n: number) => `${((n / stats.total) * 100).toFixed(1)} %`;
  console.log(`Fotos: ${stats.total} (${cards.length} Karten × ${variants}), Schwierigkeit ${difficulty}`);
  console.log(`Richtige Karte auf Platz 1:        ${pct(stats.top1)}`);
  console.log(`Richtige Karte unter den Vorschlägen: ${pct(stats.listed)}`);
  console.log(`Ergebnis eindeutig / unsicher / keins: ${pct(stats.match)} / ${pct(stats.unsure)} / ${pct(stats.none)}`);
  console.log(`Eindeutig, aber falsch:              ${stats.wrongMatch} (${pct(stats.wrongMatch)})`);
  console.log(`Name gelesen / Nummer gelesen:       ${pct(stats.nameRead)} / ${pct(stats.numberRead)}`);
  console.log(`Dauer je Scan im Mittel:             ${Math.round(stats.ms / stats.total)} ms`);
  for (const line of failures.slice(0, 25)) console.log('  ' + line);
} finally {
  await ocr.close();
  await db.end();
}
