# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1026 nodes · 2619 edges · 69 communities (44 shown, 25 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3f6ec9fe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Ergebnisblatt und Karten
- Server-App und Wechselkurs
- real-scan-benchmark.ts
- portfolio.ts
- Hell- und Dunkelmodus
- Expo-App-Konfiguration
- Preisquelle PPT
- CI-Pipeline
- Karten-Datentypen
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
- Preisquelle PPT
- [setId].tsx
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- App-Abfragen
- Build-Config
- App-Skripte
- Lasttest
- probe.ts
- Docker-Compose (NAS)
- Paket: expo-font
- Paket: expo-device
- Scanner-Oberfläche
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Kamera und Zuschnitt
- Konfiguration und Datenbank
- Paket: expo-splash-screen
- Achievements
- demo-art.ts
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-screens
- registerCatalogRoutes
- scan.ts
- Paket: react-native-worklets
- expo-camera
- CSS-Typen
- NAS-Update & Tailscale
- Paket: expo
- sync.ts
- PgBouncer (offen)
- Ungetestet auf Geräten
- expo-linking@~58.0.17
- Paket: expo-glass-effect
- Katalog-Tests
- Paket: react-dom
- Haupt-Screens
- expo-system-ui@~58.0.7
- Design-Bausteine
- react-native-safe-area-context
- API-Typen Sammlung
- Systemkamera im Browser
- Web-Darstellung
- Englische Sprachdaten

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
10. `SetScreen()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `runPopulationSync()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/sync/population.ts
- `PPT-Preise über TCGdex-ID zugeordnet` --implements--> `applyPrices()`  [EXTRACTED]
  docs/SCANNER.md → apps/server/src/sync/store.ts
- `Dollar ↔ Euro per Tipp (EZB-Kurs)` --implements--> `Price()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/currency.tsx
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (69 total, 25 thin omitted)

### Community 0 - "Ergebnisblatt und Karten"
Cohesion: 0.10
Nodes (34): AppTextProps, CardRow(), Props, styles, CardTile, shortNumber(), styles, CurrencyContext (+26 more)

### Community 1 - "Server-App und Wechselkurs"
Cohesion: 0.13
Nodes (17): Db, createExchangeRates(), ECB_DAILY_URL, ExchangeRates, parseEcbUsdRate(), AppOptions, buildApp(), CatalogVersion (+9 more)

### Community 2 - "real-scan-benchmark.ts"
Cohesion: 0.05
Nodes (49): CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate, SCORING (+41 more)

### Community 3 - "portfolio.ts"
Cohesion: 0.20
Nodes (11): CARD_COLUMNS, isRange(), RANGE_DAYS, registerPortfolioRoutes(), round2(), Portfolio-Verlauf per LATERAL-Indexzugriff, Currency, FavoriteResponse (+3 more)

### Community 4 - "Hell- und Dunkelmodus"
Cohesion: 0.08
Nodes (26): queryClient, useExchangeRate(), RootLayout(), Themed(), TabsLayout(), AppTabs(), CurrencyProvider(), load() (+18 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Preisquelle PPT"
Cohesion: 0.12
Nodes (31): asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS, isObject() (+23 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Karten-Datentypen"
Cohesion: 0.14
Nodes (22): Props, Props, CardRow, SetRow, Schnittstelle /v1, CardDetailResponse, CardGrade, CardPrinting (+14 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, expo-image@~58.0.18, expo-router@~58.0.31, expo-secure-store@~58.0.3, expo-symbols@~58.0.5, react@19.3.0, react-native@0.88.1, react-native-reanimated@4.7.1 (+7 more)

### Community 11 - "Server-Abhängigkeiten"
Cohesion: 0.11
Nodes (24): dependencies, fastify@^5.0.0, @fastify/compress@^8.0.0, @fastify/cors@^11.0.0, @fastify/rate-limit@^10.0.0, pg@^8.13.0, sharp@^0.35.5, tesseract.js@^7.0.0 (+16 more)

### Community 12 - "Server-TypeScript-Config"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noUncheckedIndexedAccess, outDir (+7 more)

### Community 13 - "Root-Workspace"
Cohesion: 0.13
Nodes (14): engines, node, name, private, scripts, db:migrate, db:up, dev:app (+6 more)

### Community 14 - "Server-Dev-Abhängigkeiten"
Cohesion: 0.20
Nodes (10): devDependencies, tsx@^4.19.0, @types/node@^22.0.0, @types/pg@^8.11.0, typescript@~6.0.3, vitest@^3.0.0, typescript, tsx (+2 more)

### Community 15 - "Server-Skripte"
Cohesion: 0.13
Nodes (15): scripts, build, catalog, dev, fingerprints, loadtest, migrate, ppt:probe (+7 more)

### Community 16 - "TCGdex-Katalog"
Cohesion: 0.10
Nodes (29): ALIASES, ELEMENTS, normalizeElement(), cardImageUrl(), CATALOG_LANGUAGES, catalogId(), CatalogLanguage, LANGUAGE_NAMES (+21 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.16
Nodes (13): expo-constants@~58.0.16, expo-status-bar@~58.0.5, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Preisquelle PPT"
Cohesion: 0.14
Nodes (7): PokemonPriceTrackerSource, CreditUsage, SourceError, db, listCardsInSet(), options, sets

### Community 21 - "[setId].tsx"
Cohesion: 0.12
Nodes (25): useFavorites(), Direction, DIRECTIONS, PERIODS, styles, useDebounced(), styles, View_ (+17 more)

### Community 22 - "Produktvision & Features"
Cohesion: 0.25
Nodes (8): Achievements & Profil-Schmuck (geplant), Anmeldung, Abo & Einmalkauf (geplant), Euro-Preise Cardmarket / Graded / Population (geplant), Master-Set-Ansicht, Pokemon Price Tracker (Datenanbieter), Restkosten fehlender Karten, Sammelscore & Vintage-Score (XP), valUE (Sammel-App)

### Community 23 - "API-Types-TS-Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, include

### Community 24 - "App-TS-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/assets/*, expo/tsconfig.base

### Community 25 - "App-Abfragen"
Cohesion: 0.13
Nodes (24): API_URL, ApiRequestError, request(), RequestOptions, invalidateCollection(), keys, SetQuantityInput, useCard() (+16 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "probe.ts"
Cohesion: 0.25
Nodes (8): config, firstRow(), keysOf(), rawSet, report(), set, source, Feldzuordnung PPT ungeprüft (ppt:probe)

### Community 30 - "Docker-Compose (NAS)"
Cohesion: 0.05
Nodes (46): build, depends_on, environment, restart, context, dockerfile, build, command (+38 more)

### Community 33 - "Scanner-Oberfläche"
Cohesion: 0.14
Nodes (30): GuideOverlay(), AppTabs(), Bar(), Narrow, ScanButton(), styles, TabButton(), useNarrow() (+22 more)

### Community 37 - "Kamera und Zuschnitt"
Cohesion: 0.17
Nodes (18): useScanCard(), LIVE_CAMERA, messageFor(), Phase, RoundButton(), ScanScreen(), styles, TAB_BAR (+10 more)

### Community 38 - "Konfiguration und Datenbank"
Cohesion: 0.07
Nodes (32): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+24 more)

### Community 40 - "Achievements"
Cohesion: 0.24
Nodes (8): ACHIEVEMENTS, CollectionStats, Definition, evaluateAchievements(), TIERS, Achievement, AchievementTier, Element

### Community 41 - "demo-art.ts"
Cohesion: 0.38
Nodes (6): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random()

### Community 46 - "registerCatalogRoutes"
Cohesion: 0.47
Nodes (6): byGradeDesc(), registerCatalogRoutes(), computeMovers(), toCard(), toPrice(), toSet()

### Community 47 - "scan.ts"
Cohesion: 0.16
Nodes (15): withTransaction(), Authenticator, createAnonymousUser(), createAuthenticator(), hashToken(), badRequest(), HttpError, notFound() (+7 more)

### Community 51 - "NAS-Update & Tailscale"
Cohesion: 0.24
Nodes (9): compose(), git_(), log(), PATH, update.sh script, Einrichten und aktualisieren, Katalog und Preise, valUE auf der Synology (Docker) und über Tailscale (+1 more)

### Community 53 - "sync.ts"
Cohesion: 0.13
Nodes (30): demoCards(), demoGrades(), demoSets, ELEMENT_CYCLE, RARITIES, seedDemo(), PriceSource, SourceCard (+22 more)

### Community 59 - "Katalog-Tests"
Cohesion: 0.22
Nodes (6): createTcgdexClient(), db, fakeTcgdex(), fixture, resetData(), vitest

### Community 61 - "Haupt-Screens"
Cohesion: 0.18
Nodes (37): useOwnedInSet(), useProfile(), GradeBlock(), KarteScreen(), StepButton(), MarktScreen(), PortfolioScreen(), RANGES (+29 more)

### Community 63 - "Design-Bausteine"
Cohesion: 0.12
Nodes (26): Mode, styles, RowProps, styles, ACHIEVEMENT_SYMBOLS, ButtonProps, ChangePill(), IconButton() (+18 more)

### Community 65 - "API-Typen Sammlung"
Cohesion: 0.13
Nodes (21): rankForLevel(), isElement(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack(), VINTAGE_BEFORE, XP_BY_TIER (+13 more)

## Knowledge Gaps
- **13 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `PATH`, `Rate-Limit-Zähler in Redis (offen)`, `Erkennung auf dem Gerät (Apple Vision / ML Kit)` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 346 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `App-Dev-Abhängigkeiten`, `Paket: expo-font`, `Paket: expo-device`, `Paket: expo-haptics`, `Paket: expo-image-manipulator`, `Paket: expo-image-picker`, `Paket: expo-splash-screen`, `Paket: @expo/ui`, `Paket: expo-web-browser`, `Paket: react-native-gesture-handler`, `Paket: react-native-screens`, `Paket: react-native-worklets`, `expo-camera`, `Paket: expo`, `expo-linking@~58.0.17`, `Paket: expo-glass-effect`, `Paket: react-dom`, `expo-system-ui@~58.0.7`, `react-native-safe-area-context`, `Web-Darstellung`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `PATH` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Ergebnisblatt und Karten` be split into smaller, more focused modules?**
  _Cohesion score 0.10365853658536585 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `[setId].tsx` to `Ergebnisblatt und Karten`, `Scanner-Oberfläche`, `Hell- und Dunkelmodus`, `Kamera und Zuschnitt`, `dependencies`, `App-Dev-Abhängigkeiten`, `App-Abfragen`, `Haupt-Screens`, `Design-Bausteine`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Server-App und Wechselkurs` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `Server-App und Wechselkurs` to `API-Typen Sammlung`, `real-scan-benchmark.ts`, `portfolio.ts`, `Konfiguration und Datenbank`, `Karten-Datentypen`, `scan.ts`, `TCGdex-Katalog`, `sync.ts`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `real-scan-benchmark.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05242566510172144 - nodes in this community are weakly interconnected._