# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1037 nodes · 2650 edges · 71 communities (43 shown, 28 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0465dfa0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (portfolio)/index.tsx
- Server-App und Wechselkurs
- identify.ts
- portfolio.ts
- Hell- und Dunkelmodus
- Expo-App-Konfiguration
- Preisquelle PPT
- CI-Pipeline
- index.ts
- Docker Compose
- dependencies
- Server-Abhängigkeiten
- Server-TypeScript-Config
- Root-Workspace
- Server-Dev-Abhängigkeiten
- Server-Skripte
- TCGdex-Katalog
- App-Dev-Abhängigkeiten
- API-Vertrag Paket
- Tab-Navigation
- Abgleich-Tests
- Karten- und Set-Ansicht
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- queries.ts
- Build-Config
- App-Skripte
- Lasttest
- Ergebnisblatt und Karten
- Docker-Compose (NAS)
- Paket: expo-font
- Paket: expo-device
- Scanner-Oberfläche
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Kamera und Zuschnitt
- Konfiguration und Abgleich-CLI
- Paket: expo-splash-screen
- Achievements
- sync.ts
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-screens
- react-native-reanimated@4.7.1
- collection.ts
- Paket: react-native-worklets
- react-native-svg
- CSS-Typen
- NAS-Update & Tailscale
- Paket: expo
- bumpCatalogVersion
- PgBouncer (offen)
- Ungetestet auf Geräten
- expo-linking@~58.0.17
- Paket: expo-glass-effect
- @value/api-types@*
- Paket: react-dom
- usePalette
- Design-Bausteine
- react-native-safe-area-context
- Fingerabdrücke
- Systemkamera im Browser
- Web-Tab-Leiste
- Tab-Layout
- Japanische Sprachdaten
- Englische Sprachdaten
- API-Typen-Paket

## God Nodes (most connected - your core abstractions)
1. `usePalette()` - 54 edges
2. `AppText()` - 47 edges
3. `KarteScreen()` - 31 edges
4. `react-native` - 27 edges
5. `HoloFill()` - 25 edges
6. `ProfilScreen()` - 22 edges
7. `Db` - 21 edges
8. `PortfolioScreen()` - 21 edges
9. `react` - 20 edges
10. `runCatalogSync()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Dollar ↔ Euro per Tipp (EZB-Kurs)` --implements--> `Price()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/currency.tsx
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `normalizeElement()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/domain/elements.ts
- `PPT-Preise über TCGdex-ID zugeordnet` --implements--> `applyPrices()`  [EXTRACTED]
  docs/SCANNER.md → apps/server/src/sync/store.ts
- `Credit-Budget je Lauf` --references--> `CreditUsage`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (71 total, 28 thin omitted)

### Community 0 - "(portfolio)/index.tsx"
Cohesion: 0.14
Nodes (32): useCollectionProgress(), usePortfolio(), Direction, DIRECTIONS, MarktScreen(), PERIODS, styles, useDebounced() (+24 more)

### Community 1 - "Server-App und Wechselkurs"
Cohesion: 0.08
Nodes (24): Db, DbClient, withTransaction(), createExchangeRates(), ECB_DAILY_URL, ExchangeRates, parseEcbUsdRate(), AppOptions (+16 more)

### Community 2 - "identify.ts"
Cohesion: 0.06
Nodes (53): CandidateDetails, CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate (+45 more)

### Community 3 - "portfolio.ts"
Cohesion: 0.14
Nodes (17): byGradeDesc(), CARD_COLUMNS, registerCatalogRoutes(), computeMovers(), toCard(), toPrice(), toSet(), isRange() (+9 more)

### Community 4 - "Hell- und Dunkelmodus"
Cohesion: 0.12
Nodes (24): queryClient, useExchangeRate(), RootLayout(), Themed(), AppTextProps, CurrencyContext, CurrencyProvider(), CurrencyState (+16 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Preisquelle PPT"
Cohesion: 0.08
Nodes (41): asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS, isObject() (+33 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "index.ts"
Cohesion: 0.12
Nodes (25): Props, Props, Props, CardRow, SetRow, CardDetailResponse, CardGrade, CardPrinting (+17 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, expo-camera@~58.0.14, expo-constants@~58.0.16, expo-image@~58.0.18, expo-router@~58.0.31, expo-secure-store@~58.0.3, expo-status-bar@~58.0.5, expo-symbols@~58.0.5 (+8 more)

### Community 11 - "Server-Abhängigkeiten"
Cohesion: 0.12
Nodes (16): dependencies, fastify@^5.0.0, @fastify/compress@^8.0.0, @fastify/cors@^11.0.0, @fastify/rate-limit@^10.0.0, pg@^8.13.0, sharp@^0.35.5, tesseract.js@^7.0.0 (+8 more)

### Community 12 - "Server-TypeScript-Config"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noUncheckedIndexedAccess, outDir (+7 more)

### Community 13 - "Root-Workspace"
Cohesion: 0.13
Nodes (14): engines, node, name, private, scripts, db:migrate, db:up, dev:app (+6 more)

### Community 14 - "Server-Dev-Abhängigkeiten"
Cohesion: 0.15
Nodes (15): devDependencies, tsx@^4.19.0, @types/node@^22.0.0, @types/pg@^8.11.0, typescript@~6.0.3, vitest@^3.0.0, typescript, name (+7 more)

### Community 15 - "Server-Skripte"
Cohesion: 0.13
Nodes (15): scripts, build, catalog, dev, fingerprints, loadtest, migrate, ppt:probe (+7 more)

### Community 16 - "TCGdex-Katalog"
Cohesion: 0.12
Nodes (27): normalizeElement(), cardImageUrl(), cardText(), CATALOG_LANGUAGES, catalogId(), CatalogLanguage, isDigitalOnly(), LANGUAGE_NAMES (+19 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.16
Nodes (13): expo-system-ui@~58.0.7, react-native-web@~0.21.4, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Abgleich-Tests"
Cohesion: 0.12
Nodes (12): SourceCard, SourceError, SourceSet, createTcgdexClient(), db, fakeTcgdex(), fixture, resetData() (+4 more)

### Community 21 - "Karten- und Set-Ansicht"
Cohesion: 0.14
Nodes (27): invalidateCollection(), useCard(), useFavorites(), useOwnedInSet(), useRemoveCard(), useSetQuantity(), useToggleFavorite(), authedRequest() (+19 more)

### Community 22 - "Produktvision & Features"
Cohesion: 0.25
Nodes (8): Achievements & Profil-Schmuck (geplant), Anmeldung, Abo & Einmalkauf (geplant), Euro-Preise Cardmarket / Graded / Population (geplant), Master-Set-Ansicht, Pokemon Price Tracker (Datenanbieter), Restkosten fehlender Karten, Sammelscore & Vintage-Score (XP), valUE (Sammel-App)

### Community 23 - "API-Types-TS-Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, include

### Community 24 - "App-TS-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/assets/*, expo/tsconfig.base

### Community 25 - "queries.ts"
Cohesion: 0.11
Nodes (21): API_URL, ApiRequestError, request(), RequestOptions, keys, SetQuantityInput, useMovers(), useSearch() (+13 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "Ergebnisblatt und Karten"
Cohesion: 0.17
Nodes (22): AppText(), styles, CardTile, shortNumber(), styles, isShiny(), rarityTier(), Chip() (+14 more)

### Community 30 - "Docker-Compose (NAS)"
Cohesion: 0.05
Nodes (46): build, depends_on, environment, restart, context, dockerfile, build, command (+38 more)

### Community 33 - "Scanner-Oberfläche"
Cohesion: 0.20
Nodes (22): GuideOverlay(), AreaChart(), ChartProps, Ring(), RingProps, smoothPath(), Sparkline(), styles (+14 more)

### Community 37 - "Kamera und Zuschnitt"
Cohesion: 0.14
Nodes (20): useConfirmScan(), useScanCard(), LIVE_CAMERA, messageFor(), Phase, RoundButton(), ScanScreen(), styles (+12 more)

### Community 38 - "Konfiguration und Abgleich-CLI"
Cohesion: 0.08
Nodes (25): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+17 more)

### Community 40 - "Achievements"
Cohesion: 0.20
Nodes (9): ACHIEVEMENTS, CollectionStats, Definition, TIERS, ALIASES, ELEMENTS, Achievement, AchievementTier (+1 more)

### Community 41 - "sync.ts"
Cohesion: 0.11
Nodes (33): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random(), demoCards(), demoGrades() (+25 more)

### Community 47 - "collection.ts"
Cohesion: 0.14
Nodes (23): evaluateAchievements(), rankForLevel(), isElement(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack(), VINTAGE_BEFORE (+15 more)

### Community 51 - "NAS-Update & Tailscale"
Cohesion: 0.24
Nodes (9): compose(), git_(), log(), PATH, update.sh script, Einrichten und aktualisieren, Katalog und Preise, valUE auf der Synology (Docker) und über Tailscale (+1 more)

### Community 53 - "bumpCatalogVersion"
Cohesion: 0.31
Nodes (5): PriceSource, runPopulationSync(), bumpCatalogVersion(), upsertGrades(), Grading-Preise, Population & Elemente aus der Quelle

### Community 61 - "usePalette"
Cohesion: 0.21
Nodes (18): useProfile(), useUpdateProfile(), APPEARANCE, levelProgress(), ProfilScreen(), styles, SetCard(), Row() (+10 more)

### Community 63 - "Design-Bausteine"
Cohesion: 0.10
Nodes (27): RowProps, styles, MessageProps, styles, ACHIEVEMENT_SYMBOLS, ButtonProps, SecondaryButton(), styles (+19 more)

### Community 66 - "Fingerabdrücke"
Cohesion: 0.24
Nodes (7): computeMissingFingerprints(), quantize(), fingerprintImageUrl(), Katalogversion, Tabelle sync_runs, Gelerntes Bildmodell (CLIP) – nächster Schritt, Bild-Fingerabdruck (Farbraster + Kanten)

### Community 70 - "Web-Tab-Leiste"
Cohesion: 0.25
Nodes (9): AppTabs(), Bar(), Narrow, ScanButton(), styles, TabButton(), useNarrow(), WebSymbol (+1 more)

## Knowledge Gaps
- **13 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `PATH`, `Rate-Limit-Zähler in Redis (offen)`, `Portfolio-Verlauf per LATERAL-Indexzugriff` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 348 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react-native` connect `Design-Bausteine` to `(portfolio)/index.tsx`, `Scanner-Oberfläche`, `Hell- und Dunkelmodus`, `Kamera und Zuschnitt`, `Web-Tab-Leiste`, `dependencies`, `App-Dev-Abhängigkeiten`, `Ergebnisblatt und Karten`, `Karten- und Set-Ansicht`, `queries.ts`, `usePalette`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `PATH` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `(portfolio)/index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Why does `fastify` connect `Server-App und Wechselkurs` to `identify.ts`, `portfolio.ts`, `index.ts`, `Server-Abhängigkeiten`, `Server-Dev-Abhängigkeiten`, `collection.ts`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Server-App und Wechselkurs` be split into smaller, more focused modules?**
  _Cohesion score 0.08383838383838384 - nodes in this community are weakly interconnected._
- **Why does `VisualIndex` connect `Server-App und Wechselkurs` to `identify.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `identify.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0567287784679089 - nodes in this community are weakly interconnected._