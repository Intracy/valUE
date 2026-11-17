import { Stack } from 'expo-router/stack';

import { TabStack } from '@/components/tab-stack';

export default function SammlungLayout() {
  return (
    <TabStack title="Sammlung">
      {/* Im Set zählt das Raster: kleiner Titel, mehr Platz für Karten. */}
      <Stack.Screen name="[setId]" options={{ title: 'Master-Set', headerLargeTitleEnabled: false }} />
    </TabStack>
  );
}
