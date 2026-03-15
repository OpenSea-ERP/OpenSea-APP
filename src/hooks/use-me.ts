import { meService, type EmployeeResponse } from '@/services';
import type {
  AuditLogsQuery,
  AuditLogsResponse,
  GroupsResponse,
  MessageResponse,
  PermissionsResponse,
  UpdateEmailRequest,
  UpdatePasswordRequest,
  UpdateProfileRequest,
  UpdateUsernameRequest,
  UserResponse,
} from '@/types/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const meKeys = {
  all: ['me'] as const,
  detail: () => [...meKeys.all, 'detail'] as const,
  profile: () => [...meKeys.all, 'profile'] as const,
  employee: () => [...meKeys.all, 'employee'] as const,
  auditLogs: (query?: AuditLogsQuery) =>
    [...meKeys.all, 'audit-logs', query] as const,
  permissions: () => [...meKeys.all, 'permissions'] as const,
  groups: () => [...meKeys.all, 'groups'] as const,
};

// Queries

/**
 * Hook para obter dados do usuário autenticado
 * GET /v1/me
 */
export function useMe(enabled = true) {
  return useQuery<UserResponse, Error>({
    queryKey: meKeys.detail(),
    queryFn: () => meService.getMe(),
    enabled,
    retry: (failureCount, error) => {
      // Don't retry auth errors (401/403)
      const status = (error as Error & { status?: number }).status;
      if (status === 401 || status === 403) return false;
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - reduzido para detectar problemas mais rápido
    refetchOnWindowFocus: true, // Revalida quando o usuário volta para a aba
    refetchInterval: 5 * 60 * 1000, // Revalida a cada 5 minutos em background
  });
}

/**
 * Hook para obter dados do funcionário vinculado ao usuário
 * GET /v1/me/employee
 */
export function useMyEmployee(enabled = true) {
  return useQuery<EmployeeResponse, Error>({
    queryKey: meKeys.employee(),
    queryFn: () => meService.getMyEmployee(),
    enabled,
    retry: false, // Não tentar novamente se não houver funcionário vinculado
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obter logs de auditoria do usuário
 * GET /v1/me/audit-logs
 */
export function useMyAuditLogs(query?: AuditLogsQuery, enabled = true) {
  return useQuery<AuditLogsResponse, Error>({
    queryKey: meKeys.auditLogs(query),
    queryFn: () => meService.getMyAuditLogs(query),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obter permissões do usuário
 * GET /v1/me/permissions
 */
export function useMyPermissions(enabled = true) {
  return useQuery<PermissionsResponse, Error>({
    queryKey: meKeys.permissions(),
    queryFn: () => meService.getMyPermissions(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obter grupos de permissão do usuário
 * GET /v1/me/groups
 */
export function useMyGroups(enabled = true) {
  return useQuery<GroupsResponse, Error>({
    queryKey: meKeys.groups(),
    queryFn: () => meService.getMyGroups(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Mutations

/**
 * Hook para atualizar perfil do usuário
 * PATCH /v1/me/profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, UpdateProfileRequest>({
    mutationFn: data => meService.updateProfile(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

/**
 * Hook para atualizar email do usuário
 * PATCH /v1/me/email
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, UpdateEmailRequest>({
    mutationFn: data => meService.updateEmail(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

/**
 * Hook para atualizar username do usuário
 * PATCH /v1/me/username
 */
export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, UpdateUsernameRequest>({
    mutationFn: data => meService.updateUsername(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

/**
 * Hook para atualizar senha do usuário
 * PATCH /v1/me/password
 */
export function useUpdatePassword() {
  return useMutation<MessageResponse, Error, UpdatePasswordRequest>({
    mutationFn: data => meService.updatePassword(data),
  });
}

/**
 * Hook para deletar conta do usuário
 * DELETE /v1/me
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => meService.deleteAccount(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
