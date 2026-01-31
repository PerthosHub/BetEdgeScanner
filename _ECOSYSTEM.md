# 🌍 BETEDGE ECOSYSTEM (SHARED KERNEL)
Versie: 2.4 (Modulaire Architectuur & Shared Intelligence)

> **⚠️ SYSTEEM SETUP:** Dit bestand is via een **Hard Link** fysiek gekoppeld tussen de `BetEdgePro` en `BetEdgeScanner`. 
> *Actie:* Wijzigingen zijn direct overal zichtbaar.

================================================================================
1. DE APPLICATIES & ROLLEN
================================================================================

🅰️ **BETEDGE PRO (BEP) - "Het Moederschip"**
- **Rol:** De "Master". Bepaalt configuratie (welke brokers bestaan, wie spiegelt wie).

🅱️ **BETEDGE SCANNER (BES) - "De Vrachtwagen"**
- **Rol:** De "Leverancier". Leest config van BEP, verzamelt data en levert aan DB.
- **Modulaire Opbouw:** Elke broker heeft een eigen "Oog" (Content Script) om onderhoud bij website-updates makkelijk te maken.

================================================================================
2. DATABASE & DATA FLOW
================================================================================
- **Single Source of Truth:** De scanner schrijft direct naar `odds_captures` en `odds_lines`.
- **Sessiebeheer:** De scanner gebruikt een specifieke systeem-user (`scanner@betedge.local`) voor geautoriseerde schrijfacties.

================================================================================
3. BUSINESS REGELS (GEDEELD)
================================================================================

**A. Mirror Strategy (Dynamic)**
De scanner dupliceert data van 'Masters' (bijv. Unibet) naar 'Slaves' (bijv. BetCity) op basis van de broker-configuratie. Dit voorkomt dubbele belasting van de browser.

**B. Identificatie & Matching**
De scanner levert `raw` namen van de website. De Web App (BEP) vertaalt deze via de `team_aliassen` tabel naar canonieke teams.

**C. Broker Specifieke Parsing**
Elke broker site wordt behandeld als een unieke bron met een eigen parser-bestand, maar ze leveren data aan volgens een gestandaardiseerd formaat (de "Universele Stekker").