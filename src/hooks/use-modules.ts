'use client';

import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

interface UseModulesReturn {
  modules: string[];
  hasModule: (module: string) => boolean;
  isLoading: boolean;
}

export function useModules(): UseModulesReturn {
  const { user } = useAuth();
  const { currentTenant } = useTenant();

  const { data, isLoading } = useQuery<{ modules: string[] }>({
    queryKey: ['my-modules', user?.id, currentTenant?.id],
    queryFn: () => apiClient.get('/v1/me/modules'),
    enabled: !!user?.id && !!currentTenant,
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const modules = data?.modules ?? [];

  const hasModule = (module: string): boolean => {
    if (isLoading) return true;
    return modules.includes(module);
  };

  return { modules, hasModule, isLoading };
}
