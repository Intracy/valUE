import type { ScanCandidate, ScanResponse } from '@value/api-types';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useIsFocused, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutRectangle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Path } from 'react-native-svg';

import { ApiRequestError } from '@/api/client';
import { useConfirmScan, useScanCard } from '@/api/queries';
import { AppText } from '@/components/app-text';
import { successFeedback, tapFeedback } from '@/components/haptics';
import { HoloFill, HoloStops, useSvgId } from '@/components/holo';
import { MessageView } from '@/components/states';
import { centerCardCrop, guideRect, previewToPhoto } from '@/scan/geometry';
import { preparePhoto } from '@/scan/prepare-photo';
import { ResultSheet } from '@/scan/result-sheet';
import { liveCameraAvailable, takeSystemPhoto } from '@/scan/system-camera';
import { radius, space } from '@/theme/theme';
import { useHolo } from '@/theme/use-palette';

/** Höhe der Tab-Leiste, die auf dem Gerät über dem Kamerabild liegt. Im Browser steht sie darunter. */
const TAB_BAR = Platform.select({ ios: 49, android: 80, default: 0 });
/** Im Browser ragt der runde Kamera-Knopf der Leiste ins Bild; der Auslöser hält Abstand. */
const RAISED_TAB = Platform.OS === 'web' ? 32 : 0;
/** Ohne HTTPS gibt es im Browser keine Live-Kamera; dann fotografiert die Systemkamera. */
const LIVE_CAMERA = liveCameraAvailable();

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

  const captureWithSystemCamera = async () => {
    if (phase.kind !== 'live') return;
    tapFeedback();
    try {
      const photo = await takeSystemPhoto();
      if (photo) await identify(await preparePhoto(photo.uri, centerCardCrop(photo)));
    } catch (error) {
      setPhase({ kind: 'error', message: messageFor(error) });
    }
  };

  const capture = async () => {
    if (!LIVE_CAMERA) return captureWithSystemCamera();
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
    router.navigate('/markt');
  };

  // Ein Container, der von Anfang an da ist und seine Größe meldet. Hängt der
  // Layout-Handler erst nach der Kamerafreigabe an, meldet der Browser keine Größe.
  const measure = (event: { nativeEvent: { layout: LayoutRectangle } }) => setLayout(event.nativeEvent.layout);

  // Kamerazugriff noch offen oder verweigert.
  if (LIVE_CAMERA && !permission) return <View style={styles.black} onLayout={measure} />;
  if (LIVE_CAMERA && permission && !permission.granted) {
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
  const shutterReady = ready || !LIVE_CAMERA;

  return (
    <View style={styles.black} onLayout={measure}>
      {focused && LIVE_CAMERA ? (
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

      {guide && LIVE_CAMERA ? <GuideOverlay guide={guide} highlight={phase.kind === 'processing'} /> : null}

      <View style={[styles.hint, { top: insets.top + space.md }]} pointerEvents="none">
        <AppText variant="headline" style={styles.light}>
          {phase.kind === 'processing'
            ? 'Karte wird erkannt …'
            : LIVE_CAMERA
              ? 'Karte in den Rahmen legen'
              : 'Karte fotografieren'}
        </AppText>
        <AppText variant="footnote" style={styles.lightSecondary}>
          {phase.kind === 'processing'
            ? 'Einen Moment'
            : LIVE_CAMERA
              ? 'Gleichmäßiges Licht, keine Spiegelung'
              : 'Auslöser tippen, Karte bildfüllend aufnehmen'}
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
          disabled={!live || !shutterReady}
          accessibilityRole="button"
          accessibilityLabel="Foto aufnehmen und Karte erkennen"
          accessibilityState={{ disabled: !live || !shutterReady, busy: phase.kind === 'processing' }}
          style={({ pressed }) => [(pressed || !shutterReady) && { opacity: 0.6 }]}>
          <HoloFill style={styles.shutter}>
            <View style={styles.shutterInner}>
              {phase.kind === 'processing' ? <ActivityIndicator color="#0B0D17" /> : null}
            </View>
          </HoloFill>
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
            tintColor="#2BD98F"
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

/**
 * Abgedunkelter Rand um den Suchrahmen. Der Rahmen selbst hat Eckmarken im
 * Holo-Verlauf wie im Moodboard; eine Scan-Linie läuft durch, solange die
 * Erkennung arbeitet (bei "Bewegung reduzieren" steht sie still).
 */
function GuideOverlay({ guide, highlight }: { guide: { x: number; y: number; width: number; height: number }; highlight: boolean }) {
  const shade = 'rgba(11,13,23,0.62)';
  const holo = useHolo();
  const id = useSvgId('corner');
  const sweep = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!highlight || reduceMotion) {
      sweep.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(sweep, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [highlight, reduceMotion, sweep]);

  const arm = Math.min(guide.width, guide.height) * 0.16;
  const r = radius.lg;
  const w = guide.width;
  const h = guide.height;
  // Vier Ecken als L mit gerundeter Spitze.
  const corners = [
    `M0,${arm + r} V${r} Q0,0 ${r},0 H${arm + r}`,
    `M${w - arm - r},0 H${w - r} Q${w},0 ${w},${r} V${arm + r}`,
    `M${w},${h - arm - r} V${h - r} Q${w},${h} ${w - r},${h} H${w - arm - r}`,
    `M${arm + r},${h} H${r} Q0,${h} 0,${h - r} V${h - arm - r}`,
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: guide.y, backgroundColor: shade }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: guide.y + guide.height, bottom: 0, backgroundColor: shade }} />
      <View style={{ position: 'absolute', left: 0, width: guide.x, top: guide.y, height: guide.height, backgroundColor: shade }} />
      <View style={{ position: 'absolute', right: 0, left: guide.x + guide.width, top: guide.y, height: guide.height, backgroundColor: shade }} />
      <Svg
        style={{ position: 'absolute', left: guide.x - 3, top: guide.y - 3 }}
        width={w + 6}
        height={h + 6}
        viewBox={`-3 -3 ${w + 6} ${h + 6}`}>
        <Defs>
          <HoloStops id={id} colors={holo} vertical />
        </Defs>
        {corners.map((d) => (
          <Path key={d} d={d} stroke={`url(#${id})`} strokeWidth={5} strokeLinecap="round" fill="none" />
        ))}
      </Svg>
      {highlight ? (
        <Animated.View
          style={{
            position: 'absolute',
            left: guide.x + 8,
            width: guide.width - 16,
            top: guide.y,
            height: 3,
            transform: [{ translateY: sweep.interpolate({ inputRange: [0, 1], outputRange: [8, guide.height - 11] }) }],
          }}>
          <HoloFill style={styles.scanLine} />
        </Animated.View>
      ) : null}
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
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F4F5FA',
    borderWidth: 3,
    borderColor: '#0B0D17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: { flex: 1, borderRadius: 2, boxShadow: '0 0 12px rgba(79, 227, 255, 0.9)' },
  round: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(20,24,41,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(244,245,250,0.18)',
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
    backgroundColor: 'rgba(20,24,41,0.94)',
    borderWidth: 1,
    borderColor: '#1A1F35',
  },
  errorToast: { backgroundColor: 'rgba(200,36,59,0.94)', borderColor: 'transparent' },
  libraryLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginBottom: space.xl },
});
