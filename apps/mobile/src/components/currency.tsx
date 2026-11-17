import type { Money } from '@value/api-types';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type TextStyle } from 'react-native';

import { useExchangeRate } from '@/api/queries';
import type { TextVariant } from '@/theme/theme';

import { AppText, type AppTextProps } from './app-text';
import { formatMoney } from './format';
import { tapFeedback } from './haptics';

/**
 * Anzeige-Währung. Die Quelle liefert Dollarpreise; ein Tipp auf einen
 * Dollarpreis rechnet alle Dollarpreise der App zum EZB-Referenzkurs in Euro um,
 * ein weiterer Tipp zeigt wieder Dollar. Die Wahl gilt app-weit und bleibt
 * auf dem Gerät gespeichert. Preise, die schon in Euro vorliegen, bleiben, wie sie sind.
 */
type Display = 'original' | 'EUR';

const KEY = 'value.currency';

async function load(): Promise<Display | null> {
  try {
    const value = Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return value === 'EUR' || value === 'original' ? value : null;
  } catch {
    return null;
  }
}

async function save(value: Display): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, value);
    else await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Ohne Speicher gilt die Wahl bis zum Neustart.
  }
}

interface CurrencyState {
  display: Display;
  toggle: () => void;
  /** Euro je Dollar, null solange kein Kurs da ist. */
  rate: number | null;
}

const CurrencyContext = createContext<CurrencyState>({ display: 'original', toggle: () => undefined, rate: null });

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [display, setDisplay] = useState<Display>('original');
  const fx = useExchangeRate();

  useEffect(() => {
    let active = true;
    void load().then((stored) => {
      if (active && stored) setDisplay(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const toggle = useCallback(() => {
    tapFeedback();
    setDisplay((current) => {
      const next = current === 'EUR' ? 'original' : 'EUR';
      void save(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ display, toggle, rate: fx.data?.rate ?? null }),
    [display, toggle, fx.data],
  );
  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = () => useContext(CurrencyContext);

/** Betrag in der gewählten Anzeige-Währung. Ohne Kurs bleibt es beim Dollar. */
export function useConvert() {
  const { display, rate } = useCurrency();
  return useCallback(
    (money: Money | null | undefined): Money | null => {
      if (!money) return null;
      if (display === 'EUR' && money.currency === 'USD' && rate) {
        return { amount: Math.round(money.amount * rate * 100) / 100, currency: 'EUR' };
      }
      return money;
    },
    [display, rate],
  );
}

/** Wie `formatMoney`, aber in der Anzeige-Währung. Umgerechnete Beträge tragen ein "≈". */
export function useMoney() {
  const convert = useConvert();
  return useCallback(
    (money: Money | null | undefined): string => {
      const shown = convert(money);
      if (!shown) return formatMoney(null);
      return shown !== money ? `≈ ${formatMoney(shown)}` : formatMoney(shown);
    },
    [convert],
  );
}

interface PriceProps extends Omit<AppTextProps, 'children'> {
  money: Money | null | undefined;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
}

/**
 * Preis zum Antippen: Dollar ↔ Euro. Nur Dollarpreise sind antippbar; die
 * Sprachausgabe nennt Betrag und was ein Doppeltipp tut.
 */
export function Price({ money, variant = 'headline', style, ...rest }: PriceProps) {
  const { display, toggle, rate } = useCurrency();
  const format = useMoney();
  const text = format(money);
  const switchable = money?.currency === 'USD' && rate !== null;
  const label = (
    <AppText variant={variant} numeric style={style} {...rest}>
      {text}
    </AppText>
  );
  if (!switchable) return label;
  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={text.replace('≈', 'ungefähr').replace('$', 'Dollar').replace('€', 'Euro')}
      accessibilityHint={display === 'EUR' ? 'Zeigt wieder Dollar' : 'Rechnet zum aktuellen Kurs in Euro um'}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {label}
    </Pressable>
  );
}
