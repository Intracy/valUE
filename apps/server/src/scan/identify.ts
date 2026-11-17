import type { Db } from '../db/pool.js';
import { binarize, fingerprint, ocrRegions } from './image.js';
import { parseCardName, parseCardNumber, type OcrEngine } from './ocr.js';
import type { VisualIndex } from './visual-index.js';

/**
 * Erkennung einer Karte aus einem Foto. Drei Signale fließen ein:
 *
 * 1. Bildähnlichkeit zu jeder Karte im Katalog (Fingerabdruck),
 * 2. der gelesene Kartenname (Texterkennung der oberen Zeile),
 * 3. die gelesene Kartennummer mit Set-Größe, etwa "9/24" (untere Zeile).
 *
 * Keines reicht allein: Namen wiederholen sich über Sets, Nummern sowieso, und
 * Bildähnlichkeit verwechselt Karten mit ähnlichem Aufbau. Zusammen trennen sie gut.
 */

export type ScanOutcome = 'match' | 'unsure' | 'none';

export interface ScoredCandidate {
  cardId: string;
  score: number;
  visual: number;
  name: number;
  number: number;
}

export interface Identification {
  outcome: ScanOutcome;
  candidates: ScoredCandidate[];
  ocrName: string | null;
  ocrNumber: string | null;
  durationMs: number;
}

export interface CandidateFacts {
  cardId: string;
  /** Führende Zahl der Kartennummer. */
  numberSort: number | null;
  /** Gesamtzahl hinter dem Schrägstrich der Kartennummer, sonst Kartenzahl des Sets. */
  total: number | null;
  /** word_similarity des Kartennamens zur gelesenen Namenszeile, 0 bis 1. */
  nameSimilarity: number;
  /** Kosinus-Ähnlichkeit der Fingerabdrücke, −1 bis 1. */
  visualSimilarity: number | null;
}

/** Gewichte und Schwellen. Abgestimmt mit `npm run scan:benchmark`, siehe docs/SCANNER.md. */
export const SCORING = {
  weights: { visual: 0.45, name: 0.3, number: 0.25 },
  /** Kosinus-Ähnlichkeit, ab der das Bildsignal zählt, und der Wert, ab dem es voll zählt. */
  visualFloor: 0.35,
  visualCeil: 0.85,
  /** Eindeutig: so hoch und so weit vor dem Zweiten. */
  matchScore: 0.62,
  matchMargin: 0.12,
  /** Darunter zeigt der Scanner keine Vorschläge, sondern "nicht erkannt". */
  minScore: 0.22,
  maxCandidates: 5,
} as const;

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function scoreCandidate(
  facts: CandidateFacts,
  read: { number: { number: number; total: number | null } | null; hasName: boolean },
): ScoredCandidate {
  const visual =
    facts.visualSimilarity === null
      ? 0
      : clamp((facts.visualSimilarity - SCORING.visualFloor) / (SCORING.visualCeil - SCORING.visualFloor));
  const name = read.hasName ? clamp(facts.nameSimilarity) : 0;
  let number = 0;
  if (read.number && facts.numberSort === read.number.number) {
    number = read.number.total === null || read.number.total === facts.total ? 1 : 0.5;
  }
  const { weights } = SCORING;
  return {
    cardId: facts.cardId,
    score: weights.visual * visual + weights.name * name + weights.number * number,
    visual,
    name,
    number,
  };
}

/** Sortiert, entscheidet und kürzt die Liste auf das, was der Nutzer sehen soll. */
export function decide(scored: ScoredCandidate[]): { outcome: ScanOutcome; candidates: ScoredCandidate[] } {
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  if (!top || top.score < SCORING.minScore) return { outcome: 'none', candidates: [] };
  const second = sorted[1]?.score ?? 0;
  if (top.score >= SCORING.matchScore && top.score - second >= SCORING.matchMargin) {
    // Eindeutig, aber die nächsten bleiben als Ausweich-Vorschläge dabei.
    return { outcome: 'match', candidates: sorted.slice(0, SCORING.maxCandidates) };
  }
  const floor = Math.max(SCORING.minScore, top.score - 0.3);
  return {
    outcome: 'unsure',
    candidates: sorted.filter((candidate) => candidate.score >= floor).slice(0, SCORING.maxCandidates),
  };
}

export async function identifyCard(
  image: Buffer,
  deps: { db: Db; index: VisualIndex; ocr: OcrEngine },
): Promise<Identification> {
  const started = Date.now();
  const regions = await ocrRegions(image);

  // Mehrere Fassungen nacheinander, bis eine lesbar ist. Die erste klappt meistens,
  // die weiteren kosten nur bei schwierigen Fotos Zeit.
  const readNumber = async () => {
    for (const variant of [binarize(regions.bottom, 110), Promise.resolve(regions.bottom), binarize(regions.bottom, 150)]) {
      const parsed = parseCardNumber((await deps.ocr.recognize(await variant, { digits: true })).text);
      if (parsed) return parsed;
    }
    return null;
  };
  const readName = async () => {
    for (const variant of [Promise.resolve(regions.top), binarize(regions.top, 120)]) {
      const parsed = parseCardName((await deps.ocr.recognize(await variant)).text);
      if (parsed) return parsed;
    }
    return null;
  };

  const [vector, ocrName, number] = await Promise.all([
    fingerprint(image),
    readName(),
    readNumber(),
    deps.index.ensureFresh(),
  ]);
  const nameQuery = ocrName?.toLowerCase() ?? '';

  // Kandidaten aus drei Quellen sammeln: Bild, Nummer, Name.
  const visualTop = deps.index.search(vector, 40);
  const [byNumber, byName] = await Promise.all([
    number
      ? deps.db.query<{ id: string }>(
          `select c.id from cards c join sets s on s.id = c.set_id
           where c.number_sort = $1 and ($2::int is null or s.card_count = $2 or c.number like '%/' || $2::text)
           limit 80`,
          [number.number, number.total],
        )
      : Promise.resolve({ rows: [] as { id: string }[] }),
    nameQuery
      ? deps.db.query<{ id: string }>(
          `select id from cards
           where word_similarity(lower(name), $1) >= 0.4
           order by word_similarity(lower(name), $1) desc, id
           limit 40`,
          [nameQuery],
        )
      : Promise.resolve({ rows: [] as { id: string }[] }),
  ]);

  const ids = [...new Set([...visualTop.map((hit) => hit.cardId), ...byNumber.rows.map((r) => r.id), ...byName.rows.map((r) => r.id)])];
  if (ids.length === 0) {
    return { outcome: 'none', candidates: [], ocrName, ocrNumber: null, durationMs: Date.now() - started };
  }

  const facts = await deps.db.query<{ id: string; number_sort: number | null; number: string | null; card_count: number; name_sim: number }>(
    `select c.id, c.number_sort, c.number, s.card_count,
            case when $2 = '' then 0 else word_similarity(lower(c.name), $2) end as name_sim
     from cards c join sets s on s.id = c.set_id
     where c.id = any($1::text[])`,
    [ids, nameQuery],
  );

  const visual = new Map(visualTop.map((hit) => [hit.cardId, hit.similarity]));
  const missing = ids.filter((id) => !visual.has(id));
  for (const [id, similarity] of deps.index.similarityTo(vector, missing)) visual.set(id, similarity);

  const scored = facts.rows.map((row) => {
    const printedTotal = /\/\s*(\d+)/.exec(row.number ?? '')?.[1];
    return scoreCandidate(
      {
        cardId: row.id,
        numberSort: row.number_sort,
        total: printedTotal ? Number(printedTotal) : row.card_count,
        nameSimilarity: Number(row.name_sim),
        visualSimilarity: visual.get(row.id) ?? null,
      },
      { number, hasName: nameQuery.length > 0 },
    );
  });

  const { outcome, candidates } = decide(scored);
  return {
    outcome,
    candidates,
    ocrName,
    ocrNumber: number ? `${number.number}${number.total ? `/${number.total}` : ''}` : null,
    durationMs: Date.now() - started,
  };
}
