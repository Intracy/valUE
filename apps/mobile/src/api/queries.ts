import {
  focusManager,
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  CardDetailResponse,
  CollectionProgressResponse,
  CollectionSetResponse,
  ProfileResponse,
  PutCollectionItemRequest,
  PutCollectionItemResponse,
  SearchResponse,
  SetDetailResponse,
  SetListResponse,
} from '@value/api-types';
import { AppState, Platform } from 'react-native';

import { ApiRequestError, request } from './client';
import { authedRequest } from './session';

const MINUTE = 60_000;

/**
 * Katalog und Preise ändern sich einmal am Tag. Die App fragt deshalb selten
 * nach und zeigt vorhandene Daten sofort; im Hintergrund wird aufgefrischt.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * MINUTE,
      gcTime: 60 * MINUTE,
      // Fehler, die ein zweiter Versuch nicht behebt, nicht wiederholen.
      retry: (failures, error) =>
        failures < 2 && !(error instanceof ApiRequestError && error.status >= 400 && error.status < 500),
    },
  },
});

// Auf dem Gerät gilt die App als "im Fokus", wenn sie im Vordergrund ist.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}

export const keys = {
  sets: ['sets'] as const,
  set: (setId: string) => ['sets', setId] as const,
  card: (cardId: string) => ['cards', cardId] as const,
  search: (query: string) => ['search', query] as const,
  progress: ['me', 'progress'] as const,
  ownedInSet: (setId: string) => ['me', 'set', setId] as const,
  profile: ['me', 'profile'] as const,
};

export const useSets = () =>
  useQuery({
    queryKey: keys.sets,
    queryFn: ({ signal }) => request<SetListResponse>('/v1/sets', { signal }),
  });

export const useSet = (setId: string) =>
  useQuery({
    queryKey: keys.set(setId),
    queryFn: ({ signal }) => request<SetDetailResponse>(`/v1/sets/${encodeURIComponent(setId)}`, { signal }),
  });

export const useCard = (cardId: string) =>
  useQuery({
    queryKey: keys.card(cardId),
    queryFn: ({ signal }) => request<CardDetailResponse>(`/v1/cards/${encodeURIComponent(cardId)}`, { signal }),
  });

export const useSearch = (query: string) =>
  useQuery({
    queryKey: keys.search(query),
    queryFn: ({ signal }) =>
      request<SearchResponse>(`/v1/search?q=${encodeURIComponent(query)}`, { signal }),
    enabled: query.length >= 2,
    staleTime: MINUTE,
    // Beim Tippen bleiben die letzten Treffer stehen, bis neue da sind.
    placeholderData: (previous) => previous,
  });

export const useCollectionProgress = () =>
  useQuery({
    queryKey: keys.progress,
    queryFn: ({ signal }) => authedRequest<CollectionProgressResponse>('/v1/me/collection/sets', { signal }),
    staleTime: MINUTE,
  });

export const useOwnedInSet = (setId: string) =>
  useQuery({
    queryKey: keys.ownedInSet(setId),
    queryFn: ({ signal }) =>
      authedRequest<CollectionSetResponse>(`/v1/me/collection/sets/${encodeURIComponent(setId)}`, { signal }),
    enabled: setId.length > 0,
    staleTime: MINUTE,
  });

export const useProfile = () =>
  useQuery({
    queryKey: keys.profile,
    queryFn: ({ signal }) => authedRequest<ProfileResponse>('/v1/me/profile', { signal }),
    staleTime: MINUTE,
  });

interface SetQuantityInput {
  cardId: string;
  setId: string;
  quantity: number;
  printing?: string;
}

/**
 * Bestand einer Karte setzen. Die Oberfläche ändert sich sofort; schlägt der
 * Server fehl, springt sie auf den alten Stand zurück.
 */
export function useSetQuantity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, quantity, printing = '' }: SetQuantityInput) =>
      authedRequest<PutCollectionItemResponse>(`/v1/me/collection/items/${encodeURIComponent(cardId)}`, {
        method: 'PUT',
        body: { quantity, printing, source: 'manual' } satisfies PutCollectionItemRequest,
      }),
    onMutate: async ({ cardId, setId, quantity, printing = '' }) => {
      const key = keys.ownedInSet(setId);
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<CollectionSetResponse>(key);
      client.setQueryData<CollectionSetResponse>(key, (current) => {
        const items = (current?.items ?? []).filter(
          (item) => !(item.cardId === cardId && item.printing === printing),
        );
        if (quantity > 0) items.push({ cardId, printing, quantity, source: 'manual' });
        return { setId, items };
      });
      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context) client.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _error, { setId }) => {
      void client.invalidateQueries({ queryKey: keys.ownedInSet(setId) });
      void client.invalidateQueries({ queryKey: keys.progress });
      void client.invalidateQueries({ queryKey: keys.profile });
    },
  });
}
