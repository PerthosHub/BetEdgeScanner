// FILE: src/utils/date.ts
/**
 * SHARED KERNEL: Datum Utilities voor BEP & BES
 * Dit bestand is fysiek gekoppeld via een Hard Link.
 */

const parseDateInput = (dateString?: string): Date | null => {
  if (!dateString) return null;
  const normalized = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Formatteert een datum string naar "X tijd geleden"
 * Ondersteunt zowel BEP (dagen) als BES (seconden/minuten) weergave.
 */
export const formatTimeAgo = (dateString?: string): string => {
  const date = parseDateInput(dateString);
  if (!date) return 'Onbekend';
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // BES Specifieke weergave (Live Monitor)
  if (diffInSeconds < 60) return 'zojuist';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m geleden`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}u geleden`;

  // BEP Specifieke weergave (Dashboard/History)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Vandaag';
  if (diffDays === 1) return 'Gisteren';
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week geleden' : `${weeks} weken geleden`;
  }
  return targetDate.toLocaleDateString('nl-NL');
};

/**
 * Formatteert verstreken tijd naar mm:ss vanaf een timestamp.
 * Wordt gebruikt voor "hoe vers is deze odd/check?" weergave.
 */
export const formatElapsedMmSs = (dateString?: string, nowMs: number = Date.now()): string => {
  const date = parseDateInput(dateString);
  if (!date) return '--:--';

  const elapsedMs = Math.max(0, nowMs - date.getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Formatteert een datum string naar Nederlands formaat met labels (Vandaag/Morgen)
 */
export const formatDateWithLabels = (dateString?: string | null): string => {
  if (!dateString) return 'Geen datum';

  const dateStr = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const dateFormatted = targetDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

  if (diffDays === 0) return `Vandaag ${timeStr}`;
  if (diffDays === 1) return `Morgen ${timeStr}`;
  if (diffDays === 2) return `Overmorgen ${timeStr}`;
  
  return `${dateFormatted} ${timeStr}`;
};

/**
 * KERNFUNCTIE: Normaliseert een datum string naar YYYY-MM-DD.
 * Gebruikt door AI Scanners en handmatige invoer.
 */
export const normalizeDateString = (input: string): string | null => {
  if (!input) return null;
  const cleanInput = input.trim().toLowerCase();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (['vandaag', 'today'].includes(cleanInput)) return now.toISOString().split('T')[0];
  if (['morgen', 'tomorrow'].includes(cleanInput)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  const months: Record<string, number> = {
    jan: 0, januari: 0, feb: 1, februari: 1, mrt: 2, maart: 2, apr: 3, april: 3,
    mei: 4, jun: 5, juni: 5, jul: 6, juli: 6, aug: 7, augustus: 7, sep: 8, september: 8,
    okt: 9, oktober: 9, nov: 10, november: 10, dec: 11, december: 11
  };

  const textDateRegex = /^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/;
  const textMatch = cleanInput.match(textDateRegex);
  
  if (textMatch) {
      const day = parseInt(textMatch[1], 10);
      const monthIndex = months[textMatch[2]];
      if (monthIndex !== undefined) {
          let targetYear = textMatch[3] ? parseInt(textMatch[3], 10) : currentYear;
          if (!textMatch[3] && currentMonth >= 10 && monthIndex <= 1) targetYear++;
          const d = new Date(targetYear, monthIndex, day);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dd}`;
      }
  }

  const d = new Date(cleanInput);
  if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      if (y < 2024) return null;
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
  }

  return null;
};
