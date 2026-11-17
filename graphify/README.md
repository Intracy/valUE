# Graphify-Übersicht

Wissensgraph des Repositorys, erzeugt mit [Graphify](https://github.com/Graphify-Labs/graphify) (Version 0.9.111). Dieser Ordner gehört nicht zur Software: Weder App noch Server lesen ihn, er dient nur der Übersicht.

| Datei | Inhalt |
| --- | --- |
| `graph.html` | Interaktiver Graph, im Browser öffnen (klicken, filtern, suchen) |
| `GRAPH_REPORT.md` | Zusammenfassung: zentrale Knoten, auffällige Verbindungen, Bereiche, Fragen |
| `graph.json` | Vollständige Graphdaten, abfragbar mit `graphify query`, `graphify path`, `graphify explain` |

**Stand:** Commit `87d8217` (17.11.2026). 739 Knoten, 1.701 Verbindungen, 57 Bereiche.

**Grundlage:**

- Code (92 Dateien) per Syntaxanalyse, ohne Sprachmodell.
- `README.md`, `docs/ARCHITEKTUR.md`, `docs/DESIGN.md` und `docs/SCANNER.md` inhaltlich ausgewertet und mit dem Code verknüpft. Verbindungen sind als `EXTRACTED` (steht so in der Quelle) oder `INFERRED` (abgeleitet) markiert.
- Nicht enthalten: Bilder (Icons, Screenshots) und die SQL-Migrationen.

Der Graph wird nicht automatisch aktualisiert. Nach größeren Änderungen neu erzeugen.

## Abfragen

```bash
uv tool install graphifyy     # oder: pipx install graphifyy
graphify explain "identifyCard()" --graph graphify/graph.json
graphify path "ScanScreen()" "identifyCard()" --undirected --graph graphify/graph.json
```
