import type { DbClient } from '../db/pool.js';
import type { SourceCard, SourceSet } from '../sources/price-source.js';

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
                        market_price_usd, low_price_usd, price_updated_at, updated_at)
     select id, set_id, name, number, number_sort, rarity, image_url,
            market_price_usd, low_price_usd, coalesce(price_updated_at, now()), now()
     from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[], $7::text[],
                 $8::numeric[], $9::numeric[], $10::timestamptz[])
       as t (id, set_id, name, number, number_sort, rarity, image_url,
             market_price_usd, low_price_usd, price_updated_at)
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
    ],
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
