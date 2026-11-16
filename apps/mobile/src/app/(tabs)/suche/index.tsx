import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, TextInput, View } from 'react-native';

import { useSearch } from '@/api/queries';
import { formatMoney } from '@/components/format';
import { Row } from '@/components/list';
import { ErrorView, MessageView } from '@/components/states';
import { scrollProps } from '@/components/tab-stack';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space, type } from '@/theme/theme';
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

export default function SucheScreen() {
  const router = useRouter();
  const colors = usePalette();
  const [text, setText] = useState('');
  const query = useDebounced(text.trim());
  const search = useSearch(query);
  const cards = query.length >= 2 ? (search.data?.cards ?? []) : [];
  const nativeSearchBar = Platform.OS !== 'web';

  return (
    <>
      {/* Auf dem Gerät das Suchfeld des Systems in der Navigationsleiste. */}
      {nativeSearchBar ? (
        <Stack.Screen
          options={{
            headerSearchBarOptions: {
              placeholder: 'Kartenname',
              hideWhenScrolling: false,
              onChangeText: (event) => setText(event.nativeEvent.text),
              onCancelButtonPress: () => setText(''),
            },
          }}
        />
      ) : null}
      <FlatList
        {...scrollProps}
        data={cards}
        keyExtractor={(card) => card.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          nativeSearchBar ? undefined : (
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Kartenname"
              placeholderTextColor={colors.tertiaryLabel}
              accessibilityLabel="Karten suchen"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
              style={[styles.input, type.body, { color: colors.label, backgroundColor: colors.fill }]}
            />
          )
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              { backgroundColor: colors.surface },
              index === 0 && styles.first,
              index === cards.length - 1 && styles.last,
            ]}>
            <Row
              title={item.name}
              subtitle={[item.setName, item.number].filter(Boolean).join(' · ')}
              value={formatMoney(item.price)}
              isLast={index === cards.length - 1}
              onPress={() => router.push({ pathname: '/karte/[cardId]', params: { cardId: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          search.error ? (
            <ErrorView error={search.error} onRetry={() => void search.refetch()} />
          ) : query.length < 2 ? (
            <MessageView
              symbol={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              title="Karten suchen"
              description="Gib mindestens zwei Buchstaben eines Kartennamens ein."
            />
          ) : search.isFetching ? undefined : (
            <MessageView
              symbol={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              title={`Keine Treffer für „${query}“`}
              description="Prüfe die Schreibweise oder suche nach einem Teil des Namens."
            />
          )
        }
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
    padding: space.md,
    paddingBottom: space.xl,
  },
  input: {
    minHeight: MIN_TOUCH,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    marginBottom: space.md,
  },
  first: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  last: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
});
