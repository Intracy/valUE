import type {
  AnonymousAuthResponse,
  CollectionItem,
  CollectionProgressResponse,
  CollectionSetResponse,
  CollectionSource,
  DeleteCollectionItemResponse,
  ProfileResponse,
  PutCollectionItemRequest,
  PutCollectionItemResponse,
  UpdateProfileRequest,
} from '@value/api-types';
import type { FastifyInstance } from 'fastify';

import type { Db } from '../../db/pool.js';
import { evaluateAchievements, rankForLevel } from '../../domain/achievements.js';
import { isElement } from '../../domain/elements.js';
import { cardXp, RARITY_TIERS, rarityTier, scoreTrack, VINTAGE_BEFORE, type RarityTier } from '../../domain/xp.js';
import { createAnonymousUser, type Authenticator } from '../auth.js';
import { badRequest, notFound } from '../errors.js';
import { toPrice } from './catalog.js';

/**
 * Sammlung und Profil. Diese Antworten gehören einem Nutzer und werden nie
 * zwischengespeichert. Jede Abfrage beginnt mit user_id und trifft damit genau
 * einen Teil der Tabelle collection_items.
 */
export function registerCollectionRoutes(app: FastifyInstance, db: Db, authenticate: Authenticator) {
  app.addHook('onSend', async (request, reply) => {
    if (request.url.startsWith('/v1/me') || request.url.startsWith('/v1/auth')) {
      reply.header('Cache-Control', 'private, no-store');
    }
  });

  app.post('/v1/auth/anonymous', async (_request, reply): Promise<AnonymousAuthResponse> => {
    reply.code(201);
    return createAnonymousUser(db);
  });

  app.get('/v1/me/collection/sets', async (request): Promise<CollectionProgressResponse> => {
    const userId = await authenticate(request);
    const result = await db.query<{ set_id: string; owned_cards: number; card_count: number }>(
      `select c.set_id, count(distinct ci.card_id)::int as owned_cards, s.card_count
       from collection_items ci
       join cards c on c.id = ci.card_id
       join sets s on s.id = c.set_id
       where ci.user_id = $1
       group by c.set_id, s.card_count`,
      [userId],
    );
    return {
      sets: result.rows.map((row) => ({
        setId: row.set_id,
        ownedCards: row.owned_cards,
        cardCount: row.card_count,
      })),
    };
  });

  app.get<{ Params: { setId: string } }>(
    '/v1/me/collection/sets/:setId',
    async (request): Promise<CollectionSetResponse> => {
      const userId = await authenticate(request);
      const result = await db.query<{ card_id: string; printing: string; quantity: number; source: CollectionSource }>(
        `select ci.card_id, ci.printing, ci.quantity, ci.source
         from collection_items ci
         join cards c on c.id = ci.card_id
         where ci.user_id = $1 and c.set_id = $2`,
        [userId, request.params.setId],
      );
      return {
        setId: request.params.setId,
        items: result.rows.map((row) => ({
          cardId: row.card_id,
          printing: row.printing,
          quantity: row.quantity,
          source: row.source,
        })),
      };
    },
  );

  // PUT setzt den Bestand einer Karte auf einen festen Wert. Die Anfrage darf
  // gefahrlos wiederholt werden, etwa nach einem Funkloch. Menge 0 entfernt die Karte.
  app.put<{ Params: { cardId: string }; Body: PutCollectionItemRequest }>(
    '/v1/me/collection/items/:cardId',
    async (request): Promise<PutCollectionItemResponse> => {
      const userId = await authenticate(request);
      const body = request.body ?? ({} as PutCollectionItemRequest);
      const quantity = Number(body.quantity);
      const printing = typeof body.printing === 'string' ? body.printing.slice(0, 80) : '';
      const source: CollectionSource = body.source === 'scan' ? 'scan' : 'manual';
      if (!Number.isInteger(quantity) || quantity < 0 || quantity > 9_999) {
        throw badRequest('quantity muss eine ganze Zahl von 0 bis 9999 sein.');
      }

      if (quantity === 0) {
        await db.query(`delete from collection_items where user_id = $1 and card_id = $2 and printing = $3`, [
          userId,
          request.params.cardId,
          printing,
        ]);
        return { item: null };
      }

      try {
        const result = await db.query<{ card_id: string; printing: string; quantity: number; source: CollectionSource }>(
          `insert into collection_items (user_id, card_id, printing, quantity, source)
           values ($1, $2, $3, $4, $5)
           on conflict (user_id, card_id, printing) do update set
             quantity = excluded.quantity,
             -- Ein Scan bleibt ein Scan, auch wenn die Menge später von Hand geändert wird.
             source = case when collection_items.source = 'scan' then 'scan' else excluded.source end
           returning card_id, printing, quantity, source`,
          [userId, request.params.cardId, printing, quantity, source],
        );
        const row = result.rows[0]!;
        const item: CollectionItem = {
          cardId: row.card_id,
          printing: row.printing,
          quantity: row.quantity,
          source: row.source,
        };
        return { item };
      } catch (error) {
        // 23503 = Fremdschlüssel verletzt: Die Karte gibt es nicht im Katalog.
        if ((error as { code?: string }).code === '23503') throw notFound('Karte nicht gefunden.');
        throw error;
      }
    },
  );

  // Entfernt eine Karte mit allen Varianten, etwa beim Austragen im Set-Raster.
  app.delete<{ Params: { cardId: string } }>(
    '/v1/me/collection/items/:cardId',
    async (request): Promise<DeleteCollectionItemResponse> => {
      const userId = await authenticate(request);
      const result = await db.query(`delete from collection_items where user_id = $1 and card_id = $2`, [
        userId,
        request.params.cardId,
      ]);
      return { removed: result.rowCount ?? 0 };
    },
  );

  app.get('/v1/me/profile', async (request): Promise<ProfileResponse> => {
    const userId = await authenticate(request);
    // Eine einzige Abfrage über die Karten des Nutzers. Zusammengezählt wird im
    // Server: Das spart gegenüber drei getrennten Auswertungen zwei Tabellendurchläufe.
    const owned = await db.query<{
      card_id: string;
      printing: string;
      quantity: number;
      rarity: string | null;
      set_id: string;
      card_count: number;
      vintage: boolean;
      market_price_usd: number | null;
      market_price_eur: number | null;
      element: string | null;
      source: CollectionSource;
    }>(
      `select ci.card_id, ci.printing, ci.quantity, ci.source, c.rarity, c.set_id, c.element, s.card_count,
              coalesce(s.release_date < $2::date, false) as vintage,
              c.market_price_usd, c.market_price_eur
       from collection_items ci
       join cards c on c.id = ci.card_id
       join sets s on s.id = c.set_id
       where ci.user_id = $1`,
      [userId, VINTAGE_BEFORE],
    );
    const user = await db.query<{ display_name: string | null }>(`select display_name from users where id = $1`, [
      userId,
    ]);

    // Varianten zählen nach Namen. Ein Eintrag ohne Variante ('') zählt nicht als eigene Variante.
    const cards = new Map<
      string,
      { rarity: string | null; vintage: boolean; printings: Set<string>; element: string | null; scanned: boolean }
    >();
    const sets = new Map<string, { cardCount: number; cards: Set<string> }>();
    let totalCards = 0;
    let valueUsd = 0;
    let valueEur = 0;
    let pricedEur = 0;
    for (const row of owned.rows) {
      const card = cards.get(row.card_id) ?? {
        rarity: row.rarity,
        vintage: row.vintage,
        printings: new Set<string>(),
        element: row.element,
        scanned: false,
      };
      if (row.printing) card.printings.add(row.printing);
      if (row.source === 'scan') card.scanned = true;
      cards.set(row.card_id, card);

      const set = sets.get(row.set_id) ?? { cardCount: row.card_count, cards: new Set<string>() };
      set.cards.add(row.card_id);
      sets.set(row.set_id, set);

      totalCards += row.quantity;
      valueUsd += row.quantity * (row.market_price_usd ?? 0);
      if (row.market_price_eur !== null) {
        valueEur += row.quantity * row.market_price_eur;
        pricedEur += 1;
      }
    }

    let xp = 0;
    let vintageXp = 0;
    let maxVariants = 0;
    let vintageCards = 0;
    let scannedCards = 0;
    const byTier = new Map<RarityTier, number>();
    const byElement: Record<string, number> = {};
    for (const card of cards.values()) {
      const variants = Math.max(1, card.printings.size);
      const points = cardXp(card.rarity, variants);
      xp += points;
      if (card.vintage) {
        vintageXp += points;
        vintageCards += 1;
      }
      if (card.scanned) scannedCards += 1;
      maxVariants = Math.max(maxVariants, variants);
      const tier = rarityTier(card.rarity);
      byTier.set(tier, (byTier.get(tier) ?? 0) + 1);
      if (isElement(card.element)) byElement[card.element] = (byElement[card.element] ?? 0) + 1;
    }
    let completedSets = 0;
    for (const set of sets.values()) {
      if (set.cardCount > 0 && set.cards.size >= set.cardCount) completedSets += 1;
    }
    const score = scoreTrack(xp);

    return {
      userId,
      displayName: user.rows[0]?.display_name ?? null,
      rank: rankForLevel(score.level),
      uniqueCards: cards.size,
      totalCards,
      // Euro nur, wenn es Euro-Preise gibt. Sonst der Dollar-Wert.
      collectionValue:
        cards.size === 0
          ? null
          : pricedEur > 0
            ? toPrice(null, round2(valueEur))
            : toPrice(round2(valueUsd), null),
      score,
      vintageScore: scoreTrack(vintageXp),
      completedSets,
      achievements: evaluateAchievements({
        uniqueCards: cards.size,
        completedSets,
        maxVariants: cards.size === 0 ? 0 : maxVariants,
        secretCards: byTier.get('secret') ?? 0,
        vintageCards,
        scannedCards,
        byElement,
      }),
      rarityDistribution: RARITY_TIERS.map((tier) => ({ tier, cards: byTier.get(tier) ?? 0 })),
    };
  });

  app.patch<{ Body: UpdateProfileRequest }>('/v1/me/profile', async (request) => {
    const userId = await authenticate(request);
    const raw = request.body?.displayName;
    if (raw !== null && raw !== undefined && typeof raw !== 'string') {
      throw badRequest('displayName muss Text oder null sein.');
    }
    // Steuerzeichen raus, Leerraum zusammenziehen.
    const name = (raw ?? '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
    if (name.length > 40) throw badRequest('Der Name darf höchstens 40 Zeichen haben.');
    await db.query(`update users set display_name = $2 where id = $1`, [userId, name || null]);
    return { displayName: name || null };
  });
}

const round2 = (value: number) => Math.round(value * 100) / 100;
