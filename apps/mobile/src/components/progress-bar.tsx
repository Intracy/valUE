import { StyleSheet, View } from 'react-native';

import { usePalette } from '@/theme/use-palette';

import { HoloFill } from './holo';

interface Props {
  value: number;
  total: number;
  /** Was der Balken misst, für die Sprachausgabe: "Fortschritt Demo-Set". */
  label: string;
  height?: number;
}

/** Fortschrittsbalken mit Holo-Verlauf (Set-Fortschritt laut Moodboard). */
export function ProgressBar({ value, total, label, height = 6 }: Props) {
  const colors = usePalette();
  const fraction = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: colors.fill }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: Math.min(value, total), text: `${value} von ${total}` }}>
      {fraction > 0 ? (
        <HoloFill style={{ width: `${fraction * 100}%`, height, borderRadius: height / 2 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
});
