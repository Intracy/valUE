import { CARD_ASPECT } from '@/theme/theme';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Lage des Suchrahmens im Kamerabild. Der Rahmen hat das Seitenverhältnis einer
 * Karte und lässt oben Platz für den Hinweis und unten für die Bedienelemente.
 */
export function guideRect(width: number, height: number, insets: { top: number; bottom: number }): Rect {
  const available = height - insets.top - insets.bottom;
  const guideHeight = Math.min(available * 0.82, (width * 0.78) / CARD_ASPECT);
  const guideWidth = guideHeight * CARD_ASPECT;
  return {
    x: (width - guideWidth) / 2,
    y: insets.top + (available - guideHeight) / 2,
    width: guideWidth,
    height: guideHeight,
  };
}

/**
 * Rechnet den Rahmen von der Vorschau auf das Foto um. Die Vorschau füllt den
 * Bildschirm und schneidet dabei das Kamerabild an ("cover"); das Foto hat die
 * volle Größe. Ergebnis in Foto-Pixeln, auf das Foto begrenzt.
 */
export function previewToPhoto(guide: Rect, view: { width: number; height: number }, photo: { width: number; height: number }): Rect {
  const scale = Math.max(view.width / photo.width, view.height / photo.height);
  const offsetX = (view.width - photo.width * scale) / 2;
  const offsetY = (view.height - photo.height * scale) / 2;
  const x = Math.max(0, (guide.x - offsetX) / scale);
  const y = Math.max(0, (guide.y - offsetY) / scale);
  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(Math.min(photo.width - x, guide.width / scale)),
    height: Math.round(Math.min(photo.height - y, guide.height / scale)),
  };
}

/** Mittiger Zuschnitt auf Kartenformat, für Fotos aus der Galerie. */
export function centerCardCrop(photo: { width: number; height: number }): Rect {
  if (photo.width / photo.height > CARD_ASPECT) {
    const width = photo.height * CARD_ASPECT;
    return { x: Math.round((photo.width - width) / 2), y: 0, width: Math.round(width), height: photo.height };
  }
  const height = photo.width / CARD_ASPECT;
  return { x: 0, y: Math.round((photo.height - height) / 2), width: photo.width, height: Math.round(height) };
}
