import type { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.7.0',
  date: '2026-02-18',
  label: 'Sprint E2: Ecosystem Polish',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'REFACTOR' as ChangeType,
      text: 'Ecosystem Alignment',
      technicalDetails: 'Versie-sync met BEP v3.27.0 en submodule onderhoud.'
    },
    {
      type: 'FEATURE' as ChangeType,
      text: 'Cross-User Event Freshness',
      technicalDetails: 'Heartbeat en Scan feeds schrijven nu naar een gedeelde last_seen_at status per broker/event.'
    },
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
