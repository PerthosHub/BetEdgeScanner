// FILE: src/content/index.ts
import { parseUnibetPage } from './unibet';
import { parseTotoPage } from './toto';
import { parseCircusPage } from './circus';
import { parseTonyBetPage } from './tonybet';
import { stuurLog } from '../utils/logger'; // <-- NIEUW

// STEALTH MODE: Start log (Alleen intern zichtbaar)
stuurLog('INFO', 'Script Gestart', 'Content script geladen op pagina.', { url: window.location.href });

// STATUS & STATE
const laatstBekendeOdds = new Map<string, string>();
let scanTimeout: number | undefined;
let laatsteBerichtTijd = Date.now(); 

const voerParserUit = () => {
  const url = window.location.href;
  
  if (url.includes('toto.nl')) return parseTotoPage();
  if (url.includes('circus.nl')) return parseCircusPage();
  if (url.includes('tonybet')) return parseTonyBetPage();
  return parseUnibetPage();
};

const startScanRonde = () => {
  const { matches: alleWedstrijden, sport } = voerParserUit();
  const nu = Date.now();
  
  // TRACE LOGGING: Zie waarom er niets gebeurt
  if (alleWedstrijden.length === 0) {
      stuurLog('TRACE', 'Geen Matches', 'Parser uitgevoerd, maar 0 resultaten.', { sport, url: window.location.href });
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
};

const observer = new MutationObserver(() => {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(startScanRonde, 2000); 
});

observer.observe(document.body, { childList: true, subtree: true });

setTimeout(startScanRonde, 3000);