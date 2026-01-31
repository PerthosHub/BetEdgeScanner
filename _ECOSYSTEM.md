// FILE: _ECOSYSTEM.md
# 🌍 BETEDGE ECOSYSTEM (SHARED KERNEL)
Ecosysteem Versie: 2.5
Laatste Update: 31 Jan 2026

| Applicatie | Minimale Versie | Status |
| :--- | :--- | :--- |
| 🅰️ BetEdge Pro (BEP) | v3.19 | In Sync |
| 🅱️ BetEdge Scanner (BES) | v2.1.0 | In Sync |

> **⚠️ SYSTEEM SETUP:** Dit bestand is fysiek gekoppeld tussen BEP en BES. 
> Wijzigingen hier hebben direct impact op de logica van beide apps.

> **⚠️ SYSTEEM SETUP:** Dit bestand is via een **Hard Link** fysiek gekoppeld tussen de `BetEdgePro` en `BetEdgeScanner`. 
> *Actie:* Wijzigingen zijn direct overal zichtbaar.

================================================================================
1. DE APPLICATIES & ROLLEN
================================================================================

🅰️ **BETEDGE PRO (BEP) - "Het Moederschip"**
- **Rol:** De "Master". Bepaalt configuratie (welke brokers bestaan, wie spiegelt wie).
- **Beheer:** Beheert de `brokers` tabel die de scanner aanstuurt.

🅱️ **BETEDGE SCANNER (BES) - "De Vrachtwagen"**
- **Rol:** De "Leverancier". Leest config van BEP via de `brokers` tabel.
- **Versiebeheer:** Maakt gebruik van SemVer (v2.x.x) en een centrale `version.ts`.
- **Opslag:** Levert data aan `odds_captures` en `odds_lines`.

================================================================================
2. DATABASE & DATA FLOW (STRIKT SCHEMA)
================================================================================
- **Single Source of Truth:** De scanner schrijft direct naar Supabase.
- **Naamgeving:** We hanteren strikt de Database Snake_Case (bijv. `is_active`, `group_name`, `odds_1`).
- **Auditability:** Elke rij in `odds_captures` en `odds_lines` MOET een `user_id` bevatten van de scanner-account (`scanner@betedge.local`).
- **Transactionele Integriteit:** 
  1. Maak eerst een `odds_capture` aan.
  2. Gebruik de geretourneerde `capture_id` voor alle gerelateerde `odds_lines`.
  3. Gebruik `insert` voor lines; `upsert` is alleen toegestaan als er een Unique Constraint (`capture_id`, `external_event_id`) aanwezig is.

================================================================================
3. BUSINESS REGELS (GEDEELD)
================================================================================

**A. Mirror Strategy (Group-Based)**
De scanner dupliceert data van 'Masters' naar 'Slaves' op basis van de `group_name` in de `brokers` tabel. 
*Voorbeeld:* Een scan op Unibet (Kambi) wordt automatisch ook opgeslagen voor BetCity en Jack's mits zij in dezelfde `group_name` zitten.

**B. Identificatie & Matching**
- **External ID:** De scanner genereert een `external_event_id` (meestal een slug van de teamnamen).
- **Mapping:** De Web App (BEP) gebruikt de `team_aliassen` tabel om de `home_name_raw` van de scanner te koppelen aan een `canonical_naam` in `referentie_teams`.

**C. Universele Stekker (Data Formaat)**
Elke parser (Unibet, Toto, etc.) levert data aan in het volgende formaat:
- `homeNameRaw` / `awayNameRaw`: De exacte tekst van de website.
- `odds1` / `oddsX` / `odds2`: De numerieke odds (gemapt naar `odds_1`, `odds_x`, `odds_2` in DB).
- `marketType`: 2-Weg of 3-Weg.

================================================================================
4. DEVOPS & VERSIONING
================================================================================
- **GitHub:** Beide projecten staan in private repositories voor backup en versiebeheer.
- **Sync:** Wijzigingen in types of ecosysteem-regels worden eerst hier (`_ECOSYSTEM.md`) vastgelegd voordat ze in de code worden geïmplementeerd.