import compress from '@fastify/compress';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { ApiError } from '@value/api-types';
import Fastify, { type FastifyInstance } from 'fastify';

import type { Db } from '../db/pool.js';
import { createAuthenticator } from './auth.js';
import { createCatalogVersion } from './catalog-version.js';
import { HttpError } from './errors.js';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerCollectionRoutes } from './routes/collection.js';

export interface AppOptions {
  db: Db;
  corsOrigins?: string[];
  rateLimitPerMinute?: number;
  trustProxy?: boolean;
  logger?: boolean;
}

/**
 * Baut den HTTP-Server. Er hält keinen Zustand außer kurzlebigen Zwischenspeichern:
 * Beliebig viele Instanzen können hinter einem Lastverteiler laufen.
 */
export async function buildApp(options: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: options.trustProxy ?? false,
    bodyLimit: 16 * 1024,
  });

  await app.register(compress, { threshold: 1024 });
  await app.register(cors, {
    origin: options.corsOrigins?.length ? options.corsOrigins : true,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    maxAge: 86_400,
  });
  if (options.rateLimitPerMinute) {
    // Zähler im Prozess. Bei mehreren Instanzen einen gemeinsamen Speicher (Redis) eintragen.
    await app.register(rateLimit, {
      max: options.rateLimitPerMinute,
      timeWindow: '1 minute',
      allowList: (request) => request.url === '/healthz' || request.url === '/readyz',
    });
  }

  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, request, reply) => {
    if (error instanceof HttpError) {
      const body: ApiError = { error: { code: error.code, message: error.message } };
      return reply.code(error.statusCode).send(body);
    }
    const status = error.statusCode && error.statusCode >= 400 && error.statusCode < 500 ? error.statusCode : 500;
    if (status === 500) request.log.error(error);
    const body: ApiError = {
      error: {
        code: status === 429 ? 'rate_limited' : status === 500 ? 'internal' : 'bad_request',
        message: status === 500 ? 'Interner Fehler.' : error.message,
      },
    };
    return reply.code(status).send(body);
  });

  app.setNotFoundHandler((_request, reply) => {
    const body: ApiError = { error: { code: 'not_found', message: 'Pfad nicht gefunden.' } };
    return reply.code(404).send(body);
  });

  // Lebt der Prozess?
  app.get('/healthz', async () => ({ ok: true }));
  // Kann er arbeiten? Der Lastverteiler nimmt die Instanz sonst aus dem Verkehr.
  app.get('/readyz', async (_request, reply) => {
    try {
      await options.db.query('select 1');
      return { ok: true };
    } catch {
      return reply.code(503).send({ ok: false });
    }
  });

  registerCatalogRoutes(app, options.db, createCatalogVersion(options.db));
  registerCollectionRoutes(app, options.db, createAuthenticator(options.db));

  return app;
}
