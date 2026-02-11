import { supabase } from '../lib/supabase';
import { voegLogToe } from '../utils/storage';

const SCANNER_EMAIL = 'scanner@betedge.local';
const SCANNER_PASSWORD = 'Scanner2026!';

const LOGIN_COOLDOWN_MS = 30_000;
let laatsteLoginFoutTijd = 0;
let loginInFlight: Promise<string | null> | null = null;

const probeerLogin = async (): Promise<string | null> => {
  console.log('Sessie verlopen. Opnieuw inloggen...');

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: SCANNER_EMAIL,
    password: SCANNER_PASSWORD,
  });

  if (error || !authData.user) {
    laatsteLoginFoutTijd = Date.now();
    const bericht = error?.message || 'Onbekende auth fout';
    await voegLogToe('AUTH', 'Login Mislukt', 'Kon niet automatisch inloggen.', { error: bericht }, 'error');
    return null;
  }

  laatsteLoginFoutTijd = 0;
  return authData.user.id;
};

/**
 * Zorgt ervoor dat we een actieve User ID hebben.
 * Als de sessie verlopen is, logt hij gecontroleerd opnieuw in.
 */
export const krijgGeldigeGebruikerId = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return session.user.id;
  }

  const nu = Date.now();
  if (laatsteLoginFoutTijd && (nu - laatsteLoginFoutTijd) < LOGIN_COOLDOWN_MS) {
    return null;
  }

  if (!loginInFlight) {
    loginInFlight = probeerLogin().finally(() => {
      loginInFlight = null;
    });
  }

  return loginInFlight;
};
