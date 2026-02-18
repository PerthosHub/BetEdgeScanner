import { useEffect, useState } from 'react';
import type { LiveScanMatch, ScanStatusPayload } from '../types';
import { VERSION_INFO } from '../version';

type ScanStatusState = ScanStatusPayload & {
  updatedAt?: number;
  tabId?: number;
};

type ScannerLog = {
  id: string;
  actie: string;
  omschrijving?: string;
  payload?: Record<string, unknown> | null;
  type: 'info' | 'success' | 'warning' | 'error';
  tijdstempelMs?: number;
};

type DebugStats = {
  oddsData: number;
  opgeslagen: number;
  versGemarkeerd: number;
  hartslagVerwerkt: number;
  duplicate: number;
  noUser: number;
  noBroker: number;
  dbErrors: number;
  laatsteBlokkade: string;
};

interface DebugRowProps {
  label: string;
  value: number | string;
  helpText: string;
  valueClassName?: string;
}

const DebugRow = ({ label, value, helpText, valueClassName = '' }: DebugRowProps) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-1.5">
      <span className="text-slate-400">{label}</span>
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-700 text-[10px] text-slate-400 cursor-help"
        title={helpText}
      >
        ?
      </span>
    </div>
    <span className={valueClassName}>{value}</span>
  </div>
);

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
  const [debugStats, setDebugStats] = useState<DebugStats>({
    oddsData: 0,
    opgeslagen: 0,
    versGemarkeerd: 0,
    hartslagVerwerkt: 0,
    duplicate: 0,
    noUser: 0,
    noBroker: 0,
    dbErrors: 0,
    laatsteBlokkade: '-',
  });

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
      const storage = await chrome.storage.local.get([statusKey, 'scanner_logs']);
      const status = storage[statusKey] as ScanStatusState | undefined;
      setScanStatus(status || null);

      const logs = (storage.scanner_logs as ScannerLog[] | undefined) || [];
      const sinceMs = Date.now() - (2 * 60 * 1000);
      const actieveHost = status?.url ? formatHost(status.url) : '';

      const recenteLogs = logs.filter((log) => {
        if (!log.tijdstempelMs || log.tijdstempelMs < sinceMs) return false;
        const payloadUrl = typeof log.payload?.url === 'string' ? log.payload.url : '';
        if (!actieveHost || !payloadUrl) return true;
        return formatHost(payloadUrl) === actieveHost;
      });

      const hasAction = (log: ScannerLog, action: string): boolean => log.actie.toLowerCase() === action.toLowerCase();

      const oddsData = recenteLogs.filter((l) => hasAction(l, 'Wijzigingen Gevonden')).length;
      const opgeslagen = recenteLogs.filter((l) => hasAction(l, 'Opgeslagen')).length;
      const versGemarkeerd = recenteLogs
        .filter((l) => hasAction(l, 'Versheid bijgewerkt') || hasAction(l, 'Heartbeat verwerkt'))
        .reduce((sum, log) => {
          const n = Number(log.payload?.seenEvents);
          return sum + (Number.isFinite(n) ? n : 0);
        }, 0);
      const hartslagVerwerkt = recenteLogs.filter((l) => hasAction(l, 'Heartbeat verwerkt')).length;
      const duplicate = recenteLogs.filter((l) => hasAction(l, 'Duplicate guard')).length;
      const noUser = recenteLogs.filter((l) => hasAction(l, 'Geen gebruiker')).length;
      const noBroker = recenteLogs.filter((l) => hasAction(l, 'Onbekend') || hasAction(l, 'Hartslag genegeerd')).length;
      const dbErrors = recenteLogs.filter((l) => hasAction(l, 'DB Fout') || hasAction(l, 'DB write definitief mislukt')).length;
      const blokkeerLog = recenteLogs.find((l) =>
        hasAction(l, 'Duplicate guard') ||
        hasAction(l, 'Geen gebruiker') ||
        hasAction(l, 'Onbekend') ||
        hasAction(l, 'Hartslag genegeerd') ||
        hasAction(l, 'DB Fout') ||
        hasAction(l, 'DB write definitief mislukt')
      );

      setDebugStats({
        oddsData,
        opgeslagen,
        versGemarkeerd,
        hartslagVerwerkt,
        duplicate,
        noUser,
        noBroker,
        dbErrors,
        laatsteBlokkade: blokkeerLog ? `${blokkeerLog.actie}${blokkeerLog.omschrijving ? `: ${blokkeerLog.omschrijving}` : ''}` : '-',
      });
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

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Scan controle (laatste 2 minuten)</div>
            <div className="text-[11px] text-slate-500 mb-2">Alleen voor deze pagina/broker</div>
            <div className="space-y-1 text-xs">
              <DebugRow
                label="Nieuwe odds gevonden"
                value={debugStats.oddsData}
                helpText="Hoe vaak BES echt nieuwe of veranderde odds zag op deze pagina. Als dit 0 blijft terwijl odds zichtbaar veranderen, zit het probleem in parser/detectie."
              />
              <DebugRow
                label="Succesvol naar database"
                value={debugStats.opgeslagen}
                valueClassName="text-emerald-300"
                helpText="Hoe vaak de gevonden odds ook echt zijn opgeslagen in de database. Dit hoort meestal bijna gelijk te lopen met 'Nieuwe odds gevonden'."
              />
              <DebugRow
                label="Gecheckt en vers gemarkeerd"
                value={debugStats.versGemarkeerd}
                valueClassName="text-cyan-300"
                helpText="Aantal wedstrijden dat in de laatste 2 minuten als gezien is gemarkeerd. Dit telt ook updates zonder odds-wijziging (heartbeat)."
              />
              <DebugRow
                label="Levenssignaal verwerkt"
                value={debugStats.hartslagVerwerkt}
                valueClassName={debugStats.hartslagVerwerkt > 0 ? 'text-cyan-300' : ''}
                helpText="Hoe vaak BES in de laatste 2 minuten een heartbeat heeft verwerkt. Dit betekent: scanner leeft en houdt versheid bij, ook zonder nieuwe odds."
              />
              <DebugRow
                label="Overgeslagen: dubbele update"
                value={debugStats.duplicate}
                valueClassName={debugStats.duplicate > 0 ? 'text-amber-300' : ''}
                helpText="Zelfde update is kort daarna nog eens gezien. BES slaat die bewust over als anti-spam. Af en toe is normaal; heel vaak kan op ruis of te snelle herhaling wijzen."
              />
              <DebugRow
                label="Niet ingelogd"
                value={debugStats.noUser}
                valueClassName={debugStats.noUser > 0 ? 'text-amber-300' : ''}
                helpText="BES probeerde te schrijven zonder geldige scanner-user login. Dan komt er niets in BEP. Controleer auth/login status."
              />
              <DebugRow
                label="Geen broker-koppeling"
                value={debugStats.noBroker}
                valueClassName={debugStats.noBroker > 0 ? 'text-amber-300' : ''}
                helpText="Pagina-URL kon niet gekoppeld worden aan een actieve broker. Check website-url, group en isActive in brokerconfig."
              />
              <DebugRow
                label="Database fout"
                value={debugStats.dbErrors}
                valueClassName={debugStats.dbErrors > 0 ? 'text-red-300' : ''}
                helpText="Schrijven naar database is mislukt (bijv. netwerk, schema, permissie of query-fout). Kijk monitor/Supabase logs voor de exacte fout."
              />
              <div className="pt-2 text-slate-500">
                Laatste blokkade: <span className="text-slate-300">{debugStats.laatsteBlokkade}</span>
              </div>
            </div>
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
