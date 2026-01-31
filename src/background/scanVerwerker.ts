// FILE: src/background/scanVerwerker.ts
import { zoekBrokerBijUrl, bepaalMirrorDoelwitten } from './configuratieLader';
import { krijgGeldigeGebruikerId } from './sessieBeheer'; // FIX: Naam update
import { verwerkEnSlaOp } from './databaseSchrijver';     // FIX: Naam update
import { voegLogToe } from '../utils/storage';
import { Broker } from '../types';

/**
 * De centrale coördinator.
 * Ontvangt ruwe data van de Content Script en regelt de logistiek naar de Database.
 */
export const verwerkInkomendeScan = async (payload: { 
    url: string; 
    sport?: string;
    matches: any[]; 
    totaalGevonden: number 
}) => {
    try {
        console.log(`🏭 Verwerker start voor: ${payload.url}`);

        // STAP 1: Authenticatie Check
        const userId = await krijgGeldigeGebruikerId(); // FIX: Juiste functieaanroep
        if (!userId) {
            console.warn('⛔ Scan afgebroken: Geen geldige gebruiker.');
            return;
        }

        // STAP 2: Welke Broker is dit?
        const actieveBroker: Broker | undefined = await zoekBrokerBijUrl(payload.url);

        if (!actieveBroker) {
            await voegLogToe(
                'ACHTERGROND (BREIN)', 
                'Onbekende Bron', 
                'Geen actieve broker gevonden voor URL.', 
                { url: payload.url }, 
                'warning'
            );
            return;
        }

        // STAP 3: Mirror Strategie (Wie krijgt deze data nog meer?)
        const doelwitIds: string[] = await bepaalMirrorDoelwitten(actieveBroker.id);

        await voegLogToe(
            'ACHTERGROND (BREIN)',
            'Data Verwerken',
            `Ontvangen: ${payload.matches.length} matches van ${actieveBroker.name}. Start database transactie voor ${doelwitIds.length} doel(en)...`,
            null,
            'info'
        );

        // STAP 4: Opslaan voor elk doelwit (Master + Mirrors)
        for (const doelwitId of doelwitIds) {
            
            await verwerkEnSlaOp({ // FIX: Juiste functieaanroep
                brokerId: doelwitId,
                matches: payload.matches,
                sport: payload.sport || 'Onbekend',
                sourceUrl: payload.url,
                userId: userId
            });
        }

    } catch (error) {
        console.error('❌ Fout in verwerkInkomendeScan:', error);
        await voegLogToe('ACHTERGROND (BREIN)', 'Crashte bij verwerking', '', { error }, 'error');
    }
};