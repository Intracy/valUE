import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiRequestError } from '@/api/client';
import { space } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

import { AppText } from './app-text';
import { HoloButton } from './ui';

/** Ladezustand. Erscheint nur, solange noch gar keine Daten da sind. */
export function LoadingView({ label = 'Wird geladen' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator />
    </View>
  );
}

interface MessageProps {
  symbol: SymbolViewProps['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Leerer Zustand oder Fehler: Symbol, Titel, ein Satz, höchstens eine Aktion. */
export function MessageView({ symbol, title, description, actionLabel, onAction }: MessageProps) {
  const colors = usePalette();
  return (
    <View style={styles.center}>
      <SymbolView name={symbol} size={48} tintColor={colors.secondaryLabel} />
      <AppText variant="title3" style={styles.centerText}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="subheadline" tone="secondary" style={styles.centerText}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? <HoloButton label={actionLabel} onPress={onAction} style={styles.button} /> : null}
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const offline = error instanceof ApiRequestError && error.status === 0;
  return (
    <MessageView
      symbol={{ ios: 'wifi.exclamationmark', android: 'error', web: 'error' }}
      title={offline ? 'Keine Verbindung zum Server' : 'Das hat nicht geklappt'}
      description={
        offline
          ? 'Prüfe die Internetverbindung und versuche es erneut.'
          : error instanceof Error
            ? error.message
            : undefined
      }
      actionLabel="Erneut versuchen"
      onAction={onRetry}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.sm,
  },
  centerText: { textAlign: 'center' },
  button: { minWidth: 200, marginTop: space.md },
});
