import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useFavorites, useMovers, useSearch } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { CardRow } from '@/components/card-row';
import { ErrorView, LoadingView, MessageView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { SectionHeader, Segmented, Surface } from '@/components/ui';
import { MIN_TOUCH, radius, space, type } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

/** Wartet kurz, bis nicht mehr getippt wird. So entsteht nicht pro Buchstabe eine Anfrage. */
function useDebounced(value: string, delayMs = 300): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

type Direction = 'gainers' | 'losers';
const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'gainers', label: '▲ Gewinner' },
  { value: 'losers', label: '▼ Verlierer' },
];
const PERIODS: { value: '1' | '7' | '30'; label: string }[] = [
  { value: '1', label: '24 h' },
  { value: '7', label: '7 Tage' },
  { value: '30', label: '30 Tage' },
];

/**
 * Markt: Kartensuche oben. Ohne Suchbegriff die größten Kursbewegungen im
 * ganzen Katalog und die beobachteten Karten ("Herz" in der Kartenansicht).
 */
export default function MarktScreen() {
  const router = useRouter();
  const colors = usePalette();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [direction, setDirection] = useState<Direction>('gainers');
  const [period, setPeriod] = useState<'1' | '7' | '30'>('7');
  const query = useDebounced(text.trim());
  const search = useSearch(query);
  const movers = useMovers(Number(period));
  const favorites = useFavorites();
  const nativeSearchBar = Platform.OS !== 'web';
  const searching = query.length >= 2;
  const open = (cardId: string) => router.push({ pathname: '/karte/[cardId]', params: { cardId } });

  let body;
  if (searching) {
    const cards = search.data?.cards ?? [];
    body = search.error ? (
      <ErrorView error={search.error} onRetry={() => void search.refetch()} />
    ) : cards.length === 0 ? (
      search.isFetching ? (
        <LoadingView />
      ) : (
        <MessageView
          symbol={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          title={`Keine Treffer für „${query}“`}
          description="Prüfe die Schreibweise oder suche nach einem Teil des Namens."
        />
      )
    ) : (
      <Surface padded={false} style={styles.list}>
        {cards.map((card, index) => (
          <CardRow key={card.id} card={card} isLast={index === cards.length - 1} onPress={() => open(card.id)} />
        ))}
      </Surface>
    );
  } else {
    const list = movers.data ? movers.data[direction] : [];
    body = (
      <>
        <SectionHeader title="Marktbewegung" />
        <View style={styles.controls}>
          <Segmented options={DIRECTIONS} value={direction} onChange={setDirection} label="Richtung" />
          <Segmented options={PERIODS} value={period} onChange={setPeriod} label="Zeitraum" />
        </View>
        {movers.isPending ? (
          <LoadingView />
        ) : movers.error ? (
          <ErrorView error={movers.error} onRetry={() => void movers.refetch()} />
        ) : list.length === 0 ? (
          <Surface>
            <AppText variant="subheadline" tone="secondary">
              Noch keine Bewegung in diesem Zeitraum. Kurse kommen mit jedem täglichen Abgleich dazu.
            </AppText>
          </Surface>
        ) : (
          <Surface padded={false} style={styles.list}>
            {list.map((card, index) => (
              <CardRow
                key={card.id}
                card={card}
                changePercent={card.changePercent}
                isLast={index === list.length - 1}
                onPress={() => open(card.id)}
              />
            ))}
          </Surface>
        )}

        <SectionHeader title="Beobachtet" />
        {favorites.data && favorites.data.cards.length > 0 ? (
          <Surface padded={false} style={styles.list}>
            {favorites.data.cards.map((card, index) => (
              <CardRow key={card.id} card={card} isLast={index === favorites.data.cards.length - 1} onPress={() => open(card.id)} />
            ))}
          </Surface>
        ) : (
          <Surface style={styles.hint}>
            <SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} size={22} tintColor={colors.secondaryLabel} />
            <AppText variant="subheadline" tone="secondary" style={styles.flex}>
              Tippe in einer Karte auf das Herz, um ihren Kurs hier zu verfolgen.
            </AppText>
          </Surface>
        )}
      </>
    );
  }

  return (
    <>
      {/* Auf dem Gerät das Suchfeld des Systems in der Navigationsleiste. */}
      {nativeSearchBar ? (
        <Stack.Screen
          options={{
            headerSearchBarOptions: {
              placeholder: 'Karten suchen',
              hideWhenScrolling: false,
              onChangeText: (event) => setText(event.nativeEvent.text),
              onCancelButtonPress: () => setText(''),
            },
          }}
        />
      ) : null}
      <ScrollView
        {...scrollProps}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={movers.isRefetching}
            onRefresh={() => {
              void movers.refetch();
              void favorites.refetch();
            }}
          />
        }>
        <Content>
          {nativeSearchBar ? null : (
            <View
              style={[
                styles.search,
                { backgroundColor: colors.surface, borderColor: focused ? colors.tint : colors.border },
              ]}>
              <SymbolView name={{ web: 'search' }} size={20} tintColor={colors.secondaryLabel} />
              <TextInput
                value={text}
                onChangeText={setText}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Karten suchen"
                placeholderTextColor={colors.tertiaryLabel}
                accessibilityLabel="Karten suchen"
                autoCorrect={false}
                returnKeyType="search"
                style={[styles.input, type.body, { color: colors.label }]}
              />
            </View>
          )}
          {body}
        </Content>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  search: {
    minHeight: MIN_TOUCH + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, minHeight: MIN_TOUCH, outlineWidth: 0 },
  controls: { gap: space.sm, marginBottom: space.md },
  list: { overflow: 'hidden' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  flex: { flex: 1 },
});
