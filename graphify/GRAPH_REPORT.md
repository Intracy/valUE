# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 869 nodes · 2252 edges · 71 communities (43 shown, 28 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c7554f84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App-Bausteine & Profil
- API-Server & Endpunkte
- Scan-Erkennung (Server)
- Datenbank & Konfiguration
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
- Abgleich-Tests & Population
- API-Vertrag & Katalog
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- App-Client & Sitzung
- Build-Config
- App-Skripte
- Lasttest
- Designsystem (Moodboard)
- Darstellung Dark/Light
- Achievements
- Paket: expo-device
- Paket: expo-font
- Paket: expo-haptics
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Paket: expo-linking
- Visueller Index
- Paket: expo-splash-screen
- Katalog-Routen & Markt
- Tab-Leiste & Scan-Icon
- Paket: @expo/ui
- Paket: expo-web-browser
- Paket: react-native-gesture-handler
- Paket: react-native-reanimated
- Paket: react-native-safe-area-context
- Sammlung & Markt (App)
- Paket: react-native-worklets
- Kartendetail & Master-Set
- CSS-Typen
- Ergebnisblatt, Kacheln & Seltenheit
- Portfolio (App)
- Fingerabdrücke & Datenbank
- PgBouncer (offen)
- Ungetestet auf Geräten
- Abgleich (Einzelabruf & Export)
- Quelldaten-Typen & Speichern
- Portfolio & Favoriten (Server)
- Test-Datenbank
- Last-Daten
- Paket: vitest
- Paket: expo-camera
- Paket: expo-secure-store
- Paket: expo-status-bar
- Paket: expo-system-ui
- Paket: react-native-web
- Paket: @tanstack/react-query
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
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `normalizeElement()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/domain/elements.ts
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts
- `Credit-Budget je Lauf` --references--> `CreditUsage`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Holo sparsam: Verlauf nur für Marke, Aktion, Fortschritt` --implements--> `HoloFill()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/holo.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (71 total, 28 thin omitted)

### Community 0 - "App-Bausteine & Profil"
Cohesion: 0.14
Nodes (32): useUpdateProfile(), APPEARANCE, levelProgress(), ProfilScreen(), styles, SetCard(), AppTabs(), Bar() (+24 more)

### Community 1 - "API-Server & Endpunkte"
Cohesion: 0.15
Nodes (18): withTransaction(), AppOptions, buildApp(), Authenticator, createAnonymousUser(), createAuthenticator(), hashToken(), createCatalogVersion() (+10 more)

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.07
Nodes (35): CandidateFacts, clamp(), decide(), Identification, identifyCard(), ScanOutcome, scoreCandidate(), ScoredCandidate (+27 more)

### Community 3 - "Datenbank & Konfiguration"
Cohesion: 0.12
Nodes (12): Config, csv(), loadConfig(), schema, config, db, here, migrationsDir (+4 more)

### Community 4 - "Demo-Daten & Motive"
Cohesion: 0.21
Nodes (13): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random(), demoCards(), demoGrades() (+5 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Pokemon-Price-Tracker-Anbindung"
Cohesion: 0.08
Nodes (38): normalizeElement(), asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS (+30 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Scanner & Diagramme (App)"
Cohesion: 0.13
Nodes (29): react-native-svg@15.16.0, useConfirmScan(), useScanCard(), GuideOverlay(), messageFor(), Phase, RoundButton(), ScanScreen() (+21 more)

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

### Community 16 - "Sammlung, Profil & Score"
Cohesion: 0.16
Nodes (17): evaluateAchievements(), ALIASES, ELEMENTS, isElement(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack() (+9 more)

### Community 17 - "App-Dev-Abhängigkeiten"
Cohesion: 0.20
Nodes (11): expo-constants@~58.0.16, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name, private (+3 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "Abgleich-Tests & Population"
Cohesion: 0.17
Nodes (6): runPopulationSync(), db, listCardsInSet(), options, sets, Grading-Preise, Population & Elemente aus der Quelle

### Community 21 - "API-Vertrag & Katalog"
Cohesion: 0.10
Nodes (35): keys, SetQuantityInput, usePortfolio(), Props, Props, Props, CatalogVersion, CardRow (+27 more)

### Community 22 - "Produktvision & Features"
Cohesion: 0.25
Nodes (8): Achievements & Profil-Schmuck (geplant), Anmeldung, Abo & Einmalkauf (geplant), Euro-Preise Cardmarket / Graded / Population (geplant), Master-Set-Ansicht, Pokemon Price Tracker (Datenanbieter), Restkosten fehlender Karten, Sammelscore & Vintage-Score (XP), valUE (Sammel-App)

### Community 23 - "API-Types-TS-Config"
Cohesion: 0.22
Nodes (8): compilerOptions, module, moduleResolution, noEmit, skipLibCheck, strict, target, include

### Community 24 - "App-TS-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, extends, include, @/assets/*, expo/tsconfig.base

### Community 25 - "App-Client & Sitzung"
Cohesion: 0.18
Nodes (11): API_URL, ApiRequestError, request(), RequestOptions, useMovers(), useSearch(), useSets(), getToken() (+3 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "Designsystem (Moodboard)"
Cohesion: 0.11
Nodes (24): AppTextProps, ACHIEVEMENT_SYMBOLS, ButtonProps, styles, useAppearance(), changeTints(), dark, light (+16 more)

### Community 30 - "Darstellung Dark/Light"
Cohesion: 0.21
Nodes (13): queryClient, RootLayout(), Themed(), AppearanceContext, AppearancePreference, AppearanceProvider(), AppearanceState, isPreference() (+5 more)

### Community 31 - "Achievements"
Cohesion: 0.24
Nodes (8): ACHIEVEMENTS, CollectionStats, Definition, rankForLevel(), TIERS, Achievement, AchievementTier, Element

### Community 40 - "Katalog-Routen & Markt"
Cohesion: 0.47
Nodes (6): byGradeDesc(), registerCatalogRoutes(), computeMovers(), toCard(), toPrice(), toSet()

### Community 47 - "Sammlung & Markt (App)"
Cohesion: 0.15
Nodes (24): useCollectionProgress(), Direction, DIRECTIONS, MarktScreen(), PERIODS, styles, useDebounced(), SammlungScreen() (+16 more)

### Community 49 - "Kartendetail & Master-Set"
Cohesion: 0.16
Nodes (24): invalidateCollection(), useCard(), useFavorites(), useOwnedInSet(), useRemoveCard(), useSet(), useSetQuantity(), useToggleFavorite() (+16 more)

### Community 51 - "Ergebnisblatt, Kacheln & Seltenheit"
Cohesion: 0.16
Nodes (20): styles, CardTile, shortNumber(), styles, isShiny(), rarityTier(), ElementBadge(), Stars() (+12 more)

### Community 52 - "Portfolio (App)"
Cohesion: 0.18
Nodes (19): useProfile(), PortfolioScreen(), RANGES, Stat(), styles, CardRow(), formatCount(), formatDate() (+11 more)

### Community 53 - "Fingerabdrücke & Datenbank"
Cohesion: 0.18
Nodes (10): Db, computeMissingFingerprints(), config, db, quantize(), db, difficulty, ocr (+2 more)

### Community 57 - "Abgleich (Einzelabruf & Export)"
Cohesion: 0.20
Nodes (13): ExportPrintingRow, PriceSource, bumpCatalogVersion(), refreshCardCounts(), upsertSets(), runApiSync(), runExportSync(), SetRow (+5 more)

### Community 58 - "Quelldaten-Typen & Speichern"
Cohesion: 0.22
Nodes (10): DbClient, SourceCard, SourceGrade, SourceGrader, SourcePrinting, SourceSet, numberSort(), Queryable (+2 more)

### Community 59 - "Portfolio & Favoriten (Server)"
Cohesion: 0.20
Nodes (11): CARD_COLUMNS, isRange(), RANGE_DAYS, registerPortfolioRoutes(), round2(), Portfolio-Verlauf per LATERAL-Indexzugriff, Currency, FavoriteResponse (+3 more)

### Community 60 - "Test-Datenbank"
Cohesion: 0.35
Nodes (7): migrate(), createPool(), setup(), resetData(), testDatabaseUrl(), testDb(), db

### Community 61 - "Last-Daten"
Cohesion: 0.18
Nodes (8): cardsPerSet, config, days, db, itemsPerUser, sets, users, Lasttest (50k Karten, 10k Nutzer)

## Knowledge Gaps
- **14 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `Rate-Limit-Zähler in Redis (offen)`, `Scan-Benchmark mit simulierten Fotos`, `Gelerntes Bildmodell (CLIP) – nächster Schritt` (+9 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 294 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `API-Server & Endpunkte` to `Scan-Erkennung (Server)`, `Server-Abhängigkeiten`, `Server-Dev-Abhängigkeiten`, `Sammlung, Profil & Score`, `API-Vertrag & Katalog`, `Portfolio & Favoriten (Server)`, `Test-Datenbank`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `Rate-Limit-Zähler in Redis (offen)` to the rest of the system?**
  _14 weakly-connected nodes found - possible missing edges._
- **Should `App-Bausteine & Profil` be split into smaller, more focused modules?**
  _Cohesion score 0.13963963963963963 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `App-Bausteine & Profil` to `Scanner & Diagramme (App)`, `App-Abhängigkeiten`, `Sammlung & Markt (App)`, `App-Dev-Abhängigkeiten`, `Kartendetail & Master-Set`, `Ergebnisblatt, Kacheln & Seltenheit`, `Portfolio (App)`, `API-Vertrag & Katalog`, `App-Client & Sitzung`, `Designsystem (Moodboard)`, `Darstellung Dark/Light`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `Scan-Erkennung (Server)` be split into smaller, more focused modules?**
  _Cohesion score 0.06717687074829932 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `Fingerabdrücke & Datenbank` to `API-Server & Endpunkte`, `Scan-Erkennung (Server)`, `Datenbank & Konfiguration`, `Demo-Daten & Motive`, `Visueller Index`, `Sammlung, Profil & Score`, `API-Vertrag & Katalog`, `Abgleich (Einzelabruf & Export)`, `Portfolio & Favoriten (Server)`, `Test-Datenbank`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `Datenbank & Konfiguration` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._