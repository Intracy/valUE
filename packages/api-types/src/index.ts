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

/**
 * Element (Energietyp) einer Karte. Die App zeigt es als farbiges Abzeichen,
 * immer mit Symbol und Namen, nie nur als Farbe.
 */
export type Element =
  | 'fire'
  | 'water'
  | 'grass'
  | 'lightning'
  | 'psychic'
  | 'fighting'
  | 'darkness'
  | 'metal'
  | 'dragon'
  | 'fairy'
  | 'colorless';

/** Seltenheitsstufe für Sammelscore und Verteilung im Profil. */
export type RarityTier = 'common' | 'uncommon' | 'rare' | 'holo' | 'ultra' | 'secret';

/** Kompakte Karte für Raster und Listen. */
export interface CardSummary {
  id: string;
  setId: string;
  name: string;
  number: string | null;
  rarity: string | null;
  imageUrl: string | null;
  price: Money | null;
  /** Null bei Karten ohne Element, etwa Trainern, oder wenn die Quelle keins nennt. */
  element: Element | null;
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

export type Grader = 'PSA' | 'CGC' | 'BGS' | 'SGC';

/** Preis und Population einer Note bei einer Grading-Firma. */
export interface CardGrade {
  grader: Grader;
  /** Note als Text: "10", "9.5", "9". */
  grade: string;
  price: Money | null;
  /** Gegradete Exemplare mit dieser Note laut Populationsbericht. */
  population: number | null;
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
  /** Höchste Note zuerst. Leer, wenn es keine Grading-Daten gibt. */
  grades: CardGrade[];
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

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'holo';

/** Abzeichen im Profil. Stufen von Bronze bis Holo, je nach erreichter Schwelle. */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** Erreichte Stufe, null solange noch keine erreicht ist. */
  tier: AchievementTier | null;
  /** Aktueller Stand, etwa Anzahl Karten. */
  progress: number;
  /** Schwelle der nächsten Stufe, null wenn Holo erreicht ist. */
  nextTarget: number | null;
  /** Bei Element-Abzeichen das Element, sonst null. */
  element: Element | null;
}

export interface ProfileResponse {
  userId: string;
  /** Selbst gewählter Name, null wenn keiner gesetzt ist. */
  displayName: string | null;
  /** Rang nach Stufe des Sammelscores, etwa "Meister-Sammler". */
  rank: string;
  uniqueCards: number;
  totalCards: number;
  collectionValue: Money | null;
  score: ScoreTrack;
  vintageScore: ScoreTrack;
  completedSets: number;
  achievements: Achievement[];
  /** Verschiedene Karten je Seltenheitsstufe, alle sechs Stufen in fester Reihenfolge. */
  rarityDistribution: { tier: RarityTier; cards: number }[];
}

export interface UpdateProfileRequest {
  /** 1 bis 40 Zeichen; leer oder null entfernt den Namen. */
  displayName: string | null;
}

export type PortfolioRange = '1T' | '1W' | '1M' | '1J' | 'Max';

/** Eine Karte der Sammlung mit ihrem Anteil am Gesamtwert. */
export interface PortfolioCard extends CardSummary {
  setName: string;
  quantity: number;
  value: Money | null;
}

export interface PortfolioResponse {
  range: PortfolioRange;
  /** Wert zum heutigen Tagespreis. */
  value: Money | null;
  /** Veränderung gegenüber dem ersten Tag des Zeitraums. */
  change: { amount: number; percent: number | null } | null;
  /** Tageswerte der heutigen Sammlung im Zeitraum, ältester zuerst. */
  points: PricePoint[];
  uniqueCards: number;
  totalCards: number;
  /** Die wertvollsten Karten, höchster Wert zuerst. */
  topCards: PortfolioCard[];
}

/** Karte mit Kursveränderung im Markt-Tab. */
export interface MoverCard extends CardSummary {
  setName: string;
  previousPrice: Money;
  changePercent: number;
}

export interface MarketMoversResponse {
  days: number;
  gainers: MoverCard[];
  losers: MoverCard[];
  catalogVersion: string;
}

export interface FavoriteCard extends CardSummary {
  setName: string;
  addedAt: string;
}

export interface FavoritesResponse {
  cards: FavoriteCard[];
}

export interface FavoriteResponse {
  cardId: string;
  favorite: boolean;
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

/** Wechselkurs für die Umrechnung in der App: 1 Dollar = `rate` Euro. */
export interface ExchangeRateResponse {
  base: 'USD';
  quote: 'EUR';
  rate: number;
  /** Tag des Referenzkurses (YYYY-MM-DD). */
  date: string;
  source: string;
  /** true, wenn der letzte Abruf scheiterte und ein gespeicherter Kurs gilt. */
  stale: boolean;
}
