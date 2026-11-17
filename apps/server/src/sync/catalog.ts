import type { Db } from '../db/pool.js';
import type { SourceCard } from '../sources/price-source.js';
import {
  catalogId,
  CATALOG_LANGUAGES,
  LANGUAGE_NAMES,
  mapTcgdexCard,
  mapTcgdexSet,
  setOfficialCount,
  type CatalogLanguage,
  type TcgdexCard,
  type TcgdexClient,
} from '../sources/tcgdex.js';
import { bumpCatalogVersion, upsertCatalogCards, upsertSets } from './store.js';
import { SYNC_LOCK, type SyncResult } from './sync.js';

export interface CatalogSyncOptions {
  languages?: readonly CatalogLanguage[];
  /** Gleichzeitige Abrufe bei TCGdex. */
  concurrency?: number;
  /** Bekannte, vollständige Sets nach so vielen Tagen erneut abgleichen. */
  refreshDays?: number;
  log?: (message: string) => void;
}

/** Führt `task` für alle Einträge aus, höchstens `limit` gleichzeitig. Reihenfolge bleibt erhalten. */
async function mapLimit<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await task(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/**
 * Deutsche Karten erben von der englischen Fassung, was TCGdex auf Deutsch oft
 * nicht hat oder anders benennt: das Bild (fehlt bei vielen älteren Sets; das
 * Artwork ist dasselbe), die Rarität (auf Englisch, wie die App sie einordnet)
 * und das Element.
 */
async function inheritFromEnglish(db: Db, cards: SourceCard[]): Promise<void> {
  const englishIds = cards.map((card) => `en-${card.id.slice(3)}`);
  const rows = await db.query<{ id: string; rarity: string | null; image_url: string | null; element: string | null }>(
    'select id, rarity, image_url, element from cards where id = any($1::text[])',
    [englishIds],
  );
  const english = new Map(rows.rows.map((row) => [row.id.slice(3), row]));
  for (const card of cards) {
    const twin = english.get(card.id.slice(3));
    if (!twin) continue;
    card.imageUrl ??= twin.image_url;
    card.rarity = twin.rarity ?? card.rarity;
    card.element ??= twin.element;
  }
}

/**
 * Gleicht den Katalog mit TCGdex ab. Neue Sets und Sets mit neuen Karten werden
 * vollständig geladen (eine Anfrage je Karte), bekannte Sets nur alle
 * `refreshDays` Tage. Englisch zuerst, weil Deutsch davon erbt.
 */
export async function runCatalogSync(db: Db, client: TcgdexClient, options: CatalogSyncOptions = {}): Promise<SyncResult> {
  const languages = CATALOG_LANGUAGES.filter((language) => (options.languages ?? CATALOG_LANGUAGES).includes(language));
  const concurrency = options.concurrency ?? 8;
  const refreshDays = options.refreshDays ?? 30;
  const log = options.log ?? (() => undefined);
  const result: SyncResult = { status: 'ok', runId: null, setsSynced: 0, cardsSynced: 0, creditsUsed: 0, notes: [] };

  const lock = await db.connect();
  try {
    const locked = await lock.query<{ ok: boolean }>('select pg_try_advisory_lock($1) as ok', [SYNC_LOCK]);
    if (!locked.rows[0]?.ok) return { ...result, status: 'skipped', notes: ['Ein anderer Abgleich läuft bereits.'] };
    const run = await db.query<{ id: number }>(`insert into sync_runs (mode) values ('tcgdex') returning id`);
    result.runId = run.rows[0]!.id;

    try {
      for (const language of languages) {
        const briefs = await client.listSets(language);
        const known = new Map(
          (
            await db.query<{ id: string; cards: number; stale: boolean }>(
              `select s.id, count(c.id)::int as cards,
                      s.updated_at < now() - make_interval(days => $2::int) as stale
               from sets s left join cards c on c.set_id = s.id
               where s.language = $1
               group by s.id`,
              [LANGUAGE_NAMES[language], refreshDays],
            )
          ).rows.map((row) => [row.id, row]),
        );
        let failedCards = 0;

        for (const brief of briefs) {
          const have = known.get(catalogId(language, brief.id));
          const total = brief.cardCount?.total ?? 0;
          if (have && have.cards >= total && !have.stale) continue;

          let set;
          try {
            set = await client.getSet(language, brief.id);
          } catch (error) {
            result.status = 'partial';
            result.notes.push(`${language}/${brief.id}: ${(error as Error).message}`);
            continue;
          }
          if (set.cards.length === 0) continue;

          const official = setOfficialCount(set);
          const cards = await mapLimit(set.cards, concurrency, async (briefCard) => {
            let detail: TcgdexCard;
            try {
              detail = await client.getCard(language, briefCard.id);
            } catch {
              // Ohne Details reicht die Kurzfassung aus der Set-Liste: Name, Nummer, Bild.
              failedCards += 1;
              detail = { ...briefCard, set: { id: set.id } };
            }
            return mapTcgdexCard(language, { ...detail, set: { ...detail.set, id: set.id } }, official);
          });
          if (language === 'de') await inheritFromEnglish(db, cards);

          const tx = await db.connect();
          try {
            await tx.query('begin');
            await upsertSets(tx, [mapTcgdexSet(language, set)]);
            await upsertCatalogCards(tx, cards);
            await tx.query('commit');
          } catch (error) {
            await tx.query('rollback').catch(() => undefined);
            throw error;
          } finally {
            tx.release();
          }
          result.setsSynced += 1;
          result.cardsSynced += cards.length;
          log(`${language}: ${set.name} (${set.id}), ${cards.length} Karten. Bisher ${result.cardsSynced}.`);
        }
        if (failedCards > 0) {
          result.status = 'partial';
          result.notes.push(`${language}: ${failedCards} Karten nur mit Kurzdaten (Details nicht abrufbar).`);
        }
      }
      if (result.cardsSynced > 0) await bumpCatalogVersion(db, `tcgdex-${result.runId}`);
    } catch (error) {
      result.status = 'failed';
      result.notes.push((error as Error).message);
    }

    await db.query(
      `update sync_runs set finished_at = now(), status = $2, sets_synced = $3, cards_synced = $4, note = $5 where id = $1`,
      [result.runId, result.status, result.setsSynced, result.cardsSynced, result.notes.join(' | ') || null],
    );
    return result;
  } finally {
    await lock.query('select pg_advisory_unlock($1)', [SYNC_LOCK]).catch(() => undefined);
    lock.release();
  }
}

/** Entfernt die Demo-Sets samt Karten (und damit auch Demo-Karten aus Sammlungen). */
export async function removeDemoCatalog(db: Db): Promise<number> {
  const removed = await db.query(`delete from sets where id like 'demo-%'`);
  if ((removed.rowCount ?? 0) > 0) {
    await db.query(`delete from price_history where card_id like 'demo-%'`);
    await bumpCatalogVersion(db, `demo-removed-${Date.now()}`);
  }
  return removed.rowCount ?? 0;
}
