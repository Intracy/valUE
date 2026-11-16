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
    expect(body.cards[0].price).toMatchObject({ currency: 'USD' });
  });

  it('liefert Kartendetail mit Varianten und Preisverlauf', async () => {
    const body = (await app.inject({ url: '/v1/cards/demo-aurora-003?days=30' })).json();
    expect(body.card).toMatchObject({ id: 'demo-aurora-003', setName: 'Demo-Set Aurora', setReleaseDate: '2026-03-14' });
    expect(body.printings.map((p: { printing: string }) => p.printing)).toEqual(['Normal', 'Reverse Holofoil']);
    expect(body.history.points).toHaveLength(6);
    expect(body.history.currency).toBe('USD');
  });

  it('sucht nach Namen und ignoriert zu kurze Anfragen', async () => {
    const hit = (await app.inject({ url: '/v1/search?q=karte%20012' })).json();
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
    expect(profile.collectionValue.currency).toBe('USD');
    expect(profile.collectionValue.amount).toBeGreaterThan(0);
  });
});
