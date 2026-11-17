# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 894 nodes · 2351 edges · 70 communities (42 shown, 28 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8021f3a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Designsystem & Bausteine
- API-Server & Endpunkte
- Scan-Erkennung (Server)
- Paket: vitest
- Scanner, Währung & Darstellung (App)
- Expo-App-Konfiguration
- Pokemon-Price-Tracker-Anbindung
- CI-Pipeline
- PokemonPriceTrackerSource
- Docker Compose
- App-Abhängigkeiten
- Server-Abhängigkeiten
- Server-TypeScript-Config
- Root-Workspace
- Server-Dev-Abhängigkeiten
- Server-Skripte
- Sammlung, Score & Achievements
- App-Dev-Abhängigkeiten
- API-Vertrag Paket
- Tab-Navigation
- Pokemon-Price-Tracker-Client
- Katalog-Routen & Markt
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- API-Vertrag & App-Client
- Build-Config
- App-Skripte
- Lasttest
- AppText
- Tab-Leiste & Master-Set
- Sammlung & Markt (App)
- Paket: expo-device
- Diagramme & Holo
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Portfolio & Kartendetail (App)
- Paket: expo-linking
- Profil & Listen (App)
- Paket: expo-splash-screen
- Achievements
- Konfiguration, Datenbank & Last-Daten
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-reanimated
- Paket: react-native-safe-area-context
- Scan-Routen & Fehler
- SetScreen
- Tages-Export & Abgleich-CLI
- CSS-Typen
- API-Probe
- Paket: expo
- Demo-Motive
- PgBouncer (offen)
- Ungetestet auf Geräten
- Abgleich & Speichern
- Paket: expo-glass-effect
- Tab-Leiste & Scan-Icon
- Paket: react-dom
- Paket: expo-camera
- Paket: expo-image
- Paket: expo-secure-store
- Paket: expo-status-bar
- Paket: @value/api-types
- Paket: react-native-web
- Paket: @tanstack/react-query
- Paket: tesseract.js
- Paket: zod

## God Nodes (most connected - your core abstractions)
1. `usePalette()` - 54 edges
2. `AppText()` - 48 edges
3. `KarteScreen()` - 32 edges
4. `react-native` - 27 edges
5. `HoloFill()` - 25 edges
6. `PortfolioScreen()` - 22 edges
7. `ProfilScreen()` - 22 edges
8. `Db` - 20 edges
9. `react` - 20 edges
10. `SetScreen()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `runPopulationSync()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/sync/population.ts
- `Dollar ↔ Euro per Tipp (EZB-Kurs)` --implements--> `Price()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/currency.tsx
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts
- `Credit-Budget je Lauf` --references--> `CreditUsage`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (70 total, 28 thin omitted)

### Community 0 - "Designsystem & Bausteine"
Cohesion: 0.11
Nodes (25): CardTile, shortNumber(), styles, RowProps, styles, ACHIEVEMENT_SYMBOLS, ButtonProps, IconButton() (+17 more)

### Community 1 - "API-Server & Endpunkte"
Cohesion: 0.15
Nodes (16): Db, DbClient, createExchangeRates(), ECB_DAILY_URL, ExchangeRates, parseEcbUsdRate(), AppOptions, buildApp() (+8 more)

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.06
Nodes (40): computeMissingFingerprints(), CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate (+32 more)

### Community 4 - "Scanner, Währung & Darstellung (App)"
Cohesion: 0.06
Nodes (43): queryClient, useConfirmScan(), useExchangeRate(), useScanCard(), RootLayout(), Themed(), messageFor(), Phase (+35 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Pokemon-Price-Tracker-Anbindung"
Cohesion: 0.15
Nodes (25): normalizeElement(), asIsoDate(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS, isObject() (+17 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "PokemonPriceTrackerSource"
Cohesion: 0.29
Nodes (3): PokemonPriceTrackerSource, CreditUsage, SourceError

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "App-Abhängigkeiten"
Cohesion: 0.13
Nodes (15): dependencies, expo-constants@~58.0.16, expo-font@~58.0.12, expo-image-picker@~58.0.10, expo-router@~58.0.31, expo-symbols@~58.0.5, react@19.3.0, react-native@0.88.1 (+7 more)

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

### Community 16 - "Sammlung, Score & Achievements"
Cohesion: 0.17
Nodes (17): evaluateAchievements(), rankForLevel(), ALIASES, ELEMENTS, isElement(), cardXp(), RARITY_TIERS, rarityTier() (+9 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.16
Nodes (13): expo-system-ui@~58.0.7, react-native-svg@15.16.0, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Pokemon-Price-Tracker-Client"
Cohesion: 0.15
Nodes (8): PriceSource, runPopulationSync(), upsertGrades(), resetData(), db, listCardsInSet(), options, sets

### Community 21 - "Katalog-Routen & Markt"
Cohesion: 0.12
Nodes (21): Props, Props, Props, CatalogVersion, byGradeDesc(), CardRow, registerCatalogRoutes(), computeMovers() (+13 more)

### Community 22 - "Produktvision & Features"
Cohesion: 0.25
Nodes (8): Achievements & Profil-Schmuck (geplant), Anmeldung, Abo & Einmalkauf (geplant), Euro-Preise Cardmarket / Graded / Population (geplant), Master-Set-Ansicht, Pokemon Price Tracker (Datenanbieter), Restkosten fehlender Karten, Sammelscore & Vintage-Score (XP), valUE (Sammel-App)

### Community 23 - "API-Types-TS-Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, include

### Community 24 - "App-TS-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/assets/*, expo/tsconfig.base

### Community 25 - "API-Vertrag & App-Client"
Cohesion: 0.08
Nodes (39): API_URL, ApiRequestError, request(), RequestOptions, keys, SetQuantityInput, useCard(), useMovers() (+31 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "AppText"
Cohesion: 0.21
Nodes (22): GradeBlock(), KarteScreen(), AppText(), CardRow(), styles, Price(), useMoney(), isShiny() (+14 more)

### Community 30 - "Tab-Leiste & Master-Set"
Cohesion: 0.10
Nodes (26): Filter, FILTERS, styles, AppTabs(), Bar(), Narrow, ScanButton(), styles (+18 more)

### Community 31 - "Sammlung & Markt (App)"
Cohesion: 0.15
Nodes (22): useCollectionProgress(), useFavorites(), Direction, DIRECTIONS, MarktScreen(), PERIODS, styles, useDebounced() (+14 more)

### Community 33 - "Diagramme & Holo"
Cohesion: 0.21
Nodes (21): GuideOverlay(), AreaChart(), ChartProps, Ring(), RingProps, smoothPath(), Sparkline(), styles (+13 more)

### Community 36 - "Portfolio & Kartendetail (App)"
Cohesion: 0.22
Nodes (15): usePortfolio(), useProfile(), Mode, StepButton(), styles, PortfolioScreen(), RANGES, Stat() (+7 more)

### Community 38 - "Profil & Listen (App)"
Cohesion: 0.30
Nodes (14): useUpdateProfile(), APPEARANCE, levelProgress(), ProfilScreen(), styles, Row(), Section(), ProgressBar() (+6 more)

### Community 40 - "Achievements"
Cohesion: 0.28
Nodes (7): ACHIEVEMENTS, CollectionStats, Definition, TIERS, Achievement, AchievementTier, Element

### Community 41 - "Konfiguration, Datenbank & Last-Daten"
Cohesion: 0.09
Nodes (23): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+15 more)

### Community 47 - "Scan-Routen & Fehler"
Cohesion: 0.14
Nodes (20): withTransaction(), Authenticator, createAnonymousUser(), createAuthenticator(), hashToken(), badRequest(), HttpError, notFound() (+12 more)

### Community 48 - "SetScreen"
Cohesion: 0.36
Nodes (8): invalidateCollection(), useOwnedInSet(), useRemoveCard(), useSetQuantity(), useToggleFavorite(), authedRequest(), SetScreen(), Chip()

### Community 49 - "Tages-Export & Abgleich-CLI"
Cohesion: 0.18
Nodes (10): asIsoTimestamp(), slugify(), csvRecords(), ExportPrintingRow, exportPrintingRows(), openExport(), parseCsvLine(), config (+2 more)

### Community 51 - "API-Probe"
Cohesion: 0.25
Nodes (8): config, firstRow(), keysOf(), rawSet, report(), set, source, Feldzuordnung PPT ungeprüft (ppt:probe)

### Community 53 - "Demo-Motive"
Cohesion: 0.38
Nodes (6): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random()

### Community 57 - "Abgleich & Speichern"
Cohesion: 0.17
Nodes (24): demoCards(), demoGrades(), demoSets, ELEMENT_CYCLE, RARITIES, seedDemo(), SourceCard, SourceGrade (+16 more)

## Knowledge Gaps
- **14 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `Rate-Limit-Zähler in Redis (offen)`, `Scan-Benchmark mit simulierten Fotos`, `Gelerntes Bildmodell (CLIP) – nächster Schritt` (+9 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `API-Server & Endpunkte` to `Scan-Erkennung (Server)`, `Server-Abhängigkeiten`, `Server-Dev-Abhängigkeiten`, `Scan-Routen & Fehler`, `Sammlung, Score & Achievements`, `Katalog-Routen & Markt`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `Rate-Limit-Zähler in Redis (offen)` to the rest of the system?**
  _14 weakly-connected nodes found - possible missing edges._
- **Should `Designsystem & Bausteine` be split into smaller, more focused modules?**
  _Cohesion score 0.11491935483870967 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `Tab-Leiste & Master-Set` to `Designsystem & Bausteine`, `Diagramme & Holo`, `Portfolio & Kartendetail (App)`, `Scanner, Währung & Darstellung (App)`, `Profil & Listen (App)`, `App-Abhängigkeiten`, `App-Dev-Abhängigkeiten`, `API-Vertrag & App-Client`, `AppText`, `Sammlung & Markt (App)`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Scan-Erkennung (Server)` be split into smaller, more focused modules?**
  _Cohesion score 0.062146892655367235 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `API-Server & Endpunkte` to `Scan-Erkennung (Server)`, `Konfiguration, Datenbank & Last-Daten`, `Scan-Routen & Fehler`, `Sammlung, Score & Achievements`, `Pokemon-Price-Tracker-Client`, `Katalog-Routen & Markt`, `Abgleich & Speichern`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Scanner, Währung & Darstellung (App)` be split into smaller, more focused modules?**
  _Cohesion score 0.06485671191553545 - nodes in this community are weakly interconnected._