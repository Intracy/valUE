#!/bin/bash
# shellcheck disable=SC1111  # deutsche Anführungszeichen in Texten sind gewollt
# valUE auf dem iPhone testen – per Doppelklick im Finder.
#
# Holt den aktuellen Stand von GitHub, startet Datenbank und Server mit
# Demo-Daten auf diesem Mac und zeigt einen QR-Code. Den QR-Code mit der
# iPhone-Kamera scannen, dann öffnet sich valUE in der App „Expo Go“.
#
# Voraussetzungen (das Skript prüft sie und sagt, was fehlt):
#   - Node.js 22 oder neuer, Docker Desktop, Git (Xcode-Befehlszeilenwerkzeuge)
#   - iPhone mit „Expo Go“ aus dem App Store, im selben WLAN wie der Mac
#
# Beenden: dieses Fenster schließen oder Ctrl+C drücken. Server und App stoppen dann.
#
# Einstellbar über Umgebungsvariablen:
#   VALUE_DIR     Ordner für den Code (Standard: ~/valUE)
#   VALUE_BRANCH  Branch (Standard: design-moodboard, sonst main)

set -euo pipefail

REPO_URL="https://github.com/Intracy/valUE.git"
BRANCH="${VALUE_BRANCH:-design-moodboard}"
API_PORT=8787

bold=$'\033[1m'; green=$'\033[32m'; yellow=$'\033[33m'; red=$'\033[31m'; reset=$'\033[0m'
step() { printf '\n%s▶ %s%s\n' "$bold" "$1" "$reset"; }
ok()   { printf '%s✓ %s%s\n' "$green" "$1" "$reset"; }
warn() { printf '%s! %s%s\n' "$yellow" "$1" "$reset"; }
fail() {
  printf '\n%s✗ %s%s\n' "$red" "$1" "$reset"
  [ $# -gt 1 ] && printf '  %s\n' "${@:2}"
  printf '\nFenster mit Enter schließen.'
  read -r _ || true
  exit 1
}

printf '%s\n' "${bold}valUE – Test auf dem iPhone${reset}"

# Finder startet .command-Dateien mit wenigen Pfaden. Homebrew und nvm ergänzen.
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------------------
step "Voraussetzungen prüfen"

if ! xcode-select -p >/dev/null 2>&1; then
  xcode-select --install >/dev/null 2>&1 || true
  fail "Git fehlt noch." "macOS zeigt gleich ein Fenster zur Installation der Befehlszeilenwerkzeuge." "Danach dieses Skript noch einmal per Doppelklick starten."
fi
ok "Git $(git --version | awk '{print $3}')"

if ! command -v node >/dev/null 2>&1; then
  open "https://nodejs.org/de/download" || true
  fail "Node.js fehlt." "Die Download-Seite ist geöffnet: Version 22 (LTS) oder neuer installieren, dann erneut starten."
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  open "https://nodejs.org/de/download" || true
  fail "Node.js $(node -v) ist zu alt." "Bitte Version 22 oder neuer installieren, dann erneut starten."
fi
ok "Node.js $(node -v)"

if ! command -v docker >/dev/null 2>&1; then
  open "https://www.docker.com/products/docker-desktop/" || true
  fail "Docker Desktop fehlt." "Die Download-Seite ist geöffnet. Installieren, einmal starten, dann dieses Skript erneut starten."
fi
if ! docker info >/dev/null 2>&1; then
  warn "Docker Desktop läuft noch nicht, wird gestartet …"
  open -a Docker || fail "Docker Desktop ließ sich nicht starten." "Bitte Docker Desktop von Hand öffnen und das Skript erneut starten."
  for _ in $(seq 1 90); do
    docker info >/dev/null 2>&1 && break
    sleep 2
  done
  docker info >/dev/null 2>&1 || fail "Docker Desktop antwortet nicht." "Bitte warten, bis Docker Desktop fertig gestartet ist, dann erneut starten."
fi
ok "Docker läuft"

IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
[ -z "$IP" ] && IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
[ -z "$IP" ] && fail "Keine WLAN-Adresse gefunden." "Ist der Mac mit dem WLAN verbunden? Das iPhone muss im selben Netz sein."
ok "Adresse dieses Macs im WLAN: $IP"

# ---------------------------------------------------------------------------
step "Code holen"

# Liegt das Skript in einer valUE-Kopie, diese nutzen. Sonst ~/valUE.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../apps/mobile/app.json" ]; then
  DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  DIR="${VALUE_DIR:-$HOME/valUE}"
fi

if [ ! -d "$DIR/.git" ]; then
  git clone "$REPO_URL" "$DIR" || fail "Klonen von GitHub fehlgeschlagen." "Internetverbindung prüfen."
fi
cd "$DIR"

git fetch --quiet origin || warn "GitHub nicht erreichbar, nutze den vorhandenen Stand."
if ! git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  warn "Branch $BRANCH gibt es nicht (mehr), nutze main."
  BRANCH="main"
fi
# npm install darf package-lock.json anpassen; das zählt nicht als eigene Änderung.
git checkout --quiet -- package-lock.json 2>/dev/null || true
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  warn "Im Ordner gibt es eigene Änderungen. Sie bleiben unangetastet; der Code wird nicht aktualisiert."
else
  git checkout --quiet "$BRANCH" 2>/dev/null || git checkout --quiet -b "$BRANCH" "origin/$BRANCH"
  git merge --quiet --ff-only "origin/$BRANCH" 2>/dev/null || warn "Konnte nicht auf den neuesten Stand vorspulen, nutze den vorhandenen."
fi
ok "$DIR, Branch $(git branch --show-current), Stand $(git log -1 --format='%h %s' | cut -c1-70)"

step "Pakete installieren (beim ersten Mal einige Minuten)"
npm install --no-audit --no-fund --loglevel=error || fail "npm install ist fehlgeschlagen." "Die Meldungen oben zeigen den Grund."
ok "Pakete bereit"

# ---------------------------------------------------------------------------
step "Datenbank starten"

if [ -z "$(docker compose ps -q --status running db 2>/dev/null)" ] && lsof -nP -iTCP:5432 -sTCP:LISTEN >/dev/null 2>&1; then
  fail "Port 5432 ist schon belegt (vermutlich ein anderes PostgreSQL)." "Bitte das andere PostgreSQL beenden und erneut starten."
fi
npm run --silent db:up >/dev/null || fail "Die Datenbank ließ sich nicht starten." "Läuft Docker Desktop?"
for _ in $(seq 1 60); do
  docker compose exec -T db pg_isready -U value >/dev/null 2>&1 && break
  sleep 1
done
docker compose exec -T db pg_isready -U value >/dev/null 2>&1 || fail "Die Datenbank meldet sich nicht." "In Docker Desktop den Container „db“ prüfen."
ok "PostgreSQL läuft"

[ -f apps/server/.env ] || cp apps/server/.env.example apps/server/.env
npm run --silent db:migrate || fail "Datenbank-Migration fehlgeschlagen."
npm run --silent seed:demo -w @value/server || fail "Demo-Daten ließen sich nicht laden."
ok "Demo-Daten geladen"

# ---------------------------------------------------------------------------
step "Server starten"

mkdir -p logs
if lsof -nP -iTCP:"$API_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  warn "Auf Port $API_PORT läuft schon etwas; nutze den laufenden Server."
  SERVER_PID=""
else
  npm run dev:server > logs/server.log 2>&1 &
  SERVER_PID=$!
fi

CLEANED=""
cleanup() {
  [ -n "$CLEANED" ] && return
  CLEANED=1
  printf '\nBeende …\n'
  if [ -n "${SERVER_PID:-}" ]; then
    # npm startet tsx, tsx startet node: alles beenden, was auf dem Server-Port lauscht.
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    lsof -ti "tcp:$API_PORT" -sTCP:LISTEN 2>/dev/null | xargs kill >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM HUP

for _ in $(seq 1 60); do
  curl -fsS "http://localhost:$API_PORT/readyz" >/dev/null 2>&1 && break
  sleep 1
done
curl -fsS "http://localhost:$API_PORT/readyz" >/dev/null 2>&1 || fail "Der Server startet nicht." "Details in $DIR/logs/server.log"
ok "Server läuft auf http://$IP:$API_PORT (Protokoll: logs/server.log)"

# Die App spricht den Server über die WLAN-Adresse an; "localhost" wäre auf dem iPhone das iPhone selbst.
printf 'EXPO_PUBLIC_API_URL=http://%s:%s\n' "$IP" "$API_PORT" > apps/mobile/.env

# ---------------------------------------------------------------------------
step "App starten"
cat <<EOF

  1. iPhone ins selbe WLAN wie diesen Mac.
  2. Den QR-Code unten mit der iPhone-Kamera scannen.
  3. Expo Go öffnet valUE. „Lokales Netzwerk“ erlauben.

  Fragt der Mac, ob „node“ eingehende Verbindungen annehmen darf: Erlauben.
  Meldet Expo Go, das Projekt passe nicht zur App-Version: App Store öffnen
  und Expo Go aktualisieren.

  Beenden: Fenster schließen oder Ctrl+C.

EOF
cd apps/mobile
npx expo start --lan
