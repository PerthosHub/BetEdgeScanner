// FILE: src/background/logCentrum.ts
import { LogBericht } from '../types';
import { voegLogToe } from '../utils/storage';

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
};

export const verwerkLogBericht = async (bericht: LogBericht, sender: chrome.runtime.MessageSender) => {
    // Verrijk bericht met Tab ID info van de verzender
    const verrijktBericht = {
        ...bericht,
        bron: {
            ...bericht.bron,
            tabId: sender.tab?.id
        }
    };

    // 1. BROADCAST: Stuur direct naar alle open monitors (Live Stream)
    actieveMonitors.forEach((poort) => {
        try {
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