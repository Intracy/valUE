import type { SetSummary } from '@value/api-types';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { useCollectionProgress, useSets } from '@/api/queries';
import { formatDate } from '@/components/format';
import { Row } from '@/components/list';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView, MessageView } from '@/components/states';
import { scrollProps } from '@/components/tab-stack';
import { MAX_CONTENT_WIDTH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

export default function SetsScreen() {
  const router = useRouter();
  const colors = usePalette();
  const sets = useSets();
  const progress = useCollectionProgress();

  const owned = useMemo(
    () => new Map((progress.data?.sets ?? []).map((entry) => [entry.setId, entry.ownedCards])),
    [progress.data],
  );

  if (sets.isPending) return <LoadingView />;
  if (sets.error) return <ErrorView error={sets.error} onRetry={() => void sets.refetch()} />;

  const data = sets.data.sets;
  const renderItem = ({ item, index }: { item: SetSummary; index: number }) => {
    const have = owned.get(item.id) ?? 0;
    return (
      <View
        style={[
          styles.cell,
          { backgroundColor: colors.surface },
          index === 0 && styles.first,
          index === data.length - 1 && styles.last,
        ]}>
        <Row
          title={item.name}
          subtitle={[item.series, formatDate(item.releaseDate)].filter(Boolean).join(' · ')}
          value={`${have}/${item.cardCount}`}
          isLast={index === data.length - 1}
          onPress={() => router.push({ pathname: '/sets/[setId]', params: { setId: item.id } })}>
          <View style={styles.progress}>
            <ProgressBar value={have} total={item.cardCount} label={`Fortschritt ${item.name}`} />
          </View>
        </Row>
      </View>
    );
  };

  return (
    <FlatList
      {...scrollProps}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      initialNumToRender={14}
      windowSize={9}
      refreshControl={
        <RefreshControl
          refreshing={sets.isRefetching}
          onRefresh={() => {
            void sets.refetch();
            void progress.refetch();
          }}
        />
      }
      ListEmptyComponent={
        <MessageView
          symbol={{ ios: 'square.grid.2x2', android: 'style', web: 'style' }}
          title="Noch keine Sets"
          description="Der Server hat noch keinen Abgleich mit der Datenquelle gemacht."
        />
      }
    />
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
  cell: { overflow: 'hidden' },
  first: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  last: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  progress: { marginTop: space.sm },
});
