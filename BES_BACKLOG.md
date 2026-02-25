# BES_BACKLOG

> 🧭 **Doel van dit bestand**
>
> Dit bestand houdt scannerwerk overzichtelijk.
> Zo kiezen we eerst het werk met de meeste impact en het minste release-risico.

---

## 🚩 Werkafspraak
- [x] Idee eerst in backlog.
- [x] Daarna prioriteren.
- [x] Daarna pas bouwen.

## 🔴 P1 - Hoogste Prioriteit
- [ ] **LIVE-detectie slimmer maken**
  - Waarom: huidige filtering kan bruikbare data verbergen.
  - Gewenst resultaat: betere signalering zonder ruis.

- [ ] **Multi-tab orchestration verbeteren**
  - Waarom: dubbele writes van dezelfde broker vervuilen dataflow.
  - Gewenst resultaat: 1 betrouwbare schrijfbron per brokercontext.

## 🟠 P2 - Belangrijk Maar Niet Blokkerend
- [ ] Error recovery voor vastgelopen of afgebroken tabbladen.
- [ ] Visual diff in monitor (welke odd veranderde exact).
- [ ] MutationObserver performance monitoren op zware pagina's.
- [ ] Auto-cleanup proces voor oude/verweesde records verder formaliseren.
- [ ] DOC-CHECK stap meenemen in release-runbook
  - Waarom: voorkomen dat documentatie-updates worden overgeslagen.
  - Gewenst resultaat: vaste check op `STATUS/BACKLOG/DECISIONS/RELEASE_NOTES` en `src/version.ts`.

## 🟡 P3 - Onderzoek / Later
- [ ] Remote parser-config zonder volledige rebuild.
- [ ] Data lifecycle uitbreiding (verweesde records + retention).

## 🚧 Bewuste Grenzen
- [x] Release-management blijft simpel: 1 lijn via `main` + tags.

## 📑 Definition of Ready
Een BES-item is klaar voor uitvoering als:
- [ ] verwacht gedrag helder is,
- [ ] impact op dataflow bekend is,
- [ ] succescontrole vooraf duidelijk is.

## ✅ Definition of Done
Een BES-item is klaar als:
- [ ] code + releaseflow check kloppen,
- [ ] effect zichtbaar is in monitor of gedrag,
- [ ] intentie is vastgelegd in `BES_DECISIONS.md`.
