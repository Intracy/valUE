import compress from '@fastify/compress';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import type { ApiError } from '@value/api-types';
import Fastify, { type FastifyInstance } from 'fastify';

import type { Db } from '../db/pool.js';
import { createExchangeRates, type ExchangeRates } from '../fx/ecb.js';
import { createOcrPool, type OcrEngine } from '../scan/ocr.js';
import { VisualIndex } from '../scan/visual-index.js';
import { createAuthenticator } from './auth.js';
import { createCatalogVersion } from './catalog-version.js';
import { HttpError } from './errors.js';
import { registerCatalogRoutes } from './routes/catalog.js';
import { registerCollectionRoutes } from './routes/collection.js';
import { registerPortfolioRoutes } from './routes/portfolio.js';
import { registerScanRoutes } from './routes/scan.js';

export interface AppOptions {
  db: Db;
  corsOrigins?: string[];
  rateLimitPerMinute?: number;
  trustProxy?: boolean;
  logger?: boolean;
  /** Wechselkurse; ohne Angabe holt der Server den EZB-Referenzkurs. */
  fx?: ExchangeRates;
  scan?: {
    /** Eigene Texterkennung, etwa in Tests. Sonst legt der Server einen Pool an. */
    ocr?: OcrEngine;
    ocrWorkers?: number;
    ratePerMinute?: number;
  };
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
    methods: ['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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

  const version = createCatalogVersion(options.db);
  const authenticate = createAuthenticator(options.db);
  registerCatalogRoutes(app, options.db, version);
  registerCollectionRoutes(app, options.db, authenticate);
  registerPortfolioRoutes(app, options.db, authenticate);

  // Wechselkurs für die Umrechnung in der App. Für alle gleich, eine Stunde zwischenspeicherbar.
  const fx = options.fx ?? createExchangeRates(options.db);
  app.get('/v1/fx/usd-eur', async (_request, reply) => {
    const rate = await fx.usdToEur();
    if (!rate) return reply.code(503).send({ error: { code: 'fx_unavailable', message: 'Kein Wechselkurs verfügbar.' } });
    reply.header('Cache-Control', rate.stale ? 'public, max-age=300' : 'public, max-age=3600, s-maxage=3600');
    return rate;
  });

  // Der Pool startet erst beim ersten Scan; der Index lädt erst beim ersten Scan.
  const ocr = options.scan?.ocr ?? createOcrPool(options.scan?.ocrWorkers ?? 2);
  if (!options.scan?.ocr) app.addHook('onClose', () => ocr.close());
  registerScanRoutes(app, {
    db: options.db,
    authenticate,
    index: new VisualIndex(options.db, () => version.get()),
    ocr,
    ratePerMinute: options.scan?.ratePerMinute,
  });

  return app;
}
