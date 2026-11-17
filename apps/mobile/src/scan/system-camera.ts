/** Ein Foto mit Größe, wie es die Aufbereitung braucht. */
export type SystemPhoto = { uri: string; width: number; height: number };

/** In der App läuft die Kamera immer live. */
export const liveCameraAvailable = (): boolean => true;

/** Nur im Browser nötig, siehe system-camera.web.ts. */
export async function takeSystemPhoto(): Promise<SystemPhoto | null> {
  return null;
}
