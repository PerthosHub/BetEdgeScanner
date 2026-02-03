// FILE: src/utils/logger.ts
import { LogNiveau, LogBericht } from '../types';

/**
 * Stuurt een logbericht naar het 'Moederschip' (Background Script).
 * Dit is veilig om te gebruiken in Content Scripts omdat het geen opslag direct aanraakt.
 */
export const stuurLog = (
    niveau: LogNiveau,
    actie: string,
    bericht: string,
    meta: any = null
) => {
    // In Stealth Mode loggen we NIET naar de console, behalve errors
    if (niveau === 'ERROR') {
        console.error(`[BES] ${actie}:`, bericht, meta);
    }

    const payload: LogBericht = {
        id: crypto.randomUUID(),
        tijdstempel: Date.now(),
        niveau,
        bron: {
            url: window.location.href
        },
        actie,
        bericht,
        meta
    };

    try {
        chrome.runtime.sendMessage({
            type: 'LOG_ENTRY',
            payload
        });
    } catch (e) {
        // Kan gebeuren als extensie context ongeldig is (bijv. tijdens update)
    }
};