import type { CardSummary } from '@value/api-types';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { CARD_ASPECT, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';

interface Props {
  card: CardSummary;
  owned: number;
  width: number;
  onOpen: (card: CardSummary) => void;
  onToggle: (card: CardSummary) => void;
}

/**
 * Eine Karte im Master-Set-Raster. Vorhandene Karten sind farbig, fehlende
 * ausgegraut. Tippen öffnet die Details, langes Drücken trägt die Karte ein
 * oder aus. Die Sprachausgabe bietet dasselbe als eigene Aktion an.
 */
export const CardTile = memo(function CardTile({ card, owned, width, onOpen, onToggle }: Props) {
  const colors = usePalette();
  const has = owned > 0;
  const toggleLabel = has ? 'Aus der Sammlung entfernen' : 'Zur Sammlung hinzufügen';

  return (
    <Pressable
      onPress={() => onOpen(card)}
      onLongPress={() => onToggle(card)}
      delayLongPress={350}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.6 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={`${card.name}, Nummer ${card.number ?? 'unbekannt'}, ${has ? `${owned} in der Sammlung` : 'fehlt'}`}
      accessibilityHint="Öffnet die Kartendetails"
      accessibilityActions={[{ name: 'toggle', label: toggleLabel }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'toggle') onToggle(card);
      }}>
      <View
        style={[
          styles.frame,
          { width, height: width / CARD_ASPECT, backgroundColor: colors.fill },
          !has && styles.missing,
        ]}>
        {card.imageUrl ? (
          <Image
            source={card.imageUrl}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            recyclingKey={card.id}
            cachePolicy="memory-disk"
            transition={120}
            accessible={false}
          />
        ) : (
          <View style={styles.placeholder}>
            <AppText variant="headline" tone="secondary">
              {card.number?.split('/')[0] ?? '?'}
            </AppText>
          </View>
        )}
        {owned > 1 ? (
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <AppText variant="caption" style={styles.badgeText}>
              ×{owned}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="caption" tone={has ? 'primary' : 'secondary'} numberOfLines={1} style={styles.name}>
        {card.name}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  frame: { borderRadius: radius.sm, overflow: 'hidden' },
  // iOS kennt für Ansichten keinen Graustufen-Filter; dort trägt die Deckkraft allein.
  missing: Platform.select({
    ios: { opacity: 0.3 },
    default: { opacity: 0.35, filter: 'grayscale(1)' },
  }) ?? { opacity: 0.3 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: space.xs,
    right: space.xs,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontWeight: '700' },
  name: { marginTop: space.xs },
});
