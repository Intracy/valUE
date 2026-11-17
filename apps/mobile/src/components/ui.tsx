import type { Achievement, Element, RarityTier } from '@value/api-types';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  changeTints,
  elementInfo,
  MIN_TOUCH,
  radius,
  rarityInfo,
  space,
  tierInfo,
} from '@/theme/theme';
import { usePalette, useScheme } from '@/theme/use-palette';

import { AppText } from './app-text';
import { HoloFill } from './holo';

/**
 * Fläche laut Moodboard: Radius 20, im Dark Theme eine leicht hellere Fläche
 * mit feiner Linie, im Light Theme weiß mit weichem Schatten.
 */
export function Surface({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}) {
  const colors = usePalette();
  const scheme = useScheme();
  return (
    <View
      style={[
        styles.surface,
        { backgroundColor: colors.surface, borderColor: colors.border },
        scheme === 'light' && styles.lightShadow,
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
}

/** Abschnittstitel über einer Fläche, wie "Top-Karten". Optional mit Aktion rechts. */
export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="title3" accessibilityRole="header">
        {title}
      </AppText>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={12}>
          <AppText variant="subheadline" tone="tint">
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  symbol?: SymbolViewProps['name'];
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

/** Haupt-Aktion mit Holo-Verlauf. Höchstens eine je Bildschirm. */
export function HoloButton({ label, onPress, disabled, symbol, style, accessibilityHint }: ButtonProps) {
  const colors = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [{ opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
      <HoloFill style={styles.button}>
        {symbol ? <SymbolView name={symbol} size={18} tintColor={colors.onHolo} /> : null}
        <AppText variant="headline" tone="onHolo">
          {label}
        </AppText>
      </HoloFill>
    </Pressable>
  );
}

/** Zweite Aktion: Glas-Fläche mit Rahmen. */
export function SecondaryButton({ label, onPress, disabled, symbol, style, accessibilityHint }: ButtonProps) {
  const colors = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.fill, borderColor: colors.border, borderWidth: 1, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
        style,
      ]}>
      {symbol ? <SymbolView name={symbol} size={18} tintColor={colors.label} /> : null}
      <AppText variant="headline">{label}</AppText>
    </Pressable>
  );
}

/** Runde Symbol-Schaltfläche, etwa Teilen und Merken in der Kartenansicht. */
export function IconButton({
  symbol,
  label,
  onPress,
  active,
}: {
  symbol: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  const colors = usePalette();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}>
      <SymbolView name={symbol} size={18} tintColor={active ? colors.negative : colors.label} />
    </Pressable>
  );
}

/**
 * Veränderung als Pille: Pfeil, Prozent und Farbe. Der Pfeil trägt die
 * Richtung, damit sie auch ohne Farbe lesbar ist.
 */
export function ChangePill({ percent, size = 'md' }: { percent: number | null; size?: 'sm' | 'md' }) {
  const colors = usePalette();
  const tints = changeTints(useScheme());
  if (percent === null || !Number.isFinite(percent)) return null;
  const up = percent >= 0;
  const text = `${up ? '▲' : '▼'} ${Math.abs(percent).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
  return (
    <View
      style={[styles.pill, size === 'sm' && styles.pillSmall, { backgroundColor: up ? tints.positive : tints.negative }]}
      accessible
      accessibilityLabel={`${up ? 'Plus' : 'Minus'} ${Math.abs(percent).toLocaleString('de-DE')} Prozent`}>
      <AppText
        variant={size === 'sm' ? 'caption' : 'subheadline'}
        numeric
        style={[styles.pillText, { color: up ? colors.positive : colors.negative }]}>
        {text}
      </AppText>
    </View>
  );
}

/** Element als farbiger Kreis mit Symbol. Mit `label` zusätzlich der Name daneben. */
export function ElementBadge({ element, size = 20, label }: { element: Element; size?: number; label?: boolean }) {
  const info = elementInfo[element];
  const circle = (
    <View
      style={[styles.elementCircle, { width: size, height: size, borderRadius: size / 2, backgroundColor: info.color }]}
      accessible={!label}
      accessibilityLabel={`Element ${info.label}`}>
      <SymbolView name={info.symbol as SymbolViewProps['name']} size={size * 0.58} tintColor="#0B0D17" />
    </View>
  );
  if (!label) return circle;
  return (
    <View style={styles.elementRow} accessible accessibilityLabel={`Element ${info.label}`}>
      {circle}
      <AppText variant="footnote">{info.label}</AppText>
    </View>
  );
}

/** Filter-Chip: "Alle" oder ein Element. Ausgewählt mit Holo-Rand. */
export function Chip({
  label,
  selected,
  onPress,
  element,
  count,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  element?: Element;
  count?: number;
}) {
  const colors = usePalette();
  const content = (
    <View style={[styles.chipInner, { backgroundColor: selected ? colors.surfaceRaised : colors.surface }]}>
      {element ? <ElementBadge element={element} size={18} /> : null}
      <AppText variant="subheadline" style={selected ? styles.bold : undefined}>
        {label}
      </AppText>
      {count !== undefined ? (
        <AppText variant="caption" tone="secondary" numeric>
          {count}
        </AppText>
      ) : null}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={count !== undefined ? `${label}, ${count} Karten` : label}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {selected ? (
        <HoloFill style={styles.chipRing}>{content}</HoloFill>
      ) : (
        <View style={[styles.chipRing, { backgroundColor: colors.border }]}>{content}</View>
      )}
    </Pressable>
  );
}

/** Segment-Umschalter wie Raw / PSA / CGC oder 1T … Max. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const colors = usePalette();
  return (
    <View
      style={[styles.segmented, { backgroundColor: colors.fill }]}
      accessibilityRole={Platform.OS === 'web' ? undefined : 'tablist'}
      accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.surfaceRaised, borderColor: colors.tint, borderWidth: 1 },
            ]}>
            <AppText variant="subheadline" tone={selected ? 'primary' : 'secondary'} style={selected ? styles.bold : undefined}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Seltenheitssterne, etwa "★★★". */
export function Stars({ tier, size = 'caption' }: { tier: RarityTier; size?: 'caption' | 'footnote' }) {
  const info = rarityInfo[tier];
  return (
    <AppText variant={size} style={{ color: info.color }} accessibilityLabel={`Seltenheit ${info.label}`}>
      {'★'.repeat(info.stars)}
    </AppText>
  );
}

/** Verteilung der Karten über die sechs Seltenheitsstufen als gestapelter Balken. */
export function RarityBar({ distribution }: { distribution: { tier: RarityTier; cards: number }[] }) {
  const colors = usePalette();
  const total = distribution.reduce((sum, entry) => sum + entry.cards, 0);
  const summary = distribution.map((entry) => `${rarityInfo[entry.tier].label} ${entry.cards}`).join(', ');
  return (
    <View accessible accessibilityLabel={`Seltenheitsverteilung: ${summary}`} style={styles.rarity}>
      <View style={[styles.rarityTrack, { backgroundColor: colors.fill }]}>
        {total > 0
          ? distribution
              .filter((entry) => entry.cards > 0)
              .map((entry) => (
                <View
                  key={entry.tier}
                  style={{ flex: entry.cards, backgroundColor: rarityInfo[entry.tier].color }}
                />
              ))
          : null}
      </View>
      <View style={styles.rarityLegend}>
        {distribution.map((entry) => (
          <View key={entry.tier} style={styles.rarityItem}>
            <Stars tier={entry.tier} />
            <AppText variant="caption" tone="secondary">
              {rarityInfo[entry.tier].label}
            </AppText>
            <AppText variant="footnote" numeric style={styles.bold}>
              {entry.cards}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const ACHIEVEMENT_SYMBOLS: Record<string, SymbolViewProps['name']> = {
  collector: { ios: 'rectangle.stack.fill', android: 'collections', web: 'collections' },
  'set-master': { ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' },
  variants: { ios: 'square.stack.3d.up.fill', android: 'layers', web: 'layers' },
  secret: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  vintage: { ios: 'hourglass', android: 'hourglass_bottom', web: 'hourglass_bottom' },
  scanner: { ios: 'camera.viewfinder', android: 'photo_camera', web: 'photo_camera' },
};

/** Abzeichen als Medaille: Stufe als Farbe (Holo als Verlauf), Symbol, Titel, Stufe. */
export function AchievementBadge({ achievement, size = 64 }: { achievement: Achievement; size?: number }) {
  const colors = usePalette();
  const tier = achievement.tier ? tierInfo[achievement.tier] : null;
  const symbol =
    (achievement.element ? (elementInfo[achievement.element].symbol as SymbolViewProps['name']) : null) ??
    ACHIEVEMENT_SYMBOLS[achievement.id] ??
    ({ ios: 'star.fill', android: 'star', web: 'star' } as SymbolViewProps['name']);
  const status = tier
    ? achievement.nextTarget !== null
      ? `${tier.label}, ${achievement.progress} von ${achievement.nextTarget} bis zur nächsten Stufe`
      : `${tier.label}, höchste Stufe`
    : `noch nicht erreicht, ${achievement.progress} von ${achievement.nextTarget}`;
  const medal = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.achievement, { width: size + 32 }]} accessible accessibilityLabel={`${achievement.title}: ${achievement.description}, ${status}`}>
      {tier ? (
        <HoloFill colors={tier.colors} style={[medal, styles.medal]}>
          <View style={[styles.medalInner, { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2, backgroundColor: colors.surface }]}>
            <SymbolView
              name={symbol}
              size={size * 0.4}
              tintColor={achievement.element ? elementInfo[achievement.element].color : tier.colors[1]}
            />
          </View>
        </HoloFill>
      ) : (
        <View style={[medal, styles.medal, { backgroundColor: colors.fill, borderColor: colors.border, borderWidth: 1 }]}>
          <SymbolView name={symbol} size={size * 0.4} tintColor={colors.tertiaryLabel} />
        </View>
      )}
      <AppText variant="caption" tone={tier ? 'gold' : 'tertiary'} style={styles.center}>
        {tier ? tier.label : `${achievement.progress}/${achievement.nextTarget}`}
      </AppText>
      <AppText variant="footnote" tone={tier ? 'primary' : 'secondary'} numberOfLines={2} style={styles.center}>
        {achievement.title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  padded: { padding: space.md },
  lightShadow: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(11,13,23,0.04), 0 8px 24px rgba(11,13,23,0.06)' },
    default: {
      shadowColor: '#0B0D17',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  }) as ViewStyle,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillSmall: { paddingHorizontal: 8, paddingVertical: 2 },
  pillText: { fontWeight: '700' },
  elementCircle: { alignItems: 'center', justifyContent: 'center' },
  elementRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipRing: { borderRadius: radius.pill, padding: 1.5 },
  chipInner: {
    minHeight: 36,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bold: { fontWeight: '700' },
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3, gap: 3 },
  segment: {
    flex: 1,
    minHeight: 36,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rarity: { gap: space.sm },
  rarityTrack: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row', gap: 2 },
  rarityLegend: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: space.sm },
  rarityItem: { alignItems: 'center', minWidth: 48, gap: 1 },
  achievement: { alignItems: 'center', gap: 4 },
  medal: { alignItems: 'center', justifyContent: 'center' },
  medalInner: { alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
