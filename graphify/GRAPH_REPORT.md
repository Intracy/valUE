# Graph Report - value  (2026-11-17)

## Corpus Check
- Corpus is ~34,324 words - fits in a single context window. You may not need a graph.

## Summary
- 739 nodes · 1701 edges · 57 communities (29 shown, 28 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App-Bildschirme & Queries
- API-Server & Endpunkte
- Scan-Erkennung (Server)
- Datenbank & Konfiguration
- Abgleich & Demo-Daten
- Expo-App-Konfiguration
- PPT-Datenzuordnung
- CI-Pipeline
- Scanner (App)
- Docker Compose
- App-Abhängigkeiten
- Server-Abhängigkeiten
- Server-TypeScript-Config
- Root-Workspace
- Server-Dev-Abhängigkeiten
- Server-Skripte
- XP & Scores
- App-Dev-Abhängigkeiten
- API-Vertrag Paket
- Tab-Navigation
- Abgleich-Tests
- PPT-Probe
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- PPT-Client & Credits
- Build-Config
- App-Skripte
- Lasttest
- Demo-Kartenmotive
- Vitest
- Paket: expo-camera
- Paket: expo-device
- Paket: expo-font
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Paket: expo-linking
- Paket: expo-secure-store
- Paket: expo-splash-screen
- Paket: expo-status-bar
- Paket: expo-system-ui
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-reanimated
- Paket: react-native-safe-area-context
- Paket: react-native-web
- Paket: react-native-worklets
- Paket: @tanstack/react-query
- CSS-Typen
- Paket: tesseract.js
- Paket: zod
- Abgleich-Läufe
- PgBouncer (offen)
- Ungetestet auf Geräten

## God Nodes (most connected - your core abstractions)
1. `usePalette()` - 39 edges
2. `AppText()` - 27 edges
3. `react-native` - 24 edges
4. `KarteScreen()` - 17 edges
5. `Db` - 17 edges
6. `SammlungScreen()` - 15 edges
7. `ScanScreen()` - 15 edges
8. `SetScreen()` - 15 edges
9. `MessageView()` - 14 edges
10. `ErrorView()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts
- `Credit-Budget je Lauf` --references--> `CreditUsage`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Bild-Fingerabdruck (Farbraster + Kanten)` --implements--> `fingerprint()`  [EXTRACTED]
  docs/SCANNER.md → apps/server/src/scan/image.ts
- `Props` --references--> `CardSummary`  [EXTRACTED]
  apps/mobile/src/components/card-tile.tsx → packages/api-types/src/index.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]

## Communities (57 total, 28 thin omitted)

### Community 0 - "App-Bildschirme & Queries"
Cohesion: 0.06
Nodes (105): ApiRequestError, request(), keys, queryClient, SetQuantityInput, useCard(), useCollectionProgress(), useOwnedInSet() (+97 more)

### Community 1 - "API-Server & Endpunkte"
Cohesion: 0.05
Nodes (63): API_URL, RequestOptions, getToken(), storage, Props, Props, Db, withTransaction() (+55 more)

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.07
Nodes (38): computeMissingFingerprints(), CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate (+30 more)

### Community 3 - "Datenbank & Konfiguration"
Cohesion: 0.08
Nodes (29): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+21 more)

### Community 4 - "Abgleich & Demo-Daten"
Cohesion: 0.17
Nodes (22): DbClient, demoCards(), demoSets, RARITIES, seedDemo(), PriceSource, SourceCard, SourceSet (+14 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "PPT-Datenzuordnung"
Cohesion: 0.16
Nodes (20): asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, isObject(), Json, LOW_KEYS (+12 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Scanner (App)"
Cohesion: 0.16
Nodes (17): useConfirmScan(), useScanCard(), GuideOverlay(), messageFor(), Phase, RoundButton(), ScanScreen(), styles (+9 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "App-Abhängigkeiten"
Cohesion: 0.12
Nodes (16): dependencies, expo@~58.0.25, expo-glass-effect@~58.0.5, expo-image@~58.0.18, expo-router@~58.0.31, expo-symbols@~58.0.5, react@19.3.0, react-dom@19.3.0 (+8 more)

### Community 11 - "Server-Abhängigkeiten"
Cohesion: 0.12
Nodes (16): dependencies, fastify@^5.0.0, @fastify/compress@^8.0.0, @fastify/cors@^11.0.0, @fastify/rate-limit@^10.0.0, pg@^8.13.0, sharp@^0.35.5, @tesseract.js-data/eng@^1.0.0 (+8 more)

### Community 12 - "Server-TypeScript-Config"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noUncheckedIndexedAccess, outDir (+7 more)

### Community 13 - "Root-Workspace"
Cohesion: 0.13
Nodes (14): engines, node, name, private, scripts, db:migrate, db:up, dev:app (+6 more)

### Community 14 - "Server-Dev-Abhängigkeiten"
Cohesion: 0.19
Nodes (13): devDependencies, tsx@^4.19.0, @types/node@^22.0.0, @types/pg@^8.11.0, typescript@~6.0.3, typescript, name, private (+5 more)

### Community 15 - "Server-Skripte"
Cohesion: 0.14
Nodes (14): scripts, build, dev, fingerprints, loadtest, migrate, ppt:probe, scan:benchmark (+6 more)

### Community 16 - "XP & Scores"
Cohesion: 0.21
Nodes (10): cardXp(), RarityTier, rarityTier(), scoreTrack(), VINTAGE_BEFORE, XP_BY_TIER, csvRecords(), parseCsvLine() (+2 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.20
Nodes (11): expo-constants@~58.0.16, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name, private (+3 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): ProfilLayout(), SammlungLayout(), SetsLayout(), SucheLayout(), TabStack()

### Community 20 - "Abgleich-Tests"
Cohesion: 0.22
Nodes (4): SourceError, db, options, sets

### Community 21 - "PPT-Probe"
Cohesion: 0.25
Nodes (8): config, firstRow(), keysOf(), rawSet, report(), set, source, Feldzuordnung PPT ungeprüft (ppt:probe)

### Community 22 - "Produktvision & Features"
Cohesion: 0.25
Nodes (8): Achievements & Profil-Schmuck (geplant), Anmeldung, Abo & Einmalkauf (geplant), Euro-Preise Cardmarket / Graded / Population (geplant), Master-Set-Ansicht, Pokemon Price Tracker (Datenanbieter), Restkosten fehlender Karten, Sammelscore & Vintage-Score (XP), valUE (Sammel-App)

### Community 23 - "API-Types-TS-Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, include

### Community 24 - "App-TS-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/assets/*, expo/tsconfig.base

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "Demo-Kartenmotive"
Cohesion: 0.38
Nodes (6): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random()

## Knowledge Gaps
- **13 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `Anmeldung, Abo & Einmalkauf (geplant)`, `Achievements & Profil-Schmuck (geplant)`, `Lasttest (50k Karten, 10k Nutzer)` (+8 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 270 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `App-Bildschirme & Queries` to `Scanner (App)`, `App-Dev-Abhängigkeiten`, `App-Abhängigkeiten`, `API-Server & Endpunkte`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `Anmeldung, Abo & Einmalkauf (geplant)` to the rest of the system?**
  _13 weakly-connected nodes found - possible missing edges._
- **Should `App-Bildschirme & Queries` be split into smaller, more focused modules?**
  _Cohesion score 0.05544662309368192 - nodes in this community are weakly interconnected._
- **Why does `fastify` connect `API-Server & Endpunkte` to `Datenbank & Konfiguration`, `Scan-Erkennung (Server)`, `Server-Abhängigkeiten`, `Server-Dev-Abhängigkeiten`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Should `API-Server & Endpunkte` be split into smaller, more focused modules?**
  _Cohesion score 0.052125100240577385 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `API-Server & Endpunkte` to `Scan-Erkennung (Server)`, `Datenbank & Konfiguration`, `Abgleich & Demo-Daten`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Scan-Erkennung (Server)` be split into smaller, more focused modules?**
  _Cohesion score 0.0746606334841629 - nodes in this community are weakly interconnected._