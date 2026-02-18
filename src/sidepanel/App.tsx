import { useEffect, useState } from 'react';
import type { LiveScanMatch, ScanStatusPayload } from '../types';
import { VERSION_INFO } from '../version';

type ScanStatusState = ScanStatusPayload & {
  updatedAt?: number;
  tabId?: number;
};

const faseTitel: Record<string, string> = {
  BOOTING: 'Opstarten',
  IDLE_WAIT: 'Stealth wachtmodus',
  SCANNING: 'Scannen',
  READY: 'Gereed',
};

const formatHost = (url?: string): string => {
  if (!url) return 'Onbekend';
  try {
    return new URL(url).host;
  } catch {
    return 'Onbekend';
  }
};

const formatSecondsSince = (timestamp: number | undefined, nowMs: number): string => {
  if (!timestamp) return '-';
  const seconds = Math.max(0, Math.floor((nowMs - timestamp) / 1000));
  return `${seconds}s geleden`;
};

const formatOdd = (odd?: number): string => (typeof odd === 'number' && Number.isFinite(odd) ? odd.toFixed(2) : '-');

const statusBadgeClass: Record<LiveScanMatch['status'], string> = {
  NIEUW: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  VERNIEUWD: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  GECHECKT: 'border-slate-700 bg-slate-800/80 text-slate-300',
};

const App = () => {
  const [scanStatus, setScanStatus] = useState<ScanStatusState | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const haalActieveTab = () => new Promise<chrome.tabs.Tab | undefined>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs?.[0]));
    });

    const laadStatus = async () => {
      setNowMs(Date.now());
      const actieveTab = await haalActieveTab();
      const tabId = actieveTab?.id;

      if (!tabId) {
        setScanStatus(null);
        return;
      }

      const statusKey = `scan_status_${tabId}`;
      const storage = await chrome.storage.local.get([statusKey]);
      const status = storage[statusKey] as ScanStatusState | undefined;
      setScanStatus(status || null);
    };

    laadStatus();
    const interval = window.setInterval(laadStatus, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const hasUnknownSport = !scanStatus?.sport || scanStatus.sport.toLowerCase().includes('onbekend');
  const hasUnknownLeague = !scanStatus?.league || scanStatus.league.toLowerCase().includes('onbekend');

  const faseLabel = scanStatus?.scanPhase ? (faseTitel[scanStatus.scanPhase] || scanStatus.scanPhase) : 'Nog geen data';

  const remainingIdleMs =
    !scanStatus?.idleWaitMs || !scanStatus?.updatedAt || scanStatus.scanPhase !== 'IDLE_WAIT'
      ? 0
      : Math.max(0, scanStatus.idleWaitMs - (nowMs - scanStatus.updatedAt));

  return (
    <div className="h-screen overflow-y-auto bg-slate-950 text-slate-100 p-4 font-mono">
      <header className="border-b border-slate-800 pb-3 mb-4">
        <h1 className="text-lg font-bold text-emerald-400">BetEdge Side Panel</h1>
        <div className="text-xs text-slate-400 mt-1">v{VERSION_INFO.version} | Stealth debounce: 2s</div>
      </header>

      {!scanStatus && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-400">
          Geen scannerstatus gevonden voor de actieve tab.
        </div>
      )}

      {scanStatus && (
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Host</span>
                <span className="truncate max-w-[220px] text-right">{formatHost(scanStatus.url)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Fase</span>
                <span className="text-emerald-400">{faseLabel}</span>
              </div>
              {scanStatus.scanPhase === 'IDLE_WAIT' && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Wachttijd</span>
                  <span className="text-amber-300">{Math.ceil(remainingIdleMs / 1000)}s</span>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Sport</span>
                <span>{scanStatus.sport || 'Onbekend'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">League</span>
                <span>{scanStatus.league || 'Onbekend'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Wedstrijden</span>
                <span className={scanStatus.matchesTotal > 0 ? 'text-emerald-400' : 'text-slate-300'}>
                  {scanStatus.matchesTotal}
                </span>
              </div>
            </div>
          </div>

          {(hasUnknownSport || hasUnknownLeague) && (
            <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3 text-xs text-amber-200">
              Sport of league is onbekend. Controleer deze pagina handmatig en kies straks de juiste waarden.
            </div>
          )}

          {scanStatus.contextReset && (
            <div className="rounded-lg border border-blue-700/50 bg-blue-900/20 p-3 text-xs text-blue-200">
              Nieuwe pagina in deze tab gedetecteerd. Scancontext is opnieuw gestart.
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Live payload</div>
              <div className="text-[11px] text-slate-400">
                {scanStatus.liveMatches?.length ?? 0} / {scanStatus.matchesTotal}
              </div>
            </div>

            {!scanStatus.liveMatches || scanStatus.liveMatches.length === 0 ? (
              <div className="text-xs text-slate-500">Nog geen wedstrijden in deze scanronde.</div>
            ) : (
              <div className="space-y-2">
                {scanStatus.liveMatches.map((match) => {
                  const isThreeWay = typeof match.oddsX === 'number';
                  const oddsLabel = isThreeWay
                    ? `1: ${formatOdd(match.odds1)} | X: ${formatOdd(match.oddsX)} | 2: ${formatOdd(match.odds2)}`
                    : `1: ${formatOdd(match.odds1)} | 2: ${formatOdd(match.odds2)}`;
                  return (
                    <div key={match.key} className="rounded-md border border-slate-800 bg-slate-950/60 p-2">
                      <div className="text-xs text-slate-200 truncate">
                        {match.homeNameRaw || '?'} - {match.awayNameRaw || '?'}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400 truncate">{oddsLabel}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${statusBadgeClass[match.status]}`}>
                          {match.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 px-1">
            Laatste update: {formatSecondsSince(scanStatus.updatedAt, nowMs)}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
