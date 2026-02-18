import { supabase } from '../lib/supabase';
import { voegLogToe } from '../utils/storage';
import { OddsLine } from '../types';
import { normalizeTeamName } from '../utils/normalization';

interface OpslagVerzoek {
  brokerId: string;
  brokerName: string;
  matches: Partial<OddsLine>[];
  seenEventIds?: string[];
  sport: string;
  sourceUrl: string;
  userId: string;
  scanRunId: string;
  payloadFingerprint: string;
}

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;
const HEARTBEAT_MISS_LOG_WINDOW_MS = 120_000;
const laatsteHeartbeatMissLogPerBroker = new Map<string, number>();
const LINE_FRESHNESS_TABLE = 'odds_line_freshness';
let lineFreshnessSchemaEnabled = true;
let lineFreshnessSchemaWarningLogged = false;

const wacht = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(
  label: string,
  scanRunId: string,
  brokerId: string,
  task: () => Promise<T>
): Promise<T> => {
  let laatsteFout: unknown;

  for (let poging = 1; poging <= RETRY_ATTEMPTS; poging++) {
    try {
      return await task();
    } catch (error: unknown) {
      laatsteFout = error;
      const bericht = error instanceof Error ? error.message : String(error);
      const laatstePoging = poging === RETRY_ATTEMPTS;

      await voegLogToe(
        'ACHTERGROND (BREIN)',
        laatstePoging ? 'DB write definitief mislukt' : 'DB write retry',
        `${label} poging ${poging}/${RETRY_ATTEMPTS} ${laatstePoging ? 'mislukt' : 'faalt, opnieuw proberen'}`,
        { scanRunId, brokerId, label, poging, error: bericht },
        laatstePoging ? 'error' : 'warning'
      );

      if (!laatstePoging) {
        await wacht(RETRY_BASE_DELAY_MS * poging);
      }
    }
  }

  throw laatsteFout;
};

export const verwerkEnSlaOp = async (verzoek: OpslagVerzoek) => {
  try {
    const { brokerId, brokerName, matches, seenEventIds, userId, sport, scanRunId, sourceUrl, payloadFingerprint } = verzoek;

    if (matches.length === 0) return;

    const captureResult = await withRetry(
      'capture_insert',
      scanRunId,
      brokerId,
      async () => {
        const { data, error } = await supabase
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

        if (error) throw new Error(`Capture Error: ${error.message}`);
        return data;
      }
    );

    const captureId = captureResult.id;
    await voegLogToe(
      'ACHTERGROND (BREIN)',
      'Capture opgeslagen',
      `ID: ${captureId}`,
      { broker: brokerName, brokerId, scanRunId, sourceUrl, payloadFingerprint },
      'info'
    );

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

    await withRetry(
      'lines_insert',
      scanRunId,
      brokerId,
      async () => {
        const { error } = await supabase.from('odds_lines').insert(linesToInsert);
        if (error) throw new Error(`Lines Error: ${error.message}`);
      }
    );

    const opgeslagenEventIds = matches
      .map((m) => String(m.externalEventId || '').trim())
      .filter((id) => id.length > 0);
    const alleGezieneEventIds = Array.from(
      new Set([
        ...opgeslagenEventIds,
        ...((seenEventIds || []).map((id) => String(id || '').trim()).filter((id) => id.length > 0)),
      ])
    );

    if (alleGezieneEventIds.length > 0) {
      try {
        await schrijfLineFreshness(userId, brokerId, scanRunId, alleGezieneEventIds);
        await voegLogToe(
          'ACHTERGROND (BREIN)',
          'Versheid bijgewerkt',
          `${alleGezieneEventIds.length} events gemarkeerd als gezien.`,
          {
            brokerId,
            brokerName,
            scanRunId,
            seenEvents: alleGezieneEventIds.length,
            changedEvents: opgeslagenEventIds.length,
          },
          'info'
        );
      } catch (lineFreshnessError: unknown) {
        if (lijktLineFreshnessSchemaOntbrekend(lineFreshnessError)) {
          lineFreshnessSchemaEnabled = false;
          if (!lineFreshnessSchemaWarningLogged) {
            lineFreshnessSchemaWarningLogged = true;
            await voegLogToe(
              'ACHTERGROND (BREIN)',
              'Line freshness uitgeschakeld',
              'Schema mist: sla event-level versheid voorlopig over.',
              { brokerId, scanRunId, table: LINE_FRESHNESS_TABLE },
              'warning'
            );
          }
        } else {
          const bericht = lineFreshnessError instanceof Error ? lineFreshnessError.message : String(lineFreshnessError);
          await voegLogToe(
            'ACHTERGROND (BREIN)',
            'Line freshness fout',
            bericht,
            { brokerId, scanRunId, seenEvents: alleGezieneEventIds.length },
            'warning'
          );
        }
      }
    }

    await voegLogToe(
      'ACHTERGROND (BREIN)',
      'Opgeslagen',
      `${matches.length} matches voor ${brokerName}`,
      {
        count: matches.length,
        broker: brokerName,
        brokerId,
        scanRunId,
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

const lijktLineFreshnessSchemaOntbrekend = (error: unknown): boolean => {
  const bericht = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return bericht.includes(LINE_FRESHNESS_TABLE) && (
    bericht.includes('does not exist') ||
    bericht.includes('not found') ||
    bericht.includes('unknown column') ||
    bericht.includes('could not find')
  );
};

const schrijfLineFreshness = async (
  sourceUserId: string,
  brokerId: string,
  scanRunId: string,
  seenEventIds: string[]
) => {
  if (!lineFreshnessSchemaEnabled) return;

  const uniekeIds = Array.from(
    new Set(
      seenEventIds
        .map((id) => String(id || '').trim())
        .filter((id) => id.length > 0)
    )
  );

  if (uniekeIds.length === 0) return;

  const nuIso = new Date().toISOString();
  const rows = uniekeIds.map((externalEventId) => ({
    broker_id: brokerId,
    external_event_id: externalEventId,
    last_seen_at: nuIso,
    scan_run_id: scanRunId,
    source_user_id: sourceUserId,
    updated_at: nuIso,
  }));

  const { error } = await supabase
    .from(LINE_FRESHNESS_TABLE)
    .upsert(rows, { onConflict: 'broker_id,external_event_id' });

  if (error) throw error;
};

export const updateLevensTeken = async (
  brokerId: string,
  scanRunId: string,
  sourceUserId: string,
  seenEventIds: string[] = []
) => {
  try {
    const storageKey = `sessie_${brokerId}`;
    const storage = await chrome.storage.local.get([storageKey]);
    const captureId = storage[storageKey];

    if (!captureId) {
      const nu = Date.now();
      const laatste = laatsteHeartbeatMissLogPerBroker.get(brokerId) || 0;
      if ((nu - laatste) > HEARTBEAT_MISS_LOG_WINDOW_MS) {
        laatsteHeartbeatMissLogPerBroker.set(brokerId, nu);
        await voegLogToe(
          'ACHTERGROND (BREIN)',
          'Heartbeat genegeerd',
          'Geen actieve sessie',
          { brokerId, scanRunId },
          'warning'
        );
      }
      return;
    }

    await withRetry(
      'heartbeat_update',
      scanRunId,
      brokerId,
      async () => {
        const { error } = await supabase
          .from('odds_captures')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', captureId);

        if (error) throw error;
      }
    );

    try {
      await schrijfLineFreshness(sourceUserId, brokerId, scanRunId, seenEventIds);
    } catch (lineFreshnessError: unknown) {
      if (lijktLineFreshnessSchemaOntbrekend(lineFreshnessError)) {
        lineFreshnessSchemaEnabled = false;
        if (!lineFreshnessSchemaWarningLogged) {
          lineFreshnessSchemaWarningLogged = true;
          await voegLogToe(
            'ACHTERGROND (BREIN)',
            'Line freshness uitgeschakeld',
            'Schema mist: sla event-level versheid voorlopig over.',
            { brokerId, scanRunId, table: LINE_FRESHNESS_TABLE },
            'warning'
          );
        }
      } else {
        const bericht = lineFreshnessError instanceof Error ? lineFreshnessError.message : String(lineFreshnessError);
        await voegLogToe(
          'ACHTERGROND (BREIN)',
          'Line freshness fout',
          bericht,
          { brokerId, scanRunId, seenEvents: seenEventIds.length },
          'warning'
        );
      }
    }

    console.log(`Heartbeat verwerkt voor ${brokerId} (Sessie: ${captureId})`);
    await voegLogToe(
      'ACHTERGROND (BREIN)',
      'Heartbeat verwerkt',
      `Sessie: ${captureId}`,
      { brokerId, scanRunId, seenEvents: seenEventIds.length },
      'info'
    );
  } catch (error: unknown) {
    console.error('Heartbeat Fout:', error);
    const bericht = error instanceof Error ? error.message : String(error);
    await voegLogToe('ACHTERGROND (BREIN)', 'Heartbeat fout', bericht, { brokerId, scanRunId }, 'error');
  }
};
