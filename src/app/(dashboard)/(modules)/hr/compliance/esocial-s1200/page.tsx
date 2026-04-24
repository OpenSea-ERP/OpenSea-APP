/**
 * /hr/compliance/esocial-s1200 — Submissão S-1200 (Phase 06 / Plan 06-06).
 *
 * Permission: hr.compliance.s1200.submit.
 * PIN obrigatório antes do submit (tratado no S1200SubmitForm).
 */

'use client';

import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { S1200SubmitForm } from '@/components/hr/compliance/S1200SubmitForm';
import { ShieldAlert } from 'lucide-react';

export default function S1200Page() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasPermission(HR_PERMISSIONS.COMPLIANCE.S1200_SUBMIT)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Sem permissão</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Você precisa da permissão{' '}
          <code className="font-mono text-xs">hr.compliance.s1200.submit</code>{' '}
          para submeter eventos S-1200.
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
            label: 'eSocial S-1200',
            href: '/hr/compliance/esocial-s1200',
          },
        ]}
        hasPermission={hasPermission}
      />
      <S1200SubmitForm />
    </div>
  );
}
