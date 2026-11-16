import { useColorScheme } from '@/hooks/use-color-scheme';

import { palette, staticPalette } from './theme';

export function useScheme(): 'light' | 'dark' {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function usePalette() {
  return palette(useScheme());
}

export function useStaticPalette() {
  return staticPalette(useScheme());
}
