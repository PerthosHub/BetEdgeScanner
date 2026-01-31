// FILE: src/content/index.ts
import { parseUnibetPage } from './unibet';
import { parseTotoPage } from './toto';
import { voegLogToe } from '../utils/storage';

// Tech: Console logging blijft handig voor dev
console.log('👀 BetEdge Scanner: Ogen Geopend');
voegLogToe('CONTENT (DOM)', 'Script Geladen', 'De ogen zijn geopend op deze pagina.', null, 'info');

// DOMEIN: Geheugen voor wijzigingen
const laatstBekendeOdds = new Map<string, string>();
let scanTimeout: number | undefined;

// DOMEIN: Router voor Parsers
const voerParserUit = () => {
  const url = window.location.href;
  
  if (url.includes('toto.nl')) {
    return parseTotoPage();
  } else {
    // Default naar Unibet/Kambi parser (werkt ook voor BetCity, Jack's etc)
    return parseUnibetPage();
  }
};

// DOMEIN: De scan logica
const startScanRonde = () => {
  // Visuele feedback op de pagina (groene rand)
  document.body.style.border = "4px solid #10b981"; 

  // Stap 1: Data verzamelen (Dynamisch op basis van site)
  const { matches: alleWedstrijden, sport } = voerParserUit();
  
  if (alleWedstrijden.length === 0) return; // Geen logs vervuilen als er niets is

  const gewijzigdeWedstrijden: any[] = [];

  // Stap 2: Filteren op wijzigingen
  alleWedstrijden.forEach((wedstrijd: any) => {
    const id = wedstrijd.externalEventId;
    const vingerafdruk = `${wedstrijd.odds1}-${wedstrijd.oddsX}-${wedstrijd.odds2}`;

    if (laatstBekendeOdds.get(id) !== vingerafdruk) {
        gewijzigdeWedstrijden.push(wedstrijd);
        laatstBekendeOdds.set(id, vingerafdruk);
    }
  });
  
  // Stap 3: Communicatie naar 'Het Brein' (Background)
  if (gewijzigdeWedstrijden.length > 0) {
    
    // LOG: Wat hebben we gevonden?
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

// TECH: MutationObserver (kijkt of DOM verandert)
const observer = new MutationObserver(() => {
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(startScanRonde, 2000); // 2 seconden rust (Debounce)
});

// Observeer de body, werkt voor zowel Kambi als TOTO React apps
observer.observe(document.body, { childList: true, subtree: true });

// Start eerste keer handmatig
setTimeout(startScanRonde, 3000);