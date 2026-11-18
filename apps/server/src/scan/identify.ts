import type { Db } from '../db/pool.js';
import { binarize, fingerprint, ocrRegions } from './image.js';
import {
  foldJapanese,
  japaneseSimilarity,
  parseCardName,
  parseCardNumber,
  parseHp,
  parseJapaneseName,
  parseLowerText,
  type LowerFacts,
  type OcrEngine,
} from './ocr.js';
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
  /** Übereinstimmung der Merkmale aus der zweiten Stufe (0 bis 1), falls sie lief. */
  details?: number;
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
  /**
   * Zweite Stufe: Anteil der Kartenmerkmale (Nummer und Set-Größe aus dem
   * Volltext, Copyright-Jahr, Attacken, Lebenspunkte, Illustrator) an der Bewertung.
   */
  detailsShare: 0.4,
  details: { number: 0.35, year: 0.25, text: 0.2, hp: 0.1, illustrator: 0.1 },
} as const;

/** Was die zweite Stufe über eine Kandidatenkarte weiß. */
export interface CandidateDetails {
  numberSort: number | null;
  total: number | null;
  releaseYear: number | null;
  hp: number | null;
  /** Anteil der Attacken- und Fähigkeitsnamen, die im gelesenen Text vorkommen; null ohne Angaben. */
  textMatch: number | null;
  /** word_similarity des Illustrators zum gelesenen Text; null ohne Angabe. */
  illustratorSimilarity: number | null;
}

/**
 * Bewertung der Kartenmerkmale aus der zweiten Stufe, 0 bis 1, oder null, wenn
 * nichts davon gelesen wurde. Zählt nur, was auf dem Foto lesbar war.
 */
export function scoreDetails(card: CandidateDetails, read: { lower: LowerFacts; hp: number | null }): number | null {
  const { details: weights } = SCORING;
  const parts: [number, number][] = [];
  const { lower } = read;
  if (lower.numbers.length > 0 || lower.totals.length > 0) {
    const exact = lower.numbers.some((n) => n.number === card.numberSort && n.total === card.total);
    const totalOnly = card.total !== null && lower.totals.includes(card.total);
    parts.push([weights.number, exact ? 1 : totalOnly ? 0.45 : 0]);
  }
  if (lower.year !== null && card.releaseYear !== null) {
    const diff = Math.abs(lower.year - card.releaseYear);
    parts.push([weights.year, diff === 0 ? 1 : diff === 1 ? 0.5 : 0]);
  }
  if (lower.text.length >= 20 && card.textMatch !== null) parts.push([weights.text, card.textMatch]);
  if (read.hp !== null && card.hp !== null) parts.push([weights.hp, read.hp === card.hp ? 1 : 0]);
  if (lower.text.length >= 20 && card.illustratorSimilarity !== null) {
    parts.push([weights.illustrator, card.illustratorSimilarity >= 0.6 ? 1 : card.illustratorSimilarity * 0.5]);
  }
  const total = parts.reduce((sum, [weight]) => sum + weight, 0);
  return total > 0 ? parts.reduce((sum, [weight, value]) => sum + weight * value, 0) / total : null;
}

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
    const variants = [
      () => binarize(regions.numberLeft, 128),
      () => binarize(regions.numberRight, 128),
      () => Promise.resolve(regions.numberLeft),
      () => Promise.resolve(regions.numberRight),
      () => binarize(regions.bottom, 110),
      () => Promise.resolve(regions.bottom),
      () => binarize(regions.bottom, 150),
    ];
    for (const next of variants) {
      const variant = next();
      const parsed = parseCardNumber((await deps.ocr.recognize(await variant, { digits: true })).text);
      if (parsed) return parsed;
    }
    return null;
  };
  let topText = '';
  const readName = async () => {
    for (const variant of [Promise.resolve(regions.top), binarize(regions.top, 120)]) {
      const text = (await deps.ocr.recognize(await variant)).text;
      topText += `\n${text}`;
      const parsed = parseCardName(text);
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
           limit 200`,
          [nameQuery],
        )
      : Promise.resolve({ rows: [] as { id: string }[] }),
  ]);

  // Japanische Karten: Die englische Texterkennung liest ihren Namen nicht. Nur
  // wenn die Nummer (oder ohne Nummer das Bild) auf japanische Karten zeigt,
  // läuft zusätzlich die japanische; sie kostet sonst bei jedem Scan Rechenzeit.
  // Ebenso, wenn der englisch gelesene Name zu keiner Karte passt.
  const japaneseLikely =
    byNumber.rows.some((row) => row.id.startsWith('ja-')) ||
    byName.rows.length === 0 ||
    (!number && visualTop.slice(0, 5).some((hit) => hit.cardId.startsWith('ja-')));
  let japaneseName: string | null = null;
  let byJapaneseName: { id: string }[] = [];
  if (japaneseLikely) {
    for (const variant of [Promise.resolve(regions.top), binarize(regions.top, 120)]) {
      japaneseName = parseJapaneseName((await deps.ocr.recognize(await variant, { japanese: true })).text);
      if (japaneseName) break;
    }
    if (japaneseName) {
      byJapaneseName = (
        await deps.db.query<{ id: string }>(
          `select id from cards
           where id like 'ja-%' and char_length(name) >= 2
             and strpos($1, regexp_replace(normalize(name, NFD), '[\u3099\u309a]', '', 'g')) > 0
           order by char_length(name) desc, id
           limit 40`,
          [foldJapanese(japaneseName)],
        )
      ).rows;
    }
  }

  const ids = [
    ...new Set([
      ...visualTop.map((hit) => hit.cardId),
      ...byNumber.rows.map((r) => r.id),
      ...byName.rows.map((r) => r.id),
      ...byJapaneseName.map((r) => r.id),
    ]),
  ];
  const shownName = ocrName ?? japaneseName;
  if (ids.length === 0) {
    return { outcome: 'none', candidates: [], ocrName: shownName, ocrNumber: null, durationMs: Date.now() - started };
  }

  type FactRow = {
    id: string;
    name: string;
    number_sort: number | null;
    number: string | null;
    card_count: number;
    name_sim: number;
    hp: number | null;
    release_year: number | null;
    text_match: number | null;
    illustrator_sim: number | null;
  };
  /** Merkmale der Kandidaten. Mit `lowerText` auch Attacken und Illustrator im Vergleich zum gelesenen Text. */
  const loadFacts = (candidateIds: string[], lowerText: string) =>
    deps.db.query<FactRow>(
      `select c.id, c.name, c.number_sort, c.number, s.card_count, c.hp,
              extract(year from s.release_date)::int as release_year,
              case when $2 = '' then 0 else word_similarity(lower(c.name), $2) end as name_sim,
              case when $3 = '' or c.card_text is null then null else
                (select avg(case when word_similarity(lower(t), $3) >= 0.6 then 1.0 else 0.0 end)::float
                 from unnest(string_to_array(c.card_text, ' | ')) t) end as text_match,
              case when $3 = '' or c.illustrator is null then null
                   else word_similarity(lower(c.illustrator), $3) end as illustrator_sim
       from cards c join sets s on s.id = c.set_id
       where c.id = any($1::text[])`,
      [candidateIds, nameQuery, lowerText],
    );

  const visual = new Map(visualTop.map((hit) => [hit.cardId, hit.similarity]));
  const ensureVisual = (candidateIds: string[]) => {
    const missing = candidateIds.filter((id) => !visual.has(id));
    for (const [id, similarity] of deps.index.similarityTo(vector, missing)) visual.set(id, similarity);
  };
  const totalOf = (row: FactRow) => {
    const printedTotal = /\/\s*(\d+)/.exec(row.number ?? '')?.[1];
    return printedTotal ? Number(printedTotal) : row.card_count;
  };
  const scoreRow = (row: FactRow) =>
    scoreCandidate(
      {
        cardId: row.id,
        numberSort: row.number_sort,
        total: totalOf(row),
        nameSimilarity:
          japaneseName && row.id.startsWith('ja-')
            ? Math.max(Number(row.name_sim), japaneseSimilarity(japaneseName, row.name))
            : Number(row.name_sim),
        visualSimilarity: visual.get(row.id) ?? null,
      },
      { number, hasName: nameQuery.length > 0 || japaneseName !== null },
    );

  // Stufe 1: Name, Nummer, Bild.
  ensureVisual(ids);
  let scored = (await loadFacts(ids, '')).rows.map(scoreRow);
  let decision = decide(scored);

  // Stufe 2, nur wenn Stufe 1 nicht eindeutig ist: Volltext der unteren Hälfte
  // lesen und Nummer, Set-Größe, Copyright-Jahr, Attacken, Lebenspunkte und
  // Illustrator jeder Kandidatenkarte vergleichen. Trennt etwa Neuauflagen mit
  // gleichem Bild und gleichem Namen.
  if (decision.outcome !== 'match') {
    const lower = parseLowerText((await deps.ocr.recognize(regions.lower)).text);
    const hp = parseHp(topText);
    const more = lower.numbers.length
      ? (
          await deps.db.query<{ id: string }>(
            `select c.id from cards c join sets s on s.id = c.set_id
             join unnest($1::int[], $2::int[]) as r (num, total)
               on c.number_sort = r.num and (s.card_count = r.total or c.number like '%/' || r.total::text)
             limit 80`,
            [lower.numbers.map((n) => n.number), lower.numbers.map((n) => n.total)],
          )
        ).rows.map((row) => row.id)
      : [];
    const allIds = [...new Set([...ids, ...more])];
    ensureVisual(allIds);
    const rows = (await loadFacts(allIds, lower.text)).rows;
    scored = rows.map((row) => {
      const base = scoreRow(row);
      const details = scoreDetails(
        {
          numberSort: row.number_sort,
          total: totalOf(row),
          releaseYear: row.release_year,
          hp: row.hp,
          textMatch: row.text_match === null ? null : Number(row.text_match),
          illustratorSimilarity: row.illustrator_sim === null ? null : Number(row.illustrator_sim),
        },
        { lower, hp },
      );
      if (details === null) return base;
      return { ...base, details, score: (1 - SCORING.detailsShare) * base.score + SCORING.detailsShare * details };
    });
    decision = decide(scored);
  }

  const { outcome, candidates } = decision;
  return {
    outcome,
    candidates,
    ocrName: shownName,
    ocrNumber: number ? `${number.number}${number.total ? `/${number.total}` : ''}` : null,
    durationMs: Date.now() - started,
  };
}
