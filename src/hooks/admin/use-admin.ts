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
};

// Dashboard
export function useDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: () => adminApi.getDashboardStats(),
  });
}

// Tenants
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
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenantFlags(id) });
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
      await queryClient.invalidateQueries({ queryKey: adminKeys.tenantUsers(id) });
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

// Plans
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
