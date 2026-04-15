'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import type { AdmissionInvite } from '@/types/hr';
import {
  CheckCircle,
  Loader2,
  Plus,
  Send,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  admissionsConfig,
  useListAdmissions,
  useCreateAdmission,
  useCancelAdmission,
  useApproveAdmission,
  useRejectAdmission,
  useResendAdmission,
  getAdmissionStatusLabel,
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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListAdmissions(queryParams);

  const admissions = useMemo(
    () => admissionsData?.pages.flatMap(p => p.admissions ?? []) ?? [],
    [admissionsData]
  );

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // MODALS
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<AdmissionInvite | null>(
    null
  );
  const [rejectTarget, setRejectTarget] = useState<AdmissionInvite | null>(
    null
  );

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useCreateAdmission({
    showSuccessToast: false,
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
    (item: AdmissionInvite): ContextMenuAction[] => {
      const actions: ContextMenuAction[] = [];

      // Approve (only for COMPLETED status)
      if (canManage && item.status === 'COMPLETED') {
        actions.push({
          id: 'approve',
          label: 'Aprovar Admissão',
          icon: CheckCircle,
          separator: actions.length > 0 ? undefined : 'before',
          onClick: () => handleApprove(item),
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
          onClick: () => setRejectTarget(item),
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
          onClick: () => handleResend(item),
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
          onClick: () => setCancelTarget(item),
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
            { label: 'RH', href: '/hr' },
            { label: 'Admissões', href: '/hr/admissions' },
          ]}
          hasPermission={hasPermission}
          actions={
            canCreate ? (
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Nova Admissão</span>
              </Button>
            ) : undefined
          }
        />

        <Header
          title="Admissões"
          description="Gerencie os convites de admissão digital"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="admissions-page" className="contents" />
        <div data-testid="admissions-search">
          <SearchBar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Buscar admissões por nome ou e-mail..."
          />
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar admissões"
            message={
              error instanceof Error ? error.message : 'Erro desconhecido'
            }
          />
        ) : (
          <CoreProvider>
            <EntityGrid<AdmissionInvite>
              config={admissionsConfig}
              items={filteredAdmissions}
              toolbarStart={
                <div data-testid="admissions-filter-status">
                  <FilterDropdown
                    label="Status"
                    options={STATUS_OPTIONS.map(o => ({
                      id: o.value,
                      label: o.label,
                    }))}
                    selected={filterStatus ? [filterStatus] : []}
                    onSelectionChange={ids => setFilterStatus(ids[0] ?? '')}
                    activeColor="blue"
                  />
                </div>
              }
              renderGridItem={(item, isSelected) => (
                <EntityContextMenu
                  itemId={item.id}
                  onView={
                    canView
                      ? (ids: string[]) =>
                          handleView({ id: ids[0] } as AdmissionInvite)
                      : undefined
                  }
                  actions={getActions(item)}
                >
                  <EntityCard
                    id={item.id}
                    variant="grid"
                    title={item.fullName}
                    subtitle={[item.position?.name, item.email]
                      .filter(Boolean)
                      .join(' \u2022 ')}
                    icon={UserPlus}
                    iconBgColor="bg-linear-to-br from-blue-500 to-blue-600"
                    badges={[
                      {
                        label: getAdmissionStatusLabel(item.status),
                        variant: 'outline',
                      },
                    ]}
                    isSelected={isSelected}
                    showSelection={false}
                    clickable={canView}
                    createdAt={item.createdAt}
                  />
                </EntityContextMenu>
              )}
              renderListItem={(item, isSelected) => (
                <EntityContextMenu
                  itemId={item.id}
                  onView={
                    canView
                      ? (ids: string[]) =>
                          handleView({ id: ids[0] } as AdmissionInvite)
                      : undefined
                  }
                  actions={getActions(item)}
                >
                  <EntityCard
                    id={item.id}
                    variant="list"
                    title={item.fullName}
                    subtitle={[item.position?.name, item.email]
                      .filter(Boolean)
                      .join(' \u2022 ')}
                    icon={UserPlus}
                    iconBgColor="bg-linear-to-br from-blue-500 to-blue-600"
                    badges={[
                      {
                        label: getAdmissionStatusLabel(item.status),
                        variant: 'outline',
                      },
                    ]}
                    isSelected={isSelected}
                    showSelection={false}
                    clickable={canView}
                    createdAt={item.createdAt}
                  />
                </EntityContextMenu>
              )}
              onItemClick={item => canView && handleView(item)}
              emptyMessage={
                canCreate
                  ? 'Nenhuma admissão encontrada. Crie um novo convite de admissão digital.'
                  : 'Nenhum convite de admissão no momento.'
              }
              emptyIcon={<UserPlus className="h-8 w-8 text-muted-foreground" />}
            />
            <div ref={sentinelRef} className="h-1" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
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
