# Graph Report - value  (2026-11-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1052 nodes · 2689 edges · 73 communities (49 shown, 24 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c6c92ab4`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AppText
- app.ts
- identify.ts
- portfolio.ts
- appearance.tsx
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
- mobile/package.json
- API-Vertrag Paket
- Tab-Navigation
- sync.test.ts
- currency.tsx
- Produktvision & Features
- API-Types-TS-Config
- App-TS-Config
- queries.ts
- Build-Config
- App-Skripte
- Lasttest
- [cardId].tsx
- Docker-Compose (NAS)
- Paket: expo-font
- scan.ts
- Scanner-Oberfläche
- Karte im Foto finden
- Paket: expo-image-manipulator
- Paket: expo-image-picker
- Kamera und Zuschnitt
- Konfiguration und Abgleich-CLI
- Paket: expo-splash-screen
- ocr.ts
- seed-demo.ts
- catalog-cli.ts
- routes/catalog.ts
- Bild-Fingerabdruck (Farbraster + Kanten)
- Zweite Stufe: Kartenmerkmale (Nummer, Jahr, Attacken, KP, Illustrator)
- react-native-reanimated@4.7.1
- Sammlung und Fortschritt
- synthetic-photo.ts
- react-native-svg
- CSS-Typen
- NAS-Update & Tailscale
- expo@~58.0.25
- sync.ts
- PgBouncer (offen)
- Ungetestet auf Geräten
- expo-device@~58.0.5
- expo-glass-effect@~58.0.5
- @value/api-types@*
- expo-haptics
- expo-linking@~58.0.17
- @expo/ui@~58.0.28
- profil/index.tsx
- expo-web-browser@~58.0.8
- react-dom@19.3.0
- real-scan-benchmark.ts
- react-native-gesture-handler@~3.3.0
- react-native-safe-area-context
- Systemkamera im Browser
- Web-Tab-Leiste
- react-native-screens@~4.30.1
- react-native-worklets@0.13.0

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
10. `identifyImage()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `App ruft Anbieter nie direkt` --rationale_for--> `PriceSource`  [INFERRED]
  docs/ARCHITEKTUR.md → apps/server/src/sources/price-source.ts
- `Dollar ↔ Euro per Tipp (EZB-Kurs)` --implements--> `Price()`  [EXTRACTED]
  docs/DESIGN.md → apps/mobile/src/components/currency.tsx
- `PPT-Preise über TCGdex-ID zugeordnet` --implements--> `applyPrices()`  [EXTRACTED]
  docs/SCANNER.md → apps/server/src/sync/store.ts
- `Grading-Preise, Population & Elemente aus der Quelle` --implements--> `normalizeElement()`  [EXTRACTED]
  docs/ARCHITEKTUR.md → apps/server/src/domain/elements.ts
- `Ergebnisse: eindeutig / unsicher / nichts` --implements--> `ScanOutcome`  [INFERRED]
  docs/SCANNER.md → apps/server/src/scan/identify.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Katalog-Abgleich mit Pokemon Price Tracker** — arch_sync_process, arch_sync_mode, arch_credit_budget, arch_sync_runs, apps_server_src_sync_sync, apps_server_src_sources_price_source [EXTRACTED 1.00]
- **Skalierungsentscheidungen** — arch_stateless_api, arch_etag_cdn, arch_partition_collection, arch_partition_price_history, arch_batch_unnest, arch_server_only_provider [EXTRACTED 1.00]
- **Scan-Erkennungspipeline** — scan_fingerprint, scan_ocr_tesseract, scan_signal_weighting, apps_server_src_scan_identify, apps_server_src_scan_ocr, apps_server_src_scan_image [EXTRACTED 1.00]

## Communities (73 total, 24 thin omitted)

### Community 0 - "AppText"
Cohesion: 0.15
Nodes (42): useFavorites(), useOwnedInSet(), useProfile(), useSetQuantity(), GradeBlock(), KarteScreen(), Direction, DIRECTIONS (+34 more)

### Community 1 - "app.ts"
Cohesion: 0.10
Nodes (15): Db, createExchangeRates(), ECB_DAILY_URL, ExchangeRates, parseEcbUsdRate(), AppOptions, buildApp(), OcrEngine (+7 more)

### Community 2 - "identify.ts"
Cohesion: 0.16
Nodes (23): CandidateDetails, CandidateFacts, clamp(), decide(), Identification, identifyImage(), scoreCandidate(), ScoredCandidate (+15 more)

### Community 3 - "portfolio.ts"
Cohesion: 0.20
Nodes (11): CARD_COLUMNS, isRange(), RANGE_DAYS, registerPortfolioRoutes(), round2(), Portfolio-Verlauf per LATERAL-Indexzugriff, Currency, FavoriteResponse (+3 more)

### Community 4 - "appearance.tsx"
Cohesion: 0.08
Nodes (26): queryClient, useExchangeRate(), RootLayout(), Themed(), TabsLayout(), AppTabs(), CurrencyProvider(), load() (+18 more)

### Community 5 - "Expo-App-Konfiguration"
Cohesion: 0.08
Nodes (25): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, predictiveBackGestureEnabled, reactCompiler, typedRoutes (+17 more)

### Community 6 - "Preisquelle PPT"
Cohesion: 0.09
Nodes (39): asIsoDate(), asIsoTimestamp(), asNumber(), asText(), FetchLike, GRADE_PRICE_KEYS, GRADERS, isObject() (+31 more)

### Community 7 - "CI-Pipeline"
Cohesion: 0.08
Nodes (25): runs-on, services, steps, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, TEST_DATABASE_URL, jobs (+17 more)

### Community 8 - "index.ts"
Cohesion: 0.11
Nodes (22): Props, Props, ACHIEVEMENTS, CollectionStats, Definition, rankForLevel(), TIERS, Achievement (+14 more)

### Community 9 - "Docker Compose"
Cohesion: 0.12
Nodes (16): environment, healthcheck, image, ports, volumes, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER (+8 more)

### Community 10 - "dependencies"
Cohesion: 0.12
Nodes (16): dependencies, expo-camera@~58.0.14, expo-constants@~58.0.16, expo-image@~58.0.18, expo-router@~58.0.31, expo-secure-store@~58.0.3, expo-status-bar@~58.0.5, expo-symbols@~58.0.5 (+8 more)

### Community 11 - "Server-Abhängigkeiten"
Cohesion: 0.10
Nodes (25): dependencies, fastify@^5.0.0, @fastify/compress@^8.0.0, @fastify/cors@^11.0.0, @fastify/rate-limit@^10.0.0, pg@^8.13.0, sharp@^0.35.5, tesseract.js@^7.0.0 (+17 more)

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
Cohesion: 0.13
Nodes (25): normalizeElement(), cardImageUrl(), cardText(), catalogId(), CatalogLanguage, isDigitalOnly(), LANGUAGE_NAMES, mapTcgdexCard() (+17 more)

### Community 17 - "mobile/package.json"
Cohesion: 0.16
Nodes (13): expo-system-ui@~58.0.7, react-native-web@~0.21.4, devDependencies, @types/react@~19.3.0, typescript@~6.0.3, typescript, main, name (+5 more)

### Community 18 - "API-Vertrag Paket"
Cohesion: 0.18
Nodes (11): description, devDependencies, typescript@~6.0.3, typescript, main, name, private, scripts (+3 more)

### Community 19 - "Tab-Navigation"
Cohesion: 0.33
Nodes (5): MarktLayout(), PortfolioLayout(), ProfilLayout(), SammlungLayout(), TabStack()

### Community 20 - "sync.test.ts"
Cohesion: 0.11
Nodes (16): SourceCard, SourceError, SourceGrade, SourceGrader, SourcePrinting, createTcgdexClient(), db, fakeTcgdex() (+8 more)

### Community 21 - "currency.tsx"
Cohesion: 0.20
Nodes (12): AppTextProps, CurrencyContext, CurrencyState, Display, PriceProps, useConvert(), useCurrency(), formatMoney() (+4 more)

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
Cohesion: 0.10
Nodes (28): API_URL, ApiRequestError, request(), RequestOptions, invalidateCollection(), keys, SetQuantityInput, useCard() (+20 more)

### Community 26 - "Build-Config"
Cohesion: 0.25
Nodes (7): compilerOptions, noEmit, outDir, rootDir, extends, include, ./tsconfig.json

### Community 27 - "App-Skripte"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, start, typecheck, web

### Community 28 - "Lasttest"
Cohesion: 0.33
Nodes (5): autocannon@^8.0.0, authed(), etag, token(), autocannon

### Community 29 - "[cardId].tsx"
Cohesion: 0.13
Nodes (25): Mode, StepButton(), styles, Props, styles, CardTile, shortNumber(), styles (+17 more)

### Community 30 - "Docker-Compose (NAS)"
Cohesion: 0.05
Nodes (46): build, depends_on, environment, restart, context, dockerfile, build, command (+38 more)

### Community 32 - "scan.ts"
Cohesion: 0.18
Nodes (15): withTransaction(), Authenticator, createAnonymousUser(), createAuthenticator(), hashToken(), badRequest(), HttpError, notFound() (+7 more)

### Community 33 - "Scanner-Oberfläche"
Cohesion: 0.16
Nodes (25): GuideOverlay(), AreaChart(), ChartProps, Ring(), RingProps, smoothPath(), Sparkline(), styles (+17 more)

### Community 34 - "Karte im Foto finden"
Cohesion: 0.43
Nodes (4): CardFrame, cropToCard(), findCardFrame(), sharp

### Community 37 - "Kamera und Zuschnitt"
Cohesion: 0.16
Nodes (19): useConfirmScan(), useScanCard(), LIVE_CAMERA, messageFor(), Phase, RoundButton(), ScanScreen(), styles (+11 more)

### Community 38 - "Konfiguration und Abgleich-CLI"
Cohesion: 0.09
Nodes (25): Config, csv(), loadConfig(), schema, config, db, here, migrate() (+17 more)

### Community 40 - "ocr.ts"
Cohesion: 0.15
Nodes (9): createOcrPool(), createPool(), DIGIT_FIXES, langPath(), LowerFacts, OcrResult, Pool, require (+1 more)

### Community 41 - "seed-demo.ts"
Cohesion: 0.22
Nodes (12): demoCardSvg(), demoNames, DemoTheme, demoThemes, escapeXml(), random(), demoCards(), demoGrades() (+4 more)

### Community 42 - "catalog-cli.ts"
Cohesion: 0.27
Nodes (7): computeMissingFingerprints(), quantize(), CATALOG_LANGUAGES, fingerprintImageUrl(), config, db, removeDemoCatalog()

### Community 43 - "routes/catalog.ts"
Cohesion: 0.26
Nodes (11): ALIASES, ELEMENTS, isElement(), byGradeDesc(), CardRow, registerCatalogRoutes(), computeMovers(), SetRow (+3 more)

### Community 44 - "Bild-Fingerabdruck (Farbraster + Kanten)"
Cohesion: 0.33
Nodes (4): Katalogversion, Tabelle sync_runs, Gelerntes Bildmodell (CLIP) – nächster Schritt, Bild-Fingerabdruck (Farbraster + Kanten)

### Community 45 - "Zweite Stufe: Kartenmerkmale (Nummer, Jahr, Attacken, KP, Illustrator)"
Cohesion: 0.22
Nodes (8): scoreDetails(), digitTokens(), matchPrintedNumber(), parseHp(), Scan-Benchmark mit simulierten Fotos, Messung mit echten Kartenbildern im 57.000er-Katalog, Echtes Foto: Venusaur Base Set 2, Messung mit allen Bisaflor-Varianten

### Community 47 - "Sammlung und Fortschritt"
Cohesion: 0.14
Nodes (19): evaluateAchievements(), cardXp(), RARITY_TIERS, rarityTier(), scoreTrack(), VINTAGE_BEFORE, XP_BY_TIER, registerCollectionRoutes() (+11 more)

### Community 48 - "synthetic-photo.ts"
Cohesion: 0.53
Nodes (5): loadImage(), clipToCanvas(), PhotoOptions, rng(), syntheticPhoto()

### Community 51 - "NAS-Update & Tailscale"
Cohesion: 0.24
Nodes (9): compose(), git_(), log(), PATH, update.sh script, Einrichten und aktualisieren, Katalog und Preise, valUE auf der Synology (Docker) und über Tailscale (+1 more)

### Community 53 - "sync.ts"
Cohesion: 0.13
Nodes (25): DbClient, ExportPrintingRow, PriceSource, runPopulationSync(), applyPrices(), bumpCatalogVersion(), numberSort(), priceTargets() (+17 more)

### Community 63 - "profil/index.tsx"
Cohesion: 0.10
Nodes (35): APPEARANCE, levelProgress(), styles, styles, View_, VIEWS, RowProps, styles (+27 more)

### Community 66 - "real-scan-benchmark.ts"
Cohesion: 0.11
Nodes (17): CatalogVersion, createCatalogVersion(), identifyCard(), FINGERPRINT_DIM, BenchCard, { cards, photos }, COMMON, db (+9 more)

### Community 70 - "Web-Tab-Leiste"
Cohesion: 0.23
Nodes (13): AppTabs(), Bar(), Narrow, ScanButton(), styles, TabButton(), useNarrow(), WebSymbol (+5 more)

## Knowledge Gaps
- **13 isolated node(s):** `expo/tsconfig.base`, `./tsconfig.json`, `PATH`, `Rate-Limit-Zähler in Redis (offen)`, `Erkennung auf dem Gerät (Apple Vision / ML Kit)` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 350 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `scripts` connect `Server-Skripte` to `Server-Abhängigkeiten`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `./tsconfig.json`, `PATH` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AppText` be split into smaller, more focused modules?**
  _Cohesion score 0.1484848484848485 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `currency.tsx` to `AppText`, `Scanner-Oberfläche`, `appearance.tsx`, `Kamera und Zuschnitt`, `Web-Tab-Leiste`, `dependencies`, `mobile/package.json`, `queries.ts`, `[cardId].tsx`, `profil/index.tsx`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Should `app.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10344827586206896 - nodes in this community are weakly interconnected._
- **Why does `fastify` connect `app.ts` to `scan.ts`, `identify.ts`, `portfolio.ts`, `routes/catalog.ts`, `Server-Abhängigkeiten`, `Sammlung und Fortschritt`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Should `appearance.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07954545454545454 - nodes in this community are weakly interconnected._