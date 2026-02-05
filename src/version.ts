import { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.4.0',
  date: '2026-02-05',
  label: 'Flight Tower Gold',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FEAT' as ChangeType,
      text: 'The Flight Tower 2.0',
      technicalDetails: 'Cockpit transformatie naar DevTools UI met sidebar, compacte match-rows en hyper-visual iconografie.'
    },
    {
      type: 'FEAT' as ChangeType,
      text: 'Shared Normalization Engine',
      technicalDetails: 'Ecosystem-wide team normalisatie geïmplementeerd in BES. Scanner slaat nu direct gepoetste "home_name_norm" velden op.'
    },
    {
      type: 'SAFETY' as ChangeType,
      text: 'Stealth Pro Protocol',
      technicalDetails: 'Alle browser-console foutmeldingen op broker-pagina\'s zijn uitgeschakeld; errors worden nu exclusief en onzichtbaar naar de Flight Tower gestuurd.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);