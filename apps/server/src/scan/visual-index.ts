import type { Db } from '../db/pool.js';
import { FINGERPRINT_DIM } from './image.js';

/**
 * Alle Fingerabdrücke des Katalogs im Speicher. Die Suche vergleicht einen Scan
 * mit jeder Karte: bei 50.000 Karten rund 34 Millionen Rechenschritte, in der
 * Praxis einige zehn Millisekunden. Neu geladen wird nur, wenn sich der Katalog
 * geändert hat.
 */
export class VisualIndex {
  private ids: string[] = [];
  private vectors = new Int8Array(0);
  private version: string | null = null;
  private loading: Promise<void> | null = null;

  constructor(
    private readonly db: Db,
    private readonly currentVersion: () => Promise<string>,
  ) {}

  get size(): number {
    return this.ids.length;
  }

  private async load(version: string): Promise<void> {
    const result = await this.db.query<{ card_id: string; vec: Buffer }>(
      `select card_id, vec from card_fingerprints order by card_id`,
    );
    const ids: string[] = [];
    const vectors = new Int8Array(result.rows.length * FINGERPRINT_DIM);
    for (const row of result.rows) {
      if (row.vec.length !== FINGERPRINT_DIM) continue;
      vectors.set(new Int8Array(row.vec.buffer, row.vec.byteOffset, row.vec.length), ids.length * FINGERPRINT_DIM);
      ids.push(row.card_id);
    }
    this.ids = ids;
    this.vectors = vectors.subarray(0, ids.length * FINGERPRINT_DIM);
    this.version = version;
  }

  async ensureFresh(): Promise<void> {
    const version = await this.currentVersion();
    if (version === this.version) return;
    this.loading ??= this.load(version).finally(() => {
      this.loading = null;
    });
    await this.loading;
  }

  /** Die `limit` ähnlichsten Karten mit Kosinus-Ähnlichkeit (−1 bis 1). */
  search(query: Float32Array, limit: number): { cardId: string; similarity: number }[] {
    const dim = FINGERPRINT_DIM;
    const scores = new Float32Array(this.ids.length);
    // Die gespeicherten Werte sind mit 127 × 4 skaliert und auf ±127 begrenzt.
    const scale = 1 / (127 * 4);
    for (let item = 0; item < this.ids.length; item += 1) {
      let dot = 0;
      const base = item * dim;
      for (let i = 0; i < dim; i += 1) dot += query[i]! * this.vectors[base + i]!;
      scores[item] = dot * scale;
    }
    const order = Array.from(scores.keys()).sort((a, b) => scores[b]! - scores[a]!);
    return order.slice(0, limit).map((index) => ({ cardId: this.ids[index]!, similarity: scores[index]! }));
  }

  /** Ähnlichkeit zu bestimmten Karten, etwa den Treffern der Texterkennung. */
  similarityTo(query: Float32Array, cardIds: string[]): Map<string, number> {
    const wanted = new Set(cardIds);
    const out = new Map<string, number>();
    const scale = 1 / (127 * 4);
    for (let item = 0; item < this.ids.length; item += 1) {
      const id = this.ids[item]!;
      if (!wanted.has(id)) continue;
      let dot = 0;
      const base = item * FINGERPRINT_DIM;
      for (let i = 0; i < FINGERPRINT_DIM; i += 1) dot += query[i]! * this.vectors[base + i]!;
      out.set(id, dot * scale);
    }
    return out;
  }
}
