// FILE: src/types.ts
// DE KANGOEROE IS GELAND
// --- Betting & Calculator Types ---

export enum BetMode {
  QUALIFYING = 'Bonus vrijspelen',
  FREE_BET = 'Free Bet (SNR)',
}

export const BET_MODE_LABELS: Record<BetMode, string> = {
  [BetMode.QUALIFYING]: 'Freebet vrijspelen',
  [BetMode.FREE_BET]: 'Freebet inzetten',
};

export enum MarketType {
  TWO_WAY = '2-Weg', // Tennis, NBA
  THREE_WAY = '3-Weg', // Football/Soccer
}

export const MARKET_TYPE_LABELS: Record<MarketType, string> = {
  [MarketType.THREE_WAY]: '3-Weg',
  [MarketType.TWO_WAY]: '2-Weg',
};

export type SportFilter = 'all' | 'Voetbal' | 'Tennis';

// --- Navigation Types ---
// AANGEPAST: 'quickscan' en 'OddsBeater' volledig verwijderd (v3.20+)
export type AppTab = 'dashboard' | 'promotions' | 'resultaten' | 'history' | 'brokers';

export interface Broker {
  id: string;
  name: string;
  website?: string;
  group: string;
  notes?: string;
  isActive: boolean;
}

export interface BetSelection {
  outcome: string;
  brokerId: string;
  brokerName?: string;
  brokerWebsite?: string;
  odd: number;
  stake: number;
  isFreeBet?: boolean;
  isFixed?: boolean;
}

export interface BetLog {
  id: string;
  date: string;
  matchDate: string | null;
  matchTime: string | null;
  matchName: string;
  marketType: MarketType;
  mode: BetMode;
  selections: BetSelection[];
  totalStake: number;
  guaranteedProfit: number;
  profitPercentage: number;
  notes?: string;
  promotionId?: string;
}

export interface CalculationResult {
  selections: BetSelection[];
  totalStake: number;
  totalReturn: number;
  profit: number;
  profitPercentage: number;
  impliedProbability: number;
  warnings: string[];
}

export interface ChartDataItem {
  date: string;
  profit: number;
  dailyProfit: number;
}

// --- Styling Types ---

export interface GroupStyle {
  text: string;
  bg: string;
  border: string;
  dot: string;
}

export const GROUP_STYLES: Record<string, GroupStyle> = {
  'Kambi':    { text: 'text-amber-200', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' },
  'TOTO':     { text: 'text-emerald-200', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  'Bet365':   { text: 'text-teal-200', bg: 'bg-teal-500/10', border: 'border-teal-500/20', dot: 'bg-teal-500' },
  'Playtech': { text: 'text-blue-200', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  'Bingoal':  { text: 'text-red-200', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' },
  'Gaming1':  { text: 'text-purple-200', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: 'bg-purple-500' },
  'Metric':   { text: 'text-pink-200', bg: 'bg-pink-500/10', border: 'border-pink-500/20', dot: 'bg-pink-500' },
  'Betsson':  { text: 'text-orange-200', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' },
  'Soft':     { text: 'text-indigo-200', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', dot: 'bg-indigo-500' },
  'SBTech':   { text: 'text-slate-200', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-400' },
};

export const getGroupStyle = (groupName: string): GroupStyle => {
  const key = Object.keys(GROUP_STYLES).find(k => groupName.toLowerCase().includes(k.toLowerCase()));
  return key ? GROUP_STYLES[key] : { text: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700', dot: 'bg-slate-500' };
};

// --- Promotions 2.0 Types ---

export enum PromotionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
}

export enum PromotionType {
  DEPOSIT = 'storting',         
  QUALIFYING_BET = 'vrijspelen', 
  WAGERING = 'rondspelen',
  FREEBET = 'freebet_inzet',    
  OTHER = 'overig',
}

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  [PromotionType.DEPOSIT]: 'Stortingsbonus',
  [PromotionType.QUALIFYING_BET]: 'Freebet Vrijspelen',
  [PromotionType.WAGERING]: 'Rondspelen', 
  [PromotionType.FREEBET]: 'Freebet Inzetten',
  [PromotionType.OTHER]: 'Overig',
};

export interface PromotionDef {
  id: string;
  brokerId: string;
  brokerName: string;
  title: string;
  description?: string;
  requirements?: string;
  expiryDate?: string;
  createdAt: string;
  createdBy: string;
  category?: string;
  league?: string;
  sport?: string;
  type: PromotionType;
  minAmount?: number;
  minOdds?: number;
  freebetAmount?: number;
  lastUpdated: string;
}

export interface UserPromotionStatus {
  userId: string;
  promotionId: string;
  isActivated: boolean;
  isPlaced: boolean;
  isBonusReceived: boolean;
  status: PromotionStatus;
  completedAt?: string;
  updatedAt: string;
}

export interface Promotion extends PromotionDef, Omit<UserPromotionStatus, 'userId' | 'promotionId' | 'updatedAt'> {
  isClaimed: boolean;
}

// --- Odds Scanner Types ---

export enum IdentificationStatus {
  MATCHED = 'matched',
  SUGGESTION = 'suggestion',
  UNKNOWN = 'unknown',
  NEW = 'new'
}

export interface OddsCapture {
  id: string;
  brokerId?: string;
  brokerName?: string;
  sport?: string;
  league?: string;
  capturedAt: string;
  source?: string;
  rawData?: unknown;
  lines?: OddsLine[];
}

export interface OddsLine {
  id: string;
  captureId: string;
  marketType: MarketType;
  eventDate?: string;
  eventTime?: string;
  homeNameRaw?: string;
  awayNameRaw?: string;
  homeNameNorm?: string;
  awayNameNorm?: string;
  odds1?: number;
  oddsX?: number;
  odds2?: number;
  externalEventId?: string;
  eventUrl?: string;
  isLive?: boolean;
  canonicalEventId?: string;
  eventTimestamp?: string;
}

export interface MatchTimeOverride {
  matchKey: string;
  homeNorm: string;
  awayNorm: string;
  eventDate?: string;
  eventTime?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface TeamAlias {
  id: string;
  sport?: string;
  league?: string;
  alias: string;
  canonical: string;
  createdAt: string;
}

export interface MatchTimeCandidate {
  eventDate?: string;
  eventTime?: string;
}

export interface ScannedMatch {
  key: string;
  sport?: string;
  league?: string;
  eventDate?: string;
  eventTime?: string;
  homeDisplay: string;
  awayDisplay: string;
  homeNorm: string;
  awayNorm: string;
  marketType: MarketType;
  lastSeenAt: string;
  timeCandidates: MatchTimeCandidate[];
  hasTimeConflict: boolean;
  brokers: Array<{
    brokerId: string;
    brokerName: string;
    lineId: string;
    odds: [number, number, number];
    lastSeenAt: string;
  }>;
  best: CalculationResult | null;
}

export type ChangeType = 
  | 'FEATURE' 
  | 'FIX' 
  | 'SECURITY' 
  | 'PERFORMANCE' 
  | 'REFACTOR' 
  | 'UX' 
  | 'SAFETY';

export interface ChangelogEntry {
    type: ChangeType;
    text: string;
    technicalDetails?: string; 
}

export interface ChangelogItem {
  version: string;
  date: string;
  changes: string[]; 
  detailedChanges?: ChangelogEntry[];
}

export interface ManualOutcomeInput {
  label: string;
  odd: string;
  brokerId: string;
}

export { formatDateWithLabels, formatTimeAgo } from './utils/date';

// --- Monitor & Logging Types ---

export type LogNiveau = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TRACE';

export interface LogBericht {
    id: string;
    tijdstempel: number;
    niveau: LogNiveau;
    bron: {
        url: string;
        tabId?: number;
    };
    actie: string;
    bericht: string;
    meta?: any;
}

export interface ScanPayload {
    url: string;
    sport?: string;
    matches: any[];
    totaalGevonden: number;
}

export interface HeartbeatPayload {
    url: string;
    timestamp: number;
}