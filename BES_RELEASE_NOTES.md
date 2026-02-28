# BES_RELEASE_NOTES

> 🧭 **Doel van dit bestand**
>
> Dit bestand geeft een korte releasegeschiedenis in begrijpelijke taal.
> Je ziet wat veranderde, waarom dat nuttig was, en wat je ervan merkt.

---

## 🚀 v2.8.6 - 28 Feb 2026
### Wat is opgeleverd
- [x] Gedeelde instructielaag ingericht via `AGENTS.md`, `SHARED_SYSTEMINSTRUCTIONS.md` en projectspecifieke BEP/BES-systeminstructions.
- [x] Bestandsnamen van de systeminstructions verduidelijkt naar `BEP_SYSTEMINSTRUCTIONS.md` en `BES_SYSTEMINSTRUCTIONS.md`.
- [x] Oude context-generator scripts en gegenereerde contextbestanden verwijderd.

### Waarom dit belangrijk was
- Nieuwe Codex chats moesten voorspelbaar de juiste instructiebronnen gebruiken.
- Oude context-bundelworkflow werd niet meer gebruikt en leverde alleen onderhoudsruis op.

### Wat je als gebruiker merkt
- Betere interne overdraagbaarheid van projectcontext.
- Minder verouderde tooling in de repo.

## 🚀 v2.8.5 - 25 Feb 2026
### Wat is opgeleverd
- [x] Roadmap-bestanden verwijderd na migratie van relevante projectkennis.
- [x] `SYSTEMINSTRUCTIONS` opgeschoond en uitgebreid met vaste DOC-CHECK borging.
- [x] Governanceflow via `STATUS/BACKLOG/DECISIONS/RELEASE_NOTES` vastgelegd.

### Waarom dit belangrijk was
- Minder document-ruis en minder kans op vergeten afspraken.
- Betere overdraagbaarheid naar nieuwe chatsessies.

### Wat je als gebruiker merkt
- Duidelijker waar afspraken, status en keuzes staan.
- Snellere onboarding voor vervolgwerk.

## 🚀 v2.8.4 - 25 Feb 2026
### Wat is opgeleverd
- [x] Automatische GitHub releaseflow (tag -> build -> ZIP asset).
- [x] Versie-bridge naar BetEdge Pro.
- [x] Betere lokale bridge-detectie voor localhost en 127.0.0.1.

### Waarom dit belangrijk was
- Distributie moest simpeler en betrouwbaarder.
- Versiemismatch tussen scanner en app moest sneller zichtbaar worden.

### Wat je als gebruiker merkt
- Snellere updatecontrole.
- Betere voorspelbaarheid van scanner-updates.

## 🛠️ v2.8.3 - 24 Feb 2026
- [x] TOTO NBA Fulltime fix voor correcte 1/2 odd-selectie.

## 📚 Historische kernmijlpalen (samengevat)
- [x] v2.6.x: Retry, fingerprinting en deduplicatie als dataflow-bescherming.
- [x] v2.5.0: Build-health naar strikte typesafe scanner.
- [x] v2.3.x: Monitor/Flight Tower en heartbeat observability.
- [x] v2.2.x: Multi-broker parserexpansie (Circus/TonyBet).
- [x] v2.1.x: Mapping- en schema-integriteitsfixes.

## 🔗 Verwijzing
- Technische versiebron blijft: `src/version.ts`
