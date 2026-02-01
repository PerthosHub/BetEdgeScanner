// FILE: src/background/index.ts
/// <reference types="chrome" />

import { verwerkInkomendeScan } from './scanVerwerker';

console.log('🤖 BetEdge Brein: Actief (Modulair v2.0)');

// Event Listener met expliciete types om TypeScript blij te maken
chrome.runtime.onMessage.addListener((
  request: any, 
  _sender: chrome.runtime.MessageSender, 
  sendResponse: (response?: any) => void
) => {
  if (request.type === 'ODDS_DATA') {
    // Verwerk direct, maar stuur direct antwoord om de poort te sluiten
    verwerkInkomendeScan(request.payload).catch(console.error);
    sendResponse({ status: 'processing' }); 
  }
  return false; // Verander naar false als je niet asynchroon op sendResponse wacht
});