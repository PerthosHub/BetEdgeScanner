/// <reference types="chrome" />

import { verwerkInkomendeScan } from './scanVerwerker';

console.log('🤖 BetEdge Brein: Actief (Modulair v2.1)');

// NIEUW: Luister naar installatie/update events en wis de cache
chrome.runtime.onInstalled.addListener(() => {
    console.log("🧹 Update gedetecteerd: Opslag wissen voor schone configuratie...");
    chrome.storage.local.clear(() => {
        console.log("✅ Opslag gewist. Nieuwe broker-configuratie wordt opgehaald bij volgende scan.");
    });
});

chrome.runtime.onMessage.addListener((
  request: any, 
  _sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  if (request.type === 'ODDS_DATA') {
    verwerkInkomendeScan(request.payload).catch(console.error);
    sendResponse({ status: 'processing' }); 
  }
  return false;
});