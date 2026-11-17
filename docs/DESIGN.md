# Gestaltung nach Apples Human Interface Guidelines

Die App nutzt auf iOS die Bauteile des Systems, statt sie nachzuzeichnen. Damit übernimmt sie Aussehen und Verhalten der jeweiligen iOS-Version, einschließlich des neuen Materials für Leisten.

**Ehrlicher Stand:** Die Web-Fassung ist im Browser geprüft, hell und dunkel, auf Handy- und Desktop-Breite. Auf iOS und Android ist die App noch nicht gelaufen. Die iOS-spezifischen Teile (Tab-Leiste des Systems, große Titel, Systemfarben, Haptik) bestehen die Typprüfung, sind aber nicht auf einem Gerät gesehen worden. Der erste Lauf im Simulator ist der nächste Schritt.

## Umsetzung der Richtlinien

| Richtlinie | Umsetzung | Ort |
| --- | --- | --- |
| Tab-Leiste für Navigation zwischen Bereichen | Fünf Tabs: Sammlung, Sets, Scannen, Suche, Profil. Der Scanner steht auf Wunsch in der Mitte und hebt sich ab: Auf iOS ist sein Symbol ein farbiger Kreis mit Kamera, in Originalfarben gezeichnet; im Browser ein runder Knopf, der über die Leiste ragt. Er ist ein eigener Bildschirm (die Kamera), keine Aktion, und passt damit in die Leiste | `components/app-tabs.tsx`, `components/app-tabs.web.tsx`, `app/(tabs)/scan.tsx` |
| Systemeigene Leisten verwenden | Echte Tab-Leiste des Systems (`NativeTabs`), nativer Navigationsstapel | `components/app-tabs.tsx`, `components/tab-stack.tsx` |
| Nachfragen vor folgenreichen Aktionen | Der Scanner trägt nichts ohne Bestätigung ein. Bei Unsicherheit eine Auswahl statt einer Vermutung | `scan/result-sheet.tsx` |
| Berechtigungen erklären | Vor der Kamerafreigabe steht, wozu sie dient und dass Fotos nicht gespeichert werden; bei verweigerter Freigabe ein Weg in die Einstellungen und die Mediathek als Alternative | `app/(tabs)/scan.tsx`, `app.json` |
| Große Titel auf der obersten Ebene | Große Titel in jedem Tab, kleiner Titel im Set, wo das Raster den Platz braucht | `components/tab-stack.tsx` |
| Suchfeld des Systems | Suchleiste in der Navigationsleiste auf iOS und Android, Textfeld im Browser | `app/(tabs)/suche/index.tsx` |
| Semantische Farben, Hell und Dunkel | Auf iOS Systemfarben (`label`, `systemGroupedBackground`, `separator` …), die sich selbst an Dunkelmodus und erhöhten Kontrast anpassen. Feste Entsprechungen für Android und Web | `theme/theme.ts` |
| Dynamic Type | Textstile in den Schriftgraden von iOS; Text skaliert mit der Systemeinstellung und wird nirgends gesperrt | `theme/theme.ts`, `components/app-text.tsx` |
| Tippflächen mindestens 44 × 44 Punkt | Konstante `MIN_TOUCH` für Tasten, Zeilen und Segmente | `theme/theme.ts` |
| SF Symbols | Symbole über `expo-symbols`, mit Material-Symbolen als Entsprechung auf Android und im Web | überall, wo Symbole stehen |
| Gruppierte Listen | Abschnitte mit Überschrift, abgerundeter Fläche, Trennlinien und Pfeil bei Zeilen, die weiterführen | `components/list.tsx` |
| Rückmeldung bei Änderungen | Leichte Haptik beim Ändern, Erfolgs-Haptik beim ersten Eintragen | `components/haptics.ts` |
| Inhalte nachladen | Ziehen zum Aktualisieren in allen Listen | Bildschirme unter `app/(tabs)` |
| Leere Zustände und Fehler erklären | Symbol, Titel, ein Satz, höchstens eine Aktion; Fehler mit „Erneut versuchen“ | `components/states.tsx` |
| Bedienungshilfen | Jede Karte hat eine Beschriftung („Name, Nummer, vorhanden oder fehlt“). Das Eintragen per langem Druck steht der Sprachausgabe als eigene Aktion zur Verfügung. Fortschrittsbalken melden ihren Wert | `components/card-tile.tsx`, `components/progress-bar.tsx` |
| Inhalt reicht bis unter die Leisten | Listen rücken sich über die Automatik des Systems ein | `components/tab-stack.tsx` |
| iPad und breite Fenster | Inhalt bleibt auf lesbarer Breite, das Raster nimmt mehr Spalten | `theme/theme.ts`, `app/(tabs)/sets/[setId].tsx` |

## Web

Dieselben Bildschirme laufen im Browser. Auf Handybreite steht die Navigation als Leiste unten, ab 700 Punkt Breite als Zeile oben.

## Bekannte Lücken

- Fehlende Karten sind auf iOS nur über die Deckkraft abgesetzt; ein Graustufen-Filter greift bisher nur auf Android und im Web.
- Auf Android färbt die Material-Leiste alle Symbole ein; der Scanner-Tab ist dort mittig, hebt sich aber nur über seine Position ab. Nicht auf einem Gerät geprüft.
- Ob iOS das farbige Scanner-Symbol in voller Größe zeigt, ist ungeprüft; die Tab-Leiste kann Bilder verkleinern.
- App-Symbol und Startbild sind die Platzhalter der Vorlage.
- Der Preisverlauf ist eine einfache Säulenreihe ohne Achsen.
- Die Detailseiten der Richtlinien ließen sich beim Bau nicht automatisch abrufen (sie brauchen einen Browser). Die Umsetzung stützt sich auf die bekannten Grundsätze; ein Abgleich Punkt für Punkt mit den aktuellen Seiten steht aus.
