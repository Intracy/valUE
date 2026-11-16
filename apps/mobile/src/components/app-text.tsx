import { Text, type TextProps } from 'react-native';

import { type, type TextVariant } from '@/theme/theme';
import { usePalette } from '@/theme/use-palette';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'tint' | 'positive' | 'negative';
}

/** Text in einem iOS-Textstil. Skaliert mit der Systemschriftgröße. */
export function AppText({ variant = 'body', tone = 'primary', style, ...rest }: AppTextProps) {
  const colors = usePalette();
  const color = {
    primary: colors.label,
    secondary: colors.secondaryLabel,
    tertiary: colors.tertiaryLabel,
    tint: colors.tint,
    positive: colors.positive,
    negative: colors.negative,
  }[tone];
  return <Text style={[type[variant], { color }, style]} {...rest} />;
}
