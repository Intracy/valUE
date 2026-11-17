import type { CardSummary, Money } from '@value/api-types';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { CARD_ASPECT, MIN_TOUCH, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';
import { Price, useMoney } from './currency';
import { rarityTier } from './rarity';
import { ChangePill, ElementBadge, Stars } from './ui';

interface Props {
  card: CardSummary & { setName?: string };
  /** Rechte Zahl; ohne Angabe der Tagespreis der Karte. */
  value?: Money | null;
  /** Prozent-Pille unter dem Wert, etwa im Markt. */
  changePercent?: number | null;
  /** Zusatz unter dem Namen, etwa "2× in der Sammlung". */
  detail?: string;
  onPress: () => void;
  isLast?: boolean;
}

const THUMB = 40;

/**
 * Karte als Listenzeile, wie "Top-Karten" im Moodboard: Vorschau, Name,
 * Element und Seltenheit, rechts der Wert.
 */
export function CardRow({ card, value, changePercent, detail, onPress, isLast }: Props) {
  const colors = usePalette();
  const money = useMoney();
  const shown = value === undefined ? card.price : value;
  const subtitle = detail ?? [card.setName, card.number].filter(Boolean).join(' · ');
  // Zeile und Preis sind getrennte Tippflächen: Die Zeile öffnet die Karte, der
  // Preis schaltet Dollar/Euro um. Ineinander geschachtelt wären sie im Browser
  // ungültiges HTML (Button im Button).
  return (
    <View style={[styles.row, !isLast && { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${card.name}, ${subtitle}, ${money(shown)}`}
        accessibilityHint="Öffnet die Kartendetails"
        style={({ pressed }) => [styles.open, pressed && { backgroundColor: colors.fill }]}>
        <View style={[styles.thumb, { backgroundColor: colors.surfaceRaised }]}>
          {card.imageUrl ? (
            <Image source={card.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" recyclingKey={card.id} />
          ) : null}
        </View>
        <View style={styles.text}>
          <AppText variant="headline" numberOfLines={1}>
            {card.name}
          </AppText>
          <View style={styles.meta}>
            {card.element ? <ElementBadge element={card.element} size={16} /> : null}
            <Stars tier={rarityTier(card.rarity)} />
            <AppText variant="footnote" tone="secondary" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </AppText>
          </View>
        </View>
      </Pressable>
      <View style={styles.right}>
        <Price money={shown} variant="headline" />
        {changePercent !== undefined ? <ChangePill percent={changePercent} size="sm" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingLeft: space.md,
    paddingVertical: 10,
    minHeight: MIN_TOUCH,
  },
  thumb: { width: THUMB, height: THUMB / CARD_ASPECT, borderRadius: 6, overflow: 'hidden' },
  text: { flex: 1, gap: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtitle: { flexShrink: 1 },
  right: { alignItems: 'flex-end', gap: 4, paddingLeft: space.sm, paddingRight: space.md },
});
