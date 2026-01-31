// FILE: src/background/configuratieLader.ts
import { supabase } from '../lib/supabase';
import { Broker } from '../types';
import { voegLogToe } from '../utils/storage';

export const verversConfiguratie = async (): Promise<Broker[]> => {
  try {
    console.log('🔄 Config verversen uit database...');

    // FIX: Gebruik de DB kolomnaam 'is_active'
    const { data, error } = await supabase
      .from('brokers')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Supabase Config Fout:', JSON.stringify(error, null, 2));
      await voegLogToe(
        'ACHTERGROND (BREIN)',
        'Config Fout',
        'Kon brokers niet ophalen uit DB',
        { errorDetails: error },
        'error'
      );
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Geen actieve brokers gevonden in database!');
      await voegLogToe('ACHTERGROND (BREIN)', 'Config Leeg', 'Geen brokers actief.', null, 'warning');
      return [];
    }

    await chrome.storage.local.set({ brokers: data });
    return data as Broker[];

  } catch (err: any) {
    console.error('💥 Kritieke fout in configuratieLader:', err);
    return [];
  }
};

export const zoekBrokerBijUrl = async (url: string): Promise<Broker | undefined> => {
  const storage = await chrome.storage.local.get(['brokers']);
  let brokers: Broker[] = (storage.brokers as Broker[]) || [];

  if (brokers.length === 0) {
    brokers = await verversConfiguratie();
  }

  const cleanUrl = url.toLowerCase().replace(/https?:\/\/(www\.)?/, '');
  
  return brokers.find(b => 
    b.website && cleanUrl.includes(b.website.toLowerCase().replace(/https?:\/\/(www\.)?/, ''))
  );
};

export const bepaalMirrorDoelwitten = async (bronBrokerId: string): Promise<string[]> => {
    const storage = await chrome.storage.local.get(['brokers']);
    const brokers: Broker[] = (storage.brokers as Broker[]) || [];

    const source = brokers.find(b => b.id === bronBrokerId);
    if (!source) return [bronBrokerId];

    // FIX: Gebruik 'group_name' en 'is_active'
    const targets = brokers
        .filter(b => b.is_active && b.group_name === source.group_name)
        .map(b => b.id);
    
    return targets.length > 0 ? targets : [bronBrokerId];
};