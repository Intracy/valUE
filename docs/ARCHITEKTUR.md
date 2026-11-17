# Architektur

Die App liest nur vom eigenen Server. Der Server liest nur aus der eigenen Datenbank. Ein getrennter Prozess gleicht die Datenbank nach Zeitplan mit Pokemon Price Tracker ab.

```
App (iOS, Android, Web)
        │  HTTPS, /v1
        ▼
CDN / Lastverteiler ──────────────► Katalog-Antworten aus dem Zwischenspeicher
        │
        ▼
API-Server (beliebig viele Instanzen, ohne eigenen Zustand)
        │
        ▼
PostgreSQL ◄──────── Abgleich (ein Prozess, per Cron) ◄──────── Pokemon Price Tracker
```

## Warum das mit der Nutzerzahl mitwächst

| Entscheidung | Wirkung |
| --- | --- |
| Die App ruft den Datenanbieter nie direkt auf | Credits hängen an der Kataloggröße, nicht an der Nutzerzahl. Der API-Schlüssel bleibt auf dem Server |
| Katalog-Antworten tragen `ETag` und `Cache-Control: public, s-maxage=3600` | Ein CDN beantwortet die meisten Abrufe selbst. Hat ein Client den Stand schon, antwortet der Server mit 304 ohne Datenbankabfrage |
| Der Server hält keinen Zustand | Mehr Last heißt: mehr Instanzen hinter dem Lastverteiler |
| Der Abgleich ist ein eigener Prozess mit Datenbank-Sperre | Er läuft genau einmal, egal wie viele Server-Instanzen es gibt |
| `collection_items` ist nach `user_id` in 16 Teile gestreut, jede Abfrage beginnt mit `user_id` | Die größte Tabelle bleibt in kleinen Indizes. Eine Abfrage trifft genau einen Teil |
| `price_history` ist nach Monat geteilt | Abfragen lesen nur die betroffenen Monate. Alte Monate lassen sich als Ganzes entfernen |
| Schreiben in Stapeln (`unnest`), ein Befehl je Stapel | Der Abgleich von 50.000 Karten braucht wenige Dutzend Befehle statt 50.000 |
| `PUT` setzt den Bestand auf einen festen Wert | Die App darf nach einem Funkloch gefahrlos wiederholen |

## Schnittstelle der App (`/v1`)

Der Vertrag steht als TypeScript-Typen in `packages/api-types`.

| Pfad | Zweck | Cache |
| --- | --- | --- |
| `GET /v1/sets` | Alle Sets | öffentlich, ETag |
| `GET /v1/sets/:setId` | Ein Set mit allen Karten in Nummernfolge | öffentlich, ETag |
| `GET /v1/cards/:cardId?days=90` | Kartendetail, Varianten, Preisverlauf, Element, Preise und Population je Grading-Note | öffentlich, ETag |
| `GET /v1/market/movers?days=7&limit=10` | Größte Gewinner und Verlierer im Katalog (ab 1 € bzw. 1 $). Einmal je Katalogstand gerechnet | öffentlich, ETag |
| `GET /v1/search?q=` | Suche nach Kartennamen | öffentlich, kurz |
| `POST /v1/auth/anonymous` | Anonymes Konto anlegen, liefert das Token einmalig | nie |
| `GET /v1/me/collection/sets` | Fortschritt je Set | nie |
| `GET /v1/me/collection/sets/:setId` | Eigene Karten in einem Set | nie |
| `PUT /v1/me/collection/items/:cardId` | Bestand setzen, Menge 0 entfernt | nie |
| `DELETE /v1/me/collection/items/:cardId` | Karte mit allen Varianten entfernen | nie |
| `GET /v1/me/profile` | Name, Rang, Sammelscore, Vintage-Score, Wert, volle Sets, Achievements, Seltenheitsverteilung | nie |
| `PATCH /v1/me/profile` | Anzeigenamen setzen (1 bis 40 Zeichen) oder entfernen | nie |
| `GET /v1/me/portfolio?range=1M` | Wert heute, Veränderung, Tageswerte im Zeitraum (`1T`, `1W`, `1M`, `1J`, `Max`), Top-Karten | nie |
| `GET /v1/me/favorites` | Beobachtete Karten | nie |
| `PUT`/`DELETE /v1/me/favorites/:cardId` | Karte beobachten oder nicht mehr; Wiederholen ändert nichts | nie |
| `POST /v1/me/scans` | Foto erkennen, liefert Ergebnis und Vorschläge. Begrenzt je Absender | nie |
| `POST /v1/me/scans/:scanId/confirm` | Vorschlag bestätigen, Karte eintragen; genau einmal je Scan | nie |
| `GET /healthz`, `GET /readyz` | Für Lastverteiler und Überwachung | |

## Scanner

Erkennung aus Bildvergleich, Kartenname und Kartennummer, Details und Messwerte in [SCANNER.md](SCANNER.md). Für die Skalierung wichtig: Die Texterkennung belegt pro Scan einige hundert Millisekunden einen Kern. Jeder Prozess hat dafür einen eigenen kleinen Pool (`SCAN_OCR_WORKERS`), weitere Scans warten. Mehr Scan-Last heißt mehr Instanzen; mittelfristig wandert die Erkennung aufs Gerät.

## Abgleich mit Pokemon Price Tracker

Zwei Wege, umschaltbar über `SYNC_MODE`:

- **`api`** (Free- und API-Tarif): Einzelabrufe. Die Set-Liste kostet 1 Credit und wird höchstens wöchentlich neu geladen. Ein Set kostet 1 Credit je Karte. Der Abgleich rechnet vor jedem Abruf, ob das Budget reicht (`SYNC_MAX_CREDITS_PER_RUN` und das vom Anbieter gemeldete Tageskontingent), und überspringt Sets, die es sprengen würden.
- **`export`** (Business-Tarif): Der Tages-Export `printings` als Datei, ohne Credits. Er wird als Strom gelesen und in Stapeln geschrieben, der Speicherbedarf bleibt klein.

Jeder Lauf steht in der Tabelle `sync_runs` mit Status, Mengen, Credits und Hinweisen. Nach einem erfolgreichen Lauf erhöht sich die Katalogversion; daran hängen die ETags.

Der Anbieter sitzt hinter der Schnittstelle `PriceSource` (`apps/server/src/sources/price-source.ts`). Ein Wechsel des Anbieters betrifft nur diesen Ordner.

**Offen:**

- Die Feldnamen der Antworten von `/sets` und `/cards` sind in der API-Referenz nicht vollständig dokumentiert. Die Zuordnung probiert mehrere Namen und ist gegen erfundene Antworten getestet, nicht gegen echte. `npm run ppt:probe -w @value/server` zeigt die echten Felder.
- Der Export-Weg ist gegen die dokumentierten Spalten getestet, nicht gegen eine echte Datei (braucht den Business-Tarif).
- Euro-Preise von Cardmarket, Graded-Verkäufe und Population sind im Datenmodell vorbereitet (`market_price_eur`), aber noch nicht angebunden.
- Kartenbilder werden von den Adressen der Quelle geladen. Für den Betrieb gehören sie hinter ein eigenes CDN, und die Nutzungsrechte sind zu klären.

## Lasttest

Gemessen in der Entwicklungsumgebung: 2 Prozessorkerne, 7 GB Speicher, Server, PostgreSQL und Lastgenerator auf derselben Maschine, 50 gleichzeitige Verbindungen, je 12 Sekunden. Daten: 50.000 Karten in 200 Sets, 1,5 Mio. Preisstände, 10.000 Nutzer mit je 300 Karten (3 Mio. Sammlungseinträge).

| Abruf | Anfragen pro Sekunde | Median | 99 % schneller als |
| --- | --- | --- | --- |
| Set mit 250 Karten | 1.293 | 34 ms | 79 ms |
| Set, Client hat den Stand schon (304) | 22.471 | 2 ms | 3 ms |
| Kartendetail mit 30 Tagen Verlauf | 1.885 | 25 ms | 42 ms |
| Suche | 696 | 70 ms | 96 ms |
| Fortschritt aller Sets eines Nutzers | 383 | 135 ms | 188 ms |
| Eigene Karten in einem Set | 1.280 | 34 ms | 75 ms |
| Profil mit Score | 295 | 172 ms | 251 ms |
| Karte eintragen | 3.915 | 11 ms | 27 ms |

Mit dem Design aus dem Moodboard kamen vier Abrufe dazu (gleiche Daten und Maschine, je 10 Sekunden):

| Abruf | Anfragen pro Sekunde | Median | 99 % schneller als |
| --- | --- | --- | --- |
| Profil mit Score, Achievements und Seltenheiten | 202 | 231 ms | 657 ms |
| Portfolio mit 30 Tagen Verlauf (300 Karten je Nutzer) | 61 | 775 ms | 1.078 ms |
| Beobachtete Karten | 2.857 | 16 ms | 33 ms |
| Markt: Gewinner und Verlierer | 12.270 | 3 ms | 9 ms |

Keine Fehler in allen Läufen. Die Zahlen sind eine untere Grenze: Der Lastgenerator teilt sich die zwei Kerne mit Server und Datenbank, und es liegt kein CDN davor. Ein Set mit 250 Karten ist unkomprimiert 40 KB groß, mit gzip 3,7 KB.

Selbst nachmessen:

```bash
DATABASE_URL=... npm run seed:load -w @value/server      # nur in einer Wegwerf-Datenbank
RATE_LIMIT_PER_MINUTE=1000000000 npm run dev:server
npm run loadtest -w @value/server
```

### Portfolio-Verlauf

Der Verlauf zeigt den heutigen Bestand zu den Preisen jedes Tages, wie bei Börsen-Apps. Der Server greift je Karte über den Index `(card_id, day)` in die Preistabelle (`LATERAL`), statt sie ganz zu lesen; ein normaler Join las bei 1,5 Mio. Preisständen alles und schaffte 4 Anfragen pro Sekunde. Lange Zeiträume nimmt er nur jeden 7. (`1J`) bzw. 30. Tag (`Max`). Bei 300 Karten sind das je Abruf rund 9.000 Indexzugriffe; bei kaltem Speicher dauert ein Abruf bis eine Sekunde. Für große Sammlungen ist der nächste Schritt eine tägliche Momentaufnahme des Werts je Nutzer, die der Abgleich nach den Preisen schreibt. Dann ist der Verlauf ein Zugriff auf höchstens 365 Zeilen.

### Grading und Elemente

- **Element** kommt aus dem Kartenfeld der Quelle (`types`, `energyType` …) und wird auf elf feste Schlüssel abgebildet, englisch wie deutsch (`domain/elements.ts`). Fehlt es in einem Abgleich, bleibt der gespeicherte Wert.
- **Geprüft am 17.11.2026** mit echten Antworten des Free-Tarifs: Sets (`/sets`), Karten mit Varianten, Element und Preisverlauf (`/cards?includeHistory=true`). Daraus ergaben sich zwei Korrekturen: Die Set-ID ist das lesbare `tcgPlayerId` („base-set“), nicht `id` (eine interne Datenbank-ID), und der Verlauf steckt in `priceHistory.conditions["Near Mint"].history`. Ein Karten-Abruf mit Verlauf kostet 2 Credits statt 1 (`SYNC_HISTORY_DAYS`, Free-Tarif höchstens 3 Tage). `/population` antwortet im Free-Tarif mit 403 „Business subscription required“.
- **Preise je Note** lädt der Abgleich mit `SYNC_INCLUDE_GRADED=true` über `includeEbay=true` mit. Belegt ist in der API-Referenz nur `ebay.psa10.avg`; die Zuordnung probiert weitere Hüllen und Preisfelder. Vor dem ersten echten Lauf mit `ppt:probe` prüfen.
- **Population** kommt aus `GET /population` (nur Business-Tarif, 2 Credits je Karte). `SYNC_POPULATION_MAX_CARDS` legt fest, wie viele Karten je Lauf; zuerst die, die jemand besitzt oder beobachtet, und davon die wertvollsten. Ein Bericht gilt eine Woche. Preis und Population landen in derselben Tabelle `card_grades`, ohne sich gegenseitig zu überschreiben.

## Nächste Schritte für den Betrieb

1. Zuordnung mit `ppt:probe` gegen die echte API prüfen und einen ersten echten Abgleich fahren.
2. CDN vor die Katalog-Pfade, `TRUST_PROXY=true`, feste `CORS_ORIGINS`.
3. PgBouncer vor PostgreSQL, sobald mehr als eine Server-Instanz läuft.
4. Zähler der Anfragebegrenzung in einen gemeinsamen Speicher (Redis) legen. Bisher zählt jede Instanz für sich.
5. Abgleich als Cron-Job einrichten, im Business-Tarif täglich kurz nach 6:00 Uhr UTC.
6. Überwachung: Alarm, wenn der letzte erfolgreiche Lauf in `sync_runs` älter als 36 Stunden ist.
7. Anmeldung mit E-Mail, Apple und Google an das anonyme Konto binden.
