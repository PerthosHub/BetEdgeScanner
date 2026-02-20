/// <reference types="chrome" />

import { verwerkInkomendeScan, verwerkHartslag } from './scanVerwerker';
import { setupLogCentrum, verwerkLogBericht } from './logCentrum';
import { HeartbeatPayload, LogBericht, ScanPayload, ScanStatusPayload } from '../types';

type RuntimeRequest =
  | { type: 'ODDS_DATA'; payload: ScanPayload }
  | { type: 'HEARTBEAT'; payload: HeartbeatPayload }
  | { type: 'LOG_ENTRY'; payload: LogBericht }
  | { type: 'SCAN_STATUS'; payload: ScanStatusPayload }
  | { type?: string; payload?: unknown };

const BROKER_HOST_SNIPPETS = ['unibet.nl', 'toto.nl', 'circus.nl', 'tonybet.nl', 'betcity.nl'];
const SIDE_PANEL_PATH = 'src/sidepanel/sidepanel.html';
const laatstBekendeUrlPerTab = new Map<number, string>();

console.log('BetEdge Brein: Actief (Heartbeat v2.3)');

setupLogCentrum();

const isBrokerUrl = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return BROKER_HOST_SNIPPETS.some((snippet) => lower.includes(snippet));
};

const configureSidePanelVoorTab = async (tabId: number, url?: string): Promise<void> => {
  if (!chrome.sidePanel?.setOptions) return;

  const enabled = isBrokerUrl(url);
  await chrome.sidePanel.setOptions({
    tabId,
    enabled,
    path: SIDE_PANEL_PATH,
  });
};

const configurePanelBehavior = async (): Promise<void> => {
  if (!chrome.sidePanel?.setPanelBehavior) return;

  try {
    await chrome.sidePanel.setOptions({
      enabled: true,
      path: SIDE_PANEL_PATH,
    });
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.warn('Side panel behavior kon niet gezet worden.', error);
  }
};

chrome.runtime.onInstalled.addListener(() => {
  console.log('Update gedetecteerd: Opslag wissen...');
  chrome.storage.local.clear(() => {
    console.log('Opslag gewist voor schone start.');
  });

  configurePanelBehavior().catch((error) => {
    console.warn('Side panel setup fout tijdens install.', error);
  });
});

chrome.runtime.onStartup.addListener(() => {
  configurePanelBehavior().catch((error) => {
    console.warn('Side panel setup fout tijdens startup.', error);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const targetUrl = changeInfo.url || tab.url;
  if (!targetUrl) return;

  configureSidePanelVoorTab(tabId, targetUrl).catch((error) => {
    console.warn('Side panel tab update fout.', error);
  });
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    configureSidePanelVoorTab(tabId, tab.url).catch((error) => {
      console.warn('Side panel tab activatie fout.', error);
    });
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
      const vorigeUrl = laatstBekendeUrlPerTab.get(tabId);
      const contextReset = Boolean(vorigeUrl && vorigeUrl !== payload.url);
      laatstBekendeUrlPerTab.set(tabId, payload.url);

      const status = {
        ...payload,
        contextReset,
        tabId,
        updatedAt: Date.now(),
      };

      chrome.storage.local.set({ [`scan_status_${tabId}`]: status });

      const sportLabel = status.sport || 'Geen sport';
      const leagueLabel = status.league || 'Geen league';
      const matchesLabel = typeof status.matchesTotal === 'number' ? status.matchesTotal : 0;
      const parserLabel = status.parser || 'Onbekend';
      const faseLabel = status.scanPhase || 'READY';

      const titel = [
        'BetEdge Scanner',
        `Parser: ${parserLabel}`,
        `Sport: ${sportLabel}`,
        `League: ${leagueLabel}`,
        `Matches: ${matchesLabel}`,
        `Fase: ${faseLabel}`,
      ].join('\n');

      chrome.action.setTitle({ tabId, title: titel });

      configureSidePanelVoorTab(tabId, payload.url).catch((error) => {
        console.warn('Side panel status-update fout.', error);
      });
    }
    sendResponse({ status: 'scan_status_saved' });
  }

  return false;
});
