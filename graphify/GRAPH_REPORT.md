# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 871 nodes · 2262 edges · 68 communities (42 shown, 26 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e28eb208`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App-Bildschirme & Designsystem
- API-Server & Endpunkte
- Scan-Erkennung (Server)
- Datenbank, Migration & Tests
- Demo-Daten & Motive
- Expo-App-Konfiguration
- Pokemon-Price-Tracker-Anbindung
- CI-Pipeline
- Scanner & Diagramme (App)
- Docker Compose
- App-Abhängigkeiten
- Server-Abhängigkeiten
- Server-TypeScript-Config
- Root-Workspace
- Server-Dev-Abhängigkeiten
- Server-Skripte
- Sammlung, Profil & Score
- App-Dev-Abhängigkeiten
- API-Vertrag Paket
- Tab-Navigation
- Pokemon-Price-Tracker-Client
- API-Vertrag & Katalog
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- App-Datenanbindung
- Build-Config
- App-Skripte
- Lasttest
- Texterkennung (OCR)
- Darstellung & Tab-Leiste
- Achievements
- Paket: expo-device
- Paket: expo-font
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Paket: expo-linking
- Fingerabdrücke
- Paket: expo-splash-screen
- Katalog-Routen & Markt
- Konfiguration & CLIs
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-reanimated
- Paket: react-native-safe-area-context
- Scan-Routen & Fehler
- Paket: react-native-worklets
- Tages-Export (CSV)
- CSS-Typen
- API-Probe
- Paket: expo
- Scanner-Benchmark
- PgBouncer (offen)
- Ungetestet auf Geräten
- Abgleich & Speichern
- Paket: expo-glass-effect
- Portfolio & Favoriten (Server)
- Paket: react-dom
- Last-Daten
- Paket: vitest
- Paket: react-native-screens
- Paket: react-native-svg
- Paket: @value/api-types
- Paket: tesseract.js
- Paket: zod

## God Nodes (most connected - your core abstractions)
1. `usePalette()` - 54 edges
2. `AppText()` - 45 edges
3. `KarteScreen()` - 30 edges
4. `react-native` - 26 edges
5. `HoloFill()` - 25 edges
6. `ProfilScreen()` - 22 edges
7. `PortfolioScreen()` - 20 edges
8. `Db` - 19 edges
9. `react` - 19 edges
10. `SetScreen()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `runPopulationSync()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/sync/population.ts
- `Credit-Budget je Lauf` --references--> `CreditUsage`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts
- `Holo sparsam: Verlauf nur für Marke, Aktion, Fortschritt` --implements--> `HoloFill()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/holo.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (68 total, 26 thin omitted)

### Community 0 - "App-Bildschirme & Designsystem"
Cohesion: 0.06
Nodes (124): useFavorites(), useOwnedInSet(), useProfile(), useSetQuantity(), GradeBlock(), KarteScreen(), Mode, StepButton() (+116 more)

### Community 1 - "API-Server & Endpunkte"
Cohesion: 0.11
Nodes (16): Db, AppOptions, buildApp(), Authenticator, createAnonymousUser(), createAuthenticator(), hashToken(), CatalogVersion (+8 more)

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.23
Nodes (13): CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate, SCORING (+5 more)

### Community 3 - "Datenbank, Migration & Tests"
Cohesion: 0.15
Nodes (13): config, db, here, migrate(), migrationsDir, createPool(), config, db (+5 more)

### Community 4 - "Demo-Daten & Motive"
Cohesion: 0.21
Nodes (13): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random(), demoCards(), demoGrades() (+5 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Pokemon-Price-Tracker-Anbindung"
Cohesion: 0.16
Nodes (25): normalizeElement(), asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS (+17 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Scanner & Diagramme (App)"
Cohesion: 0.11
Nodes (34): useConfirmScan(), useScanCard(), GuideOverlay(), messageFor(), Phase, RoundButton(), ScanScreen(), styles (+26 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "App-Abhängigkeiten"
Cohesion: 0.12
Nodes (16): dependencies, expo-camera@~58.0.14, expo-constants@~58.0.16, expo-image@~58.0.18, expo-router@~58.0.31, expo-secure-store@~58.0.3, expo-status-bar@~58.0.5, expo-symbols@~58.0.5 (+8 more)

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

### Community 16 - "Sammlung, Profil & Score"
Cohesion: 0.17
Nodes (16): evaluateAchievements(), rankForLevel(), ALIASES, ELEMENTS, isElement(), cardXp(), RARITY_TIERS, rarityTier() (+8 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.16
Nodes (13): expo-system-ui@~58.0.7, react-native-web@~0.21.4, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Pokemon-Price-Tracker-Client"
Cohesion: 0.14
Nodes (7): PokemonPriceTrackerSource, CreditUsage, SourceError, db, listCardsInSet(), options, sets

### Community 21 - "API-Vertrag & Katalog"
Cohesion: 0.13
Nodes (24): Props, Props, Props, CardRow, SetRow, Schnittstelle /v1, CardDetailResponse, CardGrade (+16 more)

### Community 22 - "Produktvision & Features"
Cohesion: 0.25
Nodes (8): Achievements & Profil-Schmuck (geplant), Anmeldung, Abo & Einmalkauf (geplant), Euro-Preise Cardmarket / Graded / Population (geplant), Master-Set-Ansicht, Pokemon Price Tracker (Datenanbieter), Restkosten fehlender Karten, Sammelscore & Vintage-Score (XP), valUE (Sammel-App)

### Community 23 - "API-Types-TS-Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, include

### Community 24 - "App-TS-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/assets/*, expo/tsconfig.base

### Community 25 - "App-Datenanbindung"
Cohesion: 0.10
Nodes (29): API_URL, ApiRequestError, request(), RequestOptions, invalidateCollection(), keys, SetQuantityInput, useCard() (+21 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "Texterkennung (OCR)"
Cohesion: 0.15
Nodes (9): createOcrPool(), createPool(), DIGIT_FIXES, langPath, OcrResult, Pool, require, Texterkennung Tesseract (Name & Nummer) (+1 more)

### Community 30 - "Darstellung & Tab-Leiste"
Cohesion: 0.09
Nodes (22): queryClient, RootLayout(), Themed(), TabsLayout(), AppTabs(), AppearanceContext, AppearancePreference, AppearanceProvider() (+14 more)

### Community 31 - "Achievements"
Cohesion: 0.28
Nodes (7): ACHIEVEMENTS, CollectionStats, Definition, TIERS, Achievement, AchievementTier, Element

### Community 38 - "Fingerabdrücke"
Cohesion: 0.28
Nodes (9): computeMissingFingerprints(), fingerprint(), FINGERPRINT_DIM, loadImage(), normalize(), quantize(), Tabelle sync_runs, Gelerntes Bildmodell (CLIP) – nächster Schritt (+1 more)

### Community 40 - "Katalog-Routen & Markt"
Cohesion: 0.47
Nodes (6): byGradeDesc(), registerCatalogRoutes(), computeMovers(), toCard(), toPrice(), toSet()

### Community 41 - "Konfiguration & CLIs"
Cohesion: 0.21
Nodes (8): Config, csv(), loadConfig(), schema, config, db, config, db

### Community 47 - "Scan-Routen & Fehler"
Cohesion: 0.30
Nodes (8): withTransaction(), badRequest(), HttpError, notFound(), registerScanRoutes(), ConfirmScanRequest, ConfirmScanResponse, ScanRequest

### Community 49 - "Tages-Export (CSV)"
Cohesion: 0.28
Nodes (5): csvRecords(), ExportPrintingRow, openExport(), parseCsvLine(), SYNC_MODE api / export

### Community 51 - "API-Probe"
Cohesion: 0.25
Nodes (8): config, firstRow(), keysOf(), rawSet, report(), set, source, Feldzuordnung PPT ungeprüft (ppt:probe)

### Community 53 - "Scanner-Benchmark"
Cohesion: 0.27
Nodes (8): db, difficulty, ocr, variants, clipToCanvas(), PhotoOptions, rng(), syntheticPhoto()

### Community 57 - "Abgleich & Speichern"
Cohesion: 0.14
Nodes (23): DbClient, PriceSource, SourceCard, SourceGrade, SourceGrader, SourcePrinting, SourceSet, runPopulationSync() (+15 more)

### Community 59 - "Portfolio & Favoriten (Server)"
Cohesion: 0.20
Nodes (11): CARD_COLUMNS, isRange(), RANGE_DAYS, registerPortfolioRoutes(), round2(), Portfolio-Verlauf per LATERAL-Indexzugriff, Currency, FavoriteResponse (+3 more)

### Community 61 - "Last-Daten"
Cohesion: 0.18
Nodes (8): cardsPerSet, config, days, db, itemsPerUser, sets, users, Lasttest (50k Karten, 10k Nutzer)

## Knowledge Gaps
- **14 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `Rate-Limit-Zähler in Redis (offen)`, `Scan-Benchmark mit simulierten Fotos`, `Achievements & Profil-Schmuck (geplant)` (+9 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 293 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `API-Server & Endpunkte` to `Scan-Erkennung (Server)`, `Datenbank, Migration & Tests`, `Server-Abhängigkeiten`, `Server-Dev-Abhängigkeiten`, `Scan-Routen & Fehler`, `Sammlung, Profil & Score`, `API-Vertrag & Katalog`, `Portfolio & Favoriten (Server)`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `Rate-Limit-Zähler in Redis (offen)` to the rest of the system?**
  _14 weakly-connected nodes found - possible missing edges._
- **Should `App-Bildschirme & Designsystem` be split into smaller, more focused modules?**
  _Cohesion score 0.05926754263349175 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `App-Bildschirme & Designsystem` to `Scanner & Diagramme (App)`, `App-Abhängigkeiten`, `App-Dev-Abhängigkeiten`, `App-Datenanbindung`, `Darstellung & Tab-Leiste`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `API-Server & Endpunkte` be split into smaller, more focused modules?**
  _Cohesion score 0.10804597701149425 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `API-Server & Endpunkte` to `Scan-Erkennung (Server)`, `Datenbank, Migration & Tests`, `Demo-Daten & Motive`, `Fingerabdrücke`, `Scan-Routen & Fehler`, `Sammlung, Profil & Score`, `API-Vertrag & Katalog`, `Abgleich & Speichern`, `Portfolio & Favoriten (Server)`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `Expo-App-Konfiguration` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._