import { loadConfig } from '../config.js';
import type { SourceCard, SourceGrade, SourceSet } from '../sources/price-source.js';
import { bumpCatalogVersion, refreshCardCounts, snapshotPrices, upsertCards, upsertSets } from '../sync/store.js';
import { computeMissingFingerprints } from '../scan/fingerprint-job.js';
import { demoCardSvg, demoNames } from './demo-art.js';
import { migrate } from './migrate.js';
import { createPool, type Db } from './pool.js';

/**
 * Erfundene Demo-Daten, damit App und Server ohne API-Schlüssel laufen.
 * Namen und Motive sind erfunden und zeigen keine echte Karte (siehe demo-art.ts).
 */
const RARITIES = ['Common', 'Common', 'Common', 'Uncommon', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Secret Rare'];
/** Elemente reihum; jede siebte Karte ohne Element (wie Trainer). */
const ELEMENT_CYCLE = ['fire', 'water', 'grass', 'lightning', 'psychic', 'fighting', null] as const;

export const demoSets: SourceSet[] = [
  { id: 'demo-aurora', name: 'Demo-Set Aurora', series: 'Demo-Serie Neu', language: 'english', releaseDate: '2026-03-14', cardCount: 24, imageUrl: null },
  { id: 'demo-basalt', name: 'Demo-Set Basalt', series: 'Demo-Serie Neu', language: 'english', releaseDate: '2025-09-05', cardCount: 18, imageUrl: null },
  { id: 'demo-klassik', name: 'Demo-Set Klassik', series: 'Demo-Serie Alt', language: 'english', releaseDate: '1999-01-09', cardCount: 12, imageUrl: null },
];

export function demoCards(): SourceCard[] {
  return demoSets.flatMap((set) =>
    Array.from({ length: set.cardCount ?? 0 }, (_, index) => {
      const number = index + 1;
      const rarity = RARITIES[index % RARITIES.length]!;
      const price = Math.round((0.2 + ((number * 37) % 97) * (rarity.includes('Rare') ? 1.4 : 0.05)) * 100) / 100;
      const name = demoNames[index % demoNames.length]!;
      return {
        id: `${set.id}-${String(number).padStart(3, '0')}`,
        setId: set.id,
        name,
        number: `${number}/${set.cardCount}`,
        rarity,
        imageUrl: demoCardSvg({ setId: set.id, number, total: set.cardCount ?? 0, name, rarity }),
        element: ELEMENT_CYCLE[(index + set.id.length) % ELEMENT_CYCLE.length] ?? null,
        // Gegradete Preise und Population nur für seltene Karten, wie in echt.
        grades: rarity.includes('Rare') ? demoGrades(price, number) : [],
        marketPriceUsd: price,
        lowPriceUsd: Math.round(price * 0.8 * 100) / 100,
        priceUpdatedAt: null,
        printings: [
          { printing: 'Normal', marketPriceUsd: price, lowPriceUsd: null },
          ...(number % 3 === 0 ? [{ printing: 'Reverse Holofoil', marketPriceUsd: Math.round(price * 1.6 * 100) / 100, lowPriceUsd: null }] : []),
        ],
      } satisfies SourceCard;
    }),
  );
}

function demoGrades(price: number, number: number): SourceGrade[] {
  const round = (value: number) => Math.round(value * 100) / 100;
  return [
    { grader: 'PSA', grade: '10', priceUsd: round(price * 6.5), population: 40 + ((number * 53) % 260) },
    { grader: 'PSA', grade: '9', priceUsd: round(price * 2.4), population: 180 + ((number * 97) % 900) },
    { grader: 'PSA', grade: '8', priceUsd: round(price * 1.5), population: 90 + ((number * 31) % 400) },
    { grader: 'CGC', grade: '10', priceUsd: round(price * 4.8), population: 8 + ((number * 17) % 60) },
    { grader: 'CGC', grade: '9.5', priceUsd: round(price * 2.1), population: 30 + ((number * 41) % 180) },
    { grader: 'CGC', grade: '9', priceUsd: round(price * 1.6), population: 25 + ((number * 23) % 140) },
  ];
}

/**
 * Kursbewegung der Demo: eine langsame Welle mit eigener Phase je Karte (so
 * gibt es Gewinner und Verlierer) und ein leichter Anstieg über die Zeit.
 * $2 ist die Zahl der Tage vor heute.
 */
const DRIFT = `greatest(0.2, 1 + 0.07 * sin($2::float / 9 + (abs(hashtext(card_id)) % 628) / 100.0)
                                 - 0.07 * sin((abs(hashtext(card_id)) % 628) / 100.0) - 0.0006 * $2::int)`;

/** Euro-Kurs für die Demo, damit Preise wie in der App später in Euro erscheinen. */
const DEMO_EUR_RATE = 0.92;

export async function seedDemo(db: Db, days = 30): Promise<void> {
  const cards = demoCards();
  await upsertSets(db, demoSets);
  await upsertCards(db, cards);
  const ids = cards.map((card) => card.id);
  await db.query(`update cards set market_price_eur = round(market_price_usd * $2, 2) where id = any($1::text[])`, [
    ids,
    DEMO_EUR_RATE,
  ]);
  // Verlauf mit leichter Bewegung und leichtem Anstieg, damit die Diagramme etwas zeigen.
  for (let back = days; back >= 0; back -= 1) {
    const day = new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10);
    await snapshotPrices(db, ids, day);
    if (back > 0) {
      await db.query(
        `update price_history
         set market_price_usd = round((market_price_usd * ${DRIFT})::numeric, 2),
             market_price_eur = round((market_price_eur * ${DRIFT})::numeric, 2)
         where day = $1::date and card_id = any($3::text[])`,
        [day, back, ids],
      );
    }
  }
  await refreshCardCounts(db, demoSets.map((set) => set.id));
  await bumpCatalogVersion(db, `demo-${Date.now()}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const db = createPool(config.databaseUrl, 2);
  try {
    await migrate(db);
    // Gut ein Jahr Verlauf, damit im Portfolio auch "1J" etwas zeigt.
    await seedDemo(db, 400);
    await computeMissingFingerprints(db);
    console.log(`Demo-Daten geladen: ${demoSets.length} Sets, ${demoCards().length} Karten.`);
  } finally {
    await db.end();
  }
}
