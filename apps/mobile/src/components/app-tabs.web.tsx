import { TabList, Tabs, TabSlot, TabTrigger, type TabListProps, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { createContext, useContext } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type PressableProps } from 'react-native';

import { MAX_CONTENT_WIDTH, MIN_TOUCH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';

/** Ab dieser Breite steht die Navigation oben, darunter als Leiste am unteren Rand. */
const WIDE = 700;
const Narrow = createContext(false);

type WebSymbol = 'collections' | 'style' | 'search' | 'person';

/**
 * Navigation im Browser. Auf Handybreite eine Leiste unten mit Symbol und
 * Beschriftung, wie man sie von der App kennt; auf breiten Fenstern eine Zeile oben.
 */
export default function AppTabs() {
  const narrow = useWindowDimensions().width < WIDE;
  return (
    <Narrow.Provider value={narrow}>
      <Tabs style={[styles.root, { flexDirection: narrow ? 'column' : 'column-reverse' }]}>
        <TabSlot style={styles.slot} />
        {/* TabList muss direkt in Tabs stehen, sonst findet der Router die Tabs nicht. */}
        <TabList asChild>
          <Bar>
            <TabTrigger name="sammlung" href="/" asChild>
              <TabButton symbol="collections">Sammlung</TabButton>
            </TabTrigger>
            <TabTrigger name="sets" href="/sets" asChild>
              <TabButton symbol="style">Sets</TabButton>
            </TabTrigger>
            <TabTrigger name="suche" href="/suche" asChild>
              <TabButton symbol="search">Suche</TabButton>
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
          <AppText variant="headline" style={styles.brand}>
            valUE
          </AppText>
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

const styles = StyleSheet.create({
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
