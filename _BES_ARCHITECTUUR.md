# 🏗️ ARCHITECTUUR: BetEdge Scanner (Extensie)
Versie: 2.3 (Modulaire Background & Multi-Broker Ogen)
Datum: 30 Jan 2026

================================================================================
1. COMPONENTEN & VERANTWOORDELIJKHEDEN
================================================================================

### A. Background Worker (`src/background/`) - HET BREIN
Gesplitst in 4 gespecialiseerde modules om "God Files" te voorkomen:

1.  **sessieBeheer.ts:** Beheert de login van `scanner@betedge.local`. Garandeert een geldige JWT-token voor Supabase.
2.  **configuratieLader.ts:** Haalt actieve brokers en mirror-instellingen op uit de DB en cachet deze in `chrome.storage.local`.
3.  **scanVerwerker.ts:** De coördinator. Ontvangt data, bepaalt welke mirrors actief zijn en stuurt opdrachten naar de schrijver.
4.  **databaseSchrijver.ts:** Bevat de pure Supabase SQL-logica voor `odds_captures` en `odds_lines`.

### B. Content Scripts (`src/content/`) - DE OGEN
- **index.ts (Router):** Checkt de URL en activeert de juiste broker-specifieke parser.
- **[broker].ts:** Elk bestand bevat de unieke logica voor één specifieke website (bijv. `unibet.ts`, `toto.ts`). Dit maakt troubleshooting simpel als een site-layout wijzigt.

================================================================================
2. DATA FLOW (MODULAIR)
================================================================================

1.  **Detectie:** Content Script ziet wijziging via `MutationObserver`.
2.  **Bericht:** Content Script stuurt `ODDS_DATA` naar `background/index.ts`.
3.  **Autorisatie:** `scanVerwerker` vraagt `sessieBeheer` om een geldige User ID.
4.  **Configuratie:** `scanVerwerker` checkt bij `configuratieLader` welke broker bij de URL hoort en of er mirrors nodig zijn.
5.  **Opslag:** `databaseSchrijver` voert de transacties uit in Supabase.

================================================================================
3. BESTANDSSTRUCTUUR
================================================================================
src/
├── 📂 background/          
│   ├── index.ts            # Router / Ingangspunt
│   ├── sessieBeheer.ts     # Auth & Login
│   ├── configuratieLader.ts # Broker config & Caching
│   ├── scanVerwerker.ts    # Business Logica & Mirrors
│   └── databaseSchrijver.ts # Supabase interactie
├── 📂 content/             
│   ├── index.ts            # URL Router
│   ├── unibet.ts           # Parser voor Kambi-sites
│   └── toto.ts             # Parser voor TOTO (Bottom-Up)
├── 📂 lib/
│   └── supabase.ts         # Client configuratie
└── types.ts                # Shared Kernel Definities