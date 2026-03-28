/**
 * HR Employee Requests Page
 * Solicitacoes dos colaboradores
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { SearchBar } from '@/components/layout/search-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import type { EmployeeRequest, RequestType, RequestStatus } from '@/types/hr';
import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  Calendar,
  Check,
  CircleCheck,
  ClipboardList,
  FileText,
  Loader2,
  PalmtreeIcon,
  Plus,
  Send,
  UserCog,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';
import {
  requestsConfig,
  useListMyRequests,
  useListPendingRequests,
  useApproveRequest,
  useCancelRequest,
  getRequestTypeLabel,
  getRequestStatusLabel,
  getRequestStatusColor,
  getRequestStatusVariant,
  getRequestTypeColor,
  getRequestTypeGradient,
} from './src';

const CreateRequestModal = dynamic(
  () =>
    import('./src/modals/create-modal').then((m) => ({
      default: m.CreateRequestModal,
    })),
  { ssr: false }
);
const RejectModal = dynamic(
  () =>
    import('./src/modals/reject-modal').then((m) => ({
      default: m.RejectModal,
    })),
  { ssr: false }
);

// ============================================================================
// CONSTANTS
// ============================================================================

const REQUEST_TYPE_ICONS: Record<RequestType, LucideIcon> = {
  VACATION: PalmtreeIcon,
  ABSENCE: Calendar,
  ADVANCE: FileText,
  DATA_CHANGE: UserCog,
  SUPPORT: Send,
};

const TYPE_FILTER_OPTIONS = [
  { id: 'VACATION', label: 'Férias' },
  { id: 'ABSENCE', label: 'Ausência' },
  { id: 'ADVANCE', label: 'Adiantamento' },
  { id: 'DATA_CHANGE', label: 'Alteração de Dados' },
  { id: 'SUPPORT', label: 'Suporte' },
];

const STATUS_FILTER_OPTIONS = [
  { id: 'PENDING', label: 'Pendente' },
  { id: 'APPROVED', label: 'Aprovada' },
  { id: 'REJECTED', label: 'Rejeitada' },
  { id: 'CANCELLED', label: 'Cancelada' },
];

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function RequestsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <RequestsPageContent />
    </Suspense>
  );
}

function RequestsPageContent() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.EMPLOYEE_REQUESTS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.EMPLOYEE_REQUESTS.CREATE);
  const canApprove = hasPermission(HR_PERMISSIONS.EMPLOYEE_REQUESTS.APPROVE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<RequestType | ''>('');
  const [filterStatus, setFilterStatus] = useState<RequestStatus | ''>('');
  const [viewMode, setViewMode] = useState<'my' | 'pending'>('my');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 20 };
    if (filterType) params.type = filterType;
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [filterType, filterStatus]);

  // ============================================================================
  // DATA
  // ============================================================================

  const myRequestsQuery = useListMyRequests(
    viewMode === 'my' ? queryParams : undefined
  );
  const pendingRequestsQuery = useListPendingRequests(
    viewMode === 'pending' ? queryParams : undefined
  );

  const activeQuery =
    viewMode === 'my' ? myRequestsQuery : pendingRequestsQuery;

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = activeQuery;

  const approveRequest = useApproveRequest();
  const cancelRequest = useCancelRequest();

  const requests = useMemo(
    () => data?.pages.flatMap((p) => p.requests ?? []) ?? [],
    [data]
  );

  // Client-side search filter
  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter(
      (item) =>
        getRequestTypeLabel(item.type).toLowerCase().includes(q) ||
        getRequestStatusLabel(item.status).toLowerCase().includes(q) ||
        item.employee?.fullName?.toLowerCase().includes(q)
    );
  }, [requests, searchQuery]);

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [showCancelPin, setShowCancelPin] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(
    () => filteredRequests.map((i) => i.id),
    [filteredRequests]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleApprove = useCallback(
    (id: string) => {
      approveRequest.mutate(id);
    },
    [approveRequest]
  );

  const handleReject = useCallback((id: string) => {
    setRejectRequestId(id);
    setShowRejectModal(true);
  }, []);

  const handleCancel = useCallback((id: string) => {
    setCancelTargetId(id);
    setShowCancelPin(true);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    if (cancelTargetId) {
      cancelRequest.mutate(cancelTargetId);
    }
    setShowCancelPin(false);
    setCancelTargetId(null);
  }, [cancelTargetId, cancelRequest]);

  const handleBulkApprove = useCallback(
    async (ids: string[]) => {
      const pendingIds = ids.filter((id) => {
        const item = filteredRequests.find((r) => r.id === id);
        return item && item.status === 'PENDING';
      });
      if (pendingIds.length === 0) return;
      for (const id of pendingIds) {
        approveRequest.mutate(id);
      }
    },
    [filteredRequests, approveRequest]
  );

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const getContextActions = useCallback(
    (item: EmployeeRequest): ContextMenuAction[] => {
      const actions: ContextMenuAction[] = [];

      if (canApprove && item.status === 'PENDING') {
        actions.push({
          id: 'approve',
          label: 'Aprovar',
          icon: Check,
          separator: 'before',
          onClick: () => handleApprove(item.id),
        });
        actions.push({
          id: 'reject',
          label: 'Rejeitar',
          icon: XCircle,
          onClick: () => handleReject(item.id),
          variant: 'destructive',
        });
      }

      if (item.status === 'PENDING' && viewMode === 'my') {
        actions.push({
          id: 'cancel',
          label: 'Cancelar',
          icon: Ban,
          separator: actions.length > 0 ? 'before' : undefined,
          onClick: () => handleCancel(item.id),
          variant: 'destructive',
        });
      }

      return actions;
    },
    [canApprove, viewMode, handleApprove, handleReject, handleCancel]
  );

  // ============================================================================
  // RENDER CARDS
  // ============================================================================

  const renderGridCard = (item: EmployeeRequest, isSelected: boolean) => {
    const typeLabel = getRequestTypeLabel(item.type);
    const statusLabel = getRequestStatusLabel(item.status);
    const TypeIcon = REQUEST_TYPE_ICONS[item.type];
    const gradient = getRequestTypeGradient(item.type);
    const statusVariant = getRequestStatusVariant(item.status);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/requests/${ids[0]}`);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.employee?.fullName || typeLabel}
          subtitle={
            item.employee?.department
              ? `${typeLabel} - ${item.employee.department.name}`
              : typeLabel
          }
          icon={TypeIcon}
          iconBgColor={`bg-linear-to-br ${gradient}`}
          badges={[
            {
              label: typeLabel,
              variant: 'outline',
              color: getRequestTypeColor(item.type),
            },
            {
              label: statusLabel,
              variant: statusVariant,
              color: getRequestStatusColor(item.status),
            },
          ]}
          metadata={
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              {item.employee && (
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="h-3 w-3" />
                  <span>{item.employee.fullName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>
                  {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/requests/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        >
          {item.status === 'PENDING' && canApprove && (
            <div
              className="flex gap-2 pt-2 border-t"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                onClick={() => handleApprove(item.id)}
                disabled={approveRequest.isPending}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                onClick={() => handleReject(item.id)}
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Rejeitar
              </Button>
            </div>
          )}
          {item.status === 'PENDING' && viewMode === 'my' && !canApprove && (
            <div
              className="flex gap-2 pt-2 border-t"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs text-slate-500 hover:bg-slate-50"
                onClick={() => handleCancel(item.id)}
                disabled={cancelRequest.isPending}
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
            </div>
          )}
        </EntityCard>
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: EmployeeRequest, isSelected: boolean) => {
    const typeLabel = getRequestTypeLabel(item.type);
    const statusLabel = getRequestStatusLabel(item.status);
    const TypeIcon = REQUEST_TYPE_ICONS[item.type];
    const gradient = getRequestTypeGradient(item.type);
    const statusVariant = getRequestStatusVariant(item.status);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/requests/${ids[0]}`);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.employee?.fullName || typeLabel}
          subtitle={
            item.employee?.department
              ? `${typeLabel} - ${item.employee.department.name}`
              : typeLabel
          }
          icon={TypeIcon}
          iconBgColor={`bg-linear-to-br ${gradient}`}
          badges={[
            {
              label: typeLabel,
              variant: 'outline',
              color: getRequestTypeColor(item.type),
            },
            {
              label: statusLabel,
              variant: statusVariant,
              color: getRequestStatusColor(item.status),
            },
          ]}
          metadata={
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {item.employee && (
                <span className="flex items-center gap-1">
                  <ClipboardList className="h-3 w-3" />
                  {item.employee.fullName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/requests/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-request',
        title: 'Nova Solicitação',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate]);

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoadingPermissions) {
    return (
      <PageLayout>
        <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'requests',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Solicitações', href: '/hr/requests' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Solicitações"
            description="Gerencie solicitações dos colaboradores"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder="Buscar solicitações..."
            onSearch={(value) => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar solicitações"
              message="Ocorreu um erro ao tentar carregar as solicitações. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={requestsConfig}
              items={filteredRequests}
              toolbarStart={
                <>
                  {/* View mode toggle */}
                  <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        viewMode === 'my'
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      onClick={() => setViewMode('my')}
                    >
                      Minhas
                    </button>
                    {canApprove && (
                      <button
                        type="button"
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                          viewMode === 'pending'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setViewMode('pending')}
                      >
                        Pendentes
                      </button>
                    )}
                  </div>

                  <FilterDropdown
                    label="Tipo"
                    icon={ClipboardList}
                    options={TYPE_FILTER_OPTIONS}
                    value={filterType}
                    onChange={(v) => setFilterType(v as RequestType | '')}
                    activeColor="blue"
                  />
                  <FilterDropdown
                    label="Status"
                    icon={CircleCheck}
                    options={STATUS_FILTER_OPTIONS}
                    value={filterStatus}
                    onChange={(v) => setFilterStatus(v as RequestStatus | '')}
                    activeColor="emerald"
                  />
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemClick={(item) => router.push(`/hr/requests/${item.id}`)}
              onItemDoubleClick={(item) => router.push(`/hr/requests/${item.id}`)}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <CreateRequestModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />

          <RejectModal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setRejectRequestId(null);
            }}
            requestId={rejectRequestId}
          />

          <VerifyActionPinModal
            isOpen={showCancelPin}
            onClose={() => {
              setShowCancelPin(false);
              setCancelTargetId(null);
            }}
            onSuccess={handleCancelConfirm}
            title="Confirmar Cancelamento"
            description="Digite seu PIN de ação para cancelar esta solicitação."
          />

          <HRSelectionToolbar
            totalItems={filteredRequests.length}
            actions={[
              ...(canApprove
                ? [
                    {
                      id: 'bulk-approve',
                      label: 'Aprovar',
                      icon: Check,
                      onClick: handleBulkApprove,
                      variant: 'default' as const,
                    },
                  ]
                : []),
            ]}
            defaultActions={{
              export: false,
            }}
            handlers={{}}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
