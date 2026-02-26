// FILE: src/content/index.ts
import { parseUnibetPage } from './unibet';
import { parseTotoPage } from './toto';
import { parseCircusPage } from './circus';
import { parseTonyBetPage } from './tonybet';
import { parseBetcityPage } from './betcity';
import { bepaalLeagueUitUrl, bepaalSportUitUrl } from './utils';
import { stuurLog } from '../utils/logger'; // <-- NIEUW
import { LiveScanMatch, OddsLine, ScanStatusPayload } from '../types';

// STEALTH MODE: Start log (Alleen intern zichtbaar)
stuurLog('INFO', 'Script Gestart', 'Content script geladen op pagina.', { url: window.location.href });

// STATUS & STATE
const laatstBekendeOdds = new Map<string, string>();
let scanTimeout: number | undefined;
let laatsteBerichtTijd = Date.now(); 
let laatsteStatusKey = '';
let laatsteStatusTijd = 0;
let isScanBezig = false;
let wachtendeScan = false;
const SCAN_DEBOUNCE_MS = 2000;
const INIT_SCAN_DELAY_MS = 3000;
const HEALTH_SCAN_INTERVAL_MS = 15000;
const HEARTBEAT_INTERVAL_MS = 30000;
const EMPTY_SCAN_GRACE_MS = 5000;
const CONTEXT_INVALIDATED_FRAGMENT = 'Extension context invalidated';
let extensionContextActief = true;
let idleStatusActiefTot = 0;
let laatsteNietLegeScanTijd = 0;
let healthScanInterval: number | undefined;

const formatOdd = (odd?: number): string => (typeof odd === 'number' && Number.isFinite(odd) ? odd.toFixed(4) : 'na');

const isContextInvalidatedError = (error: unknown): boolean => {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(CONTEXT_INVALIDATED_FRAGMENT);
};

const stopScannerDoorInvalidatie = () => {
  if (!extensionContextActief) return;
  extensionContextActief = false;
  clearTimeout(scanTimeout);
  if (healthScanInterval) clearInterval(healthScanInterval);
  observer.disconnect();
};

const stuurRuntimeBericht = (type: string, payload: unknown): boolean => {
  if (!extensionContextActief) return false;

  if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
    stopScannerDoorInvalidatie();
    return false;
  }

  try {
    chrome.runtime.sendMessage({ type, payload }, () => {
      const runtimeError = chrome.runtime.lastError;
      if (!runtimeError) return;
      if (runtimeError.message?.includes(CONTEXT_INVALIDATED_FRAGMENT)) {
        stopScannerDoorInvalidatie();
      }
    });
    return true;
  } catch (error) {
    if (isContextInvalidatedError(error)) {
      stopScannerDoorInvalidatie();
    }
    return false;
  }
};

const maakWedstrijdSleutel = (wedstrijd: Partial<OddsLine>): string => {
  const eventId = (wedstrijd.externalEventId || '').trim();
  if (eventId) return eventId;
  const home = (wedstrijd.homeNameRaw || '').trim().toLowerCase();
  const away = (wedstrijd.awayNameRaw || '').trim().toLowerCase();
  const market = wedstrijd.marketType || 'onbekend';
  return `${home}|${away}|${market}`;
};

const maakPayloadFingerprint = (matches: Partial<OddsLine>[]): string => {
  const regels = matches
    .map((m) => {
      const id = m.externalEventId || `${m.homeNameRaw || ''}|${m.awayNameRaw || ''}`;
      return `${id}:${formatOdd(m.odds1)}:${formatOdd(m.oddsX)}:${formatOdd(m.odds2)}`;
    })
    .sort();
  return regels.join('||');
};

const verzamelGezieneEventIds = (matches: Partial<OddsLine>[]): string[] => {
  const uniekeIds = new Set<string>();
  matches.forEach((m) => {
    const id = (m.externalEventId || '').trim();
    if (id) uniekeIds.add(id);
  });
  return Array.from(uniekeIds);
};

const bepaalParserNaamVanUrl = (): string => {
  const url = window.location.href.toLowerCase();
  if (url.includes('toto.nl')) return 'Toto';
  if (url.includes('circus.nl')) return 'Circus';
  if (url.includes('tonybet')) return 'TonyBet';
  if (url.includes('betcity.nl')) return 'Betcity';
  return 'Unibet';
};

const voerParserUit = () => {
  const url = window.location.href;
  
  if (url.includes('toto.nl')) {
    stuurLog('TRACE', 'Parser gekozen', 'Toto parser actief.', { url });
    return { parser: 'Toto', ...parseTotoPage() };
  }
  if (url.includes('circus.nl')) {
    stuurLog('TRACE', 'Parser gekozen', 'Circus parser actief.', { url });
    return { parser: 'Circus', ...parseCircusPage() };
  }
  if (url.includes('tonybet')) {
    stuurLog('TRACE', 'Parser gekozen', 'TonyBet parser actief.', { url });
    return { parser: 'TonyBet', ...parseTonyBetPage() };
  }
  if (url.includes('betcity.nl')) {
    stuurLog('TRACE', 'Parser gekozen', 'Betcity parser actief.', { url });
    return { parser: 'Betcity', ...parseBetcityPage() };
  }
  stuurLog('TRACE', 'Parser gekozen', 'Unibet parser actief.', { url });
  return { parser: 'Unibet', ...parseUnibetPage() };
};

const startScanRonde = () => {
  if (!extensionContextActief) return;

  const scanRunId = crypto.randomUUID();
  const parserHint = bepaalParserNaamVanUrl();
  const sportHint = bepaalSportUitUrl();
  const leagueHint = bepaalLeagueUitUrl();

  stuurScanStatus({
    url: window.location.href,
    sport: sportHint,
    league: leagueHint,
    parser: parserHint,
    scanRunId,
    matchesTotal: 0,
    matchesChanged: 0,
    scanPhase: 'SCANNING',
  });

  const { matches: alleWedstrijden, sport, parser } = voerParserUit();
  const nu = Date.now();
  const league = bepaalLeagueUitUrl();
  const seenEventIds = verzamelGezieneEventIds(alleWedstrijden);
  
  // TRACE LOGGING: Zie waarom er niets gebeurt
  if (alleWedstrijden.length === 0) {
      if ((nu - laatsteNietLegeScanTijd) < EMPTY_SCAN_GRACE_MS) {
        stuurLog('TRACE', 'Lege scan genegeerd', 'Tijdelijke lege parser-uitkomst binnen grace window.', {
          scanRunId,
          graceMs: EMPTY_SCAN_GRACE_MS,
          vorigeNietLegeScanMsGeleden: nu - laatsteNietLegeScanTijd,
          url: window.location.href,
        });
        return;
      }
      stuurLog('WARNING', 'Geen Matches', 'Parser uitgevoerd, maar 0 resultaten.', { sport, league, url: window.location.href });
      stuurScanStatus({
        url: window.location.href,
        sport,
        league,
        parser,
        scanRunId,
        matchesTotal: 0,
        matchesChanged: 0,
        scanPhase: 'READY',
        liveMatches: [],
      });
      return; 
  }
  laatsteNietLegeScanTijd = nu;

  const gewijzigdeWedstrijden: Partial<OddsLine>[] = [];
  const liveMatches: LiveScanMatch[] = [];

  // 1. Check op wijzigingen (Diffing)
  alleWedstrijden.forEach((wedstrijd) => {
    const sleutel = maakWedstrijdSleutel(wedstrijd);
    const vingerafdruk = `${wedstrijd.odds1}-${wedstrijd.oddsX}-${wedstrijd.odds2}`;
    const vorigeVingerafdruk = laatstBekendeOdds.get(sleutel);
    const status =
      vorigeVingerafdruk === undefined
        ? 'NIEUW'
        : vorigeVingerafdruk !== vingerafdruk
          ? 'VERNIEUWD'
          : 'GECHECKT';

    liveMatches.push({
      key: sleutel,
      externalEventId: wedstrijd.externalEventId,
      homeNameRaw: wedstrijd.homeNameRaw,
      awayNameRaw: wedstrijd.awayNameRaw,
      odds1: wedstrijd.odds1,
      oddsX: wedstrijd.oddsX,
      odds2: wedstrijd.odds2,
      marketType: wedstrijd.marketType,
      status,
    });

    if (vorigeVingerafdruk !== vingerafdruk) {
        laatstBekendeOdds.set(sleutel, vingerafdruk);
        if (!wedstrijd.externalEventId) return;
        gewijzigdeWedstrijden.push(wedstrijd);
    }
  });
  
  // SCENARIO A: NIEUWS (Direct versturen)
  if (gewijzigdeWedstrijden.length > 0) {
    const payloadFingerprint = maakPayloadFingerprint(alleWedstrijden);

    // Loggen via centrale (zichtbaar in monitor)
    stuurLog('SUCCESS', 'Wijzigingen Gevonden', `${gewijzigdeWedstrijden.length} nieuwe odds gevonden.`, {
        scanRunId,
        payloadFingerprint,
        count: gewijzigdeWedstrijden.length,
        matches: gewijzigdeWedstrijden.map(m => ({
            teams: `${m.homeNameRaw} vs ${m.awayNameRaw}`,
            odds: `[${m.odds1}, ${m.oddsX}, ${m.odds2}]`,
            live: m.isLive
        }))
    });

    stuurLog(
      'INFO',
      'ODDS_DATA verstuurd',
      `${alleWedstrijden.length} wedstrijden gestuurd (${gewijzigdeWedstrijden.length} gewijzigd).`,
      { url: window.location.href, scanRunId, payloadFingerprint }
    );
    stuurRuntimeBericht('ODDS_DATA', {
      url: window.location.href,
      scanRunId,
      payloadFingerprint,
      sport: sport,
      league,
      parser,
      matches: alleWedstrijden,
      totaalGevonden: alleWedstrijden.length,
      seenEventIds,
    });

    laatsteBerichtTijd = nu; 
  } 
  
  // SCENARIO B: STILTE (Hartslag checken)
  else if ((nu - laatsteBerichtTijd) >= HEARTBEAT_INTERVAL_MS) {
      stuurLog('INFO', 'Hartslag', 'Geen wijzigingen, stuur keep-alive.', { matchesInMem: alleWedstrijden.length, scanRunId });
      
      stuurLog('INFO', 'HEARTBEAT verstuurd', 'Keep-alive verstuurd.', { url: window.location.href, scanRunId });
      stuurRuntimeBericht('HEARTBEAT', {
        url: window.location.href,
        scanRunId,
        league,
        parser,
        timestamp: nu,
        seenEventIds,
      });

      laatsteBerichtTijd = nu; 
  } else {
      // Trace voor "Wel matches, maar geen wijziging"
      stuurLog('TRACE', 'Scan Idle', 'Matches gecheckt, geen wijzigingen.', { count: alleWedstrijden.length });
  }

  stuurScanStatus({
    url: window.location.href,
    sport,
    league,
    parser,
    scanRunId,
    matchesTotal: alleWedstrijden.length,
    matchesChanged: gewijzigdeWedstrijden.length,
    scanPhase: 'READY',
    liveMatches,
  });
};

const stuurScanStatus = (payload: Omit<ScanStatusPayload, 'timestamp' | 'contextReset'>) => {
  const sleutel = JSON.stringify({
    url: payload.url,
    sport: payload.sport || '',
    league: payload.league || '',
    parser: payload.parser || '',
    matchesTotal: payload.matchesTotal,
    matchesChanged: payload.matchesChanged,
    scanPhase: payload.scanPhase || '',
    idleWaitMs: payload.idleWaitMs || 0,
    liveCount: payload.liveMatches?.length || 0,
  });

  const nu = Date.now();
  if (sleutel === laatsteStatusKey && (nu - laatsteStatusTijd) < 2000) {
    return;
  }

  laatsteStatusKey = sleutel;
  laatsteStatusTijd = nu;

  stuurRuntimeBericht('SCAN_STATUS', {
    ...payload,
    timestamp: nu,
  });
};

const startScanRondeVeilig = () => {
  if (!extensionContextActief) return;
  if (isScanBezig) {
    wachtendeScan = true;
    return;
  }

  isScanBezig = true;
  try {
    startScanRonde();
  } finally {
    isScanBezig = false;
    if (wachtendeScan) {
      wachtendeScan = false;
      window.setTimeout(startScanRondeVeilig, 50);
    }
  }
};

const observer = new MutationObserver(() => {
  if (!extensionContextActief) return;
  clearTimeout(scanTimeout);
  const nu = Date.now();
  if (nu >= idleStatusActiefTot) {
    idleStatusActiefTot = nu + SCAN_DEBOUNCE_MS;
    stuurScanStatus({
      url: window.location.href,
      sport: bepaalSportUitUrl(),
      league: bepaalLeagueUitUrl(),
      parser: bepaalParserNaamVanUrl(),
      matchesTotal: 0,
      matchesChanged: 0,
      scanPhase: 'IDLE_WAIT',
      idleWaitMs: SCAN_DEBOUNCE_MS,
    });
  }
  scanTimeout = setTimeout(() => {
    idleStatusActiefTot = 0;
    startScanRondeVeilig();
  }, SCAN_DEBOUNCE_MS);
});

observer.observe(document.body, { childList: true, subtree: true });

stuurScanStatus({
  url: window.location.href,
  sport: bepaalSportUitUrl(),
  league: bepaalLeagueUitUrl(),
  parser: bepaalParserNaamVanUrl(),
  matchesTotal: 0,
  matchesChanged: 0,
  scanPhase: 'BOOTING',
});

setTimeout(startScanRondeVeilig, INIT_SCAN_DELAY_MS);

healthScanInterval = window.setInterval(() => {
  startScanRondeVeilig();
}, HEALTH_SCAN_INTERVAL_MS);

window.addEventListener('beforeunload', () => {
  if (healthScanInterval) clearInterval(healthScanInterval);
});
