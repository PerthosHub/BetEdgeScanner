// FILE: src/content/toto.ts
import { OddsLine, MarketType } from '../types';

/**
 * TOTO PARSER v2.2 - "Top-Down Hash-Resistant"
 * Gebruikt wildcard selectors om de dynamische hashes te omzeilen.
 */

const getSportFromUrl = (): string | undefined => {
  const url = window.location.href.toLowerCase();
  if (url.includes('/voetbal/')) return 'Voetbal';
  if (url.includes('/tennis/')) return 'Tennis';
  if (url.includes('/darts/')) return 'Darts';
  if (url.includes('/basketbal/')) return 'Basketbal';
  return undefined; 
};

export const parseTotoPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  const detectedSport = getSportFromUrl();

  // 1. Pak alle wedstrijd-containers (De "dozen")
  const containers = document.querySelectorAll('div[class*="_eventWithMarkets_"]');
  
  containers.forEach((container) => {
    try {
      // 2. Haal de Teams op (H3 met teamName in class)
      const teamElements = container.querySelectorAll('h3[class*="_teamName_"]');
      if (teamElements.length < 2) return;

      const homeTeam = teamElements[0].textContent?.trim() || 'Onbekend';
      const awayTeam = teamElements[1].textContent?.trim() || 'Onbekend';

      // 3. Haal de unieke ID/Slug op uit de link
      const linkElement = container.querySelector('a[href*="/wedden/wedstrijd/"]');
      const href = linkElement?.getAttribute('href') || '';
      // We pakken de laatste delen van de URL als ID (bijv. "10142840/az-vs-nec-nijmegen")
      const externalId = href.split('/wedstrijd/')[1] || `${homeTeam}-${awayTeam}`.toLowerCase();

      // 4. Zoek de Odds Buttons binnen dit blok
      // We zoeken specifiek naar buttons in de "markets" sectie van deze container
      const oddsButtons = container.querySelectorAll('div[class*="_markets_"] button[class*="_button_"]');
      
      const parsedOdds: number[] = [];
      oddsButtons.forEach(btn => {
        // De odd staat vaak in een span binnen de button, of direct als tekst
        const oddText = btn.textContent?.trim() || "";
        // Zoek naar het getal (bijv "1,93" of "1 1,93")
        const match = oddText.match(/\d+,\d+/);
        if (match) {
            const cleanOdd = parseFloat(match[0].replace(',', '.'));
            if (!isNaN(cleanOdd)) parsedOdds.push(cleanOdd);
        }
      });

      // 5. Alleen opslaan als we valide odds hebben
      if (parsedOdds.length >= 2) {
        let odd1 = parsedOdds[0];
        let oddX = 0;
        let odd2 = 0;
        let marketType = MarketType.TWO_WAY;

        if (parsedOdds.length >= 3 && detectedSport !== 'Tennis') {
            // TOTO volgorde: 1, X, 2
            oddX = parsedOdds[1];
            odd2 = parsedOdds[2];
            marketType = MarketType.THREE_WAY;
        } else {
            // Voor 2-weg (Tennis/Basketbal) is het 1 en 2
            odd2 = parsedOdds[1];
        }

        results.push({
          externalEventId: externalId,
          marketType: marketType,
          homeNameRaw: homeTeam,
          awayNameRaw: awayTeam,
          odds1: odd1,
          oddsX: oddX,
          odds2: odd2,
          isLive: container.innerHTML.toLowerCase().includes('live'),
          eventUrl: href ? `https://sport.toto.nl${href}` : undefined,
          source: 'TOTO'
        } as any);
      }
    } catch (err) {
      console.error('Fout bij parsen TOTO container:', err);
    }
  });

  return { matches: results, sport: detectedSport };
};