// FILE: src/background/index.ts
/// <reference types="chrome" />

import { verwerkInkomendeScan, verwerkHartslag } from './scanVerwerker';
import { setupLogCentrum, verwerkLogBericht } from './logCentrum'; // <-- NIEUW

console.log('🤖 BetEdge Brein: Actief (Heartbeat v2.3)');

// Start de 'Radio Zender' voor de monitor
setupLogCentrum(); // <-- NIEUW

chrome.runtime.onInstalled.addListener(() => {
    console.log("🧹 Update gedetecteerd: Opslag wissen...");
    chrome.storage.local.clear(() => {
        console.log("✅ Opslag gewist voor schone start.");
    });
});

chrome.runtime.onMessage.addListener((
  request: any, 
  sender: chrome.runtime.MessageSender, // <-- NIEUW: 'sender' toegevoegd
  sendResponse: (response?: any) => void
) => {
  
  // ROUTE 1: Nieuwe Data (Insert)
  if (request.type === 'ODDS_DATA') {
    console.log('📥 ODDS_DATA ontvangen');
    verwerkInkomendeScan(request.payload).catch(console.error);
    sendResponse({ status: 'processing_data' }); 
  }
  
  // ROUTE 2: Hartslag (Update)
  else if (request.type === 'HEARTBEAT') {
    console.log('💓 HEARTBEAT ontvangen');
    verwerkHartslag(request.payload).catch(console.error);
    sendResponse({ status: 'processing_heartbeat' });
  }

  // ROUTE 3: Logboek (NIEUW)
  else if (request.type === 'LOG_ENTRY') {
      verwerkLogBericht(request.payload, sender);
      sendResponse({ status: 'logged' });
  }
  
  // ROUTE 4: Scan Status (Popup/Hover)
  else if (request.type === 'SCAN_STATUS') {
      const tabId = sender.tab?.id;
      if (tabId) {
          const status = {
              ...request.payload,
              tabId,
              updatedAt: Date.now()
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
              `Matches: ${matchesLabel}`
          ].join('\n');

          chrome.action.setTitle({ tabId, title: titel });
      }
      sendResponse({ status: 'scan_status_saved' });
  }

  return false;
});
