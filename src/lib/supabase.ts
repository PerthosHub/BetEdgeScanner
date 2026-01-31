// FILE: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL of Key ontbreekt in .env bestand!');
}

// Hier maken we de verbinding
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // CRUCIAAL VOOR EXTENSIES:
    // Service Workers hebben geen localStorage, dus we zetten sessie-opslag uit.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

console.log('🚀 Supabase Client Geïnitialiseerd (URL:', supabaseUrl, ')');