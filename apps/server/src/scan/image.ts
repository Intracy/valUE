import sharp from 'sharp';

/**
 * Bild-Fingerabdruck einer Karte: ein kleines Farbraster und die Helligkeitskanten
 * eines Graustufenbildes. Beide Teile werden normalisiert, damit Belichtung,
 * Kontrast und Farbstich eines Handyfotos möglichst wenig ausmachen.
 *
 * Das ist bewusst ein einfaches Verfahren ohne trainiertes Modell. Es trägt die
 * Erkennung zusammen mit der Texterkennung; ein gelerntes Bildmodell kann es
 * später ersetzen, ohne dass sich außerhalb dieser Datei etwas ändert.
 */

const COLOR_W = 9;
const COLOR_H = 12;
const EDGE_W = 12;
const EDGE_H = 16;

export const FINGERPRINT_DIM = COLOR_W * COLOR_H * 3 + (EDGE_W - 1) * EDGE_H + EDGE_W * (EDGE_H - 1);

/** Gewicht der beiden Teile im Vergleich. */
const COLOR_WEIGHT = 0.6;
const EDGE_WEIGHT = 0.4;

function normalize(values: Float32Array, weight: number): Float32Array {
  let mean = 0;
  for (const value of values) mean += value;
  mean /= values.length;
  let norm = 0;
  for (let i = 0; i < values.length; i += 1) {
    values[i] = values[i]! - mean;
    norm += values[i]! * values[i]!;
  }
  const scale = norm > 0 ? weight / Math.sqrt(norm) : 0;
  for (let i = 0; i < values.length; i += 1) values[i] = values[i]! * scale;
  return values;
}

/** Fingerabdruck als Float-Vektor mit Länge 1. */
export async function fingerprint(input: Buffer): Promise<Float32Array> {
  // Erst auf ein mittleres Format bringen: entfernt EXIF-Drehung und Rauschen.
  // Zwischenstufe als eigenes Bild: sharp kennt je Pipeline nur eine Größenänderung.
  const small = await sharp(input, { failOn: 'none' }).rotate().resize(90, 126, { fit: 'fill' }).removeAlpha().png().toBuffer();
  const [color, gray] = await Promise.all([
    sharp(small).resize(COLOR_W, COLOR_H, { fit: 'fill' }).raw().toBuffer(),
    sharp(small).greyscale().resize(EDGE_W, EDGE_H, { fit: 'fill' }).raw().toBuffer(),
  ]);

  // Farbe je Kanal für sich normalisieren: gleicht Weißabgleich und Belichtung aus.
  const channels = [0, 1, 2].map((channel) => {
    const values = new Float32Array(COLOR_W * COLOR_H);
    for (let i = 0; i < values.length; i += 1) values[i] = color[i * 3 + channel]!;
    return normalize(values, COLOR_WEIGHT / Math.sqrt(3));
  });

  const edges = new Float32Array((EDGE_W - 1) * EDGE_H + EDGE_W * (EDGE_H - 1));
  let k = 0;
  for (let y = 0; y < EDGE_H; y += 1) {
    for (let x = 0; x < EDGE_W - 1; x += 1) edges[k++] = gray[y * EDGE_W + x + 1]! - gray[y * EDGE_W + x]!;
  }
  for (let y = 0; y < EDGE_H - 1; y += 1) {
    for (let x = 0; x < EDGE_W; x += 1) edges[k++] = gray[(y + 1) * EDGE_W + x]! - gray[y * EDGE_W + x]!;
  }
  normalize(edges, EDGE_WEIGHT);

  const out = new Float32Array(FINGERPRINT_DIM);
  let offset = 0;
  for (const part of [...channels, edges]) {
    out.set(part, offset);
    offset += part.length;
  }
  // Gesamtlänge 1, damit das Skalarprodukt direkt die Kosinus-Ähnlichkeit ist.
  let norm = 0;
  for (const value of out) norm += value * value;
  const scale = norm > 0 ? 1 / Math.sqrt(norm) : 0;
  for (let i = 0; i < out.length; i += 1) out[i] = out[i]! * scale;
  return out;
}

/** Speicherform: 8 Bit je Wert. 50.000 Karten brauchen so rund 40 MB im Speicher. */
export function quantize(vector: Float32Array): Buffer {
  const out = Buffer.alloc(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    out.writeInt8(Math.max(-127, Math.min(127, Math.round(vector[i]! * 127 * 4))), i);
  }
  return out;
}

/** Lädt ein Bild aus einer data-URL oder von einer HTTP-Adresse. */
export async function loadImage(url: string, timeoutMs = 15_000): Promise<Buffer> {
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',');
    const meta = url.slice(5, comma);
    const payload = url.slice(comma + 1);
    return meta.endsWith(';base64') ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8');
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`Bild nicht ladbar (${response.status}): ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Ausschnitte für die Texterkennung: Namenszeile oben, Nummernzeile unten.
 * Vergrößert, in Graustufen, kontrastgestreckt und immer als dunkle Schrift auf
 * hellem Grund, weil Tesseract so am zuverlässigsten liest. Ist der Ausschnitt
 * überwiegend dunkel (helle Schrift), wird er umgekehrt.
 */
export async function ocrRegions(input: Buffer): Promise<{ top: Buffer; bottom: Buffer }> {
  // Erst auf Normgröße bringen und als eigenes Bild ablegen, dann ausschneiden.
  const card = await sharp(input, { failOn: 'none' }).rotate().resize(630, 880, { fit: 'fill' }).png().toBuffer();
  const prepare = async (top: number, height: number) => {
    const gray = await sharp(card)
      .extract({ left: 0, top, width: 630, height })
      .resize({ width: 1260 })
      .greyscale()
      .normalise()
      .png()
      .toBuffer();
    const { channels } = await sharp(gray).stats();
    const dark = (channels[0]?.mean ?? 255) < 128;
    // Ohne sharpen(): In dieser sharp-Version macht es ein umgekehrtes Graubild schwarz.
    return (dark ? sharp(gray).negate({ alpha: false }) : sharp(gray)).toColourspace('b-w').png().toBuffer();
  };
  const [top, bottom] = await Promise.all([prepare(14, 104), prepare(752, 112)]);
  return { top, bottom };
}

/** Schwarz-Weiß-Fassung eines Ausschnitts. Hilft Tesseract bei Rauschen und Verläufen. */
export function binarize(region: Buffer, level: number): Promise<Buffer> {
  return sharp(region).threshold(level).png().toBuffer();
}
