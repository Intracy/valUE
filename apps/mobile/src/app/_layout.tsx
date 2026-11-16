import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { queryClient } from '@/api/queries';
import { useScheme, useStaticPalette } from '@/theme/use-palette';

export default function RootLayout() {
  const scheme = useScheme();
  const colors = useStaticPalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        value={{
          ...base,
          colors: {
            ...base.colors,
            primary: colors.tint,
            background: colors.groupedBackground,
            card: colors.background,
            text: colors.label,
            border: colors.separator,
          },
        }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="karte/[cardId]" options={{ title: 'Karte', headerBackTitle: 'Zurück' }} />
          {/* Der Scanner ist eine eigene Aufgabe und erscheint deshalb als Blatt über der App. */}
          <Stack.Screen name="scan" options={{ title: 'Scannen', presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
