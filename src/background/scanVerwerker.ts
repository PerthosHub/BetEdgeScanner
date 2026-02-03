// FILE: src/background/scanVerwerker.ts
import { zoekBrokerBijUrl, bepaalMirrorDoelwitten } from './configuratieLader';
import { krijgGeldigeGebruikerId } from './sessieBeheer'; 
import { verwerkEnSlaOp, updateLevensTeken } from './databaseSchrijver';     
import { voegLogToe } from '../utils/storage';
import { Broker, ScanPayload, HeartbeatPayload } from '../types';

// SCENARIO A: DATA VERWERKING
export const verwerkInkomendeScan = async (payload: ScanPayload) => {
    try {
        const userId = await krijgGeldigeGebruikerId();
        if (!userId) return;

        // 1. Welke broker is dit?
        const actieveBroker = await zoekBrokerBijUrl(payload.url);
        if (!actieveBroker) {
            await voegLogToe('ACHTERGROND (BREIN)', 'Onbekend', 'Geen broker match', { url: payload.url }, 'warning');
            return;
        }

        // 2. Zet Badge op SCAN (Groen)
        chrome.action.setBadgeText({ text: 'SCAN' });
        chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

        // 3. Bepaal Mirrors (Wie moet deze data nog meer krijgen?)
        const doelwitten: Broker[] = await bepaalMirrorDoelwitten(actieveBroker.id);

        // 4. Opslaan voor elk doelwit
        for (const doelwit of doelwitten) {
            await verwerkEnSlaOp({ 
                brokerId: String(doelwit.id),     
                brokerName: String(doelwit.name), 
                matches: payload.matches,
                sport: payload.sport || 'Onbekend',
                sourceUrl: payload.url,
                userId: userId
            });
        }

    } catch (error) {
        console.error('❌ Fout in verwerking:', error);
    }
};

// SCENARIO B: HARTSLAG VERWERKING
export const verwerkHartslag = async (payload: HeartbeatPayload) => {
    try {
        // 1. Welke broker is dit?
        const actieveBroker = await zoekBrokerBijUrl(payload.url);
        if (!actieveBroker) return; // Silent fail is ok hier

        // 2. Zet Badge op IDLE (Blauw - Ruststand)
        chrome.action.setBadgeText({ text: 'IDLE' });
        chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });

        // 3. Ook de hartslag moet naar de mirrors
        const doelwitten: Broker[] = await bepaalMirrorDoelwitten(actieveBroker.id);

        for (const doelwit of doelwitten) {
            await updateLevensTeken(String(doelwit.id));
        }

    } catch (error) {
        console.error('❌ Fout in hartslag:', error);
    }
};