import { OddsLine } from '../types';
import { bepaalMarktType, bepaalSportUitUrl, genereerWedstrijdId, parseOddWaarde } from './utils';

export const parseBetcityPage = (): { matches: Partial<OddsLine>[]; sport?: string } => {
  const resultaten: Partial<OddsLine>[] = [];
  const gedetecteerdeSport = bepaalSportUitUrl();

  const eventRijen = document.querySelectorAll('li.KambiBC-sandwich-filter__event-list-item');

  eventRijen.forEach((rij) => {
    try {
      const teamNodes = Array.from(
        rij.querySelectorAll('.KambiBC-event-participants__name-participant-name')
      );
      if (teamNodes.length < 2) return;

      const thuisPloeg = teamNodes[0]?.textContent?.trim() || '';
      const uitPloeg = teamNodes[1]?.textContent?.trim() || '';
      if (!thuisPloeg || !uitPloeg) return;

      const hoofdMarkt =
        rij.querySelector('.KambiBC-bet-offer--onecrosstwo') ||
        rij.querySelector('.KambiBC-bet-offer--outcomes-3');
      if (!hoofdMarkt) return;

      const buttons = Array.from(hoofdMarkt.querySelectorAll('button.KambiBC-betty-outcome')).slice(0, 3);
      if (buttons.length < 2) return;
      const isThreeWay = buttons.length >= 3;

      const odd1 = parseOddWaarde(
        buttons[0]?.querySelector('.sc-kAyceB')?.textContent || buttons[0]?.textContent
      );
      const oddX = isThreeWay
        ? parseOddWaarde(
            buttons[1]?.querySelector('.sc-kAyceB')?.textContent || buttons[1]?.textContent
          )
        : undefined;
      const odd2 = parseOddWaarde(
        (isThreeWay ? buttons[2] : buttons[1])?.querySelector('.sc-kAyceB')?.textContent ||
          (isThreeWay ? buttons[2] : buttons[1])?.textContent
      );

      if (odd1 <= 1 || odd2 <= 1) return;
      if (isThreeWay && (!oddX || oddX <= 1)) return;

      const eventLink = rij.querySelector('a[href*="#event/"]') as HTMLAnchorElement | null;
      const href = eventLink?.getAttribute('href') || '';
      const eventId = href.match(/#event\/(\d+)/i)?.[1];
      const fallbackId = genereerWedstrijdId(thuisPloeg, uitPloeg);
      const externalEventId = `betcity-${eventId || fallbackId}`;

      const dagLabel =
        rij.querySelector('.KambiBC-event-item__start-time--date')?.textContent?.trim() || '';
      const tijdLabel =
        rij.querySelector('.KambiBC-event-item__start-time--time')?.textContent?.trim() || '';

      const eventUrl = href
        ? (href.startsWith('http') ? href : new URL(href, window.location.origin).toString())
        : undefined;

      resultaten.push({
        externalEventId,
        marketType: bepaalMarktType(isThreeWay ? 3 : 2, gedetecteerdeSport),
        homeNameRaw: thuisPloeg,
        awayNameRaw: uitPloeg,
        odds1: odd1,
        oddsX: oddX,
        odds2: odd2,
        isLive: (rij.textContent || '').toLowerCase().includes('live'),
        eventUrl,
        eventTime: [dagLabel, tijdLabel].filter(Boolean).join(' '),
      });
    } catch {
      // Skip row
    }
  });

  return { matches: resultaten, sport: gedetecteerdeSport };
};
