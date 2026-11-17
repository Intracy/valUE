import type { Db } from '../db/pool.js';
import { fingerprintImageUrl } from '../sources/tcgdex.js';
import { bumpCatalogVersion } from '../sync/store.js';
import { fingerprint, loadImage, quantize } from './image.js';

/**
 * Rechnet Fingerabdrücke für alle Karten, deren Bild neu ist oder sich geändert hat.
 * Läuft nach dem Abgleich. Bilder werden parallel, aber gedrosselt geladen.
 */
export async function computeMissingFingerprints(
  db: Db,
  options: { concurrency?: number; batchSize?: number; log?: (message: string) => void } = {},
): Promise<{ computed: number; failed: number }> {
  const concurrency = options.concurrency ?? 6;
  const batchSize = options.batchSize ?? 200;
  const log = options.log ?? (() => undefined);
  let computed = 0;
  let failed = 0;
  const failedIds = new Set<string>();

  for (;;) {
    const pending = await db.query<{ id: string; image_url: string }>(
      `select c.id, c.image_url
       from cards c
       left join card_fingerprints f on f.card_id = c.id
       where c.image_url is not null
         and (f.card_id is null or f.image_url <> c.image_url)
         and not (c.id = any($2::text[]))
       order by c.id
       limit $1`,
      [batchSize, [...failedIds]],
    );
    if (pending.rows.length === 0) break;

    const rows: { id: string; url: string; vec: Buffer }[] = [];
    let next = 0;
    const worker = async () => {
      while (next < pending.rows.length) {
        const card = pending.rows[next++]!;
        try {
          const vec = quantize(await fingerprint(await loadImage(fingerprintImageUrl(card.image_url))));
          rows.push({ id: card.id, url: card.image_url, vec });
        } catch (error) {
          failed += 1;
          failedIds.add(card.id);
          log(`Bild von ${card.id} nicht verwertbar: ${(error as Error).message}`);
        }
      }
    };
    await Promise.all(Array.from({ length: concurrency }, worker));

    if (rows.length > 0) {
      await db.query(
        `insert into card_fingerprints (card_id, image_url, vec)
         select * from unnest($1::text[], $2::text[], $3::bytea[])
         on conflict (card_id) do update set image_url = excluded.image_url, vec = excluded.vec, created_at = now()`,
        [rows.map((row) => row.id), rows.map((row) => row.url), rows.map((row) => row.vec)],
      );
      computed += rows.length;
      log(`${computed} Fingerabdrücke berechnet.`);
    }
  }

  // Der Scanner lädt seinen Index neu, sobald sich die Version ändert.
  if (computed > 0) await bumpCatalogVersion(db, `fp-${Date.now()}`);
  return { computed, failed };
}
