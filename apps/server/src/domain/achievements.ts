import type { Achievement, AchievementTier, Element } from '@value/api-types';

/**
 * Abzeichen fürs Profil, laut Moodboard in vier Stufen von Bronze bis Holo.
 * Jedes Abzeichen zählt eine Größe der Sammlung; die Schwellen sind ein
 * Vorschlag und werden im Beta-Test abgestimmt.
 */

export interface CollectionStats {
  uniqueCards: number;
  completedSets: number;
  /** Höchste Zahl verschiedener Varianten einer einzelnen Karte. */
  maxVariants: number;
  /** Verschiedene Karten der Stufe "secret". */
  secretCards: number;
  /** Verschiedene Karten aus Sets vor 2000. */
  vintageCards: number;
  /** Verschiedene Karten, die per Scan in die Sammlung kamen. */
  scannedCards: number;
  /** Verschiedene Karten je Element. */
  byElement: Partial<Record<Element, number>>;
}

const TIERS: AchievementTier[] = ['bronze', 'silver', 'gold', 'holo'];

interface Definition {
  id: string;
  title: string;
  description: string;
  thresholds: [number, number, number, number];
  value: (stats: CollectionStats) => number;
  element?: Element;
}

const element = (key: Element, title: string, label: string): Definition => ({
  id: `element-${key}`,
  title,
  description: `Verschiedene ${label}-Karten`,
  thresholds: [10, 50, 150, 400],
  value: (stats) => stats.byElement[key] ?? 0,
  element: key,
});

export const ACHIEVEMENTS: Definition[] = [
  {
    id: 'collector',
    title: 'Sammler',
    description: 'Verschiedene Karten in der Sammlung',
    thresholds: [10, 100, 500, 2000],
    value: (stats) => stats.uniqueCards,
  },
  {
    id: 'set-master',
    title: 'Set-König',
    description: 'Vollständige Sets',
    thresholds: [1, 3, 10, 25],
    value: (stats) => stats.completedSets,
  },
  {
    id: 'variants',
    title: 'Variantenjäger',
    description: 'Varianten einer einzigen Karte',
    thresholds: [2, 3, 4, 5],
    value: (stats) => stats.maxVariants,
  },
  {
    id: 'secret',
    title: 'Sternenstaub-Jäger',
    description: 'Secret- und Special-Art-Karten',
    thresholds: [1, 5, 20, 50],
    value: (stats) => stats.secretCards,
  },
  {
    id: 'vintage',
    title: 'Zeitreisender',
    description: 'Karten aus Sets vor 2000',
    thresholds: [1, 10, 50, 150],
    value: (stats) => stats.vintageCards,
  },
  {
    id: 'scanner',
    title: 'Entdecker',
    description: 'Per Scan erfasste Karten',
    thresholds: [1, 25, 100, 500],
    value: (stats) => stats.scannedCards,
  },
  element('fire', 'Glutsammler', 'Feuer'),
  element('water', 'Gezeitenmeister', 'Wasser'),
  element('grass', 'Waldhüter', 'Pflanzen'),
  element('lightning', 'Sturmrufer', 'Elektro'),
  element('psychic', 'Gedankenleser', 'Psycho'),
  element('fighting', 'Kampfgeist', 'Kampf'),
];

export function evaluateAchievements(stats: CollectionStats): Achievement[] {
  return ACHIEVEMENTS.map((definition) => {
    const progress = definition.value(stats);
    const reached = definition.thresholds.filter((threshold) => progress >= threshold).length;
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      tier: reached === 0 ? null : TIERS[reached - 1]!,
      progress,
      nextTarget: reached >= definition.thresholds.length ? null : definition.thresholds[reached]!,
      element: definition.element ?? null,
    };
  });
}

/** Rang nach Stufe des Sammelscores, für die Zeile unter dem Profilbild. */
export function rankForLevel(level: number): string {
  if (level >= 40) return 'Legende';
  if (level >= 25) return 'Meister-Sammler';
  if (level >= 12) return 'Experte';
  if (level >= 5) return 'Sammler';
  return 'Einsteiger';
}
