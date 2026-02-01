import { supabase } from '../lib/supabase';
import { Broker } from '../types';
import { voegLogToe } from '../utils/storage';

interface RawBrokerRow {
    id: string;
    name: string;
    website: string | null;
    group_name: string; 
    is_active: boolean; 
    notes: string | null;
}

export const verversConfiguratie = async (): Promise<Broker[]> => {
  try {
    console.log('🔄 Config verversen uit database...');

    const { data, error } = await supabase
      .from('brokers')
      .select('id, name, website, group_name, is_active, notes') 
      .eq('is_active', true);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const mappedBrokers: Broker[] = (data as RawBrokerRow[]).map(row => ({
        id: row.id,
        name: row.name,
        website: row.website || undefined,
        group: row.group_name,   
        isActive: row.is_active, 
        notes: row.notes || undefined
    }));

    await chrome.storage.local.set({ brokers: mappedBrokers });
    return mappedBrokers;

  } catch (err: any) {
    console.error('💥 Config laadfout:', err);
    // FIX: Gebruik exacte string 'ACHTERGROND (BREIN)'
    await voegLogToe('ACHTERGROND (BREIN)', 'Config Fout', 'Kon brokers niet laden', { err }, 'error');
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

export const bepaalMirrorDoelwitten = async (bronBrokerId: string): Promise<Broker[]> => {
  const storage = await chrome.storage.local.get(['brokers']);
  const brokers: Broker[] = (storage.brokers as Broker[]) || [];

  const source = brokers.find(b => b.id === bronBrokerId);
  
  // Logica update: Check of source en group bestaan
  if (!source || !source.group) {
      console.warn(`⚠️ Kan niet spiegelen: Bron broker of groep onbekend (ID: ${bronBrokerId})`);
      return source ? [source] : [];
  }

  const sourceGroup = source.group.toLowerCase().trim();

  // Zoek targets (case-insensitive)
  const targets = brokers.filter(b => 
      b.isActive && 
      b.group && 
      b.group.toLowerCase().trim() === sourceGroup
  );
  
  console.log(`🪞 Mirror Check: Bron='${source.name}' (${sourceGroup}). Gevonden targets: ${targets.map(t => t.name).join(', ')}`);

  return targets.length > 0 ? targets : [source];
};