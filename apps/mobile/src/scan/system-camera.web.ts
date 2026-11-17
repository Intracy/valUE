/** Ein Foto mit Größe, wie es die Aufbereitung braucht. */
export type SystemPhoto = { uri: string; width: number; height: number };

/**
 * Browser geben die Live-Kamera nur über HTTPS (oder localhost) frei. Über eine
 * einfache http-Adresse, etwa die NAS im Heimnetz, fehlt navigator.mediaDevices
 * ganz; die Freigabe-Abfrage erscheint dann nie.
 */
export const liveCameraAvailable = (): boolean =>
  typeof window !== 'undefined' && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;

/**
 * Öffnet die Kamera des Systems über ein Dateifeld mit capture. Das klappt auch
 * ohne HTTPS: Auf dem iPhone öffnet sich direkt die Kamera-Ansicht.
 * Liefert null, wenn kein Foto gewählt wurde.
 */
export function takeSystemPhoto(): Promise<SystemPhoto | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    document.body.appendChild(input);

    const done = () => input.remove();
    input.addEventListener('cancel', () => {
      done();
      resolve(null);
    });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      done();
      if (!file) return resolve(null);
      const uri = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => resolve({ uri, width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Das Foto konnte nicht gelesen werden.'));
      image.src = uri;
    });
    input.click();
  });
}
