import type { ApiError } from '@value/api-types';

/**
 * Die App spricht ausschließlich mit dem eigenen Server. Der Schlüssel des
 * Datenanbieters liegt nur dort und kommt in der App nicht vor.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/+$/, '');

const TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    /** HTTP-Status, 0 bei Netzwerkfehler oder Zeitüberschreitung. */
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'PUT' | 'POST';
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  // Bricht die Abfrage ab, wenn der Bildschirm verlassen wird.
  const forward = () => controller.abort();
  options.signal?.addEventListener('abort', forward);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : null),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : null),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiRequestError('Der Server ist nicht erreichbar.', 0, 'network');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', forward);
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      payload?.error?.message ?? `Fehler ${response.status}`,
      response.status,
      payload?.error?.code ?? 'unknown',
    );
  }
  return (await response.json()) as T;
}
