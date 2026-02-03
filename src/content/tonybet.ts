// FILE: src/content/tonybet.ts
import { OddsLine } from '../types';
import { bepaalSportUitUrl, parseOddWaarde, genereerWedstrijdId, bepaalMarktType } from './utils';

/**
 * TONYBET PARSER
 * Versie: 1.1 (Refactored)
 */

// Helper: 07.02.2026 -> 2026-02-07
const parseTonyDate = (dateStr: string): string => {
    try {
        const [day, month, year] = dateStr.split('.').map(Number);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
        return '';
    }
};

export const parseTonyBetPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  
  // STAP 1: Sport via Utils
  const detectedSport = bepaalSportUitUrl();

  const prematchContainer = document.querySelector('div[data-test="prematch"]');
  const scope = prematchContainer || document;
  const matchRows = scope.querySelectorAll('div[data-test="eventTableRow"]');

  matchRows.forEach((row) => {
      try {
          const teamElements = row.querySelectorAll('[data-test="teamName"]');
          if (teamElements.length < 2) return;

          const homeTeam = teamElements[0].textContent?.trim() || '';
          const awayTeam = teamElements[1].textContent?.trim() || '';

          // Datum & Tijd ophalen
          const rowText = (row as HTMLElement).innerText || "";
          const dateMatch = rowText.match(/(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}:\d{2})/);
          
          let isoDate = undefined;
          let eventTime = undefined;

          if (dateMatch) {
              const datePart = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`; 
              isoDate = parseTonyDate(datePart);
              eventTime = dateMatch[4];
          }

          // Odds verzamelen
          const oddElements = row.querySelectorAll('[data-test="outcome"]');
          const oddsValues: number[] = [];

          oddElements.forEach((el, index) => {
              if (index > 2) return; 
              // STAP 2: Conversie via Utils
              const val = parseOddWaarde(el.textContent);
              if (val > 1) oddsValues.push(val);
          });

          if (oddsValues.length < 2) return;

          // STAP 3: ID & Markt via Utils
          const cleanID = genereerWedstrijdId(homeTeam, awayTeam);
          const marketType = bepaalMarktType(oddsValues.length, detectedSport);

          const o1 = oddsValues[0];
          const oX = oddsValues.length >= 3 ? oddsValues[1] : undefined;
          const o2 = oddsValues.length >= 3 ? oddsValues[2] : oddsValues[1];

          results.push({
              externalEventId: `tonybet-${cleanID}`,
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
          // Skip row
      }
  });

  return { matches: results, sport: detectedSport };
};