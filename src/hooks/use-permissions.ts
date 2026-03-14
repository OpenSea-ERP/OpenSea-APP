/**
 * OpenSea OS - usePermissions Hook
 * Hook para gerenciar e verificar permissões do usuário
 */

'use client';

import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import {
  createPermissionMap,
  isPermissionAllowed,
  isPermissionDenied,
  listMyPermissions,
} from '@/services/rbac/rbac.service';
import type { EffectivePermission } from '@/types/rbac';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

interface UsePermissionsReturn {
  /** Mapa de permissões para verificação rápida */
  permissions: Map<string, 'allow' | 'deny'>;
  /** Lista completa de permissões efetivas */
  effectivePermissions: EffectivePermission[];
  /** Verifica se o usuário tem uma permissão específica */
  hasPermission: (code: string) => boolean;
  /** Verifica se uma permissão é negada explicitamente */
  isDenied: (code: string) => boolean;
  /** Verifica múltiplas permissões (OR - pelo menos uma) */
  hasAnyPermission: (...codes: string[]) => boolean;
  /** Verifica múltiplas permissões (AND - todas) */
  hasAllPermissions: (...codes: string[]) => boolean;
  /** Estado de carregamento */
  isLoading: boolean;
  /** Erro ao carregar permissões */
  error: Error | null;
  /** Recarregar permissões */
  refetch: () => void;
}

/**
 * Hook para gerenciar permissões do usuário autenticado
 *
 * @example
 * ```typescript
 * const { hasPermission, isLoading } = usePermissions();
 *
 * if (isLoading) return <Skeleton />;
 *
 * if (hasPermission('stock.products.create')) {
 *   return <CreateProductButton />;
 * }
 * ```
 */
export function usePermissions(): UsePermissionsReturn {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  // Buscar permissões do usuário usando /v1/me/permissions
  // Essa rota requer tenant selecionado (verifyTenant middleware)
  const {
    data: effectivePermissions = [],
    isLoading,
    error,
    refetch,
  } = useQuery<EffectivePermission[], Error>({
    queryKey: ['my-permissions', user?.id, currentTenant?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      return await listMyPermissions();
    },
    enabled: !!user?.id && !!currentTenant,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (antes era cacheTime)
    retry: (failureCount, error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 401 || status === 403) return false;
      return failureCount < 3;
    },
    throwOnError: false,
    refetchOnMount: true, // Always refetch when component mounts (tenant may have changed)
  });

  // Criar mapa de permissões para verificação rápida
  const permissions = useMemo(() => {
    return createPermissionMap(effectivePermissions);
  }, [effectivePermissions]);

  // Verificar se usuário tem uma permissão
  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    return isPermissionAllowed(permissions, code);
  };

  // Verificar se permissão é negada
  const isDenied = (code: string): boolean => {
    if (!user) return false;
    return isPermissionDenied(permissions, code);
  };

  // Verificar se tem pelo menos uma das permissões (OR)
  const hasAnyPermission = (...codes: string[]): boolean => {
    if (!user) return false;
    return codes.some(code => isPermissionAllowed(permissions, code));
  };

  // Verificar se tem todas as permissões (AND)
  const hasAllPermissions = (...codes: string[]): boolean => {
    if (!user) return false;
    return codes.every(code => isPermissionAllowed(permissions, code));
  };

  return {
    permissions,
    effectivePermissions,
    hasPermission,
    isDenied,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    error: error || null,
    refetch,
  };
}

/**
 * Hook simplificado para verificar uma única permissão
 *
 * @example
 * ```typescript
 * const canCreate = usePermission('stock.products.create');
 *
 * if (canCreate) {
 *   return <CreateButton />;
 * }
 * ```
 */
export function usePermission(code: string): boolean {
  const { hasPermission, isLoading } = usePermissions();

  // Durante carregamento, negamos acesso por segurança
  if (isLoading) return false;

  return hasPermission(code);
}

/**
 * Hook para verificar múltiplas permissões
 *
 * @example
 * ```typescript
 * const { canCreate, canEdit, canDelete } = useMultiplePermissions({
 *   canCreate: 'stock.products.create',
 *   canEdit: 'stock.products.update',
 *   canDelete: 'stock.products.delete',
 * });
 * ```
 */
export function useMultiplePermissions<T extends Record<string, string>>(
  permissionMap: T
): Record<keyof T, boolean> {
  const { hasPermission, isLoading } = usePermissions();

  return useMemo(() => {
    const result: Record<string, boolean> = {};

    for (const [key, code] of Object.entries(permissionMap)) {
      // Durante carregamento, negamos acesso por segurança
      result[key] = isLoading ? false : hasPermission(code);
    }

    return result as Record<keyof T, boolean>;
  }, [permissionMap, hasPermission, isLoading]);
}
