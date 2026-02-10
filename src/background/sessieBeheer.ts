// FILE: src/background/sessieBeheer.ts
import { supabase } from '../lib/supabase';
import { voegLogToe } from '../utils/storage';

const SCANNER_EMAIL = 'scanner@betedge.local';
const SCANNER_PASSWORD = 'Scanner2026!';

/**
 * Zorgt ervoor dat we een actieve User ID hebben.
 * Als de sessie verlopen is, logt hij automatisch opnieuw in.
 */
export const krijgGeldigeGebruikerId = async (): Promise<string | null> => {
  // 1. Check bestaande sessie (in geheugen van Supabase client)
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    return session.user.id;
  }

  // 2. Geen sessie? Probeer opnieuw in te loggen
  console.log('🔄 Sessie verlopen. Opnieuw inloggen...');
  
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: SCANNER_EMAIL,
    password: SCANNER_PASSWORD
  });

  if (error || !authData.user) {
    console.error('❌ Login mislukt:', error);
    const bericht = error?.message || 'Onbekende auth fout';
    voegLogToe('AUTH', 'Login Mislukt', 'Kon niet automatisch inloggen.', { error: bericht }, 'error');
    return null;
  }

  return authData.user.id;
};
