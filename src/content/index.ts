import { parseUnibetPage } from './unibet';
import { parseTotoPage } from './toto';
import { parseCircusPage } from './circus';
import { parseTonyBetPage } from './tonybet'; // <-- NIEUW
import { voegLogToe } from '../utils/storage';

console.log('👀 BetEdge Scanner: Ogen Geopend');
voegLogToe('CONTENT (DOM)', 'Script Geladen', 'De ogen zijn geopend op deze pagina.', null, 'info');

const laatstBekendeOdds = new Map<string, string>();
let scanTimeout: number | undefined;

const voerParserUit = () => {
  const url = window.location.href;
  
  if (url.includes('toto.nl')) {
    return parseTotoPage();
  } else if (url.includes('circus.nl')) {
    return parseCircusPage();
  } else if (url.includes('tonybet')) { // <-- NIEUW
    return parseTonyBetPage();
  } else {
    return parseUnibetPage();
  }
};

const startScanRonde = () => {
  // Visuele feedback
  document.body.style.border = "4px solid #10b981"; 

  const { matches: alleWedstrijden, sport } = voerParserUit();
  
  if (alleWedstrijden.length === 0) return; 

  const gewijzigdeWedstrijden: any[] = [];

  alleWedstrijden.forEach((wedstrijd: any) => {
    const id = wedstrijd.externalEventId;
    const vingerafdruk = `${wedstrijd.odds1}-${wedstrijd.oddsX}-${wedstrijd.odds2}`;

    if (laatstBekendeOdds.get(id) !== vingerafdruk) {
        gewijzigdeWedstrijden.push(wedstrijd);
        laatstBekendeOdds.set(id, vingerafdruk);
    }
  });
  
  if (gewijzigdeWedstrijden.length > 0) {
    voegLogToe(
        'CONTENT (DOM)', 
        'Wijzigingen Gedetecteerd', 
        `${gewijzigdeWedstrijden.length} wedstrijden zijn veranderd (of nieuw).`,
        { detectedSport: sport, source: (alleWedstrijden[0] as any).source, sample: gewijzigdeWedstrijden[0] },
        'info'
    );

    console.log(`⚡ ${gewijzigdeWedstrijden.length} wijzigingen gevonden. Versturen...`);

    chrome.runtime.sendMessage({ 
      type: 'ODDS_DATA', 
      payload: {
          url: window.location.href,
          sport: sport, 
          matches: gewijzigdeWedstrijden,
          totaalGevonden: alleWedstrijden.length 
      }
  });
  }
};

const observer = new MutationObserver(() => {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(startScanRonde, 2000);
});

observer.observe(document.body, { childList: true, subtree: true });

setTimeout(startScanRonde, 3000);