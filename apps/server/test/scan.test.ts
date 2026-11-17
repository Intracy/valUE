import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { seedDemo } from '../src/db/seed-demo.js';
import { buildApp } from '../src/http/app.js';
import { computeMissingFingerprints } from '../src/scan/fingerprint-job.js';
import { decide, scoreCandidate, SCORING } from '../src/scan/identify.js';
import { createOcrPool } from '../src/scan/ocr.js';
import { japaneseSimilarity, parseCardName, parseCardNumber, parseJapaneseName } from '../src/scan/ocr.js';
import { resetData, testDb } from './helpers.js';
import { syntheticPhoto } from './support/synthetic-photo.js';

describe('Lesen von Name und Nummer', () => {
  it('findet Kartennummern trotz typischer Lesefehler', () => {
    expect(parseCardNumber('9/24')).toEqual({ number: 9, total: 24 });
    expect(parseCardNumber(' 123 / 198\n')).toEqual({ number: 123, total: 198 });
    expect(parseCardNumber('OO9/l65')).toEqual({ number: 9, total: 165 });
    expect(parseCardNumber('kein Treffer')).toBeNull();
    expect(parseCardNumber('0/12')).toBeNull();
  });

  it('kürzt Störziffern vor der Nummer und verbindet keine Zeilen', () => {
    expect(parseCardNumber('994/102')).toEqual({ number: 94, total: 102 });
    expect(parseCardNumber('201/189')).toEqual({ number: 201, total: 189 });
    expect(parseCardNumber('    1\n/102\n')).toBeNull();
  });

  it('nimmt alle Zeilen mit Buchstaben als Suchtext und schneidet Zahlen am Zeilenende ab', () => {
    expect(parseCardName(':   Kupferbach   :\n')).toBe('Kupferbach');
    expect(parseCardName('Abendrot 120\n')).toBe('Abendrot');
    expect(parseCardName('|| 7\n')).toBeNull();
    // Echte Lesung einer deutschen Karte: Der Name steht nicht in der längsten Zeile.
    expect(parseCardName('J LE ob fv SEN a REA CEA TAA flan LHR\nay Wiesenior -\n')).toBe(
      'J LE ob fv SEN a REA CEA TAA flan LHR ay Wiesenior -',
    );
  });

  it('liest japanische Namen und vergleicht sie ohne Dakuten', () => {
    // Echte Lesung der Karte サボネア (SV1S 001): ボ als ポ gelesen, eine Zeile Störzeichen.
    const read = parseJapaneseName('洋をサポネア                      。 w60⑳\n|  語る時問本ヘーージジー |\n');
    expect(read).toBe('洋をサポネア語る時問本ヘーージジー');
    expect(japaneseSimilarity(read!, 'サボネア')).toBe(1);
    expect(japaneseSimilarity(read!, 'ノクタス')).toBe(0);
  });
});

describe('Bewertung der Kandidaten', () => {
  const facts = (cardId: string, visual: number, name: number, numberSort: number | null, total: number | null) => ({
    cardId, visualSimilarity: visual, nameSimilarity: name, numberSort, total,
  });

  it('gibt der Nummer nur mit passender Set-Größe den vollen Wert', () => {
    const read = { number: { number: 9, total: 24 }, hasName: false };
    expect(scoreCandidate(facts('a', 0, 0, 9, 24), read).number).toBe(1);
    expect(scoreCandidate(facts('b', 0, 0, 9, 18), read).number).toBe(0.5);
    expect(scoreCandidate(facts('c', 0, 0, 8, 24), read).number).toBe(0);
  });

  it('ist eindeutig nur mit hohem Wert und Abstand zum Zweiten', () => {
    const clear = decide([
      { cardId: 'a', score: 0.9, visual: 1, name: 1, number: 1 },
      { cardId: 'b', score: 0.5, visual: 0, name: 1, number: 0 },
    ]);
    expect(clear.outcome).toBe('match');
    expect(clear.candidates[0]!.cardId).toBe('a');

    const close = decide([
      { cardId: 'a', score: 0.8, visual: 1, name: 1, number: 0 },
      { cardId: 'b', score: 0.75, visual: 1, name: 1, number: 0 },
    ]);
    expect(close.outcome).toBe('unsure');
    expect(close.candidates.map((c) => c.cardId)).toEqual(['a', 'b']);

    expect(decide([{ cardId: 'a', score: SCORING.minScore - 0.01, visual: 0, name: 0, number: 0 }]).outcome).toBe('none');
    expect(decide([]).outcome).toBe('none');
  });
});

describe('Scanner über die API', () => {
  const db = testDb();
  const ocr = createOcrPool(1);
  let app: FastifyInstance;

  beforeAll(async () => {
    await resetData(db);
    await db.query('truncate card_fingerprints, scans');
    await seedDemo(db, 1);
    await computeMissingFingerprints(db);
    app = await buildApp({ db, scan: { ocr } });
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await ocr.close();
    await db.end();
  });

  const signUp = async () => {
    const { token } = (await app.inject({ method: 'POST', url: '/v1/auth/anonymous' })).json();
    return { authorization: `Bearer ${token}` };
  };

  const scan = async (headers: Record<string, string>, image: Buffer) =>
    app.inject({ method: 'POST', url: '/v1/me/scans', headers, payload: { image: image.toString('base64') } });

  it('hat für jede Demo-Karte einen Fingerabdruck', async () => {
    const result = await db.query(`select count(*)::int as n from card_fingerprints`);
    expect(result.rows[0].n).toBe(54);
  });

  it('erkennt simulierte Fotos und schlägt die richtige Karte vor', async () => {
    const headers = await signUp();
    const ids = ['demo-aurora-009', 'demo-basalt-004', 'demo-klassik-007', 'demo-aurora-012', 'demo-basalt-012', 'demo-klassik-012'];
    let first = 0;
    for (const [index, id] of ids.entries()) {
      const { rows } = await db.query(`select image_url from cards where id = $1`, [id]);
      const response = await scan(headers, await syntheticPhoto(rows[0].image_url, { seed: 100 + index, difficulty: 0.5 }));
      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.scanId).toMatch(/^[0-9a-f-]{36}$/);
      expect(['match', 'unsure']).toContain(body.outcome);
      if (body.candidates[0].id === id) first += 1;
      // Eine "eindeutige" Erkennung muss stimmen.
      if (body.outcome === 'match') expect(body.candidates[0].id).toBe(id);
      expect(body.candidates[0]).toHaveProperty('setName');
      expect(Array.isArray(body.candidates[0].printings)).toBe(true);
    }
    // Drei Karten mit gleichem Namen in drei Sets: Nummer und Bild müssen sie trennen.
    expect(first).toBeGreaterThanOrEqual(5);
  }, 120_000);

  it('übernimmt die Karte erst nach Bestätigung, genau einmal je Scan', async () => {
    const headers = await signUp();
    const { rows } = await db.query(`select image_url from cards where id = 'demo-aurora-003'`);
    const body = (await scan(headers, await syntheticPhoto(rows[0].image_url, { seed: 7, difficulty: 0.3 }))).json();

    // Ohne Bestätigung ist nichts in der Sammlung.
    expect((await app.inject({ url: '/v1/me/collection/sets', headers })).json().sets).toEqual([]);

    const confirm = (payload: object, as = headers) =>
      app.inject({ method: 'POST', url: `/v1/me/scans/${body.scanId}/confirm`, headers: as, payload });

    const ok = await confirm({ cardId: 'demo-aurora-003', printing: 'Reverse Holofoil' });
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({
      cardName: 'Eisgipfel',
      totalQuantity: 1,
      item: { cardId: 'demo-aurora-003', printing: 'Reverse Holofoil', quantity: 1, source: 'scan' },
    });
    expect((await confirm({ cardId: 'demo-aurora-003' })).statusCode).toBe(409);
    expect((await confirm({ cardId: 'demo-aurora-003' }, await signUp())).statusCode).toBe(404);

    const saved = await db.query(`select chosen_card_id, chosen_rank from scans where id = $1`, [body.scanId]);
    expect(saved.rows[0].chosen_card_id).toBe('demo-aurora-003');

    // Zweiter Scan derselben Karte erhöht den Bestand.
    const again = (await scan(headers, await syntheticPhoto(rows[0].image_url, { seed: 8, difficulty: 0.3 }))).json();
    const second = await app.inject({
      method: 'POST', url: `/v1/me/scans/${again.scanId}/confirm`, headers, payload: { cardId: 'demo-aurora-003', printing: 'Reverse Holofoil' },
    });
    expect(second.json()).toMatchObject({ totalQuantity: 2, item: { quantity: 2 } });
  }, 60_000);

  it('lehnt Unsinn statt eines Fotos ab', async () => {
    const headers = await signUp();
    expect((await scan(headers, Buffer.alloc(10))).statusCode).toBe(400);
    expect((await scan(headers, Buffer.alloc(5_000, 7))).statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/v1/me/scans', payload: { image: 'x' } })).statusCode).toBe(401);
  });

  it('entfernt eine Karte mit allen Varianten und zählt "ohne Variante" nicht doppelt', async () => {
    const headers = await signUp();
    const put = (printing: string) =>
      app.inject({ method: 'PUT', url: '/v1/me/collection/items/demo-aurora-006', headers, payload: { quantity: 1, printing } });
    await put('');
    await put('Normal');
    const profile = (await app.inject({ url: '/v1/me/profile', headers })).json();
    expect(profile.score.xp).toBe(20); // eine Rare, eine Variante
    await put('Reverse Holofoil');
    expect((await app.inject({ url: '/v1/me/profile', headers })).json().score.xp).toBe(30);

    const removed = await app.inject({ method: 'DELETE', url: '/v1/me/collection/items/demo-aurora-006', headers });
    expect(removed.json()).toEqual({ removed: 3 });
    expect((await app.inject({ url: '/v1/me/profile', headers })).json().uniqueCards).toBe(0);
  });
});
