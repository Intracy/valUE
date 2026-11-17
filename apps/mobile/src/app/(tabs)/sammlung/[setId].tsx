import type { CardSummary, Element } from '@value/api-types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useOwnedInSet, useRemoveCard, useSet, useSetQuantity } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { CardTile } from '@/components/card-tile';
import { Ring } from '@/components/charts';
import { formatMoney } from '@/components/format';
import { successFeedback, tapFeedback } from '@/components/haptics';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView, MessageView } from '@/components/states';
import { scrollProps } from '@/components/tab-stack';
import { Chip, Segmented, Surface } from '@/components/ui';
import { ELEMENT_ORDER, elementInfo, MAX_CONTENT_WIDTH, space } from '@/theme/theme';

type Filter = 'alle' | 'fehlend' | 'vorhanden';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'fehlend', label: 'Fehlend' },
  { value: 'vorhanden', label: 'Vorhanden' },
];

const GAP = space.sm;
const MIN_TILE = 96;

/**
 * Master-Set laut Moodboard: Fortschrittsring und Holo-Balken oben,
 * Element-Chips zum Filtern, darunter das Raster. Vorhandene Karten zeigen ihr
 * Motiv, fehlende nur die Silhouette mit Nummer.
 */
export default function SetScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const set = useSet(setId);
  const ownedQuery = useOwnedInSet(setId);
  const setQuantity = useSetQuantity();
  const removeCard = useRemoveCard();
  const [filter, setFilter] = useState<Filter>('alle');
  const [element, setElement] = useState<Element | null>(null);

  // Spaltenzahl aus der Breite: Handy 3, iPad und Browser entsprechend mehr.
  const width = Math.min(windowWidth, MAX_CONTENT_WIDTH) - 2 * space.md;
  const columns = Math.max(3, Math.floor((width + GAP) / (MIN_TILE + GAP)));
  const tileWidth = Math.floor((width - GAP * (columns - 1)) / columns);

  const owned = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of ownedQuery.data?.items ?? []) {
      map.set(item.cardId, (map.get(item.cardId) ?? 0) + item.quantity);
    }
    return map;
  }, [ownedQuery.data]);

  const cards = set.data?.cards;
  const visible = useMemo(() => {
    if (!cards) return [];
    return cards.filter(
      (card) =>
        (element === null || card.element === element) &&
        (filter === 'alle' || (owned.has(card.id) ? filter === 'vorhanden' : filter === 'fehlend')),
    );
  }, [cards, filter, element, owned]);

  // Nur Elemente anbieten, die im Set vorkommen, mit Anzahl.
  const elements = useMemo(() => {
    const counts = new Map<Element, number>();
    for (const card of cards ?? []) {
      if (card.element) counts.set(card.element, (counts.get(card.element) ?? 0) + 1);
    }
    return ELEMENT_ORDER.filter((key) => counts.has(key)).map((key) => ({ key, count: counts.get(key)! }));
  }, [cards]);

  const open = useCallback(
    (card: CardSummary) => router.push({ pathname: '/karte/[cardId]', params: { cardId: card.id } }),
    [router],
  );
  const toggle = useCallback(
    (card: CardSummary) => {
      // Austragen entfernt alle Varianten der Karte, Eintragen legt ein Exemplar ohne Variante an.
      if (owned.has(card.id)) {
        tapFeedback();
        removeCard.mutate({ cardId: card.id, setId: card.setId });
      } else {
        successFeedback();
        setQuantity.mutate({ cardId: card.id, setId: card.setId, quantity: 1 });
      }
    },
    [owned, setQuantity, removeCard],
  );

  if (set.isPending) return <LoadingView />;
  if (set.error) return <ErrorView error={set.error} onRetry={() => void set.refetch()} />;

  // Größe laut Katalog: Solange der Abgleich nicht alle Karten eines Sets geladen hat,
  // zählt die gemeldete Kartenzahl, damit das Set nicht vorschnell als vollständig gilt.
  const total = Math.max(set.data.set.cardCount, set.data.cards.length);
  const have = set.data.cards.reduce((count, card) => count + (owned.has(card.id) ? 1 : 0), 0);
  const missingValue = set.data.cards.reduce(
    (sum, card) => (owned.has(card.id) || !card.price ? sum : sum + card.price.amount),
    0,
  );

  const currency = set.data.cards.find((card) => card.price)?.price?.currency ?? 'EUR';
  const percent = total > 0 ? Math.round((have / total) * 100) : 0;

  const header = (
    <View style={styles.header}>
      <Surface style={styles.summary}>
        <Ring value={have} total={total} size={112} thickness={10} label={`${set.data.set.name}: ${have} von ${total} Karten`}>
          <AppText variant="title2" numeric>
            {have}
            <AppText variant="subheadline" tone="secondary" numeric>
              {' '}/ {total}
            </AppText>
          </AppText>
          <AppText variant="caption" tone="secondary">
            gesammelt
          </AppText>
        </Ring>
        <View style={styles.summaryText}>
          <AppText variant="title3" numberOfLines={2} accessibilityRole="header">
            {set.data.set.name}
          </AppText>
          <View style={styles.percentLine}>
            <View style={styles.flex}>
              <ProgressBar value={have} total={total} height={8} label={`Fortschritt ${set.data.set.name}`} />
            </View>
            <AppText variant="subheadline" numeric style={styles.bold}>
              {percent} %
            </AppText>
          </View>
          {set.data.cards.length < total ? (
            <AppText variant="footnote" tone="secondary">
              {total - set.data.cards.length} Karten noch nicht abgeglichen
            </AppText>
          ) : have < total ? (
            <AppText variant="footnote" tone="secondary">
              Fehlende zusammen {formatMoney({ amount: Math.round(missingValue * 100) / 100, currency })}
            </AppText>
          ) : (
            <AppText variant="footnote" tone="positive">
              ✓ Master-Set vollständig
            </AppText>
          )}
        </View>
      </Surface>

      {elements.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Alle" selected={element === null} onPress={() => setElement(null)} />
          {elements.map(({ key, count }) => (
            <Chip
              key={key}
              label={elementInfo[key].label}
              element={key}
              count={count}
              selected={element === key}
              onPress={() => setElement(element === key ? null : key)}
            />
          ))}
        </ScrollView>
      ) : null}

      <Segmented options={FILTERS} value={filter} onChange={setFilter} label="Karten anzeigen" />
      <AppText variant="footnote" tone="secondary">
        Tippen öffnet die Karte. Gedrückt halten trägt sie ein oder aus.
      </AppText>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Master-Set' }} />
      <FlatList
        {...scrollProps}
        // Bei anderer Spaltenzahl muss die Liste neu aufgebaut werden.
        key={columns}
        data={visible}
        numColumns={columns}
        keyExtractor={(card) => card.id}
        renderItem={({ item }) => (
          <CardTile card={item} owned={owned.get(item.id) ?? 0} width={tileWidth} onOpen={open} onToggle={toggle} />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <MessageView
            symbol={{ ios: 'checkmark.circle', android: 'inbox', web: 'inbox' }}
            title={filter === 'fehlend' && element === null ? 'Nichts fehlt mehr' : 'Keine Karten in dieser Ansicht'}
          />
        }
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        // Nur die sichtbaren Zeilen werden gezeichnet. So bleiben auch Sets mit mehreren hundert Karten flüssig.
        initialNumToRender={columns * 6}
        maxToRenderPerBatch={columns * 6}
        windowSize={7}
        removeClippedSubviews
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    paddingHorizontal: space.md,
    paddingBottom: space.xl,
  },
  row: { gap: GAP, marginBottom: GAP },
  header: { gap: space.md, paddingTop: space.md, paddingBottom: space.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  summaryText: { flex: 1, gap: space.xs },
  percentLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  chips: { gap: space.sm, paddingVertical: 2 },
});
