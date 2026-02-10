// FILE: _ECOSYSTEM.md
# 🌍 BETEDGE ECOSYSTEM (SHARED KERNEL)
Versie: 3.7 (Calculations Freeze & Build Stability)
Laatste Update: 10 Feb 2026

================================================================================
📊 SYSTEEM STATUS & VERSIES
================================================================================

🅰️  **APP: BetEdge Pro (BEP)**
    - TYPE:   Web Applicatie (De Consument)
    - VERSIE: v3.24.0
    - STATUS: ✅ Actief & In Sync (Tests Groen: 18/18)

🅱️  **APP: BetEdge Scanner (BES)**
    - TYPE:   Browser Extensie (De Leverancier)
    - VERSIE: v2.5.0
    - STATUS: ✅ Actief & In Sync (Build: OK)

⚠️  SYSTEEM SETUP (CRUCIAAL):
    De volgende bestanden zijn via een **Hard Link** fysiek gekoppeld tussen beide projecten. 
    Wijzigingen in het ene project zijn DIRECT zichtbaar in het andere:
    1. `_ECOSYSTEM.md` (Business Rules & DB Schema)
    2. `src/types.ts`  (Technische Definities & Interfaces)

================================================================================
🏗️  1. ARCHITECTUUR & BESTANDSSTRUCTUUR
================================================================================

### 🟢 1A. BETEDGE SCANNER (BES)
*Doel: Data verzamelen, normaliseren en wegschrijven naar de DB.*

📂 `src/`
├── 📂 `background/`          # De kern (Service Worker) - Draait op de achtergrond
│   ├── 📄 `index.ts`         # Ingangspunt: Luistert naar berichten van websites.
│   ├── 📄 `sessieBeheer.ts`  # Beveiliging: Regelt Auth & User ID voor Supabase.
│   ├── 📄 `configuratie.ts`  # Instellingen: Haalt broker-lijst op uit de database.
│   ├── 📄 `scanVerwerker.ts` # Logica: Coördineert data & Mirror Strategy.
│   ├── 📄 `databaseSchrijver.ts` # Schrijver: Verantwoordelijk voor de SQL inserts.
│   └── 📄 `logCentrum.ts`    # Flight Tower: Real-time monitoring hub.
│
├── 📂 `content/`             # De 'Ogen' - Draait direct op de bookmaker site
│   ├── 📄 `index.ts`         # Router: Herkent de URL en kiest de juiste scanner.
│   ├── 📄 `unibet.ts`        # Parser: Kambi sites (Unibet, BetCity).
│   ├── 📄 `toto.ts`          # Parser: TOTO (Nederlandse Loterij).
│   ├── 📄 `circus.ts`        # Parser: Gaming1 platform.
│   └── 📄 `tonybet.ts`       # Parser: SoftLabs platform.
│
├── 📂 `lib/`                 # Koppelingen: Bevat o.a. de Supabase Client.
├── 📂 `utils/`               # Hulptools: Voor tijdnotaties, logs en opslag.
├── 📄 `types.ts`             # Definities: De gedeelde taal tussen BEP en BES.
└── 📄 `version.ts`           # Versiebeheer: De 'Single Source of Truth' voor de versie.

### 🔵 1B. BETEDGE PRO (BEP)
*Doel: Data visualiseren, rekenen en administratie.*

📂 `src/`
├── 📂 `store/`               # Het Geheugen (Zustand)
│   ├── 📄 `useStore.ts`      # De centrale hub
│   └── 📂 `slices/`          # Deelgebieden (Bet, Broker, Promo, Auth...)
├── 📂 `components/`          # De Bouwblokken (React)
│   ├── 📂 `BetStudio/`       # Calculator & Scanner UI
│   ├── 📂 `Promotions/`      # Promotie Beheer
│   └── 📂 `OddsScanner/`     # Data Verwerking UI
├── 📂 `services/`            # De Externe Connecties (Supabase API)
└── 📂 `utils/`               # De Gereedschapskist
    ├── 📄 `calculations.ts`  # De Rekenmachine (Einstein Engine)
    └── 📄 `aiService.ts`     # Screenshot Analyse (Gemini)


---


Deze sectie legt de frontend architectuur van BEP vast zodat *iedereen* de afspraken, technologieën en logische indeling van het webplatform in één oogopslag kent.  
> Hiermee borgen we consistente keuzes, snelle onboarding en voorkomen we afwijkingen tussen codebase & realiteit.  
>
> | Onderdeel                 | Doel / Uitleg                                                              |
> |:------------------------- |:---------------------------------------------------------------------------|
> | **Core**                  | React 18+ (Vite) & TypeScript 5.7+ (Strict) als fundament                  |
> | **State Management**      | Zustand Store in losse 'Slices' voor overzicht & schaalbaarheid            |
> |                           | 1. `createAnalyseSlice`: Filters, View Mode, UI-Toggles                    |
> |                           | 2. `createBetSlice`: Opgeslagen weddenschappen                             |
> |                           | 3. `createBrokerSlice`: Bookmaker beheer                                   |
> |                           | 4. `createCalculatorSlice`: Persistente calculator-invoer                  |
> |                           | 5. `createAuthSlice`: Sessie en RLS context                                |
> | **Design Principes**      | - Validatie externe data bij de poort (Zod/TS)                             |
> |                           | - Strikte scheiding UI & Logica                                            |
> |                           | - PWA ready: Manifest/Service Workers voor installatie als app             |


    
================================================================================
💾 2. DATABASE ARCHITECTUUR & VELDBEGRIP 
================================================================================

De database werkt via een **Parent-Child** relatie (Ouder-Kind). Voor elke scanronde 
wordt er één 'Ouder' gemaakt en meerdere 'Kinderen'.

### 🟢 GROEP 2A: SCAN MANAGEMENT (De Data-stroom)
*De Scanner schrijft hierin, de App leest hieruit.*

**Tabel: `odds_captures` (De Sessie / Ouder)**
Bevat de algemene informatie over het moment van scannen.
- `id`           : Unieke UUID die de hele scanronde identificeert.
- `broker_id`    : De unieke code van de bookmaker (bijv. 'toto-nl').
- `sport`        : De categorie (bijv. 'Voetbal', 'Tennis').
- `captured_at`  : Exacte tijdstip van opslag.
- `user_id`      : ID van de scanner-account (voor audit-doeleinden).

**Tabel: `odds_lines` (De Wedstrijdgegevens / Kind)**
Bevat de feitelijke odds. Deze regels zijn gekoppeld aan de `capture_id`.
- `home_name_raw`    : De naam van de thuisploeg zoals de website deze toont.
- `home_name_norm`   : De 'schone' naam. BES laat dit LEEG; BEP vult dit in.
- `odds_1, _x, _2`   : De numerieke quoteringen (bijv. 1.87).
- `external_event_id`: De unieke ID van de bookmaker voor deze wedstrijd.
- `is_live`          : Boolean (true/false). Geeft aan of de wedstrijd bezig is.
- `event_url`        : De directe link naar de wedstrijd voor snelle navigatie.

---



### 🔵 GROEP 2B: CONFIGURATIE & MAPPING
*Gedeelde kennisbank voor beide apps.*

**Tabel: `brokers` (De Bronnen)**
- `name`         : De weergavenaam (bijv. 'Unibet').
- `website`      : Base URL voor matching (bijv. 'unibet.nl').
- `group_name`   : Identificeert de gedeelde odds-provider (platform) om data automatisch te spiegelen naar zuster-sites en conflicterende inzetten te blokkeren.
- `is_active`    : Bepaalt of BEP deze data toont (BES scant ALTIJD).
- `notes`        : Interne notities.

**Tabel: `team_aliassen` (Het Woordenboek)**
- Koppelt `home_name_raw` aan de `canonical_naam` in de referentie-lijst.
- Zorgt dat de Web App (BEP) begrijpt dat 'AZ' en 'AZ Alkmaar' hetzelfde zijn.

**Tabel: `referentie_teams` (De Golden Records)**
- `canonical_naam`: De officiële, unieke schrijfwijze ("AFC Ajax").
- `sport`: De sportcategorie.

### 🟣 GROEP 2C: GEBRUIKERS DATA (BEP Specifiek)
*Alleen de Web App gebruikt deze tabellen.*

**Tabel: `bet_logs` (Geschiedenis)**
- Opslag van geplaatste weddenschappen (`profit`, `stake`, `mode`).

**Tabel: `promotions` (Definities)**
- Beschrijving van bonussen ("Stort €10, krijg €50").

**Tabel: `user_promotions` (Status)**
- Persoonlijke voortgang (`is_claimed`, `is_placed`, `is_completed`).



================================================================================
⚙️ 3. BUSINESS REGELS & DATA FLOW 
================================================================================



### 🤖 3A. SCANNER LOGICA (BES)

🔄 **STAP 1: Detectie & Transport**
    - Content Scripts gebruiken een `MutationObserver` met 2s debounce.
    - Data wordt asynchroon naar de Background Worker gestuurd.

🧠 **STAP 2: Mirror Strategy (Dupliceren)**
    - Als een 'Master' (bijv. Unibet) wordt gescand, zoekt BES alle andere 
      actieve brokers in dezelfde `group_name` (bijv. 'Kambi').
    - De data wordt automatisch gedupliceerd voor deze brokers (bijv. BetCity).
    - **Regel:** Er wordt alleen gespiegeld naar brokers die `is_active = true` zijn.

✍️ **STAP 3: Transactionele Opslag**
    - Er wordt gewerkt met **Insert-Only**. Data wordt nooit overschreven.
    - Elke scanronde genereert een nieuwe `capture_id` voor 100% historie.
    - Retentie: Data ouder dan 24 uur wordt automatisch verwijderd.


---



### 🧮 3B. REKEN LOGICA (BEP - "Einstein Engine")

🛡️ **Freeze & Regressie:** De rekencore is "bevroren" en gedekt door een uitgebreide vitest suite (`calculations.test.ts`). Geen wijzigingen toegestaan zonder dat alle 18 scenario's groen zijn.

🧠 **Identificatie & Target Lock**
- Nieuwe scans komen binnen met `home_name_raw`.
- BEP checkt `team_aliassen`:  
    - Geen match? -> 🟥 Rood vlaggetje (gebruiker moet koppelen).
    - Wel match? -> Gebruik de `canonical_naam` voor groepering.
- De 'Voorkeursbroker' uit de filters is leidend. Elk scenario begint met een bet bij deze broker; de rest van de hedge wordt hieromheen gebouwd.

⚡ **Brute Force Combinaties (3-Weg)**
- De calculator checkt bij 1-X-2 (drieweg) markten álle mogelijke paren van beschikbare brokers.
- Dit voorkomt dat een broker te vroeg "verbruikt" wordt in een sub-optimale bet.
- **Groeps-Uitsluiting:** voorkomt automatisch combinaties tussen brokers uit dezelfde familie/groep (bijv. Unibet vs BetCity).

🛡️ **Smart Stealth & Safety**
- **Stealth:** Bij het afronden van inzetten berekent de engine per uitkomst of `floor` (omlaag) of `ceil` (omhoog) afronden – naar bijvoorbeeld €12.50 – de hoogste winst oplevert in het slechtste scenario.
- **Conflict:** De calculator staat nooit toe dat je hedged bij een broker uit dezelfde groep (bijv. Unibet vs BetCity).
- Voorkomt realisatie van opvallende "robot-bedragen" zoals exact €12.43.



================================================================================
📝 4. CODING STANDAARDEN
================================================================================


🔠 **NAAMGEVING (Casing)**
    - DATABASE:  `snake_case` (klein_met_underscores) voor alle kolommen.
    - CODE:      `camelCase` (kleineBeginletter) voor TypeScript variabelen.
    - **MAPPING:** Services (in BEP) en Loaders (in BES) fungeren als strikte 'Adapters'. 
      Zij vertalen `group_name` (DB) naar `group` (App) en vice versa.
      Er mag NOOIT `snake_case` in de React UI componenten voorkomen.

🇳🇱 **TAALGEBRUIK**
    - DOMEIN:    Alle logica, logs en documentatie zijn in het **Nederlands**.
    - TECH:      Frameworks, API's en bibliotheken blijven **Engels**.

🔐 **BEVEILIGING**
    - De scanner gebruikt de account `scanner@betedge.local`.
    - Elke schrijfactie wordt gelogd met het bijbehorende `user_id`.


### 4A. De Gatekeeper (Import Poortwachter)
Bij het importeren van screenshots (`ScreenshotInvoerModal`) checkt de app namen tegen de database:
- 🟢 **Groen (Matched):** Bekend team of alias. Geen actie nodig.
- 🟡 **Geel (Suggestion):** Waarschijnlijke match. Wordt **automatisch geaccepteerd** bij opslaan (auto-alias).
- 🔵 **Blauw (New):** Wordt als nieuw Master Record aangemaakt.
- 🔴 **Rood (Unknown):** Onbekend, wordt als nieuw Master Record aangemaakt indien gebruiker opslaat.
- **Sync:** `masterSync.ts` verwerkt deze statussen bij het opslaan naar de database.

### 4B. Bet Studio Werkwijze
De Bet Studio is de centrale hub voor al je scans en berekeningen.

**Wedstrijden Koppelen (Merging)**
- **Doel:** Handmatig samenvoegen van verschillende schrijfwijzen (bijv. "Ajax" en "AFC Ajax") direct vanuit de lijst.
- **Logica:** Gebruiker selecteert meerdere matches; `pairMatchesInline` maakt aliassen aan voor alle bron-teams naar het doel-team.

**Personal Mode (Mijn Scans)**
- **Kleur:** Slate / Emerald thema.
- **Inzet:** Rekent met het in de filters ingestelde bedrag.
- **Doel:** Je eigen gevonden bets of scans van de extensie verwerken.
- **Filter:** Toont scans van de laatste X minuten (standaard 20).

**Modus 2: Leads (QuickScan / OddsBeater)**
- **Kleur:** Indigo thema en logo's.
- **Inzet:** Rekent ALTIJD met **vaste inzet van €10**.
- **Doel:** Razendsnel waarde checken in gedeelde scans van aggregators.




================================================================================
🏗️ 5. ARCHITECTURALE PRINCIPES (HET MOEDERSCHIP)
================================================================================



1. **BEP is de Baas:** BetEdge Pro beheert de `brokers` tabel. De scanner (BES) is volgend en gebruikt de configuratie die BEP instelt.
2. **Logic Separation:** UI-componenten bevatten GEEN business logica. 
   - Berekeningen horen in `src/utils/`.
   - State en acties horen in `src/store/`.
   - Complexere UI-logica hoort in `src/hooks/`.
3. **Data Integrity:** 
   - Gebruik uitsluitend `src/services/` voor interactie met Supabase.
   - Gebruik **Zod** schema's voor validatie van externe data (AI-output of Scanner-data).
   - Gebruik uitsluitend de types uit `src/types.ts`. Het gebruik van `any` is verboden.
4. **Performance:** Voorkom "Select All" queries op grote tabellen. Gebruik altijd tijdfilters (`.gt`) of specifieke ID-filters.
5. **Versiebeheer:** 
   - Bij nieuwe features: Update `_BEP_ROADMAP.md` (intern) en `src/constants/versions.ts` (zichtbaar voor gebruiker).



================================================================================
🧩 6. FUNCTIONALITEITEN: STATUS & VISIE 
================================================================================




In dit hoofdstuk beschrijven we de werking in menselijke taal. Dit dient als 
extra controle voor de AI: komt de code overeen met het verhaal van Johan?

✅ BES: HUIDIGE STATUS (WAT HET NU DOET)
--------------------------------------------------------------------------------
1. **Herkenning:** Bij het bezoeken van een URL (bijv. Unibet.nl) checkt BES in 
   de lokale configuratie of deze site ondersteund wordt.
2. **Scanning:** De 'Ogen' lezen de pagina. Momenteel werkt dit volledig voor 
   Unibet (Kambi-structuur) en experimenteel voor TOTO.
3. **Data Opslag:** Gevonden wedstrijden en odds worden direct als 'Rauwe Data' 
   in Supabase opgeslagen (`odds_captures` & `odds_lines`).
4. **Mirroring:** Data van Unibet wordt automatisch gekopieerd naar BetCity 
   (indien actief), omdat zij dezelfde odds-provider (Kambi) delen.
5. **Feedback:** De gebruiker ziet via de extensie-popup een terminal-log met 
   wat de scanner op de achtergrond uitvoert.

🚀 BES: GEWENSTE SITUATIE (WAAR WE HEEN GAAN)
--------------------------------------------------------------------------------
1. **Universele Detectie:** De scanner herkent automatisch elke goksite die in 
   de database staat, ongeacht de structuur.
2. **Rijke Data:** Naast namen en odds, haalt de scanner ook slimme context op:
   - De exacte speeldatum en tijd.
   - De Sport en Competitie (League).
3. **Flexibiliteit:** Probleemloze verwerking van zowel 2-Weg (Winst/Verlies) 
   als 3-Weg (Winst/Gelijk/Verlies) markten.
4. **Ultimate Stealth:** De scanner doet zijn werk onzichtbaar, zonder de 
   browser te vertragen of anti-bot systemen te alarmeren.


---



✅ BEP: HUIDIGE STATUS (WAT HET NU DOET)
--------------------------------------------------------------------------------
1. **Live Feed:** De app luistert realtime naar de `odds_lines` tabel. Nieuwe
   scans verschijnen direct in de "Bet Studio".
2. **Koppelen:** Als namen niet herkend worden, kan de gebruiker deze koppelen 
   aan een "Master Team" via de Alias Manager.
3. **Rekenen:** De gebruiker kiest een strategie (Freebet/Arbitrage). De app
   berekent live de winst op basis van de beschikbare odds uit de database.
4. **Promoties:** Bij het opslaan checkt de app of er actieve bonussen zijn 
   die aan de voorwaarden voldoen en vinkt deze af.

🚀 BEP: GEWENSTE SITUATIE (WAAR WE HEEN GAAN)
--------------------------------------------------------------------------------
1. **AI-Assisted Matching:** De app herkent via fuzzy matching en AI patronen 
   automatisch 95% van de inkomende teamnamen. Handmatig koppelen is een uitzondering.
2. **Bankroll & Stealth Tracking:** 
   - Automatisch bijhouden van saldi per bookmaker op basis van geplaatste bets.
   - Een "Stealth Score" adviseert over veilige inzetbedragen per broker om 
     restricties (gubbings, oftewel het beperken of uitsluiten van je account door een bookmaker omdat je te slim of te winstgevend inzet) te voorkomen.
3. **Community Intelligence:** Een gedeelde (geanonimiseerde) database van 
   geverifieerde aliassen zorgt dat het systeem elke dag slimmer wordt voor iedereen.





================================================================================
🧩 7. FLOW CODER REFERENTIE (PRAKTIJKVOORBEELD)
================================================================================

In dit scenario scant de Extensie (BES) de website van **Unibet** en vindt 
3 voetbalwedstrijden. Zo ziet de data eruit in de database:

---
### 🟦 STAP 1: De Ouder-rij (Tabel: `odds_captures`)
Er wordt eerst één rij gemaakt die vertelt: "Dit is een Unibet scan op dit moment".

- `id`           : `uuid-111-222` (Dit nummer koppelt alles aan elkaar)
- `broker_id`    : `unibet-nl`
- `sport`        : `Voetbal`
- `captured_at`  : `2026-01-31 16:30:05`
- `user_id`      : `scanner-bot-id`

---
### 🟧 STAP 2: De Kind-rijen (Tabel: `odds_lines`)
Daarna worden de 3 wedstrijden toegevoegd. Let op: ze gebruiken allemaal 
dezelfde `capture_id` van hierboven.

**Wedstrijd 1:**
- `capture_id`       : `uuid-111-222`
- `external_event_id`: `un-9901`
- `home_name_raw`    : `AZ`
- `away_name_raw`    : `N.E.C. Nijmegen`
- `odds_1` / `_x` / `_2`: `1.87` / `4.25` / `3.60`
- `is_live`          : `false`

**Wedstrijd 2:**
- `capture_id`       : `uuid-111-222`
- `external_event_id`: `un-9902`
- `home_name_raw`    : `PEC Zwolle`
- `away_name_raw`    : `Telstar`
- `odds_1` / `_x` / `_2`: `2.47` / `3.70` / `2.90`
- `is_live`          : `false`

**Wedstrijd 3:**
- `capture_id`       : `uuid-111-222`
- `external_event_id`: `un-9903`
- `home_name_raw`    : `Ajax`
- `away_name_raw`    : `Feyenoord`
- `odds_1` / `_x` / `_2`: `2.10` / `3.50` / `3.20`
- `is_live`          : `false`

---
### 💡 WAT GEBEURT ER NU IN DE FLOW?
1. **BES (Extensie):** Heeft zijn taak volbracht. De database is gevuld met rauwe data.
2. **BEP (Web App):** Ziet de nieuwe `odds_lines`. 
3. **De Matcher:** BEP ziet bij Wedstrijd 1: `home_name_raw: "AZ"`. 
4. **De Koppeling:** BEP kijkt in de tabel `team_aliassen` en vindt: `"AZ" = "AZ Alkmaar"`.
5. **Het Resultaat:** Op jouw dashboard verschijnt nu netjes: **AZ Alkmaar vs N.E.C.** met de odds van Unibet.