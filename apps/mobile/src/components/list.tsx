import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH, radius, space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';

/** Gruppierte Liste im iOS-Stil: Überschrift, abgerundete Fläche, Trennlinien. */
export function Section({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const colors = usePalette();
  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="footnote" tone="secondary" style={styles.sectionTitle} accessibilityRole="header">
          {title.toUpperCase()}
        </AppText>
      ) : null}
      <View style={[styles.sectionBody, { backgroundColor: colors.surface }]}>{children}</View>
      {footer ? (
        <AppText variant="footnote" tone="secondary" style={styles.sectionFooter}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  children?: ReactNode;
}

/** Zeile einer gruppierten Liste. Mit `onPress` wird sie zur Tippfläche mit Pfeil. */
export function Row({ title, subtitle, value, onPress, isLast, children }: RowProps) {
  const colors = usePalette();
  const content = (
    <View style={[styles.row, !isLast && { borderBottomColor: colors.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.rowText}>
        <AppText variant="body" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
      {value ? (
        <AppText variant="body" tone="secondary" style={styles.rowValue}>
          {value}
        </AppText>
      ) : null}
      {onPress ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={colors.tertiaryLabel}
        />
      ) : null}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => (pressed ? { backgroundColor: colors.fill } : null)}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: space.lg },
  sectionTitle: { marginHorizontal: space.md, marginBottom: space.sm },
  sectionFooter: { marginHorizontal: space.md, marginTop: space.sm },
  sectionBody: { borderRadius: radius.md, overflow: 'hidden' },
  row: {
    minHeight: MIN_TOUCH,
    marginLeft: space.md,
    paddingRight: space.md,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  rowText: { flex: 1, gap: 2 },
  rowValue: { flexShrink: 0, textAlign: 'right' },
});
