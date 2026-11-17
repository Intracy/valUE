import type { RarityTier, ScoreTrack } from '@value/api-types';

export type { RarityTier };

/**
 * Sammelscore laut Konzept: XP nach Seltenheit, nicht nach Preis.
 * Die erste Variante einer Karte bringt den vollen Wert, jede weitere die Hälfte.
 * Die Werte sind ein Vorschlag und werden im Beta-Test abgestimmt.
 */

export const RARITY_TIERS: RarityTier[] = ['common', 'uncommon', 'rare', 'holo', 'ultra', 'secret'];

export const XP_BY_TIER: Record<RarityTier, number> = {
  common: 5,
  uncommon: 10,
  rare: 20,
  holo: 40,
  ultra: 80,
  secret: 150,
};

/** Karten aus Sets, die vor diesem Tag erschienen sind, zählen für den Vintage-Score. */
export const VINTAGE_BEFORE = '2000-01-01';

/**
 * Ordnet die Seltenheitsbezeichnung der Quelle einer von sechs Stufen zu.
 * Die Bezeichnungen wechseln je Ära; diese Tabelle wird mit neuen Sets gepflegt.
 * Reihenfolge zählt: die speziellste Regel zuerst.
 */
export function rarityTier(rarity: string | null | undefined): RarityTier {
  const text = (rarity ?? '').toLowerCase();
  if (/secret|hyper|rainbow|gold|illustration|special art|alt(ernate)? art|shiny/.test(text)) return 'secret';
  if (/ultra|double rare|full art|\bex\b|\bgx\b|\bvmax\b|\bvstar\b|\bv\b|amazing|radiant|ace spec|prism|legend|break/.test(text))
    return 'ultra';
  if (/holo/.test(text)) return 'holo';
  if (/uncommon/.test(text)) return 'uncommon';
  if (/rare|promo/.test(text)) return 'rare';
  return 'common';
}

/** XP einer Karte, von der `printings` verschiedene Varianten in der Sammlung sind. */
export function cardXp(rarity: string | null | undefined, printings: number): number {
  if (printings <= 0) return 0;
  const base = XP_BY_TIER[rarityTier(rarity)];
  return base + (printings - 1) * Math.round(base / 2);
}

/** Stufe n beginnt bei 50 × n² XP. Stufe 1 ist der Start. */
export function scoreTrack(xp: number): ScoreTrack {
  const level = Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 50)));
  return {
    xp,
    level,
    levelStartXp: level === 1 ? 0 : 50 * level * level,
    nextLevelXp: 50 * (level + 1) * (level + 1),
  };
}
