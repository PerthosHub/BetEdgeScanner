# 🗺️ ROADMAP: BetEdge Scanner (Extensie)
Status: Fase 3c - Modularisering & Stabiliteit
Huidige Versie: 2.0.0
Datum: 30 Jan 2026

---

## ✅ RECENT VOLTOOID
- [x] **Modularisering Background:** "Het Brein" gesplitst in 4 logische modules: Sessie, Config, Verwerking en Database.
- [x] **Manifest V3 Persistentie:** Overgestapt van vluchtige variabelen naar `chrome.storage.local` voor broker-configuratie.
- [x] **Type Safety:** Chrome API types correct geïmplementeerd in alle background modules.
- [x] **Mirror Strategy:** Werkende spiegeling van Kambi-data naar BetCity via de nieuwe `scanVerwerker`.

---

## 🚀 HUIDIGE FOCUS

### 1. 🛠️ Content Script Refactor (De "Ogen")
*   **Doel:** Dezelfde netheid als in de background toepassen op de content scripts.
*   **Actie:** `index.ts` (de router) opschonen en zorgen dat elke broker (Unibet, TOTO) een strikt eigen bestand houdt.

### 2. 🛡️ Data Integriteit
*   **Doel:** Voorkomen dat verlopen odds in de database blijven "hangen".
*   **Actie:** Ontwikkelen van een 'cleanup' signaal wanneer een wedstrijd van de pagina verdwijnt.

---

## 🔮 TOEKOMST
- [ ] **Live Detectie:** Herkennen van 'LIVE' badges.
- [ ] **Error Recovery:** Automatisch herladen van gecrashte tabbladen.