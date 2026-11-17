import type { DbClient } from '../db/pool.js';
import type { SourceCard, SourceGrade, SourceSet } from '../sources/price-source.js';

type Queryable = Pick<DbClient, 'query'>;

/** Führende Zahl einer Kartennummer: "4/102" -> 4, "SWSH001" -> null. */
export function numberSort(number: string | null): number | null {
  const match = /^\d+/.exec(number ?? '');
  return match ? Number(match[0]) : null;
}

export async function upsertSets(db: Queryable, sets: SourceSet[]): Promise<void> {
  if (sets.length === 0) return;
  await db.query(
    `insert into sets (id, name, series, language, release_date, card_count, image_url, updated_at)
     select id, name, series, language, release_date, coalesce(card_count, 0), image_url, now()
     from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::date[], $6::int[], $7::text[])
       as t (id, name, series, language, release_date, card_count, image_url)
     on conflict (id) do update set
       name = excluded.name,
       series = coalesce(excluded.series, sets.series),
       language = excluded.language,
       release_date = coalesce(excluded.release_date, sets.release_date),
       card_count = greatest(excluded.card_count, sets.card_count),
       image_url = coalesce(excluded.image_url, sets.image_url),
       updated_at = now()`,
    [
      sets.map((set) => set.id),
      sets.map((set) => set.name),
      sets.map((set) => set.series),
      sets.map((set) => set.language),
      sets.map((set) => set.releaseDate),
      sets.map((set) => set.cardCount),
      sets.map((set) => set.imageUrl),
    ],
  );
}

/** Schreibt Karten in einem Befehl je Stapel. Kein Abruf je Karte. */
export async function upsertCards(db: Queryable, cards: SourceCard[]): Promise<void> {
  if (cards.length === 0) return;
  await db.query(
    `insert into cards (id, set_id, name, number, number_sort, rarity, image_url,
                        market_price_usd, low_price_usd, price_updated_at, element, updated_at)
     select id, set_id, name, number, number_sort, rarity, image_url,
            market_price_usd, low_price_usd, coalesce(price_updated_at, now()), element, now()
     from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[], $7::text[],
                 $8::numeric[], $9::numeric[], $10::timestamptz[], $11::text[])
       as t (id, set_id, name, number, number_sort, rarity, image_url,
             market_price_usd, low_price_usd, price_updated_at, element)
     on conflict (id) do update set
       set_id = excluded.set_id,
       name = excluded.name,
       number = excluded.number,
       number_sort = excluded.number_sort,
       rarity = coalesce(excluded.rarity, cards.rarity),
       image_url = coalesce(excluded.image_url, cards.image_url),
       market_price_usd = coalesce(excluded.market_price_usd, cards.market_price_usd),
       low_price_usd = coalesce(excluded.low_price_usd, cards.low_price_usd),
       price_updated_at = excluded.price_updated_at,
       element = coalesce(excluded.element, cards.element),
       updated_at = now()`,
    [
      cards.map((card) => card.id),
      cards.map((card) => card.setId),
      cards.map((card) => card.name),
      cards.map((card) => card.number),
      cards.map((card) => numberSort(card.number)),
      cards.map((card) => card.rarity),
      cards.map((card) => card.imageUrl),
      cards.map((card) => card.marketPriceUsd),
      cards.map((card) => card.lowPriceUsd),
      cards.map((card) => card.priceUpdatedAt),
      cards.map((card) => card.element ?? null),
    ],
  );

  await upsertHistory(
    db,
    cards.flatMap((card) => (card.history ?? []).map((point) => ({ cardId: card.id, ...point }))),
  );

  await upsertGrades(
    db,
    cards.flatMap((card) => (card.grades ?? []).map((grade) => ({ cardId: card.id, ...grade }))),
  );

  const printings = cards.flatMap((card) =>
    card.printings.map((printing) => ({ cardId: card.id, ...printing })),
  );
  if (printings.length > 0) {
    await db.query(
      `insert into card_printings (card_id, printing, market_price_usd, low_price_usd)
       select * from unnest($1::text[], $2::text[], $3::numeric[], $4::numeric[])
       on conflict (card_id, printing) do update set
         market_price_usd = excluded.market_price_usd,
         low_price_usd = excluded.low_price_usd`,
      [
        printings.map((row) => row.cardId),
        printings.map((row) => row.printing),
        printings.map((row) => row.marketPriceUsd),
        printings.map((row) => row.lowPriceUsd),
      ],
    );
  }
}

/**
 * Schreibt Tagespreise der Vergangenheit aus der Quelle. Der heutige Stand kommt
 * danach aus `snapshotPrices` und hat Vorrang.
 */
export async function upsertHistory(
  db: Queryable,
  points: { cardId: string; day: string; marketPriceUsd: number }[],
): Promise<void> {
  if (points.length === 0) return;
  for (const day of new Set(points.map((point) => point.day))) {
    await db.query('select ensure_price_history_partition($1::date)', [day]);
  }
  await db.query(
    `insert into price_history (card_id, day, market_price_usd)
     select * from unnest($1::text[], $2::date[], $3::numeric[])
     on conflict (card_id, day) do update set market_price_usd = excluded.market_price_usd`,
    [points.map((point) => point.cardId), points.map((point) => point.day), points.map((point) => point.marketPriceUsd)],
  );
}

/**
 * Schreibt Noten mit Preis und/oder Population. Ein fehlender Wert (null)
 * überschreibt keinen vorhandenen: Preise kommen aus dem Karten-Abruf, die
 * Population aus einem eigenen Abruf.
 */
export async function upsertGrades(db: Queryable, grades: (SourceGrade & { cardId: string })[]): Promise<void> {
  if (grades.length === 0) return;
  await db.query(
    `insert into card_grades (card_id, grader, grade, price_usd, population, updated_at)
     select card_id, grader, grade, price_usd, population, now()
     from unnest($1::text[], $2::text[], $3::text[], $4::numeric[], $5::int[])
       as t (card_id, grader, grade, price_usd, population)
     on conflict (card_id, grader, grade) do update set
       price_usd = coalesce(excluded.price_usd, card_grades.price_usd),
       population = coalesce(excluded.population, card_grades.population),
       updated_at = now()`,
    [
      grades.map((grade) => grade.cardId),
      grades.map((grade) => grade.grader),
      grades.map((grade) => grade.grade),
      grades.map((grade) => grade.priceUsd),
      grades.map((grade) => grade.population),
    ],
  );
}

/** Hält den heutigen Preisstand der genannten Karten fest. Mehrfach am Tag ausführbar. */
export async function snapshotPrices(db: Queryable, cardIds: string[], day: string): Promise<void> {
  if (cardIds.length === 0) return;
  await db.query('select ensure_price_history_partition($1::date)', [day]);
  await db.query(
    `insert into price_history (card_id, day, market_price_usd, market_price_eur)
     select id, $1::date, market_price_usd, market_price_eur
     from cards
     where id = any($2::text[]) and (market_price_usd is not null or market_price_eur is not null)
     on conflict (card_id, day) do update set
       market_price_usd = excluded.market_price_usd,
       market_price_eur = excluded.market_price_eur`,
    [day, cardIds],
  );
}

export async function refreshCardCounts(db: Queryable, setIds: string[]): Promise<void> {
  if (setIds.length === 0) return;
  await db.query(
    `update sets s set card_count = greatest(s.card_count, c.n)
     from (select set_id, count(*)::int as n from cards where set_id = any($1::text[]) group by set_id) c
     where c.set_id = s.id`,
    [setIds],
  );
}

export async function bumpCatalogVersion(db: Queryable, version: string): Promise<void> {
  await db.query(
    `insert into meta (key, value) values ('catalog_version', $1)
     on conflict (key) do update set value = excluded.value`,
    [version],
  );
}
