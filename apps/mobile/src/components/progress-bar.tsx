import { StyleSheet, View } from 'react-native';

import { usePalette } from '@/theme/use-palette';

interface Props {
  value: number;
  total: number;
  /** Was der Balken misst, für die Sprachausgabe: "Fortschritt Demo-Set". */
  label: string;
}

export function ProgressBar({ value, total, label }: Props) {
  const colors = usePalette();
  const fraction = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <View
      style={[styles.track, { backgroundColor: colors.fill }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: Math.min(value, total), text: `${value} von ${total}` }}>
      <View
        style={[
          styles.bar,
          { width: `${fraction * 100}%`, backgroundColor: fraction >= 1 ? colors.positive : colors.tint },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3 },
});
