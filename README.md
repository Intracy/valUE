# valUE

Sammelkarten-Portfolio für iOS, Android und Web. Dieses Repository enthält das Grundgerüst und einen ersten lauffähigen Prototyp: eine App, einen eigenen Server und den Abgleich mit der Datenquelle [Pokemon Price Tracker](https://www.pokemonpricetracker.com/).

**Stand:** Prototyp. Der Server ist getestet (30 automatische Tests) und unter Last gemessen. Die App ist als Web-Fassung im Browser durchgeklickt. Auf einem iPhone, im iOS-Simulator und auf Android ist sie noch nicht gelaufen. Die Anbindung an die echte API ist noch nicht gegen echte Antworten geprüft, siehe [Echte Daten laden](#echte-daten-laden).

## Aufbau

```
apps/mobile          App für iOS, Android und Web (Expo, React Native, TypeScript)
apps/server          Eigener Server (Fastify, PostgreSQL) mit Abgleich zur Datenquelle
packages/api-types   Vertrag zwischen App und Server, nur Typen
docs/                Architektur und Gestaltung
```

Die App spricht nur mit dem eigenen Server. Der Server holt die Daten nach Zeitplan bei Pokemon Price Tracker, speichert sie und bedient daraus alle Nutzer. Die Kosten der Datenquelle hängen damit von der Größe des Katalogs ab, nicht von der Zahl der Nutzer. Details: [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md).

## Was der Prototyp kann

- Sets mit Fortschritt je Set
- Master-Set-Ansicht: alle Karten eines Sets im Raster, vorhandene farbig, fehlende ausgegraut, Filter „Alle / Fehlend / Vorhanden“, Summe der fehlenden Karten
- Karte eintragen und austragen (lange drücken im Raster, Plus und Minus im Detail)
- Kartendetail mit Tagespreis, Preisverlauf, Fakten und Varianten
- Suche nach Kartennamen
- Profil mit Sammelscore und Vintage-Score
- Sammlungswert zum Tagespreis
- Anonymes Konto je Gerät, Sammlung liegt auf dem Server

Noch nicht enthalten: Scanner, Achievements, Anmeldung mit E-Mail, Apple oder Google, Käufe, Euro-Preise von Cardmarket, Graded-Preise und Population.

## Schnellstart mit Demo-Daten

Voraussetzungen: Node.js 22 oder neuer, Docker.

```bash
npm install
npm run db:up                                  # PostgreSQL starten
cp apps/server/.env.example apps/server/.env
cp apps/mobile/.env.example apps/mobile/.env
npm run db:migrate
npm run seed:demo -w @value/server             # erfundene Sets und Karten, ohne API-Schlüssel
npm run dev:server                             # Server auf http://localhost:8787
npm run dev:app                                # in einem zweiten Terminal
```

Im Expo-Terminal öffnet `w` die Web-Fassung, `i` den iOS-Simulator (braucht Xcode auf einem Mac), `a` den Android-Emulator. Auf einem echten Gerät in `apps/mobile/.env` statt `localhost` die IP-Adresse des Rechners im WLAN eintragen.

## Echte Daten laden

1. Schlüssel von <https://www.pokemonpricetracker.com/api-keys> in `apps/server/.env` bei `PPT_API_KEY` eintragen. **Der Schlüssel gehört nur in diese Datei.** Sie ist von Git ausgeschlossen. Der Schlüssel kommt nie in die App und nie ins Repository.
2. Zuordnung prüfen (kostet 2 Credits):
   ```bash
   npm run ppt:probe -w @value/server
   ```
   Die API-Referenz beschreibt die Antworten von `/sets` und `/cards` nur teilweise. Das Skript zeigt die tatsächlichen Feldnamen und meldet, welche Felder der Server nicht findet. Fehlt etwas, die Feldlisten in `apps/server/src/sources/pokemon-price-tracker.ts` ergänzen.
3. Abgleich starten:
   ```bash
   npm run sync
   ```

Der kostenlose Tarif hat 100 Credits am Tag, ein Set kostet einen Credit je Karte. Voreingestellt ist deshalb ein kleines Set (`SYNC_SETS=Celebrations`) mit höchstens 90 Credits je Lauf. Sets, die das Budget sprengen, überspringt der Abgleich und sagt es.

Der kostenlose Tarif ist laut Lizenz des Anbieters nur für Projekte ohne Einnahmen gedacht. Sobald die App Geld verdient, braucht sie den Business-Tarif. Dann `SYNC_MODE=export` setzen: Der Server lädt den ganzen Katalog einmal täglich als Datei, ohne Credits.

## Prüfen

```bash
npm run typecheck      # Typprüfung für Server, App und Vertrag
npm test               # Servertests, brauchen die Datenbank value_test aus docker-compose
```

Lasttest mit 50.000 Karten und 10.000 Nutzern: siehe [docs/ARCHITEKTUR.md](docs/ARCHITEKTUR.md#lasttest).

## Rechtliches

valUE ist ein unabhängiges Projekt und steht in keiner Verbindung zu Nintendo, The Pokémon Company, Creatures, Game Freak oder Pokemon Price Tracker. Die Demo-Daten sind erfunden. Kartenbilder und Kartendaten der Datenquelle sind nicht Teil dieses Repositorys.
