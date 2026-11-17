import type { Db } from '../db/pool.js';
import type { ExportPrintingRow } from '../sources/ppt-export.js';
import type { PriceSource, SourceCard, SourceSet } from '../sources/price-source.js';
import {
  applyPrices,
  bumpCatalogVersion,
  refreshCardCounts,
  snapshotPrices,
  upsertCards,
  upsertPriceSets,
  upsertSets,
} from './store.js';

// Feste Zahl für pg_try_advisory_lock: Es läuft immer nur ein Abgleich, auch wenn
// mehrere Server-Instanzen oder Cron-Läufe gleichzeitig starten.
export const SYNC_LOCK = 4_711_002;

export interface SyncOptions {
  /** Namen oder IDs der Sets, die abgeglichen werden. Leer = keine. */
  sets: string[];
  language: string;
  maxCredits: number;
  /** Credits je Karte; mit Preisverlauf 2 statt 1 (laut `metadata.apiCallsConsumed`). */
  creditsPerCard?: number;
  setsRefreshHours: number;
  /**
   * `catalog`: Die Quelle füllt den Katalog (Sets und Karten).
   * `prices`: Der Katalog kommt von TCGdex; die Quelle liefert nur Preise für
   * vorhandene Karten. Ihre Set-Liste landet in `price_sets`.
   */
  target?: 'catalog' | 'prices';
  now?: () => Date;
  log?: (message: string) => void;
}

export interface SyncResult {
  status: 'ok' | 'partial' | 'failed' | 'skipped';
  runId: number | null;
  setsSynced: number;
  cardsSynced: number;
  creditsUsed: number;
  notes: string[];
}

interface SetRow {
  id: string;
  name: string;
  series: string | null;
  language: string;
  release_date: string | null;
  card_count: number;
  image_url: string | null;
}

const toSourceSet = (row: SetRow): SourceSet => ({
  id: row.id,
  name: row.name,
  series: row.series,
  language: row.language,
  releaseDate: row.release_date,
  cardCount: row.card_count,
  imageUrl: row.image_url,
});

/** Abgleich über Einzelabrufe. Hält sich an das Credit-Budget und bricht sauber ab, wenn es nicht reicht. */
export async function runApiSync(db: Db, source: PriceSource, options: SyncOptions): Promise<SyncResult> {
  const log = options.log ?? (() => undefined);
  const now = options.now ?? (() => new Date());
  const pricesOnly = options.target === 'prices';
  const setTable = pricesOnly ? 'price_sets' : 'sets';
  const lock = await db.connect();
  const result: SyncResult = {
    status: 'ok',
    runId: null,
    setsSynced: 0,
    cardsSynced: 0,
    creditsUsed: 0,
    notes: [],
  };

  try {
    const locked = await lock.query<{ ok: boolean }>('select pg_try_advisory_lock($1) as ok', [SYNC_LOCK]);
    if (!locked.rows[0]?.ok) {
      return { ...result, status: 'skipped', notes: ['Ein anderer Abgleich läuft bereits.'] };
    }

    const run = await db.query<{ id: number }>(
      `insert into sync_runs (mode) values ('api') returning id`,
    );
    result.runId = run.rows[0]!.id;

    let dailyRemaining: number | null = null;
    const budgetLeft = () =>
      Math.max(0, Math.min(options.maxCredits - result.creditsUsed, dailyRemaining ?? Number.POSITIVE_INFINITY));
    const account = (consumed: number, remaining: number | null) => {
      result.creditsUsed += consumed;
      if (remaining !== null) dailyRemaining = remaining;
    };

    try {
      // 1. Set-Liste. Kostet einen Credit, deshalb nur selten neu laden.
      const freshness = await db.query<{ stale: boolean; n: number }>(
        `select count(*)::int as n,
                coalesce(max(updated_at) < now() - make_interval(hours => $1::int), true) as stale
         from ${setTable} where language = $2`,
        [options.setsRefreshHours, options.language],
      );
      const { n, stale } = freshness.rows[0]!;
      if (n === 0 || stale) {
        if (budgetLeft() < 1) {
          result.notes.push('Kein Budget für die Set-Liste.');
        } else {
          const { sets, credits } = await source.listSets(options.language);
          account(Math.max(credits.consumed, 1), credits.dailyRemaining);
          await (pricesOnly ? upsertPriceSets(db, sets) : upsertSets(db, sets));
          log(`Set-Liste geladen: ${sets.length} Sets.`);
        }
      }

      // 2. Karten der gewünschten Sets.
      const touchedSets: string[] = [];
      for (const wanted of options.sets) {
        const found = await db.query<SetRow>(
          `select id, name, ${pricesOnly ? 'null as series' : 'series'}, language,
                  ${pricesOnly ? 'null as release_date' : 'release_date'}, card_count,
                  ${pricesOnly ? 'null as image_url' : 'image_url'}
           from ${setTable}
           where language = $2 and (id = $1 or lower(name) = lower($1))
           limit 1`,
          [wanted, options.language],
        );
        const row = found.rows[0];
        if (!row) {
          result.status = 'partial';
          result.notes.push(`Set "${wanted}" steht nicht in der Set-Liste der Quelle.`);
          continue;
        }
        // Ein Abruf kostet einen Credit je Karte (mit Verlauf zwei). Unbekannte Größe vorsichtig schätzen.
        const estimate = (row.card_count > 0 ? row.card_count : 60) * (options.creditsPerCard ?? 1);
        if (estimate > budgetLeft()) {
          result.status = 'partial';
          result.notes.push(
            `Set "${row.name}" übersprungen: braucht rund ${estimate} Credits, übrig sind ${budgetLeft()}.`,
          );
          continue;
        }

        const { cards, skipped, credits } = await source.listCardsInSet(toSourceSet(row));
        account(Math.max(credits.consumed, cards.length), credits.dailyRemaining);
        if (skipped > 0) {
          result.status = 'partial';
          result.notes.push(`Set "${row.name}": ${skipped} Einträge ohne ID oder Namen übersprungen.`);
        }
        if (cards.length === 0) {
          result.status = 'partial';
          result.notes.push(`Set "${row.name}": Die Quelle lieferte keine Karten.`);
          continue;
        }
        if (pricesOnly) {
          const priced = await writePrices(db, cards, now());
          result.cardsSynced += priced;
          log(`Set "${row.name}": ${cards.length} Preise, ${priced} Katalogkarten zugeordnet.`);
        } else {
          await writeCards(db, cards, now());
          touchedSets.push(row.id);
          result.cardsSynced += cards.length;
          log(`Set "${row.name}": ${cards.length} Karten.`);
        }
        result.setsSynced += 1;
      }

      await refreshCardCounts(db, touchedSets);
      if (result.cardsSynced > 0) await bumpCatalogVersion(db, String(result.runId));
    } catch (error) {
      result.status = 'failed';
      result.notes.push((error as Error).message);
    }

    await db.query(
      `update sync_runs set finished_at = now(), status = $2, sets_synced = $3, cards_synced = $4,
                            credits_used = $5, note = $6
       where id = $1`,
      [
        result.runId,
        result.status,
        result.setsSynced,
        result.cardsSynced,
        result.creditsUsed,
        result.notes.join(' | ') || null,
      ],
    );
    return result;
  } finally {
    await lock.query('select pg_advisory_unlock($1)', [SYNC_LOCK]).catch(() => undefined);
    lock.release();
  }
}

/** Preise auf Katalogkarten schreiben und den Tagesstand festhalten. Liefert die Zahl zugeordneter Karten. */
async function writePrices(db: Db, cards: SourceCard[], at: Date): Promise<number> {
  const client = await db.connect();
  try {
    await client.query('begin');
    const ids = await applyPrices(client, cards);
    await snapshotPrices(client, ids, at.toISOString().slice(0, 10));
    await client.query('commit');
    return ids.length;
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function writeCards(db: Db, cards: SourceCard[], at: Date): Promise<void> {
  const day = at.toISOString().slice(0, 10);
  const client = await db.connect();
  try {
    await client.query('begin');
    await upsertCards(client, cards);
    await snapshotPrices(
      client,
      cards.map((card) => card.id),
      day,
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Abgleich aus dem Tages-Export (Business-Tarif): der ganze Katalog in einem
 * Durchlauf, ohne Credits. Zeilen werden in Stapeln geschrieben.
 */
export async function runExportSync(
  db: Db,
  rows: AsyncIterable<ExportPrintingRow>,
  options: { batchSize?: number; now?: () => Date; log?: (message: string) => void } = {},
): Promise<SyncResult> {
  const batchSize = options.batchSize ?? 2_000;
  const now = options.now ?? (() => new Date());
  const log = options.log ?? (() => undefined);
  const lock = await db.connect();
  const result: SyncResult = { status: 'ok', runId: null, setsSynced: 0, cardsSynced: 0, creditsUsed: 0, notes: [] };

  try {
    const locked = await lock.query<{ ok: boolean }>('select pg_try_advisory_lock($1) as ok', [SYNC_LOCK]);
    if (!locked.rows[0]?.ok) {
      return { ...result, status: 'skipped', notes: ['Ein anderer Abgleich läuft bereits.'] };
    }
    const run = await db.query<{ id: number }>(`insert into sync_runs (mode) values ('export') returning id`);
    result.runId = run.rows[0]!.id;

    const seenSets = new Set<string>();
    const cards = new Map<string, SourceCard>();
    let batchRows = 0;

    const flush = async () => {
      if (cards.size === 0) return;
      const batch = [...cards.values()];
      cards.clear();
      batchRows = 0;
      await writeCards(db, batch, now());
      result.cardsSynced += batch.length;
      log(`${result.cardsSynced} Karten geschrieben.`);
    };

    try {
      for await (const row of rows) {
        if (!seenSets.has(row.setId)) {
          seenSets.add(row.setId);
          await upsertSets(db, [
            {
              id: row.setId,
              name: row.setName,
              series: null,
              language: row.language,
              releaseDate: null,
              cardCount: null,
              imageUrl: null,
            },
          ]);
        }
        // Die Zeilen einer Karte stehen im Export beieinander. Die erste Variante
        // liefert den Kartenpreis, alle Varianten landen in card_printings.
        let card = cards.get(row.cardId);
        if (!card) {
          card = {
            id: row.cardId,
            setId: row.setId,
            name: row.name,
            number: row.number,
            rarity: row.rarity,
            imageUrl: null,
            marketPriceUsd: row.marketPriceUsd,
            lowPriceUsd: row.lowPriceUsd,
            priceUpdatedAt: row.priceUpdatedAt,
            printings: [],
          };
          // Stapel nur an einer Kartengrenze schreiben, damit keine Karte geteilt wird.
          if (batchRows >= batchSize) await flush();
          cards.set(row.cardId, card);
        }
        card.printings.push({
          printing: row.printing,
          marketPriceUsd: row.marketPriceUsd,
          lowPriceUsd: row.lowPriceUsd,
        });
        batchRows += 1;
      }
      await flush();
      result.setsSynced = seenSets.size;
      await refreshCardCounts(db, [...seenSets]);
      if (result.cardsSynced > 0) await bumpCatalogVersion(db, String(result.runId));
    } catch (error) {
      result.status = 'failed';
      result.notes.push((error as Error).message);
    }

    await db.query(
      `update sync_runs set finished_at = now(), status = $2, sets_synced = $3, cards_synced = $4, note = $5
       where id = $1`,
      [result.runId, result.status, result.setsSynced, result.cardsSynced, result.notes.join(' | ') || null],
    );
    return result;
  } finally {
    await lock.query('select pg_advisory_unlock($1)', [SYNC_LOCK]).catch(() => undefined);
    lock.release();
  }
}
