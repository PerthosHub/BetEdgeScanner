import { OddsLine, MarketType } from '../types';

/**
 * TONYBET PARSER
 * Gebaseerd op data-test attributen uit screenshots.
 */

const getSportFromUrl = (): string | undefined => {
  const url = window.location.href.toLowerCase();
  if (url.includes('football')) return 'Voetbal';
  if (url.includes('tennis')) return 'Tennis';
  if (url.includes('darts')) return 'Darts';
  if (url.includes('basketball')) return 'Basketbal';
  return undefined; 
};

// Helper: 07.02.2026, 16:30 -> 2026-02-07
const parseTonyDate = (dateStr: string): string => {
    try {
        // Formaat: DD.MM.YYYY
        const [day, month, year] = dateStr.split('.').map(Number);
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
        return '';
    }
};

export const parseTonyBetPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  const detectedSport = getSportFromUrl();

  // 1. Zoek naar de PREMATCH container en daarbinnen de rijen
  // Live wedstrijden zitten vaak in een andere container, dus we focussen op 'prematch'
  // Als 'prematch' niet bestaat (bijv op een specifieke league pagina), vallen we terug op alle rijen.
  const prematchContainer = document.querySelector('div[data-test="prematch"]');
  const scope = prematchContainer || document;
  
  const matchRows = scope.querySelectorAll('div[data-test="eventTableRow"]');

  matchRows.forEach((row) => {
      try {
          // 2. Teams ophalen
          const teamElements = row.querySelectorAll('[data-test="teamName"]');
          if (teamElements.length < 2) return;

          const homeTeam = teamElements[0].textContent?.trim() || '';
          const awayTeam = teamElements[1].textContent?.trim() || '';

          // 3. Datum & Tijd ophalen (uit de rij tekst)
          // Formaat in screenshot: "07.02.2026, 16:30"
          const rowText = (row as HTMLElement).innerText || "";
          
          // Regex voor DD.MM.YYYY, HH:MM
          const dateMatch = rowText.match(/(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}:\d{2})/);
          
          let isoDate = undefined;
          let eventTime = undefined;

          if (dateMatch) {
              // dateMatch[0] is de hele string
              // dateMatch[1] = dag, [2] = maand, [3] = jaar, [4] = tijd
              const datePart = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`; // 07.02.2026
              isoDate = parseTonyDate(datePart);
              eventTime = dateMatch[4];
          }

          // 4. Odds verzamelen
          const oddElements = row.querySelectorAll('[data-test="outcome"]');
          const oddsValues: number[] = [];

          // We pakken de eerste 3 (of 2) odds die we tegenkomen in de rij.
          // TonyBet toont vaak 1X2 eerst, daarna U/O of Handicap.
          oddElements.forEach((el, index) => {
              if (index > 2) return; // Optimalisatie: we hebben er max 3 nodig
              const val = parseFloat(el.textContent?.trim() || '0');
              if (val > 1) oddsValues.push(val);
          });

          if (oddsValues.length < 2) return;

          // 5. Data Samenstellen
          const cleanID = `${homeTeam.replace(/\s/g, '')}-${awayTeam.replace(/\s/g, '')}`.toLowerCase();

          let marketType = MarketType.TWO_WAY;
          let o1 = oddsValues[0];
          let oX = undefined;
          let o2 = oddsValues[1];

          // Als we 3 odds hebben en het is geen tennis, is het waarschijnlijk 3-Weg
          if (oddsValues.length >= 3 && detectedSport !== 'Tennis') {
              marketType = MarketType.THREE_WAY;
              oX = oddsValues[1];
              o2 = oddsValues[2];
          }

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