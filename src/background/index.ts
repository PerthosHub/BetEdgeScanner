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
    verwerkInkomendeScan(request.payload).catch(console.error);
    sendResponse({ status: 'processing_data' }); 
  }
  
  // ROUTE 2: Hartslag (Update)
  else if (request.type === 'HEARTBEAT') {
    verwerkHartslag(request.payload).catch(console.error);
    sendResponse({ status: 'processing_heartbeat' });
  }

  // ROUTE 3: Logboek (NIEUW)
  else if (request.type === 'LOG_ENTRY') {
      verwerkLogBericht(request.payload, sender);
      sendResponse({ status: 'logged' });
  }

  return false;
});