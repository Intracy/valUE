import '@/global.css';

import { Platform, PlatformColor, type ColorValue, type TextStyle } from 'react-native';

/**
 * Gestaltung nach Apples Human Interface Guidelines.
 *
 * Farben: Auf iOS kommen die semantischen Systemfarben zum Einsatz. Sie passen
 * sich selbst an Hell und Dunkel, an erhöhten Kontrast und an die Ebene an, auf
 * der sie liegen. Android und Web erhalten feste Werte, die diesen Farben entsprechen.
 */
export interface Palette {
  label: ColorValue;
  secondaryLabel: ColorValue;
  tertiaryLabel: ColorValue;
  background: ColorValue;
  groupedBackground: ColorValue;
  /** Fläche einer Zelle oder Karte auf gruppiertem Hintergrund. */
  surface: ColorValue;
  fill: ColorValue;
  separator: ColorValue;
  tint: ColorValue;
  positive: ColorValue;
  negative: ColorValue;
}

const light: Palette = {
  label: '#000000',
  secondaryLabel: 'rgba(60, 60, 67, 0.6)',
  tertiaryLabel: 'rgba(60, 60, 67, 0.3)',
  background: '#FFFFFF',
  groupedBackground: '#F2F2F7',
  surface: '#FFFFFF',
  fill: 'rgba(120, 120, 128, 0.2)',
  separator: 'rgba(60, 60, 67, 0.29)',
  tint: '#5856D6',
  positive: '#34C759',
  negative: '#FF3B30',
};

const dark: Palette = {
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  background: '#000000',
  groupedBackground: '#000000',
  surface: '#1C1C1E',
  fill: 'rgba(120, 120, 128, 0.36)',
  separator: 'rgba(84, 84, 88, 0.6)',
  tint: '#5E5CE6',
  positive: '#30D158',
  negative: '#FF453A',
};

const ios: Palette | null =
  Platform.OS === 'ios'
    ? {
        label: PlatformColor('label'),
        secondaryLabel: PlatformColor('secondaryLabel'),
        tertiaryLabel: PlatformColor('tertiaryLabel'),
        background: PlatformColor('systemBackground'),
        groupedBackground: PlatformColor('systemGroupedBackground'),
        surface: PlatformColor('secondarySystemGroupedBackground'),
        fill: PlatformColor('tertiarySystemFill'),
        separator: PlatformColor('separator'),
        tint: PlatformColor('systemIndigo'),
        positive: PlatformColor('systemGreen'),
        negative: PlatformColor('systemRed'),
      }
    : null;

export const palette = (scheme: 'light' | 'dark'): Palette => ios ?? (scheme === 'dark' ? dark : light);

/** Feste Werte für Stellen, die keine Systemfarbe annehmen (Navigations-Thema, Web). */
export const staticPalette = (scheme: 'light' | 'dark') => (scheme === 'dark' ? dark : light);

/**
 * Schriftgrade der iOS-Textstile. Text skaliert mit der Schriftgröße, die der
 * Nutzer im System gewählt hat (Dynamic Type); die App sperrt das nirgends.
 */
export const type = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof type;

/** Abstände im 8-Punkt-Raster. */
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Mindestgröße einer Tippfläche laut Richtlinie: 44 × 44 Punkt. */
export const MIN_TOUCH = 44;

/** Eckenradius für Karten und Zellen. */
export const radius = { sm: 8, md: 12, lg: 20 } as const;

/** Inhalte bleiben auf iPad und im Browser lesbar schmal. */
export const MAX_CONTENT_WIDTH = 760;

/** Seitenverhältnis einer Sammelkarte (63 × 88 mm). */
export const CARD_ASPECT = 63 / 88;
