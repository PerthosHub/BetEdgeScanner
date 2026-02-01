// FILE: _ECOSYSTEM.md
# 🌍 BETEDGE ECOSYSTEM (SHARED KERNEL)
Versie: 3.3 (Linked Types Update)
Laatste Update: 31 Jan 2026

================================================================================
📊 SYSTEEM STATUS & VERSIES
================================================================================

🅰️  **APP: BetEdge Pro (BEP)**
    - TYPE:   Web Applicatie (De Consument)
    - VERSIE: v3.19
    - STATUS: ✅ Actief & In Sync

🅱️  **APP: BetEdge Scanner (BES)**
    - TYPE:   Browser Extensie (De Leverancier)
    - VERSIE: v2.1.0
    - STATUS: ✅ Actief & In Sync

⚠️  SYSTEEM SETUP (CRUCIAAL):
    De volgende bestanden zijn via een **Hard Link** fysiek gekoppeld. 
    Wijzigingen in het ene project zijn DIRECT zichtbaar in het andere:
    1. `_ECOSYSTEM.md` (Business Rules & DB Schema)
    2. `src/types.ts`  (Technische Definities & Interfaces)

================================================================================
🏗️ 1. BESTANDSSTRUCTUUR (SCANNER SPECIFIEK)
================================================================================

📂 `src/`
├── 📂 `background/`          # De kern (Service Worker) - Draait op de achtergrond
│   ├── 📄 `index.ts`         # Ingangspunt: Luistert naar berichten van websites.
│   ├── 📄 `sessieBeheer.ts`  # Beveiliging: Regelt Auth & User ID voor Supabase.
│   ├── 📄 `configuratie.ts`  # Instellingen: Haalt broker-lijst op uit de database.
│   ├── 📄 `scanVerwerker.ts` # Logica: Coördineert data & Mirror Strategy.
│   └── 📄 `database.ts`      # Schrijver: Verantwoordelijk voor de SQL inserts.
│
├── 📂 `content/`             # De 'Ogen' - Draait direct op de bookmaker site
│   ├── 📄 `index.ts`         # Router: Herkent de URL en kiest de juiste scanner.
│   ├── 📄 `unibet.ts`        # Parser: Specifieke instructies voor Kambi sites.
│   └── 📄 `toto.ts`          # Parser: Specifieke instructies voor TOTO.
│
├── 📂 `lib/`                 # Koppelingen: Bevat o.a. de Supabase Client.
├── 📂 `utils/`               # Hulptools: Voor tijdnotaties, logs en opslag.
├── 📄 `types.ts`             # Definities: De gedeelde taal tussen BEP en BES.
└── 📄 `version.ts`           # Versiebeheer: De 'Single Source of Truth' voor de versie.

================================================================================
💾 2. DATABASE ARCHITECTUUR & VELDBEGRIP
================================================================================

De database werkt via een **Parent-Child** relatie (Ouder-Kind). Voor elke scanronde 
wordt er één 'Ouder' gemaakt en meerdere 'Kinderen'.

### 🟢 GROEP A: SCAN MANAGEMENT (De Data-stroom)

**Tabel: `odds_captures` (De Sessie / Ouder)**
Bevat de algemene informatie over het moment van scannen.
- `id`           : Unieke UUID die de hele scanronde identificeert.
- `broker_id`    : De unieke code van de bookmaker (bijv. 'toto-nl').
- `sport`        : De categorie (bijv. 'Voetbal', 'Tennis').
- `captured_at`  : Exacte tijdstip van opslag.
- `user_id`      : ID van de scanner-account (voor audit-doeleinden).

**Tabel: `odds_lines` (De Wedstrijdgegevens / Kind)**
Bevat de feitelijke odds. Deze regels zijn gekoppeld aan de `capture_id`.
- `home_name_raw`: De naam van de thuisploeg zoals de website deze toont.
- `home_name_norm`: De 'schone' naam. BES laat dit LEEG; BEP vult dit in.
- `odds_1, _x, _2`: De numerieke quoteringen (bijv. 1.87).
- `external_event_id`: De unieke ID van de bookmaker voor deze wedstrijd.
- `is_live`      : Boolean (true/false). Geeft aan of de wedstrijd bezig is.
- `event_url`    : De directe link naar de wedstrijd voor snelle navigatie.

---

### 🔵 GROEP B: CONFIGURATIE & MAPPING

**Tabel: `brokers` (De Bronnen)**
- `group_name`   : Bepaalt de techniek (bijv. 'Kambi' voor Unibet/BetCity).
- `is_active`    : Bepaalt of BEP deze data toont (BES scant ALTIJD).

**Tabel: `team_aliassen` (Het Woordenboek)**
- Koppelt `home_name_raw` aan de `canonical_naam` in de referentie-lijst.
- Zorgt dat de Web App (BEP) begrijpt dat 'AZ' en 'AZ Alkmaar' hetzelfde zijn.

================================================================================
⚙️ 3. BUSINESS REGELS & DATA FLOW
================================================================================

🔄 **STAP 1: Detectie & Transport**
    - Content Scripts gebruiken een `MutationObserver` met 2s debounce.
    - Data wordt asynchroon naar de Background Worker gestuurd.

🧠 **STAP 2: Mirror Strategy (Dupliceren)**
    - Als een 'Master' (bijv. Unibet) wordt gescand, zoekt BES alle andere 
      actieve brokers in dezelfde `group_name` (bijv. 'Kambi').
    - De data wordt automatisch gedupliceerd voor deze brokers (bijv. BetCity).
    - BES negeert de `is_active` status; hij vult de database altijd.

✍️ **STAP 3: Transactionele Opslag**
    - Er wordt gewerkt met **Insert-Only**. Data wordt nooit overschreven.
    - Elke scanronde genereert een nieuwe `capture_id` voor 100% historie.
    - Retentie: Data ouder dan 24 uur wordt in de toekomst automatisch verwijderd.

================================================================================
📝 4. CODING STANDAARDEN
================================================================================

🔠 **NAAMGEVING (Casing)**
    - DATABASE:  `snake_case` (klein_met_underscores) voor alle kolommen.
    - CODE:      `camelCase` (kleineBeginletter) voor TypeScript variabelen.
    - BES:       Vertaalt bij opslag `homeNameRaw` naar `home_name_raw`.

🇳🇱 **TAALGEBRUIK**
    - DOMEIN:    Alle logica, logs en documentatie zijn in het **Nederlands**.
    - TECH:      Frameworks, API's en bibliotheken blijven **Engels**.

🔐 **BEVEILIGING**
    - De scanner gebruikt de account `scanner@betedge.local`.
    - Elke schrijfactie wordt gelogd met het bijbehorende `user_id`.


// FILE: _ECOSYSTEM.md
// (Voeg dit toe aan het EINDE van het bestand)

================================================================================
🧩 7. FUNCTIONALITEITEN: STATUS & VISIE
================================================================================

In dit hoofdstuk beschrijven we de werking in menselijke taal. Dit dient als 
extra controle voor de AI: komt de code overeen met het verhaal van Johan?

✅ HUIDIGE STATUS (WAT HET NU DOET)
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

🚀 GEWENSTE SITUATIE (WAAR WE HEEN GAAN)
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

================================================================================
🧩 FLOW CODER REFERENTIE (PRAKTIJKVOORBEELD)
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