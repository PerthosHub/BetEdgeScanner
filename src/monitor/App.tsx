import { useEffect, useMemo, useState } from 'react';
import { LogBericht, LogNiveau } from '../types';
import { ScannerLog } from '../utils/storage';

interface MatchInspectorItem {
  teams: string;
  odds: string;
  live: boolean;
}

const isLogNiveau = (value: string): value is LogNiveau => {
  return ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'TRACE'].includes(value);
};

const mapStorageLogToMonitorLog = (log: ScannerLog): LogBericht => ({
  id: log.id,
  tijdstempel: Date.now(),
  niveau: String(log.type).toUpperCase() as LogNiveau,
  bron: { url: log.bron || 'INTERNAL (BACKGROUND)' },
  actie: log.actie,
  bericht: log.omschrijving || '',
  meta: log.payload,
});

const parseMetaMatches = (meta: LogBericht['meta']): MatchInspectorItem[] | null => {
  if (!meta || typeof meta !== 'object') return null;
  const matches = (meta as Record<string, unknown>).matches;
  if (!Array.isArray(matches)) return null;

  return matches
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const teams = typeof row.teams === 'string' ? row.teams : '';
      const odds = typeof row.odds === 'string' ? row.odds : '';
      const live = typeof row.live === 'boolean' ? row.live : false;
      if (!teams) return null;
      return { teams, odds, live } satisfies MatchInspectorItem;
    })
    .filter((row): row is MatchInspectorItem => row !== null);
};

const parseOddsValues = (input: string): string[] => {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input.replace(/'/g, '"'));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value) => String(value));
  } catch {
    return [input];
  }
};

const App = () => {
  const [logs, setLogs] = useState<LogBericht[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [showTrace, setShowTrace] = useState(false);
  const [bronFilter, setBronFilter] = useState<string>('ALL');
  const [niveauFilter, setNiveauFilter] = useState<LogNiveau | 'ALL'>('ALL');

  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'monitor_stream' });

    chrome.storage.local
      .get(['scanner_logs'])
      .then((result) => {
        const opgeslagen = (result.scanner_logs as ScannerLog[] | undefined) || [];
        const omgezet = opgeslagen.map(mapStorageLogToMonitorLog);
        if (omgezet.length > 0) {
          setLogs((prev) => {
            const seen = new Set(prev.map((l) => l.id));
            const unique = omgezet.filter((l) => !seen.has(l.id));
            return [...unique, ...prev].slice(0, 1000);
          });
        }
      })
      .catch(() => {
        // ignore storage read failures
      });

    port.onMessage.addListener((msg: LogBericht) => {
      setLogs((prev) => {
        if (prev.some((l) => l.id === msg.id)) return prev;
        return [msg, ...prev.slice(0, 999)];
      });
      if (['ERROR', 'SUCCESS'].includes(msg.niveau)) {
        setExpandedLogId(msg.id);
      }
    });

    port.onDisconnect.addListener(() => {
      setIsConnected(false);
    });

    return () => port.disconnect();
  }, []);

  const bronnen = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => {
      const host = l.bron.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      set.add(host);
    });
    return Array.from(set);
  }, [logs]);

  const gefilterdeLogs = logs.filter((l) => {
    if (!showTrace && l.niveau === 'TRACE') return false;
    if (niveauFilter !== 'ALL' && l.niveau !== niveauFilter) return false;
    if (bronFilter !== 'ALL') {
      const host = l.bron.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
      if (host !== bronFilter) return false;
    }
    return true;
  });

  const getIcon = (log: LogBericht) => {
    if (log.actie.toLowerCase().includes('hartslag')) return 'HEART';
    if (log.actie.toLowerCase().includes('wijziging')) return 'DELTA';
    if (log.actie.toLowerCase().includes('script')) return 'BOOT';
    if (log.actie.toLowerCase().includes('opgeslagen')) return 'SAVE';

    switch (log.niveau) {
      case 'SUCCESS':
        return 'OK';
      case 'WARNING':
        return 'WARN';
      case 'ERROR':
        return 'ERR';
      case 'TRACE':
        return 'TRACE';
      default:
        return 'INFO';
    }
  };

  return (
    <div className="flex h-screen bg-[#202124] text-[#bdc1c6] font-mono text-[11px] overflow-hidden">
      <div className="w-48 bg-[#292a2d] border-r border-[#3c4043] flex flex-col shrink-0">
        <div className="p-3 border-b border-[#3c4043] bg-[#202124]">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#81c995]' : 'bg-[#f28b82]'}`}></div>
            <span className="text-[10px] font-bold text-[#e8eaed] tracking-tight uppercase">Flight Tower 2.7</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => setBronFilter('ALL')}
            className={`w-full text-left px-3 py-1.5 transition-colors ${
              bronFilter === 'ALL' ? 'bg-[#3c4043] text-[#e8eaed]' : 'hover:bg-[#35363a]'
            }`}
          >
            All traffic
          </button>
          {bronnen.map((host) => (
            <button
              key={host}
              onClick={() => setBronFilter(host)}
              className={`w-full text-left px-3 py-1.5 truncate transition-colors ${
                bronFilter === host ? 'bg-[#3c4043] text-[#e8eaed]' : 'hover:bg-[#35363a]'
              }`}
            >
              {host}
            </button>
          ))}
        </div>
        <div className="p-2 border-t border-[#3c4043]">
          <button
            onClick={() => setLogs([])}
            className="w-full text-center py-1 hover:bg-[#35363a] rounded text-[#9aa0a6] hover:text-[#e8eaed] text-[9px] font-bold uppercase tracking-widest transition-colors"
          >
            Purge
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-[#202124]">
        <div className="h-9 bg-[#292a2d] border-b border-[#3c4043] flex items-center px-2 gap-4 shrink-0">
          <select
            value={niveauFilter}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'ALL') {
                setNiveauFilter('ALL');
              } else if (isLogNiveau(value)) {
                setNiveauFilter(value);
              }
            }}
            className="bg-transparent text-[#e8eaed] outline-none"
          >
            <option value="ALL">All levels</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARNING">Warnings</option>
            <option value="ERROR">Errors</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showTrace}
              onChange={(e) => setShowTrace(e.target.checked)}
              className="accent-[#8ab4f8]"
            />
            <span className="text-[10px] text-[#9aa0a6]">Trace</span>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto select-text selection:bg-[#3c4043]">
          {gefilterdeLogs.map((log) => {
            const metaMatches = parseMetaMatches(log.meta);
            return (
            <div key={log.id} className="flex flex-col border-b border-[#292a2d]">
              <div
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                className={`flex items-start gap-2 py-1 px-2 hover:bg-[#292a2d] cursor-pointer transition-colors ${
                  expandedLogId === log.id ? 'bg-[#35363a]' : ''
                }`}
              >
                <span className="text-[#9aa0a6] min-w-[65px] tabular-nums">{new Date(log.tijdstempel).toLocaleTimeString()}</span>
                <span className="min-w-[42px] text-center text-[9px] text-[#9aa0a6]">{getIcon(log)}</span>
                <div className="flex flex-1 gap-2 min-w-0 overflow-hidden">
                  <span className="font-bold text-[#e8eaed] whitespace-nowrap">{log.actie}:</span>
                  <span
                    className={`flex-1 truncate ${
                      log.niveau === 'ERROR'
                        ? 'text-[#f28b82]'
                        : log.niveau === 'WARNING'
                          ? 'text-[#fdd663]'
                          : log.niveau === 'SUCCESS'
                            ? 'text-[#81c995]'
                            : 'text-[#bdc1c6]'
                    }`}
                  >
                    {log.bericht}
                  </span>
                </div>
                <span className="text-[10px] text-[#8ab4f8] opacity-40 hover:opacity-100 transition-opacity ml-auto pl-2 whitespace-nowrap">
                  {log.bron.url === 'INTERNAL (BACKGROUND)'
                    ? 'INTERNAL'
                    : log.bron.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                </span>
              </div>

              {expandedLogId === log.id && (
                <div className="ml-8 my-1 mr-4 bg-[#1a1b1e] border border-[#3c4043] rounded-sm p-2 shadow-inner animate-in fade-in duration-200">
                  <div className="flex flex-col gap-1 mb-2 text-[9px] border-b border-[#3c4043] pb-1 font-bold">
                    <div className="flex justify-between items-center">
                      <span className="text-[#9aa0a6] uppercase tracking-tighter">Signal Context</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(log.bron.url);
                        }}
                        className="text-[#8ab4f8] hover:text-white transition-colors"
                      >
                        COPY URL
                      </button>
                    </div>
                    <span className="text-[#8ab4f8] break-all leading-relaxed whitespace-pre-wrap">{log.bron.url}</span>
                  </div>

                  {metaMatches ? (
                    <div className="flex flex-col">
                      {metaMatches.map((m, i) => (
                        <div
                          key={`${log.id}-${i}`}
                          className="flex items-center gap-2 py-0.5 px-1 hover:bg-[#292a2d] rounded-sm group no-wrap whitespace-nowrap overflow-hidden"
                        >
                          <span className={`w-1 h-3 rounded-full shrink-0 ${m.live ? 'bg-[#f28b82]' : 'bg-[#3c4043]'}`}></span>
                          <span className="text-[#e8eaed] font-bold min-w-[220px] truncate shrink-0">{m.teams}</span>
                          <span
                            className={`text-[8px] px-1 rounded-sm shrink-0 ${
                              m.live ? 'bg-[#f28b82]/10 text-[#f28b82]' : 'bg-[#3c4043] text-[#9aa0a6]'
                            }`}
                          >
                            {m.live ? 'LIVE' : 'PRE'}
                          </span>
                          <span className="text-[8px] text-[#5f6368] uppercase font-bold shrink-0">1X2</span>
                          <div className="flex gap-3 ml-auto pr-2 shrink-0">
                            {parseOddsValues(m.odds).map((odd, oi) => (
                              <div key={`${log.id}-${i}-${oi}`} className="flex gap-1 items-baseline">
                                <span className="text-[8px] text-[#5f6368]">{oi === 0 ? '1' : oi === 1 ? 'X' : '2'}</span>
                                <span className="text-[#81c995] font-bold min-w-[30px] text-right">{odd}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="text-[10px] text-[#8ab4f8] leading-tight overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(log.meta, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
        <div className="h-6 bg-[#202124] border-t border-[#3c4043] flex items-center px-3 justify-between text-[9px] text-[#9aa0a6] font-bold tracking-widest uppercase shrink-0">
          <div className="flex gap-4">
            <span>v2.3.1</span>
            <span>Stealth Active</span>
          </div>
          <div className="flex gap-2 items-center text-[#81c995]">
            <div className="w-1 h-1 rounded-full bg-[#81c995]"></div>
            Nominal
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
