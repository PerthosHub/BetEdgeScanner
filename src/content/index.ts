// FILE: src/content/index.ts
import { parseUnibetPage } from './unibet';
import { parseTotoPage } from './toto';
import { parseCircusPage } from './circus';
import { parseTonyBetPage } from './tonybet';
import { bepaalLeagueUitUrl } from './utils';
import { stuurLog } from '../utils/logger'; // <-- NIEUW

// STEALTH MODE: Start log (Alleen intern zichtbaar)
stuurLog('INFO', 'Script Gestart', 'Content script geladen op pagina.', { url: window.location.href });

// STATUS & STATE
const laatstBekendeOdds = new Map<string, string>();
let scanTimeout: number | undefined;
let laatsteBerichtTijd = Date.now(); 
let laatsteStatusKey = '';
let laatsteStatusTijd = 0;

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
  stuurLog('TRACE', 'Parser gekozen', 'Unibet parser actief.', { url });
  return { parser: 'Unibet', ...parseUnibetPage() };
};

const startScanRonde = () => {
  const { matches: alleWedstrijden, sport, parser } = voerParserUit();
  const nu = Date.now();
  const league = bepaalLeagueUitUrl();
  
  // TRACE LOGGING: Zie waarom er niets gebeurt
  if (alleWedstrijden.length === 0) {
      stuurLog('WARNING', 'Geen Matches', 'Parser uitgevoerd, maar 0 resultaten.', { sport, league, url: window.location.href });
      stuurScanStatus({
        url: window.location.href,
        sport,
        league,
        parser,
        matchesTotal: 0,
        matchesChanged: 0,
      });
      return; 
  }

  const gewijzigdeWedstrijden: any[] = [];

  // 1. Check op wijzigingen (Diffing)
  alleWedstrijden.forEach((wedstrijd: any) => {
    const id = wedstrijd.externalEventId;
    const vingerafdruk = `${wedstrijd.odds1}-${wedstrijd.oddsX}-${wedstrijd.odds2}`;

    if (laatstBekendeOdds.get(id) !== vingerafdruk) {
        gewijzigdeWedstrijden.push(wedstrijd);
        laatstBekendeOdds.set(id, vingerafdruk);
    }
  });
  
  // SCENARIO A: NIEUWS (Direct versturen)
  if (gewijzigdeWedstrijden.length > 0) {
    // Loggen via centrale (zichtbaar in monitor)
    stuurLog('SUCCESS', 'Wijzigingen Gevonden', `${gewijzigdeWedstrijden.length} nieuwe odds gevonden.`, {
        count: gewijzigdeWedstrijden.length,
        matches: gewijzigdeWedstrijden.map(m => ({
            teams: `${m.homeNameRaw} vs ${m.awayNameRaw}`,
            odds: `[${m.odds1}, ${m.oddsX}, ${m.odds2}]`,
            live: m.isLive
        }))
    });

    stuurLog('INFO', 'ODDS_DATA verstuurd', `${gewijzigdeWedstrijden.length} wijzigingen gestuurd.`, { url: window.location.href });
    chrome.runtime.sendMessage({
      type: 'ODDS_DATA', 
      payload: {
          url: window.location.href,
          sport: sport, 
          matches: gewijzigdeWedstrijden,
          totaalGevonden: alleWedstrijden.length 
      }
    });

    laatsteBerichtTijd = nu; 
  } 
  
  // SCENARIO B: STILTE (Hartslag checken)
  else if ((nu - laatsteBerichtTijd) > 30000) {
      stuurLog('INFO', 'Hartslag', 'Geen wijzigingen, stuur keep-alive.', { matchesInMem: alleWedstrijden.length });
      
      stuurLog('INFO', 'HEARTBEAT verstuurd', 'Keep-alive verstuurd.', { url: window.location.href });
      chrome.runtime.sendMessage({
          type: 'HEARTBEAT',
          payload: {
              url: window.location.href,
              timestamp: nu
          }
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
    matchesTotal: alleWedstrijden.length,
    matchesChanged: gewijzigdeWedstrijden.length,
  });
};

const stuurScanStatus = (payload: {
  url: string;
  sport?: string;
  league?: string;
  parser?: string;
  matchesTotal: number;
  matchesChanged: number;
}) => {
  const sleutel = JSON.stringify({
    url: payload.url,
    sport: payload.sport || '',
    league: payload.league || '',
    parser: payload.parser || '',
    matchesTotal: payload.matchesTotal,
    matchesChanged: payload.matchesChanged,
  });

  const nu = Date.now();
  if (sleutel === laatsteStatusKey && (nu - laatsteStatusTijd) < 2000) {
    return;
  }

  laatsteStatusKey = sleutel;
  laatsteStatusTijd = nu;

  chrome.runtime.sendMessage({
    type: 'SCAN_STATUS',
    payload: {
      ...payload,
      timestamp: nu,
    }
  });
};

const observer = new MutationObserver(() => {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(startScanRonde, 2000); 
});

observer.observe(document.body, { childList: true, subtree: true });

setTimeout(startScanRonde, 3000);
