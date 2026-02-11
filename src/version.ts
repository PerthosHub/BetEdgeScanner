import type { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.6.0',
  date: '2026-02-10',
  label: 'Sprint C: Dataflow & Stabiliteit',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FEATURE' as ChangeType,
      text: 'Robuuste Dataflow (Retry & Fingerprinting)',
      technicalDetails: 'scanRunId en payloadFingerprint toegevoegd aan ScanPayload. DatabaseSchrijver voert nu retries uit bij netwerkfouten.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Duplicate Guard & Auth Cooldown',
      technicalDetails: '30s deduplicatie-window voor payloads. Auth-loop protectie via LOGIN_COOLDOWN_MS in sessieBeheer.'
    },
    {
      type: 'UX' as ChangeType,
      text: 'Throttled Heartbeat Logs',
      technicalDetails: 'Minder log-vervuiling door hartslag-meldingen te groeperen en te vertragen per broker.'
    }
  ]
};

// Voor achterwaartse compatibiliteit met simpele lijstjes
export const SIMPLE_CHANGELOG = VERSION_INFO.detailedChanges.map(change => `[${change.type}] ${change.text}`);
