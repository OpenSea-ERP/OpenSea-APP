/**
 * /hr/compliance/afd — Gerador AFD (Phase 06 / Plan 06-06)
 *
 * Permission: hr.compliance.afd.generate.
 */

'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { AfdGeneratorForm } from '@/components/hr/compliance/AfdGeneratorForm';
import { ShieldAlert } from 'lucide-react';

export default function AfdPage() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasPermission(HR_PERMISSIONS.COMPLIANCE.AFD_GENERATE)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Sem permissão</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Você precisa da permissão{' '}
          <code className="font-mono text-xs">hr.compliance.afd.generate</code>{' '}
          para gerar arquivos AFD.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageActionBar
        breadcrumbItems={[
          { label: 'RH', href: '/hr' },
          { label: 'Compliance', href: '/hr/compliance' },
          { label: 'Gerar AFD', href: '/hr/compliance/afd' },
        ]}
        hasPermission={hasPermission}
      />
      <AfdGeneratorForm kind="AFD" />
    </div>
  );
}
