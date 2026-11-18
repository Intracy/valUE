import sharp from 'sharp';

/** Seitenverhältnis einer Karte, 63 × 88 mm. */
const CARD_ASPECT = 63 / 88;
/** Auflösung der Suche; genug für Ränder, schnell genug für jeden Scan. */
const WORK_WIDTH = 400;

export interface CardFrame {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Sucht die Karte in einem Foto, auf dem sie nicht den ganzen Ausschnitt füllt
 * (Hand, Tisch, Hülle im Bild). Gibt ihr Rechteck in Bildpunkten des Fotos
 * zurück, oder null, wenn keins mit Kartenproportionen zu finden ist.
 *
 * Vorgehen: Für jede Spalte zählen, wie viele Bildpunkte eine deutliche
 * senkrechte Kante haben, für jede Zeile die waagerechten. Der Kartenrahmen
 * läuft über die ganze Kartenbreite und -höhe und gibt in den Randstreifen
 * klare Spitzen; Schriftzeilen nicht. Aus den Spitzen je Seite gewinnt die
 * Kombination mit Kartenproportionen und möglichst großer Fläche, damit der
 * äußere Rahmen vor dem Rahmen des Artworks kommt.
 */
export async function findCardFrame(input: Buffer): Promise<CardFrame | null> {
  const oriented = sharp(input, { failOn: 'none' }).rotate();
  const meta = await sharp(await oriented.clone().png().toBuffer()).metadata();
  const { data, info } = await oriented.resize({ width: WORK_WIDTH }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const columns = new Float64Array(W);
  const rows = new Float64Array(H);
  for (let y = 1; y < H - 1; y += 1) {
    for (let x = 1; x < W - 1; x += 1) {
      const gx = Math.abs(data[y * W + x + 1]! - data[y * W + x - 1]!);
      const gy = Math.abs(data[(y + 1) * W + x]! - data[(y - 1) * W + x]!);
      if (gx > 18 && gx > 2 * gy) columns[x]! += 1;
      if (gy > 18 && gy > 2 * gx) rows[y]! += 1;
    }
  }
  /** Örtliche Spitzen, die über mindestens ein Viertel der Seite reichen; die sechs stärksten. */
  const peaks = (profile: Float64Array, from: number, to: number, span: number) => {
    const out: number[] = [];
    for (let i = Math.max(from, 1); i < Math.min(to, profile.length - 1); i += 1) {
      if (profile[i]! >= span * 0.25 && profile[i]! >= profile[i - 1]! && profile[i]! >= profile[i + 1]!) out.push(i);
    }
    return out.sort((a, b) => profile[b]! - profile[a]!).slice(0, 6);
  };
  const lefts = peaks(columns, 0, Math.round(W * 0.3), H);
  const rights = peaks(columns, Math.round(W * 0.7), W, H);
  const tops = peaks(rows, 0, Math.round(H * 0.3), W);
  const bottoms = peaks(rows, Math.round(H * 0.7), H, W);

  let best: { left: number; right: number; top: number; bottom: number; score: number } | null = null;
  for (const left of lefts) {
    for (const right of rights) {
      for (const top of tops) {
        for (const bottom of bottoms) {
          const width = right - left;
          const height = bottom - top;
          const fit = Math.max(0, 1 - Math.abs(width / height - CARD_ASPECT) / 0.04);
          const area = (width * height) / (W * H);
          if (fit < 0.5 || area < 0.2) continue;
          const strength = (columns[left]! / H + columns[right]! / H + rows[top]! / W + rows[bottom]! / W) / 4;
          const score = fit * area * (0.5 + strength);
          if (!best || score > best.score) best = { left, right, top, bottom, score };
        }
      }
    }
  }
  if (!best || !meta.width || !meta.height) return null;
  // Etwas Rand zugeben: Oft gewinnt der innere Rahmen (gelber Rand → Kartenfläche),
  // und Nummer und Copyright stehen knapp darunter. Ein schmaler Streifen Hintergrund
  // stört die Leseausschnitte weniger als eine abgeschnittene Nummer.
  const scale = meta.width / W;
  const padX = (best.right - best.left) * 0.025;
  const padY = (best.bottom - best.top) * 0.025;
  const left = Math.max(0, Math.round((best.left - padX) * scale));
  const top = Math.max(0, Math.round((best.top - padY) * scale));
  const right = Math.min(meta.width, Math.round((best.right + padX) * scale));
  const bottom = Math.min(meta.height, Math.round((best.bottom + padY) * scale));
  return { left, top, width: right - left, height: bottom - top };
}

/** Schneidet die gefundene Karte aus. Liefert null, wenn keine gefunden wurde oder sie das Bild schon fast füllt. */
export async function cropToCard(input: Buffer): Promise<Buffer | null> {
  const frame = await findCardFrame(input);
  if (!frame) return null;
  const meta = await sharp(input, { failOn: 'none' }).rotate().png().toBuffer().then((buffer) => sharp(buffer).metadata());
  const coverage = (frame.width * frame.height) / ((meta.width ?? 1) * (meta.height ?? 1));
  if (coverage > 0.9) return null;
  return sharp(input, { failOn: 'none' }).rotate().extract(frame).jpeg({ quality: 92 }).toBuffer();
}
