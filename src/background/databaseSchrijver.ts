// FILE: src/background/databaseSchrijver.ts
import { supabase } from '../lib/supabase';
import { voegLogToe } from '../utils/storage';
import { OddsLine } from '../types';
import { normalizeTeamName } from '../utils/normalization';

interface OpslagVerzoek {
  brokerId: string;
  brokerName: string;
  matches: Partial<OddsLine>[];
  sport: string;
  sourceUrl: string;
  userId: string;
}

// FUNCTIE 1: INSERT (En schrijf sessie-ID op het briefje)
export const verwerkEnSlaOp = async (verzoek: OpslagVerzoek) => {
  try {
    const { brokerId, brokerName, matches, userId, sport } = verzoek;

    if (matches.length === 0) return;

    // 1. DB: Maak nieuwe Capture Record
    const { data: captureData, error: captureError } = await supabase
      .from('odds_captures')
      .insert({
        broker_id: brokerId,
        broker_name: brokerName,
        user_id: userId,
        source: 'Extension',
        sport: sport || 'Onbekend',
        captured_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString() // Startwaarde
      })
      .select('id')
      .single();

    if (captureError) throw new Error(`Capture Error: ${captureError.message}`);
    
    const captureId = captureData.id;
    await voegLogToe('ACHTERGROND (BREIN)', 'Capture opgeslagen', `ID: ${captureId}`, { broker: brokerName }, 'info');

    // 📝 CRUCIAAL: Schrijf ID op het 'Gele Briefje' voor de Heartbeat later
    // We gebruiken brokerId als sleutel.
    await chrome.storage.local.set({ [`sessie_${brokerId}`]: captureId });

    // 2. DB: Voeg lines toe
    const linesToInsert = matches.map(m => ({
      capture_id: captureId,
      user_id: userId,
      external_event_id: m.externalEventId,
      home_name_raw: m.homeNameRaw || 'Onbekend',
      away_name_raw: m.awayNameRaw || 'Onbekend',
      home_name_norm: normalizeTeamName(m.homeNameRaw || ''),
      away_name_norm: normalizeTeamName(m.awayNameRaw || ''),
      odds_1: m.odds1 || null,
      odds_x: m.oddsX || null,
      odds_2: m.odds2 || null,
      market_type: m.marketType || '3-Weg',
      is_live: m.isLive || false,
      event_url: m.eventUrl || null
    }));

    const { error: linesError } = await supabase
      .from('odds_lines')
      .insert(linesToInsert);

    if (linesError) throw new Error(`Lines Error: ${linesError.message}`);

    await voegLogToe('ACHTERGROND (BREIN)', 'Opgeslagen', `${matches.length} matches voor ${brokerName}`, {
        count: matches.length,
        broker: brokerName,
        matches: matches.map(m => ({
            teams: `${m.homeNameRaw} vs ${m.awayNameRaw}`,
            odds: `[${m.odds1}, ${m.oddsX}, ${m.odds2}]`,
            live: m.isLive
        }))
    }, 'success');

  } catch (error: any) {
    console.error('💥 DB FOUT:', error);
    await voegLogToe('ACHTERGROND (BREIN)', 'DB Fout', error.message, null, 'error');
  }
};

// FUNCTIE 2: UPDATE (Lees sessie-ID van het briefje)
export const updateLevensTeken = async (brokerId: string) => {
    try {
        // 1. Lees het briefje: Welke sessie was actief voor deze broker?
        const storageKey = `sessie_${brokerId}`;
        const storage = await chrome.storage.local.get([storageKey]);
        const captureId = storage[storageKey];

        if (!captureId) {
            // Geen actieve sessie bekend. Geen actie nodig.
            await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat genegeerd', 'Geen actieve sessie', { brokerId }, 'warning');
            return;
        }

        // 2. DB: Update alleen de timestamp (Heartbeat)
        const { error } = await supabase
            .from('odds_captures')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', captureId);

        if (error) throw error;

        console.log(`💓 Heartbeat verwerkt voor ${brokerId} (Sessie: ${captureId})`);
        await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat verwerkt', `Sessie: ${captureId}`, { brokerId }, 'info');

    } catch (error: any) {
        console.error('💥 Heartbeat Fout:', error);
        await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat fout', error.message, { brokerId }, 'error');
    }
};
