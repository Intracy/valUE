import { useAppearance } from './appearance';
import { holoStops, palette, type Scheme } from './theme';

export function useScheme(): Scheme {
  return useAppearance().scheme;
}

export function usePalette() {
  return palette(useScheme());
}

/** Feste Werte (keine Systemfarben), etwa für das Navigations-Thema. */
export const useStaticPalette = usePalette;

export function useHolo(): string[] {
  return holoStops(useScheme());
}
