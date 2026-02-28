# BES_SYSTEMINSTRUCTIONS

> Doel van dit bestand
>
> Dit bestand bevat alleen de BES-specifieke AI-afspraken.
> Lees eerst `../SHARED_SYSTEMINSTRUCTIONS.md`.

---

## BES Context
BetEdge Scanner is de browserextensie die bookmakerdata observeert, normaliseert en doorzet richting het ecosysteem.

## BES Hierarchie Van Waarheid
Na de gedeelde waarheid uit `../SHARED_SYSTEMINSTRUCTIONS.md` volg je in BES deze volgorde:

1. `BES_STATUS.md`
2. `BES_BACKLOG.md`
3. `BES_DECISIONS.md`
4. `BES_RELEASE_NOTES.md`
5. `src/version.ts`

## BES Specifieke Technische Regels
- Service worker gedrag is vluchtig; controleer auth-state op kritieke momenten.
- Gebruik `chrome.storage.local` voor persistente scannerstate die niet verloren mag gaan.
- Houd stealthgedrag strikt: observer-gebaseerd en met rust/debounce voordat data wordt verzonden.
- Denk bij parser- of schrijfflow altijd aan deduplicatie, event freshness en veilige release-impact.

## BES Release Protocol
Per nieuwe scanner-versie werk je minimaal bij:

1. `package.json`
2. `src/version.ts`
3. `BES_RELEASE_NOTES.md`
4. `BES_STATUS.md` als status, risico of focus wijzigt

Daarna:
5. Commit op `main`
6. Maak en push tag `vX.Y.Z`
7. Controleer GitHub Release en ZIP asset

## BES Borging
- Als de wijziging BEP raakt, beoordeel ook `BEP_*` en `BetEdgePro/src/constants/versions.ts`.
- Een scannerrelease is pas klaar als tag en GitHub Release echt live staan.
