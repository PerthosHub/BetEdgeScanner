import { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.4.1',
  date: '2026-02-08',
  label: 'Scanner bugs opgelost',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FIX' as ChangeType,
      text: 'Correcte market-selectie bij TonyBet (NBA/2-weg)',
      technicalDetails: 'Odds worden nu gekozen op basis van header-coëfficiënten; voorkomt mismatch met handicap of extra markets.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Teamnamen dubbeling opgelost',
      technicalDetails: 'Teamnaam parsing deduped zodat thuis/uit niet identiek worden bij TonyBet en vergelijkbare layouts.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Circus NBA pakt alleen Money Line odds',
      technicalDetails: 'Primary market-selectie filtert handicap/totaal en houdt 2-weg odds over voor Basketbal.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);
