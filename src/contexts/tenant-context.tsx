'use client';

import { API_ENDPOINTS, authConfig } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import { decodeJWT, isJwt } from '@/lib/jwt-utils';
import { logger } from '@/lib/logger';
import { queryClient } from '@/providers/query-provider';
import type { SelectTenantResponse, UserTenant } from '@/types/tenant';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface TenantContextType {
  currentTenant: UserTenant | null;
  tenants: UserTenant[];
  isLoading: boolean;
  isInitialized: boolean;
  selectTenant: (tenantId: string) => Promise<void>;
  clearTenant: () => void;
  refreshTenants: () => Promise<UserTenant[]>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<UserTenant | null>(null);
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initAttempted = useRef(false);

  const clearAuthAndTenant = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(authConfig.tokenKey);
    localStorage.removeItem(authConfig.refreshTokenKey);
    localStorage.removeItem('selected_tenant_id');
    queryClient.clear();
    setCurrentTenant(null);
    setTenants([]);
    window.dispatchEvent(new CustomEvent('auth-token-change'));
  }, [queryClient]);

  const refreshTenants = useCallback(async (): Promise<UserTenant[]> => {
    try {
      setIsLoading(true);
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem(authConfig.tokenKey)
          : null;
      if (!token) return [];

      const data = await apiClient.get<{ tenants: UserTenant[] }>(
        API_ENDPOINTS.TENANTS.LIST_MY
      );
      setTenants(data.tenants);

      // Auto-select if saved tenant exists
      const savedTenantId = localStorage.getItem('selected_tenant_id');
      if (savedTenantId) {
        const saved = data.tenants.find(t => t.id === savedTenantId);
        if (saved) {
          setCurrentTenant(saved);
        }
      }

      return data.tenants;
    } catch {
      // Silently fail - user may not have tenants yet
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectTenant = useCallback(
    async (tenantId: string) => {
      try {
        setIsLoading(true);
        const data = await apiClient.post<SelectTenantResponse>(
          API_ENDPOINTS.TENANTS.SELECT,
          { tenantId }
        );

        // CRITICO: Limpar todo o cache do React Query antes de trocar de tenant
        // Isso evita vazamento de dados entre tenants
        queryClient.clear();

        // Update token with tenant-scoped JWT
        localStorage.setItem(authConfig.tokenKey, data.token);
        localStorage.setItem('selected_tenant_id', data.tenant.id);

        // Salvar refresh token se retornado
        if (
          'refreshToken' in data &&
          typeof (data as { refreshToken?: string }).refreshToken === 'string'
        ) {
          localStorage.setItem(
            authConfig.refreshTokenKey,
            (data as { refreshToken: string }).refreshToken
          );
        }

        window.dispatchEvent(new CustomEvent('auth-token-change'));

        // Update current tenant in state
        const selected = tenants.find(t => t.id === tenantId);
        if (selected) {
          setCurrentTenant(selected);
        } else {
          setCurrentTenant({
            id: data.tenant.id,
            name: data.tenant.name,
            slug: data.tenant.slug,
            logoUrl: null,
            status: 'ACTIVE',
            role: 'member',
            joinedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error('Erro ao selecionar tenant', error as Error, {
          tenantId,
          action: 'selectTenant',
        });
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tenants]
  );

  const clearTenant = useCallback(() => {
    setCurrentTenant(null);
    localStorage.removeItem('selected_tenant_id');
    // Limpar cache ao desselecionar tenant
    queryClient.clear();
  }, []);

  // Auto-hydrate tenant on app initialization
  // This runs once when the provider mounts to restore the saved tenant
  useEffect(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem(authConfig.tokenKey)
        : null;
    const savedTenantId =
      typeof window !== 'undefined'
        ? localStorage.getItem('selected_tenant_id')
        : null;

    // If we have a token and a saved tenant, auto-hydrate
    if (token && savedTenantId) {
      setIsLoading(true);
      apiClient
        .get<{ tenants: UserTenant[] }>(API_ENDPOINTS.TENANTS.LIST_MY)
        .then(data => {
          setTenants(data.tenants);
          const saved = data.tenants.find(t => t.id === savedTenantId);
          if (saved) {
            setCurrentTenant(saved);
          }
        })
        .catch(() => {
          // Silently fail - user may not have tenants yet or token expired
        })
        .finally(() => {
          setIsLoading(false);
          setIsInitialized(true);
        });
    } else {
      // No token or no saved tenant - mark as initialized immediately
      setIsInitialized(true);
    }
  }, []);

  // Listen for auth changes to clear or refresh tenants
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem(authConfig.tokenKey);
      if (!token) {
        // Token removed — clear tenant state
        setCurrentTenant(null);
        setTenants([]);
        setIsInitialized(false);
        initAttempted.current = false; // Allow re-init on next login
      } else {
        // Token appeared or changed — refresh tenants
        // This handles re-login and tenant selection
        refreshTenants().then(() => {
          setIsInitialized(true);
        });
      }
    };
    window.addEventListener('auth-token-change', handleAuthChange);
    return () =>
      window.removeEventListener('auth-token-change', handleAuthChange);
  }, [refreshTenants]);

  // Validate tenant context against JWT payload
  useEffect(() => {
    const validateTenantToken = () => {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem(authConfig.tokenKey);
      if (!token || !isJwt(token)) return;

      const payload = decodeJWT(token);
      if (!payload) return;
      if (payload.isSuperAdmin) return;

      const storedTenantId = localStorage.getItem('selected_tenant_id');
      if (storedTenantId && !payload.tenantId) {
        // O token não tem escopo de tenant (ex: token de login limpo) mas
        // selected_tenant_id ainda está definido no localStorage.
        // NÃO destruir os tokens de auth — o usuário ainda está autenticado.
        // Limpar apenas o estado do tenant para que o usuário seja direcionado
        // ao /select-tenant onde pode re-selecionar enquanto ainda autenticado.
        logger.warn(
          '[TenantContext] Token sem tenantId com selected_tenant_id definido — limpando estado do tenant sem revogar autenticação'
        );
        setCurrentTenant(null);
        setTenants([]);
        localStorage.removeItem('selected_tenant_id');
        queryClient.clear();
      }
    };

    validateTenantToken();
    window.addEventListener('auth-token-change', validateTenantToken);
    return () =>
      window.removeEventListener('auth-token-change', validateTenantToken);
  }, [queryClient]);

  // Listener para tenant atualizado via refresh
  useEffect(() => {
    const handleTenantRefreshed = (event: Event) => {
      const detail = (event as CustomEvent<UserTenant>).detail;
      if (!detail?.id) return;

      setCurrentTenant(prev => {
        if (prev?.id === detail.id) return prev;
        return {
          id: detail.id,
          name: detail.name,
          slug: detail.slug,
          logoUrl: detail.logoUrl ?? null,
          status: detail.status ?? 'ACTIVE',
          role: detail.role ?? 'member',
          joinedAt: detail.joinedAt ?? new Date(),
        };
      });

      setTenants(prev => {
        const exists = prev.some(t => t.id === detail.id);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: detail.id,
            name: detail.name,
            slug: detail.slug,
            logoUrl: detail.logoUrl ?? null,
            status: detail.status ?? 'ACTIVE',
            role: detail.role ?? 'member',
            joinedAt: detail.joinedAt ?? new Date(),
          },
        ];
      });
    };

    window.addEventListener('tenant-refreshed', handleTenantRefreshed);
    return () =>
      window.removeEventListener('tenant-refreshed', handleTenantRefreshed);
  }, []);

  const value = useMemo<TenantContextType>(
    () => ({
      currentTenant,
      tenants,
      isLoading,
      isInitialized,
      selectTenant,
      clearTenant,
      refreshTenants,
    }),
    [
      currentTenant,
      tenants,
      isLoading,
      isInitialized,
      selectTenant,
      clearTenant,
      refreshTenants,
    ]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
