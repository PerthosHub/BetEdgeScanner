/// <reference types="chrome" />

import { verwerkInkomendeScan, verwerkHartslag } from './scanVerwerker';
import { setupLogCentrum, verwerkLogBericht } from './logCentrum';
import { HeartbeatPayload, LogBericht, ScanPayload } from '../types';

interface ScanStatusPayload {
  url: string;
  sport?: string;
  league?: string;
  parser?: string;
  scanRunId?: string;
  matchesTotal: number;
  matchesChanged: number;
  timestamp?: number;
}

type RuntimeRequest =
  | { type: 'ODDS_DATA'; payload: ScanPayload }
  | { type: 'HEARTBEAT'; payload: HeartbeatPayload }
  | { type: 'LOG_ENTRY'; payload: LogBericht }
  | { type: 'SCAN_STATUS'; payload: ScanStatusPayload }
  | { type?: string; payload?: unknown };

console.log('BetEdge Brein: Actief (Heartbeat v2.3)');

setupLogCentrum();

chrome.runtime.onInstalled.addListener(() => {
  console.log('Update gedetecteerd: Opslag wissen...');
  chrome.storage.local.clear(() => {
    console.log('Opslag gewist voor schone start.');
  });
});

chrome.runtime.onMessage.addListener((
  request: RuntimeRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  if (request.type === 'ODDS_DATA') {
    console.log('ODDS_DATA ontvangen');
    verwerkInkomendeScan(request.payload as ScanPayload).catch(console.error);
    sendResponse({ status: 'processing_data' });
  }

  else if (request.type === 'HEARTBEAT') {
    console.log('HEARTBEAT ontvangen');
    verwerkHartslag(request.payload as HeartbeatPayload).catch(console.error);
    sendResponse({ status: 'processing_heartbeat' });
  }

  else if (request.type === 'LOG_ENTRY') {
    verwerkLogBericht(request.payload as LogBericht, sender);
    sendResponse({ status: 'logged' });
  }

  else if (request.type === 'SCAN_STATUS') {
    const tabId = sender.tab?.id;
    if (tabId) {
      const payload = request.payload as ScanStatusPayload;
      const status = {
        ...payload,
        tabId,
        updatedAt: Date.now(),
      };
      chrome.storage.local.set({ [`scan_status_${tabId}`]: status });

      const sportLabel = status.sport || 'Geen sport';
      const leagueLabel = status.league || 'Geen league';
      const matchesLabel = typeof status.matchesTotal === 'number' ? status.matchesTotal : 0;
      const parserLabel = status.parser || 'Onbekend';

      const titel = [
        'BetEdge Scanner',
        `Parser: ${parserLabel}`,
        `Sport: ${sportLabel}`,
        `League: ${leagueLabel}`,
        `Matches: ${matchesLabel}`,
      ].join('\n');

      chrome.action.setTitle({ tabId, title: titel });
    }
    sendResponse({ status: 'scan_status_saved' });
  }

  return false;
});
