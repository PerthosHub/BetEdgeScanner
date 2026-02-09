// FILE: src/popup/App.tsx
import { useEffect, useState } from 'react';
import { ScannerLog, ScannerStats } from '../utils/storage';
import { VERSION_INFO } from '../version';

interface ScanStatus {
  url: string;
  sport?: string;
  league?: string;
  parser?: string;
  matchesTotal: number;
  matchesChanged: number;
  timestamp?: number;
  updatedAt?: number;
  tabId?: number;
}

const App = () => {
  const [stats, setStats] = useState<ScannerStats | null>(null);
  const [logs, setLogs] = useState<ScannerLog[]>([]);
  const [actieveTab, setActieveTab] = useState<'dashboard' | 'terminal'>('terminal');
  const [openLogId, setOpenLogId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);

  // Data ophalen uit storage
  useEffect(() => {
    const haalActieveTab = () => {
      return new Promise<chrome.tabs.Tab | undefined>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          resolve(tabs?.[0]);
        });
      });
    };

    const laadData = async () => {
      // Typecasting toegevoegd om TypeScript tevreden te stellen
      const result = await chrome.storage.local.get(['scanner_stats', 'scanner_logs']);
      
      const statsData = result.scanner_stats as ScannerStats | undefined;
      const logsData = result.scanner_logs as ScannerLog[] | undefined;

      if (statsData) setStats(statsData);
      if (logsData) setLogs(logsData);

      const actieveTabInfo = await haalActieveTab();
      const actieveTabId = actieveTabInfo?.id;
      if (!actieveTabId) {
        setScanStatus(null);
        return;
      }

      const statusKey = `scan_status_${actieveTabId}`;
      const statusResult = await chrome.storage.local.get([statusKey]);
      const statusData = statusResult[statusKey] as ScanStatus | undefined;
      setScanStatus(statusData || null);
    };

    laadData();
    // Poll elke seconde voor updates (simpele live view)
    const interval = setInterval(laadData, 1000);
    return () => clearInterval(interval);
  }, []);

  const krijgKleur = (type: string) => {
    switch (type) {
        case 'success': return 'text-green-400 border-green-900 bg-green-900/20';
        case 'warning': return 'text-yellow-400 border-yellow-900 bg-yellow-900/20';
        case 'error': return 'text-red-400 border-red-900 bg-red-900/20';
        default: return 'text-blue-300 border-blue-900 bg-blue-900/20';
    }
  };

    // NIEUW: Functie om monitor te openen
    const openMonitor = () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('monitor.html') });
    };

    return (
      <div className="w-[450px] bg-slate-900 text-slate-200 p-4 font-mono text-sm min-h-[500px]">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
          <div>
              <h1 className="text-lg font-bold text-emerald-400">BetEdge Scanner</h1>
            <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500 font-mono">v{VERSION_INFO.version}</span>
                <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded border border-slate-700">{VERSION_INFO.label}</span>
            </div>
            </div>
        <div className="flex gap-2">
            {/* NIEUW: Knopje voor Monitor (Icoontje of Tekst) */}
            <button 
                onClick={openMonitor}
                className="px-2 py-1 rounded bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700"
                title="Open Flight Tower"
            >
                📡 Monitor
            </button>

            <button 
                onClick={() => setActieveTab('dashboard')}
                className={`px-2 py-1 rounded ${actieveTab === 'dashboard' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
                Terminal
            </button>
        </div>
      </div>

      {/* SCAN STATUS (Altijd zichtbaar) */}
      <div className="bg-slate-800 p-3 rounded border border-slate-700 mb-3">
        <div className="text-slate-400 text-xs mb-2">Status (actieve tab)</div>
        {!scanStatus && (
          <div className="text-slate-500 italic">Geen actieve scan in deze tab.</div>
        )}
        {scanStatus && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Parser</span>
              <span>{scanStatus.parser || 'Onbekend'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Sport</span>
              <span>{scanStatus.sport || 'Niet gevonden'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">League</span>
              <span>{scanStatus.league || 'Niet gevonden'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Wedstrijden</span>
              <span className={scanStatus.matchesTotal > 0 ? 'text-emerald-400' : 'text-slate-400'}>
                {scanStatus.matchesTotal ?? 0}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* VIEW: DASHBOARD */}
      {actieveTab === 'dashboard' && stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 p-3 rounded">
                <div className="text-slate-400 text-xs">Laatste Scan</div>
                <div className="text-xl font-bold">{stats.laatsteScan}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded">
                <div className="text-slate-400 text-xs">Totaal Opgeslagen</div>
                <div className="text-xl font-bold text-emerald-400">{stats.totaalOpgeslagen}</div>
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded">
            <div className="text-slate-400 text-xs">Laatste Bookmaker</div>
            <div className="text-lg">{stats.laatsteBookmaker}</div>
          </div>
        </div>
      )}

      {/* VIEW: TERMINAL (LOGBOEK) */}
      {actieveTab === 'terminal' && (
        <div className="space-y-2 h-[400px] overflow-y-auto pr-1">
            {logs.length === 0 && <div className="text-slate-500 text-center italic">Nog geen logs...</div>}
            
            {logs.map((log) => (
                <div 
                    key={log.id} 
                    className={`border-l-2 p-2 rounded text-xs cursor-pointer hover:bg-white/5 transition-colors ${krijgKleur(log.type)}`}
                    onClick={() => setOpenLogId(openLogId === log.id ? null : log.id)}
                >
                    <div className="flex justify-between font-bold opacity-80 mb-1">
                        <span>[{log.tijdstip}] {log.bron}</span>
                        <span>{log.actie}</span>
                    </div>
                    <div className="opacity-90">{log.omschrijving}</div>
                    
                    {/* DETAILS / PAYLOAD */}
                    {openLogId === log.id && log.payload && (
                        <div className="mt-2 bg-slate-950 p-2 rounded border border-slate-700 overflow-x-auto">
                            <pre className="text-[10px] text-slate-300">
                                {JSON.stringify(log.payload, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default App;
