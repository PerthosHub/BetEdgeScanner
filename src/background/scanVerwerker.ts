import { zoekBrokerBijUrl, bepaalMirrorDoelwitten } from './configuratieLader';
import { krijgGeldigeGebruikerId } from './sessieBeheer';
import { verwerkEnSlaOp, updateLevensTeken } from './databaseSchrijver';
import { voegLogToe } from '../utils/storage';
import { Broker, ScanPayload, HeartbeatPayload } from '../types';

const DEDUPE_WINDOW_MS = 30_000;
const recentePayloads = new Map<string, number>();

const AUTH_WARNING_WINDOW_MS = 60_000;
let laatsteAuthWarning = 0;

const HEARTBEAT_LOG_WINDOW_MS = 120_000;
const laatsteHartslagLogPerBroker = new Map<string, number>();

const formatOdd = (odd?: number): string => (typeof odd === 'number' && Number.isFinite(odd) ? odd.toFixed(4) : 'na');

const berekenFallbackFingerprint = (payload: ScanPayload): string => {
  const regels = payload.matches
    .map((m) => {
      const id = m.externalEventId || `${m.homeNameRaw || ''}|${m.awayNameRaw || ''}`;
      return `${id}:${formatOdd(m.odds1)}:${formatOdd(m.oddsX)}:${formatOdd(m.odds2)}`;
    })
    .sort();
  return regels.join('||');
};

const isDubbelePayloadBinnenWindow = (targetBrokerId: string, payload: ScanPayload): boolean => {
  const now = Date.now();
  const fingerprint = payload.payloadFingerprint || berekenFallbackFingerprint(payload);
  const sleutel = `${targetBrokerId}|${fingerprint}`;

  for (const [key, ts] of recentePayloads.entries()) {
    if ((now - ts) > DEDUPE_WINDOW_MS) recentePayloads.delete(key);
  }

  const vorig = recentePayloads.get(sleutel);
  if (vorig && (now - vorig) < DEDUPE_WINDOW_MS) {
    return true;
  }

  recentePayloads.set(sleutel, now);
  return false;
};

const logAuthWarningIndienNodig = async (scanRunId: string, url: string, context: 'scan' | 'heartbeat') => {
  const nu = Date.now();
  if ((nu - laatsteAuthWarning) < AUTH_WARNING_WINDOW_MS) return;
  laatsteAuthWarning = nu;

  await voegLogToe(
    'ACHTERGROND (BREIN)',
    'Geen gebruiker',
    `Niet ingelogd, ${context} genegeerd.`,
    { url, scanRunId },
    'warning'
  );
};

const moetHartslagInfoLoggen = (brokerId: string): boolean => {
  const nu = Date.now();
  const laatste = laatsteHartslagLogPerBroker.get(brokerId) || 0;
  if ((nu - laatste) < HEARTBEAT_LOG_WINDOW_MS) return false;
  laatsteHartslagLogPerBroker.set(brokerId, nu);
  return true;
};

export const verwerkInkomendeScan = async (payload: ScanPayload) => {
  try {
    const userId = await krijgGeldigeGebruikerId();
    if (!userId) {
      await logAuthWarningIndienNodig(payload.scanRunId, payload.url, 'scan');
      return;
    }

    const actieveBroker = await zoekBrokerBijUrl(payload.url);
    if (!actieveBroker) {
      await voegLogToe('ACHTERGROND (BREIN)', 'Onbekend', 'Geen broker match', { url: payload.url, scanRunId: payload.scanRunId }, 'warning');
      return;
    }

    await voegLogToe(
      'ACHTERGROND (BREIN)',
      'Broker match',
      actieveBroker.name,
      {
        brokerId: actieveBroker.id,
        url: payload.url,
        scanRunId: payload.scanRunId,
        parser: payload.parser || 'Onbekend',
        league: payload.league || 'Onbekend',
      },
      'info'
    );

    chrome.action.setBadgeText({ text: 'SCAN' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

    const doelwitten: Broker[] = await bepaalMirrorDoelwitten(actieveBroker.id);

    for (const doelwit of doelwitten) {
      if (isDubbelePayloadBinnenWindow(String(doelwit.id), payload)) {
        await voegLogToe(
          'ACHTERGROND (BREIN)',
          'Duplicate guard',
          `Dubbele payload overgeslagen voor ${doelwit.name}`,
          { brokerId: doelwit.id, scanRunId: payload.scanRunId, dedupeWindowMs: DEDUPE_WINDOW_MS },
          'warning'
        );
        continue;
      }

      await voegLogToe('ACHTERGROND (BREIN)', 'Opslaan gestart', doelwit.name, { brokerId: doelwit.id, scanRunId: payload.scanRunId }, 'info');
      await verwerkEnSlaOp({
        brokerId: String(doelwit.id),
        brokerName: String(doelwit.name),
        matches: payload.matches,
        sport: payload.sport || 'Onbekend',
        sourceUrl: payload.url,
        userId,
        scanRunId: payload.scanRunId,
        payloadFingerprint: payload.payloadFingerprint,
      });
    }
  } catch (error) {
    console.error('Fout in verwerking:', error);
    await voegLogToe('ACHTERGROND (BREIN)', 'Verwerking fout', (error as Error).message, null, 'error');
  }
};

export const verwerkHartslag = async (payload: HeartbeatPayload) => {
  try {
    const userId = await krijgGeldigeGebruikerId();
    if (!userId) {
      await logAuthWarningIndienNodig(payload.scanRunId, payload.url, 'heartbeat');
      return;
    }

    const actieveBroker = await zoekBrokerBijUrl(payload.url);
    if (!actieveBroker) {
      await voegLogToe('ACHTERGROND (BREIN)', 'Hartslag genegeerd', 'Geen broker match', { url: payload.url, scanRunId: payload.scanRunId }, 'warning');
      return;
    }

    if (moetHartslagInfoLoggen(actieveBroker.id)) {
      await voegLogToe(
        'ACHTERGROND (BREIN)',
        'Hartslag ontvangen',
        actieveBroker.name,
        {
          brokerId: actieveBroker.id,
          scanRunId: payload.scanRunId,
          parser: payload.parser || 'Onbekend',
          league: payload.league || 'Onbekend',
        },
        'info'
      );
    }

    chrome.action.setBadgeText({ text: 'IDLE' });
    chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });

    const doelwitten: Broker[] = await bepaalMirrorDoelwitten(actieveBroker.id);

    for (const doelwit of doelwitten) {
      await updateLevensTeken(String(doelwit.id), payload.scanRunId);
    }
  } catch (error) {
    console.error('Fout in hartslag:', error);
    await voegLogToe('ACHTERGROND (BREIN)', 'Hartslag fout', (error as Error).message, null, 'error');
  }
};
