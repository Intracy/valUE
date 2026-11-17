import type { SetSummary } from '@value/api-types';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { useCollectionProgress, useSets } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { Ring } from '@/components/charts';
import { formatDate } from '@/components/format';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView, MessageView } from '@/components/states';
import { scrollProps } from '@/components/tab-stack';
import { Segmented } from '@/components/ui';
import { MAX_CONTENT_WIDTH, radius, space } from '@/theme/theme';
import { usePalette, useScheme } from '@/theme/use-palette';

type View_ = 'angefangen' | 'alle';
const VIEWS: { value: View_; label: string }[] = [
  { value: 'angefangen', label: 'Meine Sets' },
  { value: 'alle', label: 'Alle Sets' },
];

/**
 * Sammlung: Sets mit Fortschrittsring. "Meine Sets" zeigt angefangene Sets,
 * die vollständigsten zuerst; "Alle Sets" den ganzen Katalog, neueste zuerst.
 * Ein Tipp öffnet das Master-Set.
 */
export default function SammlungScreen() {
  const router = useRouter();
  const sets = useSets();
  const progress = useCollectionProgress();
  const [view, setView] = useState<View_>('angefangen');

  const owned = useMemo(
    () => new Map((progress.data?.sets ?? []).map((entry) => [entry.setId, entry.ownedCards])),
    [progress.data],
  );

  if (sets.isPending || progress.isPending) return <LoadingView />;
  const error = sets.error ?? progress.error;
  if (error || !sets.data) {
    return (
      <ErrorView
        error={error}
        onRetry={() => {
          void sets.refetch();
          void progress.refetch();
        }}
      />
    );
  }

  const started = sets.data.sets
    .filter((set) => (owned.get(set.id) ?? 0) > 0)
    .sort((a, b) => (owned.get(b.id) ?? 0) / Math.max(1, b.cardCount) - (owned.get(a.id) ?? 0) / Math.max(1, a.cardCount));
  const data = view === 'angefangen' ? started : sets.data.sets;

  return (
    <FlatList
      {...scrollProps}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SetCard
          set={item}
          have={owned.get(item.id) ?? 0}
          onPress={() => router.push({ pathname: '/sammlung/[setId]', params: { setId: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Segmented options={VIEWS} value={view} onChange={setView} label="Ansicht" />
        </View>
      }
      ListEmptyComponent={
        view === 'angefangen' ? (
          <MessageView
            symbol={{ ios: 'rectangle.stack.badge.plus', android: 'collections', web: 'collections' }}
            title="Noch keine Karten"
            description="Scanne deine erste Karte oder öffne unter „Alle Sets“ ein Set und trage Karten per langem Druck ein."
            actionLabel="Karte scannen"
            onAction={() => router.navigate('/scan')}
          />
        ) : (
          <MessageView
            symbol={{ ios: 'square.grid.2x2', android: 'style', web: 'style' }}
            title="Noch keine Sets"
            description="Der Server hat noch keinen Abgleich mit der Datenquelle gemacht."
          />
        )
      }
      contentContainerStyle={styles.list}
      initialNumToRender={12}
      windowSize={9}
      refreshControl={
        <RefreshControl
          refreshing={sets.isRefetching || progress.isRefetching}
          onRefresh={() => {
            void sets.refetch();
            void progress.refetch();
          }}
        />
      }
    />
  );
}

function SetCard({ set, have, onPress }: { set: SetSummary; have: number; onPress: () => void }) {
  const colors = usePalette();
  const scheme = useScheme();
  const total = Math.max(set.cardCount, 1);
  const percent = Math.round((have / total) * 100);
  const complete = set.cardCount > 0 && have >= set.cardCount;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${set.name}, ${have} von ${set.cardCount} Karten${complete ? ', vollständig' : ''}`}
      accessibilityHint="Öffnet das Master-Set"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
        scheme === 'light' && styles.shadow,
      ]}>
      <Ring value={have} total={set.cardCount} size={58} thickness={6} label={`Fortschritt ${set.name}`}>
        <AppText variant="caption" numeric style={styles.bold}>
          {percent} %
        </AppText>
      </Ring>
      <View style={styles.text}>
        <AppText variant="headline" numberOfLines={2}>
          {set.name}
        </AppText>
        <AppText variant="footnote" tone="secondary" numberOfLines={1}>
          {[set.series, formatDate(set.releaseDate)].filter(Boolean).join(' · ')}
        </AppText>
        <View style={styles.progressLine}>
          <View style={styles.flex}>
            <ProgressBar value={have} total={set.cardCount} label={`${set.name}: ${have} von ${set.cardCount}`} height={4} />
          </View>
          <AppText variant="footnote" tone={complete ? 'positive' : 'secondary'} numeric>
            {have}/{set.cardCount}
          </AppText>
        </View>
      </View>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={14} tintColor={colors.tertiaryLabel} />
    </Pressable>
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
  header: { marginBottom: space.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  shadow: { boxShadow: '0 1px 2px rgba(11,13,23,0.04), 0 8px 24px rgba(11,13,23,0.06)' },
  text: { flex: 1, gap: 3 },
  progressLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
});
