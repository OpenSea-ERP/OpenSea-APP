import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  AiUsageReport,
  CentralUser,
  IntegrationStatusReport,
  RevenueMetrics,
  SkillDefinition,
  SkillPricing,
  SkillTreeNode,
  SlaConfig,
  SupportMetrics,
  SupportTicket,
  SystemHealth,
  TenantConsumption,
  TenantIntegrationStatus,
  TenantOverview,
  TenantSubscription,
} from '@/types/admin';
import {
  AdminFeatureFlagSchema,
  AdminPlanDetailSchema,
  AdminPlanSchema,
  AdminPlansListResponseSchema,
  AdminTenantSchema,
  AdminTenantsListResponseSchema,
  AdminTenantUserSchema,
  AdminTenantUsersListResponseSchema,
  DashboardStatsSchema,
  FeatureFlagsListResponseSchema,
  TenantDetailSchema,
  type AdminFeatureFlag,
  type AdminPlan,
  type AdminPlanDetail,
  type AdminPlanModule,
  type AdminPlansListResponse,
  type AdminTenant,
  type AdminTenantsListResponse,
  type AdminTenantUser,
  type AdminTenantUsersListResponse,
  type DashboardStats,
  type FeatureFlagsListResponse,
  type TenantDetail,
} from '@/schemas/admin.schemas';

// Re-export types for backward compatibility
export type {
  AdminFeatureFlag,
  AdminPlan,
  AdminPlanDetail,
  AdminPlanModule,
  AdminPlansListResponse,
  AdminTenant,
  AdminTenantsListResponse,
  AdminTenantUser,
  AdminTenantUsersListResponse,
  DashboardStats,
  FeatureFlagsListResponse,
  TenantDetail,
};

// API functions
export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.DASHBOARD
    );
    return DashboardStatsSchema.parse(response);
  },

  // Tenants
  listTenants: async (
    page = 1,
    limit = 20,
    search?: string,
    status?: string
  ) => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search) params.set('search', search);
    if (status) params.set('status', status);

    const response = await apiClient.get<unknown>(
      `${API_ENDPOINTS.ADMIN.TENANTS.LIST}?${params.toString()}`
    );
    return AdminTenantsListResponseSchema.parse(response);
  },

  getTenantDetails: async (id: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.GET(id)
    );
    return TenantDetailSchema.parse(response);
  },

  changeTenantStatus: async (id: string, status: string) => {
    const response = await apiClient.patch<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.CHANGE_STATUS(id),
      { status }
    );
    return AdminTenantSchema.parse(
      (response as Record<string, unknown>).tenant
    );
  },

  changeTenantPlan: async (id: string, planId: string) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.CHANGE_PLAN(id),
      { planId }
    );
    return response;
  },

  listFeatureFlags: async (id: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.FEATURE_FLAGS(id)
    );
    return FeatureFlagsListResponseSchema.parse(response);
  },

  manageFeatureFlags: async (id: string, flag: string, enabled: boolean) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.FEATURE_FLAGS(id),
      { flag, enabled }
    );
    return AdminFeatureFlagSchema.parse(
      (response as Record<string, unknown>).featureFlag
    );
  },

  createTenant: async (data: {
    name: string;
    slug?: string;
    logoUrl?: string | null;
    status?: string;
  }) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.CREATE,
      data
    );
    return AdminTenantSchema.parse(
      (response as Record<string, unknown>).tenant
    );
  },

  updateTenant: async (
    id: string,
    data: {
      name?: string;
      slug?: string;
      logoUrl?: string | null;
      settings?: Record<string, unknown>;
    }
  ) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.UPDATE(id),
      data
    );
    return AdminTenantSchema.parse(
      (response as Record<string, unknown>).tenant
    );
  },

  deleteTenant: async (id: string) => {
    const response = await apiClient.delete<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.DELETE(id)
    );
    return AdminTenantSchema.parse(
      (response as Record<string, unknown>).tenant
    );
  },

  listTenantUsers: async (id: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.USERS(id)
    );
    return AdminTenantUsersListResponseSchema.parse(response);
  },

  createTenantUser: async (
    id: string,
    data: { email: string; password: string; username?: string; role?: string }
  ) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.TENANTS.CREATE_USER(id),
      data
    );
    return {
      user: (response as Record<string, unknown>).user as Record<
        string,
        unknown
      >,
      tenantUser: AdminTenantUserSchema.parse(
        (response as Record<string, unknown>).tenantUser
      ),
    };
  },

  removeTenantUser: async (id: string, userId: string) => {
    await apiClient.delete<void>(
      API_ENDPOINTS.ADMIN.TENANTS.REMOVE_USER(id, userId)
    );
  },

  setUserSecurityKey: async (
    tenantId: string,
    userId: string,
    securityKey: string | null
  ): Promise<{ message: string }> => {
    return apiClient.patch<{ message: string }>(
      API_ENDPOINTS.ADMIN.TENANTS.SET_SECURITY_KEY(tenantId, userId),
      { securityKey }
    );
  },

  // Plans
  listPlans: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.PLANS.LIST
    );
    return AdminPlansListResponseSchema.parse(response);
  },

  getPlan: async (id: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.PLANS.GET(id)
    );
    return AdminPlanDetailSchema.parse(response);
  },

  createPlan: async (data: Partial<AdminPlan>) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.PLANS.CREATE,
      data
    );
    return AdminPlanSchema.parse((response as Record<string, unknown>).plan);
  },

  updatePlan: async (id: string, data: Partial<AdminPlan>) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.PLANS.UPDATE(id),
      data
    );
    return AdminPlanSchema.parse((response as Record<string, unknown>).plan);
  },

  deletePlan: async (id: string) => {
    const response = await apiClient.delete<unknown>(
      API_ENDPOINTS.ADMIN.PLANS.DELETE(id)
    );
    return AdminPlanSchema.parse((response as Record<string, unknown>).plan);
  },

  setPlanModules: async (id: string, modules: string[]) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.PLANS.SET_MODULES(id),
      { modules }
    );
    return (response as Record<string, unknown>).modules as AdminPlanModule[];
  },

  // === Catalog ===
  listSkillDefinitions: async (params?: { module?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.module) searchParams.set('module', params.module);
    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.ADMIN.CATALOG.SKILLS}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(url);
    return (response as Record<string, unknown>).skills as SkillDefinition[];
  },

  getSkillTree: async (params?: { module?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.module) searchParams.set('module', params.module);
    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.ADMIN.CATALOG.SKILL_TREE}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(url);
    return (response as Record<string, unknown>).tree as SkillTreeNode[];
  },

  listSkillPricing: async (params?: { pricingType?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.pricingType)
      searchParams.set('pricingType', params.pricingType);
    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.ADMIN.CATALOG.PRICING}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(url);
    return (response as Record<string, unknown>).pricing as SkillPricing[];
  },

  upsertSkillPricing: async (
    skillCode: string,
    data: {
      pricingType: string;
      flatPrice?: number;
      unitPrice?: number;
      unitMetric?: string;
      unitMetricLabel?: string;
      usageIncluded?: number;
      usagePrice?: number;
      usageMetric?: string;
      usageMetricLabel?: string;
      annualDiscount?: number;
    }
  ) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.CATALOG.UPSERT_PRICING(skillCode),
      data
    );
    return (response as Record<string, unknown>).pricing as SkillPricing;
  },

  // === Tenant Subscriptions ===
  getTenantSubscription: async (tenantId: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.GET(tenantId)
    );
    return (response as Record<string, unknown>)
      .subscriptions as TenantSubscription[];
  },

  addTenantSubscription: async (
    tenantId: string,
    data: {
      skillCode: string;
      quantity?: number;
      customPrice?: number;
      discountPercent?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.ADD(tenantId),
      data
    );
    return (response as Record<string, unknown>)
      .subscription as TenantSubscription;
  },

  removeTenantSubscription: async (tenantId: string, skillCode: string) => {
    await apiClient.delete<void>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.REMOVE(tenantId, skillCode)
    );
  },

  applyTenantDiscount: async (
    tenantId: string,
    data: {
      skillCode?: string;
      discountPercent?: number;
      customPrice?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.DISCOUNT(tenantId),
      data
    );
    return response;
  },

  getTenantConsumption: async (tenantId: string, period?: string) => {
    const searchParams = new URLSearchParams();
    if (period) searchParams.set('period', period);
    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.CONSUMPTION(tenantId)}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(url);
    return (response as Record<string, unknown>)
      .consumption as TenantConsumption[];
  },

  overrideTenantLimit: async (
    tenantId: string,
    data: {
      metric: string;
      newLimit: number;
      expiresAt?: string;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.OVERRIDE_LIMIT(tenantId),
      data
    );
    return response;
  },

  getTenantOverview: async (tenantId: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.OVERVIEW(tenantId)
    );
    return response as TenantOverview;
  },

  getTenantIntegrations: async (tenantId: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.SUBSCRIPTIONS.INTEGRATIONS(tenantId)
    );
    return (response as Record<string, unknown>)
      .integrations as TenantIntegrationStatus[];
  },

  // === Support ===
  listTickets: async (filters?: {
    status?: string;
    priority?: string;
    category?: string;
    tenantId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.priority) params.set('priority', filters.priority);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.tenantId) params.set('tenantId', filters.tenantId);
    const query = params.toString();
    const url = `${API_ENDPOINTS.ADMIN.SUPPORT.LIST}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(url);
    return (response as Record<string, unknown>).tickets as SupportTicket[];
  },

  getTicket: async (ticketId: string) => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.GET(ticketId)
    );
    return (response as Record<string, unknown>).ticket as SupportTicket;
  },

  assignTicket: async (ticketId: string, userId: string) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.ASSIGN(ticketId),
      { userId }
    );
    return (response as Record<string, unknown>).ticket as SupportTicket;
  },

  replyTicket: async (
    ticketId: string,
    data: { content: string; isInternal?: boolean }
  ) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.REPLY(ticketId),
      data
    );
    return response;
  },

  updateTicketStatus: async (ticketId: string, status: string) => {
    const response = await apiClient.patch<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.UPDATE_STATUS(ticketId),
      { status }
    );
    return (response as Record<string, unknown>).ticket as SupportTicket;
  },

  getSupportMetrics: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.METRICS
    );
    return response as SupportMetrics;
  },

  getSlaConfig: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.SLA_CONFIG
    );
    return (response as Record<string, unknown>).configs as SlaConfig[];
  },

  updateSlaConfig: async (
    priority: string,
    data: { firstResponseMinutes: number; resolutionMinutes: number }
  ) => {
    const response = await apiClient.put<unknown>(
      API_ENDPOINTS.ADMIN.SUPPORT.SLA_CONFIG_UPDATE(priority),
      data
    );
    return (response as Record<string, unknown>).config as SlaConfig;
  },

  // === Monitoring ===
  getSystemHealth: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.MONITORING.SYSTEM_HEALTH
    );
    return response as SystemHealth;
  },

  getIntegrationStatus: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.MONITORING.INTEGRATION_STATUS
    );
    return response as IntegrationStatusReport;
  },

  getAiUsageReport: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.MONITORING.AI_USAGE
    );
    return response as AiUsageReport;
  },

  getRevenueMetrics: async () => {
    const response = await apiClient.get<unknown>(
      API_ENDPOINTS.ADMIN.MONITORING.REVENUE
    );
    return response as RevenueMetrics;
  },

  // === Team ===
  listCentralUsers: async (params?: { role?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.role) searchParams.set('role', params.role);
    const query = searchParams.toString();
    const url = `${API_ENDPOINTS.ADMIN.TEAM.LIST}${query ? `?${query}` : ''}`;
    const response = await apiClient.get<unknown>(url);
    return (response as Record<string, unknown>).users as CentralUser[];
  },

  inviteCentralUser: async (data: { userId: string; role: string }) => {
    const response = await apiClient.post<unknown>(
      API_ENDPOINTS.ADMIN.TEAM.INVITE,
      data
    );
    return (response as Record<string, unknown>).user as CentralUser;
  },

  updateCentralUserRole: async (userId: string, data: { role: string }) => {
    const response = await apiClient.patch<unknown>(
      API_ENDPOINTS.ADMIN.TEAM.UPDATE_ROLE(userId),
      data
    );
    return (response as Record<string, unknown>).user as CentralUser;
  },

  removeCentralUser: async (userId: string) => {
    await apiClient.delete<void>(API_ENDPOINTS.ADMIN.TEAM.REMOVE(userId));
  },
};
