'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import type { AdmissionInvite } from '@/types/hr';
import {
  Briefcase,
  Calendar,
  CheckCircle,
  Eye,
  Mail,
  MailPlus,
  Plus,
  Send,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useMemo, useState } from 'react';
import {
  admissionsConfig,
  useListAdmissions,
  useCreateAdmission,
  useCancelAdmission,
  useApproveAdmission,
  useRejectAdmission,
  useResendAdmission,
  getAdmissionStatusLabel,
  getAdmissionStatusColor,
  getContractTypeLabel,
  getWorkRegimeLabel,
  formatDate,
  ADMISSION_STATUS_LABELS,
  type AdmissionFilters,
} from './src';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);

const STATUS_OPTIONS = Object.entries(ADMISSION_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

export default function AdmissionsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.EMPLOYEES.LIST);
  const canCreate = hasPermission(HR_PERMISSIONS.EMPLOYEES.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.DELETE);
  const canManage = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const queryParams = useMemo<AdmissionFilters>(() => {
    const params: AdmissionFilters = {};
    if (filterStatus) params.status = filterStatus;
    if (searchQuery) params.search = searchQuery;
    return params;
  }, [filterStatus, searchQuery]);

  const {
    data: admissionsData,
    isLoading,
    error,
  } = useListAdmissions(queryParams);

  const admissions = admissionsData?.admissions ?? [];

  // ============================================================================
  // MODALS
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AdmissionInvite | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdmissionInvite | null>(null);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useCreateAdmission({
    onSuccess: () => setIsCreateOpen(false),
  });

  const cancelMutation = useCancelAdmission({
    onSuccess: () => setCancelTarget(null),
  });

  const approveMutation = useApproveAdmission();
  const rejectMutation = useRejectAdmission({
    onSuccess: () => setRejectTarget(null),
  });
  const resendMutation = useResendAdmission();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleView = useCallback(
    (item: AdmissionInvite) => {
      router.push(`/hr/admissions/${item.id}`);
    },
    [router]
  );

  const handleApprove = useCallback(
    (item: AdmissionInvite) => {
      approveMutation.mutate(item.id);
    },
    [approveMutation]
  );

  const handleResend = useCallback(
    (item: AdmissionInvite) => {
      resendMutation.mutate(item.id);
    },
    [resendMutation]
  );

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    await cancelMutation.mutateAsync(cancelTarget.id);
  }, [cancelTarget, cancelMutation]);

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const getActions = useCallback(
    (item: AdmissionInvite): ContextMenuAction<AdmissionInvite>[] => {
      const actions: ContextMenuAction<AdmissionInvite>[] = [];

      // Approve (only for COMPLETED status)
      if (canManage && item.status === 'COMPLETED') {
        actions.push({
          id: 'approve',
          label: 'Aprovar Admissão',
          icon: CheckCircle,
          separator: actions.length > 0 ? undefined : 'before',
          onClick: (i: AdmissionInvite) => handleApprove(i),
        });
      }

      // Reject (for COMPLETED or IN_PROGRESS)
      if (
        canManage &&
        (item.status === 'COMPLETED' || item.status === 'IN_PROGRESS')
      ) {
        actions.push({
          id: 'reject',
          label: 'Rejeitar',
          icon: XCircle,
          variant: 'destructive' as const,
          onClick: (i: AdmissionInvite) => setRejectTarget(i),
        });
      }

      // Resend (for PENDING or IN_PROGRESS)
      if (
        canCreate &&
        (item.status === 'PENDING' || item.status === 'IN_PROGRESS')
      ) {
        actions.push({
          id: 'resend',
          label: 'Reenviar Convite',
          icon: Send,
          separator: 'before',
          onClick: (i: AdmissionInvite) => handleResend(i),
        });
      }

      // Cancel (destructive, always last)
      if (
        canDelete &&
        item.status !== 'CANCELLED' &&
        item.status !== 'EXPIRED'
      ) {
        actions.push({
          id: 'cancel',
          label: 'Cancelar Convite',
          icon: Trash2,
          variant: 'destructive' as const,
          separator: 'before',
          onClick: (i: AdmissionInvite) => setCancelTarget(i),
        });
      }

      return actions;
    },
    [canManage, canCreate, canDelete, handleApprove, handleResend]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const filteredAdmissions = useMemo(() => {
    if (!searchQuery) return admissions;
    const q = searchQuery.toLowerCase();
    return admissions.filter(
      a =>
        a.fullName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
    );
  }, [admissions, searchQuery]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Admissões', href: '/hr/admissions' },
          ]}
          hasPermission={hasPermission}
          actions={
            canCreate
              ? [
                  {
                    label: 'Nova Admissão',
                    icon: Plus,
                    onClick: () => setIsCreateOpen(true),
                  },
                ]
              : []
          }
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar admissões por nome ou e-mail..."
        />

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError error={error} />
        ) : (
          <CoreProvider config={admissionsConfig}>
            <EntityGrid<AdmissionInvite>
              items={filteredAdmissions}
              getItemId={item => item.id}
              toolbarStart={
                <FilterDropdown
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={filterStatus}
                  onChange={v => setFilterStatus(v === filterStatus ? '' : v)}
                  activeColor="blue"
                />
              }
              renderItem={item => (
                <EntityContextMenu
                  item={item}
                  onView={canView ? () => handleView(item) : undefined}
                  actions={getActions(item)}
                >
                  <EntityCard
                    item={item}
                    onClick={() => canView && handleView(item)}
                    title={item.fullName}
                    subtitle={item.email}
                    icon={
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <UserPlus className="h-5 w-5" />
                      </div>
                    }
                    badges={
                      <>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getAdmissionStatusColor(item.status)}`}
                        >
                          {getAdmissionStatusLabel(item.status)}
                        </span>
                      </>
                    }
                    meta={
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3" />
                          <span>
                            {item.position?.name ?? '-'} &middot;{' '}
                            {getContractTypeLabel(item.contractType)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Início: {formatDate(item.expectedStartDate)} &middot;
                            Expira: {formatDate(item.expiresAt)}
                          </span>
                        </div>
                      </div>
                    }
                  />
                </EntityContextMenu>
              )}
              emptyState={{
                icon: UserPlus,
                title: 'Nenhuma admissão encontrada',
                description: canCreate
                  ? 'Crie um novo convite de admissão digital.'
                  : 'Nenhum convite de admissão no momento.',
                action: canCreate
                  ? {
                      label: 'Nova Admissão',
                      onClick: () => setIsCreateOpen(true),
                    }
                  : undefined,
              }}
            />
          </CoreProvider>
        )}
      </PageBody>

      {/* Create modal */}
      {canCreate && (
        <CreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={data => createMutation.mutateAsync(data)}
          isSubmitting={createMutation.isPending}
        />
      )}

      {/* Cancel confirmation */}
      <VerifyActionPinModal
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={handleCancelConfirm}
        title="Cancelar Convite de Admissão"
        description={`Digite seu PIN para cancelar o convite de ${cancelTarget?.fullName ?? ''}.`}
      />
    </PageLayout>
  );
}
