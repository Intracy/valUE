#!/usr/bin/env python3
"""Hält die Graphify-Übersicht in graphify/ aktuell.

Graphify arbeitet in graphify-out/ (nicht im Repo). Dieses Skript kopiert den
eingecheckten Stand dorthin, lässt `graphify update` die geänderten Code-Dateien
neu einlesen und kopiert das Ergebnis zurück. Die Bereichsnamen bleiben dabei
erhalten; neu entstandene Bereiche werden gelistet und in einem zweiten Schritt
benannt.

    python3 graphify/refresh.py update            # Code neu einlesen
    python3 graphify/refresh.py finish names.json # neue Bereiche benennen, übernehmen
    python3 graphify/refresh.py finish            # ohne neue Bereiche: nur übernehmen

names.json: {"<Bereichs-ID>": "Name", ...} für die von `update` gelisteten IDs.
Voraussetzung: pip install graphifyy==0.9.111 (oder uv tool install graphifyy).
"""

from __future__ import annotations

import collections
import json
import re
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRACKED = ROOT / "graphify"
WORK = ROOT / "graphify-out"
LABELS = WORK / ".graphify_labels.json"
PENDING = WORK / ".graphify_labels.pending.json"
RECLUSTER = WORK / ".refresh_recluster"
OUTPUTS = ("graph.json", "GRAPH_REPORT.md", "graph.html")


def run(*args: str) -> None:
    print("$", " ".join(args))
    subprocess.run(args, cwd=ROOT, check=True)


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def labels_from_graph(graph: dict) -> dict[str, str]:
    names: dict[str, str] = {}
    for node in graph.get("nodes", []):
        cid, name = node.get("community"), node.get("community_name")
        if cid is not None and isinstance(name, str) and name:
            names.setdefault(str(cid), name)
    return names


def prepare_workdir() -> None:
    """graphify-out/ aus dem eingecheckten Stand aufbauen, falls sie fehlt oder veraltet ist."""
    tracked = TRACKED / "graph.json"
    work = WORK / "graph.json"
    if work.exists() and work.read_bytes() == tracked.read_bytes():
        return
    # Alter Arbeitsstand weg: Sonst hält Graphify die Dateien laut manifest.json für
    # unverändert und liest nichts neu ein.
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir()
    for name in OUTPUTS:
        shutil.copy2(TRACKED / name, WORK / name)
    LABELS.write_text(
        json.dumps(labels_from_graph(load(tracked)), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    PENDING.unlink(missing_ok=True)
    # Eingecheckter Stand kann von Hand geändert sein (Doku-Knoten):
    # finish schreibt Report und HTML dann neu.
    RECLUSTER.touch()


def show_pending() -> None:
    pending = load(PENDING)
    if not pending:
        print("\nKeine neuen Bereiche. Weiter mit: python3 graphify/refresh.py finish")
        return
    graph = load(WORK / "graph.json")
    members: dict[str, list[dict]] = collections.defaultdict(list)
    for node in graph["nodes"]:
        members[str(node.get("community"))].append(node)
    print(f"\n{len(pending)} Bereich(e) ohne Namen (Vorschlag von Graphify = zentraler Knoten):")
    for cid, hub in sorted(pending.items(), key=lambda kv: int(kv[0])):
        nodes = members.get(cid, [])
        files = collections.Counter(n.get("source_file") or "-" for n in nodes).most_common(3)
        sample = ", ".join(n.get("label", n["id"]) for n in nodes[:8])
        print(f"  {cid:>3}  {hub!r}  ({len(nodes)} Knoten)")
        print(f"       Dateien: {', '.join(f'{f} ({c})' for f, c in files)}")
        print(f"       Knoten:  {sample}")
    print("\nNamen als JSON ablegen und: python3 graphify/refresh.py finish names.json")


def cmd_update() -> None:
    prepare_workdir()
    run("graphify", "update", ".")
    show_pending()


def readme_stand(graph: dict, communities: int) -> None:
    readme = TRACKED / "README.md"
    commit = (graph.get("built_at_commit") or "")[:7] or subprocess.run(
        ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.strip()
    nodes, edges = len(graph["nodes"]), len(graph.get("links", []))
    fmt = lambda n: f"{n:,}".replace(",", ".")
    line = (
        f"**Stand:** Commit `{commit}` ({date.today():%d.%m.%Y}). "
        f"{fmt(nodes)} Knoten, {fmt(edges)} Verbindungen, {communities} Bereiche."
    )
    text = readme.read_text(encoding="utf-8")
    readme.write_text(re.sub(r"^\*\*Stand:\*\*.*$", line, text, count=1, flags=re.M), encoding="utf-8")
    print(line)


def cmd_finish(names_file: str | None) -> None:
    if not (WORK / "graph.json").exists():
        sys.exit("graphify-out/ fehlt. Zuerst: python3 graphify/refresh.py update")
    pending = load(PENDING)
    names = load(Path(names_file)) if names_file else {}
    missing = sorted(set(pending) - set(names), key=int)
    if missing:
        sys.exit(f"Noch ohne Namen: {', '.join(missing)}. In names.json ergänzen.")
    if pending:
        labels = load(LABELS)
        labels.update({k: names[k] for k in pending})
        LABELS.write_text(json.dumps(labels, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        PENDING.unlink()
    if pending or RECLUSTER.exists():
        # Gleicher Graph, gleiche Aufteilung: cluster-only schreibt nur Namen,
        # Report und HTML neu.
        run("graphify", "cluster-only", ".", "--no-label")
        RECLUSTER.unlink(missing_ok=True)
        if load(PENDING):
            show_pending()
            sys.exit("Erst diese Bereiche benennen, dann erneut finish.")
    for name in OUTPUTS:
        shutil.copy2(WORK / name, TRACKED / name)
    graph = load(TRACKED / "graph.json")
    readme_stand(graph, len({n.get("community") for n in graph["nodes"]}))
    print("graphify/ aktualisiert.")


def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in ("update", "finish"):
        sys.exit(__doc__)
    if sys.argv[1] == "update":
        cmd_update()
    else:
        cmd_finish(sys.argv[2] if len(sys.argv) > 2 else None)


if __name__ == "__main__":
    main()
