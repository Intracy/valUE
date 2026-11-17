import { useId, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { roundedFont } from '@/theme/theme';
import { useHolo, usePalette } from '@/theme/use-palette';

/** SVG-IDs dürfen keine Doppelpunkte enthalten, useId liefert welche. */
export const useSvgId = (prefix: string) => `${prefix}${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

/** Verlauf als SVG-Definition, schräg wie im Moodboard (100°). */
export function HoloStops({
  id,
  colors,
  vertical = false,
  span,
}: {
  id: string;
  colors: string[];
  vertical?: boolean;
  /** Feste Strecke in Punkten statt der Größe des Elements, etwa nur über "UE". */
  span?: { from: number; to: number };
}) {
  if (span) {
    return (
      <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={span.from} y1={0} x2={span.to} y2={0}>
        {colors.map((color, index) => (
          <Stop key={color + index} offset={colors.length === 1 ? 0 : index / (colors.length - 1)} stopColor={color} />
        ))}
      </LinearGradient>
    );
  }
  return (
    <LinearGradient id={id} x1="0" y1={vertical ? '1' : '0'} x2={vertical ? '0' : '1'} y2={vertical ? '0' : '0.18'}>
      {colors.map((color, index) => (
        <Stop key={color + index} offset={colors.length === 1 ? 0 : index / (colors.length - 1)} stopColor={color} />
      ))}
    </LinearGradient>
  );
}

/**
 * Fläche mit Holo-Verlauf, etwa für den Haupt-Button oder einen Fortschritt.
 * Der Verlauf liegt als SVG hinter dem Inhalt.
 */
export function HoloFill({
  style,
  colors,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  colors?: string[];
  children?: ReactNode;
}) {
  const holo = useHolo();
  const id = useSvgId('holo');
  return (
    <View style={[styles.clip, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <HoloStops id={id} colors={colors ?? holo} />
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

/**
 * Wortmarke: "val" leise, "UE" fett im Holo-Verlauf. "val" ist normaler Text,
 * "UE" ein eigenes SVG, damit der Verlauf genau über den zwei Buchstaben liegt.
 * Die Sprachausgabe liest den Namen einmal als "valUE".
 */
export function Wordmark({ size = 28 }: { size?: number }) {
  const colors = usePalette();
  const holo = useHolo();
  const id = useSvgId('mark');
  const height = Math.round(size * 1.2);
  const ueWidth = Math.round(size * 1.24);
  return (
    <View accessible accessibilityRole="header" accessibilityLabel="valUE" style={styles.mark}>
      <Text
        style={{
          fontSize: size,
          lineHeight: height,
          fontWeight: '300',
          fontFamily: roundedFont,
          letterSpacing: -size * 0.03,
          color: colors.label,
        }}
        accessible={false}>
        val
      </Text>
      <Svg width={ueWidth} height={height}>
        <Defs>
          <HoloStops id={id} colors={holo} span={{ from: size * 0.05, to: ueWidth * 0.95 }} />
        </Defs>
        <SvgText
          x={0}
          y={size * 0.98}
          fontSize={size}
          fontFamily={roundedFont}
          fontWeight="800"
          letterSpacing={-size * 0.03}
          fill={`url(#${id})`}>
          UE
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  mark: { flexDirection: 'row', alignItems: 'flex-start' },
});
