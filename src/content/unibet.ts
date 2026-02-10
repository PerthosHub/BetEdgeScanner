// FILE: src/content/unibet.ts
import { OddsLine } from '../types';
import { bepaalSportUitUrl, parseOddWaarde, genereerWedstrijdId, bepaalMarktType } from './utils';

export const parseUnibetPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  
  // STAP 1: Gebruik generieke functie voor sport
  const detectedSport = bepaalSportUitUrl();
  
  const matchElements = document.querySelectorAll('div[data-test-name="event"]');

  matchElements.forEach((element) => {
    try {
      // SPECIFIEK: Unibet CSS Selectors
      const teamNames = element.querySelectorAll('[data-test-name="teamName"]');
      if (teamNames.length < 2) return;

      const homeTeam = teamNames[0].textContent?.trim() || '';
      const awayTeam = teamNames[1].textContent?.trim() || '';
      
      const oddsWrapper = element.querySelector('[class*="outcomesButtonWrapper"]');
      if (!oddsWrapper) return;

      const buttons = oddsWrapper.querySelectorAll('button'); 
      
      // STAP 2: Odds ophalen via Utils
      const odd1 = parseOddWaarde(buttons[0]?.textContent);
      const oddX = buttons.length >= 3 ? parseOddWaarde(buttons[1]?.textContent) : undefined;
      
      // Bij 2-weg is de 2e knop odds2, bij 3-weg de 3e knop
      const buttonIndex2 = buttons.length >= 3 ? 2 : 1;
      const odd2 = parseOddWaarde(buttons[buttonIndex2]?.textContent);

      if (odd1 > 1 && odd2 > 1) {
            
            // STAP 3: ID & Markt Type via Utils
            const cleanID = genereerWedstrijdId(homeTeam, awayTeam);
            const marketType = bepaalMarktType(buttons.length, detectedSport);

            results.push({
              externalEventId: cleanID, 
              marketType: marketType,
              homeNameRaw: homeTeam,
              awayNameRaw: awayTeam,
              odds1: odd1,
              oddsX: oddX,
              odds2: odd2,
              isLive: false,
              source: 'Unibet'
            } as Partial<OddsLine>);
      }
    } catch {
      // Silent fail
    }
  });

  return { matches: results, sport: detectedSport };
};
