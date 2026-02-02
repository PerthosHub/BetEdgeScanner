import { OddsLine, MarketType } from '../types';

/**
 * CIRCUS PARSER (Gaming1)
 * Versie: 2.2 (Data-TestID Edition)
 * Gebaseerd op DOM-inspectie (01 Feb 2026).
 */

const getSportFromUrl = (): string | undefined => {
  const url = window.location.href.toLowerCase();
  if (url.includes('voetbal')) return 'Voetbal';
  if (url.includes('tennis')) return 'Tennis';
  if (url.includes('darts')) return 'Darts';
  if (url.includes('basketbal')) return 'Basketbal';
  return undefined; 
};

// Helper: 06/02 -> 2026-02-06
const parseCircusDate = (dateStr: string): string => {
    try {
        const [day, month] = dateStr.split('/').map(Number);
        const currentYear = new Date().getFullYear();
        // Simpele logica: als maand < huidige maand, is het waarschijnlijk volgend jaar.
        // Voor nu houden we het simpel op huidig jaar.
        return `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } catch {
        return '';
    }
};

export const parseCircusPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const results: Partial<OddsLine>[] = [];
  const detectedSport = getSportFromUrl();

  // 1. We zoeken alle PREMATCH containers direct.
  // Dit is de veiligste filter dankzij jouw screenshot!
  // We negeren 'event-summary-live' volledig.
  const matchRows = document.querySelectorAll('div[data-testid="event-summary-prematch"]'); 

  matchRows.forEach((row) => {
      try {
          // 2. Namen ophalen
          // We zoeken de container met de namen
          const nameContainer = row.querySelector('[data-testid="event-summary-name"]');
          if (!nameContainer) return;

          // Truc: innerText pakt de tekst met regeleindes (\n) tussen blok-elementen (divs).
          // Jouw screenshot toont dat de namen in aparte divs staan, dus dit werkt perfect.
          const rawText = (nameContainer as HTMLElement).innerText || ""; 
          const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 1);

          if (lines.length < 2) return;

          const homeTeam = lines[0];
          const awayTeam = lines[1];

          // 3. Datum & Tijd ophalen
          // De datum staat vaak ergens anders in de rij, als platte tekst.
          const rowText = (row as HTMLElement).innerText || "";
          
          // Regex voor "06/02 20:00"
          const dateMatch = rowText.match(/(\d{2}\/\d{2})/);
          const timeMatch = rowText.match(/(\d{2}:\d{2})/);
          
          const isoDate = dateMatch ? parseCircusDate(dateMatch[0]) : undefined;
          const eventTime = timeMatch ? timeMatch[0] : undefined;

          // 4. Odds verzamelen
          // We zoeken knoppen BINNEN deze specifieke rij
          const oddButtons = row.querySelectorAll('button[data-testid="outcome-summary"]');
          const oddsValues: number[] = [];

          oddButtons.forEach(btn => {
              const val = parseFloat(btn.textContent?.trim() || '0');
              if (val > 1) oddsValues.push(val);
          });

          if (oddsValues.length < 2) return;

          // 5. Data Samenstellen
          const cleanID = `${homeTeam.replace(/\s/g, '')}-${awayTeam.replace(/\s/g, '')}`.toLowerCase();

          let marketType = MarketType.TWO_WAY;
          let o1 = oddsValues[0];
          let oX = undefined;
          let o2 = oddsValues[1];

          // Als we 3 odds hebben, is het 3-Weg (1X2)
          if (oddsValues.length >= 3) {
              marketType = MarketType.THREE_WAY;
              oX = oddsValues[1];
              o2 = oddsValues[2];
          }

          results.push({
              externalEventId: `circus-${cleanID}`,
              marketType: marketType,
              homeNameRaw: homeTeam,
              awayNameRaw: awayTeam,
              odds1: o1,
              oddsX: oX,
              odds2: o2,
              isLive: false, // We pakken alleen prematch containers
              eventDate: isoDate,
              eventTime: eventTime
          });

      } catch (e) {
          // Skip row on error
      }
  });

  return { matches: results, sport: detectedSport };
};