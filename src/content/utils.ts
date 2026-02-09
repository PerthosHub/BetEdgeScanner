// FILE: src/content/utils.ts
import { MarketType } from '../types';

/**
 * 🛠️ DE GEREEDSCHAPSKIST (SHARED UTILS)
 * Bevat alleen logica die 100% veilig is om te delen tussen alle brokers.
 */

// 🇳🇱 FUNCTIE: Sport herkennen
export const bepaalSportUitUrl = (): string | undefined => {
    const url = window.location.href.toLowerCase();
    
    if (url.includes('voetbal') || url.includes('football') || url.includes('soccer')) return 'Voetbal';
    if (url.includes('tennis')) return 'Tennis';
    if (url.includes('doubles') || url.includes('dubbel')) return 'Tennis';
    if (url.includes('darts')) return 'Darts';
    if (url.includes('basketbal') || url.includes('nba')) return 'Basketbal';
    if (url.includes('basketball')) return 'Basketbal';
    if (url.includes('f1') || url.includes('formule')) return 'Formule 1';
    
    return undefined; 
};

export const bepaalLeagueUitUrl = (): string | undefined => {
    const url = window.location.href.toLowerCase();

    if (url.includes('eredivisie')) return 'Eredivisie';
    if (url.includes('keuken-kampioen') || url.includes('kkd')) return 'Keuken Kampioen Divisie';
    if (url.includes('knvb')) return 'KNVB Beker';
    if (url.includes('premier-league')) return 'Premier League';
    if (url.includes('la-liga')) return 'La Liga';
    if (url.includes('bundesliga')) return 'Bundesliga';
    if (url.includes('serie-a')) return 'Serie A';
    if (url.includes('ligue-1')) return 'Ligue 1';
    if (url.includes('champions-league')) return 'Champions League';
    if (url.includes('europa-league')) return 'Europa League';
    if (url.includes('conference-league')) return 'Conference League';
    if (url.includes('atp')) return 'ATP';
    if (url.includes('wta')) return 'WTA';
    if (url.includes('grand-slam')) return 'Grand Slam';
    if (url.includes('nba')) return 'NBA';
    if (url.includes('eurolleague') || url.includes('euroleague')) return 'EuroLeague';
    if (url.includes('nfl')) return 'NFL';

    return undefined;
};

// 🇳🇱 FUNCTIE: Veilige Odd Conversie (Komma naar punt, strip text)
export const parseOddWaarde = (tekst: string | undefined | null): number => {
    if (!tekst) return 0;
    const schoon = tekst.replace(',', '.').replace(/[^0-9.]/g, '');
    const getal = parseFloat(schoon);
    return isNaN(getal) ? 0 : getal;
};

// 🇳🇱 FUNCTIE: ID Generator (Lowercase & Stripped)
export const genereerWedstrijdId = (thuis: string, uit: string): string => {
    const cleanThuis = thuis.replace(/\s/g, '').toLowerCase();
    const cleanUit = uit.replace(/\s/g, '').toLowerCase();
    return `${cleanThuis}-${cleanUit}`;
};

// 🇳🇱 FUNCTIE: Markt Type Bepaling
export const bepaalMarktType = (aantalOdds: number, sport?: string): MarketType => {
    const twoWaySports = new Set(['Tennis', 'Basketbal']);
    if (aantalOdds >= 3 && !twoWaySports.has(sport || '')) {
        return MarketType.THREE_WAY;
    }
    return MarketType.TWO_WAY;
};
