import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';

import { asIsoTimestamp, asNumber, asText, slugify } from './pokemon-price-tracker.js';

/**
 * Tages-Export von Pokemon Price Tracker (nur Business-Tarif).
 * Spalten des Exports `printings` laut API-Referenz:
 * tcgPlayerId, name, setName, setId, cardNumber, rarity, language, printing,
 * marketPrice, lowPrice, sellers, lastPriceUpdate, dazu Preise je Zustand.
 * Eine Zeile pro Druckvariante. Die Datei wird als Strom gelesen, nie ganz im Speicher gehalten.
 */

export interface ExportPrintingRow {
  cardId: string;
  name: string;
  setId: string;
  setName: string;
  number: string | null;
  rarity: string | null;
  language: string;
  printing: string;
  marketPriceUsd: number | null;
  lowPriceUsd: number | null;
  priceUpdatedAt: string | null;
}

/** Zerlegt eine CSV-Zeile. Unterstützt Anführungszeichen und verdoppelte Anführungszeichen. */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields;
}

/** Liefert vollständige CSV-Datensätze, auch wenn ein Feld einen Zeilenumbruch enthält. */
export async function* csvRecords(chunks: AsyncIterable<string | Buffer>): AsyncGenerator<string[]> {
  let buffer = '';
  let quotes = 0;
  let scanned = 0;
  for await (const chunk of chunks) {
    buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    let start = 0;
    for (let index = scanned; index < buffer.length; index += 1) {
      const char = buffer[index];
      if (char === '"') quotes += 1;
      else if (char === '\n' && quotes % 2 === 0) {
        const line = buffer.slice(start, index).replace(/\r$/, '');
        if (line.length > 0) yield parseCsvLine(line);
        start = index + 1;
      }
    }
    buffer = buffer.slice(start);
    scanned = buffer.length;
    // Der Rest beginnt an einer Datensatzgrenze, also mit gerader Zahl an Anführungszeichen.
    quotes = (buffer.match(/"/g) ?? []).length;
  }
  const rest = buffer.replace(/\r$/, '');
  if (rest.length > 0) yield parseCsvLine(rest);
}

export async function* exportPrintingRows(chunks: AsyncIterable<string | Buffer>): AsyncGenerator<ExportPrintingRow> {
  let header: string[] | null = null;
  for await (const record of csvRecords(chunks)) {
    if (!header) {
      header = record.map((name) => name.trim());
      for (const required of ['tcgPlayerId', 'name', 'setName']) {
        if (!header.includes(required)) throw new Error(`Export ohne Spalte "${required}".`);
      }
      continue;
    }
    const cell = (name: string) => record[header!.indexOf(name)];
    const cardId = asText(cell('tcgPlayerId'));
    const name = asText(cell('name'));
    const setName = asText(cell('setName'));
    if (!cardId || !name || !setName) continue;
    yield {
      cardId,
      name,
      setName,
      setId: asText(cell('setId')) ?? slugify(setName),
      number: asText(cell('cardNumber')),
      rarity: asText(cell('rarity')),
      language: asText(cell('language'))?.toLowerCase() ?? 'english',
      printing: asText(cell('printing')) ?? '',
      marketPriceUsd: asNumber(cell('marketPrice')),
      lowPriceUsd: asNumber(cell('lowPrice')),
      priceUpdatedAt: asIsoTimestamp(cell('lastPriceUpdate')),
    };
  }
}

/** Öffnet den Export als Textstrom. Folgt der Weiterleitung zum CDN und entpackt gzip. */
export async function openExport(options: {
  apiKey: string;
  baseUrl: string;
  type: 'printings' | 'cards' | 'sealed';
  fetchImpl?: typeof fetch;
}): Promise<AsyncIterable<Buffer>> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${options.baseUrl.replace(/\/+$/, '')}/export?type=${options.type}`, {
    headers: { Authorization: `Bearer ${options.apiKey}` },
    redirect: 'follow',
  });
  if (!response.ok || !response.body) {
    throw new Error(`Export nicht verfügbar (Status ${response.status}). Der Export braucht den Business-Tarif.`);
  }
  const body = Readable.fromWeb(response.body as import('node:stream/web').ReadableStream<Uint8Array>);
  const encoded = response.headers.get('content-encoding');
  // fetch entpackt selbst, wenn der Server Content-Encoding setzt. Liegt die Datei
  // als .gz auf dem CDN, kommt sie gepackt an und wird hier entpackt.
  return encoded ? body : body.pipe(createGunzip());
}
