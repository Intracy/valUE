import { normalizeElement } from '../domain/elements.js';
import {
  SourceError,
  type CreditUsage,
  type PriceSource,
  type SourceCard,
  type SourceGrade,
  type SourceGrader,
  type SourcePrinting,
  type SourceSet,
} from './price-source.js';

/**
 * Anbindung an Pokemon Price Tracker (API v2).
 *
 * WICHTIG: Die API-Referenz dokumentiert für /sets und /cards nur den Umschlag
 * (`data`, `metadata`) und einzelne Felder (`name`, `prices.market`), nicht das
 * vollständige JSON. Die Zuordnung unten probiert deshalb mehrere naheliegende
 * Feldnamen und überspringt Einträge ohne ID oder Namen. Vor dem ersten echten
 * Abgleich `npm run ppt:probe` ausführen: Das Skript zeigt die tatsächlichen
 * Felder und meldet, was die Zuordnung nicht findet.
 */

type Json = Record<string, unknown>;
type FetchLike = typeof fetch;

export interface PptClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxRetries?: number;
  /** Gegradete eBay-Preise mitladen (`includeEbay=true`). */
  includeGraded?: boolean;
  /** Nur für Tests: Wartezeit zwischen Wiederholungen. */
  sleep?: (ms: number) => Promise<void>;
}

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Erster vorhandener Wert aus einer Liste möglicher Pfade (`a.b` erlaubt). */
export function pick(source: unknown, paths: string[]): unknown {
  for (const path of paths) {
    let current: unknown = source;
    for (const key of path.split('.')) {
      current = isObject(current) ? current[key] : undefined;
    }
    if (current !== undefined && current !== null && current !== '') return current;
  }
  return undefined;
}

export function asText(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.\-]/g, ''));
    return value.trim() !== '' && Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function asIsoDate(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) return match[0];
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export function asIsoTimestamp(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export const slugify = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function mapSet(raw: unknown, language: string): SourceSet | null {
  const name = asText(pick(raw, ['name', 'setName', 'title']));
  if (!name) return null;
  const id = asText(pick(raw, ['id', 'setId', 'slug', 'tcgPlayerId', '_id'])) ?? slugify(name);
  const count = asNumber(pick(raw, ['cardCount', 'totalCards', 'total', 'printedTotal', 'cards']));
  return {
    id,
    name,
    series: asText(pick(raw, ['series', 'seriesName'])),
    language: asText(pick(raw, ['language'])) ?? language,
    releaseDate: asIsoDate(pick(raw, ['releaseDate', 'releasedAt', 'release_date'])),
    cardCount: count === null ? null : Math.max(0, Math.round(count)),
    imageUrl: asText(pick(raw, ['imageCdnUrl', 'imageUrl', 'logoUrl', 'symbolUrl', 'images.logo'])),
  };
}

const PRICE_KEYS = ['market', 'marketPrice', 'price', 'mid', 'midPrice'];
const LOW_KEYS = ['low', 'lowPrice'];

function mapPrintings(raw: unknown): SourcePrinting[] {
  const variants = pick(raw, ['prices.variants', 'variants', 'printings']);
  if (!isObject(variants)) return [];
  const printings: SourcePrinting[] = [];
  for (const [printing, value] of Object.entries(variants)) {
    if (!isObject(value)) continue;
    let market = asNumber(pick(value, PRICE_KEYS));
    let low = asNumber(pick(value, LOW_KEYS));
    if (market === null) {
      // Verschachtelt nach Zustand: Near Mint bevorzugen, sonst der erste Eintrag mit Preis.
      const conditions = Object.entries(value).filter(([, inner]) => isObject(inner));
      const preferred =
        conditions.find(([condition]) => /near\s*mint/i.test(condition)) ??
        conditions.find(([, inner]) => asNumber(pick(inner, PRICE_KEYS)) !== null);
      if (preferred) {
        market = asNumber(pick(preferred[1], PRICE_KEYS));
        low = low ?? asNumber(pick(preferred[1], LOW_KEYS));
      }
    }
    printings.push({ printing, marketPriceUsd: market, lowPriceUsd: low });
  }
  return printings;
}

const GRADERS: SourceGrader[] = ['PSA', 'CGC', 'BGS', 'SGC'];
const GRADE_PRICE_KEYS = ['smartMarketPrice', 'marketPrice', 'avg', 'average', 'averagePrice', 'medianPrice', 'median', 'price'];

/** "psa10" -> PSA 10, "bgs9_5" / "cgc9.5" -> 9.5. */
function parseGradeKey(key: string): { grader: SourceGrader; grade: string } | null {
  const match = /^(psa|cgc|bgs|sgc)[\s_-]?(\d{1,2})(?:[._](5))?$/i.exec(key.trim());
  if (!match) return null;
  const grade = match[3] ? `${match[2]}.5` : match[2]!;
  const numeric = Number(grade);
  if (numeric < 1 || numeric > 10) return null;
  return { grader: match[1]!.toUpperCase() as SourceGrader, grade };
}

/**
 * Gegradete Preise aus `includeEbay=true`. Belegt ist nur `ebay.psa10.avg`;
 * daneben werden naheliegende Hüllen (`ebay.grades`, `ebay.salesByGrade`) und
 * Preisfelder aus dem Export probiert.
 */
export function mapGrades(raw: unknown): SourceGrade[] {
  const containers = [pick(raw, ['ebay.salesByGrade']), pick(raw, ['ebay.grades']), pick(raw, ['ebay']), pick(raw, ['graded'])];
  const found = new Map<string, SourceGrade>();
  for (const container of containers) {
    if (!isObject(container)) continue;
    for (const [key, value] of Object.entries(container)) {
      const parsed = parseGradeKey(key);
      if (!parsed) continue;
      const price = isObject(value) ? asNumber(pick(value, GRADE_PRICE_KEYS)) : asNumber(value);
      if (price === null) continue;
      const id = `${parsed.grader}-${parsed.grade}`;
      if (!found.has(id)) found.set(id, { ...parsed, priceUsd: price, population: null });
    }
  }
  return [...found.values()];
}

/**
 * Population aus GET /population: `populationByGrader.PSA.g10`, `g9_5` usw.
 * Halbe Noten gibt es nur bei BGS und CGC.
 */
export function mapPopulation(raw: unknown): SourceGrade[] {
  const byGrader = pick(raw, ['populationByGrader']);
  if (!isObject(byGrader)) return [];
  const grades: SourceGrade[] = [];
  for (const grader of GRADERS) {
    const counts = byGrader[grader];
    if (!isObject(counts)) continue;
    for (const [key, value] of Object.entries(counts)) {
      const match = /^g(\d{1,2})(?:_(5))?$/.exec(key);
      const population = asNumber(value);
      if (!match || population === null) continue;
      grades.push({ grader, grade: match[2] ? `${match[1]}.5` : match[1]!, priceUsd: null, population: Math.round(population) });
    }
  }
  return grades;
}

export function mapCard(raw: unknown, set: SourceSet): SourceCard | null {
  const id = asText(pick(raw, ['tcgPlayerId', 'id', '_id', 'cardId']));
  const name = asText(pick(raw, ['name', 'cardName']));
  if (!id || !name) return null;
  return {
    id,
    setId: set.id,
    name,
    number: asText(pick(raw, ['cardNumber', 'number', 'collectorNumber'])),
    rarity: asText(pick(raw, ['rarity'])),
    imageUrl: asText(
      pick(raw, ['imageCdnUrl800', 'imageCdnUrl', 'imageUrl', 'image', 'images.large', 'images.small']),
    ),
    marketPriceUsd: asNumber(pick(raw, ['prices.market', 'marketPrice', 'price'])),
    lowPriceUsd: asNumber(pick(raw, ['prices.low', 'lowPrice'])),
    priceUpdatedAt: asIsoTimestamp(
      pick(raw, ['prices.lastUpdated', 'lastPriceUpdate', 'priceUpdatedAt', 'lastUpdated', 'updatedAt']),
    ),
    printings: mapPrintings(raw),
    element: normalizeElement(pick(raw, ['types', 'type', 'energyType', 'pokemonType', 'element', 'cardType'])),
    grades: mapGrades(raw),
  };
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class PokemonPriceTrackerSource implements PriceSource {
  readonly name = 'pokemon-price-tracker';
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly options: PptClientOptions) {
    if (!options.apiKey) throw new Error('PPT_API_KEY fehlt.');
    this.baseUrl = (options.baseUrl ?? 'https://www.pokemonpricetracker.com/api/v2').replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.maxRetries = options.maxRetries ?? 3;
    this.sleep = options.sleep ?? defaultSleep;
  }

  /** Roher Abruf. Wiederholt bei 429 und 5xx mit wachsender Pause. */
  async request(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
  ): Promise<{ body: unknown; credits: CreditUsage }> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    let lastError: SourceError | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          headers: { Authorization: `Bearer ${this.options.apiKey}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (error) {
        lastError = new SourceError(`Netzwerkfehler: ${(error as Error).message}`);
        if (attempt < this.maxRetries) await this.sleep(500 * 2 ** attempt);
        continue;
      }

      const credits: CreditUsage = {
        consumed: asNumber(response.headers.get('x-api-calls-consumed')) ?? 0,
        dailyRemaining: asNumber(response.headers.get('x-ratelimit-daily-remaining')),
      };

      if (response.ok) {
        const body: unknown = await response.json();
        if (credits.consumed === 0) {
          credits.consumed = asNumber(pick(body, ['metadata.apiCallsConsumed.total'])) ?? 0;
        }
        return { body, credits };
      }

      const retryAfter = asNumber(response.headers.get('retry-after'));
      const detail = (await response.text().catch(() => '')).slice(0, 300);
      lastError = new SourceError(
        `Pokemon Price Tracker antwortet mit ${response.status}${detail ? `: ${detail}` : ''}`,
        response.status,
        retryAfter,
      );
      // 429 ohne Retry-After heißt meist: Tageskontingent leer. Dann nicht weiter anklopfen.
      const retryable = response.status >= 500 || (response.status === 429 && retryAfter !== null && retryAfter <= 60);
      if (!retryable || attempt === this.maxRetries) break;
      await this.sleep(retryAfter !== null ? retryAfter * 1000 : 500 * 2 ** attempt);
    }
    throw lastError ?? new SourceError('Unbekannter Fehler beim Abruf.');
  }

  private static rows(body: unknown): unknown[] {
    if (Array.isArray(body)) return body;
    const data = pick(body, ['data', 'results', 'sets', 'cards']);
    return Array.isArray(data) ? data : [];
  }

  async listSets(language: string) {
    const { body, credits } = await this.request('/sets', {
      language,
      sortBy: 'releaseDate',
      sortOrder: 'desc',
      limit: 500,
    });
    const sets = PokemonPriceTrackerSource.rows(body)
      .map((raw) => mapSet(raw, language))
      .filter((set): set is SourceSet => set !== null);
    return { sets, credits };
  }

  async listCardsInSet(set: SourceSet) {
    // Die Referenz nennt als Filterwert mal den Namen, mal ein Kürzel. Der Name ist
    // in den Beispielen der häufigste Fall.
    const { body, credits } = await this.request('/cards', {
      set: set.name,
      language: set.language,
      fetchAllInSet: true,
      includeEbay: this.options.includeGraded ? true : undefined,
    });
    const rows = PokemonPriceTrackerSource.rows(body);
    const cards = rows.map((raw) => mapCard(raw, set)).filter((card): card is SourceCard => card !== null);
    return { cards, skipped: rows.length - cards.length, credits };
  }

  /** Nur Business- und Enterprise-Tarif; 2 Credits je Karte, höchstens 50 je Abruf. */
  async fetchPopulation(cardIds: string[], language: string) {
    const { body, credits } = await this.request('/population', {
      tcgPlayerIds: cardIds.slice(0, 50).join(','),
      language,
      limit: 100,
    });
    // Bei einer Karte kommt ein Objekt zurück, bei mehreren eine Liste.
    const data = pick(body, ['data']);
    const rows = Array.isArray(data) ? data : isObject(data) ? [data] : isObject(body) ? [body] : [];
    const grades = new Map<string, SourceGrade[]>();
    for (const row of rows) {
      const id = asText(pick(row, ['tcgPlayerId', 'id', 'cardId']));
      if (id) grades.set(id, mapPopulation(row));
    }
    return { grades, credits };
  }
}
