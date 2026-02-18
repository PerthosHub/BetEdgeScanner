// FILE: src/content/toto.ts
import { OddsLine } from '../types';
import { bepaalSportUitUrl, parseOddWaarde, genereerWedstrijdId, bepaalMarktType } from './utils';

/**
 * TOTO PARSER v3.5 (Refactored)
 * - Uses shared utils for stability
 * - Keeps unique index-based button selection
 */

const verwerkTotoTijdstip = (tekst: string): { datum?: string, tijd?: string } => {
    try {
        const match = tekst.match(/(\d{2})-(\d{2})-(\d{4})\s+(\d{2}:\d{2})/);
        if (match) {
            return {
                datum: `${match[3]}-${match[2]}-${match[1]}`, 
                tijd: match[4]
            };
        }
    } catch { /* Silent */ }
    return {};
};

const vindPrimaireMarkt = (rij: Element): Element | null => {
  const markten = Array.from(rij.querySelectorAll('div[class*="_market_"]'));
  if (markten.length === 0) return null;

  // Voorkeur: Winner/Resultaat markt, omdat die stabiel is voor 2-way/3-way.
  const voorkeursMarkt = markten.find((markt) => {
    const headerTekst = (markt.querySelector('div[class*="_header_"]')?.textContent || '').toLowerCase();
    return headerTekst.includes('winnaar') || headerTekst.includes('resultaat');
  });

  return voorkeursMarkt || markten[0];
};

const leesOddsUitMarkt = (markt: Element): { odd1?: number; oddX?: number; odd2?: number } => {
  const buttonLijst = Array.from(markt.querySelectorAll('button[index]'));
  if (buttonLijst.length === 0) return {};

  const oddsOpLabel: Record<string, number | undefined> = {};

  buttonLijst.forEach((btn) => {
    const labelElement = btn.querySelector('[class*="_label_"]');
    const valueElement = btn.querySelector('[class*="_value_"]');

    const ruweLabel = (labelElement?.textContent || '').trim().toUpperCase();
    const ruweOddTekst = (valueElement?.textContent || btn.textContent || '').trim();
    const oddWaarde = parseOddWaarde(ruweOddTekst);

    if (!oddWaarde || oddWaarde <= 1) return;
    if (ruweLabel === '1' || ruweLabel === 'X' || ruweLabel === '2') {
      oddsOpLabel[ruweLabel] = oddWaarde;
    }
  });

  return {
    odd1: oddsOpLabel['1'],
    oddX: oddsOpLabel['X'],
    odd2: oddsOpLabel['2'],
  };
};

export const parseTotoPage = (): { matches: Partial<OddsLine>[], sport?: string } => {
  const resultaten: Partial<OddsLine>[] = [];
  
  // STAP 1: Sport via Utils
  const gedetecteerdeSport = bepaalSportUitUrl();

  const wedstrijdRijen = document.querySelectorAll('div[class*="_eventWithMarkets_"]');
  
  wedstrijdRijen.forEach((rij) => {
    try {
      const teamLabels = rij.querySelectorAll('h3');
      if (teamLabels.length < 2) return;

      const thuisPloeg = teamLabels[0].textContent?.trim() || '';
      const uitPloeg = teamLabels[1].textContent?.trim() || '';

      const linkElement = rij.querySelector('a[href*="/wedden/wedstrijd/"]');
      const href = linkElement?.getAttribute('href') || '';
      
      const rijTekst = (rij as HTMLElement).innerText || "";
      const { datum, tijd } = verwerkTotoTijdstip(rijTekst);

      const primaireMarkt = vindPrimaireMarkt(rij);
      if (!primaireMarkt) return;

      const { odd1, oddX, odd2: odd2Raw } = leesOddsUitMarkt(primaireMarkt);
      const odd2 = odd2Raw;

      if (!odd1 || !odd2) return;

      // STAP 3: Markt Type via Utils
      const aantalOdds = oddX && odd2Raw ? 3 : 2;
      const marktType = bepaalMarktType(aantalOdds, gedetecteerdeSport);

      // STAP 4: ID via Utils (of fallback naar TOTO ID uit URL)
      // We geven voorkeur aan onze generieke ID generator voor consistentie, 
      // tenzij je perse de TOTO numeric ID wilt behouden. 
      // Voor nu gebruiken we de generieke generator zodat 'Ajax - Feyenoord' overal hetzelfde ID krijgt.
      const externeId = genereerWedstrijdId(thuisPloeg, uitPloeg);

      resultaten.push({
          externalEventId: `toto-${externeId}`,
          marketType: marktType,
          homeNameRaw: thuisPloeg,
          awayNameRaw: uitPloeg,
          odds1: odd1,
          oddsX: oddX,
          odds2: odd2,
          isLive: rijTekst.toLowerCase().includes('live'),
          eventUrl: href.startsWith('http') ? href : `https://sport.toto.nl${href}`,
          eventDate: datum,
          eventTime: tijd
      });

    } catch {
      // Skip row
    }
  });

  return { matches: resultaten, sport: gedetecteerdeSport };
};
