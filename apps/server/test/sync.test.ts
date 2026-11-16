import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { PokemonPriceTrackerSource } from '../src/sources/pokemon-price-tracker.js';
import { exportPrintingRows } from '../src/sources/ppt-export.js';
import type { PriceSource, SourceCard, SourceSet } from '../src/sources/price-source.js';
import { SourceError } from '../src/sources/price-source.js';
import { runApiSync, runExportSync } from '../src/sync/sync.js';
import { resetData, testDb } from './helpers.js';

const db = testDb();
beforeEach(() => resetData(db));
afterAll(() => db.end());

const sets: SourceSet[] = [
  { id: 'klein', name: 'Kleines Set', series: 'Serie', language: 'english', releaseDate: '2024-02-01', cardCount: 3, imageUrl: null },
  { id: 'gross', name: 'Großes Set', series: 'Serie', language: 'english', releaseDate: '1999-06-01', cardCount: 500, imageUrl: null },
];

const cardsOf = (set: SourceSet, n: number, price = 1): SourceCard[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${set.id}-${i + 1}`, setId: set.id, name: `Karte ${i + 1}`, number: `${i + 1}/${n}`, rarity: 'Common',
    imageUrl: null, marketPriceUsd: price + i, lowPriceUsd: null, priceUpdatedAt: null,
    printings: [{ printing: 'Normal', marketPriceUsd: price + i, lowPriceUsd: null }],
  }));

function fakeSource(price = 1) {
  const calls = { sets: 0, cards: [] as string[] };
  const source: PriceSource = {
    name: 'fake',
    async listSets() {
      calls.sets += 1;
      return { sets, credits: { consumed: 1, dailyRemaining: 99 } };
    },
    async listCardsInSet(set) {
      calls.cards.push(set.id);
      const cards = cardsOf(set, set.cardCount ?? 0, price);
      return { cards, skipped: 0, credits: { consumed: cards.length, dailyRemaining: 99 - cards.length } };
    },
  };
  return { source, calls };
}

const options = { sets: ['Kleines Set'], language: 'english', maxCredits: 90, setsRefreshHours: 168 };

describe('Abgleich über Einzelabrufe', () => {
  it('schreibt Sets, Karten, Varianten, Preisstand und erhöht die Katalogversion', async () => {
    const { source } = fakeSource();
    const result = await runApiSync(db, source, { ...options, now: () => new Date('2026-11-16T07:00:00Z') });
    expect(result).toMatchObject({ status: 'ok', setsSynced: 1, cardsSynced: 3, creditsUsed: 4 });

    const cards = await db.query(`select id, number_sort, market_price_usd from cards order by number_sort`);
    expect(cards.rows).toEqual([
      { id: 'klein-1', number_sort: 1, market_price_usd: 1 },
      { id: 'klein-2', number_sort: 2, market_price_usd: 2 },
      { id: 'klein-3', number_sort: 3, market_price_usd: 3 },
    ]);
    const history = await db.query(`select card_id, day, market_price_usd from price_history order by card_id`);
    expect(history.rows[0]).toEqual({ card_id: 'klein-1', day: '2026-11-16', market_price_usd: 1 });
    expect(history.rowCount).toBe(3);
    expect((await db.query(`select count(*)::int n from card_printings`)).rows[0].n).toBe(3);
    const version = await db.query(`select value from meta where key = 'catalog_version'`);
    expect(version.rows[0].value).toBe(String(result.runId));
    const run = await db.query(`select status, credits_used from sync_runs where id = $1`, [result.runId]);
    expect(run.rows[0]).toEqual({ status: 'ok', credits_used: 4 });
  });

  it('lässt sich wiederholen: neue Preise ersetzen alte, der Tagesstand bleibt eine Zeile', async () => {
    const at = () => new Date('2026-11-16T07:00:00Z');
    await runApiSync(db, fakeSource(1).source, { ...options, now: at });
    const second = fakeSource(10);
    const result = await runApiSync(db, second.source, { ...options, now: at });
    expect(second.calls.sets).toBe(0); // Set-Liste ist frisch und kostet keinen Credit
    expect(result.creditsUsed).toBe(3);
    const card = await db.query(`select market_price_usd from cards where id = 'klein-1'`);
    expect(card.rows[0].market_price_usd).toBe(10);
    const history = await db.query(`select market_price_usd from price_history where card_id = 'klein-1'`);
    expect(history.rows).toEqual([{ market_price_usd: 10 }]);
  });

  it('überspringt ein Set, das das Budget sprengt, und meldet unbekannte Sets', async () => {
    const { source, calls } = fakeSource();
    const result = await runApiSync(db, source, { ...options, sets: ['Großes Set', 'Gibt es nicht', 'klein'] });
    expect(result.status).toBe('partial');
    expect(calls.cards).toEqual(['klein']);
    expect(result.notes.join(' ')).toMatch(/Großes Set.*500 Credits/);
    expect(result.notes.join(' ')).toMatch(/Gibt es nicht/);
    expect(result.cardsSynced).toBe(3);
  });

  it('hält Fehler der Quelle im Lauf fest, statt abzustürzen', async () => {
    const source: PriceSource = {
      name: 'kaputt',
      listSets: async () => { throw new SourceError('Pokemon Price Tracker antwortet mit 401', 401); },
      listCardsInSet: async () => ({ cards: [], skipped: 0, credits: { consumed: 0, dailyRemaining: null } }),
    };
    const result = await runApiSync(db, source, options);
    expect(result.status).toBe('failed');
    const run = await db.query(`select status, note from sync_runs where id = $1`, [result.runId]);
    expect(run.rows[0]).toMatchObject({ status: 'failed', note: expect.stringContaining('401') });
  });
});

describe('Abgleich aus dem Tages-Export', () => {
  it('fasst Varianten je Karte zusammen und schreibt in Stapeln', async () => {
    const header = 'tcgPlayerId,name,setName,setId,cardNumber,rarity,language,printing,marketPrice,lowPrice,sellers,lastPriceUpdate\n';
    const lines = Array.from({ length: 7 }, (_, i) =>
      [`${100 + i},Karte ${i},Export-Set,exp,${i + 1}/7,Rare,English,Normal,${i + 1},1,5,2026-11-16T06:00:00Z`,
       `${100 + i},Karte ${i},Export-Set,exp,${i + 1}/7,Rare,English,Reverse Holofoil,${(i + 1) * 2},1,5,2026-11-16T06:00:00Z`].join('\n'),
    ).join('\n');
    async function* csv() { yield header + lines + '\n'; }

    const result = await runExportSync(db, exportPrintingRows(csv()), { batchSize: 4 });
    expect(result).toMatchObject({ status: 'ok', setsSynced: 1, cardsSynced: 7 });
    const set = await db.query(`select name, card_count from sets where id = 'exp'`);
    expect(set.rows[0]).toEqual({ name: 'Export-Set', card_count: 7 });
    const card = await db.query(`select market_price_usd from cards where id = '103'`);
    expect(card.rows[0].market_price_usd).toBe(4); // Preis der ersten Variante
    const printings = await db.query(`select printing, market_price_usd from card_printings where card_id = '103' order by printing`);
    expect(printings.rows).toEqual([
      { printing: 'Normal', market_price_usd: 4 },
      { printing: 'Reverse Holofoil', market_price_usd: 8 },
    ]);
  });
});

describe('Client für Pokemon Price Tracker', () => {
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init });

  it('sendet den Schlüssel im Kopf, liest Credits und bildet die Antwort ab', async () => {
    const seen: { url: string; auth: string | null }[] = [];
    const fetchImpl = (async (url: URL, init?: RequestInit) => {
      seen.push({ url: String(url), auth: new Headers(init?.headers).get('authorization') });
      return json(
        { data: [{ tcgPlayerId: 1, name: 'A', cardNumber: '1/2', prices: { market: 2 } }, { name: 'ohne ID' }] },
        { headers: { 'x-api-calls-consumed': '2', 'x-ratelimit-daily-remaining': '98' } },
      );
    }) as unknown as typeof fetch;
    const source = new PokemonPriceTrackerSource({ apiKey: 'geheim', baseUrl: 'https://ppt.test/api/v2', fetchImpl });
    const result = await source.listCardsInSet(sets[0]!);
    expect(seen[0]!.auth).toBe('Bearer geheim');
    expect(seen[0]!.url).toBe('https://ppt.test/api/v2/cards?set=Kleines+Set&language=english&fetchAllInSet=true');
    expect(result.cards).toHaveLength(1);
    expect(result.skipped).toBe(1);
    expect(result.credits).toEqual({ consumed: 2, dailyRemaining: 98 });
  });

  it('wiederholt bei 500 und gibt bei leerem Kontingent sofort auf', async () => {
    let calls = 0;
    const flaky = (async () => (++calls < 3 ? new Response('down', { status: 500 }) : json({ data: [] }))) as unknown as typeof fetch;
    const source = new PokemonPriceTrackerSource({ apiKey: 'k', baseUrl: 'https://ppt.test', fetchImpl: flaky, sleep: async () => undefined });
    await expect(source.listSets('english')).resolves.toMatchObject({ sets: [] });
    expect(calls).toBe(3);

    let limited = 0;
    const empty = (async () => { limited += 1; return new Response('insufficient credits', { status: 429 }); }) as unknown as typeof fetch;
    const blocked = new PokemonPriceTrackerSource({ apiKey: 'k', baseUrl: 'https://ppt.test', fetchImpl: empty, sleep: async () => undefined });
    await expect(blocked.listSets('english')).rejects.toMatchObject({ status: 429 });
    expect(limited).toBe(1);
  });
});
