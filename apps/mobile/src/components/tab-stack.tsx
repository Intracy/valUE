import { Stack } from 'expo-router/stack';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { MAX_CONTENT_WIDTH, space } from '@/theme/theme';

/**
 * Navigationsstapel eines Tabs. Auf iOS mit großem Titel, der beim Scrollen in
 * die Leiste wandert; die Leiste selbst zeichnet das System.
 */
export function TabStack({
  title,
  indexOptions,
  children,
}: {
  title: string;
  /** Weitere Optionen für die Startseite des Tabs, etwa ein eigener Kopf statt der Leiste. */
  indexOptions?: ComponentProps<typeof Stack.Screen>['options'];
  children?: ReactNode;
}) {
  return (
    <Stack screenOptions={{ headerLargeTitleEnabled: true, headerShadowVisible: false, headerBackTitle: 'Zurück' }}>
      <Stack.Screen name="index" options={{ title, ...(typeof indexOptions === 'object' ? indexOptions : {}) }} />
      {children}
    </Stack>
  );
}

/** Begrenzt die Breite auf iPad und im Browser und setzt den Seitenrand. */
export function Content({ children }: { children: ReactNode }) {
  return <View style={styles.content}>{children}</View>;
}

/** Für ScrollView und FlatList: Inhalt unter großem Titel und Tab-Leiste richtig einrücken. */
export const scrollProps = {
  contentInsetAdjustmentBehavior: 'automatic',
  keyboardDismissMode: 'on-drag',
} as const;

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
});
