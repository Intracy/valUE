# Graph Report - value  (2026-11-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 949 nodes · 2403 edges · 77 communities (47 shown, 30 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b8c270e3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Design-Bausteine
- Server-App und Wechselkurs
- Scan-Erkennung (Server)
- Fingerabdrücke & Benchmark
- Hell- und Dunkelmodus
- Expo-App-Konfiguration
- Pokemon-Price-Tracker-Anbindung
- CI-Pipeline
- Karten-Datentypen
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
- Preisquelle PPT
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
- Konfiguration und Datenbank
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
- Demo-Daten
- PgBouncer (offen)
- Ungetestet auf Geräten
- Abgleich & Speichern
- Paket: expo-glass-effect
- Portfolio & Favoriten (Server)
- Paket: react-dom
- Haupt-Screens
- Karten- und Set-Ansicht
- Sammlung und Fortschritt
- Preise und Listen
- API-Typen Sammlung
- Web-Tab-Leiste
- Quellen-Prüfung
- Tab-Layout
- Systemkamera im Browser
- Katalogversion und Abgleich
- Server-Tests
- Kamera-Paket
- System-UI-Paket
- Web-Darstellung
- Texterkennung
- Schema-Prüfung

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
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `runPopulationSync()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/sync/population.ts
- `Dollar ↔ Euro per Tipp (EZB-Kurs)` --implements--> `Price()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/currency.tsx
- `Credit-Budget je Lauf` --references--> `CreditUsage`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (77 total, 30 thin omitted)

### Community 0 - "Design-Bausteine"
Cohesion: 0.09
Nodes (44): AppText(), styles, CardTile, shortNumber(), styles, HoloFill(), isShiny(), rarityTier() (+36 more)

### Community 1 - "Server-App und Wechselkurs"
Cohesion: 0.14
Nodes (15): Db, createExchangeRates(), ECB_DAILY_URL, ExchangeRates, parseEcbUsdRate(), AppOptions, buildApp(), CatalogVersion (+7 more)

### Community 2 - "Scan-Erkennung (Server)"
Cohesion: 0.23
Nodes (13): CandidateFacts, clamp(), decide(), Identification, identifyCard(), scoreCandidate(), ScoredCandidate, SCORING (+5 more)

### Community 3 - "Fingerabdrücke & Benchmark"
Cohesion: 0.18
Nodes (16): computeMissingFingerprints(), fingerprint(), FINGERPRINT_DIM, loadImage(), normalize(), quantize(), db, difficulty (+8 more)

### Community 4 - "Hell- und Dunkelmodus"
Cohesion: 0.16
Nodes (15): AppearanceContext, AppearancePreference, AppearanceProvider(), AppearanceState, isPreference(), load(), save(), Scheme (+7 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Pokemon-Price-Tracker-Anbindung"
Cohesion: 0.15
Nodes (26): asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS, isObject() (+18 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "Karten-Datentypen"
Cohesion: 0.20
Nodes (10): Props, Props, Props, CardSummary, FavoriteCard, Money, MoverCard, PortfolioCard (+2 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "App-Abhängigkeiten"
Cohesion: 0.13
Nodes (15): dependencies, expo-image@~58.0.18, expo-router@~58.0.31, expo-secure-store@~58.0.3, expo-symbols@~58.0.5, react@19.3.0, react-native@0.88.1, react-native-reanimated@4.7.1 (+7 more)

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
Cohesion: 0.15
Nodes (16): evaluateAchievements(), rankForLevel(), normalizeElement(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack(), VINTAGE_BEFORE (+8 more)

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

### Community 21 - "Katalog-Routen & Markt"
Cohesion: 0.13
Nodes (19): ALIASES, ELEMENTS, isElement(), byGradeDesc(), CardRow, registerCatalogRoutes(), computeMovers(), SetRow (+11 more)

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
Cohesion: 0.18
Nodes (14): API_URL, ApiRequestError, request(), RequestOptions, keys, SetQuantityInput, useCard(), useMovers() (+6 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 30 - "Docker-Compose (NAS)"
Cohesion: 0.06
Nodes (35): build, depends_on, environment, restart, context, dockerfile, condition, environment (+27 more)

### Community 33 - "Scanner & Diagramme (App)"
Cohesion: 0.09
Nodes (37): invalidateCollection(), useConfirmScan(), useScanCard(), GuideOverlay(), LIVE_CAMERA, messageFor(), Phase, RoundButton() (+29 more)

### Community 38 - "Konfiguration und Datenbank"
Cohesion: 0.12
Nodes (19): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+11 more)

### Community 40 - "Achievements"
Cohesion: 0.28
Nodes (7): ACHIEVEMENTS, CollectionStats, Definition, TIERS, Achievement, AchievementTier, Element

### Community 41 - "Konfiguration & Last-Daten"
Cohesion: 0.18
Nodes (8): cardsPerSet, config, days, db, itemsPerUser, sets, users, Lasttest (50k Karten, 10k Nutzer)

### Community 47 - "Scan-Routen & Fehler"
Cohesion: 0.18
Nodes (15): withTransaction(), Authenticator, createAnonymousUser(), createAuthenticator(), hashToken(), badRequest(), HttpError, notFound() (+7 more)

### Community 49 - "Texterkennung (OCR)"
Cohesion: 0.15
Nodes (9): createOcrPool(), createPool(), DIGIT_FIXES, langPath, OcrResult, Pool, require, Texterkennung Tesseract (Name & Nummer) (+1 more)

### Community 51 - "NAS-Update & Tailscale"
Cohesion: 0.24
Nodes (9): compose(), git_(), log(), PATH, update.sh script, Echte Daten statt Demo, Einrichten und aktualisieren, valUE auf der Synology (Docker) und über Tailscale (+1 more)

### Community 53 - "Demo-Daten"
Cohesion: 0.16
Nodes (16): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random(), demoCards(), demoGrades() (+8 more)

### Community 57 - "Abgleich & Speichern"
Cohesion: 0.16
Nodes (20): DbClient, seedDemo(), PriceSource, runPopulationSync(), bumpCatalogVersion(), numberSort(), Queryable, refreshCardCounts() (+12 more)

### Community 59 - "Portfolio & Favoriten (Server)"
Cohesion: 0.20
Nodes (11): CARD_COLUMNS, isRange(), RANGE_DAYS, registerPortfolioRoutes(), round2(), Portfolio-Verlauf per LATERAL-Indexzugriff, Currency, FavoriteResponse (+3 more)

### Community 61 - "Haupt-Screens"
Cohesion: 0.12
Nodes (35): usePortfolio(), useProfile(), useUpdateProfile(), Direction, DIRECTIONS, MarktScreen(), PERIODS, styles (+27 more)

### Community 62 - "Karten- und Set-Ansicht"
Cohesion: 0.15
Nodes (28): useCollectionProgress(), useFavorites(), useOwnedInSet(), useRemoveCard(), useSetQuantity(), useToggleFavorite(), authedRequest(), GradeBlock() (+20 more)

### Community 63 - "Sammlung und Fortschritt"
Cohesion: 0.19
Nodes (17): queryClient, RootLayout(), Themed(), SetCard(), styles, View_, VIEWS, Ring() (+9 more)

### Community 64 - "Preise und Listen"
Cohesion: 0.15
Nodes (17): useExchangeRate(), AppTextProps, CurrencyContext, CurrencyProvider(), CurrencyState, Display, load(), PriceProps (+9 more)

### Community 65 - "API-Typen Sammlung"
Cohesion: 0.19
Nodes (15): Schnittstelle /v1, AnonymousAuthResponse, CardPrinting, CollectionItem, CollectionProgressResponse, CollectionSetResponse, CollectionSource, DeleteCollectionItemResponse (+7 more)

### Community 66 - "Web-Tab-Leiste"
Cohesion: 0.33
Nodes (8): AppTabs(), Bar(), Narrow, ScanButton(), styles, TabButton(), useNarrow(), WebSymbol

### Community 67 - "Quellen-Prüfung"
Cohesion: 0.25
Nodes (8): config, firstRow(), keysOf(), rawSet, report(), set, source, Feldzuordnung PPT ungeprüft (ppt:probe)

## Knowledge Gaps
- **15 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `PATH`, `Rate-Limit-Zähler in Redis (offen)`, `Scan-Benchmark mit simulierten Fotos` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 327 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fastify` connect `Scan-Routen & Fehler` to `API-Typen Sammlung`, `Server-App und Wechselkurs`, `Scan-Erkennung (Server)`, `Server-Abhängigkeiten`, `Server-Dev-Abhängigkeiten`, `Katalog-Routen & Markt`, `Portfolio & Favoriten (Server)`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `PATH` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design-Bausteine` be split into smaller, more focused modules?**
  _Cohesion score 0.09200603318250378 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `Preise und Listen` to `Design-Bausteine`, `Scanner & Diagramme (App)`, `Web-Tab-Leiste`, `Hell- und Dunkelmodus`, `App-Abhängigkeiten`, `App-Dev-Abhängigkeiten`, `API-Vertrag & App-Client`, `Haupt-Screens`, `Karten- und Set-Ansicht`, `Sammlung und Fortschritt`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Server-App und Wechselkurs` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Why does `Db` connect `Server-App und Wechselkurs` to `API-Typen Sammlung`, `Scan-Erkennung (Server)`, `Fingerabdrücke & Benchmark`, `Konfiguration und Datenbank`, `Scan-Routen & Fehler`, `Katalog-Routen & Markt`, `Demo-Daten`, `Abgleich & Speichern`, `Portfolio & Favoriten (Server)`, `Visueller Index & Scan-Routen`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Expo-App-Konfiguration` be split into smaller, more focused modules?**
  _Cohesion score 0.07692307692307693 - nodes in this community are weakly interconnected._