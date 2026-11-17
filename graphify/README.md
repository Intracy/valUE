# Graphify-Übersicht

Wissensgraph des Repositorys, erzeugt mit [Graphify](https://github.com/Graphify-Labs/graphify) (Version 0.9.111). Dieser Ordner gehört nicht zur Software: Weder App noch Server lesen ihn, er dient nur der Übersicht.

| Datei | Inhalt |
| --- | --- |
| `graph.html` | Interaktiver Graph, im Browser öffnen (klicken, filtern, suchen) |
| `GRAPH_REPORT.md` | Zusammenfassung: zentrale Knoten, auffällige Verbindungen, Bereiche, Fragen |
| `graph.json` | Vollständige Graphdaten, abfragbar mit `graphify query`, `graphify path`, `graphify explain` |

**Stand:** Commit `c8021f3` (17.11.2026). 894 Knoten, 2.351 Verbindungen, 70 Bereiche.

**Grundlage:**

- Code (92 Dateien) per Syntaxanalyse, ohne Sprachmodell.
- `README.md`, `docs/ARCHITEKTUR.md`, `docs/DESIGN.md` und `docs/SCANNER.md` inhaltlich ausgewertet und mit dem Code verknüpft. Verbindungen sind als `EXTRACTED` (steht so in der Quelle) oder `INFERRED` (abgeleitet) markiert.
- Nicht enthalten: Bilder (Icons, Screenshots) und die SQL-Migrationen.

## Abfragen

```bash
uv tool install graphifyy==0.9.111     # oder: pip install graphifyy==0.9.111
graphify explain "identifyCard()" --graph graphify/graph.json
graphify affected "ScanCandidate" --graph graphify/graph.json   # was hängt davon ab?
graphify path "ScanScreen()" "identifyCard()" --undirected --graph graphify/graph.json
graphify query "Wie kommt ein Preis vom Sync in die App?" --graph graphify/graph.json
```

## Aktualisieren

Der Graph wird mit jeder Code-Änderung im selben Commit nachgezogen. Graphify arbeitet dabei im Ordner `graphify-out/` (nicht im Repo), `refresh.py` kopiert hin und zurück und erhält die Bereichsnamen.

```bash
python3 graphify/refresh.py update              # geänderten Code neu einlesen
python3 graphify/refresh.py finish names.json   # neu entstandene Bereiche benennen
python3 graphify/refresh.py finish              # wenn `update` keine neuen Bereiche meldet
```

`update` listet Bereiche, die nach der Neuaufteilung keinen Namen mehr haben, mit ihren Dateien und Knoten. Deren Namen kommen als `{"<ID>": "Name"}` in eine JSON-Datei. Was Graphify nicht einlesen soll, steht in `.graphifyignore`.

Code liest Graphify per Syntaxanalyse selbst ein. Die inhaltlichen Knoten aus den Markdown-Dokumenten (Konzepte, Begründungen) bleiben bei `update` erhalten, werden aber nicht neu erzeugt: Ändert sich ein Dokument inhaltlich, die betroffenen Knoten und Verbindungen von Hand in `graphify/graph.json` ergänzen oder entfernen und danach `update` und `finish` laufen lassen.
