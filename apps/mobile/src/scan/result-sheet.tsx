import type { ScanCandidate, ScanResponse } from '@value/api-types';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useMoney } from '@/components/currency';
import { HoloFill } from '@/components/holo';
import { rarityTier } from '@/components/rarity';
import { ElementBadge, Stars } from '@/components/ui';
import { CARD_ASPECT, MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

type Step = { kind: 'confirm'; candidate: ScanCandidate } | { kind: 'choose' } | { kind: 'none' };

interface Props {
  result: ScanResponse;
  busy: boolean;
  error: string | null;
  bottomInset: number;
  onConfirm: (candidate: ScanCandidate, printing: string) => void;
  onRetry: () => void;
  onSearch: () => void;
  onClose: () => void;
}

const initialStep = (result: ScanResponse): Step => {
  const first = result.candidates[0];
  if (result.outcome === 'match' && first) return { kind: 'confirm', candidate: first };
  if (result.candidates.length > 0) return { kind: 'choose' };
  return { kind: 'none' };
};

/** Normal zuerst, sonst die erste Variante; ohne Varianten ein leerer Wert. */
const defaultPrinting = (candidate: ScanCandidate) =>
  candidate.printings.find((printing) => /^normal$/i.test(printing)) ?? candidate.printings[0] ?? '';

const matchLabel = (confidence: number) =>
  confidence >= 0.6 ? 'Hohe Übereinstimmung' : confidence >= 0.4 ? 'Mittlere Übereinstimmung' : 'Geringe Übereinstimmung';

/**
 * Ergebnis eines Scans als Blatt am unteren Rand. Nichts wird ohne Zustimmung
 * übernommen: Bei eindeutiger Erkennung fragt das Blatt nach, bei Unsicherheit
 * stellt es die möglichen Karten zur Auswahl.
 */
export function ResultSheet({ result, busy, error, bottomInset, onConfirm, onRetry, onSearch, onClose }: Props) {
  const colors = usePalette();
  const money = useMoney();
  const [step, setStep] = useState<Step>(() => initialStep(result));
  const [printing, setPrinting] = useState(() => (step.kind === 'confirm' ? defaultPrinting(step.candidate) : ''));

  const choose = (candidate: ScanCandidate) => {
    setPrinting(defaultPrinting(candidate));
    setStep({ kind: 'confirm', candidate });
  };

  let content;
  if (step.kind === 'confirm') {
    const { candidate } = step;
    const others = result.candidates.length > 1;
    content = (
      <>
        <AppText variant="title3" accessibilityRole="header">
          {result.outcome === 'match' && candidate === result.candidates[0] ? 'Karte erkannt' : 'Ist das deine Karte?'}
        </AppText>
        <View style={styles.cardRow}>
          <Thumb candidate={candidate} width={96} />
          <View style={styles.cardFacts}>
            <AppText variant="headline">{candidate.name}</AppText>
            <View style={styles.badges}>
              {candidate.element ? <ElementBadge element={candidate.element} size={18} label /> : null}
              <Stars tier={rarityTier(candidate.rarity)} />
            </View>
            <AppText variant="subheadline" tone="secondary">
              {candidate.setName}
            </AppText>
            <AppText variant="subheadline" tone="secondary">
              Nummer {candidate.number ?? 'unbekannt'}
              {candidate.rarity ? ` · ${candidate.rarity}` : ''}
            </AppText>
            <AppText variant="headline" style={styles.price}>
              {money(candidate.price)}
            </AppText>
            {result.outcome !== 'match' || candidate !== result.candidates[0] ? null : (
              <AppText variant="footnote" tone="positive">
                ✓ Sicher erkannt. Stimmt das?
              </AppText>
            )}
          </View>
        </View>

        {candidate.printings.length > 1 ? (
          <View style={styles.printings} accessibilityRole="radiogroup" accessibilityLabel="Variante">
            <AppText variant="footnote" tone="secondary">
              Variante
            </AppText>
            <View style={styles.chips}>
              {candidate.printings.map((name) => {
                const selected = name === printing;
                return (
                  <Pressable
                    key={name}
                    onPress={() => setPrinting(name)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[
                      styles.chip,
                      { borderColor: selected ? colors.tint : colors.separator, backgroundColor: selected ? colors.tint : 'transparent' },
                    ]}>
                    <AppText variant="subheadline" style={selected ? [styles.chipSelected, { color: colors.background }] : undefined}>
                      {name}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {error ? (
          <AppText variant="footnote" tone="negative">
            {error}
          </AppText>
        ) : null}

        <PrimaryButton label="Ja, hinzufügen" busy={busy} onPress={() => onConfirm(candidate, printing)} />
        <TextButton
          label={others ? 'Nein, andere Karte wählen' : 'Nein, selbst suchen'}
          onPress={() => (others ? setStep({ kind: 'choose' }) : onSearch())}
        />
        <TextButton label="Abbrechen" tone="secondary" onPress={onClose} />
      </>
    );
  } else if (step.kind === 'choose') {
    content = (
      <>
        <AppText variant="title3" accessibilityRole="header">
          Welche Karte ist es?
        </AppText>
        <AppText variant="subheadline" tone="secondary">
          {result.outcome === 'match'
            ? 'Weitere mögliche Karten. Tippe auf die richtige.'
            : 'Ich bin mir nicht sicher. Tippe auf die richtige Karte.'}
        </AppText>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {result.candidates.map((candidate) => (
            <Pressable
              key={candidate.id}
              onPress={() => choose(candidate)}
              accessibilityRole="button"
              accessibilityLabel={`${candidate.name}, ${candidate.setName}, Nummer ${candidate.number ?? 'unbekannt'}, ${matchLabel(candidate.confidence)}`}
              style={({ pressed }) => [styles.option, { backgroundColor: pressed ? colors.fill : colors.groupedBackground }]}>
              <Thumb candidate={candidate} width={52} />
              <View style={styles.optionText}>
                <AppText variant="headline" numberOfLines={1}>
                  {candidate.name}
                </AppText>
                <AppText variant="footnote" tone="secondary" numberOfLines={1}>
                  {candidate.setName} · {candidate.number ?? '?'}
                </AppText>
                <AppText variant="footnote" tone={candidate.confidence >= 0.6 ? 'positive' : 'secondary'}>
                  {matchLabel(candidate.confidence)}
                </AppText>
              </View>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={14}
                tintColor={colors.tertiaryLabel}
              />
            </Pressable>
          ))}
        </ScrollView>
        <TextButton label="Keine davon, selbst suchen" onPress={onSearch} />
        <TextButton label="Neu scannen" tone="secondary" onPress={onRetry} />
      </>
    );
  } else {
    content = (
      <>
        <AppText variant="title3" accessibilityRole="header">
          Keine Karte erkannt
        </AppText>
        <AppText variant="subheadline" tone="secondary">
          Halte die Karte so, dass sie den Rahmen ausfüllt, bei gleichmäßigem Licht und ohne Spiegelung.
          {result.read.name ? ` Gelesen: „${result.read.name}“.` : ''}
        </AppText>
        <PrimaryButton label="Neu scannen" onPress={onRetry} />
        <TextButton label="Selbst suchen" onPress={onSearch} />
      </>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Schließen" accessibilityRole="button" />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: bottomInset + space.md }]}>
        <View style={[styles.handle, { backgroundColor: colors.separator }]} />
        {content}
      </View>
    </View>
  );
}

function Thumb({ candidate, width }: { candidate: ScanCandidate; width: number }) {
  const colors = usePalette();
  return (
    <View style={[styles.thumb, { width, height: width / CARD_ASPECT, backgroundColor: colors.fill }]}>
      {candidate.imageUrl ? (
        <Image source={candidate.imageUrl} style={StyleSheet.absoluteFill} contentFit="cover" accessible={false} />
      ) : null}
    </View>
  );
}

/** Haupt-Aktion im Holo-Verlauf, wie "Speichern" im Moodboard. */
function PrimaryButton({ label, onPress, busy }: { label: string; onPress: () => void; busy?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: Boolean(busy) }}
      style={({ pressed }) => [styles.primaryWrap, { opacity: pressed || busy ? 0.75 : 1 }]}>
      <HoloFill style={styles.primary}>
        {busy ? <ActivityIndicator color="#0B0D17" /> : <AppText variant="headline" tone="onHolo">{label}</AppText>}
      </HoloFill>
    </Pressable>
  );
}

function TextButton({ label, onPress, tone = 'tint' }: { label: string; onPress: () => void; tone?: 'tint' | 'secondary' }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.textButton, pressed && { opacity: 0.5 }]}>
      <AppText variant="body" tone={tone}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(11,13,23,0.5)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '86%',
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    gap: space.sm,
  },
  handle: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, marginBottom: space.sm },
  cardRow: { flexDirection: 'row', gap: space.md, marginTop: space.xs },
  cardFacts: { flex: 1, gap: 2 },
  price: { marginTop: space.xs },
  thumb: { borderRadius: radius.sm, overflow: 'hidden' },
  printings: { gap: space.xs, marginTop: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 36,
    paddingHorizontal: space.md,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { fontWeight: '600' },
  primaryWrap: { marginTop: space.sm },
  primary: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: 2 },
  textButton: { minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  list: { flexGrow: 0, maxHeight: 360 },
  listContent: { gap: space.sm, paddingVertical: space.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderRadius: radius.md,
    minHeight: MIN_TOUCH,
  },
  optionText: { flex: 1, gap: 1 },
});
