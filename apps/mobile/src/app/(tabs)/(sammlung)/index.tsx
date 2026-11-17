import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useCollectionProgress, useProfile, useSets } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { formatCount, formatMoney } from '@/components/format';
import { Row, Section } from '@/components/list';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView, MessageView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

export default function SammlungScreen() {
  const router = useRouter();
  const colors = usePalette();
  const profile = useProfile();
  const progress = useCollectionProgress();
  const sets = useSets();

  const loading = profile.isPending || progress.isPending || sets.isPending;
  const error = profile.error ?? progress.error ?? sets.error;
  const refetch = () => {
    void profile.refetch();
    void progress.refetch();
    void sets.refetch();
  };

  let body;
  if (loading) {
    body = <LoadingView />;
  } else if (error || !profile.data || !progress.data || !sets.data) {
    body = <ErrorView error={error} onRetry={refetch} />;
  } else if (profile.data.uniqueCards === 0) {
    body = (
      <MessageView
        symbol={{ ios: 'rectangle.stack.badge.plus', android: 'collections', web: 'collections' }}
        title="Noch keine Karten"
        description="Scanne deine erste Karte mit der Kamera unten in der Mitte, oder trage sie in einem Set per langem Druck ein."
        actionLabel="Karte scannen"
        onAction={() => router.push('/scan')}
      />
    );
  } else {
    const names = new Map(sets.data.sets.map((set) => [set.id, set.name]));
    const started = [...progress.data.sets].sort(
      (a, b) => b.ownedCards / Math.max(1, b.cardCount) - a.ownedCards / Math.max(1, a.cardCount),
    );
    body = (
      <Content>
        <View style={[styles.summary, { backgroundColor: colors.surface }]}>
          <AppText variant="footnote" tone="secondary">
            Wert der Sammlung zum Tagespreis
          </AppText>
          <AppText variant="largeTitle" accessibilityRole="header">
            {formatMoney(profile.data.collectionValue)}
          </AppText>
          <AppText variant="subheadline" tone="secondary">
            {formatCount(profile.data.uniqueCards)} verschiedene Karten, {formatCount(profile.data.totalCards)} insgesamt
          </AppText>
        </View>

        <Section title="Angefangene Sets">
          {started.map((entry, index) => (
            <Row
              key={entry.setId}
              title={names.get(entry.setId) ?? entry.setId}
              value={`${entry.ownedCards}/${entry.cardCount}`}
              isLast={index === started.length - 1}
              onPress={() => router.push({ pathname: '/sets/[setId]', params: { setId: entry.setId } })}>
              <View style={styles.rowProgress}>
                <ProgressBar
                  value={entry.ownedCards}
                  total={entry.cardCount}
                  label={`Fortschritt ${names.get(entry.setId) ?? ''}`}
                />
              </View>
            </Row>
          ))}
        </Section>
      </Content>
    );
  }

  return (
    <>
      <ScrollView
        {...scrollProps}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={profile.isRefetching && !profile.isPending} onRefresh={refetch} />
        }>
        {body}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  summary: { borderRadius: radius.lg, padding: space.md, gap: space.xs, marginBottom: space.lg },
  rowProgress: { marginTop: space.sm },
});
