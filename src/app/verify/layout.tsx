/**
 * Public verification portal layout.
 *
 * Reuses the minimal chrome used by the signing portal. Publicly indexed pages
 * would leak verification codes — keep noindex/nofollow.
 */

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Verificação de Autenticidade — OpenSea',
  description:
    'Confira a autenticidade de um documento assinado eletronicamente.',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function PublicVerifyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
