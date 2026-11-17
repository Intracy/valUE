import type { PricePoint } from '@value/api-types';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useHolo, usePalette } from '@/theme/use-palette';

import { HoloStops, useSvgId } from './holo';

/** Weiche Linie durch alle Punkte (Catmull-Rom als kubische Bézier-Kurven). */
function smoothPath(xy: [number, number][]): string {
  if (xy.length === 0) return '';
  let d = `M${xy[0]![0]},${xy[0]![1]}`;
  for (let i = 0; i < xy.length - 1; i += 1) {
    const p0 = xy[i - 1] ?? xy[i]!;
    const p1 = xy[i]!;
    const p2 = xy[i + 1]!;
    const p3 = xy[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

/** Höchstens so viele Punkte zeichnen; mehr sieht man auf einem Telefon nicht. */
function thin(points: PricePoint[], max = 160): PricePoint[] {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => points[Math.round(i * step)]!);
}

function useWidth(): [number, (event: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  return [width, (event) => setWidth(Math.round(event.nativeEvent.layout.width))];
}

interface ChartProps {
  points: PricePoint[];
  height?: number;
  /** Was das Diagramm zeigt, für die Sprachausgabe, etwa "Wert in 30 Tagen von … auf …". */
  label: string;
}

/**
 * Flächendiagramm mit Holo-Linie, wie der Portfolio-Verlauf im Moodboard.
 * Die Fläche verläuft nach unten in den Hintergrund.
 */
export function AreaChart({ points, height = 180, label }: ChartProps) {
  const colors = usePalette();
  const holo = useHolo();
  const [width, onLayout] = useWidth();
  const stroke = useSvgId('stroke');
  const fade = useSvgId('fade');
  const data = thin(points);

  let line = '';
  let area = '';
  let last: [number, number] | null = null;
  if (width > 0 && data.length >= 2) {
    const values = data.map((point) => point.amount);
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    const pad = 8;
    const xy = data.map(
      (point, i): [number, number] => [
        (i / (data.length - 1)) * (width - 8),
        pad + (1 - (point.amount - min) / span) * (height - pad * 2 - 16),
      ],
    );
    line = smoothPath(xy);
    last = xy.at(-1) ?? null;
    area = `${line} L${last?.[0] ?? width},${height} L0,${height} Z`;
  }

  return (
    <View
      style={{ height }}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}>
      {line ? (
        <Svg width={width} height={height}>
          <Defs>
            <HoloStops id={stroke} colors={holo} />
            <LinearGradient id={fade} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={String(colors.background)} stopOpacity="0" />
              <Stop offset="1" stopColor={String(colors.background)} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${stroke})`} opacity={0.32} />
          <Rect x="0" y="0" width={width} height={height} fill={`url(#${fade})`} />
          <Path d={line} stroke={`url(#${stroke})`} strokeWidth={3} fill="none" strokeLinecap="round" />
          {last ? <Circle cx={last[0]} cy={last[1]} r={5} fill={holo.at(-1)} stroke={String(colors.background)} strokeWidth={2} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

/** Kleiner Verlauf ohne Achsen, etwa in der Kartenansicht. Für die Sprachausgabe stumm. */
export function Sparkline({ points, height = 48, width: fixed }: { points: PricePoint[]; height?: number; width?: number }) {
  const holo = useHolo();
  const [measured, onLayout] = useWidth();
  const id = useSvgId('spark');
  const width = fixed ?? measured;
  const data = thin(points, 60);
  let line = '';
  if (width > 0 && data.length >= 2) {
    const values = data.map((point) => point.amount);
    const min = Math.min(...values);
    const span = Math.max(...values) - min || 1;
    line = smoothPath(
      data.map((point, i): [number, number] => [
        2 + (i / (data.length - 1)) * (width - 4),
        3 + (1 - (point.amount - min) / span) * (height - 6),
      ]),
    );
  }
  return (
    <View
      style={{ height, width: fixed }}
      onLayout={fixed ? undefined : onLayout}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {line ? (
        <Svg width={width} height={height}>
          <Defs>
            <HoloStops id={id} colors={holo} />
          </Defs>
          <Path d={line} stroke={`url(#${id})`} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </Svg>
      ) : null}
    </View>
  );
}

interface RingProps {
  value: number;
  total: number;
  size?: number;
  thickness?: number;
  label: string;
  children?: ReactNode;
}

/** Fortschrittsring mit Holo-Verlauf: Set-Fortschritt, Level ums Profilbild. */
export function Ring({ value, total, size = 120, thickness = 10, label, children }: RingProps) {
  const colors = usePalette();
  const holo = useHolo();
  const id = useSvgId('ring');
  const fraction = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: total, now: Math.min(value, total) }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <HoloStops id={id} colors={holo} vertical />
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={String(colors.fill)} strokeWidth={thickness} fill="none" />
        {fraction > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${id})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference * fraction} ${circumference}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <View style={styles.ringCenter}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
