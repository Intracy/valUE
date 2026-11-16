import type { PricePoint } from '@value/api-types';
import { StyleSheet, View } from 'react-native';

import { usePalette } from '@/theme/use-palette';

/**
 * Preisverlauf als schlichte Säulenreihe, ohne Diagramm-Bibliothek. Die Zahlen
 * dazu stehen als Text daneben; das Bild selbst ist für die Sprachausgabe stumm.
 */
export function Sparkline({ points, height = 64 }: { points: PricePoint[]; height?: number }) {
  const colors = usePalette();
  if (points.length < 2) return null;
  const values = points.map((point) => point.amount);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  return (
    <View style={[styles.row, { height }]} accessible={false} importantForAccessibility="no-hide-descendants">
      {points.map((point) => (
        <View
          key={point.day}
          style={[
            styles.bar,
            { height: 4 + ((point.amount - min) / span) * (height - 4), backgroundColor: colors.tint },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  bar: { flex: 1, borderRadius: 1.5, minWidth: 1 },
});
