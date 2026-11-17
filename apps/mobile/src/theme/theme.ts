import '@/global.css';

import type { AchievementTier, Element, RarityTier } from '@value/api-types';
import { Platform, type ColorValue, type TextStyle } from 'react-native';

/**
 * Gestaltung nach dem valUE-Moodboard (Dark und Light Theme), aufgebaut auf
 * Apples Human Interface Guidelines: Textstile mit Dynamic Type, 8-Punkt-Raster,
 * Tippflächen ab 44 Punkt, Radien 20 und 12.
 *
 * Grundsätze aus dem Moodboard:
 * 1. Dunkel und ruhig: Mitternachtsblau trägt, Flächen heben sich nur leicht ab.
 * 2. Holo sparsam: Der Verlauf bleibt Logo, Haupt-Aktion, Set-Fortschritt und
 *    besonderen Karten vorbehalten.
 * 3. Zahlen zuerst: Wert und Veränderung sind die größten Elemente, Gewinn und
 *    Verlust immer mit Pfeil, nie nur mit Farbe.
 * 4. Sammeln belohnen: fehlende Karten als Silhouette, Element-Abzeichen,
 *    Seltenheitssterne, Abzeichen von Bronze bis Holo.
 */
export interface Palette {
  label: ColorValue;
  /** Fließtext, etwas weicher als Überschriften. */
  body: ColorValue;
  secondaryLabel: ColorValue;
  tertiaryLabel: ColorValue;
  background: ColorValue;
  groupedBackground: ColorValue;
  /** Fläche einer Karte oder Zelle. */
  surface: ColorValue;
  /** Erhöhte Fläche in einer Fläche, etwa Tabellenkopf oder Eingabefeld. */
  surfaceRaised: ColorValue;
  fill: ColorValue;
  separator: ColorValue;
  /** Rahmen um Flächen. Im Light Theme zusätzlich ein weicher Schatten. */
  border: ColorValue;
  tint: ColorValue;
  /** Text auf dem Holo-Verlauf. */
  onHolo: string;
  positive: ColorValue;
  negative: ColorValue;
  gold: ColorValue;
  /** Dunkle Abdeckung, etwa hinter Bildunterschriften. */
  scrim: ColorValue;
}

export type Scheme = 'light' | 'dark';

const dark: Palette = {
  label: '#F4F5FA',
  body: '#C9CCDA',
  secondaryLabel: '#8A90A8',
  tertiaryLabel: 'rgba(138, 144, 168, 0.55)',
  background: '#0B0D17',
  groupedBackground: '#0B0D17',
  surface: '#141829',
  surfaceRaised: '#1A1F35',
  fill: 'rgba(138, 144, 168, 0.16)',
  separator: '#1A1F35',
  border: '#1A1F35',
  tint: '#4FE3FF',
  onHolo: '#0B0D17',
  positive: '#2BD98F',
  negative: '#FF5A6E',
  gold: '#FFC94D',
  scrim: 'rgba(11, 13, 23, 0.72)',
};

const light: Palette = {
  label: '#0B0D17',
  body: '#3A3F55',
  secondaryLabel: '#5B6178',
  tertiaryLabel: 'rgba(91, 97, 120, 0.55)',
  background: '#F6F7FB',
  groupedBackground: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceRaised: '#EEF0F6',
  fill: 'rgba(91, 97, 120, 0.1)',
  separator: '#E3E6EF',
  border: '#E3E6EF',
  tint: '#5B3FD9',
  onHolo: '#0B0D17',
  positive: '#0B7A4C',
  negative: '#C8243B',
  gold: '#B7861A',
  scrim: 'rgba(255, 255, 255, 0.9)',
};

export const palette = (scheme: Scheme): Palette => (scheme === 'dark' ? dark : light);

/** Holo-Verlauf: Cyan, Violett, Magenta, Gold. Im Light Theme ein dunkleres Cyan. */
export const holoStops = (scheme: Scheme): string[] => [
  scheme === 'dark' ? '#4FE3FF' : '#14B8D9',
  '#8B5CFF',
  '#FF4FD8',
  '#FFC94D',
];

/** Gewinn- und Verlustflächen für Preis-Pillen. */
export const changeTints = (scheme: Scheme) =>
  scheme === 'dark'
    ? { positive: 'rgba(43, 217, 143, 0.16)', negative: 'rgba(255, 90, 110, 0.16)' }
    : { positive: 'rgba(15, 157, 99, 0.12)', negative: 'rgba(200, 36, 59, 0.1)' };

/** Element-Farben aus dem Moodboard. Immer mit Symbol oder Name, nie nur Farbe. */
export const elementInfo: Record<Element, { label: string; color: string; symbol: { ios: string; android: string; web: string } }> = {
  fire: { label: 'Feuer', color: '#FF7A3D', symbol: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' } },
  water: { label: 'Wasser', color: '#3DA5FF', symbol: { ios: 'drop.fill', android: 'water_drop', web: 'water_drop' } },
  grass: { label: 'Pflanze', color: '#3DCB6C', symbol: { ios: 'leaf.fill', android: 'eco', web: 'eco' } },
  lightning: { label: 'Elektro', color: '#FFD23D', symbol: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' } },
  psychic: { label: 'Psycho', color: '#B05CFF', symbol: { ios: 'hurricane', android: 'cyclone', web: 'cyclone' } },
  fighting: { label: 'Kampf', color: '#C9845A', symbol: { ios: 'hand.raised.fill', android: 'sports_mma', web: 'sports_mma' } },
  darkness: { label: 'Unlicht', color: '#6B6F8E', symbol: { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' } },
  metal: { label: 'Metall', color: '#9AA3B5', symbol: { ios: 'shield.fill', android: 'shield', web: 'shield' } },
  dragon: { label: 'Drache', color: '#C9A23D', symbol: { ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' } },
  fairy: { label: 'Fee', color: '#FF8FCB', symbol: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' } },
  colorless: { label: 'Farblos', color: '#B9BCC8', symbol: { ios: 'star.fill', android: 'star', web: 'star' } },
};

/** Reihenfolge der Filter-Chips: die sechs Haupt-Elemente zuerst. */
export const ELEMENT_ORDER: Element[] = [
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

/** Seltenheitsstufen: Name, Sterne und Farbe im Verteilungsbalken. */
export const rarityInfo: Record<RarityTier, { label: string; stars: number; color: string }> = {
  common: { label: 'Häufig', stars: 1, color: '#8A90A8' },
  uncommon: { label: 'Selten', stars: 2, color: '#3DCB6C' },
  rare: { label: 'Rare', stars: 3, color: '#3DA5FF' },
  holo: { label: 'Holo', stars: 3, color: '#8B5CFF' },
  ultra: { label: 'Ultra', stars: 4, color: '#FF4FD8' },
  secret: { label: 'Secret', stars: 5, color: '#FFC94D' },
};

/** Abzeichen-Stufen. Holo trägt den Verlauf statt einer Farbe. */
export const tierInfo: Record<AchievementTier, { label: string; colors: string[] }> = {
  bronze: { label: 'Bronze', colors: ['#E0A47A', '#A8673F'] },
  silver: { label: 'Silber', colors: ['#E3E8F2', '#9AA3B5'] },
  gold: { label: 'Gold', colors: ['#FFE08A', '#D9A21F'] },
  holo: { label: 'Holo', colors: ['#4FE3FF', '#8B5CFF', '#FF4FD8', '#FFC94D'] },
};

/**
 * Schrift: SF Pro Rounded auf iOS, Inter oder die Systemschrift im Browser,
 * Roboto auf Android. Gerundet nur für Titel und Zahlen; Fließtext bleibt in der
 * normalen Systemschrift, weil sie bei kleinen Graden besser lesbar ist.
 */
export const roundedFont: string | undefined = Platform.select({
  ios: 'ui-rounded',
  web: "ui-rounded, 'SF Pro Rounded', Inter, system-ui, sans-serif",
  default: undefined,
});

const rounded = roundedFont ? { fontFamily: roundedFont } : {};

/**
 * Schriftgrade laut Moodboard (Large Title 34, Title 28, Headline 17, Body 17,
 * Caption 13) plus die übrigen iOS-Textstile. Text skaliert mit der
 * Systemschriftgröße (Dynamic Type); die App sperrt das nirgends.
 */
export const type = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '700', letterSpacing: -0.5, ...rounded },
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700', ...rounded },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: '600', ...rounded },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700', ...rounded },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600', ...rounded },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600', ...rounded },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof type;

/** Preise mit Ziffern fester Breite, damit Kurse beim Aktualisieren nicht springen. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

/** Abstände im 8-Punkt-Raster. */
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Mindestgröße einer Tippfläche laut Richtlinie: 44 × 44 Punkt. */
export const MIN_TOUCH = 44;

/** Radien laut Moodboard: 20 für Flächen, 12 für Elemente darin. */
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

/** Inhalte bleiben auf iPad und im Browser lesbar schmal. */
export const MAX_CONTENT_WIDTH = 760;

/** Seitenverhältnis einer Sammelkarte (63 × 88 mm). */
export const CARD_ASPECT = 63 / 88;
