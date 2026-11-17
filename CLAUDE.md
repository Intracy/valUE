# valUE: Hinweise für die Arbeit am Code

## Orientierung über Graphify

Im Ordner `graphify/` liegt ein Wissensgraph des Repositorys (Code und Docs). Vor Änderungen zuerst dort nachsehen, statt das Repo zu durchsuchen:

- `graphify/GRAPH_REPORT.md`: Bereiche, zentrale Knoten, auffällige Verbindungen.
- `graphify explain "<Symbol>" --graph graphify/graph.json`: Datei, Zeile, Aufrufer und Aufgerufene.
- `graphify affected "<Symbol>" --graph graphify/graph.json`: was von einer Änderung betroffen ist.
- `graphify path "A" "B" --undirected --graph graphify/graph.json`: wie zwei Stellen zusammenhängen.

Installation: `pip install graphifyy==0.9.111` (bzw. `--break-system-packages` im Container).

## Graph aktuell halten

Jede Änderung an Code oder Docs zieht den Graphen im selben Commit nach:

1. `python3 graphify/refresh.py update`
2. Meldet das Skript neue Bereiche, sie in einer JSON-Datei benennen (deutsch, 2–4 Wörter, im Stil der vorhandenen) und `python3 graphify/refresh.py finish names.json`; sonst `python3 graphify/refresh.py finish`.
3. Inhaltlich geänderte Markdown-Dokumente: die zugehörigen Konzept-Knoten in `graphify/graph.json` von Hand anpassen (Graphify liest nur Code automatisch), dann erneut `update` und `finish`.

Details stehen in `graphify/README.md`.

## Sonst

- Tests: `npm test` (braucht Postgres, siehe README), Typprüfung: `npm run typecheck`.
- Der Schlüssel für Pokemon Price Tracker gehört nur in `apps/server/.env` (gitignored), nie in Code, Doku oder Commits.
- Texte in App, Doku und Commits auf Deutsch.
