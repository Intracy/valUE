import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useCard, useOwnedInSet, useSetQuantity } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { formatDate, formatMoney } from '@/components/format';
import { successFeedback, tapFeedback } from '@/components/haptics';
import { Row, Section } from '@/components/list';
import { Sparkline } from '@/components/sparkline';
import { ErrorView, LoadingView } from '@/components/states';
import { Content, scrollProps } from '@/components/tab-stack';
import { CARD_ASPECT, MIN_TOUCH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

export default function KarteScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const colors = usePalette();
  const card = useCard(cardId);
  const setId = card.data?.card.setId ?? '';
  const ownedQuery = useOwnedInSet(setId);
  const setQuantity = useSetQuantity();

  if (card.isPending) return <LoadingView />;
  if (card.error) return <ErrorView error={card.error} onRetry={() => void card.refetch()} />;

  const { card: data, printings, history } = card.data;
  const quantity =
    ownedQuery.data?.items.filter((item) => item.cardId === data.id).reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  // Die Menge gilt in dieser ersten Fassung für die Karte als Ganzes, noch nicht je Variante.
  const change = (next: number) => {
    if (next > quantity && quantity === 0) successFeedback();
    else tapFeedback();
    setQuantity.mutate({ cardId: data.id, setId: data.setId, quantity: Math.max(0, next) });
  };

  const points = history.points;
  const first = points[0];
  const last = points[points.length - 1];
  const delta = first && last && first.amount > 0 ? ((last.amount - first.amount) / first.amount) * 100 : null;

  return (
    <>
      <Stack.Screen options={{ title: data.name }} />
      <ScrollView {...scrollProps} contentContainerStyle={styles.scroll}>
        <Content>
          <View style={styles.hero}>
            <View style={[styles.image, { backgroundColor: colors.fill }]}>
              {data.imageUrl ? (
                <Image
                  source={data.imageUrl}
                  style={StyleSheet.absoluteFill}
                  contentFit="contain"
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
            <AppText variant="title2" accessibilityRole="header" style={styles.centerText}>
              {data.name}
            </AppText>
            <AppText variant="largeTitle">{formatMoney(data.price)}</AppText>
            <AppText variant="footnote" tone="secondary">
              Tagespreis, Stand {formatDate(data.priceUpdatedAt)}
            </AppText>
          </View>

          <Section title="In meiner Sammlung">
            <View style={styles.stepper}>
              <AppText variant="body" style={styles.stepperLabel}>
                {quantity === 0 ? 'Nicht vorhanden' : `${quantity} vorhanden`}
              </AppText>
              <StepButton
                label="Eine Karte entfernen"
                symbol={{ ios: 'minus', android: 'remove', web: 'remove' }}
                disabled={quantity === 0}
                onPress={() => change(quantity - 1)}
              />
              <StepButton
                label="Eine Karte hinzufügen"
                symbol={{ ios: 'plus', android: 'add', web: 'add' }}
                onPress={() => change(quantity + 1)}
              />
            </View>
          </Section>

          {points.length >= 2 ? (
            <Section title={`Preisverlauf, ${points.length} Tage`}>
              <View style={styles.chart}>
                <Sparkline points={points} />
                <View style={styles.chartLegend}>
                  <AppText variant="footnote" tone="secondary">
                    {formatDate(first?.day)}: {formatMoney(first ? { amount: first.amount, currency: history.currency } : null)}
                  </AppText>
                  {delta !== null ? (
                    <AppText variant="footnote" tone={delta >= 0 ? 'positive' : 'negative'}>
                      {delta >= 0 ? '+' : ''}
                      {delta.toFixed(1).replace('.', ',')} %
                    </AppText>
                  ) : null}
                </View>
              </View>
            </Section>
          ) : null}

          <Section title="Fakten">
            <Row title="Set" value={data.setName} />
            <Row title="Nummer" value={data.number ?? 'unbekannt'} />
            <Row title="Seltenheit" value={data.rarity ?? 'unbekannt'} />
            <Row title="Set erschienen" value={formatDate(data.setReleaseDate)} />
            <Row title="Niedrigster Preis" value={formatMoney(data.lowPrice)} isLast />
          </Section>

          {printings.length > 0 ? (
            <Section title="Varianten" footer="Graded-Preise und Population folgen mit dem Business-Tarif der Datenquelle.">
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

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingBottom: space.xl },
  hero: { alignItems: 'center', gap: space.xs, marginBottom: space.lg },
  image: {
    width: 220,
    height: 220 / CARD_ASPECT,
    borderRadius: radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  centerText: { textAlign: 'center' },
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
  chart: { padding: space.md, gap: space.sm },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between' },
});
