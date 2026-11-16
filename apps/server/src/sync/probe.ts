import { loadConfig } from '../config.js';
import { mapCard, mapSet, pick, PokemonPriceTrackerSource } from '../sources/pokemon-price-tracker.js';

/**
 * Prüft die Zuordnung gegen die echte API: `npm run ppt:probe`.
 * Kostet 2 Credits (Set-Liste und eine Karte). Zeigt die Feldnamen der Antwort
 * und was der Server daraus liest. Fehlt etwas, die Feldlisten in
 * src/sources/pokemon-price-tracker.ts ergänzen.
 */
const config = loadConfig({ DATABASE_URL: 'unused', ...process.env });
if (!config.ppt.apiKey) {
  console.error('PPT_API_KEY fehlt. Schlüssel in apps/server/.env eintragen.');
  process.exit(1);
}

const source = new PokemonPriceTrackerSource({ apiKey: config.ppt.apiKey, baseUrl: config.ppt.baseUrl });

const keysOf = (value: unknown, prefix = '', depth = 0): string[] => {
  if (typeof value !== 'object' || value === null || depth > 2) return [];
  if (Array.isArray(value)) return keysOf(value[0], `${prefix}[]`, depth);
  return Object.entries(value).flatMap(([key, inner]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return [`${path}: ${Array.isArray(inner) ? 'array' : inner === null ? 'null' : typeof inner}`, ...keysOf(inner, path, depth + 1)];
  });
};

const report = (title: string, raw: unknown, mapped: unknown, credits: unknown) => {
  console.log(`\n=== ${title} ===`);
  console.log('Felder der Antwort (erster Eintrag):');
  for (const line of keysOf(raw)) console.log(`  ${line}`);
  console.log('Gelesen als:', JSON.stringify(mapped, null, 2));
  if (mapped && typeof mapped === 'object') {
    const missing = Object.entries(mapped)
      .filter(([, value]) => value === null || (Array.isArray(value) && value.length === 0))
      .map(([key]) => key);
    console.log(missing.length ? `NICHT GEFUNDEN: ${missing.join(', ')}` : 'Alle Felder gefunden.');
  } else {
    console.log('NICHT LESBAR: ID oder Name fehlen.');
  }
  console.log('Credits:', JSON.stringify(credits));
};

const firstRow = (body: unknown): unknown => {
  const data = Array.isArray(body) ? body : pick(body, ['data', 'results', 'sets', 'cards']);
  return Array.isArray(data) ? data[0] : undefined;
};

const sets = await source.request('/sets', { language: config.sync.language, limit: 1 });
const rawSet = firstRow(sets.body);
const set = mapSet(rawSet, config.sync.language);
report('GET /sets', rawSet, set, sets.credits);

if (set) {
  const cards = await source.request('/cards', { set: set.name, language: set.language, limit: 1 });
  const rawCard = firstRow(cards.body);
  report('GET /cards', rawCard, mapCard(rawCard, set), cards.credits);
}
