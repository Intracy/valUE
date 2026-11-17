import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';

import { queryClient } from '@/api/queries';
import { CurrencyProvider } from '@/components/currency';
import { AppearanceProvider } from '@/theme/appearance';
import { usePalette, useScheme } from '@/theme/use-palette';

/** Navigations-Thema aus der Palette des Moodboards: Hintergrund, Leisten, Akzent. */
function Themed({ children }: { children: ReactNode }) {
  const scheme = useScheme();
  const colors = usePalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: String(colors.tint),
          background: String(colors.background),
          card: String(colors.background),
          text: String(colors.label),
          border: String(colors.separator),
        },
      }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <CurrencyProvider>
        <Themed>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="karte/[cardId]"
              options={{ title: 'Kartendetail', headerBackTitle: 'Zurück', headerShadowVisible: false }}
            />
          </Stack>
        </Themed>
        </CurrencyProvider>
      </AppearanceProvider>
    </QueryClientProvider>
  );
}
