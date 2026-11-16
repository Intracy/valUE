import { Stack } from 'expo-router/stack';

import { TabStack } from '@/components/tab-stack';

export default function SetsLayout() {
  return (
    <TabStack title="Sets">
      {/* Im Set zählt das Raster: kleiner Titel, mehr Platz für Karten. */}
      <Stack.Screen name="[setId]" options={{ title: '', headerLargeTitleEnabled: false }} />
    </TabStack>
  );
}
