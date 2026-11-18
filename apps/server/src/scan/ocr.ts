import { createRequire } from 'node:module';
import { join } from 'node:path';

import { createWorker, PSM, type Worker } from 'tesseract.js';

/**
 * Texterkennung mit Tesseract. Die Sprachdaten kommen aus den npm-Paketen
 * @tesseract.js-data/eng und /jpn und werden nicht aus dem Netz geladen.
 * Englisch liest auch deutsche Namen gut genug; Japanisch braucht eigene Daten.
 *
 * Tesseract braucht pro Bild einige hundert Millisekunden Rechenzeit. Ein kleiner
 * Pool aus Workern verteilt die Last; weitere Anfragen warten in einer Schlange.
 */

const require = createRequire(import.meta.url);
const langPath = (language: 'eng' | 'jpn') =>
  join(require.resolve(`@tesseract.js-data/${language}/package.json`), '..', '4.0.0_best_int');

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface OcrEngine {
  /**
   * `digits` beschränkt die Erkennung auf Ziffern und Schrägstrich, für die Kartennummer.
   * `japanese` liest mit japanischen Sprachdaten, für Namen japanischer Karten.
   */
  recognize(image: Buffer, options?: { digits?: boolean; japanese?: boolean }): Promise<OcrResult>;
  close(): Promise<void>;
}

interface Pool {
  recognize(image: Buffer): Promise<OcrResult>;
  close(): Promise<void>;
}

function createPool(size: number, mode: 'text' | 'digits' | 'japanese'): Pool {
  const digitsOnly = mode === 'digits';
  const language = mode === 'japanese' ? 'jpn' : 'eng';
  const idle: Worker[] = [];
  const waiting: ((worker: Worker) => void)[] = [];
  const all: Promise<Worker>[] = [];
  let closed = false;

  const spawn = async (): Promise<Worker> => {
    const worker = await createWorker(language, 1, {
      langPath: langPath(language),
      gzip: true,
      cacheMethod: 'none',
      logger: () => undefined,
      errorHandler: () => undefined,
    });
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
      // Fest je Worker: Eine leere Liste zurückzusetzen sperrt in tesseract.js alle Zeichen.
      ...(digitsOnly ? { tessedit_char_whitelist: '0123456789/' } : {}),
    });
    return worker;
  };

  const acquire = async (): Promise<Worker> => {
    const ready = idle.pop();
    if (ready) return ready;
    if (all.length < size) {
      const created = spawn();
      all.push(created);
      return created;
    }
    return new Promise((resolve) => waiting.push(resolve));
  };

  const release = (worker: Worker) => {
    const next = waiting.shift();
    if (next) next(worker);
    else idle.push(worker);
  };

  return {
    async recognize(image) {
      if (closed) throw new Error('Texterkennung ist beendet.');
      const worker = await acquire();
      try {
        const { data } = await worker.recognize(image);
        return { text: data.text, confidence: data.confidence };
      } finally {
        release(worker);
      }
    },
    async close() {
      closed = true;
      const workers = await Promise.allSettled(all);
      await Promise.all(
        workers.map((result) => (result.status === 'fulfilled' ? result.value.terminate() : undefined)),
      );
    },
  };
}

/**
 * Drei kleine Pools: Text, nur Ziffern, Japanisch. Worker entstehen erst beim
 * ersten Bedarf; der japanische also nur, wenn japanische Karten gescannt werden.
 */
export function createOcrPool(size = 2): OcrEngine {
  const text = createPool(size, 'text');
  const digits = createPool(size, 'digits');
  const japanese = createPool(size, 'japanese');
  return {
    recognize: (image, options = {}) => (options.digits ? digits : options.japanese ? japanese : text).recognize(image),
    close: async () => {
      await Promise.all([text.close(), digits.close(), japanese.close()]);
    },
  };
}

/** Häufige Lesefehler in Ziffernfolgen. */
const DIGIT_FIXES: Record<string, string> = { O: '0', o: '0', D: '0', Q: '0', l: '1', I: '1', i: '1', '|': '1', S: '5', s: '5', B: '8', Z: '2', z: '2', g: '9' };

/**
 * Findet eine Kartennummer wie "9/24", "009/165" oder "123 / 198".
 * Liefert die Nummer und, falls lesbar, die Gesamtzahl des Sets.
 */
export function parseCardNumber(text: string): { number: number; total: number | null } | null {
  const cleaned = text.replace(/[OoDQlIi|SsBZzg]/g, (char, index: number, all: string) => {
    // Nur Zeichen ersetzen, die zwischen oder neben Ziffern und Schrägstrichen stehen.
    const around = `${all[index - 1] ?? ''}${all[index + 1] ?? ''}`;
    return /[0-9/]/.test(around) ? DIGIT_FIXES[char]! : char;
  });
  // Nummer und Gesamtzahl in derselben Zeile; über einen Zeilenumbruch hinweg entstehen falsche Paare.
  const withTotal = /(\d{1,3})[ \t]*[/\\][ \t]*(\d{1,3})/.exec(cleaned);
  if (withTotal) {
    let digits = withTotal[1]!;
    const total = Number(withTotal[2]);
    // Ein Störzeichen vor der Nummer wird oft als Ziffer gelesen ("994/102" statt "4/102").
    // Nummern weit über der Set-Größe gibt es nicht; dann vorne kürzen.
    while (digits.length > 1 && Number(digits) > total * 1.6) digits = digits.slice(1);
    const number = Number(digits);
    if (number > 0 && total > 0) return { number, total };
  }
  return null;
}

/**
 * Die Namenszeile als Suchtext: alle Zeilen mit Buchstaben, Ziffern am Zeilenende
 * (Lebenspunkte) entfernt. Auf echten Karten stehen dort auch Stufe, "Entwickelt
 * sich aus …" und Störzeichen; welche Zeile der Name ist, entscheidet erst der
 * Vergleich mit dem Katalog (word_similarity sucht den Namen im ganzen Text).
 */
export function parseCardName(text: string): string | null {
  const runs = text
    .split(/\n/)
    .map((line) => line.replace(/[^\p{L}\p{N}' .-]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => /\p{L}{3,}/u.test(line))
    .map((line) => line.replace(/\s*\d+\s*$/, '').trim())
    .filter((line) => line.length >= 3);
  if (runs.length === 0) return null;
  return runs.join(' ').slice(0, 120);
}

/** Lebenspunkte aus der Namenszeile: "100 HP", "HP 340", "KP 110", "PV 60". */
export function parseHp(text: string): number | null {
  const match = /(\d{2,3})\s*(?:HP|KP|PV|PS)\b/i.exec(text) ?? /\b(?:HP|KP|PV|PS)\s*(\d{2,3})/i.exec(text);
  const hp = match ? Number(match[1]) : NaN;
  return hp >= 10 && hp <= 400 && hp % 10 === 0 ? hp : null;
}

/**
 * Jüngstes Jahr im Copyright. Auf alten Karten steht immer "©1995 Nintendo"; ist
 * nur 1995 lesbar, fehlt das entscheidende Jahr, und es gibt keine Angabe.
 * `digitTexts` sind Lesungen der Ziffernerkennung, in denen Jahre ohne Trennzeichen
 * an anderen Ziffern kleben ("12292000" aus "1999-2000").
 */
export function copyrightYear(raw: string, digitTexts: string[] = []): number | null {
  const years = [
    ...[...raw.matchAll(/(?<!\d)(199\d|20[0-4]\d)(?!\d)/g)].map((match) => Number(match[1])),
    ...digitTexts.flatMap((text) => [...text.matchAll(/(199[6-9]|20[0-4]\d)/g)].map((match) => Number(match[1]))),
  ];
  const latest = years.length > 0 ? Math.max(...years) : null;
  return latest !== null && latest > 1996 ? latest : null;
}

/**
 * Ziffernfolgen aus gelesenen Texten, für den Abgleich mit der Nummer einer
 * Kandidatenkarte. Tesseract liest den Schrägstrich oft als Ziffer ("18/130"
 * → "11130" oder "187130"); deshalb zählt, ob eine Folge mit der Set-Größe der Karte endet.
 * Jahreszahlen aus dem Copyright fallen vorher heraus.
 */
export function digitTokens(texts: string[]): string[] {
  return texts
    .join(' ')
    .split(/\s+/)
    .map((token) => token.replace(/(?:19[89]\d|20[0-4]\d)/g, ' ').replace(/[^\d ]/g, ''))
    .flatMap((token) => token.split(' '))
    .filter((token) => token.length >= 2);
}

/** Stimmt die Nummer einer Karte mit einer der Ziffernfolgen überein? 1 = Nummer und Set-Größe, 0,45 = nur Set-Größe. */
export function matchPrintedNumber(tokens: string[], numberSort: number | null, total: number | null): number {
  if (!total || total < 10) return 0;
  const totalText = String(total);
  // Der Schrägstrich fehlt oder ist als Ziffer gelesen: "18130" oder "187130" für 18/130.
  const exact = numberSort !== null ? new RegExp(`${numberSort}\\d?${totalText}$`) : null;
  if (exact && tokens.some((token) => exact.test(token))) return 1;
  // Dreistellige Set-Größen sind selten Zufall; zweistellige nur am Ende einer Folge von mindestens vier Ziffern.
  const hit = tokens.some((token) => token.endsWith(totalText) && (totalText.length >= 3 ? token.length >= 4 : token.length >= 4));
  return hit ? 0.45 : 0;
}

export interface LowerFacts {
  /** Nummer mit Gesamtzahl, etwa 18/130. Mehrere, wenn mehrere Stellen danach aussehen. */
  numbers: { number: number; total: number }[];
  /** Gesamtzahlen hinter einem Schrägstrich, auch wenn die Nummer davor unleserlich ist ("…/130"). */
  totals: number[];
  /** Jüngstes Jahr im Copyright ("© 1999-2000 Wizards" → 2000). */
  year: number | null;
  /** Der gelesene Text, klein geschrieben, für den Vergleich mit Attacken und Illustrator. */
  text: string;
  /** Ziffernfolgen aus diesem Text und den Nummern-Ausschnitten (siehe `digitTokens`). */
  digits?: string[];
}

/**
 * Merkmale aus dem Volltext der unteren Kartenhälfte. Dort stehen Attacken,
 * Illustrator, Copyright mit Jahr und die Nummer. Bei Neuauflagen mit gleichem
 * Bild (Bisaflor aus Base Set 1999, Base Set 2, Legendary Collection) sind
 * Nummer, Set-Größe und Jahr die einzigen Unterschiede.
 */
export function parseLowerText(raw: string): LowerFacts {
  const text = raw.replace(/[|]/g, ' ').replace(/\s+/g, ' ').trim();
  const numbers: { number: number; total: number }[] = [];
  const totals = new Set<number>();
  for (const match of raw.matchAll(/(\d{1,3})[ \t]*[/\\][ \t]*(\d{2,3})(?!\d)/g)) {
    const parsed = parseCardNumber(`${match[1]}/${match[2]}`);
    if (parsed?.total) {
      numbers.push({ number: parsed.number, total: parsed.total });
      totals.add(parsed.total);
    }
  }
  for (const match of raw.matchAll(/[/\\](\d{2,3})(?!\d)/g)) totals.add(Number(match[1]));
  return { numbers, totals: [...totals], year: copyrightYear(raw), text: text.toLowerCase() };
}

/** Japanische Schriftzeichen: Hiragana, Katakana (mit Langvokal ー), Kanji. */
const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]+/gu;

/**
 * Japanische Zeichen der Namenszeile, alle Zeilen aneinander. Tesseract setzt oft
 * Leerzeichen zwischen Zeichen; die fallen weg.
 */
export function parseJapaneseName(text: string): string | null {
  const runs = text
    .split(/\n/)
    .map((line) => (line.replace(/\s+/g, '').match(JAPANESE) ?? []).join(''))
    .filter((run) => run.length >= 2);
  return runs.length > 0 ? runs.join('').slice(0, 40) : null;
}

/**
 * Ohne Dakuten und Handakuten (ボ → ホ, ポ → ホ): Die Texterkennung verwechselt
 * die kleinen Zeichen oft, der Name bleibt dennoch erkennbar.
 */
export const foldJapanese = (value: string) => value.normalize('NFD').replace(/[\u3099\u309a]/g, '').normalize('NFC');

/**
 * Ähnlichkeit zweier japanischer Namen, 0 bis 1: Anteil gemeinsamer
 * Zeichenpaare (Dice). Die Trigramm-Suche der Datenbank taugt für japanische
 * Schrift nicht. Ein Name, der vollständig in der gelesenen Zeile steht, zählt voll.
 */
export function japaneseSimilarity(readText: string, cardName: string): number {
  const read = foldJapanese(readText);
  const name = foldJapanese(cardName);
  if (!read || !name) return 0;
  if (read.includes(name) && name.length >= 2) return 1;
  const pairs = (value: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < value.length - 1; i += 1) out.set(value.slice(i, i + 2), (out.get(value.slice(i, i + 2)) ?? 0) + 1);
    return out;
  };
  const a = pairs(read);
  const b = pairs(name);
  let shared = 0;
  for (const [pair, count] of b) shared += Math.min(count, a.get(pair) ?? 0);
  const total = Math.max(1, read.length - 1) + Math.max(1, name.length - 1);
  // Bei sehr kurzen Namen ist die gelesene Zeile meist länger: am Namen messen, nicht an beiden.
  return Math.min(1, Math.max((2 * shared) / total, shared / Math.max(1, name.length - 1)));
}
