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
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { usePermissions } from '@/hooks/use-permissions';
import { employeesService } from '@/services/hr/employees.service';
import type {
  EmployeeWarning,
  WarningType,
  WarningSeverity,
  WarningStatus,
} from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  CircleCheck,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Trash2,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  warningsConfig,
  useListWarnings,
  useDeleteWarning,
  getWarningTypeLabel,
  getWarningSeverityLabel,
  getWarningStatusLabel,
  getWarningTypeColor,
  getWarningSeverityColor,
  getWarningStatusColor,
} from './src';
import { HR_PERMISSIONS } from '../../_shared/constants/hr-permissions';

const CreateWarningModal = dynamic(
  () =>
    import('./src/modals/create-warning-modal').then(m => ({
      default: m.CreateWarningModal,
    })),
  { ssr: false }
);
const RevokeWarningModal = dynamic(
  () =>
    import('./src/modals/revoke-warning-modal').then(m => ({
      default: m.RevokeWarningModal,
    })),
  { ssr: false }
);

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const WARNING_TYPE_OPTIONS: { value: WarningType; label: string }[] = [
  { value: 'VERBAL', label: 'Verbal' },
  { value: 'WRITTEN', label: 'Escrita' },
  { value: 'SUSPENSION', label: 'Suspensão' },
  { value: 'TERMINATION_WARNING', label: 'Aviso de Desligamento' },
];

const WARNING_SEVERITY_OPTIONS: { value: WarningSeverity; label: string }[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];

const WARNING_STATUS_OPTIONS: { value: WarningStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'REVOKED', label: 'Revogada' },
  { value: 'EXPIRED', label: 'Expirada' },
];

export default function WarningsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.WARNINGS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.WARNINGS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.WARNINGS.DELETE);
  const canManage = hasPermission(HR_PERMISSIONS.WARNINGS.MANAGE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterType, setFilterType] = useState<WarningType | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<WarningSeverity | ''>(
    ''
  );
  const [filterStatus, setFilterStatus] = useState<WarningStatus | ''>('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 20 };
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterType) params.type = filterType;
    if (filterSeverity) params.severity = filterSeverity;
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [filterEmployeeId, filterType, filterSeverity, filterStatus]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListWarnings(queryParams);
  const deleteWarning = useDeleteWarning();

  const warnings = data?.pages.flatMap(p => p.warnings ?? []) ?? [];

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const employeeIds = useMemo(
    () => [
      ...warnings.map(w => w.employeeId),
      ...warnings.map(w => w.issuedBy),
    ],
    [warnings]
  );
  const { getName } = useEmployeeMap(employeeIds);

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'warnings-filter-options'],
    queryFn: () =>
      employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.employees ?? []).map(e => ({
        value: e.id,
        label: e.fullName,
      })),
    [employeesData]
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(() => warnings.map(i => i.id), [warnings]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRevoke = useCallback((id: string) => {
    setRevokeTargetId(id);
    setShowRevokeModal(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteTargetId(id);
    setShowDeletePin(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTargetId) {
      deleteWarning.mutate(deleteTargetId);
    }
    setShowDeletePin(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteWarning]);

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];
    if (canView) {
      actions.push({
        id: 'open',
        label: 'Abrir',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/warnings/${ids[0]}`);
        },
      });
    }
    if (canManage) {
      actions.push({
        id: 'revoke',
        label: 'Revogar',
        icon: RotateCcw,
        separator: 'before',
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleRevoke(ids[0]);
        },
      });
    }
    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        separator: 'before',
        variant: 'destructive',
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleDelete(ids[0]);
        },
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canManage, canDelete]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderGridCard = (item: EmployeeWarning, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={
        canView
          ? (ids: string[]) => {
              if (ids.length > 0) router.push(`/hr/warnings/${ids[0]}`);
            }
          : undefined
      }
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={getWarningTypeLabel(item.type)}
        subtitle={getWarningSeverityLabel(item.severity)}
        icon={AlertTriangle}
        iconBgColor="bg-linear-to-br from-amber-500 to-amber-600"
        badges={[
          {
            label: getWarningTypeLabel(item.type),
            variant: 'outline',
            color: getWarningTypeColor(item.type),
          },
          {
            label: getWarningSeverityLabel(item.severity),
            variant: 'outline',
            color: getWarningSeverityColor(item.severity),
          },
          {
            label: getWarningStatusLabel(item.status),
            variant: 'outline',
            color: getWarningStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{getName(item.employeeId)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3" />
              <span>Emitido por: {getName(item.issuedBy)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>Incidente: {formatDate(item.incidentDate)}</span>
            </div>
            {item.employeeAcknowledged && (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CircleCheck className="h-3 w-3" />
                <span>Reconhecida</span>
              </div>
            )}
            {item.suspensionDays && (
              <p className="text-xs">
                Suspensão:{' '}
                <span className="font-medium">
                  {item.suspensionDays}{' '}
                  {item.suspensionDays === 1 ? 'dia' : 'dias'}
                </span>
              </p>
            )}
          </div>
        }
        isSelected={isSelected}
        showSelection={false}
        clickable
        onClick={() => router.push(`/hr/warnings/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: EmployeeWarning, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={
        canView
          ? (ids: string[]) => {
              if (ids.length > 0) router.push(`/hr/warnings/${ids[0]}`);
            }
          : undefined
      }
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={getWarningTypeLabel(item.type)}
        subtitle={getWarningStatusLabel(item.status)}
        icon={AlertTriangle}
        iconBgColor="bg-linear-to-br from-amber-500 to-amber-600"
        badges={[
          {
            label: getWarningTypeLabel(item.type),
            variant: 'outline',
            color: getWarningTypeColor(item.type),
          },
          {
            label: getWarningSeverityLabel(item.severity),
            variant: 'outline',
            color: getWarningSeverityColor(item.severity),
          },
          {
            label: getWarningStatusLabel(item.status),
            variant: 'outline',
            color: getWarningStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getName(item.employeeId)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.incidentDate)}
            </span>
            {item.employeeAcknowledged && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CircleCheck className="h-3 w-3" />
                Reconhecida
              </span>
            )}
          </div>
        }
        isSelected={isSelected}
        showSelection={false}
        clickable
        onClick={() => router.push(`/hr/warnings/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-warning',
        title: 'Registrar Advertência',
        icon: Plus,
        onClick: () => setShowCreateModal(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

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
        namespace: 'warnings',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Advertências', href: '/hr/warnings' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Advertências"
            description="Gestão de advertências disciplinares"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder="Buscar advertências..."
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar advertências"
              message="Ocorreu um erro ao tentar carregar as advertências. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={warningsConfig}
              items={warnings}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Funcionário"
                    icon={User}
                    options={employeeOptions}
                    value={filterEmployeeId}
                    onChange={v => setFilterEmployeeId(v)}
                    activeColor="violet"
                    searchPlaceholder="Buscar funcionário..."
                    emptyText="Nenhum funcionário encontrado."
                  />
                  <FilterDropdown
                    label="Tipo"
                    icon={AlertTriangle}
                    options={WARNING_TYPE_OPTIONS}
                    value={filterType}
                    onChange={v => setFilterType(v as WarningType | '')}
                    activeColor="amber"
                  />
                  <FilterDropdown
                    label="Gravidade"
                    icon={ShieldAlert}
                    options={WARNING_SEVERITY_OPTIONS}
                    value={filterSeverity}
                    onChange={v => setFilterSeverity(v as WarningSeverity | '')}
                    activeColor="orange"
                  />
                  <FilterDropdown
                    label="Status"
                    icon={CircleCheck}
                    options={WARNING_STATUS_OPTIONS}
                    value={filterStatus}
                    onChange={v => setFilterStatus(v as WarningStatus | '')}
                    activeColor="cyan"
                  />
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={false}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/warnings/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="incidentDate"
              defaultSortDirection="desc"
            />
          )}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <CreateWarningModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />

          <RevokeWarningModal
            isOpen={showRevokeModal}
            onClose={() => {
              setShowRevokeModal(false);
              setRevokeTargetId(null);
            }}
            warningId={revokeTargetId}
          />

          <VerifyActionPinModal
            isOpen={showDeletePin}
            onClose={() => {
              setShowDeletePin(false);
              setDeleteTargetId(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description="Digite seu PIN de ação para excluir esta advertência."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
