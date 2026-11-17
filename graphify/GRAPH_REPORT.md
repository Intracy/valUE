# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 893 nodes · 2342 edges · 60 communities (37 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dea756c9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App-Bildschirme & Designsystem
- Wechselkurs (EZB)
- Scan-Erkennung (Server)
- Fingerabdrücke & Benchmark
- Währung & Darstellung (App)
- Expo-App-Konfiguration
- Pokemon-Price-Tracker-Anbindung
- CI-Pipeline
- Karten-Typen im Vertrag
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
- Visueller Index & Scan-Routen
- Apple-Richtlinien & Tab-Leiste
- Paket: expo-font
- Paket: expo-device
- Scanner & Diagramme (App)
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Paket: expo-linking
- Paket: expo-system-ui
- Paket: expo-splash-screen
- Achievements
- Konfiguration, Datenbank & Last-Daten
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-screens
- Paket: react-native-safe-area-context
- Scan-Routen & Fehler
- Paket: react-native-worklets
- CSS-Typen
- Paket: expo
- Demo-Motive
- PgBouncer (offen)
- Ungetestet auf Geräten
- Abgleich & Speichern
- Paket: expo-glass-effect
- Paket: react-dom
- Paket: expo-camera
- Paket: react-native-web

## God Nodes (most connected - your core abstractions)
1. `usePalette()` - 54 edges
2. `AppText()` - 47 edges
3. `KarteScreen()` - 31 edges
4. `react-native` - 27 edges
5. `HoloFill()` - 25 edges
6. `ProfilScreen()` - 22 edges
7. `PortfolioScreen()` - 21 edges
8. `Db` - 20 edges
9. `react` - 20 edges
10. `SetScreen()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Dollar ↔ Euro per Tipp (EZB-Kurs)` --implements--> `Price()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/currency.tsx
- `Darstellung Dunkel/Hell/System` --implements--> `AppearanceProvider()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/theme/appearance.tsx
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `runPopulationSync()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/sync/population.ts
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (60 total, 23 thin omitted)

### Community 0 - "App-Bildschirme & Designsystem"
Cohesion: 0.06
Nodes (130): useCollectionProgress(), useFavorites(), useOwnedInSet(), usePortfolio(), useProfile(), useRemoveCard(), useSetQuantity(), useToggleFavorite() (+122 more)

### Community 1 - "Wechselkurs (EZB)"
Cohesion: 0.28
Nodes (7): createExchangeRates(), ECB_DAILY_URL, ExchangeRates, parseEcbUsdRate(), AppOptions, Dollar ↔ Euro per Tipp (EZB-Kurs), ExchangeRateResponse

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.11
Nodes (22): CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate, SCORING (+14 more)

### Community 3 - "Fingerabdrücke & Benchmark"
Cohesion: 0.16
Nodes (17): computeMissingFingerprints(), fingerprint(), FINGERPRINT_DIM, loadImage(), normalize(), quantize(), db, difficulty (+9 more)

### Community 4 - "Währung & Darstellung (App)"
Cohesion: 0.11
Nodes (25): queryClient, useExchangeRate(), RootLayout(), Themed(), AppTextProps, Props, CurrencyContext, CurrencyProvider() (+17 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Pokemon-Price-Tracker-Anbindung"
Cohesion: 0.07
Nodes (46): ALIASES, ELEMENTS, normalizeElement(), asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike (+38 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Karten-Typen im Vertrag"
Cohesion: 0.16
Nodes (17): Props, Props, RANGE_DAYS, CardPrinting, CardSummary, Currency, FavoriteCard, FavoriteResponse (+9 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "App-Abhängigkeiten"
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
Cohesion: 0.14
Nodes (14): scripts, build, dev, fingerprints, loadtest, migrate, ppt:probe, scan:benchmark (+6 more)

### Community 16 - "Sammlung, Score & Achievements"
Cohesion: 0.16
Nodes (17): rankForLevel(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack(), VINTAGE_BEFORE, XP_BY_TIER, registerCollectionRoutes() (+9 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.16
Nodes (13): expo-constants@~58.0.16, expo-status-bar@~58.0.5, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Pokemon-Price-Tracker-Client"
Cohesion: 0.13
Nodes (7): SourceError, resetData(), db, db, options, sets, vitest

### Community 21 - "Katalog-Routen & Markt"
Cohesion: 0.16
Nodes (16): Db, isElement(), CatalogVersion, byGradeDesc(), CARD_COLUMNS, CardRow, registerCatalogRoutes(), computeMovers() (+8 more)

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
Cohesion: 0.11
Nodes (22): API_URL, ApiRequestError, request(), RequestOptions, keys, SetQuantityInput, useCard(), useMovers() (+14 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "Visueller Index & Scan-Routen"
Cohesion: 0.18
Nodes (4): Authenticator, ScanDeps, OcrEngine, VisualIndex

### Community 30 - "Apple-Richtlinien & Tab-Leiste"
Cohesion: 0.14
Nodes (11): TabsLayout(), AppTabs(), ScanOutcome, Darstellung Dunkel/Hell/System, Leere Zustände & Fehler erklären, Apple Human Interface Guidelines, Tippflächen ≥ 44×44 (MIN_TOUCH), Moodboard-Paletten Dark/Light & Dynamic Type (+3 more)

### Community 33 - "Scanner & Diagramme (App)"
Cohesion: 0.10
Nodes (36): invalidateCollection(), useConfirmScan(), useScanCard(), GuideOverlay(), messageFor(), Phase, RoundButton(), ScanScreen() (+28 more)

### Community 40 - "Achievements"
Cohesion: 0.24
Nodes (8): ACHIEVEMENTS, CollectionStats, Definition, evaluateAchievements(), TIERS, Achievement, AchievementTier, Element

### Community 41 - "Konfiguration, Datenbank & Last-Daten"
Cohesion: 0.08
Nodes (28): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+20 more)

### Community 47 - "Scan-Routen & Fehler"
Cohesion: 0.14
Nodes (21): withTransaction(), buildApp(), createAnonymousUser(), createAuthenticator(), hashToken(), createCatalogVersion(), badRequest(), HttpError (+13 more)

### Community 53 - "Demo-Motive"
Cohesion: 0.38
Nodes (6): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random()

### Community 57 - "Abgleich & Speichern"
Cohesion: 0.14
Nodes (27): demoCards(), demoGrades(), demoSets, ELEMENT_CYCLE, RARITIES, seedDemo(), PriceSource, SourceCard (+19 more)

## Knowledge Gaps
- **14 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `Scan-Benchmark mit simulierten Fotos`, `Texterkennung Tesseract (Name & Nummer)`, `Erkennung auf dem Gerät (Apple Vision / ML Kit)` (+9 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 297 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `Scan-Routen & Fehler` to `Scan-Erkennung (Server)`, `Karten-Typen im Vertrag`, `Server-Abhängigkeiten`, `Sammlung, Score & Achievements`, `Pokemon-Price-Tracker-Client`, `Katalog-Routen & Markt`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `Scan-Benchmark mit simulierten Fotos` to the rest of the system?**
  _14 weakly-connected nodes found - possible missing edges._
- **Should `App-Bildschirme & Designsystem` be split into smaller, more focused modules?**
  _Cohesion score 0.056639944231439525 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `App-Bildschirme & Designsystem` to `Scanner & Diagramme (App)`, `Währung & Darstellung (App)`, `App-Abhängigkeiten`, `App-Dev-Abhängigkeiten`, `API-Vertrag & App-Client`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Scan-Erkennung (Server)` be split into smaller, more focused modules?**
  _Cohesion score 0.10574712643678161 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `Katalog-Routen & Markt` to `Wechselkurs (EZB)`, `Scan-Erkennung (Server)`, `Fingerabdrücke & Benchmark`, `Karten-Typen im Vertrag`, `Konfiguration, Datenbank & Last-Daten`, `Scan-Routen & Fehler`, `Sammlung, Score & Achievements`, `Abgleich & Speichern`, `Visueller Index & Scan-Routen`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Should `Währung & Darstellung (App)` be split into smaller, more focused modules?**
  _Cohesion score 0.11375661375661375 - nodes in this community are weakly interconnected._