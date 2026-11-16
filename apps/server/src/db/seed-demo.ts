import { loadConfig } from '../config.js';
import type { SourceCard, SourceSet } from '../sources/price-source.js';
import { bumpCatalogVersion, refreshCardCounts, snapshotPrices, upsertCards, upsertSets } from '../sync/store.js';
import { migrate } from './migrate.js';
import { createPool, type Db } from './pool.js';

/**
 * Erfundene Demo-Daten, damit App und Server ohne API-Schlüssel laufen.
 * Bewusst ohne echte Kartennamen und ohne Bilder.
 */
const RARITIES = ['Common', 'Common', 'Common', 'Uncommon', 'Uncommon', 'Rare', 'Holo Rare', 'Ultra Rare', 'Secret Rare'];

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
      return {
        id: `${set.id}-${String(number).padStart(3, '0')}`,
        setId: set.id,
        name: `Beispielkarte ${String(number).padStart(3, '0')}`,
        number: `${number}/${set.cardCount}`,
        rarity,
        imageUrl: null,
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

export async function seedDemo(db: Db, days = 30): Promise<void> {
  const cards = demoCards();
  await upsertSets(db, demoSets);
  await upsertCards(db, cards);
  const ids = cards.map((card) => card.id);
  // Ein paar Tage Verlauf mit leichter Bewegung, damit das Diagramm etwas zeigt.
  for (let back = days; back >= 0; back -= 1) {
    const day = new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10);
    await snapshotPrices(db, ids, day);
    if (back > 0) {
      await db.query(
        `update price_history set market_price_usd = round((market_price_usd * (1 + 0.04 * sin($2::int + length(card_id))))::numeric, 2)
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
    await seedDemo(db);
    console.log(`Demo-Daten geladen: ${demoSets.length} Sets, ${demoCards().length} Karten.`);
  } finally {
    await db.end();
  }
}
