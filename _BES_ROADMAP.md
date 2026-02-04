// FILE: _BES_ROADMAP.md
# 🗺️ ROADMAP: BetEdge Scanner (Extensie)
Status: Fase 4 - Multi-Broker & Monitoring 🚀
Huidige Versie: 2.3.1
Datum: 04 Feb 2026

---

## ✅ LAATST AFGEROND
 [x] **v2.3.0: Flight Tower:** Live monitoring tabblad (`monitor.html`) toegevoegd voor real-time debugging zonder console-logs.
- [x] **v2.3.0: Heartbeat Protocol:** Database updates via `last_seen_at` om data-versheid te garanderen in BEP.
- [x] **v2.2.1: Stealth Mode:** Alle visuele indicatoren (groene randen) en publieke console.logs verwijderd.
- [x] **v2.2.0: Multi-Broker:** Circus & TonyBet parsers volledig operationeel.
- [x] **v2.1.0: Refactor:** `src/content/utils.ts` geïntroduceerd voor gedeelde parser-logica.

- [x] **Circus Integratie:** Volledige ondersteuning voor Circus.nl (Gaming1 platform) via stabiele `data-testid` selectors.
- [x] **TonyBet Integratie:** Parser toegevoegd voor TonyBet via `data-test` attributen.
- [x] **TOTO 'Bulletproof' Fix:** Oplossing voor het "12,27" odds probleem door overstap naar index-based button selectie.
- [x] **Router Expansie:** `content/index.ts` herkent nu 4 unieke domeinen en stuurt de juiste parser aan.
- [x] **Mapping Layer:** Fix voor `[object Object]` in database en herstel van broker namen.
- [x] **Mirror Fix:** Actieve synchronisatie van Unibet data naar BetCity (op basis van correcte configuratie).
- [x] **Productie-klaar maken:** Volledige synchronisatie tussen Database, Background en UI met professioneel versiebeheer en GitHub backup.
---

## 🚀 HUIDIGE FOCUS

### 1. 🛡️ Stabiliteit van de Flight Tower
*   **Doel:** Zorgen dat de live-stream niet crasht bij zeer hoge scan-frequenties (bijv. 100+ matches).
*   **Actie:** Testen van de `Set<Port>` logica in `logCentrum.ts`.

### 2. 📉 Performance Monitoring
*   **Doel:** Meten of de `MutationObserver` op zware pagina's (zoals de Circus homepage) te veel CPU verbruikt.
*   **Actie:** TRACE logs analyseren op "Scan Idle" loops.


### 2. 🛡️ Data Integriteit & Opschoning
*   **Doel:** Voorkomen dat "verweesde" odds in de database blijven staan (wedstrijden die afgelopen zijn of verwijderd).
*   **Actie:** Ontwikkelen van een 'cleanup' signaal of TTL (Time To Live) strategie in de database.

### 2. 🧪 Stabiliteits Monitor
*   **Doel:** Monitoren hoe de nieuwe parsers zich houden tijdens live wedstrijden en layout veranderingen.

### 3. 🔗 Shared Kernel
*   **Doel:** Datum-logica synchroniseren met BEP.
*   **Status:** ✅ VOLTOOID via fysieke Hard Link.


---

## 🔮 BACKLOG (TOEKOMST)
- [ ] **Live Detectie:** Herkennen van 'LIVE' badges voor aparte filtering (nu filteren we ze hard weg).
- [ ] **Error Recovery:** Automatisch herladen van gecrashte of bevroren tabbladen.
- [ ] **Multi-Tab Orchestration:** Voorkomen dat meerdere open tabs van dezelfde broker tegelijk schrijven.

- [ ] **Remote Config:** Mogelijkheid om parsers te updaten zonder de extensie opnieuw te hoeven builden.
- [ ] **Visual Diff Highlighter:** In de Monitor pagina specifiek laten zien *welke* odd precies veranderde (bijv. "Ajax 1.8 -> 1.85" in kleur).
- [ ] **Auto-Cleanup:** Background script triggeren om database records ouder dan 24u op te ruimen.


---

## 📜 CHANGELOG (Laatste wijzigingen eerst)

### [2.3.1] - 2026-02-04
**"Ecosystem Sync"**
- **TECH:** Types en date.ts gesynchroniseerd met BEP v3.21.0.
- **DOC:** Grondwet bijgewerkt naar v3.5.

### [2.3.0] - 2026-02-03
**"The Flight Tower Update"**
- **FEAT:** **Monitor Tab:** Nieuwe UI op `src/monitor/monitor.html` toont live logs van alle tabs.
- **FEAT:** **Broadcasting:** Background script fungeert nu als radio-hub tussen Content en Monitor.
- **FEAT:** **Heartbeat:** Verstuurt elke 30s een teken van leven naar Supabase voor actieve sessies.
- **FIX:** **Stealth Mode:** Volledige verwijdering van CSS borders en console-vervuiling.
- **TECH:** **Vite Config:** Multi-input build toegevoegd voor popup en monitor.

### [2.2.0] - 2026-02-02
**"The Expansion Pack"**
- **FEAT:** **Circus Parser:** Toegevoegd met ondersteuning voor Prematch filtering via `data-testid="event-summary-prematch"`.
- **FEAT:** **TonyBet Parser:** Toegevoegd met ondersteuning voor datum-parsing en odds-extractie.
- **FIX:** **TOTO Parser:** Herschreven naar v3.4. Gebruikt nu `button[index="0"]` selector om te voorkomen dat labels ("1") en odds ("2,27") aan elkaar geplakt worden (`textContent` bug). Tevens 3-Weg detectie verbeterd.
- **TECH:** **Manifest Update:** Permissies uitgebreid naar `*.circus.nl` en `*.tonybet.nl`.

### [2.1.1] - 2026-02-01
**"The Mapping Patch"**
- **FIX:** Data Flow Hersteld: Broker-namen en IDs worden nu expliciet als strings verstuurd (voorkomt `broker_name: null` en JSON-in-ID fouten).
- **FIX:** Mirror Logica: De scanner herkent nu correct de `group` en `isActive` status uit de configuratie, waardoor BetCity weer updates ontvangt.
- **TECH:** Config Cache Flush: Forceert een schone start bij updates (`onInstalled`) om oude, incomplete configuraties uit `chrome.storage` te wissen.

### [2.1.0] - 2026-01-31
**"The Database & Integrity Update"**
- **FIX:** Database Schrijffout (42P10) opgelost door `upsert` te vervangen door `insert` (geen extra DB-constraints nodig).
- **FIX:** Database Schema Sync: Alle code aangepast naar Snake_Case (`is_active`, `group_name`, `odds_1`, `user_id`).
- **FIX:** Type Safety: Mismatches tussen `Broker` objecten en `string` ID's in de background afgehandeld.
- **FEAT:** GitHub Integratie: Project succesvol gekoppeld aan private repository voor versiebeheer.
- **FEAT:** Centraal Versiebeheer: Implementatie van `src/version.ts` als 'Single Source of Truth'.
- **FEAT:** UI Update: Versienummer en status-label nu zichtbaar in de Popup Header.
- **DOC:** Ecosysteem geüpdatet naar v2.5 (Auditability & Transactionele regels).

### [2.0.0] - 2026-01-30
**"The Great Modular Refactor"**
- **REFACTOR:** Background script volledig opgesplitst in 4 logische modules (Sessie, Config, Verwerking, Database).
- **MV3:** Overgestapt naar `chrome.storage.local` voor broker-configuratie (Manifest V3 persistentie).
- **FEAT:** Mirror Strategy: Werkende automatische spiegeling van Kambi-data naar BetCity/Jack's op basis van broker-groepen.
- **LOGGING:** Nieuwe Terminal view in de popup met kleurgecodeerde logs voor real-time debugging.
- **TYPES:** Chrome API types (`chrome.runtime`, `chrome.storage`) volledig geïmplementeerd.

---
*Roadmap bijgewerkt door AI Architect op 31 Jan 2026.*