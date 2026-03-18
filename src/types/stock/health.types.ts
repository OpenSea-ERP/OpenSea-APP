// ============================================
// LOCATION HEALTH TYPES
// ============================================

export interface LocationHealthSummary {
  overallOccupancy: { used: number; total: number; percentage: number };
  blockedBins: { count: number };
  orphanedItems: { count: number };
  expiringItems: { count: number; thresholdDays: number };
  inconsistencies: { count: number };
}
