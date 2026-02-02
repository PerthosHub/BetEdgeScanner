import { OddsLine, MarketType } from '../types';

/**
 * TOTO PARSER v3.4 (Production Stable)
 * - Index-based extraction (100% correcte odds).
 * - Auto-detectie van 3-Weg markten op basis van data (niet alleen URL).
 * - Cleaned up (geen debug logs).
 */

const haalSportOpUitUrl = (): string | undefined => {
  const url = window.location.href.toLowerCase();
  if (url.includes('/voetbal/')) return 'Voetbal';
  if (url.includes('/tennis/')) return 'Tennis';
  if (url.includes('/darts/')) return 'Darts';
  if (url.includes('/basketbal/')) return 'Basketbal';
  return undefined; 
};

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
  const gedetecteerdeSport = haalSportOpUitUrl();

  const wedstrijdRijen = document.querySelectorAll('div[class*="_eventWithMarkets_"]');
  
  wedstrijdRijen.forEach((rij) => {
    try {
      // 1. Teams ophalen
      const teamLabels = rij.querySelectorAll('h3');
      if (teamLabels.length < 2) return;

      const thuisPloeg = teamLabels[0].textContent?.trim() || '';
      const uitPloeg = teamLabels[1].textContent?.trim() || '';

      // 2. ID ophalen
      const linkElement = rij.querySelector('a[href*="/wedden/wedstrijd/"]');
      const href = linkElement?.getAttribute('href') || '';
      const idMatch = href.match(/\/wedstrijd\/(\d+)\//);
      const externeId = idMatch ? idMatch[1] : `${thuisPloeg}-${uitPloeg}`.toLowerCase();

      // 3. Datum
      const rijTekst = (rij as HTMLElement).innerText || "";
      const { datum, tijd } = verwerkTotoTijdstip(rijTekst);

      // 4. Odds Ophalen (Chirurgisch)
      const haalOddOp = (outcomeIndex: string): number | undefined => {
          const btn = rij.querySelector(`button[index="${outcomeIndex}"]`);
          if (!btn) return undefined;

          // Probeer eerst de specifieke value container (zonder label)
          const waardeElement = btn.querySelector('[class*="_value_"]');
          let tekst = waardeElement ? waardeElement.textContent : btn.textContent;
          
          if (!tekst) return undefined;
          tekst = tekst.trim();

          // Als we geen value element vonden, moeten we alsnog regexen om labels te strippen
          if (!waardeElement) {
             const match = tekst.match(/(\d+,\d{2})/);
             if (match) tekst = match[0];
          }

          const getal = parseFloat(tekst.replace(',', '.'));
          return isNaN(getal) ? undefined : getal;
      };

      const odd1 = haalOddOp("0");
      const oddX = haalOddOp("1");
      const odd2 = haalOddOp("2");

      if (!odd1 || !odd2) return;

      // 5. Bepaal Markt Type
      // LOGIC UPDATE: Als we een X hebben, is het 3-weg. Ongeacht de URL.
      let marktType = MarketType.TWO_WAY;
      if (oddX) {
          marktType = MarketType.THREE_WAY;
      }

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

    } catch (fout) {
      // Skip row
    }
  });

  return { matches: resultaten, sport: gedetecteerdeSport };
};