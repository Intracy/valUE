import { TabList, Tabs, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { createContext, useContext, useEffect, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type PressableProps } from 'react-native';

import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';
import { HoloFill, Wordmark } from './holo';

/** Ab dieser Breite steht die Navigation oben, darunter als Leiste am unteren Rand. */
const WIDE = 700;
const Narrow = createContext(false);

type WebSymbol = 'show_chart' | 'collections' | 'storefront' | 'person' | 'photo_camera';

/**
 * Navigation im Browser. Auf Handybreite eine Leiste unten mit Symbol und
 * Beschriftung, wie man sie von der App kennt; auf breiten Fenstern eine Zeile oben.
 */
/**
 * Die Seiten werden beim Bauen ohne Fensterbreite vorgerendert. Bis der Browser
 * übernommen hat, gilt deshalb die schmale Fassung, sonst passen vorgerenderte
 * Seite und erste Darstellung nicht zusammen.
 */
function useNarrow(): boolean {
  const width = useWindowDimensions().width;
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated ? width < WIDE : true;
}

export default function AppTabs() {
  const narrow = useNarrow();
  return (
    <Narrow.Provider value={narrow}>
      <Tabs style={[styles.root, { flexDirection: narrow ? 'column' : 'column-reverse' }]}>
        <TabSlot style={styles.slot} />
        {/* TabList muss direkt in Tabs stehen, sonst findet der Router die Tabs nicht. */}
        <TabList asChild>
          <Bar>
            <TabTrigger name="portfolio" href="/" asChild>
              <TabButton symbol="show_chart">Portfolio</TabButton>
            </TabTrigger>
            <TabTrigger name="sammlung" href="/sammlung" asChild>
              <TabButton symbol="collections">Sammlung</TabButton>
            </TabTrigger>
            <TabTrigger name="scan" href="/scan" asChild>
              <ScanButton>Scan</ScanButton>
            </TabTrigger>
            <TabTrigger name="markt" href="/markt" asChild>
              <TabButton symbol="storefront">Markt</TabButton>
            </TabTrigger>
            <TabTrigger name="profil" href="/profil" asChild>
              <TabButton symbol="person">Profil</TabButton>
            </TabTrigger>
          </Bar>
        </TabList>
      </Tabs>
    </Narrow.Provider>
  );
}

function Bar({ children, style, ...props }: TabListProps) {
  const colors = usePalette();
  const narrow = useContext(Narrow);
  return (
    <View
      {...props}
      style={[
        styles.bar,
        { backgroundColor: colors.background, borderColor: colors.separator },
        narrow ? styles.barBottom : styles.barTop,
        style,
      ]}>
      <View style={[styles.inner, narrow && styles.innerNarrow]}>
        {narrow ? null : (
          <View style={styles.brand}>
            <Wordmark size={24} />
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

function TabButton({ children, isFocused, symbol, ...props }: TabTriggerSlotProps & { symbol: WebSymbol }) {
  const colors = usePalette();
  const narrow = useContext(Narrow);
  const color = isFocused ? colors.tint : colors.secondaryLabel;
  return (
    <Pressable
      {...(props as PressableProps)}
      accessibilityRole="tab"
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={({ pressed }) => [
        narrow ? styles.buttonNarrow : styles.buttonWide,
        !narrow && isFocused && { backgroundColor: colors.fill },
        pressed && { opacity: 0.6 },
      ]}>
      {narrow ? <SymbolView name={{ web: symbol }} size={24} tintColor={color} /> : null}
      <AppText variant={narrow ? 'caption' : 'subheadline'} style={{ color, fontWeight: isFocused ? '600' : '400' }}>
        {children}
      </AppText>
    </Pressable>
  );
}

/** Scanner in der Mitte: runder, farbiger Knopf, der über die Leiste hinausragt. */
function ScanButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const colors = usePalette();
  const narrow = useContext(Narrow);
  if (!narrow) {
    return (
      <Pressable
        {...(props as PressableProps)}
        accessibilityRole="tab"
        accessibilityState={{ selected: Boolean(isFocused) }}
        style={({ pressed }) => [pressed && { opacity: 0.8 }]}>
        <HoloFill style={styles.scanWide}>
          <SymbolView name={{ web: 'photo_camera' }} size={18} tintColor={colors.onHolo} />
          <AppText variant="subheadline" tone="onHolo" style={styles.scanWideLabel}>
            {children}
          </AppText>
        </HoloFill>
      </Pressable>
    );
  }
  return (
    <Pressable
      {...(props as PressableProps)}
      accessibilityRole="tab"
      accessibilityLabel="Scannen"
      accessibilityState={{ selected: Boolean(isFocused) }}
      style={({ pressed }) => [styles.buttonNarrow, pressed && { opacity: 0.8 }]}>
      <View style={[styles.scanRing, { backgroundColor: colors.background }]}>
        <HoloFill style={styles.scanCircle}>
          <SymbolView name={{ web: 'photo_camera' }} size={28} tintColor={colors.onHolo} />
        </HoloFill>
      </View>
      <AppText variant="caption" style={{ color: isFocused ? colors.tint : colors.secondaryLabel, fontWeight: '600' }}>
        {children}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scanRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 4,
    marginTop: -28,
    boxShadow: '0 4px 18px rgba(139, 92, 255, 0.45)',
  },
  scanCircle: {
    flex: 1,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanWide: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  scanWideLabel: { fontWeight: '700' },
  root: { flex: 1 },
  slot: { flex: 1 },
  bar: { alignItems: 'center' },
  barTop: { borderBottomWidth: StyleSheet.hairlineWidth },
  barBottom: { borderTopWidth: StyleSheet.hairlineWidth },
  inner: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  innerNarrow: { paddingHorizontal: 0, paddingVertical: space.xs, gap: 0 },
  brand: { marginRight: 'auto' },
  buttonWide: {
    minHeight: MIN_TOUCH,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  buttonNarrow: { flex: 1, minHeight: 49, alignItems: 'center', justifyContent: 'center', gap: 2 },
});
