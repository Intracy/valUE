import type { PortfolioRange } from '@value/api-types';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePortfolio, useProfile } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { CardRow } from '@/components/card-row';
import { AreaChart } from '@/components/charts';
import { Price, useMoney } from '@/components/currency';
import { formatCount, formatDate } from '@/components/format';
import { Wordmark } from '@/components/holo';
import { ErrorView, LoadingView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { ChangePill, HoloButton, SectionHeader, Segmented, Surface } from '@/components/ui';
import { MIN_TOUCH, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

const RANGES: { value: PortfolioRange; label: string; long: string }[] = [
  { value: '1T', label: '1T', long: 'seit gestern' },
  { value: '1W', label: '1W', long: 'in 7 Tagen' },
  { value: '1M', label: '1M', long: 'in 30 Tagen' },
  { value: '1J', label: '1J', long: 'in einem Jahr' },
  { value: 'Max', label: 'Max', long: 'insgesamt' },
];

/**
 * Startseite laut Moodboard: Gesamtwert groß, Veränderung als Pille, Verlauf
 * mit Holo-Linie, Zeitraum darunter, dann die wertvollsten Karten.
 */
export default function PortfolioScreen() {
  const router = useRouter();
  const colors = usePalette();
  const insets = useSafeAreaInsets();
  // Im breiten Browserfenster steht die Wortmarke schon in der Leiste oben. Erst nach
  // dem Laden entscheiden, damit vorgerenderte Seite und erste Darstellung gleich sind.
  const { width } = useWindowDimensions();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const wideWeb = Platform.OS === 'web' && hydrated && width >= 700;
  const [range, setRange] = useState<PortfolioRange>('1M');
  const portfolio = usePortfolio(range);
  const profile = useProfile();
  const money = useMoney();

  const initials = (profile.data?.displayName ?? '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const header = (
    <View style={[styles.header, wideWeb && styles.headerWide]}>
      {wideWeb ? null : <Wordmark size={30} />}
      <Pressable
        onPress={() => router.navigate('/profil')}
        accessibilityRole="button"
        accessibilityLabel="Profil öffnen"
        style={({ pressed }) => [styles.avatar, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}>
        {initials ? (
          <AppText variant="subheadline" style={styles.initials}>
            {initials}
          </AppText>
        ) : (
          <SymbolView name={{ ios: 'person.fill', android: 'person', web: 'person' }} size={20} tintColor={colors.label} />
        )}
      </Pressable>
    </View>
  );

  let body;
  if (portfolio.isPending) body = <LoadingView />;
  else if (portfolio.error) body = <ErrorView error={portfolio.error} onRetry={() => void portfolio.refetch()} />;
  else if (portfolio.data.uniqueCards === 0) {
    body = (
      <Surface style={styles.empty}>
        <SymbolView name={{ ios: 'sparkles.rectangle.stack', android: 'collections', web: 'collections' }} size={44} tintColor={colors.tint} />
        <AppText variant="title2" style={styles.center}>
          Dein Portfolio ist noch leer
        </AppText>
        <AppText variant="subheadline" tone="secondary" style={styles.center}>
          Scanne deine erste Karte. valUE zeigt dann hier den Wert deiner Sammlung und wie er sich entwickelt.
        </AppText>
        <HoloButton
          label="Karte scannen"
          symbol={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
          onPress={() => router.navigate('/scan')}
          style={styles.emptyButton}
        />
      </Surface>
    );
  } else {
    const data = portfolio.data;
    const current = RANGES.find((entry) => entry.value === range)!;
    const first = data.points[0];
    body = (
      <>
        <View style={styles.value}>
          <AppText variant="subheadline" tone="secondary">
            Mein Portfolio
          </AppText>
          <View style={styles.valueLine}>
            <View style={styles.flexShrink}>
              <Price money={data.value} variant="display" accessibilityRole="header" adjustsFontSizeToFit numberOfLines={1} />
            </View>
            <ChangePill percent={data.change?.percent ?? null} />
          </View>
          {data.change && data.value ? (
            <AppText variant="footnote" tone={data.change.amount >= 0 ? 'positive' : 'negative'} numeric>
              {data.change.amount >= 0 ? '+' : '−'}
              {money({ amount: Math.abs(data.change.amount), currency: data.value.currency }).replace('≈ ', '')} {current.long}
            </AppText>
          ) : null}
        </View>

        <AreaChart
          points={data.points}
          height={190}
          label={
            first && data.value
              ? `Wertverlauf ${current.long}: von ${money({ amount: first.amount, currency: data.value.currency })} am ${formatDate(first.day)} auf ${money(data.value)}`
              : 'Noch kein Verlauf'
          }
        />

        <Segmented options={RANGES} value={range} onChange={setRange} label="Zeitraum" />

        <View style={styles.stats}>
          <Stat label="Karten" value={formatCount(data.totalCards)} />
          <Stat label="Verschiedene" value={formatCount(data.uniqueCards)} />
          <Stat label="Sammelscore" value={profile.data ? `Lv. ${profile.data.score.level}` : '–'} />
        </View>

        <SectionHeader title="Top-Karten" action="Sammlung" onAction={() => router.navigate('/sammlung')} />
        <Surface padded={false} style={styles.list}>
          {data.topCards.map((card, index) => (
            <CardRow
              key={card.id}
              card={card}
              value={card.value}
              detail={`${card.quantity}× · ${card.setName}`}
              isLast={index === data.topCards.length - 1}
              onPress={() => router.push({ pathname: '/karte/[cardId]', params: { cardId: card.id } })}
            />
          ))}
        </Surface>
      </>
    );
  }

  return (
    <ScrollView
      {...scrollProps}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={portfolio.isRefetching && !portfolio.isPending}
          onRefresh={() => {
            void portfolio.refetch();
            void profile.refetch();
          }}
        />
      }>
      <Content>
        {header}
        {body}
      </Content>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Surface style={styles.stat}>
      <AppText variant="headline" numeric>
        {value}
      </AppText>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </Surface>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  headerWide: { justifyContent: 'flex-end', marginBottom: -MIN_TOUCH },
  avatar: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontWeight: '700' },
  value: { gap: space.xs, marginBottom: space.sm },
  valueLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flexShrink: { flexShrink: 1 },
  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: space.sm + 4 },
  list: { overflow: 'hidden' },
  empty: { alignItems: 'center', gap: space.sm, paddingVertical: space.xl, marginTop: space.lg },
  emptyButton: { marginTop: space.md, alignSelf: 'stretch' },
  center: { textAlign: 'center' },
});
