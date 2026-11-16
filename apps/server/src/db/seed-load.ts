import { loadConfig } from '../config.js';
import { hashToken } from '../http/auth.js';
import { migrate } from './migrate.js';
import { createPool } from './pool.js';

/**
 * Künstliche Datenmenge für Lasttests: `npm run seed:load`.
 * Größe über Umgebungsvariablen, Standard: 200 Sets × 250 Karten, 10.000 Nutzer
 * mit je 300 Karten, 30 Tage Preisverlauf. Nur für eine Wegwerf-Datenbank.
 */
const sets = Number(process.env.LOAD_SETS ?? 200);
const cardsPerSet = Number(process.env.LOAD_CARDS_PER_SET ?? 250);
const users = Number(process.env.LOAD_USERS ?? 10_000);
const itemsPerUser = Number(process.env.LOAD_ITEMS_PER_USER ?? 300);
const days = Number(process.env.LOAD_DAYS ?? 30);

const config = loadConfig();
const db = createPool(config.databaseUrl, 2);
const step = async (label: string, work: () => Promise<unknown>) => {
  const started = Date.now();
  await work();
  console.log(`${label}: ${((Date.now() - started) / 1000).toFixed(1)} s`);
};

try {
  await migrate(db);
  await db.query('set statement_timeout = 0');

  await step(`${sets} Sets`, () =>
    db.query(
      `insert into sets (id, name, series, release_date, card_count)
       select 'load-' || i, 'Last-Set ' || i, 'Last-Serie ' || (i % 12),
              date '1999-01-01' + (i * 50), $2
       from generate_series(1, $1::int) i
       on conflict (id) do nothing`,
      [sets, cardsPerSet],
    ),
  );

  await step(`${sets * cardsPerSet} Karten`, () =>
    db.query(
      `insert into cards (id, set_id, name, number, number_sort, rarity, market_price_usd, price_updated_at)
       select 'load-' || s || '-' || n, 'load-' || s, 'Lastkarte ' || s || '-' || n, n || '/' || $2, n,
              (array['Common','Uncommon','Rare','Holo Rare','Ultra Rare','Secret Rare'])[1 + (n % 6)],
              round((random() * 80 + 0.1)::numeric, 2), now()
       from generate_series(1, $1::int) s, generate_series(1, $2::int) n
       on conflict (id) do nothing`,
      [sets, cardsPerSet],
    ),
  );

  await step(`${days} Tage Preisverlauf`, async () => {
    for (let back = 0; back < days; back += 1) {
      await db.query(`select ensure_price_history_partition(current_date - $1::int)`, [back]);
    }
    await db.query(
      `insert into price_history (card_id, day, market_price_usd)
       select c.id, current_date - d, round((c.market_price_usd * (1 + 0.05 * sin(d)))::numeric, 2)
       from cards c, generate_series(0, $1::int - 1) d
       where c.id like 'load-%'
       on conflict do nothing`,
      [days],
    );
  });

  // Nutzer mit bekannten Tokens: "load-token-<n>" (mit Nullen auf 24 Zeichen aufgefüllt).
  await step(`${users} Nutzer`, async () => {
    for (let from = 1; from <= users; from += 5_000) {
      const batch = Array.from({ length: Math.min(5_000, users - from + 1) }, (_, i) =>
        hashToken(loadToken(from + i)),
      );
      await db.query(
        `insert into users (token_hash) select unnest($1::bytea[]) on conflict (token_hash) do nothing`,
        [batch],
      );
    }
  });

  await step(`${users * itemsPerUser} Sammlungseinträge`, () =>
    db.query(
      `insert into collection_items (user_id, card_id, quantity, source)
       select u.id, 'load-' || (1 + (u.rn + k) % $1::int) || '-' || (1 + (u.rn * 7 + k * 13) % $2::int), 1 + (k % 3), 'scan'
       from (select id, row_number() over (order by id)::int as rn from users) u,
            generate_series(1, $3::int) k
       on conflict do nothing`,
      [sets, cardsPerSet, itemsPerUser],
    ),
  );

  await step('Statistiken', () => db.query('analyze'));
  await db.query(
    `insert into meta (key, value) values ('catalog_version', 'load-' || extract(epoch from now())::bigint)
     on conflict (key) do update set value = excluded.value`,
  );
} finally {
  await db.end();
}

function loadToken(n: number): string {
  return `load-token-${String(n).padStart(13, '0')}`;
}
