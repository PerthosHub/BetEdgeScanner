import { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.3.2',
  date: '2026-02-05',
  label: 'Flight Tower Pro',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FEAT' as ChangeType,
      text: 'The Flight Tower 2.0',
      technicalDetails: 'Volledige transformatie van monitor.html naar een Chrome DevTools-style cockpit met zijbalk, ultra-compacte match-rows en visuele iconografie (💓, 📈, 💾).'
    },
    {
      type: 'FEAT' as ChangeType,
      text: 'Dual-Stream Monitoring',
      technicalDetails: 'Monitor streamt nu simultaan Content (DOM) en Background (Brein) logs via een nieuwe interne Event Bus in storage.ts.'
    },
    {
      type: 'UX' as ChangeType,
      text: 'Data Inspector 2.0',
      technicalDetails: 'Inklapbare metadata-boxen met automatische "Match Card" rendering voor odds updates. Toont teams, odds en live-status in strakke one-liners.'
    },
    {
      type: 'SAFETY' as ChangeType,
      text: 'Stealth Error Protocol',
      technicalDetails: 'Alle browser-console foutmeldingen op broker-pagina\'s zijn uitgeschakeld; errors worden nu exclusief en onzichtbaar naar de Flight Tower gestuurd.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);