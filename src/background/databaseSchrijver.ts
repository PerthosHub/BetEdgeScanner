import { supabase } from '../lib/supabase';
import { voegLogToe } from '../utils/storage';
import { OddsLine } from '../types';

interface OpslagVerzoek {
  brokerId: string;
  brokerName: string;
  matches: Partial<OddsLine>[];
  sport: string;
  sourceUrl: string;
  userId: string;
}

export const verwerkEnSlaOp = async (verzoek: OpslagVerzoek) => {
  try {
    const { brokerId, brokerName, matches, userId, sport } = verzoek;

    if (matches.length === 0) return;

    // 1. Maak Capture Record (Snake Case voor DB)
    const capturePayload = {
        broker_id: brokerId,
        broker_name: brokerName,
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

    if (captureError) throw new Error(`Capture Error: ${captureError.message}`);
    
    const captureId = captureData.id;

    // 2. Bereid Lines voor
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

    const { error: linesError } = await supabase
      .from('odds_lines')
      .insert(linesToInsert);

    if (linesError) throw new Error(`Lines Error: ${linesError.message}`);

    // FIX: Gebruik exacte string 'ACHTERGROND (BREIN)'
    await voegLogToe('ACHTERGROND (BREIN)', 'Opgeslagen', `${matches.length} matches voor ${brokerName}`, null, 'success');

  } catch (error: any) {
    console.error('💥 DB FOUT:', error);
    // FIX: Gebruik exacte string 'ACHTERGROND (BREIN)'
    await voegLogToe('ACHTERGROND (BREIN)', 'DB Fout', error.message, null, 'error');
  }
};