'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { BottomTabs } from '@/components/mobile/bottom-tabs';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    currentTenant,
    isLoading: isTenantLoading,
    isInitialized: isTenantInitialized,
  } = useTenant();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirecionar para select-tenant se autenticado mas sem tenant selecionado
  useEffect(() => {
    if (!isAuthenticated || isTenantLoading || !isTenantInitialized) return;

    if (!currentTenant) {
      router.push('/select-tenant');
    }
  }, [
    currentTenant,
    isAuthenticated,
    isTenantLoading,
    isTenantInitialized,
    router,
  ]);

  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-slate-950 text-slate-100">
        <main className="pb-16">{children}</main>
        <BottomTabs />
      </div>
    </ProtectedRoute>
  );
}
