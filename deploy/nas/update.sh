#!/bin/bash
# valUE auf der Synology aktualisieren: neuesten Stand von GitHub holen, Images
# bauen, Container neu starten und per Tailscale (HTTPS) erreichbar machen.
#
# Für den Aufgabenplaner (DSM → Systemsteuerung → Aufgabenplaner → Erstellen →
# Geplante Aufgabe → Benutzerdefiniertes Script, Benutzer: root):
#
#   bash /volume1/docker/valUE/deploy/nas/update.sh
#
# Läuft nur durch, wenn es einen neuen Stand gibt oder die Container nicht laufen.
# Mit --force wird immer neu gebaut. Git braucht die NAS nicht: Es läuft im
# Container alpine/git.
#
# Einstellbar: VALUE_DIR (Standard /volume1/docker/valUE), VALUE_BRANCH (Standard main).

set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

REPO_URL="https://github.com/Intracy/valUE.git"
DIR="${VALUE_DIR:-/volume1/docker/valUE}"
BRANCH="${VALUE_BRANCH:-main}"
WEB_PORT=8095        # Port der Web-App auf der NAS (siehe deploy/docker-compose.yml)
TAILSCALE_PORT=8443  # HTTPS-Port im Tailnet
TAILSCALE=/var/packages/Tailscale/target/bin/tailscale

log() { printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
git_() { docker run --rm -v "$DIR":/repo -w /repo alpine/git:latest -c safe.directory=/repo "$@"; }

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
else
  COMPOSE=(docker-compose)
fi
compose() { "${COMPOSE[@]}" -f "$DIR/deploy/docker-compose.yml" "$@"; }

# 1. Code holen
if [ ! -d "$DIR/.git" ]; then
  log "Erster Lauf: klone $REPO_URL nach $DIR"
  mkdir -p "$(dirname "$DIR")"
  docker run --rm -v "$(dirname "$DIR")":/parent alpine/git:latest \
    clone "$REPO_URL" "/parent/$(basename "$DIR")"
fi

if ! git_ ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  log "Branch $BRANCH gibt es nicht (mehr), nutze main"
  BRANCH=main
fi

before="$(git_ rev-parse HEAD)"
git_ fetch --quiet --prune origin "$BRANCH"
# Die Kopie auf der NAS ist nur zum Ausführen da: immer genau der Stand von GitHub.
git_ checkout --quiet -B "$BRANCH" "origin/$BRANCH"
git_ reset --quiet --hard "origin/$BRANCH"
after="$(git_ rev-parse HEAD)"
log "Stand: $BRANCH $(git_ log -1 --format='%h %s')"

# 2. Bauen und starten, wenn nötig
running="$(compose ps -q web 2>/dev/null || true)"
if [ "$before" = "$after" ] && [ -n "$running" ] && [ "${1:-}" != "--force" ]; then
  log "Kein neuer Stand, Container laufen. Nichts zu tun."
else
  log "Baue Images (beim ersten Mal 10 bis 20 Minuten) …"
  compose build --pull
  compose up -d --remove-orphans
  docker image prune -f >/dev/null
  log "Container laufen."
fi

# 3. Warten, bis die App antwortet
for _ in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:$WEB_PORT/readyz" >/dev/null 2>&1 && break
  sleep 2
done
curl -fsS "http://127.0.0.1:$WEB_PORT/readyz" >/dev/null 2>&1 || { log "App antwortet nicht. Logs: ${COMPOSE[*]} -f $DIR/deploy/docker-compose.yml logs"; exit 1; }
log "App läuft auf http://$(hostname):$WEB_PORT"

# 4. Über Tailscale mit HTTPS freigeben (die iPhone-Kamera braucht HTTPS)
if [ -x "$TAILSCALE" ]; then
  if "$TAILSCALE" serve --bg --https="$TAILSCALE_PORT" "http://127.0.0.1:$WEB_PORT" >/dev/null 2>&1; then
    name="$("$TAILSCALE" status --json 2>/dev/null | sed -n 's/.*"DNSName": *"\([^"]*\)\.".*/\1/p' | head -1)"
    log "Im Tailnet: https://${name:-<NAS-Name>.<tailnet>.ts.net}:$TAILSCALE_PORT"
  else
    log "Tailscale Serve nicht möglich (HTTPS im Tailscale-Admin unter DNS aktivieren)."
    log "Ohne HTTPS: http://<Tailscale-IP der NAS>:$WEB_PORT (Kamera-Scan geht dann nicht)."
  fi
fi
