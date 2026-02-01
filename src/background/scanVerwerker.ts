import { zoekBrokerBijUrl, bepaalMirrorDoelwitten } from './configuratieLader';
import { krijgGeldigeGebruikerId } from './sessieBeheer'; 
import { verwerkEnSlaOp } from './databaseSchrijver';     
import { voegLogToe } from '../utils/storage';
import { Broker } from '../types';

export const verwerkInkomendeScan = async (payload: { 
    url: string; 
    sport?: string;
    matches: any[]; 
    totaalGevonden: number 
}) => {
    try {
        const userId = await krijgGeldigeGebruikerId();
        if (!userId) return;

        const actieveBroker = await zoekBrokerBijUrl(payload.url);

        if (!actieveBroker) {
            // FIX: Gebruik exacte string 'ACHTERGROND (BREIN)'
            await voegLogToe('ACHTERGROND (BREIN)', 'Onbekende Bron', 'Geen broker voor URL', { url: payload.url }, 'warning');
            return;
        }

        const doelwitten: Broker[] = await bepaalMirrorDoelwitten(actieveBroker.id);

        // FIX: Gebruik exacte string 'ACHTERGROND (BREIN)'
        await voegLogToe(
            'ACHTERGROND (BREIN)',
            'Data Verwerken',
            `Ontvangen: ${payload.matches.length} matches van ${actieveBroker.name}. Spiegelen naar ${doelwitten.length} brokers.`,
            null,
            'info'
        );

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