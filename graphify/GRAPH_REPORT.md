# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 940 nodes · 2392 edges · 64 communities (41 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `10ec5eb1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App-Bildschirme & Designsystem
- Wechselkurs & HTTP-Tests
- Scan-Erkennung (Server)
- Fingerabdrücke & Benchmark
- Darstellung & Root-Layout
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
- Abgleich-Tests & Population
- Katalog-Routen & Markt
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- API-Vertrag & App-Client
- Build-Config
- App-Skripte
- Lasttest
- Visueller Index & Scan-Routen
- Docker-Compose (NAS)
- Paket: expo-font
- Paket: expo-device
- Scanner & Diagramme (App)
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Paket: expo-linking
- Fingerabdrücke & Datenbank
- Paket: expo-splash-screen
- Achievements
- Konfiguration & Last-Daten
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-screens
- Paket: react-native-safe-area-context
- Scan-Routen & Fehler
- Paket: react-native-worklets
- Texterkennung (OCR)
- CSS-Typen
- NAS-Update & Tailscale
- Paket: expo
- Demo-Motive
- PgBouncer (offen)
- Ungetestet auf Geräten
- Abgleich & Speichern
- Paket: expo-glass-effect
- Portfolio & Favoriten (Server)
- Paket: react-dom
- Paket: react-native-reanimated
- Paket: react-native-svg
- Paket: @value/api-types

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
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `runPopulationSync()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/sync/population.ts
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

## Communities (64 total, 23 thin omitted)

### Community 0 - "App-Bildschirme & Designsystem"
Cohesion: 0.05
Nodes (133): useFavorites(), useOwnedInSet(), useProfile(), useSetQuantity(), GradeBlock(), KarteScreen(), Mode, StepButton() (+125 more)

### Community 1 - "Wechselkurs & HTTP-Tests"
Cohesion: 0.19
Nodes (13): migrate(), createPool(), createExchangeRates(), ECB_DAILY_URL, parseEcbUsdRate(), config, db, setup() (+5 more)

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.23
Nodes (13): CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate, SCORING (+5 more)

### Community 3 - "Fingerabdrücke & Benchmark"
Cohesion: 0.15
Nodes (14): sharp@^0.35.5, fingerprint(), FINGERPRINT_DIM, loadImage(), normalize(), clipToCanvas(), PhotoOptions, rng() (+6 more)

### Community 4 - "Darstellung & Root-Layout"
Cohesion: 0.08
Nodes (25): queryClient, RootLayout(), Themed(), TabsLayout(), AppTabs(), CurrencyProvider(), load(), save() (+17 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Pokemon-Price-Tracker-Anbindung"
Cohesion: 0.07
Nodes (44): normalizeElement(), asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS (+36 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Karten-Typen im Vertrag"
Cohesion: 0.15
Nodes (15): Props, Props, CardPrinting, CardSummary, CollectionItem, DeleteCollectionItemResponse, ExchangeRateResponse, FavoriteCard (+7 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "App-Abhängigkeiten"
Cohesion: 0.12
Nodes (16): dependencies, expo-camera@~58.0.14, expo-constants@~58.0.16, expo-image@~58.0.18, expo-router@~58.0.31, expo-secure-store@~58.0.3, expo-status-bar@~58.0.5, expo-symbols@~58.0.5 (+8 more)

### Community 11 - "Server-Abhängigkeiten"
Cohesion: 0.12
Nodes (22): dependencies, fastify@^5.0.0, @fastify/compress@^8.0.0, @fastify/cors@^11.0.0, @fastify/rate-limit@^10.0.0, pg@^8.13.0, tesseract.js@^7.0.0, @tesseract.js-data/eng@^1.0.0 (+14 more)

### Community 12 - "Server-TypeScript-Config"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, noUncheckedIndexedAccess, outDir (+7 more)

### Community 13 - "Root-Workspace"
Cohesion: 0.13
Nodes (14): engines, node, name, private, scripts, db:migrate, db:up, dev:app (+6 more)

### Community 14 - "Server-Dev-Abhängigkeiten"
Cohesion: 0.15
Nodes (12): devDependencies, autocannon@^8.0.0, tsx@^4.19.0, @types/node@^22.0.0, @types/pg@^8.11.0, typescript@~6.0.3, vitest@^3.0.0, typescript (+4 more)

### Community 15 - "Server-Skripte"
Cohesion: 0.14
Nodes (14): scripts, build, dev, fingerprints, loadtest, migrate, ppt:probe, scan:benchmark (+6 more)

### Community 16 - "Sammlung, Score & Achievements"
Cohesion: 0.22
Nodes (14): evaluateAchievements(), rankForLevel(), isElement(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack(), VINTAGE_BEFORE (+6 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.16
Nodes (13): expo-system-ui@~58.0.7, react-native-web@~0.21.4, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Abgleich-Tests & Population"
Cohesion: 0.16
Nodes (7): PriceSource, runPopulationSync(), upsertGrades(), db, listCardsInSet(), options, sets

### Community 21 - "Katalog-Routen & Markt"
Cohesion: 0.14
Nodes (18): CatalogVersion, byGradeDesc(), CardRow, registerCatalogRoutes(), computeMovers(), SetRow, toCard(), toPrice() (+10 more)

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
Cohesion: 0.09
Nodes (31): API_URL, ApiRequestError, request(), RequestOptions, invalidateCollection(), keys, SetQuantityInput, useCard() (+23 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.40
Nodes (4): authed(), etag, token(), autocannon

### Community 29 - "Visueller Index & Scan-Routen"
Cohesion: 0.18
Nodes (4): Authenticator, ScanDeps, OcrEngine, VisualIndex

### Community 30 - "Docker-Compose (NAS)"
Cohesion: 0.06
Nodes (35): build, depends_on, environment, restart, context, dockerfile, condition, environment (+27 more)

### Community 33 - "Scanner & Diagramme (App)"
Cohesion: 0.11
Nodes (34): useConfirmScan(), useScanCard(), GuideOverlay(), messageFor(), Phase, RoundButton(), ScanScreen(), styles (+26 more)

### Community 38 - "Fingerabdrücke & Datenbank"
Cohesion: 0.13
Nodes (14): here, migrationsDir, Db, DbClient, computeMissingFingerprints(), config, db, quantize() (+6 more)

### Community 40 - "Achievements"
Cohesion: 0.20
Nodes (9): ACHIEVEMENTS, CollectionStats, Definition, TIERS, ALIASES, ELEMENTS, Achievement, AchievementTier (+1 more)

### Community 41 - "Konfiguration & Last-Daten"
Cohesion: 0.12
Nodes (14): Config, csv(), loadConfig(), schema, config, db, cardsPerSet, config (+6 more)

### Community 47 - "Scan-Routen & Fehler"
Cohesion: 0.18
Nodes (17): withTransaction(), ExchangeRates, AppOptions, buildApp(), createAnonymousUser(), createAuthenticator(), hashToken(), createCatalogVersion() (+9 more)

### Community 49 - "Texterkennung (OCR)"
Cohesion: 0.14
Nodes (9): createOcrPool(), createPool(), DIGIT_FIXES, langPath, OcrResult, Pool, require, Texterkennung Tesseract (Name & Nummer) (+1 more)

### Community 51 - "NAS-Update & Tailscale"
Cohesion: 0.24
Nodes (9): compose(), git_(), log(), PATH, update.sh script, Echte Daten statt Demo, Einrichten und aktualisieren, valUE auf der Synology (Docker) und über Tailscale (+1 more)

### Community 53 - "Demo-Motive"
Cohesion: 0.38
Nodes (6): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random()

### Community 57 - "Abgleich & Speichern"
Cohesion: 0.17
Nodes (24): demoCards(), demoGrades(), demoSets, ELEMENT_CYCLE, RARITIES, seedDemo(), SourceCard, SourceGrade (+16 more)

### Community 59 - "Portfolio & Favoriten (Server)"
Cohesion: 0.20
Nodes (9): CARD_COLUMNS, isRange(), RANGE_DAYS, round2(), Currency, FavoriteResponse, FavoritesResponse, PortfolioRange (+1 more)

## Knowledge Gaps
- **15 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `PATH`, `Scan-Benchmark mit simulierten Fotos`, `Achievements & Profil-Schmuck (geplant)` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 322 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `Scan-Routen & Fehler` to `Wechselkurs & HTTP-Tests`, `Scan-Erkennung (Server)`, `Server-Abhängigkeiten`, `Sammlung, Score & Achievements`, `Katalog-Routen & Markt`, `Portfolio & Favoriten (Server)`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `PATH` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App-Bildschirme & Designsystem` be split into smaller, more focused modules?**
  _Cohesion score 0.054875061244487995 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `App-Bildschirme & Designsystem` to `Scanner & Diagramme (App)`, `Darstellung & Root-Layout`, `App-Abhängigkeiten`, `App-Dev-Abhängigkeiten`, `API-Vertrag & App-Client`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Darstellung & Root-Layout` be split into smaller, more focused modules?**
  _Cohesion score 0.08266129032258064 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `Fingerabdrücke & Datenbank` to `Wechselkurs & HTTP-Tests`, `Scan-Erkennung (Server)`, `Fingerabdrücke & Benchmark`, `Scan-Routen & Fehler`, `Sammlung, Score & Achievements`, `Abgleich-Tests & Population`, `Katalog-Routen & Markt`, `Abgleich & Speichern`, `Portfolio & Favoriten (Server)`, `Visueller Index & Scan-Routen`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Expo-App-Konfiguration` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._