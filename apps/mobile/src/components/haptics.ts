import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Kurze Rückmeldung bei einer Änderung. Im Browser gibt es keine Haptik. */
export function tapFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function successFeedback(): void {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
