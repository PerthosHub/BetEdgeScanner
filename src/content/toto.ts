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

      // 4. Odds Ophalen (Specifiek voor TOTO via buttons)
      const haalOddOp = (outcomeIndex: string): number | undefined => {
          const btn = rij.querySelector(`button[index="${outcomeIndex}"]`);
          if (!btn) return undefined;

          // Probeer value container of fallback naar button text
          const waardeElement = btn.querySelector('[class*="_value_"]');
          const ruweTekst = waardeElement ? waardeElement.textContent : btn.textContent;
          
          // STAP 2: Conversie via Utils
          return parseOddWaarde(ruweTekst);
      };

      const odd1 = haalOddOp("0");
      const oddX = haalOddOp("1");
      const odd2 = haalOddOp("2");

      if (!odd1 || !odd2) return;

      // STAP 3: Markt Type via Utils
      // Let op: Bij Toto geeft haalOddOp 'undefined' terug als oddX niet bestaat, 
      // dus we tellen handmatig hoeveel odds we hebben.
      const aantalOdds = oddX ? 3 : 2;
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
