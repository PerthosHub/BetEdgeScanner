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
    if (url.includes('darts')) return 'Darts';
    if (url.includes('basketbal') || url.includes('nba')) return 'Basketbal';
    if (url.includes('f1') || url.includes('formule')) return 'Formule 1';
    
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
    if (aantalOdds >= 3 && sport !== 'Tennis') {
        return MarketType.THREE_WAY;
    }
    return MarketType.TWO_WAY;
};