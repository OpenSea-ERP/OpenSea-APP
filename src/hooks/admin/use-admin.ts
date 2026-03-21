'use client';

import { adminApi } from '@/services/admin/admin-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  tenants: () => [...adminKeys.all, 'tenants'] as const,
  tenant: (id: string) => [...adminKeys.all, 'tenant', id] as const,
  tenantUsers: (id: string) => [...adminKeys.all, 'tenant-users', id] as const,
  plans: () => [...adminKeys.all, 'plans'] as const,
  plan: (id: string) => [...adminKeys.all, 'plan', id] as const,
  tenantFlags: (id: string) => [...adminKeys.all, 'tenant-flags', id] as const,
  // Catalog
  skillDefinitions: (module?: string) =>
    [...adminKeys.all, 'skills', module] as const,
  skillTree: (module?: string) =>
    [...adminKeys.all, 'skill-tree', module] as const,
  skillPricing: (pricingType?: string) =>
    [...adminKeys.all, 'pricing', pricingType] as const,
  // Tenant Subscriptions
  tenantSubscription: (tenantId: string) =>
    [...adminKeys.all, 'tenant', tenantId, 'subscription'] as const,
  tenantConsumption: (tenantId: string, period?: string) =>
    [...adminKeys.all, 'tenant', tenantId, 'consumption', period] as const,
  tenantOverview: (tenantId: string) =>
    [...adminKeys.all, 'tenant', tenantId, 'overview'] as const,
  tenantIntegrations: (tenantId: string) =>
    [...adminKeys.all, 'tenant', tenantId, 'integrations'] as const,
  // Monitoring
  systemHealth: () => [...adminKeys.all, 'monitoring', 'health'] as const,
  integrationStatus: () =>
    [...adminKeys.all, 'monitoring', 'integrations'] as const,
  aiUsage: () => [...adminKeys.all, 'monitoring', 'ai-usage'] as const,
  revenueMetrics: () => [...adminKeys.all, 'monitoring', 'revenue'] as const,
  // Team
  centralUsers: (role?: string) => [...adminKeys.all, 'team', role] as const,
  // Support
  supportTickets: (filters?: {
    status?: string;
    priority?: string;
    category?: string;
  }) => [...adminKeys.all, 'support-tickets', filters] as const,
  supportTicket: (id: string) =>
    [...adminKeys.all, 'support-ticket', id] as const,
  supportMetrics: () => [...adminKeys.all, 'support-metrics'] as const,
  slaConfig: () => [...adminKeys.all, 'sla-config'] as const,
};

// =====================
// Dashboard
// =====================

export function useDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => adminApi.getDashboardStats(),
  });
}

// =====================
// Tenants
// =====================

export function useAdminTenants(
  page = 1,
  limit = 20,
  search?: string,
  status?: string
) {
  return useQuery({
    queryKey: [...adminKeys.tenants(), page, limit, search, status],
    queryFn: () => adminApi.listTenants(page, limit, search, status),
  });
}

export function useAdminTenantDetails(id: string) {
  return useQuery({
    queryKey: adminKeys.tenant(id),
    queryFn: () => adminApi.getTenantDetails(id),
    enabled: !!id,
  });
}

export function useAdminTenantUsers(id: string) {
  return useQuery({
    queryKey: adminKeys.tenantUsers(id),
    queryFn: () => adminApi.listTenantUsers(id),
    enabled: !!id,
  });
}

export function useChangeTenantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.changeTenantStatus(id, status),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenant(id) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenants() });
    },
  });
}

export function useChangeTenantPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) =>
      adminApi.changeTenantPlan(id, planId),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenant(id) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenants() });
    },
  });
}

export function useAdminTenantFlags(id: string) {
  return useQuery({
    queryKey: adminKeys.tenantFlags(id),
    queryFn: () => adminApi.listFeatureFlags(id),
    enabled: !!id,
  });
}

export function useManageFeatureFlags() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      flag,
      enabled,
    }: {
      id: string;
      flag: string;
      enabled: boolean;
    }) => adminApi.manageFeatureFlags(id, flag, enabled),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenant(id) });
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantFlags(id),
      });
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createTenant>[0]) =>
      adminApi.createTenant(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenants() });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof adminApi.updateTenant>[1];
    }) => adminApi.updateTenant(id, data),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenant(id) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenants() });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTenant(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenants() });
    },
  });
}

export function useCreateTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        email: string;
        password: string;
        username?: string;
        role?: string;
      };
    }) => adminApi.createTenantUser(id, data),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantUsers(id),
      });
    },
  });
}

export function useRemoveTenantUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) =>
      adminApi.removeTenantUser(tenantId, userId),
    onSuccess: async (_, { tenantId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantUsers(tenantId),
      });
    },
  });
}

export function useSetUserSecurityKey() {
  return useMutation({
    mutationFn: ({
      tenantId,
      userId,
      securityKey,
    }: {
      tenantId: string;
      userId: string;
      securityKey: string | null;
    }) => adminApi.setUserSecurityKey(tenantId, userId, securityKey),
  });
}

// =====================
// Plans
// =====================

export function useAdminPlans() {
  return useQuery({
    queryKey: adminKeys.plans(),
    queryFn: () => adminApi.listPlans(),
  });
}

export function useAdminPlan(id: string) {
  return useQuery({
    queryKey: adminKeys.plan(id),
    queryFn: () => adminApi.getPlan(id),
    enabled: !!id,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.createPlan>[0]) =>
      adminApi.createPlan(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof adminApi.updatePlan>[1];
    }) => adminApi.updatePlan(id, data),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.plan(id) });
      await queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deletePlan(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.plans() });
    },
  });
}

export function useSetPlanModules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, modules }: { id: string; modules: string[] }) =>
      adminApi.setPlanModules(id, modules),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.plan(id) });
    },
  });
}

// =====================
// Catalog (Skills)
// =====================

export function useSkillDefinitions(module?: string) {
  return useQuery({
    queryKey: adminKeys.skillDefinitions(module),
    queryFn: () => adminApi.listSkillDefinitions({ module }),
  });
}

export function useSkillTree(module?: string) {
  return useQuery({
    queryKey: adminKeys.skillTree(module),
    queryFn: () => adminApi.getSkillTree({ module }),
  });
}

export function useSkillPricing(pricingType?: string) {
  return useQuery({
    queryKey: adminKeys.skillPricing(pricingType),
    queryFn: () => adminApi.listSkillPricing({ pricingType }),
  });
}

export function useUpsertSkillPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      skillCode,
      data,
    }: {
      skillCode: string;
      data: Parameters<typeof adminApi.upsertSkillPricing>[1];
    }) => adminApi.upsertSkillPricing(skillCode, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'pricing'],
      });
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'skill-tree'],
      });
    },
  });
}

// =====================
// Tenant Subscriptions
// =====================

export function useTenantSubscription(tenantId: string) {
  return useQuery({
    queryKey: adminKeys.tenantSubscription(tenantId),
    queryFn: () => adminApi.getTenantSubscription(tenantId),
    enabled: !!tenantId,
  });
}

export function useTenantConsumption(tenantId: string, period?: string) {
  return useQuery({
    queryKey: adminKeys.tenantConsumption(tenantId, period),
    queryFn: () => adminApi.getTenantConsumption(tenantId, period),
    enabled: !!tenantId,
  });
}

export function useTenantOverview(tenantId: string) {
  return useQuery({
    queryKey: adminKeys.tenantOverview(tenantId),
    queryFn: () => adminApi.getTenantOverview(tenantId),
    enabled: !!tenantId,
  });
}

export function useTenantIntegrations(tenantId: string) {
  return useQuery({
    queryKey: adminKeys.tenantIntegrations(tenantId),
    queryFn: () => adminApi.getTenantIntegrations(tenantId),
    enabled: !!tenantId,
  });
}

export function useAddTenantSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: Parameters<typeof adminApi.addTenantSubscription>[1];
    }) => adminApi.addTenantSubscription(tenantId, data),
    onSuccess: async (_, { tenantId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantSubscription(tenantId),
      });
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantOverview(tenantId),
      });
    },
  });
}

export function useRemoveTenantSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      skillCode,
    }: {
      tenantId: string;
      skillCode: string;
    }) => adminApi.removeTenantSubscription(tenantId, skillCode),
    onSuccess: async (_, { tenantId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantSubscription(tenantId),
      });
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantOverview(tenantId),
      });
    },
  });
}

export function useApplyTenantDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: Parameters<typeof adminApi.applyTenantDiscount>[1];
    }) => adminApi.applyTenantDiscount(tenantId, data),
    onSuccess: async (_, { tenantId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantSubscription(tenantId),
      });
    },
  });
}

export function useOverrideTenantLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: Parameters<typeof adminApi.overrideTenantLimit>[1];
    }) => adminApi.overrideTenantLimit(tenantId, data),
    onSuccess: async (_, { tenantId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.tenantConsumption(tenantId),
      });
    },
  });
}

// =====================
// Monitoring
// =====================

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: () => adminApi.getSystemHealth(),
    retry: 1,
    refetchInterval: 30_000,
  });
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: adminKeys.integrationStatus(),
    queryFn: () => adminApi.getIntegrationStatus(),
    retry: 1,
  });
}

export function useAiUsageReport() {
  return useQuery({
    queryKey: adminKeys.aiUsage(),
    queryFn: () => adminApi.getAiUsageReport(),
    retry: 1,
  });
}

export function useRevenueMetrics() {
  return useQuery({
    queryKey: adminKeys.revenueMetrics(),
    queryFn: () => adminApi.getRevenueMetrics(),
    retry: 1,
  });
}

// =====================
// Central Team
// =====================

export function useCentralUsers(role?: string) {
  return useQuery({
    queryKey: adminKeys.centralUsers(role),
    queryFn: () => adminApi.listCentralUsers({ role }),
  });
}

export function useInviteCentralUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof adminApi.inviteCentralUser>[0]) =>
      adminApi.inviteCentralUser(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'team'],
      });
    },
  });
}

export function useUpdateCentralUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Parameters<typeof adminApi.updateCentralUserRole>[1];
    }) => adminApi.updateCentralUserRole(userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'team'],
      });
    },
  });
}

export function useRemoveCentralUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => adminApi.removeCentralUser(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'team'],
      });
    },
  });
}

// =====================
// Support
// =====================

export function useSupportTickets(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: adminKeys.supportTickets(filters),
    queryFn: () => adminApi.listTickets(filters),
  });
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: adminKeys.supportTicket(id),
    queryFn: () => adminApi.getTicket(id),
    enabled: !!id,
  });
}

export function useSupportMetrics() {
  return useQuery({
    queryKey: adminKeys.supportMetrics(),
    queryFn: () => adminApi.getSupportMetrics(),
  });
}

export function useSlaConfig() {
  return useQuery({
    queryKey: adminKeys.slaConfig(),
    queryFn: () => adminApi.getSlaConfig(),
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, userId }: { ticketId: string; userId: string }) =>
      adminApi.assignTicket(ticketId, userId),
    onSuccess: async (_, { ticketId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.supportTicket(ticketId),
      });
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'support-tickets'],
      });
    },
  });
}

export function useReplyTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      data,
    }: {
      ticketId: string;
      data: { content: string; isInternal?: boolean };
    }) => adminApi.replyTicket(ticketId, data),
    onSuccess: async (_, { ticketId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.supportTicket(ticketId),
      });
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: string }) =>
      adminApi.updateTicketStatus(ticketId, status),
    onSuccess: async (_, { ticketId }) => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.supportTicket(ticketId),
      });
      await queryClient.invalidateQueries({
        queryKey: [...adminKeys.all, 'support-tickets'],
      });
      await queryClient.invalidateQueries({
        queryKey: adminKeys.supportMetrics(),
      });
    },
  });
}

export function useUpdateSlaConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      priority,
      data,
    }: {
      priority: string;
      data: { firstResponseMinutes: number; resolutionMinutes: number };
    }) => adminApi.updateSlaConfig(priority, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminKeys.slaConfig(),
      });
    },
  });
}
