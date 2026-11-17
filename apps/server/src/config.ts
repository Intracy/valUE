import { z } from 'zod';

const csv = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8787),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL fehlt'),
  /** Verbindungen pro Server-Prozess. Hinter PgBouncer klein halten. */
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  CORS_ORIGINS: z.string().optional(),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
  TRUST_PROXY: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  /** Schlüssel für Pokemon Price Tracker. Bleibt auf dem Server, nie in der App. */
  PPT_API_KEY: z.string().optional(),
  PPT_BASE_URL: z.string().url().default('https://www.pokemonpricetracker.com/api/v2'),
  /** `api` = Einzelabrufe (Free- und API-Tarif), `export` = Tages-Export (Business). */
  SYNC_MODE: z.enum(['api', 'export']).default('api'),
  /** Im Modus `api`: Sets, die abgeglichen werden, als Namen wie in der Quelle. */
  SYNC_SETS: z.string().default('Celebrations'),
  SYNC_LANGUAGE: z.enum(['english', 'japanese']).default('english'),
  /** Obergrenze je Lauf. Der Free-Tarif hat 100 Credits am Tag. */
  SYNC_MAX_CREDITS_PER_RUN: z.coerce.number().int().nonnegative().default(90),
  /** Parallele Texterkennungen je Server-Prozess. Jede belegt einen Kern, solange sie läuft. */
  SCAN_OCR_WORKERS: z.coerce.number().int().positive().default(2),
  /** Scans je Minute und Absender. Scannen ist der teuerste Aufruf. */
  SCAN_RATE_PER_MINUTE: z.coerce.number().int().positive().default(30),
  /** Gegradete eBay-Preise (PSA, CGC …) beim Karten-Abruf mitladen. */
  SYNC_INCLUDE_GRADED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  /**
   * Populationsbericht für so viele Karten je Lauf holen (2 Credits je Karte,
   * nur Business-Tarif). 0 schaltet ihn ab.
   */
  SYNC_POPULATION_MAX_CARDS: z.coerce.number().int().nonnegative().default(0),
  /** Preisverlauf so vieler Tage mitladen (1 Credit mehr je Karte; Free-Tarif höchstens 3). 0 = aus. */
  SYNC_HISTORY_DAYS: z.coerce.number().int().nonnegative().default(0),
  /** Quelle des Wechselkurses (EZB-Tageskurs im XML-Format). Nur für Tests ändern. */
  FX_URL: z.string().url().default('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'),
  /** Set-Liste höchstens so oft neu laden (kostet 1 Credit). */
  SYNC_SETS_REFRESH_HOURS: z.coerce.number().int().positive().default(168),
});

export type Config = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Ungültige Konfiguration: ${problems}`);
  }
  const value = parsed.data;
  return {
    env: value.NODE_ENV,
    port: value.PORT,
    host: value.HOST,
    databaseUrl: value.DATABASE_URL,
    databasePoolMax: value.DATABASE_POOL_MAX,
    corsOrigins: csv(value.CORS_ORIGINS),
    rateLimitPerMinute: value.RATE_LIMIT_PER_MINUTE,
    trustProxy: value.TRUST_PROXY,
    scan: {
      ocrWorkers: value.SCAN_OCR_WORKERS,
      ratePerMinute: value.SCAN_RATE_PER_MINUTE,
    },
    fxUrl: value.FX_URL,
    ppt: {
      apiKey: value.PPT_API_KEY,
      baseUrl: value.PPT_BASE_URL,
    },
    sync: {
      mode: value.SYNC_MODE,
      sets: csv(value.SYNC_SETS),
      language: value.SYNC_LANGUAGE,
      maxCreditsPerRun: value.SYNC_MAX_CREDITS_PER_RUN,
      setsRefreshHours: value.SYNC_SETS_REFRESH_HOURS,
      includeGraded: value.SYNC_INCLUDE_GRADED,
      populationMaxCards: value.SYNC_POPULATION_MAX_CARDS,
      historyDays: value.SYNC_HISTORY_DAYS,
    },
  };
}
