import { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.2.0',
  date: '2026-02-02',
  label: 'Expansion Pack',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FEAT' as ChangeType,
      text: 'Nieuwe Scanners: Circus & TonyBet',
      technicalDetails: 'Parsers toegevoegd voor Gaming1 (Circus) en SoftLabs (TonyBet) platforms met specifieke datum- en odds-herkenning.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'TOTO Odds Correctie',
      technicalDetails: 'Herschreven naar index-based selectie om samengesmolten tekst ("12,27") te voorkomen en 3-Weg detectie verbeterd.'
    },
    {
      type: 'TECH' as ChangeType,
      text: 'Router Expansie',
      technicalDetails: 'Content script router herkent nu 4 unieke domeinen (Unibet, TOTO, Circus, TonyBet) en laadt de juiste logica.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);