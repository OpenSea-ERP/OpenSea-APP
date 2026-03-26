'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { Navbar } from '@/components/layout/navbar';
import { ToolsPanel } from '@/components/layout/tools-panel';
import { CommandBar } from '@/components/shared/command-bar';
import { menuItems } from '@/config/menu-items';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { useUltrawide } from '@/hooks/use-layout-preferences';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const PrintQueueProvider = dynamic(
  () => import('@/core/print-queue').then(m => m.PrintQueueProvider),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isUltrawide } = useUltrawide();
  const {
    currentTenant,
    isLoading: isTenantLoading,
    isInitialized: isTenantInitialized,
  } = useTenant();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const router = useRouter();

  // Redirecionar para select-tenant se autenticado mas sem tenant selecionado
  // Aguarda a inicialização do TenantProvider para evitar redirecionamentos prematuros
  useEffect(() => {
    if (!isAuthenticated || isTenantLoading || !isTenantInitialized) return;

    // Super admins podem acessar sem tenant selecionado
    // (ex: ao navegar entre /central e /dashboard)
    if (!currentTenant && !isSuperAdmin) {
      router.push('/select-tenant');
    }
  }, [
    currentTenant,
    isAuthenticated,
    isTenantLoading,
    isTenantInitialized,
    isSuperAdmin,
    router,
  ]);

  return (
    <ProtectedRoute>
      <PrintQueueProvider>
        <CommandBar />
        {/* Dark Mode Background */}
        <div className="min-h-screen bg-linear-to-br from-white via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          {/* Background Effects - Dark Mode (static, no blur) */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden">
            <div
              className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* Background Effects - Light Mode (static, no blur) */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none dark:hidden">
            <div
              className="absolute -top-48 -right-48 w-[600px] h-[600px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)',
              }}
            />
            <div
              className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(192,132,252,0.1) 0%, transparent 70%)',
              }}
            />
          </div>

          <div className="relative">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:rounded"
            >
              Pular para o conteudo principal
            </a>
            <Navbar onMenuOpen={() => setIsMenuOpen(true)} />

            <ToolsPanel
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              menuItems={menuItems}
            />

            {/* Main Content */}
            <main
              id="main-content"
              tabIndex={-1}
              className="pt-24 sm:pt-28 pb-8 sm:pb-12 outline-none"
            >
              <div
                className={`mx-auto transition-[max-width,padding] duration-[1000ms] ease-linear ${
                  isUltrawide
                    ? 'max-w-[3840px] px-6 md:px-10 xl:px-16'
                    : 'max-w-[1600px] px-3 sm:px-4 md:px-6'
                }`}
              >
                {children}
              </div>
            </main>
          </div>
        </div>
      </PrintQueueProvider>
    </ProtectedRoute>
  );
}
