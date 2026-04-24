/**
 * /hr/compliance/esocial-rubricas — Mapeamento CLT → codRubr
 * (Phase 06 / Plan 06-06).
 *
 * Permission: hr.compliance.config.modify.
 */

'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { RubricaMapForm } from '@/components/hr/compliance/RubricaMapForm';
import { ShieldAlert } from 'lucide-react';

export default function EsocialRubricasPage() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasPermission(HR_PERMISSIONS.COMPLIANCE.CONFIG_MODIFY)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Sem permissão</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Você precisa da permissão{' '}
          <code className="font-mono text-xs">hr.compliance.config.modify</code>{' '}
          para configurar rubricas.
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
          {
            label: 'Rubricas eSocial',
            href: '/hr/compliance/esocial-rubricas',
          },
        ]}
        hasPermission={hasPermission}
      />
      <RubricaMapForm />
    </div>
  );
}
