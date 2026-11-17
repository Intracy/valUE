import type { ScoreTrack } from '@value/api-types';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { useProfile, useUpdateProfile } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { Ring } from '@/components/charts';
import { formatCount, formatMoney } from '@/components/format';
import { HoloFill } from '@/components/holo';
import { Row, Section } from '@/components/list';
import { ProgressBar } from '@/components/progress-bar';
import { ErrorView, LoadingView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { AchievementBadge, RarityBar, SectionHeader, Segmented, Surface } from '@/components/ui';
import { useAppearance, type AppearancePreference } from '@/theme/appearance';
import { MIN_TOUCH, radius, space, type } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

const APPEARANCE: { value: AppearancePreference; label: string }[] = [
  { value: 'dark', label: 'Dunkel' },
  { value: 'light', label: 'Hell' },
  { value: 'system', label: 'System' },
];

const levelProgress = (track: ScoreTrack) => ({
  done: track.xp - track.levelStartXp,
  span: track.nextLevelXp - track.levelStartXp,
});

/**
 * Profil laut Moodboard: Level-Ring ums Profilbild, Sammelscore in XP,
 * Vintage-Score als Holo-Siegel, Abzeichen von Bronze bis Holo und die
 * Verteilung nach Seltenheit. Darunter Darstellung und Konto.
 */
export default function ProfilScreen() {
  const colors = usePalette();
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const { preference, setPreference } = useAppearance();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  let body;
  if (profile.isPending) body = <LoadingView />;
  else if (profile.error) body = <ErrorView error={profile.error} onRetry={() => void profile.refetch()} />;
  else {
    const data = profile.data;
    const score = levelProgress(data.score);
    const vintage = levelProgress(data.vintageScore);
    const initials = (data.displayName ?? '')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const reached = data.achievements.filter((entry) => entry.tier !== null).length;
    const saveName = () => {
      setEditing(false);
      const next = name.trim();
      if (next !== (data.displayName ?? '')) updateProfile.mutate({ displayName: next || null });
    };

    body = (
      <>
        <View style={styles.identity}>
          <Ring value={score.done} total={score.span} size={132} thickness={8} label={`Stufe ${data.score.level}, ${score.done} von ${score.span} XP zur nächsten Stufe`}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceRaised }]}>
              {initials ? (
                <AppText variant="largeTitle">{initials}</AppText>
              ) : (
                <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={44} tintColor={colors.secondaryLabel} />
              )}
            </View>
          </Ring>
          <HoloFill style={styles.levelPill}>
            <AppText variant="subheadline" tone="onHolo" numeric style={styles.bold}>
              Lv. {data.score.level}
            </AppText>
          </HoloFill>
          {editing ? (
            <TextInput
              value={name}
              onChangeText={setName}
              onSubmitEditing={saveName}
              onBlur={saveName}
              autoFocus
              maxLength={40}
              placeholder="Dein Name"
              placeholderTextColor={colors.tertiaryLabel}
              accessibilityLabel="Anzeigename"
              returnKeyType="done"
              style={[styles.nameInput, type.title2, { color: colors.label, borderColor: colors.tint, backgroundColor: colors.surface }]}
            />
          ) : (
            <Pressable
              onPress={() => {
                setName(data.displayName ?? '');
                setEditing(true);
              }}
              accessibilityRole="button"
              accessibilityHint="Anzeigenamen ändern"
              style={styles.nameButton}>
              <AppText variant="title2" tone={data.displayName ? 'primary' : 'secondary'}>
                {data.displayName ?? 'Namen festlegen'}
              </AppText>
              <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} size={16} tintColor={colors.secondaryLabel} />
            </Pressable>
          )}
          <AppText variant="subheadline" tone="secondary">
            {data.rank}
          </AppText>
        </View>

        <View style={styles.scores}>
          <Surface style={styles.scoreCard}>
            <AppText variant="footnote" tone="secondary">
              Sammelscore
            </AppText>
            <AppText variant="title1" numeric>
              {formatCount(data.score.xp)} <AppText variant="headline" tone="secondary">XP</AppText>
            </AppText>
            <ProgressBar value={score.done} total={score.span} label="Sammelscore, Fortschritt zur nächsten Stufe" />
            <AppText variant="caption" tone="secondary" numeric>
              noch {formatCount(data.score.nextLevelXp - data.score.xp)} XP bis Stufe {data.score.level + 1}
            </AppText>
          </Surface>
          <Surface style={styles.vintageCard}>
            <Ring value={vintage.done} total={vintage.span} size={74} thickness={6} label={`Vintage-Score Stufe ${data.vintageScore.level}`}>
              <AppText variant="headline" numeric>
                {data.vintageScore.level}
              </AppText>
            </Ring>
            <AppText variant="footnote" style={styles.bold}>
              Vintage-Score
            </AppText>
            <AppText variant="caption" tone="secondary" numeric>
              {formatCount(data.vintageScore.xp)} XP
            </AppText>
          </Surface>
        </View>
        <AppText variant="footnote" tone="secondary" style={styles.hint}>
          Jede neue Karte bringt XP, seltene mehr. Der Vintage-Score zählt nur Sets vor 2000.
        </AppText>

        <SectionHeader title={`Achievements · ${reached}/${data.achievements.length}`} />
        <Surface>
          <View style={styles.badges}>
            {data.achievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </View>
        </Surface>

        <SectionHeader title="Seltenheiten" />
        <Surface>
          <RarityBar distribution={data.rarityDistribution} />
        </Surface>

        <Section title="Sammlung">
          <Row title="Verschiedene Karten" value={formatCount(data.uniqueCards)} />
          <Row title="Karten insgesamt" value={formatCount(data.totalCards)} />
          <Row title="Vollständige Sets" value={formatCount(data.completedSets)} />
          <Row title="Wert zum Tagespreis" value={formatMoney(data.collectionValue)} isLast />
        </Section>

        <AppText variant="title3" style={styles.sectionTitle} accessibilityRole="header">
          Darstellung
        </AppText>
        <Segmented options={APPEARANCE} value={preference} onChange={setPreference} label="Darstellung" />
        <AppText variant="footnote" tone="secondary" style={styles.hint}>
          Dunkel ist der Standard. „System“ folgt der Einstellung des Geräts.
        </AppText>

        <Section
          title="Konto"
          footer="Dieses Gerät nutzt ein anonymes Konto. Anmeldung mit E-Mail, Apple oder Google folgt.">
          <Row title="Kennung" value={data.userId.slice(0, 8)} isLast />
        </Section>
      </>
    );
  }

  return (
    <ScrollView
      {...scrollProps}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl refreshing={profile.isRefetching && !profile.isPending} onRefresh={() => void profile.refetch()} />
      }>
      <Content>{body}</Content>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  identity: { alignItems: 'center', gap: space.xs, marginBottom: space.lg },
  avatar: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  levelPill: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 4, marginTop: -18 },
  bold: { fontWeight: '700' },
  nameButton: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: MIN_TOUCH, marginTop: space.xs },
  nameInput: {
    minHeight: MIN_TOUCH,
    minWidth: 220,
    textAlign: 'center',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    marginTop: space.xs,
  },
  scores: { flexDirection: 'row', gap: space.sm },
  scoreCard: { flex: 1, gap: space.xs, justifyContent: 'center' },
  vintageCard: { alignItems: 'center', gap: 2, minWidth: 116 },
  hint: { marginTop: space.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: space.md },
  sectionTitle: { marginTop: space.md, marginBottom: space.sm },
});
