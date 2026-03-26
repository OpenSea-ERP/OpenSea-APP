export interface ProjectedMonth {
  month: string; // YYYY-MM
  projectedRevenue: number;
  projectedExpenses: number;
  projectedBalance: number;
  confidence: number; // 0-1
  seasonalIndex: number;
}

export interface DangerZone {
  date: string;
  projectedBalance: number;
  deficit: number;
  suggestion: string;
}

export interface DailyProjection {
  date: string; // YYYY-MM-DD
  balance: number;
  isNegative: boolean;
}

export interface PredictiveCashflowReport {
  currentBalance: number;
  projectedMonths: ProjectedMonth[];
  dangerZones: DangerZone[];
  dailyProjection: DailyProjection[];
  suggestions: string[];
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}
