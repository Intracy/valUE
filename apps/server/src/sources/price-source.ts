/**
 * Einheitliche Schnittstelle zu einem Datenanbieter. Der Rest des Servers kennt
 * nur diese Typen. Ein anderer Anbieter wird angeschlossen, indem er `PriceSource`
 * umsetzt; Datenbank, API und App bleiben unberührt.
 */

export interface SourceSet {
  id: string;
  name: string;
  series: string | null;
  language: string;
  /** YYYY-MM-DD */
  releaseDate: string | null;
  cardCount: number | null;
  imageUrl: string | null;
}

export interface SourcePrinting {
  printing: string;
  marketPriceUsd: number | null;
  lowPriceUsd: number | null;
}

export type SourceGrader = 'PSA' | 'CGC' | 'BGS' | 'SGC';

/** Preis und/oder Population einer Note. */
export interface SourceGrade {
  grader: SourceGrader;
  /** "10", "9.5", "9" */
  grade: string;
  priceUsd: number | null;
  population: number | null;
}

export interface SourceCard {
  id: string;
  setId: string;
  name: string;
  number: string | null;
  rarity: string | null;
  imageUrl: string | null;
  marketPriceUsd: number | null;
  lowPriceUsd: number | null;
  /** ISO-Zeitstempel des Preisstands, falls die Quelle ihn nennt. */
  priceUpdatedAt: string | null;
  printings: SourcePrinting[];
  /** Normierter Element-Schlüssel (siehe domain/elements.ts). Fehlt er, bleibt der gespeicherte Wert. */
  element?: string | null;
  /** Preise gegradeter Exemplare, falls die Quelle sie mitliefert. */
  grades?: SourceGrade[];
  /** Lebenspunkte, Illustrator und Namen von Attacken und Fähigkeiten: Merkmale für den Scanner. */
  hp?: number | null;
  illustrator?: string | null;
  cardText?: string | null;
  /** ID der Karte im TCGdex-Katalog ("base1-4"), falls die Quelle sie nennt. Ordnet Preise Katalogkarten zu. */
  externalId?: string | null;
  /** Tagespreise der Vergangenheit (Near Mint), falls angefragt. */
  history?: { day: string; marketPriceUsd: number }[];
}

export interface CreditUsage {
  /** Credits, die dieser Abruf gekostet hat. */
  consumed: number;
  /** Restliches Tageskontingent laut Anbieter, falls gemeldet. */
  dailyRemaining: number | null;
}

export interface PriceSource {
  readonly name: string;
  listSets(language: string): Promise<{ sets: SourceSet[]; credits: CreditUsage }>;
  listCardsInSet(set: SourceSet): Promise<{ cards: SourceCard[]; skipped: number; credits: CreditUsage }>;
  /** Populationsbericht für bis zu 50 Karten. Optional: nicht jeder Anbieter oder Tarif hat ihn. */
  fetchPopulation?(cardIds: string[], language: string): Promise<{ grades: Map<string, SourceGrade[]>; credits: CreditUsage }>;
}

export class SourceError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'SourceError';
  }
}
