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

export const verwerkEnSlaOp = async (verzoek: OpslagVerzoek) => {
  try {
    const { brokerId, brokerName, matches, userId, sport } = verzoek;

    if (matches.length === 0) return;

    const { data: captureData, error: captureError } = await supabase
      .from('odds_captures')
      .insert({
        broker_id: brokerId,
        broker_name: brokerName,
        user_id: userId,
        source: 'Extension',
        sport: sport || 'Onbekend',
        captured_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (captureError) throw new Error(`Capture Error: ${captureError.message}`);

    const captureId = captureData.id;
    await voegLogToe('ACHTERGROND (BREIN)', 'Capture opgeslagen', `ID: ${captureId}`, { broker: brokerName }, 'info');

    await chrome.storage.local.set({ [`sessie_${brokerId}`]: captureId });

    const linesToInsert = matches.map((m) => ({
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
      event_url: m.eventUrl || null,
    }));

    const { error: linesError } = await supabase.from('odds_lines').insert(linesToInsert);

    if (linesError) throw new Error(`Lines Error: ${linesError.message}`);

    await voegLogToe(
      'ACHTERGROND (BREIN)',
      'Opgeslagen',
      `${matches.length} matches voor ${brokerName}`,
      {
        count: matches.length,
        broker: brokerName,
        matches: matches.map((m) => ({
          teams: `${m.homeNameRaw} vs ${m.awayNameRaw}`,
          odds: `[${m.odds1}, ${m.oddsX}, ${m.odds2}]`,
          live: m.isLive,
        })),
      },
      'success'
    );
  } catch (error: unknown) {
    console.error('DB FOUT:', error);
    const bericht = error instanceof Error ? error.message : String(error);
    await voegLogToe('ACHTERGROND (BREIN)', 'DB Fout', bericht, null, 'error');
  }
};

export const updateLevensTeken = async (brokerId: string) => {
  try {
    const storageKey = `sessie_${brokerId}`;
    const storage = await chrome.storage.local.get([storageKey]);
    const captureId = storage[storageKey];

    if (!captureId) {
      await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat genegeerd', 'Geen actieve sessie', { brokerId }, 'warning');
      return;
    }

    const { error } = await supabase
      .from('odds_captures')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', captureId);

    if (error) throw error;

    console.log(`Heartbeat verwerkt voor ${brokerId} (Sessie: ${captureId})`);
    await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat verwerkt', `Sessie: ${captureId}`, { brokerId }, 'info');
  } catch (error: unknown) {
    console.error('Heartbeat Fout:', error);
    const bericht = error instanceof Error ? error.message : String(error);
    await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat fout', bericht, { brokerId }, 'error');
  }
};
