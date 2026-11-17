import { Text, type TextProps } from 'react-native';

import { tabular, type, type TextVariant } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: 'primary' | 'body' | 'secondary' | 'tertiary' | 'tint' | 'positive' | 'negative' | 'gold' | 'onHolo';
  /** Ziffern fester Breite für Preise und Zähler. */
  numeric?: boolean;
}

/** Text in einem Textstil des Moodboards. Skaliert mit der Systemschriftgröße. */
export function AppText({ variant = 'body', tone = 'primary', numeric, style, ...rest }: AppTextProps) {
  const colors = usePalette();
  const color = {
    primary: colors.label,
    body: colors.body,
    secondary: colors.secondaryLabel,
    tertiary: colors.tertiaryLabel,
    tint: colors.tint,
    positive: colors.positive,
    negative: colors.negative,
    gold: colors.gold,
    onHolo: colors.onHolo,
  }[tone];
  return <Text style={[type[variant], { color }, numeric && tabular, style]} {...rest} />;
}
