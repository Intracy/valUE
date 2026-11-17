import type { ScanCandidate, ScanResponse } from '@value/api-types';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View, type LayoutRectangle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiRequestError } from '@/api/client';
import { useConfirmScan, useScanCard } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { successFeedback, tapFeedback } from '@/components/haptics';
import { MessageView } from '@/components/states';
import { centerCardCrop, guideRect, previewToPhoto } from '@/scan/geometry';
import { preparePhoto } from '@/scan/prepare-photo';
import { ResultSheet } from '@/scan/result-sheet';
import { radius, space } from '@/theme/theme';

/** Höhe der Tab-Leiste, die auf dem Gerät über dem Kamerabild liegt. Im Browser steht sie darunter. */
const TAB_BAR = Platform.select({ ios: 49, android: 80, default: 0 });
/** Im Browser ragt der runde Kamera-Knopf der Leiste ins Bild; der Auslöser hält Abstand. */
const RAISED_TAB = Platform.OS === 'web' ? 32 : 0;

type Phase =
  | { kind: 'live' }
  | { kind: 'processing' }
  | { kind: 'result'; result: ScanResponse }
  | { kind: 'error'; message: string };

const messageFor = (error: unknown) =>
  error instanceof ApiRequestError
    ? error.status === 0
      ? 'Keine Verbindung zum Server. Prüfe die Internetverbindung.'
      : error.status === 429
        ? 'Zu viele Scans in kurzer Zeit. Warte einen Moment.'
        : error.message
    : 'Das Foto konnte nicht verarbeitet werden.';

/**
 * Scanner: Karte in den Rahmen halten, auslösen, Vorschlag bestätigen.
 * Die Kamera läuft nur, solange dieser Tab sichtbar ist und kein Ergebnis offen ist.
 */
export default function ScanScreen() {
  const router = useRouter();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [layout, setLayout] = useState<LayoutRectangle | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: 'live' });
  const [toast, setToast] = useState<string | null>(null);
  const scan = useScanCard();
  const confirm = useConfirmScan();

  const controlsBottom = insets.bottom + TAB_BAR + RAISED_TAB + space.lg;
  const guide = layout
    ? guideRect(layout.width, layout.height, { top: insets.top + 64, bottom: controlsBottom + 96 })
    : null;

  // Hinweis nach dem Hinzufügen kurz einblenden.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const identify = async (image: string) => {
    setPhase({ kind: 'processing' });
    try {
      const result = await scan.mutateAsync(image);
      setPhase({ kind: 'result', result });
    } catch (error) {
      setPhase({ kind: 'error', message: messageFor(error) });
    }
  };

  const capture = async () => {
    if (phase.kind !== 'live') return;
    if (!camera.current || !layout || !guide) {
      setPhase({ kind: 'error', message: 'Die Kamera ist noch nicht bereit. Versuche es gleich noch einmal.' });
      return;
    }
    tapFeedback();
    try {
      const photo = await camera.current.takePictureAsync({ quality: 0.85, shutterSound: false });
      const crop = previewToPhoto(guide, layout, photo);
      await identify(await preparePhoto(photo.uri, crop));
    } catch (error) {
      setPhase({ kind: 'error', message: messageFor(error) });
    }
  };

  const pickFromLibrary = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset) return;
    try {
      await identify(await preparePhoto(asset.uri, centerCardCrop(asset)));
    } catch (error) {
      setPhase({ kind: 'error', message: messageFor(error) });
    }
  };

  const onConfirm = (result: ScanResponse) => (candidate: ScanCandidate, printing: string) => {
    confirm.mutate(
      { scanId: result.scanId, cardId: candidate.id, setId: candidate.setId, printing },
      {
        onSuccess: (response) => {
          successFeedback();
          setToast(`${response.cardName} hinzugefügt · jetzt ${response.totalQuantity}×`);
          setPhase({ kind: 'live' });
          confirm.reset();
        },
      },
    );
  };

  const reset = () => {
    confirm.reset();
    setPhase({ kind: 'live' });
  };

  const goSearch = () => {
    reset();
    router.push('/suche');
  };

  // Ein Container, der von Anfang an da ist und seine Größe meldet. Hängt der
  // Layout-Handler erst nach der Kamerafreigabe an, meldet der Browser keine Größe.
  const measure = (event: { nativeEvent: { layout: LayoutRectangle } }) => setLayout(event.nativeEvent.layout);

  // Kamerazugriff noch offen oder verweigert.
  if (!permission) return <View style={styles.black} onLayout={measure} />;
  if (!permission.granted) {
    return (
      <View style={[styles.fill, { paddingBottom: insets.bottom + TAB_BAR }]} onLayout={measure}>
        <MessageView
          symbol={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
          title="Kamera für den Scanner"
          description="valUE braucht die Kamera, um Karten zu erkennen. Das Foto dient nur der Erkennung und wird nicht gespeichert."
          actionLabel={permission.canAskAgain ? 'Kamera erlauben' : 'Einstellungen öffnen'}
          onAction={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
        />
        <Pressable onPress={pickFromLibrary} accessibilityRole="button" style={styles.libraryLink}>
          <AppText variant="body" tone="tint">
            Stattdessen ein Foto auswählen
          </AppText>
        </Pressable>
      </View>
    );
  }

  const live = phase.kind === 'live';

  return (
    <View style={styles.black} onLayout={measure}>
      {focused ? (
        <CameraView
          ref={camera}
          style={StyleSheet.absoluteFill}
          facing="back"
          // Pausiert, solange ein Ergebnis offen ist: spart Akku und hält das Bild ruhig.
          active={focused && phase.kind !== 'result'}
          onCameraReady={() => setReady(true)}
          animateShutter={false}
        />
      ) : null}

      {guide ? <GuideOverlay guide={guide} highlight={phase.kind === 'processing'} /> : null}

      <View style={[styles.hint, { top: insets.top + space.md }]} pointerEvents="none">
        <AppText variant="headline" style={styles.light}>
          {phase.kind === 'processing' ? 'Karte wird erkannt …' : 'Karte in den Rahmen legen'}
        </AppText>
        <AppText variant="footnote" style={styles.lightSecondary}>
          {phase.kind === 'processing' ? 'Einen Moment' : 'Gleichmäßiges Licht, keine Spiegelung'}
        </AppText>
      </View>

      <View style={[styles.controls, { bottom: controlsBottom }]}>
        <RoundButton
          label="Foto aus der Mediathek wählen"
          symbol={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'photo_library' }}
          onPress={pickFromLibrary}
          disabled={!live}
        />
        <Pressable
          onPress={capture}
          disabled={!live || !ready}
          accessibilityRole="button"
          accessibilityLabel="Foto aufnehmen und Karte erkennen"
          accessibilityState={{ disabled: !live || !ready, busy: phase.kind === 'processing' }}
          style={({ pressed }) => [styles.shutter, (pressed || !ready) && { opacity: 0.6 }]}>
          {phase.kind === 'processing' ? <ActivityIndicator color="#FFFFFF" /> : <View style={styles.shutterInner} />}
        </Pressable>
        <RoundButton
          label="Karte selbst suchen"
          symbol={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          onPress={goSearch}
          disabled={!live}
        />
      </View>

      {toast ? (
        <View style={[styles.toast, { top: insets.top + 72 }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <SymbolView
            name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
            size={20}
            tintColor="#30D158"
          />
          <AppText variant="subheadline" style={styles.light}>
            {toast}
          </AppText>
        </View>
      ) : null}

      {phase.kind === 'error' ? (
        <View style={[styles.toast, styles.errorToast, { top: insets.top + 72 }]} accessibilityRole="alert">
          <AppText variant="subheadline" style={styles.light}>
            {phase.message}
          </AppText>
          <Pressable onPress={reset} accessibilityRole="button" hitSlop={8}>
            <AppText variant="headline" style={styles.light}>
              OK
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {phase.kind === 'result' ? (
        <ResultSheet
          key={phase.result.scanId}
          result={phase.result}
          busy={confirm.isPending}
          error={confirm.error ? messageFor(confirm.error) : null}
          bottomInset={insets.bottom + TAB_BAR}
          onConfirm={onConfirm(phase.result)}
          onRetry={reset}
          onSearch={goSearch}
          onClose={reset}
        />
      ) : null}
    </View>
  );
}

/** Abgedunkelter Rand um den Suchrahmen, der Rahmen selbst mit Eckmarken. */
function GuideOverlay({ guide, highlight }: { guide: { x: number; y: number; width: number; height: number }; highlight: boolean }) {
  const shade = 'rgba(0,0,0,0.55)';
  const color = highlight ? '#5E5CE6' : '#FFFFFF';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: guide.y, backgroundColor: shade }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: guide.y + guide.height, bottom: 0, backgroundColor: shade }} />
      <View style={{ position: 'absolute', left: 0, width: guide.x, top: guide.y, height: guide.height, backgroundColor: shade }} />
      <View style={{ position: 'absolute', right: 0, left: guide.x + guide.width, top: guide.y, height: guide.height, backgroundColor: shade }} />
      <View
        style={{
          position: 'absolute',
          left: guide.x,
          top: guide.y,
          width: guide.width,
          height: guide.height,
          borderRadius: radius.md,
          borderWidth: 2,
          borderColor: color,
          opacity: 0.9,
        }}
      />
    </View>
  );
}

function RoundButton({
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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.round, (pressed || disabled) && { opacity: 0.5 }]}>
      <SymbolView name={symbol} size={22} tintColor="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  black: { flex: 1, backgroundColor: '#000000' },
  hint: { position: 'absolute', left: space.md, right: space.md, alignItems: 'center', gap: 2 },
  light: { color: '#FFFFFF', textAlign: 'center' },
  lightSecondary: { color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 44,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF' },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: 420,
    marginHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 22,
    backgroundColor: 'rgba(28,28,30,0.92)',
  },
  errorToast: { backgroundColor: 'rgba(160,30,30,0.92)' },
  libraryLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginBottom: space.xl },
});
