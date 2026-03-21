'use client';

import './central.css';
import { SuperAdminGuard } from '@/components/auth/super-admin-guard';
import { CentralSidebar } from '@/components/central/central-sidebar';
import { CentralThemeProvider } from '@/contexts/central-theme-context';

export default function CentralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <CentralThemeProvider>
        <div
          data-central-theme
          className="flex h-screen"
          style={{ background: 'var(--central-bg)' }}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-blue-600 focus:rounded"
          >
            Pular para o conteudo principal
          </a>
          <CentralSidebar />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto"
          >
            {children}
          </main>
        </div>
      </CentralThemeProvider>
    </SuperAdminGuard>
  );
}
