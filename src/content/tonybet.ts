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
          const teamContainers = Array.from(row.querySelectorAll('[data-test="teamName"]'));
          const teamNames = teamContainers
              .map((el) => el.textContent?.trim() || '')
              .filter((name) => name.length > 0);

          // Dedupe op volgorde (soms zitten dezelfde teksten dubbel in de DOM)
          const uniekeTeams: string[] = [];
          teamNames.forEach((name) => {
              if (uniekeTeams[uniekeTeams.length - 1] !== name) {
                  uniekeTeams.push(name);
              }
          });

          if (uniekeTeams.length < 2) return;

          const homeTeam = uniekeTeams[0];
          const awayTeam = uniekeTeams[1];

          // Datum & Tijd ophalen (voorkeur: data-test velden)
          const dateElement = row.querySelector('[data-test="eventDate"]') as HTMLElement | null;
          const timeElement = row.querySelector('[data-test="eventTime"]') as HTMLElement | null;

          let isoDate = undefined;
          let eventTime = undefined;

          const dateText = dateElement?.textContent?.trim() || '';
          if (dateText) {
              isoDate = parseTonyDate(dateText);
          }

          const timeText = timeElement?.textContent?.replace(/\u00a0/g, ' ')?.trim() || '';
          if (timeText) {
              eventTime = timeText;
          }

          // Fallback: probeer datum/tijd uit de rijtekst te halen
          if (!isoDate || !eventTime) {
              const rowText = (row as HTMLElement).innerText || "";
              const dateMatch = rowText.match(/(\d{2})\.(\d{2})\.(\d{4}),\s*(\d{2}:\d{2})/);
              if (dateMatch) {
                  const datePart = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`; 
                  isoDate = isoDate ?? parseTonyDate(datePart);
                  eventTime = eventTime ?? dateMatch[4];
              }
          }

          // Odds verzamelen (TonyBet toont meerdere kolommen: 1,2, H1, Handicap, H2)
          // We pakken daarom de linkse kolommen op basis van positionering (DOM kan afwijken).
          const headerRow = row.closest('[data-test="eventsTable"]')?.querySelector('[data-test="eventTableHeader"]') as HTMLElement | null;
          const headerGroups = headerRow ? Array.from(headerRow.querySelectorAll('[data-test="marketItemHeader"]')) : [];

          let primaryMarketIndex = 0;
          let expectsThreeWay = false;

          headerGroups.forEach((group, idx) => {
              const labels = Array.from(group.querySelectorAll('span'))
                  .map((s) => s.textContent?.trim().toUpperCase())
                  .filter(Boolean) as string[];
              const has1 = labels.includes('1');
              const has2 = labels.includes('2');
              const hasX = labels.includes('X');
              const hasHandicap = labels.some((l) => l.startsWith('H') || l.includes('HANDICAP'));

              if (has1 && has2 && hasX) {
                  primaryMarketIndex = idx;
                  expectsThreeWay = true;
              } else if (has1 && has2 && !hasHandicap && !expectsThreeWay) {
                  primaryMarketIndex = idx;
              }
          });

          const marketItems = Array.from(row.querySelectorAll('[data-test="marketItem"]'));
          const primaryMarket = marketItems[primaryMarketIndex] ?? marketItems[0];
          const primaryOutcomes = primaryMarket ? Array.from(primaryMarket.querySelectorAll('[data-test="outcome"]')) : [];
          const parsedOutcomes = primaryOutcomes
              .map((el) => parseOddWaarde(el.textContent))
              .filter((v) => v > 1);

          const isTwoWaySport = detectedSport === 'Basketbal' || detectedSport === 'Tennis';
          const isTwoWay = isTwoWaySport || !expectsThreeWay;
          const oddsValues = (isTwoWay ? parsedOutcomes.slice(0, 2) : parsedOutcomes.slice(0, 3));

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

      } catch {
          // Skip row
      }
  });

  return { matches: results, sport: detectedSport };
};
