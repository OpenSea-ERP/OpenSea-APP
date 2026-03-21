export interface SystemHealth {
  apiUptime: string;
  databaseStatus: string;
  databaseLatencyMs: number;
  eventBusStatus: string;
  eventBusEventsPerMinute: number;
}

export interface IntegrationStatusItem {
  type: string;
  connected: number;
  disconnected: number;
  error: number;
  total: number;
}

export interface IntegrationError {
  tenantName: string;
  integrationType: string;
  errorMessage: string;
  lastCheckAt: string;
}

export interface IntegrationStatusReport {
  byType: IntegrationStatusItem[];
  errors: IntegrationError[];
}

export interface AiUsageTier {
  tier: string;
  queries: number;
  cost: number;
  percentage: number;
}

export interface AiUsageTopTenant {
  tenantName: string;
  cost: number;
}

export interface AiUsageReport {
  period: string;
  totalQueries: number;
  totalCost: number;
  byTier: AiUsageTier[];
  topTenants: AiUsageTopTenant[];
}

export interface TenantByStatus {
  status: string;
  count: number;
}

export interface RevenueMetrics {
  mrr: number;
  churnRate: number;
  overageTotal: number;
  tenantsByStatus: TenantByStatus[];
  upgradesThisMonth: number;
  downgradesThisMonth: number;
}
