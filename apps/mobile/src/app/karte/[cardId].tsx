import type { CardGrade, Grader } from '@value/api-types';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { useCard, useFavorites, useOwnedInSet, useSetQuantity, useToggleFavorite } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { AreaChart } from '@/components/charts';
import { formatCount, formatDate, formatMoney } from '@/components/format';
import { successFeedback, tapFeedback } from '@/components/haptics';
import { HoloFill } from '@/components/holo';
import { Row, Section } from '@/components/list';
import { isShiny, rarityTier } from '@/components/rarity';
import { ErrorView, LoadingView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { ChangePill, ElementBadge, IconButton, Segmented, Stars, Surface } from '@/components/ui';
import { CARD_ASPECT, MIN_TOUCH, radius, rarityInfo, space } from '@/theme/theme';
import { useHolo, usePalette } from '@/theme/use-palette';

type Mode = 'Raw' | Grader;

/**
 * Kartendetail laut Moodboard: großes Motiv mit Holo-Schein, Teilen und
 * Merken, Umschalter Raw / PSA / CGC, Wert-Verlauf und Grading-Population,
 * darunter der eigene Bestand je Variante und die Fakten.
 */
export default function KarteScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const colors = usePalette();
  const holo = useHolo();
  const card = useCard(cardId);
  const setId = card.data?.card.setId ?? '';
  const ownedQuery = useOwnedInSet(setId);
  const setQuantity = useSetQuantity();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const [mode, setMode] = useState<Mode>('Raw');

  if (card.isPending) return <LoadingView />;
  if (card.error) return <ErrorView error={card.error} onRetry={() => void card.refetch()} />;

  const { card: data, printings, history, grades } = card.data;
  const owned = ownedQuery.data?.items.filter((item) => item.cardId === data.id) ?? [];
  const countOf = (printing: string) => owned.find((item) => item.printing === printing)?.quantity ?? 0;
  const total = owned.reduce((sum, item) => sum + item.quantity, 0);
  // Eine Zeile je Variante laut Katalog. "Ohne Variante" nur, wenn es dort Exemplare gibt
  // (etwa aus dem Set-Raster) oder der Katalog keine Varianten kennt.
  const rows = [
    ...printings.map((entry) => entry.printing),
    ...(countOf('') > 0 || printings.length === 0 ? [''] : []),
  ];
  const change = (printing: string, next: number) => {
    if (next > countOf(printing) && owned.length === 0) successFeedback();
    else tapFeedback();
    setQuantity.mutate({ cardId: data.id, setId: data.setId, printing, quantity: Math.max(0, next) });
  };

  const isFavorite = Boolean(favorites.data?.cards.some((entry) => entry.id === data.id));
  const onFavorite = () => {
    tapFeedback();
    toggleFavorite.mutate({
      cardId: data.id,
      favorite: !isFavorite,
      card: { ...data, addedAt: new Date().toISOString() },
    });
  };
  const onShare = () => {
    const text = `${data.name} (${data.setName}${data.number ? `, ${data.number}` : ''}): ${formatMoney(data.price)} · valUE`;
    Share.share({ message: text, title: data.name }).catch(() => undefined);
  };

  const points = history.points;
  const first = points[0];
  const last = points.at(-1);
  const delta = first && last && first.amount > 0 ? ((last.amount - first.amount) / first.amount) * 100 : null;

  const graders = (['PSA', 'CGC', 'BGS', 'SGC'] as Grader[]).filter((grader) => grades.some((grade) => grade.grader === grader));
  const modes: { value: Mode; label: string }[] = [{ value: 'Raw', label: 'Raw' }, ...graders.map((grader) => ({ value: grader, label: grader }))];
  const activeGrades = mode === 'Raw' ? [] : grades.filter((grade) => grade.grader === mode);
  const top = activeGrades[0];
  const shiny = isShiny(data.rarity);
  const tier = rarityTier(data.rarity);

  const art = (
    <View style={[styles.image, { backgroundColor: colors.surfaceRaised }]}>
      {data.imageUrl ? (
        <Image
          source={data.imageUrl}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
          accessibilityLabel={`Abbildung der Karte ${data.name}`}
        />
      ) : (
        <AppText variant="title2" tone="secondary">
          {data.number ?? 'Kein Bild'}
        </AppText>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: data.name }} />
      <ScrollView {...scrollProps} contentContainerStyle={styles.scroll}>
        <Content>
          <View style={styles.toolbar}>
            <View style={styles.badges}>
              {data.element ? <ElementBadge element={data.element} size={24} label /> : null}
              <Stars tier={tier} size="footnote" />
              <AppText variant="footnote" tone="secondary">
                {rarityInfo[tier].label}
              </AppText>
            </View>
            <View style={styles.actions}>
              <IconButton symbol={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} label="Teilen" onPress={onShare} />
              <IconButton
                symbol={isFavorite ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
                label={isFavorite ? 'Nicht mehr beobachten' : 'Beobachten'}
                active={isFavorite}
                onPress={onFavorite}
              />
            </View>
          </View>

          <View style={styles.hero}>
            <View style={[styles.glow, { boxShadow: `0 18px 60px ${shiny ? holo[1] : String(colors.tint)}55` }]}>
              {shiny ? <HoloFill style={styles.frame}>{art}</HoloFill> : <View style={[styles.frame, { backgroundColor: colors.border }]}>{art}</View>}
            </View>
            <AppText variant="title2" accessibilityRole="header" style={styles.center}>
              {data.name}
            </AppText>
            <AppText variant="footnote" tone="secondary" style={styles.center}>
              {[data.setName, data.number].filter(Boolean).join(' · ')}
            </AppText>
          </View>

          <Segmented options={modes} value={mode} onChange={setMode} label="Zustand" />

          <View style={styles.priceBlock}>
            <AppText variant="subheadline" tone="secondary">
              {mode === 'Raw' ? 'Tagespreis ungegradet' : `${mode} ${top?.grade ?? ''}, Durchschnitt aus Verkäufen`}
            </AppText>
            <View style={styles.priceLine}>
              <AppText variant="largeTitle" numeric>
                {formatMoney(mode === 'Raw' ? data.price : (top?.price ?? null))}
              </AppText>
              {mode === 'Raw' ? <ChangePill percent={delta === null ? null : Math.round(delta * 10) / 10} /> : null}
            </View>
            {mode === 'Raw' ? (
              <AppText variant="footnote" tone="secondary">
                Stand {formatDate(data.priceUpdatedAt)}
              </AppText>
            ) : null}
          </View>

          {mode === 'Raw' ? (
            points.length >= 2 ? (
              <Surface style={styles.block}>
                <View style={styles.blockHead}>
                  <AppText variant="headline">Wert-Verlauf</AppText>
                  <AppText variant="footnote" tone="secondary">
                    {points.length} Tage
                  </AppText>
                </View>
                <AreaChart
                  points={points}
                  height={120}
                  label={`Preis von ${formatMoney(first ? { amount: first.amount, currency: history.currency } : null)} am ${formatDate(first?.day)} auf ${formatMoney(last ? { amount: last.amount, currency: history.currency } : null)}`}
                />
              </Surface>
            ) : null
          ) : (
            <GradeBlock grades={activeGrades} />
          )}
          {graders.length === 0 ? (
            <AppText variant="footnote" tone="secondary" style={styles.note}>
              Für diese Karte gibt es noch keine Preise und Population gegradeter Exemplare.
            </AppText>
          ) : null}

          <Section title={total > 0 ? `In meiner Sammlung · ${total}×` : 'In meiner Sammlung'}>
            {rows.map((printing, index) => {
              const count = countOf(printing);
              const label = printing || 'Ohne Variante';
              return (
                <View
                  key={printing || 'ohne'}
                  style={[
                    styles.stepper,
                    index < rows.length - 1 && { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth },
                  ]}>
                  <View style={styles.stepperLabel}>
                    <AppText variant="body">{label}</AppText>
                    <AppText variant="footnote" tone="secondary">
                      {count === 0 ? 'Nicht vorhanden' : `${count} vorhanden`}
                    </AppText>
                  </View>
                  <StepButton
                    label={`${label}: ein Exemplar entfernen`}
                    symbol={{ ios: 'minus', android: 'remove', web: 'remove' }}
                    disabled={count === 0}
                    onPress={() => change(printing, count - 1)}
                  />
                  <StepButton
                    label={`${label}: ein Exemplar hinzufügen`}
                    symbol={{ ios: 'plus', android: 'add', web: 'add' }}
                    onPress={() => change(printing, count + 1)}
                  />
                </View>
              );
            })}
          </Section>

          <Section title="Fakten">
            <Row title="Set" value={data.setName} />
            <Row title="Nummer" value={data.number ?? 'unbekannt'} />
            <Row title="Seltenheit" value={data.rarity ?? 'unbekannt'} />
            <Row title="Set erschienen" value={formatDate(data.setReleaseDate)} />
            <Row title="Niedrigster Preis" value={formatMoney(data.lowPrice)} isLast />
          </Section>

          {printings.length > 0 ? (
            <Section title="Preise je Variante">
              {printings.map((printing, index) => (
                <Row
                  key={printing.printing}
                  title={printing.printing || 'Standard'}
                  value={formatMoney(printing.price)}
                  isLast={index === printings.length - 1}
                />
              ))}
            </Section>
          ) : null}
        </Content>
      </ScrollView>
    </>
  );
}

/**
 * Preise je Note und Grading-Population als Balken. Die Balkenlänge ist die
 * Population im Verhältnis zur häufigsten Note; die Zahl steht daneben.
 */
function GradeBlock({ grades }: { grades: CardGrade[] }) {
  const colors = usePalette();
  const maxPopulation = Math.max(0, ...grades.map((grade) => grade.population ?? 0));
  const totalPopulation = grades.reduce((sum, grade) => sum + (grade.population ?? 0), 0);
  return (
    <Surface style={styles.block}>
      <View style={styles.blockHead}>
        <AppText variant="headline">Grading-Population</AppText>
        {totalPopulation > 0 ? (
          <AppText variant="footnote" tone="secondary" numeric>
            {formatCount(totalPopulation)} gegradet
          </AppText>
        ) : null}
      </View>
      {grades.map((grade) => {
        const label = `${grade.grader} ${grade.grade}`;
        const fraction = maxPopulation > 0 && grade.population ? grade.population / maxPopulation : 0;
        return (
          <View
            key={label}
            style={styles.gradeRow}
            accessible
            accessibilityLabel={`${label}: ${formatMoney(grade.price)}, Population ${grade.population ?? 'unbekannt'}`}>
            <AppText variant="subheadline" numeric style={styles.gradeLabel}>
              {label}
            </AppText>
            <View style={[styles.gradeTrack, { backgroundColor: colors.fill }]}>
              {fraction > 0 ? <HoloFill style={[styles.gradeBar, { width: `${Math.max(4, fraction * 100)}%` }]} /> : null}
            </View>
            <AppText variant="footnote" tone="secondary" numeric style={styles.gradePop}>
              {grade.population === null ? '–' : formatCount(grade.population)}
            </AppText>
            <AppText variant="subheadline" numeric style={styles.gradePrice}>
              {formatMoney(grade.price)}
            </AppText>
          </View>
        );
      })}
    </Surface>
  );
}

function StepButton({
  label,
  symbol,
  onPress,
  disabled,
}: {
  label: string;
  symbol: React.ComponentProps<typeof SymbolView>['name'];
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.stepButton,
        { backgroundColor: colors.fill, opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}>
      <SymbolView name={symbol} size={18} tintColor={colors.tint} />
    </Pressable>
  );
}

const IMAGE_WIDTH = 230;

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm },
  badges: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: space.sm },
  hero: { alignItems: 'center', gap: space.xs, marginBottom: space.lg },
  glow: { borderRadius: radius.lg, marginBottom: space.md },
  frame: { borderRadius: radius.lg, padding: 3 },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_WIDTH / CARD_ASPECT,
    borderRadius: radius.lg - 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  priceBlock: { gap: 2, marginTop: space.md, marginBottom: space.md },
  priceLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  block: { gap: space.sm, marginBottom: space.sm },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  note: { marginBottom: space.sm },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 32 },
  gradeLabel: { width: Platform.OS === 'web' ? 64 : 60, fontWeight: '600' },
  gradeTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  gradeBar: { height: 10, borderRadius: 5 },
  gradePop: { width: 48, textAlign: 'right' },
  gradePrice: { width: 92, textAlign: 'right', fontWeight: '600' },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  stepperLabel: { flex: 1 },
  stepButton: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: MIN_TOUCH / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
