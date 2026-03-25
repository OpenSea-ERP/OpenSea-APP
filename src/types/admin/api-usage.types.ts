export interface ApiMetricUsage {
  metric: string;
  used: number;
  included: number;
  overage: number;
  cost: number;
}

export interface ApiUsageCategory {
  category: string;
  label: string;
  color: string;
  totalUsed: number;
  totalIncluded: number;
  totalOverage: number;
  totalCost: number;
  metrics: ApiMetricUsage[];
}

export interface TopTenantApiCost {
  tenantId: string;
  tenantName: string;
  totalCost: number;
  breakdown: Record<string, number>; // category -> cost
}

export interface ApiUsageReport {
  period: string;
  totalCost: number;
  totalRequests: number;
  categories: ApiUsageCategory[];
  topTenantsByCost: TopTenantApiCost[];
}
