// FILE: src/background/logCentrum.ts
import { LogBericht } from '../types';
import { voegLogToe, logBroadcastEvent } from '../utils/storage';

// Hier houden we actieve verbindingen bij (Monitors)
const actieveMonitors = new Set<chrome.runtime.Port>();

export const setupLogCentrum = () => {
    
    // 1. Luister naar nieuwe verbindingen van Monitor Tabs
    chrome.runtime.onConnect.addListener((poort) => {
        if (poort.name === 'monitor_stream') {
            console.log('📡 Monitor verbonden');
            actieveMonitors.add(poort);

            poort.onDisconnect.addListener(() => {
                actieveMonitors.delete(poort);
                console.log('🔕 Monitor verbroken');
            });
        }
    });

    // 2. Luister naar Achtergrond events en stuur ze door naar alle monitors
    logBroadcastEvent.addEventListener('nieuw_log', (event: any) => {
        const log = event.detail;
        
        // Vertaal ScannerLog (opslag) naar LogBericht (stream)
        const bericht: LogBericht = {
            id: log.id,
            tijdstempel: Date.now(),
            niveau: log.type.toUpperCase() as any,
            bron: {
                url: 'INTERNAL (BACKGROUND)',
            },
            actie: log.actie,
            bericht: log.omschrijving,
            meta: log.payload
        };

        actieveMonitors.forEach(poort => {
            try { poort.postMessage(bericht); } catch (e) {}
        });
    });
};

export const verwerkLogBericht = async (bericht: LogBericht, sender: chrome.runtime.MessageSender) => {
    // Verrijk bericht met Tab ID info van de verzender
    const verrijktBericht: LogBericht = {
        ...bericht,
        bron: {
            ...bericht.bron,
            tabId: sender.tab?.id
        }
    };

    // 1. BROADCAST: Stuur direct naar alle open monitors (Live Stream)
    actieveMonitors.forEach((poort) => {
        try {
            // We sturen het volledige object inclusief meta (JSON)
            poort.postMessage(verrijktBericht);
        } catch (e) {
            actieveMonitors.delete(poort);
        }
    });

    // 2. STORAGE: Alleen serieuze zaken opslaan voor later (Audit Trail)
    if (['WARNING', 'ERROR', 'SUCCESS'].includes(bericht.niveau)) {
        await voegLogToe(
            'CONTENT (DOM)', // Of dynamisch bepalen
            bericht.actie,
            bericht.bericht,
            bericht.meta,
            bericht.niveau === 'TRACE' ? 'info' : (bericht.niveau.toLowerCase() as any)
        );
    }
};