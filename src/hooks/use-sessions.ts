import { sessionsService } from '@/services';
import type {
  RefreshTokenRequest,
  RefreshTokenResponse,
  SessionDateQuery,
  SessionsResponse,
} from '@/types/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const sessionsKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionsKeys.all, 'list'] as const,
  list: (filters?: string) => [...sessionsKeys.lists(), filters] as const,
  user: (userId: string) => [...sessionsKeys.all, 'user', userId] as const,
  userByDate: (userId: string, query?: SessionDateQuery) =>
    [...sessionsKeys.user(userId), 'by-date', query] as const,
  my: () => [...sessionsKeys.all, 'my'] as const,
  active: () => [...sessionsKeys.all, 'active'] as const,
};

// Queries

/**
 * Hook para listar sessões de um usuário
 * GET /v1/sessions/user/:userId
 * @requires MANAGER role
 */
export function useUserSessions(userId: string, enabled = true) {
  return useQuery<SessionsResponse, Error>({
    queryKey: sessionsKeys.user(userId),
    queryFn: () => sessionsService.listUserSessions(userId),
    enabled: enabled && !!userId,
  });
}

/**
 * Hook para listar sessões de um usuário por data
 * GET /v1/sessions/user/:userId/by-date
 * @requires MANAGER role
 */
export function useUserSessionsByDate(
  userId: string,
  query?: SessionDateQuery,
  enabled = true
) {
  return useQuery<SessionsResponse, Error>({
    queryKey: sessionsKeys.userByDate(userId, query),
    queryFn: () => sessionsService.listUserSessionsByDate(userId, query),
    enabled: enabled && !!userId,
  });
}

/**
 * Hook para listar minhas sessões
 * GET /v1/sessions
 */
export function useMySessions(enabled = true) {
  return useQuery<SessionsResponse, Error>({
    queryKey: sessionsKeys.my(),
    queryFn: () => sessionsService.listMySessions(),
    enabled,
  });
}

/**
 * Hook para listar todas as sessões ativas
 * GET /v1/sessions/active
 * @requires MANAGER role
 */
export function useActiveSessions(enabled = true) {
  return useQuery<SessionsResponse, Error>({
    queryKey: sessionsKeys.active(),
    queryFn: () => sessionsService.listActiveSessions(),
    enabled,
  });
}

// Mutations

/**
 * Hook para renovar token usando refresh token
 * POST /v1/sessions/refresh
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation<
    RefreshTokenResponse,
    Error,
    RefreshTokenRequest | undefined
  >({
    mutationFn: data => sessionsService.refreshToken(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'] });
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.all });
    },
  });
}

/**
 * Hook para fazer logout
 * PATCH /v1/sessions/logout
 * Backend retorna 204 No Content
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => sessionsService.logout(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Hook para revogar uma sessão
 * PATCH /v1/sessions/:sessionId/revoke
 * Backend retorna 204 No Content
 * @requires MANAGER role
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: sessionId => sessionsService.revokeSession(sessionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.all });
    },
  });
}

/**
 * Hook para expirar uma sessão
 * PATCH /v1/sessions/:sessionId/expire
 * Backend retorna 204 No Content
 * @requires MANAGER role
 */
export function useExpireSession() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: sessionId => sessionsService.expireSession(sessionId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionsKeys.all });
    },
  });
}
