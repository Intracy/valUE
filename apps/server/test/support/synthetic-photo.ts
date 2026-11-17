import sharp from 'sharp';

import { loadImage } from '../../src/scan/image.js';

/**
 * Simuliert ein Handyfoto einer Karte, so wie es die App nach dem Zuschnitt auf
 * den Suchrahmen schickt: Karte leicht verdreht, verschoben und skaliert, auf
 * einem Untergrund, mit Belichtungsfehler, Farbstich, Unschärfe, Rauschen,
 * Lichtreflex und JPEG-Kompression.
 *
 * Wichtig: Das ist eine Annäherung. Echte Fotos (Hüllen, Toploader, Holo-Effekte,
 * starke Perspektive) sind schwieriger und müssen eigens gemessen werden.
 */

export interface PhotoOptions {
  seed: number;
  /** 0 = sauberes Foto, 1 = schwierige Bedingungen. */
  difficulty?: number;
}

function rng(seed: number) {
  let state = (seed * 2654435761) >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
}

const W = 630;
const H = 880;

export async function syntheticPhoto(imageUrl: string, options: PhotoOptions): Promise<Buffer> {
  const r = rng(options.seed);
  const d = options.difficulty ?? 0.6;
  const between = (low: number, high: number) => low + (high - low) * r();

  // Untergrund: ruhiger Farbverlauf mit Körnung, wie ein Tisch oder eine Matte.
  const base = [between(40, 200), between(40, 180), between(30, 160)].map(Math.round);
  const background = await sharp({
    create: { width: W, height: H, channels: 3, background: { r: base[0]!, g: base[1]!, b: base[2]! } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${between(0, 0.4)}"/><stop offset="1" stop-color="#fff" stop-opacity="${between(0, 0.3)}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
        ),
      },
    ])
    .png()
    .toBuffer();

  // Karte: Größe 88 bis 104 % des Rahmens, Drehung, Versatz.
  const scale = between(1 - 0.12 * d, 1 + 0.04 * d);
  const angle = between(-5, 5) * d;
  const card = await sharp(await loadImage(imageUrl), { density: 200 })
    .resize(Math.round(W * scale), Math.round(H * scale), { fit: 'fill' })
    .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const meta = await sharp(card).metadata();
  const left = Math.round((W - meta.width!) / 2 + between(-0.05, 0.05) * W * d);
  const top = Math.round((H - meta.height!) / 2 + between(-0.05, 0.05) * H * d);

  // Lichtreflex: weiche, helle Ellipse.
  const glare = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="r"><stop offset="0" stop-color="#fff" stop-opacity="${between(0, 0.55) * d}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${between(0.2, 0.8) * W}" cy="${between(0.2, 0.8) * H}" rx="${between(80, 220)}" ry="${between(60, 160)}" fill="url(#r)"/></svg>`,
  );

  // Teile außerhalb des Rahmens abschneiden: sharp verlangt, dass Overlays hineinpassen.
  const placed = await sharp(background)
    .composite([{ input: await clipToCanvas(card, left, top), left: 0, top: 0 }, { input: glare }])
    .png()
    .toBuffer();

  const tint = [between(-0.1, 0.1) * d, between(-0.06, 0.06) * d, between(-0.1, 0.1) * d];
  let photo = sharp(placed)
    .modulate({ brightness: between(1 - 0.3 * d, 1 + 0.2 * d), saturation: between(1 - 0.3 * d, 1 + 0.15 * d) })
    .recomb([
      [1 + tint[0]!, 0, 0],
      [0, 1 + tint[1]!, 0],
      [0, 0, 1 + tint[2]!],
    ]);
  const blur = between(0.3, 0.3 + 1.4 * d);
  if (blur > 0.3) photo = photo.blur(blur);

  // Sensorrauschen.
  const { data, info } = await photo.raw().toBuffer({ resolveWithObject: true });
  const noise = 4 + 14 * d;
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.max(0, Math.min(255, data[i]! + (r() + r() + r() - 1.5) * noise));
  }
  return sharp(data, { raw: info }).jpeg({ quality: Math.round(between(55, 80)) }).toBuffer();
}

async function clipToCanvas(card: Buffer, left: number, top: number): Promise<Buffer> {
  const meta = await sharp(card).metadata();
  const canvas = sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  const srcLeft = Math.max(0, -left);
  const srcTop = Math.max(0, -top);
  const width = Math.min(meta.width! - srcLeft, W - Math.max(0, left));
  const height = Math.min(meta.height! - srcTop, H - Math.max(0, top));
  const piece = await sharp(card).extract({ left: srcLeft, top: srcTop, width, height }).toBuffer();
  return canvas.composite([{ input: piece, left: Math.max(0, left), top: Math.max(0, top) }]).png().toBuffer();
}
