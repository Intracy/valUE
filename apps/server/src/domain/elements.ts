import type { Element } from '@value/api-types';

/**
 * Elemente (Energietypen) der Karten. Quellen schreiben sie unterschiedlich:
 * englisch oder deutsch, groß oder klein, als Liste oder als Text.
 * `normalizeElement` führt alles auf einen festen Schlüssel zurück.
 */

export const ELEMENTS: Element[] = [
  'fire',
  'water',
  'grass',
  'lightning',
  'psychic',
  'fighting',
  'darkness',
  'metal',
  'dragon',
  'fairy',
  'colorless',
];

const ALIASES: Record<string, Element> = {
  fire: 'fire',
  feuer: 'fire',
  water: 'water',
  wasser: 'water',
  grass: 'grass',
  pflanze: 'grass',
  lightning: 'lightning',
  electric: 'lightning',
  elektro: 'lightning',
  psychic: 'psychic',
  psycho: 'psychic',
  fighting: 'fighting',
  kampf: 'fighting',
  darkness: 'darkness',
  dark: 'darkness',
  unlicht: 'darkness',
  finsternis: 'darkness',
  metal: 'metal',
  steel: 'metal',
  metall: 'metal',
  stahl: 'metal',
  dragon: 'dragon',
  drache: 'dragon',
  fairy: 'fairy',
  fee: 'fairy',
  colorless: 'colorless',
  normal: 'colorless',
  farblos: 'colorless',
};

/** Erstes erkanntes Element aus Text oder Liste, sonst null. */
export function normalizeElement(value: unknown): Element | null {
  const candidates = Array.isArray(value) ? value : [value];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    for (const word of candidate.toLowerCase().split(/[^a-zäöü]+/)) {
      const element = ALIASES[word];
      if (element) return element;
    }
  }
  return null;
}

export const isElement = (value: unknown): value is Element =>
  typeof value === 'string' && (ELEMENTS as string[]).includes(value);
