import type { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.5.0',
  date: '2026-02-10',
  label: 'Blok B: Build-health naar Groen',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'REFACTOR' as ChangeType,
      text: 'Volledige type-check en lint opruiming',
      technicalDetails: 'Any types vervangen door concrete interfaces in background en content scripts. React hook dependencies gefixt in Monitor.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Type-veiligheid in logging en monitor',
      technicalDetails: 'LogBericht en ScanPayload interfaces toegevoegd en toegepast op de dataflow.'
    },
    {
      type: 'SECURITY' as ChangeType,
      text: 'Build hygiene verbeterd',
      technicalDetails: 'Tsconfig configuratie aangescherpt voor erasableSyntaxOnly en enum handling.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);
