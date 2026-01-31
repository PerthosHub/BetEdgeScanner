// FILE: src/background/databaseSchrijver.ts
import { supabase } from '../lib/supabase';
import { voegLogToe } from '../utils/storage';
import { OddsLine } from '../types';

interface OpslagVerzoek {
  brokerId: string;
  matches: Partial<OddsLine>[];
  sport: string;
  sourceUrl: string;
  userId: string;
}

export const verwerkEnSlaOp = async (verzoek: OpslagVerzoek) => {
  try {
    const { brokerId, matches, userId, sport } = verzoek;

    if (matches.length === 0) return;

    // 1. Maak Capture Record (De "bon")
    const capturePayload = {
        broker_id: brokerId,
        user_id: userId,
        source: 'Extension',
        sport: sport || 'Onbekend',
        captured_at: new Date().toISOString()
    };

    const { data: captureData, error: captureError } = await supabase
      .from('odds_captures')
      .insert(capturePayload)
      .select('id')
      .single();

    if (captureError) {
        console.error('❌ Fout bij aanmaken Capture:', JSON.stringify(captureError, null, 2));
        throw new Error(`Capture Error: ${captureError.message}`);
    }
    
    const captureId = captureData.id;

    // 2. Bereid Lines voor (De "regels")
    const linesToInsert = matches.map(m => ({
      capture_id: captureId,
      user_id: userId,
      external_event_id: m.externalEventId,
      
      home_name_raw: m.homeNameRaw || 'Onbekend',
      away_name_raw: m.awayNameRaw || 'Onbekend',
      
      odds_1: m.odds1 || null,
      odds_x: m.oddsX || null,
      odds_2: m.odds2 || null,
      
      market_type: m.marketType || '3-Weg',
      is_live: m.isLive || false,
      event_url: m.eventUrl || null
    }));

    // 3. Bulk Insert (AANGEPAST: Was upsert)
    // We gebruiken insert() omdat we net een gloednieuwe capture_id hebben gemaakt.
    // Conflicten zijn dus onmogelijk.
    const { error: linesError } = await supabase
      .from('odds_lines')
      .insert(linesToInsert); // GEEN onConflict meer nodig

    if (linesError) {
        console.error('❌ Fout bij opslaan Lines:', JSON.stringify(linesError, null, 2));
        throw new Error(`Lines Error: ${linesError.message}`);
    }

    // 4. Log succes
    await voegLogToe(
        'ACHTERGROND (BREIN)', 
        'Opslaan', 
        `Succesvol ${matches.length} rijen toegevoegd voor broker ${brokerId}.`, 
        null, 
        'success'
    );

  } catch (error: any) {
    const errorMsg = error.message || JSON.stringify(error);
    console.error('💥 FATALE DATABASE FOUT:', errorMsg);
    
    await voegLogToe(
        'ACHTERGROND (BREIN)', 
        'DB Fout', 
        'Opslaan mislukt', 
        { technicalError: errorMsg }, 
        'error'
    );
  }
};