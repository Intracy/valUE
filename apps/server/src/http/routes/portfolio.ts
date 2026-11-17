import type {
  Currency,
  FavoriteResponse,
  FavoritesResponse,
  PortfolioRange,
  PortfolioResponse,
} from '@value/api-types';
import type { FastifyInstance } from 'fastify';

import type { Db } from '../../db/pool.js';
import type { Authenticator } from '../auth.js';
import { badRequest, notFound } from '../errors.js';
import { CARD_COLUMNS, toCard } from './catalog.js';

/**
 * Portfolio (Startseite) und Beobachtungsliste. Beides gehört einem Nutzer;
 * die Cache-Kopfzeile "private, no-store" setzt schon collection.ts für /v1/me.
 */

const RANGE_DAYS: Record<PortfolioRange, number> = { '1T': 1, '1W': 7, '1M': 30, '1J': 365, Max: 3650 };
const isRange = (value: unknown): value is PortfolioRange => typeof value === 'string' && value in RANGE_DAYS;
const round2 = (value: number) => Math.round(value * 100) / 100;

export function registerPortfolioRoutes(app: FastifyInstance, db: Db, authenticate: Authenticator) {
  app.get<{ Querystring: { range?: string } }>('/v1/me/portfolio', async (request): Promise<PortfolioResponse> => {
    const userId = await authenticate(request);
    const range: PortfolioRange = isRange(request.query.range) ? request.query.range : '1M';
    if (request.query.range !== undefined && !isRange(request.query.range)) {
      throw badRequest('range muss 1T, 1W, 1M, 1J oder Max sein.');
    }
    const days = RANGE_DAYS[range];

    // Bestand je Karte (über alle Varianten) mit heutigem Preis.
    const owned = await db.query<{
      card_id: string;
      quantity: number;
      market_price_usd: number | null;
      market_price_eur: number | null;
    }>(
      `select ci.card_id, sum(ci.quantity)::int as quantity, c.market_price_usd, c.market_price_eur
       from collection_items ci join cards c on c.id = ci.card_id
       where ci.user_id = $1
       group by ci.card_id, c.market_price_usd, c.market_price_eur`,
      [userId],
    );

    if (owned.rows.length === 0) {
      return { range, value: null, change: null, points: [], uniqueCards: 0, totalCards: 0, topCards: [] };
    }

    // Wie im Profil: Euro, sobald es Euro-Preise gibt, sonst Dollar.
    const currency: Currency = owned.rows.some((row) => row.market_price_eur !== null) ? 'EUR' : 'USD';
    const priceOf = (row: { market_price_usd: number | null; market_price_eur: number | null }) =>
      (currency === 'EUR' ? row.market_price_eur : row.market_price_usd) ?? 0;
    const value = round2(owned.rows.reduce((sum, row) => sum + row.quantity * priceOf(row), 0));
    const totalCards = owned.rows.reduce((sum, row) => sum + row.quantity, 0);

    // Verlauf: der heutige Bestand zu den Preisen jedes Tages im Zeitraum. Wie bei
    // Börsen-Apps zeigt das, wie sich der Wert der jetzigen Sammlung entwickelt hat.
    const column = currency === 'EUR' ? 'market_price_eur' : 'market_price_usd';
    // LATERAL zwingt je Karte einen Griff in den Index (card_id, day). Ein Hash-Join
    // läse sonst die ganze Preistabelle. Lange Zeiträume nur jeden 7. bzw. 30. Tag:
    // Mehr Punkte zeigt das Diagramm ohnehin nicht.
    const step = days > 400 ? 30 : days > 90 ? 7 : 1;
    const history = await db.query<{ day: string; amount: number }>(
      `select ph.day, sum(o.quantity * ph.price)::numeric(14, 2) as amount
       from unnest($1::text[], $2::int[]) as o (card_id, quantity)
       cross join lateral (
         select h.day, h.${column} as price
         from price_history h
         where h.card_id = o.card_id
           and h.day >= current_date - $3::int
           and (current_date - h.day) % $4::int = 0
           and h.${column} is not null
       ) ph
       group by ph.day
       order by ph.day`,
      [owned.rows.map((row) => row.card_id), owned.rows.map((row) => row.quantity), days, step],
    );
    const points = history.rows.map((row) => ({ day: row.day, amount: row.amount }));
    // Der heutige Punkt ist der aktuelle Wert, auch wenn der Tagesstand noch fehlt.
    const today = new Date().toISOString().slice(0, 10);
    if (points.at(-1)?.day !== today) points.push({ day: today, amount: value });
    else points[points.length - 1]!.amount = value;

    const first = points.length > 1 ? points[0]!.amount : null;
    const change =
      first === null
        ? null
        : { amount: round2(value - first), percent: first > 0 ? Math.round(((value - first) / first) * 1000) / 10 : null };

    const top = await db.query<
      Parameters<typeof toCard>[0] & { set_name: string; quantity: number }
    >(
      `select ${CARD_COLUMNS}, s.name as set_name, o.quantity
       from unnest($1::text[], $2::int[]) as o (card_id, quantity)
       join cards c on c.id = o.card_id
       join sets s on s.id = c.set_id
       order by o.quantity * coalesce(c.${column}, 0) desc, c.name
       limit 5`,
      [owned.rows.map((row) => row.card_id), owned.rows.map((row) => row.quantity)],
    );

    return {
      range,
      value: { amount: value, currency },
      change,
      points,
      uniqueCards: owned.rows.length,
      totalCards,
      topCards: top.rows.map((row) => {
        const unit = currency === 'EUR' ? row.market_price_eur : row.market_price_usd;
        return {
          ...toCard(row),
          setName: row.set_name,
          quantity: row.quantity,
          value: unit === null ? null : { amount: round2(unit * row.quantity), currency },
        };
      }),
    };
  });

  app.get('/v1/me/favorites', async (request): Promise<FavoritesResponse> => {
    const userId = await authenticate(request);
    const result = await db.query<Parameters<typeof toCard>[0] & { set_name: string; created_at: Date }>(
      `select ${CARD_COLUMNS}, s.name as set_name, f.created_at
       from favorites f
       join cards c on c.id = f.card_id
       join sets s on s.id = c.set_id
       where f.user_id = $1
       order by f.created_at desc
       limit 500`,
      [userId],
    );
    return {
      cards: result.rows.map((row) => ({
        ...toCard(row),
        setName: row.set_name,
        addedAt: row.created_at.toISOString(),
      })),
    };
  });

  // PUT und DELETE dürfen gefahrlos wiederholt werden.
  app.put<{ Params: { cardId: string } }>(
    '/v1/me/favorites/:cardId',
    async (request): Promise<FavoriteResponse> => {
      const userId = await authenticate(request);
      try {
        await db.query(
          `insert into favorites (user_id, card_id) values ($1, $2) on conflict (user_id, card_id) do nothing`,
          [userId, request.params.cardId],
        );
      } catch (error) {
        if ((error as { code?: string }).code === '23503') throw notFound('Karte nicht gefunden.');
        throw error;
      }
      return { cardId: request.params.cardId, favorite: true };
    },
  );

  app.delete<{ Params: { cardId: string } }>(
    '/v1/me/favorites/:cardId',
    async (request): Promise<FavoriteResponse> => {
      const userId = await authenticate(request);
      await db.query(`delete from favorites where user_id = $1 and card_id = $2`, [userId, request.params.cardId]);
      return { cardId: request.params.cardId, favorite: false };
    },
  );
}
