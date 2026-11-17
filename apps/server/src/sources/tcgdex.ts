import { normalizeElement } from '../domain/elements.js';
import { SourceError, type SourceCard, type SourceSet } from './price-source.js';

/**
 * Katalog von TCGdex (https://tcgdex.dev): alle Sets und Karten mit Bildern,
 * kostenlos und ohne Schlüssel, auf Englisch, Deutsch und Japanisch.
 *
 * TCGdex liefert den Katalog, nicht die Preise. Die kommen weiter von Pokemon
 * Price Tracker und werden über die TCGdex-ID zugeordnet (siehe sync/prices.ts).
 *
 * IDs: Dieselbe Karte hat auf Englisch und Deutsch dieselbe TCGdex-ID ("base1-4").
 * Im Katalog ist jede Sprache eine eigene Karte, deshalb mit Sprachpräfix:
 * "en-base1-4", "de-base1-4", "ja-SV1S-001".
 */

export const CATALOG_LANGUAGES = ['en', 'de', 'ja'] as const;
export type CatalogLanguage = (typeof CATALOG_LANGUAGES)[number];

/** Spaltenwert in `sets.language`. */
export const LANGUAGE_NAMES: Record<CatalogLanguage, string> = { en: 'english', de: 'german', ja: 'japanese' };

export const catalogId = (language: CatalogLanguage, tcgdexId: string) => `${language}-${tcgdexId}`;

export interface TcgdexSetBrief {
  id: string;
  name: string;
  logo?: string;
  cardCount?: { total?: number; official?: number };
}

export interface TcgdexCardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

export interface TcgdexSet extends TcgdexSetBrief {
  releaseDate?: string;
  serie?: { id: string; name: string };
  cards: TcgdexCardBrief[];
}

export interface TcgdexCard extends TcgdexCardBrief {
  category?: string;
  rarity?: string;
  types?: string[];
  set: { id: string; name?: string; cardCount?: { total?: number; official?: number } };
  variants?: { normal?: boolean; holo?: boolean; reverse?: boolean; firstEdition?: boolean; wPromo?: boolean };
}

export interface TcgdexClient {
  listSets(language: CatalogLanguage): Promise<TcgdexSetBrief[]>;
  getSet(language: CatalogLanguage, setId: string): Promise<TcgdexSet>;
  getCard(language: CatalogLanguage, cardId: string): Promise<TcgdexCard>;
}

/** HTTP-Client mit Wiederholung bei Netzfehlern und 429/5xx. */
export function createTcgdexClient(
  options: { baseUrl?: string; fetch?: typeof fetch; timeoutMs?: number; retries?: number } = {},
): TcgdexClient {
  const baseUrl = (options.baseUrl ?? 'https://api.tcgdex.net/v2').replace(/\/$/, '');
  const doFetch = options.fetch ?? fetch;
  const retries = options.retries ?? 3;

  const get = async <T>(path: string): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
      try {
        const response = await doFetch(`${baseUrl}${path}`, {
          signal: AbortSignal.timeout(options.timeoutMs ?? 20_000),
          headers: { accept: 'application/json' },
        });
        if (response.status === 404) throw new SourceError(`TCGdex: ${path} nicht gefunden`, 404);
        if (response.status === 429 || response.status >= 500) {
          lastError = new SourceError(`TCGdex: ${path} antwortet ${response.status}`, response.status);
          continue;
        }
        if (!response.ok) throw new SourceError(`TCGdex: ${path} antwortet ${response.status}`, response.status);
        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof SourceError && error.status !== null && error.status < 500 && error.status !== 429) throw error;
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new SourceError(`TCGdex: ${path} nicht erreichbar`);
  };

  return {
    listSets: (language) => get(`/${language}/sets`),
    getSet: (language, setId) => get(`/${language}/sets/${encodeURIComponent(setId)}`),
    getCard: (language, cardId) => get(`/${language}/cards/${encodeURIComponent(cardId)}`),
  };
}

/** Bildadresse in Anzeigegröße. TCGdex hängt Größe und Format an die Basisadresse. */
export const cardImageUrl = (base: string | undefined) => (base ? `${base}/high.webp` : null);

/** Für den Fingerabdruck reicht die kleine Fassung (245 × 342), spart rund 90 % Download. */
export function fingerprintImageUrl(url: string): string {
  return url.startsWith('https://assets.tcgdex.net/') ? url.replace(/\/high\.(webp|png|jpg)$/, '/low.webp') : url;
}

/** Offizielle Set-Größe, wie sie hinter dem Schrägstrich auf der Karte steht. 0 bei Promos. */
const officialCount = (count: TcgdexSetBrief['cardCount']) => count?.official || 0;

export function mapTcgdexSet(language: CatalogLanguage, set: TcgdexSet): SourceSet {
  return {
    id: catalogId(language, set.id),
    name: set.name,
    series: set.serie?.name ?? null,
    language: LANGUAGE_NAMES[language],
    releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(set.releaseDate ?? '') ? set.releaseDate! : null,
    // Die Erkennung vergleicht die gelesene Gesamtzahl ("…/189") mit dieser Zahl.
    cardCount: officialCount(set.cardCount) || set.cardCount?.total || set.cards.length,
    imageUrl: set.logo ? `${set.logo}.png` : null,
  };
}

/** Varianten in den Namen von TCGPlayer, wie sie auch Pokemon Price Tracker verwendet. */
export function mapVariants(variants: TcgdexCard['variants']): string[] {
  if (!variants) return [];
  const out: string[] = [];
  if (variants.normal) out.push('Normal');
  if (variants.holo) out.push('Holofoil');
  if (variants.reverse) out.push('Reverse Holofoil');
  if (variants.firstEdition) out.push(variants.holo ? '1st Edition Holofoil' : '1st Edition');
  return out;
}

/**
 * Karte ohne Preise. `printedNumber` ist die Nummer wie auf der Karte: "4/102",
 * "136/189", "001/078"; bei Promos ohne Gesamtzahl nur die lokale Nummer.
 */
export function mapTcgdexCard(language: CatalogLanguage, card: TcgdexCard, setOfficial: number): SourceCard {
  const number = setOfficial > 0 && /^\d+$/.test(card.localId) ? `${card.localId}/${setOfficial}` : card.localId;
  return {
    id: catalogId(language, card.id),
    setId: catalogId(language, card.set.id),
    name: card.name,
    number,
    rarity: card.rarity ?? null,
    imageUrl: cardImageUrl(card.image),
    marketPriceUsd: null,
    lowPriceUsd: null,
    priceUpdatedAt: null,
    printings: mapVariants(card.variants).map((printing) => ({ printing, marketPriceUsd: null, lowPriceUsd: null })),
    element: normalizeElement(card.types ?? []),
  };
}

export const setOfficialCount = (set: TcgdexSet) => officialCount(set.cardCount);
