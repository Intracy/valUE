import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { seedDemo } from '../src/db/seed-demo.js';
import { buildApp } from '../src/http/app.js';
import { resetData, testDb } from './helpers.js';

const db = testDb();
let app: FastifyInstance;

beforeAll(async () => {
  await resetData(db);
  await seedDemo(db, 5);
  app = await buildApp({ db });
});
afterAll(async () => {
  await app.close();
  await db.end();
});

const signUp = async () => {
  const response = await app.inject({ method: 'POST', url: '/v1/auth/anonymous' });
  expect(response.statusCode).toBe(201);
  const { token, userId } = response.json();
  return { userId, headers: { authorization: `Bearer ${token}` } };
};

describe('Katalog', () => {
  it('listet Sets, neueste zuerst, mit Cache-Kopfzeilen', async () => {
    const response = await app.inject({ url: '/v1/sets' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toContain('s-maxage=3600');
    const body = response.json();
    expect(body.sets.map((set: { id: string }) => set.id)).toEqual(['demo-aurora', 'demo-basalt', 'demo-klassik']);
    expect(body.sets[0]).toMatchObject({ cardCount: 24, releaseDate: '2026-03-14' });
  });

  it('antwortet mit 304, wenn der Client den Stand schon hat', async () => {
    const first = await app.inject({ url: '/v1/sets/demo-aurora' });
    const etag = first.headers.etag as string;
    expect(etag).toBeTruthy();
    const second = await app.inject({ url: '/v1/sets/demo-aurora', headers: { 'if-none-match': etag } });
    expect(second.statusCode).toBe(304);
    expect(second.body).toBe('');
  });

  it('liefert ein Set mit Karten in Nummernfolge', async () => {
    const body = (await app.inject({ url: '/v1/sets/demo-aurora' })).json();
    expect(body.cards).toHaveLength(24);
    expect(body.cards.slice(0, 3).map((card: { number: string }) => card.number)).toEqual(['1/24', '2/24', '3/24']);
    expect(body.cards[9].number).toBe('10/24');
    expect(body.cards[0].price).toMatchObject({ currency: 'EUR' });
  });

  it('liefert Kartendetail mit Varianten und Preisverlauf', async () => {
    const body = (await app.inject({ url: '/v1/cards/demo-aurora-003?days=30' })).json();
    expect(body.card).toMatchObject({ id: 'demo-aurora-003', setName: 'Demo-Set Aurora', setReleaseDate: '2026-03-14' });
    expect(body.printings.map((p: { printing: string }) => p.printing)).toEqual(['Normal', 'Reverse Holofoil']);
    expect(body.history.points).toHaveLength(6);
    expect(body.history.currency).toBe('EUR');
  });

  it('sucht nach Namen und ignoriert zu kurze Anfragen', async () => {
    // Der zwölfte Name kommt in allen drei Demo-Sets vor.
    const hit = (await app.inject({ url: '/v1/search?q=sternstaub' })).json();
    expect(hit.cards.length).toBe(3);
    expect(hit.cards[0]).toHaveProperty('setName');
    expect((await app.inject({ url: '/v1/search?q=a' })).json().cards).toEqual([]);
    expect((await app.inject({ url: '/v1/search?q=100%25' })).json().cards).toEqual([]);
  });

  it('meldet unbekannte Sets, Karten und Pfade mit 404', async () => {
    expect((await app.inject({ url: '/v1/sets/gibt-es-nicht' })).statusCode).toBe(404);
    expect((await app.inject({ url: '/v1/cards/gibt-es-nicht' })).json()).toEqual({
      error: { code: 'not_found', message: 'Karte nicht gefunden.' },
    });
    expect((await app.inject({ url: '/nirgendwo' })).statusCode).toBe(404);
  });

  it('meldet Bereitschaft', async () => {
    expect((await app.inject({ url: '/readyz' })).json()).toEqual({ ok: true });
  });
});

describe('Sammlung und Profil', () => {
  it('verlangt ein gültiges Token', async () => {
    expect((await app.inject({ url: '/v1/me/profile' })).statusCode).toBe(401);
    const wrong = await app.inject({ url: '/v1/me/profile', headers: { authorization: `Bearer ${'x'.repeat(40)}` } });
    expect(wrong.statusCode).toBe(401);
  });

  it('setzt, ändert und entfernt Karten; Wiederholungen ändern nichts', async () => {
    const { headers } = await signUp();
    const put = (cardId: string, payload: object) =>
      app.inject({ method: 'PUT', url: `/v1/me/collection/items/${cardId}`, headers, payload });

    expect((await put('demo-aurora-001', { quantity: 2, source: 'scan' })).json().item).toMatchObject({ quantity: 2, source: 'scan' });
    expect((await put('demo-aurora-001', { quantity: 2 })).json().item).toMatchObject({ quantity: 2, source: 'scan' });
    await put('demo-aurora-002', { quantity: 1 });

    const set = (await app.inject({ url: '/v1/me/collection/sets/demo-aurora', headers })).json();
    expect(set.items).toHaveLength(2);
    const progress = (await app.inject({ url: '/v1/me/collection/sets', headers })).json();
    expect(progress.sets).toEqual([{ setId: 'demo-aurora', ownedCards: 2, cardCount: 24 }]);

    expect((await put('demo-aurora-002', { quantity: 0 })).json()).toEqual({ item: null });
    expect((await app.inject({ url: '/v1/me/collection/sets/demo-aurora', headers })).json().items).toHaveLength(1);

    expect((await put('gibt-es-nicht', { quantity: 1 })).statusCode).toBe(404);
    expect((await put('demo-aurora-001', { quantity: -1 })).statusCode).toBe(400);
    const privateResponse = await app.inject({ url: '/v1/me/collection/sets', headers });
    expect(privateResponse.headers['cache-control']).toBe('private, no-store');
  });

  it('trennt die Sammlungen verschiedener Nutzer', async () => {
    const a = await signUp();
    const b = await signUp();
    await app.inject({ method: 'PUT', url: '/v1/me/collection/items/demo-basalt-001', headers: a.headers, payload: { quantity: 1 } });
    expect((await app.inject({ url: '/v1/me/collection/sets', headers: b.headers })).json().sets).toEqual([]);
  });

  it('rechnet Sammelscore, Vintage-Score, Wert und volle Sets', async () => {
    const { headers } = await signUp();
    const put = (cardId: string, payload: object) =>
      app.inject({ method: 'PUT', url: `/v1/me/collection/items/${cardId}`, headers, payload });
    // demo-aurora: 001 Common (5), 006 Rare mit zwei Varianten (20 + 10), 009 Secret Rare (150)
    await put('demo-aurora-001', { quantity: 3, printing: 'Normal' });
    await put('demo-aurora-006', { quantity: 1, printing: 'Normal' });
    await put('demo-aurora-006', { quantity: 1, printing: 'Reverse Holofoil' });
    await put('demo-aurora-009', { quantity: 1, printing: 'Normal' });
    // demo-klassik erschien 1999: alle 12 Karten, zählt zusätzlich für den Vintage-Score.
    for (let n = 1; n <= 12; n += 1) await put(`demo-klassik-${String(n).padStart(3, '0')}`, { quantity: 1 });

    const profile = (await app.inject({ url: '/v1/me/profile', headers })).json();
    // Klassik: 12 Karten im Zyklus Common×3, Uncommon×2, Rare, Holo, Ultra, Secret, dann Common×3
    const klassik = 5 * 3 + 10 * 2 + 20 + 40 + 80 + 150 + 5 * 3;
    expect(profile.vintageScore.xp).toBe(klassik);
    expect(profile.score.xp).toBe(5 + 30 + 150 + klassik);
    expect(profile.score.level).toBe(3);
    expect(profile.uniqueCards).toBe(15);
    expect(profile.totalCards).toBe(18);
    expect(profile.completedSets).toBe(1);
    expect(profile.collectionValue.currency).toBe('EUR');
    expect(profile.collectionValue.amount).toBeGreaterThan(0);

    expect(profile.rank).toBe('Einsteiger');
    expect(profile.rarityDistribution.map((entry: { tier: string }) => entry.tier)).toEqual([
      'common', 'uncommon', 'rare', 'holo', 'ultra', 'secret',
    ]);
    const counted = profile.rarityDistribution.reduce((sum: number, entry: { cards: number }) => sum + entry.cards, 0);
    expect(counted).toBe(15);
    const badge = (id: string) => profile.achievements.find((entry: { id: string }) => entry.id === id);
    expect(badge('collector')).toMatchObject({ tier: 'bronze', progress: 15, nextTarget: 100 });
    expect(badge('set-master')).toMatchObject({ tier: 'bronze', progress: 1, nextTarget: 3 });
    expect(badge('variants')).toMatchObject({ tier: 'bronze', progress: 2 });
    expect(badge('secret')).toMatchObject({ tier: 'bronze', progress: 2 });
    expect(badge('vintage')).toMatchObject({ tier: 'silver', progress: 12, nextTarget: 50 });
    expect(badge('scanner')).toMatchObject({ tier: null, progress: 0, nextTarget: 1 });
    expect(badge('element-fire')).toMatchObject({ element: 'fire', tier: null });
  });

  it('speichert einen Anzeigenamen und prüft ihn', async () => {
    const { headers } = await signUp();
    const patch = (displayName: unknown) =>
      app.inject({ method: 'PATCH', url: '/v1/me/profile', headers, payload: { displayName } });
    expect((await patch('  Tobias   L. ')).json()).toEqual({ displayName: 'Tobias L.' });
    expect((await app.inject({ url: '/v1/me/profile', headers })).json().displayName).toBe('Tobias L.');
    expect((await patch('x'.repeat(41))).statusCode).toBe(400);
    expect((await patch(42)).statusCode).toBe(400);
    expect((await patch('')).json()).toEqual({ displayName: null });
  });
});

describe('Design-Erweiterungen', () => {
  it('liefert Element und Grading-Daten in der Kartenansicht', async () => {
    const body = (await app.inject({ url: '/v1/cards/demo-aurora-009' })).json();
    expect(['fire', 'water', 'grass', 'lightning', 'psychic', 'fighting', null]).toContain(body.card.element);
    // Secret Rare: Demo-Daten mit PSA und CGC, höchste Note zuerst.
    const psa = body.grades.filter((grade: { grader: string }) => grade.grader === 'PSA');
    expect(psa.map((grade: { grade: string }) => grade.grade)).toEqual(['10', '9', '8']);
    expect(psa[0].price.currency).toBe('USD');
    expect(psa[0].population).toBeGreaterThan(0);
    const cgc = body.grades.filter((grade: { grader: string }) => grade.grader === 'CGC');
    expect(cgc.map((grade: { grade: string }) => grade.grade)).toEqual(['10', '9.5', '9']);
    // Häufige Karte: keine Grading-Daten.
    expect((await app.inject({ url: '/v1/cards/demo-aurora-001' })).json().grades).toEqual([]);
  });

  it('rechnet das Portfolio mit Verlauf, Veränderung und Top-Karten', async () => {
    const { headers } = await signUp();
    const empty = (await app.inject({ url: '/v1/me/portfolio', headers })).json();
    expect(empty).toMatchObject({ range: '1M', value: null, points: [], topCards: [] });

    await app.inject({ method: 'PUT', url: '/v1/me/collection/items/demo-aurora-009', headers, payload: { quantity: 2 } });
    await app.inject({ method: 'PUT', url: '/v1/me/collection/items/demo-aurora-001', headers, payload: { quantity: 1 } });
    const body = (await app.inject({ url: '/v1/me/portfolio?range=1W', headers })).json();
    expect(body.range).toBe('1W');
    expect(body.value.currency).toBe('EUR');
    expect(body.totalCards).toBe(3);
    expect(body.uniqueCards).toBe(2);
    // seedDemo(db, 5): sechs Tage Verlauf, alle im Zeitraum einer Woche.
    expect(body.points).toHaveLength(6);
    expect(body.points.at(-1).amount).toBe(body.value.amount);
    expect(body.change.amount).toBeCloseTo(body.value.amount - body.points[0].amount, 2);
    expect(body.topCards[0]).toMatchObject({ id: 'demo-aurora-009', quantity: 2 });
    expect(body.topCards[0].value.amount).toBeGreaterThan(body.topCards[1].value.amount);

    expect((await app.inject({ url: '/v1/me/portfolio?range=5J', headers })).statusCode).toBe(400);
  });

  it('nennt Gewinner und Verlierer am Markt, öffentlich zwischengespeichert', async () => {
    const response = await app.inject({ url: '/v1/market/movers?days=3&limit=5' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['cache-control']).toContain('public');
    const body = response.json();
    expect(body.days).toBe(3);
    expect(body.gainers.length + body.losers.length).toBeGreaterThan(0);
    for (const card of body.gainers) expect(card.changePercent).toBeGreaterThan(0);
    for (const card of body.losers) expect(card.changePercent).toBeLessThan(0);
    const changes = body.gainers.map((card: { changePercent: number }) => card.changePercent);
    expect(changes).toEqual([...changes].sort((a, b) => b - a));
  });

  it('merkt sich beobachtete Karten je Nutzer', async () => {
    const one = await signUp();
    const two = await signUp();
    const put = (cardId: string) =>
      app.inject({ method: 'PUT', url: `/v1/me/favorites/${cardId}`, headers: one.headers });
    expect((await put('demo-basalt-004')).json()).toEqual({ cardId: 'demo-basalt-004', favorite: true });
    await put('demo-basalt-004');
    await put('demo-aurora-002');
    expect((await put('gibt-es-nicht')).statusCode).toBe(404);

    const list = (await app.inject({ url: '/v1/me/favorites', headers: one.headers })).json();
    expect(list.cards.map((card: { id: string }) => card.id)).toEqual(['demo-aurora-002', 'demo-basalt-004']);
    expect((await app.inject({ url: '/v1/me/favorites', headers: two.headers })).json().cards).toEqual([]);

    await app.inject({ method: 'DELETE', url: '/v1/me/favorites/demo-aurora-002', headers: one.headers });
    const after = (await app.inject({ url: '/v1/me/favorites', headers: one.headers })).json();
    expect(after.cards.map((card: { id: string }) => card.id)).toEqual(['demo-basalt-004']);
  });
});

describe('Wechselkurs Dollar → Euro', () => {
  const ecbXml = `<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01" xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref">
  <Cube><Cube time='2026-11-17'><Cube currency='USD' rate='1.0800'/><Cube currency='JPY' rate='160.10'/></Cube></Cube>
</gesmes:Envelope>`;

  it('rechnet den EZB-Kurs um, merkt ihn sich und fällt bei Ausfall auf den gespeicherten zurück', async () => {
    const { createExchangeRates } = await import('../src/fx/ecb.js');
    let calls = 0;
    let fail = false;
    let clock = 0;
    const fx = createExchangeRates(db, {
      now: () => clock,
      fetchImpl: (async () => {
        calls += 1;
        if (fail) throw new Error('offline');
        return new Response(ecbXml, { status: 200 });
      }) as typeof fetch,
    });
    const fxApp = await buildApp({ db, fx });
    try {
      const first = await fxApp.inject({ url: '/v1/fx/usd-eur' });
      expect(first.statusCode).toBe(200);
      expect(first.headers['cache-control']).toContain('max-age=3600');
      // 1 € = 1,08 $, also 1 $ = 0,925926 €
      expect(first.json()).toMatchObject({ base: 'USD', quote: 'EUR', rate: 0.925926, date: '2026-11-17', stale: false });

      await fxApp.inject({ url: '/v1/fx/usd-eur' });
      expect(calls).toBe(1); // innerhalb einer Stunde aus dem Speicher

      clock += 2 * 60 * 60 * 1000;
      fail = true;
      const fallback = (await fxApp.inject({ url: '/v1/fx/usd-eur' })).json();
      expect(fallback).toMatchObject({ rate: 0.925926, stale: true });
      expect(calls).toBe(2);
    } finally {
      await fxApp.close();
    }
  });

  it('meldet 503, wenn es weder einen Abruf noch einen gespeicherten Kurs gibt', async () => {
    await db.query(`delete from meta where key = 'fx_usd_eur'`);
    const { createExchangeRates } = await import('../src/fx/ecb.js');
    const fx = createExchangeRates(db, { fetchImpl: (async () => new Response('kaputt', { status: 500 })) as typeof fetch });
    const fxApp = await buildApp({ db, fx });
    try {
      expect((await fxApp.inject({ url: '/v1/fx/usd-eur' })).statusCode).toBe(503);
    } finally {
      await fxApp.close();
    }
  });
});
