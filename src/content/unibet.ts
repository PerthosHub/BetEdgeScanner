// FILE: src/content/unibet.ts
import { OddsLine, MarketType } from '../types';

// Helper om sport uit URL te halen
const getSportFromUrl = (): string | undefined => {
  const url = window.location.href.toLowerCase();
  if (url.includes('football') || url.includes('voetbal')) return 'Voetbal';
  if (url.includes('tennis')) return 'Tennis';
  if (url.includes('darts')) return 'Darts';
  if (url.includes('basketball')) return 'Basketbal';
  if (url.includes('formula1') || url.includes('f1')) return 'Formule 1';
  return undefined; // We weten het niet zeker
};

// Return type aangepast: we geven nu ook de sport terug
export const parseUnibetPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
const results: Partial<OddsLine>[] = [];
const detectedSport = getSportFromUrl();
const matchElements = document.querySelectorAll('div[data-test-name="event"]');

  matchElements.forEach((element) => {
    try {
      const teamNames = element.querySelectorAll('[data-test-name="teamName"]');
      if (teamNames.length < 2) return;

      const homeTeam = teamNames[0].textContent?.trim() || '';
      const awayTeam = teamNames[1].textContent?.trim() || '';
      
      const oddsWrapper = element.querySelector('[class*="outcomesButtonWrapper"]');
      if (!oddsWrapper) return;

      const buttons = oddsWrapper.querySelectorAll('button'); 
      
      // Helper voor odds
      const parseOdd = (txt: string | undefined) => {
          if (!txt) return 0;
          const clean = txt.replace(/[^0-9.]/g, ''); 
          return parseFloat(clean) || 0;
      };

      if (buttons.length >= 3) {
        const odd1 = parseOdd(buttons[0].textContent || '');
        const oddX = parseOdd(buttons[1].textContent || '');
        const odd2 = parseOdd(buttons[2].textContent || '');

        if (odd1 > 1 && odd2 > 1) {
            // UNIEKE ID GENEREREN
            // We proberen een ID uit de HTML te vissen, of we maken er zelf een.
            // Vaak staat er een id op de wrapper of een href in de buurt.
            // Voor nu maken we een "Hash" op basis van namen, dat is voor Unibet stabiel genoeg.
            // Format: "Home-Away" (Gestript van spaties)
            const cleanID = `${homeTeam.replace(/\s/g, '')}-${awayTeam.replace(/\s/g, '')}`.toLowerCase();

            results.push({
              // We gebruiken dit veld tijdelijk om de ID door te geven aan de Manager
              externalEventId: cleanID, 
              marketType: MarketType.THREE_WAY,
              homeNameRaw: homeTeam,
              awayNameRaw: awayTeam,
              odds1: odd1,
              oddsX: oddX,
              odds2: odd2,
              isLive: false,
              source: 'Unibet'
            } as any);
        }
      }
    } catch (err) {
      // Silent fail
    }
  });

  return { matches: results, sport: detectedSport };
};