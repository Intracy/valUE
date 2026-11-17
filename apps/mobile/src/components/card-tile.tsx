import type { CardSummary } from '@value/api-types';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { CARD_ASPECT, elementInfo, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';
import { HoloFill } from './holo';
import { isShiny } from './rarity';
import { ElementBadge } from './ui';

interface Props {
  card: CardSummary;
  owned: number;
  width: number;
  onOpen: (card: CardSummary) => void;
  onToggle: (card: CardSummary) => void;
}

const shortNumber = (card: CardSummary) => card.number?.split('/')[0] ?? '?';

/**
 * Eine Karte im Master-Set-Raster. Vorhandene Karten zeigen ihr Motiv mit
 * Rahmen (Holo-Rahmen bei Holo-, Ultra- und Secret-Karten), fehlende nur als
 * Silhouette mit Nummer. Tippen öffnet die Details, langes Drücken trägt die
 * Karte ein oder aus. Die Sprachausgabe bietet dasselbe als eigene Aktion an.
 */
export const CardTile = memo(function CardTile({ card, owned, width, onOpen, onToggle }: Props) {
  const colors = usePalette();
  const has = owned > 0;
  const toggleLabel = has ? 'Aus der Sammlung entfernen' : 'Zur Sammlung hinzufügen';
  const height = width / CARD_ASPECT;
  const shiny = has && isShiny(card.rarity);
  const frameColor = card.element ? elementInfo[card.element].color : colors.border;

  const art = (
    <View style={[styles.art, { backgroundColor: colors.surfaceRaised }]}>
      {card.imageUrl ? (
        <Image
          source={card.imageUrl}
          style={[StyleSheet.absoluteFill, !has && styles.silhouette]}
          contentFit="cover"
          recyclingKey={card.id}
          cachePolicy="memory-disk"
          transition={120}
          accessible={false}
        />
      ) : null}
      {!has ? (
        <View style={[StyleSheet.absoluteFill, styles.missingCover]}>
          <AppText variant="headline" tone="tertiary" numeric>
            {shortNumber(card).padStart(3, '0')}
          </AppText>
        </View>
      ) : null}
      {has && card.element ? (
        <View style={styles.element}>
          <ElementBadge element={card.element} size={18} />
        </View>
      ) : null}
      {has ? (
        <View style={[styles.number, { backgroundColor: colors.scrim }]}>
          <AppText variant="caption" numeric style={styles.bold}>
            {owned > 1 ? `×${owned}` : shortNumber(card).padStart(3, '0')}
          </AppText>
        </View>
      ) : null}
    </View>
  );

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
      {shiny ? (
        <HoloFill style={[styles.frame, { width, height }]}>{art}</HoloFill>
      ) : (
        <View
          style={[
            styles.frame,
            { width, height, backgroundColor: has ? frameColor : colors.border },
            !has && styles.missingFrame,
          ]}>
          {art}
        </View>
      )}
      <AppText variant="caption" tone={has ? 'primary' : 'tertiary'} numberOfLines={1} style={styles.name}>
        {card.name}
      </AppText>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  frame: { borderRadius: radius.md, padding: 2 },
  missingFrame: { padding: 1 },
  art: { flex: 1, borderRadius: radius.md - 2, overflow: 'hidden' },
  // Fehlende Karte: Motiv nur als schwacher Umriss.
  silhouette: Platform.select({
    web: { opacity: 0.18, filter: 'grayscale(1) brightness(0.5)' },
    default: { opacity: 0.12 },
  }) ?? { opacity: 0.12 },
  missingCover: { alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  element: { position: 'absolute', top: space.xs, right: space.xs },
  number: {
    position: 'absolute',
    bottom: space.xs,
    right: space.xs,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bold: { fontWeight: '700' },
  name: { marginTop: space.xs },
});
