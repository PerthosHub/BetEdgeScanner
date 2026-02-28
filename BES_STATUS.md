# BES_STATUS

> 🧭 **Doel van dit bestand**
>
> Dit bestand laat in 1 minuut zien of de scanner release-klaar is.
> Je gebruikt het als snelle pre-release controle.

---

## 🛰️ Live Status
- [x] **Laatst bijgewerkt:** 28 Feb 2026
- [x] **Live versie:** `2.8.6`
- [x] **Volgende versie (in voorbereiding):** `2.8.7`
- [x] **Live branch:** `main`
- [x] **Algemene status:** **OPERATIONEEL**

## ✅ Wat staat er nu live
- [x] Publieke distributie via GitHub Releases met ZIP asset per tag.
- [x] Versie-bridge naar BetEdge Pro voor update-detectie.
- [x] TOTO NBA Fulltime parsing fix actief.
- [x] Governanceflow met `STATUS/BACKLOG/DECISIONS/RELEASE_NOTES` is actief; roadmapbestanden zijn uitgefaseerd.

## ⚠️ Huidige aandachtspunten
- [x] Root-workspace bevat nu gedeelde Codex-instructies naast de scannerrepo.

## 🛡️ Release-veiligheidscheck
- [x] Workflow `.github/workflows/release.yml` bestaat en draait op `v*` tags.
- [x] `package.json` en `src/version.ts` staan op `2.8.6`.
- [ ] Tag `v2.8.6` staat live op origin.
- [ ] GitHub Release met ZIP asset voor `v2.8.6` is bevestigd.

## 🚩 Operationele Afspraken
- [x] Een release-lijn: `main` + semver tags.
- [x] Geen extra preview/live artifact-stromen.

## 🔗 Navigatie
- Open werk: `BES_BACKLOG.md`
- Reden achter keuzes: `BES_DECISIONS.md`
- Korte releasehistorie: `BES_RELEASE_NOTES.md`

