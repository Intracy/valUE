import type { RarityTier } from '@value/api-types';

/**
 * Seltenheitsstufe aus der Bezeichnung der Quelle. Gleiche Regeln wie
 * apps/server/src/domain/xp.ts (rarityTier); bei Änderungen beide anpassen.
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

/** Holo-, Ultra- und Secret-Karten bekommen laut Moodboard den Holo-Rahmen. */
export const isShiny = (rarity: string | null | undefined) => {
  const tier = rarityTier(rarity);
  return tier === 'holo' || tier === 'ultra' || tier === 'secret';
};
