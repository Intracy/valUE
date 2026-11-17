# Gestaltung: valUE-Moodboard auf Apples Human Interface Guidelines

Das Aussehen folgt dem **valUE-Design-Moodboard** (Dark Theme, Light Theme, Layout-Screens und Design-System-Sheet). Das Verhalten folgt Apples Human Interface Guidelines: Auf iOS nutzt die App die Bauteile des Systems (Tab-Leiste, Navigationsstapel, Suchfeld), statt sie nachzuzeichnen.

## Moodboard in der App

**Grundsätze**, wie im Moodboard festgelegt und im Code in `theme/theme.ts` vermerkt:

1. **Dunkel und ruhig.** Dark Theme ist der Standard. Mitternachtsblau trägt, Flächen heben sich nur leicht ab, damit das Karten-Artwork wirkt.
2. **Holo sparsam.** Der Verlauf Cyan → Violett → Magenta → Gold steht nur bei Wortmarke, Haupt-Aktion, Fortschritt (Balken, Ringe), Scan-Knopf und Rahmen besonderer Karten (Holo, Ultra, Secret).
3. **Zahlen zuerst.** Wert und Veränderung sind die größten Elemente, Preise in Ziffern fester Breite. Gewinn und Verlust tragen immer einen Pfeil, nie nur Farbe.
4. **Sammeln belohnen.** Fehlende Karten als Silhouette mit Nummer, Element-Abzeichen, Seltenheitssterne, Abzeichen von Bronze bis Holo, Level-Ring ums Profilbild.

**Farben**

| Rolle | Dark | Light |
| --- | --- | --- |
| Hintergrund | `#0B0D17` Mitternacht | `#F6F7FB` |
| Fläche | `#141829` mit Linie `#1A1F35` | `#FFFFFF` mit Linie `#E3E6EF` und weichem Schatten |
| Text / gedämpft | `#F4F5FA` / `#8A90A8` | `#0B0D17` / `#5B6178` |
| Akzent | `#4FE3FF` Holo Cyan | `#5B3FD9` Violett |
| Gewinn / Verlust | `#2BD98F` / `#FF5A6E` | `#0B7A4C` / `#C8243B` |
| Holo-Verlauf | `#4FE3FF` `#8B5CFF` `#FF4FD8` `#FFC94D` | gleiche Farben, Cyan als `#14B8D9` |

Element-Farben: Feuer `#FF7A3D`, Wasser `#3DA5FF`, Pflanze `#3DCB6C`, Elektro `#FFD23D`, Psycho `#B05CFF`, Kampf `#C9845A`. Für Unlicht, Metall, Drache, Fee und Farblos, die das Moodboard nicht zeigt, gibt es ruhige Ergänzungen. Jedes Element steht mit Symbol und Name, nie nur als Farbe.

**Schrift:** SF Pro Rounded auf iOS (`ui-rounded`) für Titel und Zahlen, Inter oder Systemschrift im Browser. Grade wie im Moodboard: Large Title 34, Title 28, Headline 17, Body 17, Caption 13; dazu ein Anzeigegrad 40 für den Portfolio-Wert. **Radien** 20 (Flächen) und 12 (Elemente darin), **8-Punkt-Raster**.

**Währung:** Die Datenquelle liefert Dollar. Ein Tipp auf einen Dollarpreis rechnet alle Dollarpreise der App zum EZB-Referenzkurs in Euro um; umgerechnete Beträge tragen ein „≈“, darunter steht Kurs und Stand. Ein weiterer Tipp zeigt wieder Dollar. Die Wahl bleibt auf dem Gerät gespeichert (`components/currency.tsx`).

**Darstellung:** Dunkel (Standard), Hell oder System, im Profil umschaltbar und auf dem Gerät gespeichert. Auf dem Gerät stellt die App auch Tab- und Navigationsleiste des Systems um (`Appearance.setColorScheme`).

**Bildschirme aus den Layout-Screens des Moodboards**

| Moodboard | App | Ort |
| --- | --- | --- |
| Portfolio: Wortmarke, Gesamtwert, Pille, Holo-Diagramm, 1T–Max, Top-Karten | Startseite mit eigenem Kopf (Wortmarke, Profilknopf), Kennzahlen darunter | `app/(tabs)/(portfolio)/index.tsx` |
| Master-Set: Ring 142/198, Holo-Balken, Element-Chips, Silhouetten | Master-Set mit Ring, Prozent, Restkosten, Element-Chips mit Anzahl, Filter Alle/Fehlend/Vorhanden | `app/(tabs)/sammlung/[setId].tsx`, `components/card-tile.tsx` |
| Kartendetail: Teilen, Herz, Raw/PSA/CGC, Wert-Verlauf, Grading-Population | Kartendetail mit Holo-Schein, Teilen über das System, Beobachten, Preis je Note und Populationsbalken | `app/karte/[cardId].tsx` |
| Scan: Holo-Eckmarken, Scan-Linie, „Karte erkannt“ mit Speichern | Suchrahmen mit Holo-Ecken und Scan-Linie während der Erkennung, Ergebnisblatt „Karte erkannt“ mit Holo-Button | `app/(tabs)/scan.tsx`, `scan/result-sheet.tsx` |
| Profil: Level-Ring, Lv., Sammelscore, Vintage-Siegel, Abzeichen, Rarity Stars | Profil mit editierbarem Namen, Rang, Scores, 12 Achievements, Seltenheitsverteilung, Darstellung | `app/(tabs)/profil/index.tsx` |
| Tab-Leiste: Portfolio, Sammlung, Scan, Markt, Profil | Gleiche fünf Tabs, Scan als Holo-Kreis in der Mitte | `components/app-tabs.tsx`, `components/app-tabs.web.tsx` |
| Design-System-Sheet: Buttons, Preis-Pillen, Segmente, Suchfeld, Seltenheit | Bausteine in `components/ui.tsx`, Verlauf und Wortmarke in `components/holo.tsx`, Diagramm und Ringe in `components/charts.tsx` | |

Die Figuren auf den Moodboard-Bildern sind KI-Entwürfe und kommen nicht in die App. Die Demo-Daten bleiben bei erfundenen Landschaftsmotiven.

**Ehrlicher Stand:** Die Web-Fassung ist im Browser geprüft, Dark und Light Theme, auf Handy- und Desktop-Breite, ohne Fehler beim Laden der vorgerenderten Seiten. Auf iOS und Android ist die App noch nicht gelaufen. Die iOS-spezifischen Teile (Tab-Leiste des Systems, große Titel, Systemfarben, Haptik) bestehen die Typprüfung, sind aber nicht auf einem Gerät gesehen worden. Der erste Lauf im Simulator ist der nächste Schritt.

## Umsetzung der Richtlinien

| Richtlinie | Umsetzung | Ort |
| --- | --- | --- |
| Tab-Leiste für Navigation zwischen Bereichen | Fünf Tabs laut Moodboard: Portfolio, Sammlung, Scan, Markt, Profil. Der Scanner steht in der Mitte und hebt sich ab: Auf iOS ist sein Symbol ein Kreis im Holo-Verlauf mit Kamera, in Originalfarben gezeichnet; im Browser ein runder Holo-Knopf, der über die Leiste ragt. Er ist ein eigener Bildschirm (die Kamera), keine Aktion, und passt damit in die Leiste | `components/app-tabs.tsx`, `components/app-tabs.web.tsx`, `app/(tabs)/scan.tsx` |
| Systemeigene Leisten verwenden | Echte Tab-Leiste des Systems (`NativeTabs`), nativer Navigationsstapel | `components/app-tabs.tsx`, `components/tab-stack.tsx` |
| Nachfragen vor folgenreichen Aktionen | Der Scanner trägt nichts ohne Bestätigung ein. Bei Unsicherheit eine Auswahl statt einer Vermutung | `scan/result-sheet.tsx` |
| Berechtigungen erklären | Vor der Kamerafreigabe steht, wozu sie dient und dass Fotos nicht gespeichert werden; bei verweigerter Freigabe ein Weg in die Einstellungen und die Mediathek als Alternative | `app/(tabs)/scan.tsx`, `app.json` |
| Große Titel auf der obersten Ebene | Große Titel in jedem Tab, kleiner Titel im Set, wo das Raster den Platz braucht | `components/tab-stack.tsx` |
| Suchfeld des Systems | Suchleiste in der Navigationsleiste auf iOS und Android, Textfeld mit Akzentrand im Browser | `app/(tabs)/markt/index.tsx` |
| Hell und Dunkel | Zwei feste Paletten aus dem Moodboard statt der Systemfarben, damit die Marke auf allen Plattformen gleich aussieht. Kontraste: Text auf Fläche über 7:1, gedämpfter Text über 4,5:1 | `theme/theme.ts`, `theme/appearance.tsx` |
| Dynamic Type | Textstile in den Schriftgraden von iOS; Text skaliert mit der Systemeinstellung und wird nirgends gesperrt | `theme/theme.ts`, `components/app-text.tsx` |
| Tippflächen mindestens 44 × 44 Punkt | Konstante `MIN_TOUCH` für Tasten, Zeilen und Segmente | `theme/theme.ts` |
| SF Symbols | Symbole über `expo-symbols`, mit Material-Symbolen als Entsprechung auf Android und im Web | überall, wo Symbole stehen |
| Gruppierte Listen | Abschnitte mit Überschrift, abgerundeter Fläche, Trennlinien und Pfeil bei Zeilen, die weiterführen | `components/list.tsx` |
| Rückmeldung bei Änderungen | Leichte Haptik beim Ändern, Erfolgs-Haptik beim ersten Eintragen | `components/haptics.ts` |
| Inhalte nachladen | Ziehen zum Aktualisieren in allen Listen | Bildschirme unter `app/(tabs)` |
| Leere Zustände und Fehler erklären | Symbol, Titel, ein Satz, höchstens eine Aktion; Fehler mit „Erneut versuchen“ | `components/states.tsx` |
| Bedienungshilfen | Jede Karte hat eine Beschriftung („Name, Nummer, vorhanden oder fehlt“). Das Eintragen per langem Druck steht der Sprachausgabe als eigene Aktion zur Verfügung. Balken und Ringe melden ihren Wert, Diagramme sagen in einem Satz, von wo nach wo der Wert ging, Pillen lesen „Plus 0,9 Prozent“. Die Scan-Linie steht still, wenn „Bewegung reduzieren“ an ist | `components/card-tile.tsx`, `components/charts.tsx`, `components/ui.tsx`, `app/(tabs)/scan.tsx` |
| Inhalt reicht bis unter die Leisten | Listen rücken sich über die Automatik des Systems ein | `components/tab-stack.tsx` |
| iPad und breite Fenster | Inhalt bleibt auf lesbarer Breite, das Raster nimmt mehr Spalten | `theme/theme.ts`, `app/(tabs)/sammlung/[setId].tsx` |

## Web

Dieselben Bildschirme laufen im Browser. Auf Handybreite steht die Navigation als Leiste unten, ab 700 Punkt Breite als Zeile oben.

## Bekannte Lücken

- Fehlende Karten sind auf iOS nur über die Deckkraft abgesetzt; ein Graustufen-Filter greift bisher nur auf Android und im Web.
- Auf Android färbt die Material-Leiste alle Symbole ein; der Scanner-Tab ist dort mittig, hebt sich aber nur über seine Position ab. Nicht auf einem Gerät geprüft.
- Ob iOS das farbige Scanner-Symbol in voller Größe zeigt, ist ungeprüft; die Tab-Leiste kann Bilder verkleinern.
- App-Symbol und Startbild sind noch die Platzhalter der Vorlage. Das Moodboard-Icon (UE-Monogramm im Holo-Verlauf) liegt nur als Bild im Moodboard vor und ließ sich aus dieser Umgebung nicht herunterladen; es muss als `assets/images/icon.png` (1024 × 1024) und für Android als Vordergrund und Hintergrund nachgereicht werden.
- Die Diagramme haben keine Achsen und kein Antippen einzelner Tage. Die Zahlen dazu stehen als Text daneben.
- SF Pro Rounded über `ui-rounded` und die Darstellungsumschaltung der Systemleisten sind auf einem Gerät noch ungeprüft.
- Die Detailseiten der Richtlinien ließen sich beim Bau nicht automatisch abrufen (sie brauchen einen Browser). Die Umsetzung stützt sich auf die bekannten Grundsätze; ein Abgleich Punkt für Punkt mit den aktuellen Seiten steht aus.
