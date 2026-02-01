// FILE: _BES_ROADMAP.md
# 🗺️ ROADMAP: BetEdge Scanner (Extensie)
Status: Fase 3d - Stabiliteit & Versiebeheer
Huidige Versie: 2.1.0
Datum: 31 Jan 2026

---

## ✅ LAATST AFGEROND
- [x] **Mapping Layer:** Fix voor `[object Object]` in database en herstel van broker namen.
- [x] **Mirror Fix:** Actieve synchronisatie van Unibet data naar BetCity (op basis van correcte configuratie).
- [x] **Productie-klaar maken:** Volledige synchronisatie tussen Database, Background en UI met professioneel versiebeheer en GitHub backup.
---

## 🚀 HUIDIGE FOCUS

### 1. 🛠️ Content Script Refactor (De "Ogen")
*   **Doel:** Dezelfde modulariteit als in de background toepassen op de content scripts.
*   **Actie:** `index.ts` (de router) opschonen. Zorgen dat elke broker-parser (Unibet, TOTO) een strikt eigen bestand houdt zonder overlap.

### 2. 🛡️ Data Integriteit & Opschoning
*   **Doel:** Voorkomen dat "verweesde" odds in de database blijven staan.
*   **Actie:** Ontwikkelen van een 'cleanup' signaal; als een wedstrijd niet meer in de DOM staat, moet dit gemeld kunnen worden aan de database.

---

## 🔮 BACKLOG (TOEKOMST)
- [ ] **Live Detectie:** Herkennen van 'LIVE' badges voor aparte filtering.
- [ ] **Error Recovery:** Automatisch herladen van gecrashte of bevroren tabbladen.
- [ ] **Multi-Tab Orchestration:** Voorkomen dat meerdere open tabs van dezelfde broker tegelijk schrijven.

---

## 📜 CHANGELOG (Laatste wijzigingen eerst)

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