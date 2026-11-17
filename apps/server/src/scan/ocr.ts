import { createRequire } from 'node:module';
import { join } from 'node:path';

import { createWorker, PSM, type Worker } from 'tesseract.js';

/**
 * Texterkennung mit Tesseract. Die Sprachdaten kommen aus dem npm-Paket
 * @tesseract.js-data/eng und werden nicht aus dem Netz geladen.
 *
 * Tesseract braucht pro Bild einige hundert Millisekunden Rechenzeit. Ein kleiner
 * Pool aus Workern verteilt die Last; weitere Anfragen warten in einer Schlange.
 */

const require = createRequire(import.meta.url);
const langPath = join(require.resolve('@tesseract.js-data/eng/package.json'), '..', '4.0.0_best_int');

export interface OcrResult {
  text: string;
  confidence: number;
}

export interface OcrEngine {
  /** `digits` beschränkt die Erkennung auf Ziffern und Schrägstrich, für die Kartennummer. */
  recognize(image: Buffer, options?: { digits?: boolean }): Promise<OcrResult>;
  close(): Promise<void>;
}

interface Pool {
  recognize(image: Buffer): Promise<OcrResult>;
  close(): Promise<void>;
}

function createPool(size: number, digitsOnly: boolean): Pool {
  const idle: Worker[] = [];
  const waiting: ((worker: Worker) => void)[] = [];
  const all: Promise<Worker>[] = [];
  let closed = false;

  const spawn = async (): Promise<Worker> => {
    const worker = await createWorker('eng', 1, {
      langPath,
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

/** Zwei kleine Pools: einer für Text, einer nur für Ziffern. */
export function createOcrPool(size = 2): OcrEngine {
  const text = createPool(size, false);
  const digits = createPool(size, true);
  return {
    recognize: (image, options = {}) => (options.digits ? digits : text).recognize(image),
    close: async () => {
      await Promise.all([text.close(), digits.close()]);
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
  const withTotal = /(\d{1,3})\s*[/\\]\s*(\d{1,3})/.exec(cleaned);
  if (withTotal) {
    const number = Number(withTotal[1]);
    const total = Number(withTotal[2]);
    if (number > 0 && total > 0) return { number, total };
  }
  return null;
}

/** Der wahrscheinlichste Kartenname aus der oberen Zeile: längster Wortlauf aus Buchstaben. */
export function parseCardName(text: string): string | null {
  const runs = text
    .split(/\n/)
    .map((line) => line.replace(/[^\p{L}\p{N}' .-]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => /\p{L}{3,}/u.test(line));
  if (runs.length === 0) return null;
  // Die längste Zeile mit Buchstaben ist meist der Name; Ziffern am Ende (Lebenspunkte) fallen weg.
  const best = runs.sort((a, b) => b.length - a.length)[0]!.replace(/\s*\d+\s*$/, '').trim();
  return best.length >= 3 ? best.slice(0, 60) : null;
}
