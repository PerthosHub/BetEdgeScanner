import { OddsLine, MarketType } from '../types';

// HULPFUNCTIE: Sport uit URL halen
const getSportFromUrl = (): string | undefined => {
  const url = window.location.href.toLowerCase();
  if (url.includes('/voetbal/')) return 'Voetbal';
  if (url.includes('/tennis/')) return 'Tennis';
  if (url.includes('/darts/')) return 'Darts';
  if (url.includes('/basketbal/')) return 'Basketbal';
  if (url.includes('/formule-1/')) return 'Formule 1';
  return undefined; 
};

// DOMEIN: TOTO Pagina Parser (DEBUG VERSIE)
export const parseTotoPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  const detectedSport = getSportFromUrl();
  const processedCards = new Set<Element>(); 

  // 1. Zoek Teams
  const allTeamElements = Array.from(document.querySelectorAll('[class*="teamName"], [class*="TeamName"]'));
  
  // DEBUG LOG: Laat zien wat we vinden
  if (allTeamElements.length > 0) {
      console.log(`🔍 DEBUG: ${allTeamElements.length} team-namen gevonden op pagina.`);
  }

  allTeamElements.forEach((teamEl) => {
      // Klim omhoog om de container te vinden
      let candidate = teamEl.parentElement;
      let attempts = 0;
      let found = false;

      while (candidate && attempts < 8) { // Iets hoger klimmen (8 levels)
          if (processedCards.has(candidate)) {
              found = true; break; 
          }

          // 2. Zoek Odds in deze container
          // TOTO gebruikt soms buttons, soms divs met class 'button'
          const potentialButtons = Array.from(candidate.querySelectorAll('button, div[role="button"], [class*="Button"], [class*="button"]'));
          
          const validOdds = potentialButtons
            .map(btn => {
                const txt = btn.textContent || '';
                // Filter: Moet cijfer bevatten, geen '+' en niet te lang zijn
                if (!/[0-9]/.test(txt) || txt.includes('+') || txt.length > 10) return 0;
                
                // Schoonmaken: "3,40" -> 3.40
                const clean = txt.replace(',', '.').replace(/[^0-9.]/g, '');
                return parseFloat(clean) || 0;
            })
            .filter(o => o > 1.05 && o < 500); // Filter onzin waardes

          // Check: Hebben we genoeg data?
          const teamsInBlock = candidate.querySelectorAll('[class*="teamName"], [class*="TeamName"]');
          
          if (validOdds.length >= 2 && teamsInBlock.length >= 2) {
              // DEBUG: Log succes voor de eerste match
              if (results.length === 0) {
                  console.log('✅ BINGO! Eerste match gevonden:', {
                      teams: Array.from(teamsInBlock).map(t => t.textContent),
                      odds: validOdds,
                      container: candidate
                  });
              }

              processedCards.add(candidate);
              
              const homeTeam = teamsInBlock[0].textContent?.trim() || 'Onbekend';
              const awayTeam = teamsInBlock[1].textContent?.trim() || 'Onbekend';
              
              // Simpele 1X2 logica
              let odd1 = validOdds[0];
              let oddX = 0;
              let odd2 = 0;
              let marketType = MarketType.TWO_WAY;

              if (validOdds.length >= 3 && detectedSport !== 'Tennis') {
                   // Soms staan odds in volgorde 1, 2, X of anders. 
                   // Voor nu gokken we standaard 1 - X - 2 volgorde van TOTO
                  oddX = validOdds[1];
                  odd2 = validOdds[2];
                  marketType = MarketType.THREE_WAY;
              } else {
                  odd2 = validOdds[1];
              }

              // ID Maken
              const linkElement = candidate.querySelector('a');
              const hrefId = linkElement ? linkElement.getAttribute('href') : '';
              const cleanID = hrefId || `${homeTeam.replace(/\s/g, '')}-${awayTeam.replace(/\s/g, '')}`.toLowerCase();

              results.push({
                externalEventId: cleanID,
                marketType: marketType,
                homeNameRaw: homeTeam,
                awayNameRaw: awayTeam,
                odds1: odd1,
                oddsX: oddX,
                odds2: odd2,
                isLive: false,
                source: 'TOTO'
              } as any);

              found = true;
              break; 
          }
          candidate = candidate.parentElement;
          attempts++;
      }
  });

  return { matches: results, sport: detectedSport };
};