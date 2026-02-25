# BES_DECISIONS

> 🧭 **Doel van dit bestand**
>
> Dit bestand bewaart de intentie achter scannerkeuzes.
> Zo blijft later duidelijk waarom we iets op deze manier hebben gedaan.

---

## 📝 Besluit-Template
Gebruik per besluit altijd deze 4 regels:
1. **Besluit**
2. **Waarom**
3. **Effect**
4. **Trade-off**

## 🧠 Besluitenlog

### 📅 25 Feb 2026 - Roadmaps uitgefaseerd, governance via 4 vaste documenten
- **Besluit:** `_BEP_ROADMAP.md` en `_BES_ROADMAP.md` zijn verwijderd en vervangen door vaste documentflow.
- **Waarom:** Minder dubbele bronnen en betere continuiteit over meerdere chats.
- **Effect:** Projectcontext loopt via `STATUS`, `BACKLOG`, `DECISIONS`, `RELEASE_NOTES` plus technische versiebestanden.
- **Trade-off:** Team moet na elke feature consistenter documentatie bijwerken.

### 📅 03 Feb 2026 - Heartbeat protocol als betrouwbaarheidspijler
- **Besluit:** Scanner verstuurt periodiek heartbeat voor event freshness.
- **Waarom:** Stilte zonder oddwijziging mag versheidsstatus niet laten verouderen.
- **Effect:** BEP kan "Laatst gezien" betrouwbaar tonen.
- **Trade-off:** Extra backend writes en loggingdiscipline nodig.

### 📅 02 Feb 2026 - Stealth: geen publieke broker-console ruis
- **Besluit:** Visuele indicatoren en publieke console-logs op brokerpagina's verwijderd.
- **Waarom:** Minder detectierisico en netter runtime gedrag op doelpagina's.
- **Effect:** Observability loopt via monitor/centrale logging i.p.v. brokerconsole.
- **Trade-off:** Debuggen vraagt meer discipline in monitor tooling.

### 📅 25 Feb 2026 - Eenvoudige release-aanpak voor BES
- **Besluit:** Geen aparte preview/live artifact-lijn voor BES.
- **Waarom:** Extra artifact-lijnen verhogen releasecomplexiteit en foutkans.
- **Effect:** 1 duidelijke distributielijn.
- **Trade-off:** Minder speelruimte in pre-release artifactmanagement.

### 📅 25 Feb 2026 - Automatische release via tags
- **Besluit:** Tag `vX.Y.Z` triggert build + ZIP release.
- **Waarom:** Minder handwerk en minder releasefouten.
- **Effect:** Reproduceerbare releaseflow.
- **Trade-off:** Workflow-betrouwbaarheid is nu kritieke afhankelijkheid.

### 📅 25 Feb 2026 - Versie-bridge met BEP
- **Besluit:** Scanner meldt actieve versie aan BEP.
- **Waarom:** Gebruiker moet update-status direct zien.
- **Effect:** Minder mismatch en minder supportvragen.
- **Trade-off:** Bridge-contract moet stabiel en backward-compatible blijven.

### 📅 24 Feb 2026 - TOTO NBA Fulltime prioriteit
- **Besluit:** Fulltime/Moneyline als primaire markt bij 2-weg odds.
- **Waarom:** Handicap/total markten gaven verkeerde input voor use case.
- **Effect:** Correctere odds downstream in BEP.
- **Trade-off:** Parserlogica is specifieker en vraagt onderhoud bij sitewijzigingen.

## 📌 Werkafspraak
- [x] Elke keuze met impact op gedrag of releaseflow komt hier direct bij.
