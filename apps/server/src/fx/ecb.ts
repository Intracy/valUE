import type { ExchangeRateResponse } from '@value/api-types';

import type { Db } from '../db/pool.js';

/**
 * Referenzkurs der Europäischen Zentralbank (EZB). Die EZB veröffentlicht ihn an
 * Arbeitstagen gegen 16 Uhr MEZ, frei und ohne Schlüssel. Er nennt Dollar je
 * Euro; die App braucht Euro je Dollar, also den Kehrwert.
 */
export const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const SOURCE = 'Europäische Zentralbank (Referenzkurs)';
const META_KEY = 'fx_usd_eur';

export function parseEcbUsdRate(xml: string): { rate: number; date: string } | null {
  const date = /time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1];
  const usdPerEur = Number(/currency=['"]USD['"]\s+rate=['"]([\d.]+)['"]/.exec(xml)?.[1]);
  if (!date || !Number.isFinite(usdPerEur) || usdPerEur <= 0) return null;
  return { rate: Math.round((1 / usdPerEur) * 1e6) / 1e6, date };
}

export interface ExchangeRates {
  usdToEur(): Promise<ExchangeRateResponse | null>;
}

/**
 * Hält den Kurs eine Stunde im Prozess. Jeder erfolgreiche Abruf landet zusätzlich
 * in der Tabelle `meta`; scheitert die EZB, gilt der zuletzt gespeicherte Kurs.
 */
export function createExchangeRates(
  db: Db,
  options: { url?: string; fetchImpl?: typeof fetch; ttlMs?: number; now?: () => number } = {},
): ExchangeRates {
  const fetchImpl = options.fetchImpl ?? fetch;
  const ttl = options.ttlMs ?? 60 * 60 * 1000;
  const now = options.now ?? Date.now;
  let cached: { value: ExchangeRateResponse; at: number } | null = null;
  let pending: Promise<ExchangeRateResponse | null> | null = null;

  const stored = async (): Promise<ExchangeRateResponse | null> => {
    const row = await db.query<{ value: string }>(`select value from meta where key = $1`, [META_KEY]);
    if (!row.rows[0]) return null;
    const value = JSON.parse(row.rows[0].value) as { rate: number; date: string };
    return { base: 'USD', quote: 'EUR', rate: value.rate, date: value.date, source: SOURCE, stale: true };
  };

  const load = async (): Promise<ExchangeRateResponse | null> => {
    try {
      const response = await fetchImpl(options.url ?? ECB_DAILY_URL, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) throw new Error(`EZB antwortet mit ${response.status}`);
      const parsed = parseEcbUsdRate(await response.text());
      if (!parsed) throw new Error('EZB-Antwort ohne Dollarkurs');
      await db.query(
        `insert into meta (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value`,
        [META_KEY, JSON.stringify(parsed)],
      );
      const value: ExchangeRateResponse = { base: 'USD', quote: 'EUR', ...parsed, source: SOURCE, stale: false };
      cached = { value, at: now() };
      return value;
    } catch {
      // Gespeicherten Kurs nehmen, aber nicht als frisch merken: Der nächste Abruf versucht es wieder.
      return stored();
    }
  };

  return {
    async usdToEur() {
      if (cached && now() - cached.at < ttl) return cached.value;
      pending ??= load().finally(() => {
        pending = null;
      });
      return pending;
    },
  };
}
