# valUE auf der Synology (Docker) und über Tailscale

Test-Installation auf einer Synology mit Container Manager: Datenbank, API-Server
und Web-App laufen als drei Container. Über Tailscale öffnet man die App auf dem
iPhone in Safari, per HTTPS, damit auch der Kamera-Scan funktioniert.

| Container | Aufgabe |
| --- | --- |
| `value-db-1` | PostgreSQL 16, Daten im Docker-Volume `value_value-db` |
| `value-api-1` | API-Server; beim Start Migration und Demo-Daten |
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

## Echte Daten statt Demo

In `deploy/docker-compose.yml` beim Dienst `api` `SEED_DEMO` auf `"false"` setzen
und `PPT_API_KEY` sowie die `SYNC_*`-Werte aus `apps/server/.env.example`
ergänzen. Den Schlüssel nicht ins Repository schreiben: Am besten in einer
Datei `deploy/.env` auf der NAS, die per `env_file` eingebunden wird.
