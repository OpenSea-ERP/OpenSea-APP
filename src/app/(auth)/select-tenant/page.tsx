'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { logger } from '@/lib/logger';
import { Building2, Crown, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function SelectTenantPage() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    isSuperAdmin,
  } = useAuth();
  const { tenants, isLoading, selectTenant, refreshTenants } = useTenant();
  const autoSelectAttempted = useRef(false);

  // Wait for auth to be fully loaded before any logic
  const authReady = isAuthenticated && !isAuthLoading;

  // Super admins go directly to Central — no tenant selection needed
  useEffect(() => {
    if (authReady && isSuperAdmin) {
      router.push('/central');
    }
  }, [authReady, isSuperAdmin, router]);

  useEffect(() => {
    if (authReady && !isSuperAdmin) {
      refreshTenants();
    }
  }, [authReady, isSuperAdmin, refreshTenants]);

  // Auto-select if only one tenant (only attempt once to prevent infinite loop)
  useEffect(() => {
    if (
      authReady &&
      !isLoading &&
      !isSuperAdmin &&
      tenants.length === 1 &&
      !autoSelectAttempted.current
    ) {
      autoSelectAttempted.current = true;
      handleSelect(tenants[0].id);
    }
  }, [authReady, isLoading, isSuperAdmin, tenants]);

  const handleSelect = async (tenantId: string) => {
    try {
      await selectTenant(tenantId);
      router.push('/');
    } catch (error) {
      logger.error(
        'Erro ao selecionar tenant',
        error instanceof Error ? error : undefined
      );
      // Reset para permitir nova tentativa manual
      autoSelectAttempted.current = false;
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Selecionar Empresa
          </h1>
          <p className="text-muted-foreground">
            Escolha a empresa que deseja acessar
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhuma empresa disponivel. Entre em contato com o administrador.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tenants.map(tenant => (
              <Card
                key={tenant.id}
                className="p-4 cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.99]"
                onClick={() => handleSelect(tenant.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{tenant.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {tenant.slug}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted capitalize">
                    {tenant.role}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {isSuperAdmin && (
          <div className="text-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.push('/central')}
              className="gap-2"
            >
              <Crown className="h-4 w-4" />
              Acessar Central de Gerenciamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
