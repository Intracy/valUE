import type { AnonymousAuthResponse } from '@value/api-types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ApiRequestError, request } from './client';

/**
 * Anonymes Konto je Gerät. Das Token liegt auf iOS im Schlüsselbund, auf Android
 * im verschlüsselten Speicher. Im Browser gibt es beides nicht, dort hält es der
 * lokale Speicher des Browsers.
 */
const KEY = 'value.session.token';

const storage = {
  async get(): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(KEY) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(KEY);
  },
  async set(value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(KEY, value);
      } catch {
        // Privater Modus ohne Speicher: Das Konto gilt dann nur für diese Sitzung.
      }
      return;
    }
    await SecureStore.setItemAsync(KEY, value);
  },
  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(KEY);
      } catch {
        // siehe oben
      }
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};

let pending: Promise<string> | null = null;
let memory: string | null = null;

/** Liefert das Token und legt beim ersten Aufruf ein Konto an. Parallele Aufrufe teilen sich eine Anfrage. */
export function getToken(): Promise<string> {
  if (memory) return Promise.resolve(memory);
  pending ??= (async () => {
    const stored = await storage.get();
    if (stored) return (memory = stored);
    const created = await request<AnonymousAuthResponse>('/v1/auth/anonymous', { method: 'POST' });
    await storage.set(created.token);
    return (memory = created.token);
  })().finally(() => {
    pending = null;
  });
  return pending;
}

/** Abruf mit Anmeldung. Ist das Token dem Server unbekannt, wird einmal ein neues Konto angelegt. */
export async function authedRequest<T>(
  path: string,
  options: { method?: 'GET' | 'PUT' | 'POST'; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  try {
    return await request<T>(path, { ...options, token: await getToken() });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      memory = null;
      await storage.clear();
      return request<T>(path, { ...options, token: await getToken() });
    }
    throw error;
  }
}
