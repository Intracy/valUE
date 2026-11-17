import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, Platform, useColorScheme } from 'react-native';

import type { Scheme } from './theme';

/**
 * Darstellung: Dunkel (Standard laut Moodboard), Hell oder wie das System.
 * Die Wahl gilt für das Gerät und liegt lokal, nicht auf dem Server.
 */
export type AppearancePreference = 'dark' | 'light' | 'system';

const KEY = 'value.appearance';
const DEFAULT: AppearancePreference = 'dark';

const isPreference = (value: unknown): value is AppearancePreference =>
  value === 'dark' || value === 'light' || value === 'system';

async function load(): Promise<AppearancePreference | null> {
  try {
    const value =
      Platform.OS === 'web' ? globalThis.localStorage?.getItem(KEY) : await SecureStore.getItemAsync(KEY);
    return isPreference(value) ? value : null;
  } catch {
    return null;
  }
}

async function save(value: AppearancePreference): Promise<void> {
  try {
    if (Platform.OS === 'web') globalThis.localStorage?.setItem(KEY, value);
    else await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Ohne Speicher gilt die Wahl nur bis zum Neustart.
  }
}

interface AppearanceState {
  preference: AppearancePreference;
  scheme: Scheme;
  setPreference: (value: AppearancePreference) => void;
}

const AppearanceContext = createContext<AppearanceState>({
  preference: DEFAULT,
  scheme: 'dark',
  setPreference: () => undefined,
});

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [preference, setState] = useState<AppearancePreference>(DEFAULT);
  const system = useColorScheme();

  useEffect(() => {
    let active = true;
    void load().then((stored) => {
      if (active && stored) setState(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  // Auf dem Gerät auch die Systemteile (Tab-Leiste, Navigationsleiste, Tastatur)
  // umstellen. Im Browser zeichnet die App alles selbst.
  useEffect(() => {
    if (Platform.OS !== 'web') Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = useCallback((value: AppearancePreference) => {
    setState(value);
    void save(value);
  }, []);

  const scheme: Scheme = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;
  const value = useMemo(() => ({ preference, scheme, setPreference }), [preference, scheme, setPreference]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export const useAppearance = () => useContext(AppearanceContext);
