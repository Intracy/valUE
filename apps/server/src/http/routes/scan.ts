import type {
  ConfirmScanRequest,
  ConfirmScanResponse,
  ScanCandidate,
  ScanRequest,
  ScanResponse,
} from '@value/api-types';
import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';

import { withTransaction, type Db } from '../../db/pool.js';
import { identifyCard } from '../../scan/identify.js';
import type { OcrEngine } from '../../scan/ocr.js';
import type { VisualIndex } from '../../scan/visual-index.js';
import type { Authenticator } from '../auth.js';
import { badRequest, HttpError, notFound } from '../errors.js';
import { toCard } from './catalog.js';

/** Größtes Foto, das angenommen wird (Base64, rund 4,5 MB Bild). */
const MAX_BODY = 6 * 1024 * 1024;
const MAX_PIXELS = 16_000_000;

export interface ScanDeps {
  db: Db;
  authenticate: Authenticator;
  index: VisualIndex;
  ocr: OcrEngine;
  ratePerMinute?: number;
}

/**
 * Scanner. Das Foto wird nur im Speicher verarbeitet und nicht abgelegt.
 * Gespeichert werden die Vorschläge und die Karte, die der Nutzer bestätigt;
 * daraus lässt sich die Trefferquote im Betrieb messen.
 */
export function registerScanRoutes(app: FastifyInstance, deps: ScanDeps) {
  const { db, authenticate } = deps;

  app.post<{ Body: ScanRequest }>(
    '/v1/me/scans',
    {
      bodyLimit: MAX_BODY,
      config: deps.ratePerMinute ? { rateLimit: { max: deps.ratePerMinute, timeWindow: '1 minute' } } : {},
    },
    async (request, reply): Promise<ScanResponse> => {
      const userId = await authenticate(request);
      const encoded = typeof request.body?.image === 'string' ? request.body.image : '';
      const image = Buffer.from(encoded.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      if (image.length < 1_000) throw badRequest('Kein Foto im Feld image.');

      const meta = await sharp(image, { failOn: 'error' })
        .metadata()
        .catch(() => null);
      if (!meta?.width || !meta.height || !['jpeg', 'png', 'webp', 'heif'].includes(meta.format ?? '')) {
        throw badRequest('Das Foto ist kein lesbares JPEG, PNG oder WebP.');
      }
      if (meta.width * meta.height > MAX_PIXELS) throw badRequest('Das Foto ist zu groß.');

      const result = await identifyCard(image, { db, index: deps.index, ocr: deps.ocr });

      const details = await db.query<{
        id: string;
        set_id: string;
        name: string;
        number: string | null;
        rarity: string | null;
        image_url: string | null;
        market_price_usd: number | null;
        market_price_eur: number | null;
        set_name: string;
        printings: string[];
      }>(
        `select c.id, c.set_id, c.name, c.number, c.rarity, c.image_url, c.market_price_usd, c.market_price_eur,
                s.name as set_name,
                coalesce(array_agg(p.printing order by p.printing) filter (where p.printing is not null), '{}') as printings
         from cards c
         join sets s on s.id = c.set_id
         left join card_printings p on p.card_id = c.id
         where c.id = any($1::text[])
         group by c.id, s.name`,
        [result.candidates.map((candidate) => candidate.cardId)],
      );
      const byId = new Map(details.rows.map((row) => [row.id, row]));
      const candidates: ScanCandidate[] = result.candidates.flatMap((candidate) => {
        const row = byId.get(candidate.cardId);
        if (!row) return [];
        return [
          {
            ...toCard(row),
            setName: row.set_name,
            printings: row.printings,
            confidence: Math.round(candidate.score * 100) / 100,
          },
        ];
      });

      const saved = await db.query<{ id: string }>(
        `insert into scans (user_id, outcome, candidates, ocr_name, ocr_number, duration_ms)
         values ($1, $2, $3, $4, $5, $6) returning id`,
        [
          userId,
          result.outcome,
          JSON.stringify(result.candidates.map(({ cardId, score, visual, name, number }) => ({ cardId, score, visual, name, number }))),
          result.ocrName,
          result.ocrNumber,
          result.durationMs,
        ],
      );

      reply.header('Cache-Control', 'private, no-store');
      return {
        scanId: saved.rows[0]!.id,
        outcome: result.outcome,
        candidates,
        read: { name: result.ocrName, number: result.ocrNumber },
        durationMs: result.durationMs,
      };
    },
  );

  // Erst nach Bestätigung kommt die Karte in die Sammlung. Ein Scan lässt sich
  // genau einmal bestätigen; ein doppelter Tipp fügt die Karte nicht zweimal hinzu.
  app.post<{ Params: { scanId: string }; Body: ConfirmScanRequest }>(
    '/v1/me/scans/:scanId/confirm',
    async (request, reply): Promise<ConfirmScanResponse> => {
      const userId = await authenticate(request);
      const cardId = typeof request.body?.cardId === 'string' ? request.body.cardId : '';
      const printing = typeof request.body?.printing === 'string' ? request.body.printing.slice(0, 80) : '';
      if (!cardId) throw badRequest('cardId fehlt.');
      if (!/^[0-9a-f-]{36}$/i.test(request.params.scanId)) throw notFound('Scan nicht gefunden.');

      const response = await withTransaction(db, async (client) => {
        const scan = await client.query<{ candidates: { cardId: string }[]; confirmed_at: Date | null }>(
          `select candidates, confirmed_at from scans where id = $1 and user_id = $2 for update`,
          [request.params.scanId, userId],
        );
        const row = scan.rows[0];
        if (!row) throw notFound('Scan nicht gefunden.');
        if (row.confirmed_at) throw new HttpError(409, 'already_confirmed', 'Dieser Scan wurde schon übernommen.');

        const card = await client.query<{ name: string }>(`select name from cards where id = $1`, [cardId]);
        if (!card.rows[0]) throw notFound('Karte nicht gefunden.');

        const item = await client.query<{ card_id: string; printing: string; quantity: number }>(
          `insert into collection_items (user_id, card_id, printing, quantity, source)
           values ($1, $2, $3, 1, 'scan')
           on conflict (user_id, card_id, printing) do update set
             quantity = least(collection_items.quantity + 1, 9999),
             source = 'scan'
           returning card_id, printing, quantity`,
          [userId, cardId, printing],
        );
        const rank = row.candidates.findIndex((candidate) => candidate.cardId === cardId);
        await client.query(
          `update scans set chosen_card_id = $2, chosen_rank = $3, confirmed_at = now() where id = $1`,
          [request.params.scanId, cardId, rank >= 0 ? rank : null],
        );
        const total = await client.query<{ n: number }>(
          `select coalesce(sum(quantity), 0)::int as n from collection_items where user_id = $1 and card_id = $2`,
          [userId, cardId],
        );
        const saved = item.rows[0]!;
        return {
          item: { cardId: saved.card_id, printing: saved.printing, quantity: saved.quantity, source: 'scan' as const },
          cardName: card.rows[0].name,
          totalQuantity: total.rows[0]!.n,
        };
      });
      reply.header('Cache-Control', 'private, no-store');
      return response;
    },
  );
}
