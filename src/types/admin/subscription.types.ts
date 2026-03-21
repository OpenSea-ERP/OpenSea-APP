export interface TenantSubscription {
  id: string;
  tenantId: string;
  skillCode: string;
  status: string;
  quantity: number;
  customPrice: number | null;
  discountPercent: number | null;
  notes: string | null;
  grantedBy: string | null;
  startsAt: string;
  expiresAt: string | null;
}

export interface TenantConsumption {
  id: string;
  tenantId: string;
  period: string;
  metric: string;
  used: number;
  included: number;
  overage: number;
  overageCost: number;
  quantity: number;
  limit: number | null;
}

export interface TenantOverview {
  tenant: { id: string; name: string; slug: string; status: string };
  subscriptionCount: number;
  totalMRR: number;
  activeUsers: number;
  integrations: TenantIntegrationStatus[];
  recentTicketCount: number;
}

export interface TenantIntegrationStatus {
  id: string;
  tenantId: string;
  integrationType: string;
  status: string;
  lastCheckAt: string | null;
  errorMessage: string | null;
}

export interface TenantBilling {
  id: string;
  tenantId: string;
  period: string;
  subscriptionTotal: number;
  consumptionTotal: number;
  discountsTotal: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
}
