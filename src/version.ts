// FILE: src/version.ts
import { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.1.0',
  date: '2026-01-31',
  label: 'Modular Beta',
  status: 'Stable', // Extra status indicator
  detailedChanges: [
    {
      type: 'REFACTOR' as ChangeType,
      text: 'Volledige overstap naar modulaire background engine',
      technicalDetails: 'Gesplitst in Sessie, Config, Verwerking en Database modules voor betere onderhoudbaarheid.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Database synchronisatie hersteld',
      technicalDetails: 'Veldnamen gesynct met snake_case schema (is_active, group_name) en verplichte user_id toegevoegd.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Database Schrijffout (42P10) opgelost',
      technicalDetails: 'Overgestapt van upsert naar insert om unieke constraint errors te voorkomen zonder database wijzigingen.'
    },
    {
      type: 'FEATURE' as ChangeType,
      text: 'Mirror Strategy geactiveerd',
      technicalDetails: 'Data wordt nu automatisch gedupliceerd naar andere brokers binnen dezelfde Kambi-groep.'
    },
    {
      type: 'UX' as ChangeType,
      text: 'Verbeterde Terminal & Versie weergave',
      technicalDetails: 'Real-time logs in popup en visuele versie-indicator in de header.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);