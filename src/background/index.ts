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
    // We sturen direct een 'ok' terug zodat de content script niet wacht
    sendResponse({ status: 'received' });
    
    // Start de verwerking asynchroon
    verwerkInkomendeScan(request.payload).catch((err: any) => {
        console.error('Kritieke fout in verwerking:', err);
    });
  }
  return true; // Geeft aan dat we asynchroon antwoord kunnen geven (hoewel we dat hier direct doen)
});