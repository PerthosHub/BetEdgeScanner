// FILE: _BES_ARCHITECTUUR.md
# 🏗️ ARCHITECTUUR: BetEdge Scanner (Extensie)
Versie: 2.1.0
Datum: 31 Jan 2026

================================================================================
1. COMPONENTEN & VERANTWOORDELIJKHEDEN
================================================================================

### A. Background Worker (`src/background/`) - HET BREIN
Gesplitst in 4 modules om "God Files" te voorkomen en onderhoud te vergemakkelijken:

1.  **sessieBeheer.ts:** Beheert de auth-state van `scanner@betedge.local`. Verantwoordelijk voor het leveren van een geldige `user_id` voor elke schrijfactie.
2.  **configuratieLader.ts:** Haalt de broker-lijst op uit de DB. Gebruikt strikte snake_case mapping (`is_active`, `group_name`). Cachet data in `chrome.storage.local`.
3.  **scanVerwerker.ts:** De dirigent. Coördineert de binnenkomende data, roept de auth-check aan, en voert de Mirror Strategy uit (dupliceren van data naar slave-brokers).
4.  **databaseSchrijver.ts:** De "vulleiding". Verantwoordelijk voor de 'Bon-en-Regels' strategie: eerst een `odds_capture` (de bon) en daarna de `odds_lines` (de regels).

### B. Content Scripts (`src/content/`) - DE OGEN
- **index.ts (Router):** Herkent de website en activeert de juiste parser. Bevat de `MutationObserver` met debounce (2s) om de browser-performance te bewaken.
- **[broker].ts:** Bevat de unieke DOM-selectors voor één specifieke site (bijv. `unibet.ts`, `toto.ts`). Levert data aan in het 'Universele Formaat'.

================================================================================
2. DATA FLOW & INTEGRITEIT
================================================================================

1.  **Detectie:** Content Script ziet een wijziging op de pagina.
2.  **Transport:** `ODDS_DATA` bericht gaat naar de Background Service Worker.
3.  **Audit:** `scanVerwerker` haalt de actuele `user_id` op. Elke database-rij krijgt dit ID mee voor tracking.
4.  **Mapping:** Data wordt van camelCase (JS) vertaald naar snake_case (PostgreSQL):
    - `odds1` -> `odds_1`
    - `homeNameRaw` -> `home_name_raw`
5.  **Opslag:** Gebruik van `insert()` (geen upsert) om conflicten te vermijden, aangezien elke scan-ronde unieke `capture_id` records genereert.

================================================================================
3. PROFESSIONELE STANDAARDEN
================================================================================
- **Versiebeheer:** Gebruik van SemVer (vX.Y.Z) via `src/version.ts`. De Manifest-versie is hieraan gekoppeld via Vite.
- **State Management:** Background variabelen zijn verboden. Gebruik uitsluitend `chrome.storage.local` voor persistentie tussen browser-sessies.
- **Error Handling:** Elke module bevat try/catch blokken die fouten doorsluizen naar de `voegLogToe` utility voor zichtbaarheid in de Popup Terminal.

================================================================================
4. BESTANDSSTRUCTUUR
================================================================================
src/
├── 📂 background/          
│   ├── index.ts            # Ingangspunt (Listener)
│   ├── sessieBeheer.ts     # Auth / JWT
│   ├── configuratieLader.ts # Broker config
│   ├── scanVerwerker.ts    # Business Logica / Mirrors
│   └── databaseSchrijver.ts # Supabase Inserts
├── 📂 content/             
│   ├── index.ts            # Site Router
│   ├── unibet.ts           # Kambi Parser
│   └── toto.ts             # Bottom-Up Parser
├── 📂 lib/
│   └── supabase.ts         # Client Config
├── 📂 utils/
│   ├── storage.ts          # Logging & Stats
│   └── date.ts             # Formatting
├── types.ts                # Shared Kernel Definities
└── version.ts              # Single Source of Truth voor Versie