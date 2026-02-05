// FILE: src/utils/normalization.ts

/**
 * STRIP DIACRITICS: Verwijder accenten (é -> e, ñ -> n)
 */
const stripDiacritics = (value: string): string => {
  try {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return value;
  }
};

/**
 * NORMALIZE TEAM NAME: Het 'Brein' van de normalisatie.
 * Wordt gedeeld tussen BEP en BES om exact dezelfde sleutels te genereren.
 */
export const normalizeTeamName = (value: string): string => {
  if (!value) return '';
  let input = value;

  // STAP 0: "Achternaam, Voornaam" detectie (Tennis)
  if (input.includes(',')) {
    const parts = input.split(',');
    if (parts.length === 2) {
      input = `${parts[1]} ${parts[0]}`;
    }
  }

  // STAP 1: Standaard opschoning (Accenten weg, lowercase)
  const raw = stripDiacritics(input)
    .toLowerCase()
    .trim();

  // STAP 2: Tekens opschonen
  // 1. Verwijder punten direct (S.C. Braga -> SC Braga)
  // 2. Vervang streepjes door spaties (Paris-SG -> Paris SG)
  // 3. Verwijder alle andere vreemde tekens
  const cleaned = raw
    .replace(/\./g, '')           // Punten weg
    .replace(/-/g, ' ')           // Streepjes worden spaties
    .replace(/[’'`"]/g, '')       // Apostrofes weg
    .replace(/[^a-z0-9\s]/g, ' ') // Rest wordt spatie
    .replace(/\s+/g, ' ')         // Dubbele spaties weg
    .trim();

  // STAP 3: Voorvoegsels strippen
  const tokens = cleaned.split(' ');
  const commonPrefixes = new Set(['fc', 'sc', 'sv', 'fk', 'ac', 'cf', 'afc', 'vv', 'rb', 'gnk', 'pfc', 'rc', 'osc']);
  
  const withoutPrefix = tokens.length > 1 && commonPrefixes.has(tokens[0]) 
    ? tokens.slice(1).join(' ') 
    : cleaned;

  // STAP 4: Achtervoegsels strippen
  const tokensEnd = withoutPrefix.split(' ');
  const lastToken = tokensEnd[tokensEnd.length - 1];
  const commonSuffixes = new Set(['fc', 'cf', 'osc', '1893', 'ev']);

  const finalName = (tokensEnd.length > 1 && commonSuffixes.has(lastToken))
    ? tokensEnd.slice(0, -1).join(' ')
    : withoutPrefix;

  return finalName.trim();
};

/**
 * FORMAT NAME FOR DISPLAY: Handige helper voor de UI
 */
export const formatNameForDisplay = (rawName: string): string => {
  if (!rawName) return '';
  if (rawName.includes(',')) {
    const parts = rawName.split(',');
    if (parts.length === 2) {
      return `${parts[1].trim()} ${parts[0].trim()}`;
    }
  }
  return rawName;
};
