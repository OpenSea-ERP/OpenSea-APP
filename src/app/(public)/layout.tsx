/**
 * Public Layout
 * Layout limpo para páginas públicas (sem autenticação, sem navbar/sidebar)
 * Usado para: admissão digital, vagas públicas, ponto kiosk, assinatura de documentos
 */

import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
