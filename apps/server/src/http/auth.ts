import { createHash, randomBytes } from 'node:crypto';

import type { FastifyRequest } from 'fastify';

import type { Db } from '../db/pool.js';
import { unauthorized } from './errors.js';

/**
 * Anmeldung für den Prototyp: Jedes Gerät erhält beim ersten Start ein anonymes
 * Konto mit einem zufälligen Token. Gespeichert wird nur der SHA-256 des Tokens.
 * E-Mail, Apple und Google lassen sich später an dasselbe Konto binden.
 */

export const hashToken = (token: string): Buffer => createHash('sha256').update(token).digest();

export async function createAnonymousUser(db: Db): Promise<{ userId: string; token: string }> {
  const token = randomBytes(32).toString('base64url');
  const result = await db.query<{ id: string }>(`insert into users (token_hash) values ($1) returning id`, [
    hashToken(token),
  ]);
  return { userId: result.rows[0]!.id, token };
}

export function createAuthenticator(db: Db, maxCached = 10_000) {
  // Kleiner Zwischenspeicher: spart bei jeder Anfrage eines aktiven Nutzers eine Abfrage.
  const cache = new Map<string, string>();

  return async function authenticate(request: FastifyRequest): Promise<string> {
    const header = request.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token.length < 20) throw unauthorized();

    const hash = hashToken(token);
    const key = hash.toString('base64');
    const known = cache.get(key);
    if (known) return known;

    const result = await db.query<{ id: string }>(`select id from users where token_hash = $1`, [hash]);
    const userId = result.rows[0]?.id;
    if (!userId) throw unauthorized();

    if (cache.size >= maxCached) cache.delete(cache.keys().next().value as string);
    cache.set(key, userId);
    return userId;
  };
}

export type Authenticator = ReturnType<typeof createAuthenticator>;
