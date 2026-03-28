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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { exportToCSV } from '@/lib/csv-export';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { usePermissions } from '@/hooks/use-permissions';
import { employeesService } from '@/services/hr/employees.service';
import type { Overtime } from '@/types/hr';
import {
  Check,
  CircleCheck,
  Clock,
  Coffee,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Plus,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  overtimeConfig,
  useListOvertime,
  useCreateOvertime,
  useApproveOvertime,
  formatDate,
  formatHours,
  getApprovalLabel,
  getApprovalColor,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
const ApproveModal = dynamic(
  () =>
    import('./src/modals/approve-modal').then(m => ({
      default: m.ApproveModal,
    })),
  { ssr: false }
);
const ViewModal = dynamic(
  () => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })),
  { ssr: false }
);
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';
import { BulkApproveDialog } from '../../_shared/components/bulk-approve-dialog';

export default function OvertimePage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.OVERTIME.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.OVERTIME.CREATE);
  const canApprove = hasPermission(HR_PERMISSIONS.OVERTIME.APPROVE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterApproved, setFilterApproved] = useState('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 20 };
    if (filterEmployeeId) params.employeeId = filterEmployeeId;
    if (filterApproved === 'true') params.approved = true;
    else if (filterApproved === 'false') params.approved = false;
    return params;
  }, [filterEmployeeId, filterApproved]);

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
  } = useListOvertime(queryParams);
  const createMutation = useCreateOvertime({
    onSuccess: () => setIsCreateOpen(false),
  });
  const approveMutation = useApproveOvertime({
    onSuccess: () => {
      setIsApproveOpen(false);
      setSelectedOvertime(null);
    },
  });

  const overtimeList = data?.pages.flatMap(p => p.overtime ?? []) ?? [];

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
    () => overtimeList.map(o => o.employeeId),
    [overtimeList]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // Employee options for filter dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'filter-options'],
    queryFn: () => employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.employees ?? []).map(e => ({
        id: e.id,
        label: e.fullName,
      })),
    [employeesData]
  );

  const approvalOptions = useMemo(
    () => [
      { value: 'pending', label: 'Pendente' },
      { value: 'true', label: 'Aprovada' },
      { value: 'false', label: 'Rejeitada' },
    ],
    []
  );

  // ============================================================================
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedOvertime, setSelectedOvertime] = useState<Overtime | null>(
    null
  );
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [bulkApproveIds, setBulkApproveIds] = useState<string[]>([]);
  const [bulkApproveProgress, setBulkApproveProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return overtimeList;
    const q = searchQuery.toLowerCase();
    return overtimeList.filter(o => {
      const reason = o.reason?.toLowerCase() ?? '';
      return reason.includes(q);
    });
  }, [overtimeList, searchQuery]);

  const initialIds = useMemo(
    () => filteredItems.map(i => i.id),
    [filteredItems]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = overtimeList.find(o => o.id === ids[0]);
        if (item) {
          setSelectedOvertime(item);
          setIsViewOpen(true);
        }
      }
    },
    [overtimeList]
  );

  const handleApproveClick = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = overtimeList.find(o => o.id === ids[0]);
        if (item) {
          setSelectedOvertime(item);
          setIsApproveOpen(true);
        }
      }
    },
    [overtimeList]
  );

  const handleBulkApproveOpen = useCallback(
    (ids: string[]) => {
      const pendingIds = ids.filter(id => {
        const item = overtimeList.find(o => o.id === id);
        return item && item.approved === null;
      });
      if (pendingIds.length === 0) {
        toast.info('Nenhuma hora extra pendente selecionada');
        return;
      }
      setBulkApproveIds(pendingIds);
      setShowBulkApprove(true);
    },
    [overtimeList]
  );

  const handleBulkApproveConfirm = useCallback(async () => {
    setIsBulkApproving(true);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < bulkApproveIds.length; i++) {
      setBulkApproveProgress({ current: i + 1, total: bulkApproveIds.length });
      try {
        await approveMutation.mutateAsync({
          id: bulkApproveIds[i],
          data: { addToTimeBank: false },
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsBulkApproving(false);
    setBulkApproveProgress(null);
    setShowBulkApprove(false);
    setBulkApproveIds([]);

    if (failCount === 0) {
      toast.success(`${successCount} hora(s) extra(s) aprovada(s) com sucesso!`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount} hora(s) extra(s) aprovada(s), ${failCount} falhou(aram).`
      );
    } else {
      toast.error('Nenhuma hora extra foi aprovada. Verifique os erros.');
    }
  }, [bulkApproveIds, approveMutation]);

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0
          ? overtimeList.filter(o => ids.includes(o.id))
          : overtimeList;
      exportToCSV(
        items,
        [
          { header: 'Funcionário', accessor: o => getName(o.employeeId) },
          {
            header: 'Data',
            accessor: o =>
              o.date ? new Date(o.date).toLocaleDateString('pt-BR') : '',
          },
          { header: 'Horas', accessor: o => o.hours },
          { header: 'Motivo', accessor: o => o.reason },
          {
            header: 'Aprovada',
            accessor: o =>
              o.approved === null ? 'Pendente' : o.approved ? 'Sim' : 'Não',
          },
        ],
        'horas-extras'
      );
    },
    [overtimeList, getName]
  );

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
          if (ids.length > 0) router.push(`/hr/overtime/${ids[0]}`);
        },
      });
      actions.push({
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: handleViewItem,
      });
    }
    if (canApprove) {
      actions.push({
        id: 'approve',
        label: 'Aprovar',
        icon: Check,
        separator: 'before',
        onClick: handleApproveClick,
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canApprove]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Overtime, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.reason}
        subtitle={formatHours(item.hours)}
        icon={Coffee}
        iconBgColor="bg-linear-to-br from-orange-500 to-orange-600"
        badges={[
          {
            label: getApprovalLabel(item),
            variant: getApprovalColor(item),
          },
        ]}
        metadata={
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span>{getName(item.employeeId)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>{formatDate(item.date)}</span>
            </div>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/overtime/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      >
        {item.approved === null && canApprove && (
          <div
            className="flex gap-2 pt-2 border-t"
            onClick={e => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleApproveClick([item.id])}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
          </div>
        )}
      </EntityCard>
    </EntityContextMenu>
  );

  const renderListCard = (item: Overtime, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={canView ? handleViewItem : undefined}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={item.reason}
        subtitle={formatHours(item.hours)}
        icon={Coffee}
        iconBgColor="bg-linear-to-br from-orange-500 to-orange-600"
        badges={[
          {
            label: getApprovalLabel(item),
            variant: getApprovalColor(item),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {getName(item.employeeId)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(item.date)}
            </span>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/overtime/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    buttons.push({
      id: 'export-overtime',
      title: 'Exportar',
      icon: Download,
      onClick: () => handleExport([]),
      variant: 'outline',
    });
    if (canCreate) {
      buttons.push({
        id: 'create-overtime',
        title: 'Registrar Hora Extra',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate, handleExport]);

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
        namespace: 'overtime',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Horas Extras', href: '/hr/overtime' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Horas Extras"
            description="Registros e aprovação de horas extras"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder={overtimeConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar horas extras"
              message="Ocorreu um erro ao tentar carregar as horas extras. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={overtimeConfig}
              items={filteredItems}
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
                    label="Status"
                    icon={CircleCheck}
                    options={approvalOptions}
                    value={filterApproved}
                    onChange={v => setFilterApproved(v)}
                    activeColor="emerald"
                  />
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {filteredItems.length}{' '}
                    {filteredItems.length === 1 ? 'hora extra' : 'horas extras'}
                  </p>
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                if (canView) {
                  setSelectedOvertime(item);
                  setIsViewOpen(true);
                }
              }}
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

          <CreateModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={async data => {
              await createMutation.mutateAsync(data);
            }}
          />

          <ApproveModal
            isOpen={isApproveOpen}
            onClose={() => {
              setIsApproveOpen(false);
              setSelectedOvertime(null);
            }}
            overtime={selectedOvertime}
            onApprove={(id, data) => approveMutation.mutate({ id, data })}
            isApproving={approveMutation.isPending}
          />

          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setSelectedOvertime(null);
            }}
            overtime={selectedOvertime}
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            actions={[
              ...(canApprove
                ? [
                    {
                      id: 'bulk-approve',
                      label: 'Aprovar',
                      icon: Check,
                      onClick: handleBulkApproveOpen,
                      variant: 'default' as const,
                    },
                  ]
                : []),
            ]}
            defaultActions={{
              export: true,
            }}
            handlers={{
              onExport: handleExport,
            }}
          />

          <BulkApproveDialog
            isOpen={showBulkApprove}
            onClose={() => {
              if (!isBulkApproving) {
                setShowBulkApprove(false);
                setBulkApproveIds([]);
              }
            }}
            count={bulkApproveIds.length}
            entityLabel="hora(s) extra(s)"
            onConfirm={handleBulkApproveConfirm}
            isPending={isBulkApproving}
            progress={bulkApproveProgress ?? undefined}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
