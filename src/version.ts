import type { ChangeType } from './types';

export interface ChangelogEntry {
  type: ChangeType;
  text: string;
  technicalDetails?: string;
}

export const VERSION_INFO = {
  version: '2.8.3',
  date: '2026-02-24',
  label: 'Sprint E4: TOTO NBA Fulltime Fix',
  status: 'Stable',
  detailedChanges: [
    {
      type: 'FIX' as ChangeType,
      text: 'TOTO NBA Fulltime market selectie',
      technicalDetails: 'Parser selecteert nu expliciet de Fulltime/Moneyline markt en sluit Totaal punten en Handicap Winnaar uit bij 2-weg odds.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Correcte 1/2 odds extractie',
      technicalDetails: 'Label parsing leest nu uitsluitend outcome-labels binnen labelWrapper, zodat NBA odds zoals 4,30 en 1,23 correct worden opgehaald.'
    },
    {
      type: 'REFACTOR' as ChangeType,
      text: 'Ecosystem Alignment',
      technicalDetails: 'Versie-sync met BEP v3.29.0 voor PC-wissel sync.'
    },
    {
      type: 'FIX' as ChangeType,
      text: 'Betcity 2-way support',
      technicalDetails: 'Betcity parser ondersteunt nu ook 2-way markten (Tennis/Basketball) naast de standaard 3-way (Voetbal).'
    },
    {
      type: 'FEATURE' as ChangeType,
      text: 'Betcity Support',
      technicalDetails: 'Betcity parser toegevoegd en permissies bijgewerkt in manifest.'
    },
    {
      type: 'REFACTOR' as ChangeType,
      text: 'Mirror Logic Cleanup',
      technicalDetails: 'bepaalMirrorDoelwitten verwijderd; scanner focust nu op directe data-injectie conform Cross-User Freshness principe.'
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
