/**
 * POS Terminals Management Page
 * Proxy que redireciona para a página de terminais em /devices/pos-terminals
 *
 * A lógica real ainda está em sales/(entities)/terminals/page.tsx
 * Este arquivo atualiza apenas breadcrumbs e wrapper para a nova rota
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosTerminalsProxyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/sales/terminals');
  }, [router]);

  return null;
}
