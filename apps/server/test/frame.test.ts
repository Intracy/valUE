import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { cropToCard, findCardFrame } from '../src/scan/frame.js';

/**
 * Nachgestelltes Foto: Karte mit gelbem Rand, grüner Fläche und Artwork-Kasten,
 * etwas schräg im Bild, darum unruhiger Hintergrund wie Hand und Tisch.
 */
async function photo(card: { left: number; top: number; width: number }) {
  const height = Math.round(card.width * (88 / 63));
  const border = Math.round(card.width * 0.045);
  const inner = Math.round(card.width * 0.08);
  const svg = `<svg width="${card.width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${card.width}" height="${height}" rx="${border}" fill="#e8c34a"/>
    <rect x="${border}" y="${border}" width="${card.width - 2 * border}" height="${height - 2 * border}" fill="#8fc77a"/>
    <rect x="${inner}" y="${Math.round(height * 0.11)}" width="${card.width - 2 * inner}" height="${Math.round(height * 0.38)}" fill="#3b3550"/>
    <text x="${inner}" y="${Math.round(height * 0.07)}" font-size="${Math.round(height * 0.04)}" fill="#222">Venusaur</text>
    <text x="${inner}" y="${Math.round(height * 0.62)}" font-size="${Math.round(height * 0.03)}" fill="#222">Solarbeam 60</text>
  </svg>`;
  const noise = Buffer.alloc(900 * 1200 * 3);
  for (let i = 0; i < noise.length; i += 1) noise[i] = 120 + ((i * 2654435761) >>> 24) % 60;
  return sharp(noise, { raw: { width: 900, height: 1200, channels: 3 } })
    .composite([{ input: Buffer.from(svg), left: card.left, top: card.top }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

describe('Karte im Foto finden', () => {
  it('findet eine Karte mit Rand, Hintergrund und Abstand zum Bildrand', async () => {
    const image = await photo({ left: 140, top: 180, width: 600 });
    const frame = (await findCardFrame(image))!;
    const height = Math.round(600 * (88 / 63));
    // Gefunden wird der äußere oder der innere Rahmen; mit Zugabe schließt das Rechteck die Karte ein.
    expect(frame.left).toBeLessThanOrEqual(140 + 30);
    expect(frame.left + frame.width).toBeGreaterThanOrEqual(740 - 30);
    expect(frame.top).toBeLessThanOrEqual(180 + 40);
    expect(frame.top + frame.height).toBeGreaterThanOrEqual(180 + height - 40);
    expect(frame.width / frame.height).toBeCloseTo(63 / 88, 1);
  });

  it('schneidet nichts aus, wenn die Karte das Bild schon füllt', async () => {
    const image = await photo({ left: 0, top: 0, width: 850 });
    const filled = await sharp(image).extract({ left: 0, top: 0, width: 850, height: Math.round(850 * (88 / 63)) }).toBuffer();
    expect(await cropToCard(filled)).toBeNull();
  });
});
