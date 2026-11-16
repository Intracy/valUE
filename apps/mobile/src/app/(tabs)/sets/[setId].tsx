import type { CardSummary } from '@value/api-types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useOwnedInSet, useSet, useSetQuantity } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { CardTile } from '@/components/card-tile';
import { formatMoney } from '@/components/format';
import { successFeedback, tapFeedback } from '@/components/haptics';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView, MessageView } from '@/components/states';
import { scrollProps } from '@/components/tab-stack';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

type Filter = 'alle' | 'fehlend' | 'vorhanden';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'alle', label: 'Alle' },
  { key: 'fehlend', label: 'Fehlend' },
  { key: 'vorhanden', label: 'Vorhanden' },
];

const GAP = space.sm;
const MIN_TILE = 96;

/** Master-Set-Ansicht: alle Karten eines Sets, vorhandene farbig, fehlende ausgegraut. */
export default function SetScreen() {
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const router = useRouter();
  const colors = usePalette();
  const { width: windowWidth } = useWindowDimensions();
  const set = useSet(setId);
  const ownedQuery = useOwnedInSet(setId);
  const setQuantity = useSetQuantity();
  const [filter, setFilter] = useState<Filter>('alle');

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
    if (filter === 'alle') return cards;
    return cards.filter((card) => (owned.has(card.id) ? filter === 'vorhanden' : filter === 'fehlend'));
  }, [cards, filter, owned]);

  const open = useCallback(
    (card: CardSummary) => router.push({ pathname: '/karte/[cardId]', params: { cardId: card.id } }),
    [router],
  );
  const toggle = useCallback(
    (card: CardSummary) => {
      const has = owned.has(card.id);
      if (has) tapFeedback();
      else successFeedback();
      setQuantity.mutate({ cardId: card.id, setId: card.setId, quantity: has ? 0 : 1 });
    },
    [owned, setQuantity],
  );

  if (set.isPending) return <LoadingView />;
  if (set.error) return <ErrorView error={set.error} onRetry={() => void set.refetch()} />;

  const total = set.data.cards.length;
  const have = set.data.cards.reduce((count, card) => count + (owned.has(card.id) ? 1 : 0), 0);
  const missingValue = set.data.cards.reduce(
    (sum, card) => (owned.has(card.id) || !card.price ? sum : sum + card.price.amount),
    0,
  );
  const currency = set.data.cards.find((card) => card.price)?.price?.currency ?? 'USD';

  const header = (
    <View style={styles.header}>
      <View style={styles.progressLine}>
        <AppText variant="subheadline" tone="secondary">
          {have} von {total} Karten
        </AppText>
        {have < total ? (
          <AppText variant="subheadline" tone="secondary">
            Fehlende zusammen {formatMoney({ amount: missingValue, currency })}
          </AppText>
        ) : (
          <AppText variant="subheadline" tone="positive">
            Set vollständig
          </AppText>
        )}
      </View>
      <ProgressBar value={have} total={total} label={`Fortschritt ${set.data.set.name}`} />

      <View style={[styles.segments, { backgroundColor: colors.fill }]} accessibilityRole="tablist">
        {FILTERS.map((entry) => {
          const selected = entry.key === filter;
          return (
            <Pressable
              key={entry.key}
              onPress={() => setFilter(entry.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={[styles.segment, selected && { backgroundColor: colors.surface }]}>
              <AppText variant="footnote" style={selected ? styles.segmentSelected : undefined}>
                {entry.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      <AppText variant="footnote" tone="secondary">
        Tippen öffnet die Karte. Gedrückt halten trägt sie ein oder aus.
      </AppText>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: set.data.set.name }} />
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
            title={filter === 'fehlend' ? 'Nichts fehlt mehr' : 'Keine Karten in dieser Ansicht'}
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
  header: { gap: space.sm, paddingTop: space.md, paddingBottom: space.md },
  progressLine: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  segments: { flexDirection: 'row', borderRadius: radius.sm, padding: 2, marginTop: space.sm },
  segment: {
    flex: 1,
    minHeight: MIN_TOUCH - 4,
    borderRadius: radius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: { fontWeight: '600' },
});
