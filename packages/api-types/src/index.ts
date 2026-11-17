/**
 * Vertrag zwischen App und Server (Version 1, Präfix /v1).
 * Nur Typen: Die App importiert sie mit `import type`, es landet kein Code im Bundle.
 * Preise sind Tagespreise. `priceUpdatedAt` sagt, von wann der Stand ist.
 */

export type Currency = 'USD' | 'EUR';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface SetSummary {
  id: string;
  name: string;
  series: string | null;
  language: string;
  /** ISO-Datum (YYYY-MM-DD) oder null, wenn die Quelle keins liefert. */
  releaseDate: string | null;
  cardCount: number;
  imageUrl: string | null;
}

export interface SetListResponse {
  sets: SetSummary[];
  /** Version des Katalogs; ändert sich nach jedem erfolgreichen Abgleich. */
  catalogVersion: string;
}

/** Kompakte Karte für Raster und Listen. */
export interface CardSummary {
  id: string;
  setId: string;
  name: string;
  number: string | null;
  rarity: string | null;
  imageUrl: string | null;
  price: Money | null;
}

export interface SetDetailResponse {
  set: SetSummary;
  cards: CardSummary[];
  catalogVersion: string;
}

export interface CardPrinting {
  printing: string;
  price: Money | null;
}

export interface PricePoint {
  /** ISO-Datum (YYYY-MM-DD). */
  day: string;
  amount: number;
}

export interface CardDetailResponse {
  card: CardSummary & {
    setName: string;
    setReleaseDate: string | null;
    lowPrice: Money | null;
    priceUpdatedAt: string | null;
  };
  printings: CardPrinting[];
  history: { currency: Currency; points: PricePoint[] };
  catalogVersion: string;
}

export interface SearchResponse {
  query: string;
  cards: (CardSummary & { setName: string })[];
}

export interface AnonymousAuthResponse {
  userId: string;
  /** Geheimnis des Geräts. Wird nur einmal ausgeliefert und sicher gespeichert. */
  token: string;
}

export type CollectionSource = 'scan' | 'manual';

export interface CollectionItem {
  cardId: string;
  printing: string;
  quantity: number;
  source: CollectionSource;
}

export interface SetProgress {
  setId: string;
  ownedCards: number;
  cardCount: number;
}

export interface CollectionProgressResponse {
  sets: SetProgress[];
}

export interface CollectionSetResponse {
  setId: string;
  items: CollectionItem[];
}

export interface PutCollectionItemRequest {
  quantity: number;
  printing?: string;
  source?: CollectionSource;
}

export interface PutCollectionItemResponse {
  item: CollectionItem | null;
}

export interface ScoreTrack {
  xp: number;
  level: number;
  /** XP, bei denen die aktuelle Stufe begann. */
  levelStartXp: number;
  /** XP, bei denen die nächste Stufe beginnt. */
  nextLevelXp: number;
}

export interface ProfileResponse {
  userId: string;
  uniqueCards: number;
  totalCards: number;
  collectionValue: Money | null;
  score: ScoreTrack;
  vintageScore: ScoreTrack;
  completedSets: number;
}

export interface ApiError {
  error: { code: string; message: string };
}

export type ScanOutcome = 'match' | 'unsure' | 'none';

/** Ein Vorschlag des Scanners. */
export interface ScanCandidate extends CardSummary {
  setName: string;
  /** Druckvarianten der Karte laut Katalog, etwa "Normal", "Reverse Holofoil". */
  printings: string[];
  /** Übereinstimmung von 0 bis 1. */
  confidence: number;
}

export interface ScanRequest {
  /** Foto der Karte als Base64 (JPEG oder PNG), zugeschnitten auf den Suchrahmen. */
  image: string;
}

export interface ScanResponse {
  scanId: string;
  /** match = eine Karte klar vorn, unsure = mehrere möglich, none = nichts erkannt. */
  outcome: ScanOutcome;
  candidates: ScanCandidate[];
  /** Was die Texterkennung gelesen hat, zur Erklärung in der App. */
  read: { name: string | null; number: string | null };
  durationMs: number;
}

export interface ConfirmScanRequest {
  cardId: string;
  printing?: string;
}

export interface ConfirmScanResponse {
  item: CollectionItem;
  cardName: string;
  /** Exemplare dieser Karte in der Sammlung, über alle Varianten. */
  totalQuantity: number;
}

export interface DeleteCollectionItemResponse {
  removed: number;
}
