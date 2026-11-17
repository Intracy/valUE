import type {
  CardDetailResponse,
  CardGrade,
  Grader,
  MarketMoversResponse,
  MoverCard,
  CardSummary,
  Money,
  SearchResponse,
  SetDetailResponse,
  SetListResponse,
  SetSummary,
} from '@value/api-types';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { Db } from '../../db/pool.js';
import type { CatalogVersion } from '../catalog-version.js';
import { isElement } from '../../domain/elements.js';
import { notFound } from '../errors.js';

/**
 * Katalog und Preise. Diese Antworten sind für alle Nutzer gleich und ändern
 * sich nur nach einem Abgleich. Deshalb tragen sie ein ETag und dürfen von
 * einem CDN zwischengespeichert werden: Die meisten Abrufe erreichen den
 * Server dann gar nicht.
 */

interface SetRow {
  id: string;
  name: string;
  series: string | null;
  language: string;
  release_date: string | null;
  card_count: number;
  image_url: string | null;
}

interface CardRow {
  id: string;
  set_id: string;
  name: string;
  number: string | null;
  rarity: string | null;
  image_url: string | null;
  market_price_usd: number | null;
  market_price_eur: number | null;
  element: string | null;
}

const toSet = (row: SetRow): SetSummary => ({
  id: row.id,
  name: row.name,
  series: row.series,
  language: row.language,
  releaseDate: row.release_date,
  cardCount: row.card_count,
  imageUrl: row.image_url,
});

/** Euro, wenn vorhanden (Cardmarket), sonst Dollar. */
export const toPrice = (usd: number | null, eur: number | null): Money | null =>
  eur !== null ? { amount: eur, currency: 'EUR' } : usd !== null ? { amount: usd, currency: 'USD' } : null;

export const toCard = (row: CardRow): CardSummary => ({
  id: row.id,
  setId: row.set_id,
  name: row.name,
  number: row.number,
  rarity: row.rarity,
  imageUrl: row.image_url,
  price: toPrice(row.market_price_usd, row.market_price_eur),
  element: isElement(row.element) ? row.element : null,
});

export const CARD_COLUMNS =
  'c.id, c.set_id, c.name, c.number, c.rarity, c.image_url, c.market_price_usd, c.market_price_eur, c.element';

/** Höchste Note zuerst; "9.5" steht zwischen "10" und "9". */
const byGradeDesc = (a: CardGrade, b: CardGrade) => Number(b.grade) - Number(a.grade);

export function registerCatalogRoutes(app: FastifyInstance, db: Db, version: CatalogVersion) {
  /** Setzt Cache-Kopfzeilen. Antwortet mit 304, wenn der Client den Stand schon hat. */
  const cached = async (request: FastifyRequest, reply: FastifyReply, scope: string): Promise<string | null> => {
    const current = await version.get();
    const etag = `W/"${scope}-${current}"`;
    reply.header('ETag', etag);
    // Browser 5 Minuten, CDN 1 Stunde; danach liefert das CDN weiter aus, während es neu lädt.
    reply.header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    if (request.headers['if-none-match'] === etag) {
      reply.code(304).send();
      return null;
    }
    return current;
  };

  app.get('/v1/sets', async (request, reply): Promise<SetListResponse | undefined> => {
    const catalogVersion = await cached(request, reply, 'sets');
    if (catalogVersion === null) return;
    const result = await db.query<SetRow>(
      `select id, name, series, language, release_date, card_count, image_url
       from sets
       order by release_date desc nulls last, name`,
    );
    return { sets: result.rows.map(toSet), catalogVersion };
  });

  app.get<{ Params: { setId: string } }>(
    '/v1/sets/:setId',
    async (request, reply): Promise<SetDetailResponse | undefined> => {
      const { setId } = request.params;
      const catalogVersion = await cached(request, reply, `set-${setId}`);
      if (catalogVersion === null) return;
      const [set, cards] = await Promise.all([
        db.query<SetRow>(
          `select id, name, series, language, release_date, card_count, image_url from sets where id = $1`,
          [setId],
        ),
        db.query<CardRow>(
          `select ${CARD_COLUMNS} from cards c
           where c.set_id = $1
           order by c.number_sort nulls last, c.number, c.id`,
          [setId],
        ),
      ]);
      if (!set.rows[0]) throw notFound('Set nicht gefunden.');
      return { set: toSet(set.rows[0]), cards: cards.rows.map(toCard), catalogVersion };
    },
  );

  app.get<{ Params: { cardId: string }; Querystring: { days?: string } }>(
    '/v1/cards/:cardId',
    async (request, reply): Promise<CardDetailResponse | undefined> => {
      const { cardId } = request.params;
      const days = Math.min(Math.max(Number(request.query.days) || 90, 1), 3650);
      const catalogVersion = await cached(request, reply, `card-${cardId}-${days}`);
      if (catalogVersion === null) return;

      const [card, printings, history, grades] = await Promise.all([
        db.query<CardRow & { low_price_usd: number | null; price_updated_at: Date | null; set_name: string; set_release_date: string | null }>(
          `select ${CARD_COLUMNS}, c.low_price_usd, c.price_updated_at,
                  s.name as set_name, s.release_date as set_release_date
           from cards c join sets s on s.id = c.set_id
           where c.id = $1`,
          [cardId],
        ),
        db.query<{ printing: string; market_price_usd: number | null }>(
          `select printing, market_price_usd from card_printings where card_id = $1 order by printing`,
          [cardId],
        ),
        // Die Tagesgrenze steht in der Bedingung, damit nur die betroffenen Monats-Teile gelesen werden.
        db.query<{ day: string; market_price_usd: number | null; market_price_eur: number | null }>(
          `select day, market_price_usd, market_price_eur
           from price_history
           where card_id = $1 and day >= current_date - $2::int
           order by day`,
          [cardId, days],
        ),
        db.query<{ grader: Grader; grade: string; price_usd: number | null; population: number | null }>(
          `select grader, grade, price_usd, population from card_grades where card_id = $1`,
          [cardId],
        ),
      ]);

      const row = card.rows[0];
      if (!row) throw notFound('Karte nicht gefunden.');
      const currency = row.market_price_eur !== null ? 'EUR' : 'USD';
      return {
        card: {
          ...toCard(row),
          setName: row.set_name,
          setReleaseDate: row.set_release_date,
          lowPrice: row.low_price_usd !== null ? { amount: row.low_price_usd, currency: 'USD' } : null,
          priceUpdatedAt: row.price_updated_at ? row.price_updated_at.toISOString() : null,
        },
        printings: printings.rows.map((printing) => ({
          printing: printing.printing,
          price: toPrice(printing.market_price_usd, null),
        })),
        history: {
          currency,
          points: history.rows
            .map((point) => ({
              day: point.day,
              amount: currency === 'EUR' ? point.market_price_eur : point.market_price_usd,
            }))
            .filter((point): point is { day: string; amount: number } => point.amount !== null),
        },
        grades: grades.rows
          .map((grade) => ({
            grader: grade.grader,
            grade: grade.grade,
            price: toPrice(grade.price_usd, null),
            population: grade.population,
          }))
          .sort(byGradeDesc),
        catalogVersion,
      };
    },
  );

  // Größte Gewinner und Verlierer über einen Zeitraum. Für alle gleich, deshalb
  // zwischengespeichert wie der übrige Katalog. Karten unter 1 (Euro oder Dollar)
  // bleiben außen vor: Dort sind Prozente nur Rauschen.
  app.get<{ Querystring: { days?: string; limit?: string } }>(
    '/v1/market/movers',
    async (request, reply): Promise<MarketMoversResponse | undefined> => {
      const days = Math.min(Math.max(Number(request.query.days) || 7, 1), 90);
      const limit = Math.min(Math.max(Number(request.query.limit) || 10, 1), 30);
      const catalogVersion = await cached(request, reply, `movers-${days}-${limit}`);
      if (catalogVersion === null) return;
      // Die Auswertung liest alle Karten an zwei Tagen. Sie ändert sich nur mit dem
      // Katalog; deshalb einmal je Katalogstand rechnen und im Prozess merken.
      const key = `${catalogVersion}-${days}-${limit}`;
      let pending = moversCache.get(key);
      if (!pending) {
        if (moversCache.size > 50) moversCache.clear();
        pending = computeMovers(days, limit, catalogVersion);
        moversCache.set(key, pending);
        pending.catch(() => moversCache.delete(key));
      }
      return pending;
    },
  );

  const moversCache = new Map<string, Promise<MarketMoversResponse>>();
  async function computeMovers(days: number, limit: number, catalogVersion: string): Promise<MarketMoversResponse> {
    const result = await db.query<CardRow & { set_name: string; previous: number; currency: 'EUR' | 'USD'; change: number }>(
      `with base as (
         select max(day) as day from price_history where day <= current_date - $1::int
       ),
       moves as (
         select ${CARD_COLUMNS}, s.name as set_name,
                case when c.market_price_eur is not null and ph.market_price_eur is not null then 'EUR' else 'USD' end as currency,
                case when c.market_price_eur is not null and ph.market_price_eur is not null
                     then ph.market_price_eur else ph.market_price_usd end as previous,
                case when c.market_price_eur is not null and ph.market_price_eur is not null
                     then c.market_price_eur else c.market_price_usd end as cur
         from base
         join price_history ph on ph.day = base.day
         join cards c on c.id = ph.card_id
         join sets s on s.id = c.set_id
       )
       (select *, (cur - previous) / previous as change from moves
        where previous >= 1 and cur > previous order by change desc, id limit $2)
       union all
       (select *, (cur - previous) / previous as change from moves
        where previous >= 1 and cur < previous order by change asc, id limit $2)`,
      [days, limit],
    );

    const toMover = (row: (typeof result.rows)[number]): MoverCard => ({
      ...toCard(row),
      setName: row.set_name,
      previousPrice: { amount: row.previous, currency: row.currency },
      changePercent: Math.round(row.change * 1000) / 10,
    });
    return {
      days,
      gainers: result.rows.filter((row) => row.change > 0).map(toMover),
      losers: result.rows.filter((row) => row.change < 0).map(toMover),
      catalogVersion,
    };
  }

  app.get<{ Querystring: { q?: string; limit?: string } }>(
    '/v1/search',
    async (request, reply): Promise<SearchResponse> => {
      const query = (request.query.q ?? '').trim().slice(0, 80);
      const limit = Math.min(Math.max(Number(request.query.limit) || 30, 1), 60);
      reply.header('Cache-Control', 'public, max-age=60, s-maxage=600');
      if (query.length < 2) return { query, cards: [] };
      // Sonderzeichen von LIKE entschärfen. Der Trigramm-Index trägt die Suche.
      const pattern = `%${query.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
      const result = await db.query<CardRow & { set_name: string }>(
        `select ${CARD_COLUMNS}, s.name as set_name
         from cards c join sets s on s.id = c.set_id
         where lower(c.name) like $1
         order by (lower(c.name) = $2) desc, length(c.name), s.release_date desc nulls last, c.id
         limit $3`,
        [pattern, query.toLowerCase(), limit],
      );
      return { query, cards: result.rows.map((row) => ({ ...toCard(row), setName: row.set_name })) };
    },
  );
}
