/**
 * Messung mit echten Kartenbildern in einem Katalog in voller Größe:
 *   DATABASE_URL=…/value_bench npx tsx test/real-scan-benchmark.ts <Bildordner> [Füllkarten] [Fotos je Karte] [Schwierigkeit]
 *
 * Der Bildordner enthält TCGdex-Bilder (etwa https://assets.tcgdex.net/en/base/base1/4/high.webp), benannt wie der Pfad auf assets.tcgdex.net
 * mit "_" statt "/", etwa `en_base_base1_4_high.webp`. Jede Datei wird eine Katalogkarte.
 * Dazu kommen Füllkarten bis zur Größe des echten Katalogs: Namen aus einer Liste
 * mit häufigen Pokémon (viele Glurak, viele Pikachu), Nummern mit Set-Größen wie in
 * echten Sets und kartenähnliche Fingerabdrücke (Mischungen der echten). So treffen
 * Name, Nummer und Bild auf ähnlich viele Doppelgänger wie im echten Katalog.
 *
 * Die Datenbank wird geleert. Ihr Name muss "bench" enthalten.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { migrate } from '../src/db/migrate.js';
import { createPool } from '../src/db/pool.js';
import { createCatalogVersion } from '../src/http/catalog-version.js';
import { computeMissingFingerprints } from '../src/scan/fingerprint-job.js';
import { FINGERPRINT_DIM } from '../src/scan/image.js';
import { identifyCard } from '../src/scan/identify.js';
import { createOcrPool } from '../src/scan/ocr.js';
import { VisualIndex } from '../src/scan/visual-index.js';
import { syntheticPhoto } from './support/synthetic-photo.js';

const [dir, fillerArg, variantsArg, difficultyArg] = process.argv.slice(2);
if (!dir) throw new Error('Bildordner fehlt.');
const fillers = Number(fillerArg ?? 57_000);
const variants = Number(variantsArg ?? 4);
const difficulty = Number(difficultyArg ?? 0.5);
const url = process.env.DATABASE_URL!;
if (!/bench/.test(new URL(url).pathname)) throw new Error('Datenbankname muss "bench" enthalten.');

/** Echte Karten: Name, Nummer, Set-Größe je TCGdex-ID. Deutsche Zwillinge nutzen das englische Bild. */
const REAL: Record<string, { name: string; number: string; total: number; set: string }> = {
  'en-base1-4': { name: 'Charizard', number: '4/102', total: 102, set: 'en-base1' },
  'de-base1-4': { name: 'Glurak', number: '4/102', total: 102, set: 'de-base1' },
  'en-base1-58': { name: 'Pikachu', number: '58/102', total: 102, set: 'en-base1' },
  'de-base1-58': { name: 'Pikachu', number: '58/102', total: 102, set: 'de-base1' },
  'en-swsh3-136': { name: 'Furret', number: '136/189', total: 189, set: 'en-swsh3' },
  'de-swsh3-136': { name: 'Wiesenior', number: '136/189', total: 189, set: 'de-swsh3' },
  'ja-SV1S-001': { name: 'サボネア', number: '001/78', total: 78, set: 'ja-SV1S' },
  'ja-SV1S-002': { name: 'ノクタス', number: '002/78', total: 78, set: 'ja-SV1S' },
};
const FILE_TO_ID = (file: string) => {
  const [language, , set, number] = file.replace(/_(high|low)\.webp$/, '').split('_');
  return `${language}-${set}-${number}`;
};
const COMMON = ['Charizard', 'Glurak', 'Pikachu', 'Furret', 'Wiesenior', 'Mewtwo', 'Eevee', 'Evoli', 'Gengar', 'リザードン', 'ピカチュウ', 'サボネア'];

function rng(seed: number) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

const db = createPool(url, 4);
const ocr = createOcrPool(2);
try {
  await db.query('drop schema public cascade; create schema public;');
  await migrate(db);

  // Echte Karten mit Bild als data-URL.
  const files = readdirSync(dir).filter((file) => file.endsWith('.webp'));
  const images = new Map(files.map((file) => [FILE_TO_ID(file), `data:image/webp;base64,${readFileSync(join(dir, file)).toString('base64')}`]));
  const twinImage = (id: string) => images.get(id) ?? images.get(`en-${id.slice(3)}`) ?? null;
  const realSets = [...new Set(Object.values(REAL).map((card) => card.set))];
  for (const set of realSets) {
    const total = Object.values(REAL).find((card) => card.set === set)!.total;
    await db.query(`insert into sets (id, name, language, card_count) values ($1, $1, $2, $3)`, [
      set, { en: 'english', de: 'german', ja: 'japanese' }[set.slice(0, 2)], total,
    ]);
  }
  for (const [id, card] of Object.entries(REAL)) {
    await db.query(
      `insert into cards (id, set_id, name, number, number_sort, image_url) values ($1, $2, $3, $4, $5, $6)`,
      [id, card.set, card.name, card.number, Number(card.number.split('/')[0]), twinImage(id)],
    );
  }
  await computeMissingFingerprints(db);
  const realVectors = (await db.query<{ vec: Buffer }>('select vec from card_fingerprints')).rows.map((row) => new Int8Array(row.vec));

  // Füllkarten in 450 Sets mit typischen Set-Größen.
  const random = rng(42);
  const totals = [102, 64, 62, 110, 165, 189, 192, 198, 202, 78, 71, 101, 162, 182, 185, 195, 203, 230, 98, 100];
  const setIds: string[] = [];
  for (let i = 0; i < 450; i += 1) {
    const id = `${['en', 'de', 'ja'][i % 3]}-fill${i}`;
    setIds.push(id);
    await db.query(`insert into sets (id, name, language, card_count) values ($1, $1, 'english', $2)`, [
      id, totals[i % totals.length],
    ]);
  }
  const syllables = ['ka', 'ri', 'zo', 'mon', 'pi', 'lu', 'tra', 'gor', 'nix', 'bel', 'dra', 'ex', 'vo', 'sa', 'lith', 'quor'];
  const batch = 2_000;
  for (let start = 0; start < fillers; start += batch) {
    const rows = Array.from({ length: Math.min(batch, fillers - start) }, (_, k) => {
      const i = start + k;
      const set = setIds[Math.floor(random() * setIds.length)]!;
      const total = totals[setIds.indexOf(set) % totals.length]!;
      const num = 1 + Math.floor(random() * Math.round(total * 1.15));
      const name =
        random() < 0.02
          ? COMMON[Math.floor(random() * COMMON.length)]!
          : Array.from({ length: 2 + Math.floor(random() * 3) }, () => syllables[Math.floor(random() * syllables.length)]).join('');
      // Kartenähnlicher Fingerabdruck: Mischung zweier echter mit Rauschen.
      const a = realVectors[Math.floor(random() * realVectors.length)]!;
      const b = realVectors[Math.floor(random() * realVectors.length)]!;
      const mix = random();
      const vec = Buffer.alloc(FINGERPRINT_DIM);
      for (let d = 0; d < FINGERPRINT_DIM; d += 1) {
        const value = mix * a[d]! + (1 - mix) * b[d]! + (random() - 0.5) * 60;
        vec.writeInt8(Math.max(-127, Math.min(127, Math.round(value))), d);
      }
      return { id: `${set}-${i}`, set, name: name.charAt(0).toUpperCase() + name.slice(1), number: `${num}/${total}`, num, vec };
    });
    await db.query(
      `insert into cards (id, set_id, name, number, number_sort)
       select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[])`,
      [rows.map((r) => r.id), rows.map((r) => r.set), rows.map((r) => r.name), rows.map((r) => r.number), rows.map((r) => r.num)],
    );
    await db.query(
      `insert into card_fingerprints (card_id, image_url, vec) select * from unnest($1::text[], $2::text[], $3::bytea[])`,
      [rows.map((r) => r.id), rows.map(() => 'fill'), rows.map((r) => r.vec)],
    );
  }
  await db.query('analyze');
  const size = (await db.query<{ n: number }>('select count(*)::int as n from cards')).rows[0]!.n;

  const version = createCatalogVersion(db, 0);
  const index = new VisualIndex(db, () => version.get());
  await index.ensureFresh();

  const testCards = files.filter((file) => file.endsWith('_high.webp')).map(FILE_TO_ID);
  const stats = { total: 0, top1: 0, listed: 0, match: 0, unsure: 0, none: 0, wrongMatch: 0, ms: 0 };
  console.log(`Katalog: ${size} Karten. Fotos: ${testCards.length} Karten × ${variants}, Schwierigkeit ${difficulty}`);
  for (const id of testCards) {
    for (let v = 0; v < variants; v += 1) {
      const photo = await syntheticPhoto(images.get(id)!, { seed: 1000 + stats.total, difficulty });
      const result = await identifyCard(photo, { db, index, ocr });
      stats.total += 1;
      stats.ms += result.durationMs;
      stats[result.outcome] += 1;
      const rank = result.candidates.findIndex((candidate) => candidate.cardId === id);
      if (rank === 0) stats.top1 += 1;
      if (rank >= 0) stats.listed += 1;
      if (result.outcome === 'match' && rank !== 0) stats.wrongMatch += 1;
      const top = result.candidates
        .slice(0, 3)
        .map((c) => `${c.cardId} ${c.score.toFixed(2)} (B${c.visual.toFixed(2)} N${c.name.toFixed(2)} Nr${c.number})`)
        .join(' | ');
      console.log(`${id} #${v + 1}: ${result.outcome}, Platz ${rank + 1 || '–'}, Name "${result.ocrName}", Nr ${result.ocrNumber}, ${result.durationMs} ms\n    ${top}`);
    }
  }
  const pct = (n: number) => `${((n / stats.total) * 100).toFixed(0)} %`;
  console.log(
    `\nPlatz 1: ${pct(stats.top1)}, unter den Vorschlägen: ${pct(stats.listed)}, eindeutig/unsicher/keins: ${pct(stats.match)}/${pct(stats.unsure)}/${pct(stats.none)}, eindeutig aber falsch: ${stats.wrongMatch}, im Mittel ${Math.round(stats.ms / stats.total)} ms`,
  );
} finally {
  await ocr.close();
  await db.end();
}
