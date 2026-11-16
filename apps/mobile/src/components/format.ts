import type { Money } from '@value/api-types';

const formatters = new Map<string, Intl.NumberFormat>();

/** Betrag in deutscher Schreibweise, zum Beispiel "12,50 €" oder "3,20 $". */
export function formatMoney(money: Money | null | undefined): string {
  if (!money) return 'kein Preis';
  let formatter = formatters.get(money.currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: money.currency });
    formatters.set(money.currency, formatter);
  }
  return formatter.format(money.amount);
}

/** ISO-Datum als "14. März 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'unbekannt';
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(date.getTime())) return 'unbekannt';
  return new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export const formatCount = (value: number): string => new Intl.NumberFormat('de-DE').format(value);
