# Scanner

Der Scanner erkennt eine Karte auf einem Kamerafoto, schlägt sie vor und übernimmt sie erst nach Bestätigung in die Sammlung.

## Ablauf in der App

1. **Scannen** in der Mitte der Tab-Leiste öffnet die Kamera. Ein Rahmen im Kartenformat zeigt, wohin die Karte gehört.
2. Der Auslöser macht ein Foto. Die App schneidet den Rahmen aus, verkleinert auf 630 Pixel Breite und schickt das JPEG an den Server.
3. Der Server antwortet mit einem von drei Ergebnissen:

| Ergebnis | Wann | Was die App zeigt |
| --- | --- | --- |
| **Eindeutig** | Bester Vorschlag hoch bewertet und klar vor dem zweiten | „Ist das deine Karte?“ mit Bild, Set, Nummer, Preis und Varianten-Auswahl. Weitere Vorschläge über „Nein, andere Karte wählen“ |
| **Unsicher** | Mehrere Karten kommen in Frage | „Welche Karte ist es?“ mit bis zu fünf Vorschlägen und ihrer Übereinstimmung. Tippen führt zur Nachfrage |
| **Nichts erkannt** | Kein Vorschlag erreicht die Mindestbewertung | Tipps fürs nächste Foto, „Neu scannen“, „Selbst suchen“ |

4. Erst **„Ja, hinzufügen“** trägt die Karte ein. Ein kurzer Hinweis meldet „Abendrot hinzugefügt · jetzt 2×“, die Kamera ist sofort für die nächste Karte bereit.

Ohne Kamera oder ohne Freigabe lässt sich ein Foto aus der Mediathek wählen. Die Kamera läuft nur, solange der Tab sichtbar und kein Ergebnis offen ist.

## Katalog

Der Scanner sucht im ganzen Katalog: alle Karten von [TCGdex](https://tcgdex.dev)
auf Englisch, Deutsch und Japanisch, Stand November 2026 rund 57.600 Karten
(23.900 englisch, 20.500 deutsch, 13.200 japanisch). `npm run catalog`
(`src/sync/catalog-cli.ts`) lädt Sets und Karten, rechnet die Fingerabdrücke aus
den kleinen Kartenbildern und holt danach die Preise von Pokemon Price Tracker.
Auf der NAS erledigt das der Dienst `catalog` (siehe deploy/README.md).

- **IDs:** jede Sprache eine eigene Karte, `en-base1-4`, `de-base1-4`, `ja-SV1S-001`.
- **Nummer:** wie auf der Karte, `4/102`; die Gesamtzahl ist die offizielle Set-Größe.
- **Bilder:** Für 5.400 deutsche Karten (meist ältere Sets) hat TCGdex kein Bild;
  sie nehmen das der englischen Fassung, das Artwork ist dasselbe. Von den
  japanischen Karten haben nur 3.900 ein Bild; die übrigen erkennt der Scanner nur
  über Name und Nummer.
- **Rarität und Element** deutscher Karten kommen von der englischen Fassung, damit
  die App sie einheitlich einordnet.
- **Preise:** Pokemon Price Tracker nennt je Karte die TCGdex-ID
  (`externalCatalogId`). Darüber landet der Preis auf der englischen und der
  deutschen Karte. Es entstehen keine eigenen Karten aus PPT.

## Erkennung auf dem Server

Drei Signale, gewichtet zusammengeführt (`apps/server/src/scan/identify.ts`):

| Signal | Woher | Gewicht |
| --- | --- | --- |
| Bildähnlichkeit | Fingerabdruck aus Farbraster und Helligkeitskanten, verglichen mit jeder Karte im Katalog | 45 % |
| Kartenname | Texterkennung (Tesseract) der oberen Zeile, unscharfer Vergleich mit allen Kartennamen | 30 % |
| Kartennummer | Texterkennung der unteren Zeile, etwa „9/24“; die Zahl hinter dem Schrägstrich grenzt das Set ein | 25 % |

Keines reicht allein: Namen wiederholen sich über Sets, Nummern sowieso, und die Bildähnlichkeit verwechselt Karten mit ähnlichem Aufbau. In den Demo-Daten heißt „Sternstaub“ in allen drei Sets gleich; Nummer und Bild trennen sie.

**Texterkennung im Detail:**

- **Name:** Gesucht wird mit allen gelesenen Zeilen der Namensleiste, nicht nur der längsten. Auf echten Karten stehen dort auch Stufe, „Entwickelt sich aus …“ und Störzeichen; `word_similarity` findet den Namen darin.
- **Nummer:** Zuerst zwei eigene, stark vergrößerte Ausschnitte, links unten (neuere und japanische Karten) und rechts unten (ältere Karten), dann der ganze untere Streifen. Nummer und Gesamtzahl müssen in einer Zeile stehen. Eine Nummer weit über der Set-Größe wird vorne gekürzt („994/102“ → „94/102“), weil Störzeichen oft als Ziffer gelesen werden.
- **Japanisch:** Zeigt die Nummer auf eine japanische Karte oder passt der englisch gelesene Name zu keiner Karte, liest ein zweiter Durchgang mit japanischen Sprachdaten. Verglichen wird ohne Dakuten (ボ = ポ = ホ), weil die Texterkennung die kleinen Striche oft verwechselt.
- **Deutsch und Englisch** liest dieselbe englische Texterkennung. Deutsche und englische Fassung einer Karte haben dasselbe Bild und dieselbe Nummer; der Name trennt sie. Heißt eine Karte in beiden Sprachen gleich (Pikachu), fragt der Scanner nach.

Die Fingerabdrücke der Katalogkarten rechnet der Abgleich nach jedem Lauf für neue oder geänderte Bilder (`npm run fingerprints` für Nachzügler). Der Server hält sie im Speicher, bei 50.000 Karten rund 40 MB.

**Datenschutz:** Das Foto wird nur im Speicher verarbeitet und nicht abgelegt. Gespeichert werden in der Tabelle `scans` die Vorschläge, das Gelesene und die bestätigte Karte. Daraus lässt sich messen, wie oft der erste Vorschlag stimmt.

**Doppelte Übernahme:** Ein Scan lässt sich genau einmal bestätigen. Ein doppelter Tipp liefert 409 und fügt nichts doppelt hinzu.

## Messung

Mit simulierten Handyfotos aller 54 Demo-Karten, je drei Fotos: Karte verdreht, verschoben und skaliert, Farbstich, Belichtungsfehler, Unschärfe, Rauschen, Lichtreflex, JPEG-Kompression. Nachmessen mit `npm run scan:benchmark -w @value/server -- 3 0.6` gegen eine Wegwerf-Datenbank.

| Bedingungen | Richtig auf Platz 1 | Richtig unter den Vorschlägen | Eindeutig / unsicher / nichts | Eindeutig, aber falsch | Dauer |
| --- | ---: | ---: | --- | ---: | ---: |
| leicht (0,3) | 100 % | 100 % | 95 % / 5 % / 0 % | 0 | 287 ms |
| mittel (0,6) | 99,4 % | 100 % | 85 % / 15 % / 0 % | 0 | 403 ms |
| schwer (1,0) | 88,9 % | 89,5 % | 40 % / 51 % / 9 % | 0 | 750 ms |

Name und Nummer gelesen: leicht 100 % und 91 %, mittel 99 % und 84 %, schwer 92 % und 61 %. Unter schweren Bedingungen fehlt die Karte in 10 % der Fälle ganz in den Vorschlägen; dann bleibt „Selbst suchen“.

Die wichtigste Zahl ist die Spalte „Eindeutig, aber falsch“: Dann zeigt die App „Sicher erkannt“ bei der falschen Karte. Die Schwellen sind so gesetzt, dass das in keinem Lauf vorkam; bei schwierigen Fotos fragt der Scanner lieber mit einer Auswahl nach.

Dazu ein Durchlauf im Browser mit simulierter Kamera: Auslösen, Nachfrage, Variante wählen, hinzufügen, zweiter Scan, Auswahlliste. Beide Testkarten wurden eindeutig und richtig erkannt.

### Mit echten Kartenbildern

Messung mit `test/real-scan-benchmark.ts`: drei echte Karten (Glurak/Charizard aus dem Grundset 1999, Wiesenior aus Flammende Finsternis auf Deutsch, サボネア aus Scarlet ex auf Japanisch), je vier simulierte Fotos bei mittleren Bedingungen (0,5), in einem Katalog mit 57.000 Karten. Darin viele Doppelgänger: Karten mit gleichem Namen, gleicher Nummer und ähnlichem Fingerabdruck.

| | Richtig auf Platz 1 | Unter den Vorschlägen | Eindeutig / unsicher | Eindeutig, aber falsch | Dauer |
| --- | ---: | ---: | --- | ---: | ---: |
| vor der Anpassung | 58 % | 83 % | 17 % / 83 % | 0 | 1,5 s |
| nach der Anpassung | 75 % | 100 % | 42 % / 58 % | 0 | 1,7 s |

Die Nummer moderner und japanischer Karten wurde in allen Fotos gelesen. Die winzige Nummer der Karten von 1999 („4/102“ unten rechts) in keinem; dort tragen Name und Bild die Erkennung, und bei vielen Karten gleichen Namens fragt der Scanner mit einer Auswahl nach. Die Bilder der Messung stehen wegen der Rechte nicht im Repository; die Datei beschreibt, wie man sie von TCGdex holt.

## Grenzen

Diese Zahlen sind **keine Aussage über echte Fotos echter Karten.** Sie gelten für 54 erfundene Demo-Karten mit klarer Schrift und simulierten Störungen. Nicht abgedeckt:

- **Katalogumfang:** Die Messung mit echten Bildern umfasst drei Karten; die übrigen 57.000 sind Füllkarten mit nachgebildeten Fingerabdrücken. Wie gut der einfache Fingerabdruck zwischen echten, ähnlich aufgebauten Karten trennt, zeigt erst ein Test mit dem vollen Katalog auf der NAS.
- **Alte Karten:** Die Nummer der Sets bis etwa 2003 ist zu klein für die Texterkennung. Bei Karten mit häufigem Namen (Glurak) bleibt die Auswahlliste.
- **Echte Fotos:** Hüllen und Toploader, Holo-Glanz, starke Perspektive, Hand im Bild. Auf keinem Gerät getestet.
- **Varianten:** Normal, Holo und Reverse Holo sehen sich zu ähnlich für diesen Fingerabdruck. Deshalb wählt der Nutzer die Variante bei der Nachfrage selbst.
- **Sprachen:** Deutsch läuft über die englischen Sprachdaten; Umlaute werden dabei manchmal falsch gelesen, die unscharfe Suche gleicht das meist aus. Japanisch braucht einen zweiten Durchgang und kostet dann rund eine Sekunde mehr.
- **Last:** Die Texterkennung braucht pro Scan einige hundert Millisekunden Rechenzeit auf dem Server. Je Prozess laufen höchstens `SCAN_OCR_WORKERS` (Standard 2) Erkennungen gleichzeitig, weitere warten. Je Absender sind `SCAN_RATE_PER_MINUTE` (Standard 30) Scans pro Minute erlaubt.
- **Web:** Bei Desktop-Webcams zeigt die Vorschau ein Spiegelbild (Verhalten von Expo bei Frontkameras). Das übertragene Foto ist richtig herum.

## Nächste Schritte

1. **Echter Testsatz:** 1.000 eigene Fotos echter Karten unter Alltagsbedingungen, Messung mit derselben Auswertung. Erst danach sind Aussagen über die Trefferquote belastbar.
2. **Gelerntes Bildmodell:** Ein Modell wie CLIP statt des einfachen Fingerabdrucks, wie im Konzept vorgesehen. Die Schnittstelle (`fingerprint()` in `src/scan/image.ts`) bleibt gleich. In der Bauumgebung war kein Modell herunterladbar.
3. **Erkennung auf dem Gerät:** Texterkennung über Apple Vision und ML Kit, Bildvergleich auf dem Gerät. Spart Serverlast und funktioniert offline; braucht einen Entwicklungs-Build statt Expo Go.
4. **Rückmeldungen nutzen:** Die Tabelle `scans` zeigt, wo der erste Vorschlag falsch war. Daraus Gewichte und Schwellen nachstellen.
