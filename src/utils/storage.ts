// FILE: src/utils/storage.ts

export type LogBron = 'CONTENT (DOM)' | 'ACHTERGROND (BREIN)' | 'POPUP (UI)' | 'AUTH';

export interface ScannerLog {
    id: string; // Unieke ID voor React rendering
    tijdstip: string;
    bron: LogBron;
    actie: string; // Korte titel (NL)
    omschrijving?: string; // Lange tekst (NL)
    payload?: Record<string, unknown> | null; // De ruwe data (JSON)
    type: 'info' | 'success' | 'warning' | 'error';
  }
  
export interface ScannerStats {
    laatsteScan: string;
    aantalGescand: number;
    laatsteBookmaker: string;
    totaalOpgeslagen: number;
}
  
// Helper om logica (NL) te scheiden van techniek (ENG)
// 📡 Event bus voor Live Broadcasts van Achtergrond naar Monitor
export const logBroadcastEvent = new EventTarget();

export const voegLogToe = async (
    bron: LogBron,
    actie: string,
    omschrijving: string = '',
    payload: Record<string, unknown> | null = null,
    type: 'info'|'success'|'warning'|'error' = 'info'
) => {

    const logItem: ScannerLog = {
        id: crypto.randomUUID(),
        tijdstip: new Date().toLocaleTimeString(),
        bron,
        actie,
        omschrijving,
        payload,
        type
    };

    // 📡 BROADCAST: Informeer actieve monitors over achtergrond acties
    logBroadcastEvent.dispatchEvent(new CustomEvent('nieuw_log', { detail: logItem }));

    // Haal oude logs op
    const result = await chrome.storage.local.get(['scanner_logs']);
    const oudeLogs = (result.scanner_logs as ScannerLog[]) || [];

    // Voeg nieuwe toe en bewaar max 100 items (FIFO) om geheugen te sparen
    const nieuweLogs = [logItem, ...oudeLogs].slice(0, 100);

    await chrome.storage.local.set({ scanner_logs: nieuweLogs });
};

export const updateStatistieken = async (stats: Partial<ScannerStats>) => {
    const result = await chrome.storage.local.get(['scanner_stats']);

    // FIX: Forceer TypeScript om dit als Stats object te zien
    const oudeStats = (result.scanner_stats as ScannerStats) || { aantalGescand: 0, totaalOpgeslagen: 0 };

    const nieuweStats = { ...oudeStats, ...stats };
    await chrome.storage.local.set({ scanner_stats: nieuweStats });
};
