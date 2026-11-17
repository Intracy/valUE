# valUE auf der Synology (Docker) und über Tailscale

Test-Installation auf einer Synology mit Container Manager: Datenbank, API-Server,
Katalogabgleich und Web-App laufen als vier Container. Über Tailscale öffnet man die App auf dem
iPhone in Safari, per HTTPS, damit auch der Kamera-Scan funktioniert.

| Container | Aufgabe |
| --- | --- |
| `value-db-1` | PostgreSQL 16, Daten im Docker-Volume `value_value-db` |
| `value-api-1` | API-Server; beim Start Migration |
| `value-catalog-1` | Katalog von TCGdex (en, de, ja), Fingerabdrücke für den Scanner, Preise von PPT. Beim Start und alle 24 Stunden |
| `value-web-1` | Web-App (Expo, vorgerendert) in nginx; leitet `/v1` an die API weiter. Port 8095 |

## Einrichten und aktualisieren

Ein Skript erledigt beides: [`nas/update.sh`](nas/update.sh). Es holt den
neuesten Stand von GitHub (Git läuft im Container `alpine/git`, die NAS braucht
kein Git), baut die Images, startet die Container neu und gibt die App per
`tailscale serve` im Tailnet frei.

Im **Aufgabenplaner** (Systemsteuerung → Aufgabenplaner → Erstellen → Geplante
Aufgabe → Benutzerdefiniertes Script), Benutzer **root**:

```bash
DIR=/volume1/docker/valUE
[ -f "$DIR/deploy/nas/update.sh" ] || docker run --rm -v /volume1/docker:/parent alpine/git clone https://github.com/Intracy/valUE.git /parent/valUE
bash "$DIR/deploy/nas/update.sh"
```

Beim ersten Lauf dauert das Bauen 10 bis 20 Minuten. Danach baut das Skript nur,
wenn es auf GitHub einen neuen Stand gibt. `--force` am Ende baut immer neu.

## Öffnen

- Im Tailnet mit HTTPS: `https://<NAS-Name>.<tailnet>.ts.net:8443`. Die genaue
  Adresse steht am Ende der Ausgabe des Skripts. Voraussetzung: Im
  Tailscale-Admin unter **DNS** sind MagicDNS und **HTTPS-Zertifikate**
  eingeschaltet.
- Im Heimnetz oder ohne HTTPS: `http://<IP der NAS>:8095`. Alles außer der
  Kamera funktioniert; Fotos lassen sich aus der Mediathek wählen.

Auf dem iPhone in Safari öffnen, dann Teilen → „Zum Home-Bildschirm“: valUE
startet dann wie eine App.

## Katalog und Preise

Der Dienst `catalog` lädt alle Karten von [TCGdex](https://tcgdex.dev) auf
Englisch, Deutsch und Japanisch (rund 57.000 Karten) samt Bildern und rechnet
daraus die Fingerabdrücke für den Scanner. Der erste Lauf dauert ein bis zwei
Stunden; bis dahin findet der Scanner nur Karten aus schon geladenen Sets.
Fortschritt: `docker logs -f value-catalog-1` (oder Container Manager →
`value-catalog-1` → Protokoll). Danach lädt er alle 24 Stunden nur neue Sets.

Beim ersten Lauf entfernt er die Demo-Sets, und mit ihnen Demo-Karten aus Sammlungen.

**Preise** kommen von Pokemon Price Tracker, zugeordnet über die TCGdex-ID auf die
englische und die deutsche Fassung einer Karte (US-Marktpreis von TCGPlayer).
Japanische Karten haben vorerst keinen Preis. Den Schlüssel nicht ins Repository
schreiben, sondern auf der NAS in `/volume1/docker/valUE.env`:

```
PPT_API_KEY=pokeprice_…
# Sets, deren Preise geladen werden (Namen wie bei PPT). Der Free-Tarif schafft rund 90 Karten am Tag.
SYNC_SETS=Base Set
```

`update.sh` liest die Datei bei jedem Lauf. Danach die Aufgabe einmal mit `--force` ausführen.

Demo-Daten statt echter Karten: beim Dienst `api` `SEED_DEMO: "true"` und den
Dienst `catalog` weglassen.
