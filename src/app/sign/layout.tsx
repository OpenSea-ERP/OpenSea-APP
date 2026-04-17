/**
 * Public signing portal layout.
 *
 * Minimal chrome — no auth guard, no sidebar, no dashboard navbar. Signers
 * arrive here via a per-envelope token and must not be treated as tenant users.
 */

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Assinatura de Documento — OpenSea',
  description: 'Portal público para assinatura eletrônica de documentos.',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function PublicSignLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
