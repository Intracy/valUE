import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Rect } from './geometry';

/** Breite, auf die das Foto vor dem Hochladen verkleinert wird. Reicht für Erkennung und Texterkennung. */
const UPLOAD_WIDTH = 630;

/** Schneidet die Karte aus, verkleinert sie und liefert sie als Base64-JPEG. */
export async function preparePhoto(uri: string, crop: Rect): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.crop({ originX: crop.x, originY: crop.y, width: crop.width, height: crop.height });
  context.resize({ width: UPLOAD_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ base64: true, compress: 0.82, format: SaveFormat.JPEG });
  if (!saved.base64) throw new Error('Foto konnte nicht aufbereitet werden.');
  return saved.base64;
}
