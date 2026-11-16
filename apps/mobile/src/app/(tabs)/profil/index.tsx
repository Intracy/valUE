import type { ScoreTrack } from '@value/api-types';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useProfile } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { formatCount, formatMoney } from '@/components/format';
import { Row, Section } from '@/components/list';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

function ScoreCard({ title, track, hint }: { title: string; track: ScoreTrack; hint: string }) {
  const colors = usePalette();
  const span = track.nextLevelXp - track.levelStartXp;
  const done = track.xp - track.levelStartXp;
  return (
    <View style={[styles.score, { backgroundColor: colors.surface }]}>
      <View style={styles.scoreHead}>
        <AppText variant="headline">{title}</AppText>
        <AppText variant="title2" tone="tint">
          Stufe {track.level}
        </AppText>
      </View>
      <ProgressBar value={done} total={span} label={`${title}, Fortschritt zur nächsten Stufe`} />
      <AppText variant="footnote" tone="secondary">
        {formatCount(track.xp)} XP, noch {formatCount(track.nextLevelXp - track.xp)} bis Stufe {track.level + 1}
      </AppText>
      <AppText variant="footnote" tone="secondary">
        {hint}
      </AppText>
    </View>
  );
}

export default function ProfilScreen() {
  const profile = useProfile();

  let body;
  if (profile.isPending) body = <LoadingView />;
  else if (profile.error) body = <ErrorView error={profile.error} onRetry={() => void profile.refetch()} />;
  else {
    const data = profile.data;
    body = (
      <Content>
        <ScoreCard
          title="Sammelscore"
          track={data.score}
          hint="Jede neue Karte bringt XP, seltene Karten mehr. Doppelte zählen nicht."
        />
        <ScoreCard
          title="Vintage-Score"
          track={data.vintageScore}
          hint="Zählt nur Karten aus Sets, die vor dem Jahr 2000 erschienen sind."
        />
        <Section title="Sammlung">
          <Row title="Verschiedene Karten" value={formatCount(data.uniqueCards)} />
          <Row title="Karten insgesamt" value={formatCount(data.totalCards)} />
          <Row title="Vollständige Sets" value={formatCount(data.completedSets)} />
          <Row title="Wert zum Tagespreis" value={formatMoney(data.collectionValue)} isLast />
        </Section>
        <Section
          title="Konto"
          footer="Dieses Gerät nutzt ein anonymes Konto. Anmeldung mit E-Mail, Apple oder Google und die Achievements folgen.">
          <Row title="Kennung" value={data.userId.slice(0, 8)} isLast />
        </Section>
      </Content>
    );
  }

  return (
    <ScrollView
      {...scrollProps}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={profile.isRefetching && !profile.isPending}
          onRefresh={() => void profile.refetch()}
        />
      }>
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  score: { borderRadius: radius.lg, padding: space.md, gap: space.sm, marginBottom: space.md },
  scoreHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.sm },
});
