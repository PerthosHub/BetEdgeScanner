// FILE: src/content/circus.ts
import { OddsLine } from '../types';
import { bepaalSportUitUrl, parseOddWaarde, genereerWedstrijdId, bepaalMarktType } from './utils';

/**
 * CIRCUS PARSER (Gaming1)
 * Versie: 2.4 (Export Fix & Utils Integration)
 */

// Helper: 06/02 -> 2026-02-06
const parseCircusDate = (dateStr: string): string => {
    try {
        const [day, month] = dateStr.split('/').map(Number);
        const currentYear = new Date().getFullYear();
        // Simpele logica: als maand kleiner is dan huidige maand, is het volgend jaar? 
        // Voor nu houden we het simpel op huidig jaar.
        return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
        return '';
    }
};

// 🛠️ FIX: 'export' toegevoegd zodat index.ts deze functie kan vinden
export const parseCircusPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  
  // STAP 1: Sport via Utils
  const detectedSport = bepaalSportUitUrl();

  // Zoek naar de standaard wedstrijd-blokken (lijstweergave)
  const matchRows = document.querySelectorAll('div[data-testid="event-summary-prematch"]'); 

  matchRows.forEach((row) => {
      try {
          const nameContainer = row.querySelector('[data-testid="event-summary-name"]');
          if (!nameContainer) return;

          const rawText = (nameContainer as HTMLElement).innerText || ""; 
          const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1);

          if (lines.length < 2) return;

          const homeTeam = lines[0];
          const awayTeam = lines[1];

          // Datum & Tijd ophalen uit de tekst van de rij
          const rowText = (row as HTMLElement).innerText || "";
          const dateMatch = rowText.match(/(\d{2}\/\d{2})/);
          const timeMatch = rowText.match(/(\d{2}:\d{2})/);
          const isoDate = dateMatch ? parseCircusDate(dateMatch[0]) : undefined;
          const eventTime = timeMatch ? timeMatch[0] : undefined;

          const marketSummaries = Array.from(row.querySelectorAll('[data-testid="market-summary"]'));
          const homeLower = homeTeam.toLowerCase();
          const awayLower = awayTeam.toLowerCase();

          const marketMatchesTeams = (market: Element) => {
              const titles = Array.from(market.querySelectorAll('button[data-testid="outcome-summary"]'))
                  .map((btn) => (btn as HTMLElement).getAttribute('title')?.toLowerCase() || '');
              const hasHome = titles.some(t => t.includes(homeLower));
              const hasAway = titles.some(t => t.includes(awayLower));
              return hasHome && hasAway;
          };
          const marketHasLineValue = (market: Element) =>
              !!market.querySelector('[data-testid="disable-outcome-summary"]');

          const isTwoWaySport = detectedSport === 'Basketbal' || detectedSport === 'Tennis';
          const desiredCount = isTwoWaySport ? 2 : 3;

          const teamMarkets = marketSummaries.filter(m => marketMatchesTeams(m));
          let primaryMarket = teamMarkets.find(m => !marketHasLineValue(m));
          if (!primaryMarket) {
              primaryMarket = teamMarkets.find(m => m.querySelectorAll('button[data-testid="outcome-summary"]').length >= desiredCount);
          }
          if (!primaryMarket) {
              primaryMarket = marketSummaries.find(m => !marketHasLineValue(m) && m.querySelectorAll('button[data-testid="outcome-summary"]').length >= desiredCount);
          }
          if (!primaryMarket) primaryMarket = marketSummaries[0] || row;

          // Odds verzamelen (alleen uit primary market)
          const oddButtons = primaryMarket.querySelectorAll('button[data-testid="outcome-summary"]');
          const oddsValues: number[] = [];

          oddButtons.forEach(btn => {
              // STAP 2: Conversie via Utils
              const val = parseOddWaarde(btn.textContent);
              if (val > 1) oddsValues.push(val);
          });

          if (oddsValues.length < 2) return;

          // STAP 3: ID & Markt via Utils
          const cleanID = genereerWedstrijdId(homeTeam, awayTeam);
          const marketType = bepaalMarktType(oddsValues.length, detectedSport);

          const o1 = oddsValues[0];
          const oX = oddsValues.length >= 3 ? oddsValues[1] : undefined;
          // Bij 2-weg is de 2e waarde de uit-odd, bij 3-weg de 3e waarde
          const o2 = oddsValues.length >= 3 ? oddsValues[2] : oddsValues[1];

          results.push({
              externalEventId: `circus-${cleanID}`,
              marketType: marketType,
              homeNameRaw: homeTeam,
              awayNameRaw: awayTeam,
              odds1: o1,
              oddsX: oX,
              odds2: o2,
              isLive: false, 
              eventDate: isoDate,
              eventTime: eventTime
          });

      } catch (e) {
          // Silent fail bij parse errors in een rij
      }
  });

  return { matches: results, sport: detectedSport };
};
