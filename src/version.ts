// FILE: src/version.ts
import { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.1.1',
  date: '2026-02-01',
  label: 'Mapping Patch',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FIX' as ChangeType,
      text: 'Data Flow Hersteld',
      technicalDetails: 'Broker-namen en IDs worden nu expliciet als strings verstuurd (voorkomt `broker_name: null` en JSON-in-ID fouten).'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Mirror Logica Gerepareerd',
      technicalDetails: 'De scanner herkent nu correct de `group` en `isActive` status uit de configuratie voor spiegelen.'
    },
    {
      type: 'TECH' as ChangeType,
      text: 'Config Cache Flush',
      technicalDetails: 'Forceert een opschoning van `chrome.storage` bij update om oude, corrupte configuraties te verwijderen.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);