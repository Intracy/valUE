/**
 * Messung mit echten Kartenbildern in einem Katalog in voller Größe:
 *   DATABASE_URL=…/value_bench npx tsx test/real-scan-benchmark.ts <Ordner> [Füllkarten] [Fotos je Karte] [Schwierigkeit]
 *
 * Der Ordner enthält `catalog.json` und die Bilder:
 *   { "cards":  [{ "id": "en-base4-18", "setId": "en-base4", "setName": "Base Set 2", "language": "english",
 *                  "name": "Venusaur", "number": "18/130", "total": 130, "hp": 100,
 *                  "illustrator": "Mitsuhiro Arita", "cardText": "Energy Trans | Solarbeam",
 *                  "releaseDate": "2000-02-24", "image": "img/en_base4-18_low.webp" }],
 *     "photos": [{ "id": "en-base4-18", "file": "img/en_base4-18_high.webp" }] }
 * Die Bilder stammen von TCGdex (etwa https://assets.tcgdex.net/en/base/base4/18/high.webp)
 * und liegen wegen der Rechte nicht im Repository. Aus jedem Eintrag unter "photos"
 * entstehen simulierte Handyfotos.
 *
 * Dazu kommen Füllkarten bis zur Größe des echten Katalogs: Namen aus einer Liste
 * mit häufigen Pokémon, Nummern mit Set-Größen wie in echten Sets und kartenähnliche
 * Fingerabdrücke (Mischungen der echten). Die Datenbank wird geleert; ihr Name muss
 * "bench" enthalten.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { migrate } from '../src/db/migrate.js';
import { createPool } from '../src/db/pool.js';
import { createCatalogVersion } from '../src/http/catalog-version.js';
import { computeMissingFingerprints } from '../src/scan/fingerprint-job.js';
import { FINGERPRINT_DIM } from '../src/scan/image.js';
import { identifyCard } from '../src/scan/identify.js';
import { createOcrPool } from '../src/scan/ocr.js';
import { VisualIndex } from '../src/scan/visual-index.js';
import { numberSort } from '../src/sync/store.js';
import { syntheticPhoto } from './support/synthetic-photo.js';

interface BenchCard {
  id: string;
  setId: string;
  setName: string;
  language: string;
  name: string;
  number: string;
  total: number;
  hp: number | null;
  illustrator: string | null;
  cardText: string | null;
  releaseDate: string | null;
  image: string | null;
}

const [dir, fillerArg, variantsArg, difficultyArg] = process.argv.slice(2);
if (!dir) throw new Error('Ordner fehlt.');
const fillers = Number(fillerArg ?? 57_000);
const variants = Number(variantsArg ?? 4);
const difficulty = Number(difficultyArg ?? 0.5);
const url = process.env.DATABASE_URL!;
if (!/bench/.test(new URL(url).pathname)) throw new Error('Datenbankname muss "bench" enthalten.');

const { cards, photos } = JSON.parse(readFileSync(join(dir, 'catalog.json'), 'utf8')) as {
  cards: BenchCard[];
  photos: { id: string; file: string }[];
};
const dataUrl = (file: string) => `data:image/webp;base64,${readFileSync(join(dir, file)).toString('base64')}`;
const COMMON = ['Charizard', 'Glurak', 'Pikachu', 'Venusaur', 'Bisaflor', 'Ivysaur', 'Mewtwo', 'Eevee', 'Gengar', 'リザードン', 'ピカチュウ'];

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

  // Echte Karten mit allen Merkmalen.
  const sets = new Map(cards.map((card) => [card.setId, card]));
  for (const [id, card] of sets) {
    await db.query(`insert into sets (id, name, language, card_count, release_date) values ($1, $2, $3, $4, $5)`, [
      id, card.setName, card.language, card.total || 0, card.releaseDate,
    ]);
  }
  for (const card of cards) {
    await db.query(
      `insert into cards (id, set_id, name, number, number_sort, image_url, hp, illustrator, card_text)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [card.id, card.setId, card.name, card.number, numberSort(card.number), card.image ? dataUrl(card.image) : null,
       card.hp, card.illustrator, card.cardText],
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
    await db.query(
      `insert into sets (id, name, language, card_count, release_date) values ($1, $1, 'english', $2, $3)`,
      [id, totals[i % totals.length], `${1999 + (i % 27)}-06-01`],
    );
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

  const stats = { total: 0, top1: 0, listed: 0, match: 0, unsure: 0, none: 0, wrongMatch: 0, ms: 0 };
  console.log(`Katalog: ${size} Karten, davon ${cards.length} echte. Fotos: ${photos.length} Karten × ${variants}, Schwierigkeit ${difficulty}`);
  for (const photo of photos) {
    for (let v = 0; v < variants; v += 1) {
      const image = await syntheticPhoto(dataUrl(photo.file), { seed: 1000 + stats.total, difficulty });
      const result = await identifyCard(image, { db, index, ocr });
      stats.total += 1;
      stats.ms += result.durationMs;
      stats[result.outcome] += 1;
      const rank = result.candidates.findIndex((candidate) => candidate.cardId === photo.id);
      if (rank === 0) stats.top1 += 1;
      if (rank >= 0) stats.listed += 1;
      if (result.outcome === 'match' && rank !== 0) stats.wrongMatch += 1;
      const top = result.candidates
        .slice(0, 3)
        .map((c) => `${c.cardId} ${c.score.toFixed(2)} (B${c.visual.toFixed(2)} N${c.name.toFixed(2)} Nr${c.number}${c.details === undefined ? '' : ` M${c.details.toFixed(2)}`})`)
        .join(' | ');
      console.log(`${photo.id} #${v + 1}: ${result.outcome}, Platz ${rank + 1 || '–'}, Nr ${result.ocrNumber}, ${result.durationMs} ms\n    ${top}`);
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
