// FILE: src/monitor/App.tsx
import { useEffect, useState, useRef } from 'react';
import { LogBericht, LogNiveau } from '../types';

const App = () => {
    const [logs, setLogs] = useState<LogBericht[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [filterTrace, setFilterTrace] = useState(true); // Standaard TRACE aan
    const endOfLogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Maak verbinding met Background Script 'Radio'
        const port = chrome.runtime.connect({ name: 'monitor_stream' });
        
        setIsConnected(true);

        port.onMessage.addListener((msg: LogBericht) => {
            setLogs(prev => [...prev.slice(-199), msg]); // Max 200 regels in geheugen
        });

        port.onDisconnect.addListener(() => {
            setIsConnected(false);
        });

        return () => {
            port.disconnect();
        };
    }, []);

    // Auto-scroll naar beneden
    useEffect(() => {
        endOfLogRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const getKleur = (niveau: LogNiveau) => {
        switch(niveau) {
            case 'SUCCESS': return 'text-emerald-400';
            case 'WARNING': return 'text-amber-400';
            case 'ERROR': return 'text-red-500 font-bold';
            case 'TRACE': return 'text-slate-500';
            default: return 'text-blue-300';
        }
    };

    const gefilterdeLogs = logs.filter(l => filterTrace || l.niveau !== 'TRACE');

    return (
        <div className="bg-slate-950 min-h-screen text-slate-200 font-mono text-sm p-4">
            {/* HEADER */}
            <div className="fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center z-10 shadow-lg">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-emerald-500">Flight Tower <span className="text-slate-500 text-sm">Monitor</span></h1>
                    <div className={`px-2 py-0.5 rounded text-xs ${isConnected ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'}`}>
                        {isConnected ? 'LIVE' : 'DISCONNECTED'}
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                        <input type="checkbox" checked={filterTrace} onChange={e => setFilterTrace(e.target.checked)} />
                        Toon Trace/Idle Logs
                    </label>
                    <button onClick={() => setLogs([])} className="bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-xs">
                        Clear
                    </button>
                </div>
            </div>

            {/* LOG TABLE */}
            <div className="mt-16 w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-[80px_60px_1fr_2fr] gap-2 text-xs text-slate-500 border-b border-slate-800 pb-2 mb-2 font-bold uppercase tracking-wider">
                    <div>Tijd</div>
                    <div>Type</div>
                    <div>Bron</div>
                    <div>Bericht</div>
                </div>

                {gefilterdeLogs.map(log => (
                    <div key={log.id} className="group">
                        <div 
                            className={`grid grid-cols-[80px_60px_1fr_2fr] gap-2 py-1 border-b border-slate-900 hover:bg-white/5 cursor-pointer transition-colors ${getKleur(log.niveau)}`}
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        >
                            <div className="opacity-60">{new Date(log.tijdstempel).toLocaleTimeString()}</div>
                            <div className="font-bold">{log.niveau}</div>
                            <div className="truncate opacity-70" title={log.bron.url}>
                                {log.bron.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]} 
                                {log.bron.tabId && <span className="ml-1 text-[9px] bg-slate-800 px-1 rounded">TAB {log.bron.tabId}</span>}
                            </div>
                            <div className="truncate">{log.actie}: <span className="text-slate-400">{log.bericht}</span></div>
                        </div>
                        
                        {/* EXPANDED JSON VIEW */}
                        {expandedLogId === log.id && log.meta && (
                            <div className="bg-slate-900 p-4 my-1 rounded border border-slate-800 overflow-x-auto">
                                <pre className="text-[10px] text-slate-300 leading-relaxed">
                                    {JSON.stringify(log.meta, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={endOfLogRef} />
            </div>
        </div>
    );
};

export default App;