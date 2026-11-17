import { readFileSync } from 'node:fs';

import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import type { PriceSource, SourceCard } from '../src/sources/price-source.js';
import { createTcgdexClient, fingerprintImageUrl, mapVariants } from '../src/sources/tcgdex.js';
import { removeDemoCatalog, runCatalogSync } from '../src/sync/catalog.js';
import { runApiSync } from '../src/sync/sync.js';
import { resetData, testDb } from './helpers.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/tcgdex.json', import.meta.url), 'utf8')) as {
  sets: Record<string, unknown>;
  set: Record<string, unknown>;
  card: Record<string, unknown>;
};

/** TCGdex aus den Beispieldaten. Zählt die Abrufe; unbekannte Pfade antworten 404. */
function fakeTcgdex() {
  const calls: string[] = [];
  const fetchFake = (async (input: string | URL | Request) => {
    const path = String(input).replace('https://api.tcgdex.net/v2/', '');
    calls.push(path);
    const [language, kind, ...rest] = path.split('/');
    const key = `${language}/${decodeURIComponent(rest.join('/'))}`;
    const body =
      kind === 'sets' && rest.length === 0
        ? fixture.sets[language!]
        : kind === 'sets'
          ? fixture.set[key]
          : fixture.card[key];
    return body === undefined
      ? new Response('not found', { status: 404 })
      : new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  return { client: createTcgdexClient({ fetch: fetchFake, retries: 0 }), calls };
}

const db = testDb();
beforeEach(() => resetData(db));
afterAll(() => db.end());

describe('Katalog von TCGdex', () => {
  it('lädt Sets und Karten in drei Sprachen mit Nummer, Bild, Varianten und Element', async () => {
    const { client } = fakeTcgdex();
    const result = await runCatalogSync(db, client);
    expect(result).toMatchObject({ setsSynced: 5, cardsSynced: 8 });

    const sets = await db.query(`select id, name, language, card_count, image_url from sets order by id`);
    expect(sets.rows).toContainEqual({
      id: 'de-swsh3', name: 'Flammende Finsternis', language: 'german', card_count: 189,
      image_url: 'https://assets.tcgdex.net/de/swsh/swsh3/logo.png',
    });
    expect(sets.rows).toContainEqual(expect.objectContaining({ id: 'ja-SV1S', language: 'japanese', card_count: 78 }));

    const card = await db.query(`select * from cards where id = 'en-base1-4'`);
    expect(card.rows[0]).toMatchObject({
      set_id: 'en-base1', name: 'Charizard', number: '4/102', number_sort: 4, rarity: 'Rare', element: 'fire',
      image_url: 'https://assets.tcgdex.net/en/base/base1/4/high.webp', market_price_usd: null,
    });
    const printings = await db.query(`select printing from card_printings where card_id = 'en-base1-4' order by printing`);
    expect(printings.rows.map((row) => row.printing)).toEqual(['1st Edition Holofoil', 'Holofoil']);

    const japanese = await db.query(`select name, number, number_sort from cards where id = 'ja-SV1S-001'`);
    expect(japanese.rows[0]).toEqual({ name: 'サボネア', number: '001/78', number_sort: 1 });
  });

  it('gibt deutschen Karten Bild, Rarität und Element der englischen Fassung', async () => {
    const { client } = fakeTcgdex();
    await runCatalogSync(db, client);
    const glurak = await db.query(`select name, rarity, element, image_url from cards where id = 'de-base1-4'`);
    expect(glurak.rows[0]).toEqual({
      name: 'Glurak', rarity: 'Rare', element: 'fire', image_url: 'https://assets.tcgdex.net/en/base/base1/4/high.webp',
    });
    // Eigenes deutsches Bild bleibt.
    const wiesenior = await db.query(`select image_url, rarity from cards where id = 'de-swsh3-136'`);
    expect(wiesenior.rows[0]).toEqual({ image_url: 'https://assets.tcgdex.net/de/swsh/swsh3/136/high.webp', rarity: 'Uncommon' });
  });

  it('nimmt die Kurzdaten, wenn die Details einer Karte fehlen', async () => {
    const { client } = fakeTcgdex();
    const result = await runCatalogSync(db, client);
    expect(result.status).toBe('partial');
    const card = await db.query(`select name, number, image_url from cards where id = 'ja-SV1S-002'`);
    expect(card.rows[0]).toEqual({ name: 'ノクタス', number: '002/78', image_url: 'https://assets.tcgdex.net/ja/SV/SV1S/002/high.webp' });
  });

  it('lädt vollständige Sets beim nächsten Lauf nicht erneut', async () => {
    const first = fakeTcgdex();
    await runCatalogSync(db, first.client);
    const second = fakeTcgdex();
    const result = await runCatalogSync(db, second.client);
    expect(result.cardsSynced).toBe(0);
    expect(second.calls).toEqual(['en/sets', 'de/sets', 'ja/sets']);
  });

  it('entfernt Demo-Sets samt Karten', async () => {
    await db.query(`insert into sets (id, name) values ('demo-aurora', 'Demo-Set Aurora')`);
    await db.query(`insert into cards (id, set_id, name) values ('demo-aurora-001', 'demo-aurora', 'Abendrot')`);
    expect(await removeDemoCatalog(db)).toBe(1);
    expect((await db.query(`select count(*)::int as n from cards`)).rows[0].n).toBe(0);
  });

  it('rechnet Fingerabdrücke mit der kleinen Bildfassung', () => {
    expect(fingerprintImageUrl('https://assets.tcgdex.net/en/base/base1/4/high.webp')).toBe(
      'https://assets.tcgdex.net/en/base/base1/4/low.webp',
    );
    expect(fingerprintImageUrl('https://example.com/karte.png')).toBe('https://example.com/karte.png');
    expect(mapVariants({ normal: true, reverse: true })).toEqual(['Normal', 'Reverse Holofoil']);
  });
});

describe('Preise von Pokemon Price Tracker auf TCGdex-Karten', () => {
  const pptCard = (externalId: string | null, price: number): SourceCard => ({
    id: `ppt-${externalId}`, setId: 'ppt-base', name: 'Charizard', number: '004/102', rarity: 'Holo Rare', imageUrl: null,
    marketPriceUsd: price, lowPriceUsd: price - 1, priceUpdatedAt: '2026-11-17T12:00:00.000Z',
    printings: [{ printing: 'Holofoil', marketPriceUsd: price, lowPriceUsd: null }], externalId,
  });
  const source: PriceSource = {
    name: 'ppt-fake',
    async listSets() {
      return {
        sets: [{ id: 'ppt-base', name: 'Base Set', series: null, language: 'english', releaseDate: null, cardCount: 3, imageUrl: null }],
        credits: { consumed: 1, dailyRemaining: 99 },
      };
    },
    async listCardsInSet() {
      return {
        cards: [pptCard('base1-4', 1001.05), pptCard('base1-999', 5), pptCard(null, 7)],
        skipped: 0,
        credits: { consumed: 3, dailyRemaining: 95 },
      };
    },
  };

  it('ordnet Preise über die TCGdex-ID der englischen und deutschen Karte zu und legt keine Karten an', async () => {
    await runCatalogSync(db, fakeTcgdex().client);
    const before = (await db.query(`select count(*)::int as n from cards`)).rows[0].n;
    const result = await runApiSync(db, source, {
      target: 'prices', sets: ['Base Set'], language: 'english', maxCredits: 90, setsRefreshHours: 168,
      now: () => new Date('2026-11-17T13:00:00Z'),
    });
    expect(result).toMatchObject({ status: 'ok', setsSynced: 1, cardsSynced: 2 });
    expect((await db.query(`select count(*)::int as n from cards`)).rows[0].n).toBe(before);
    expect((await db.query(`select count(*)::int as n from sets where id = 'ppt-base'`)).rows[0].n).toBe(0);

    const priced = await db.query(
      `select id, market_price_usd from cards where market_price_usd is not null order by id`,
    );
    expect(priced.rows).toEqual([
      { id: 'de-base1-4', market_price_usd: 1001.05 },
      { id: 'en-base1-4', market_price_usd: 1001.05 },
    ]);
    const holo = await db.query(
      `select market_price_usd from card_printings where card_id = 'de-base1-4' and printing = 'Holofoil'`,
    );
    expect(holo.rows[0].market_price_usd).toBe(1001.05);
    const history = await db.query(`select card_id from price_history order by card_id`);
    expect(history.rows.map((row) => row.card_id)).toEqual(['de-base1-4', 'en-base1-4']);

    // Ein späterer Katalogabgleich lässt die Preise stehen.
    await db.query(`update sets set updated_at = now() - interval '60 days'`);
    await runCatalogSync(db, fakeTcgdex().client);
    const after = await db.query(`select market_price_usd from cards where id = 'en-base1-4'`);
    expect(after.rows[0].market_price_usd).toBe(1001.05);
    const holoAfter = await db.query(
      `select market_price_usd from card_printings where card_id = 'en-base1-4' and printing = 'Holofoil'`,
    );
    expect(holoAfter.rows[0].market_price_usd).toBe(1001.05);
  });
});
