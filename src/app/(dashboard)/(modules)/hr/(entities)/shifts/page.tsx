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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';
import type { Shift } from '@/types/hr';
import {
  Clock,
  Coffee,
  ExternalLink,
  Layers,
  Loader2,
  Moon,
  Pencil,
  Plus,
  Power,
  Timer,
  Trash2,
} from 'lucide-react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { shiftsApi, shiftsConfig, shiftKeys, SHIFT_TYPE_LABELS } from './src';

const CreateShiftModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({
      default: m.CreateShiftModal,
    })),
  { ssr: false }
);

const SHIFT_TYPE_OPTIONS: { id: string; label: string }[] = [
  { id: 'FIXED', label: 'Fixo' },
  { id: 'ROTATING', label: 'Rotativo' },
  { id: 'FLEXIBLE', label: 'Flexível' },
  { id: 'ON_CALL', label: 'Sobreaviso' },
];

const STATUS_OPTIONS: { id: string; label: string }[] = [
  { id: 'active', label: 'Ativo' },
  { id: 'inactive', label: 'Inativo' },
  { id: 'night', label: 'Noturno' },
];

export default function ShiftsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.SHIFTS.ACCESS);
  const canEdit = hasPermission(HR_PERMISSIONS.SHIFTS.MODIFY);
  const canCreate = hasPermission(HR_PERMISSIONS.SHIFTS.REGISTER);
  const canDelete = hasPermission(HR_PERMISSIONS.SHIFTS.REMOVE);

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

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
  } = useInfiniteQuery({
    queryKey: shiftKeys.list(),
    queryFn: async () => {
      const response = await shiftsApi.list();
      return {
        shifts: response.shifts,
        hasMore: false,
      };
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => (lastPage.hasMore ? 2 : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await shiftsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.all });
    },
  });

  const allShifts = useMemo(
    () => data?.pages.flatMap(p => p.shifts ?? []) ?? [],
    [data]
  );

  // Client-side filtering (search + type + status)
  const filteredShifts = useMemo(() => {
    let result = allShifts;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          (item.code && item.code.toLowerCase().includes(q)) ||
          SHIFT_TYPE_LABELS[item.type]?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      const typeSet = new Set(selectedTypes);
      result = result.filter(item => typeSet.has(item.type));
    }

    // Status filter
    if (selectedStatuses.length > 0) {
      const statusSet = new Set(selectedStatuses);
      result = result.filter(item => {
        if (statusSet.has('active') && item.isActive) return true;
        if (statusSet.has('inactive') && !item.isActive) return true;
        if (statusSet.has('night') && item.isNightShift) return true;
        return false;
      });
    }

    return result;
  }, [allShifts, searchQuery, selectedTypes, selectedStatuses]);

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
  // STATE
  // ============================================================================

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(
    () => filteredShifts.map(i => i.id),
    [filteredShifts]
  );

  // ============================================================================
  // HELPERS
  // ============================================================================

  function formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteRequest = useCallback((ids: string[]) => {
    if (ids.length > 0) {
      setDeleteTarget(ids[0]);
      setIsDeleteOpen(true);
    }
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
      setIsDeleteOpen(false);
    } catch {
      // Toast handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];

    if (canView) {
      actions.push({
        id: 'open',
        label: 'Abrir',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/shifts/${ids[0]}`);
        },
      });
    }

    if (canEdit) {
      actions.push({
        id: 'edit',
        label: 'Editar',
        icon: Pencil,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/shifts/${ids[0]}/edit`);
        },
      });
    }

    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleDeleteRequest,
        variant: 'destructive',
        separator: 'before',
      });
    }

    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canEdit, canDelete]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Shift, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/shifts/${ids[0]}`);
              }
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={`${item.startTime} — ${item.endTime}`}
          icon={item.isNightShift ? Moon : Clock}
          iconBgColor={
            item.color
              ? undefined
              : 'bg-linear-to-br from-sky-500 to-indigo-600'
          }
          badges={[
            {
              label: SHIFT_TYPE_LABELS[item.type] || item.type,
              variant: 'default' as const,
            },
            ...(item.isNightShift
              ? [
                  {
                    label: 'Noturno',
                    variant: 'secondary' as const,
                  },
                ]
              : []),
            ...(!item.isActive
              ? [{ label: 'Inativo', variant: 'secondary' as const }]
              : []),
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Timer,
              label: formatDuration(item.durationHours),
              color: 'cyan',
            },
            right: {
              icon: Coffee,
              label: `${item.breakMinutes}min`,
              color: 'cyan',
            },
          }}
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/shifts/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Shift, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/shifts/${ids[0]}`);
              }
            : undefined
        }
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={`${item.startTime} — ${item.endTime} | ${SHIFT_TYPE_LABELS[item.type]}`}
          icon={item.isNightShift ? Moon : Clock}
          iconBgColor={
            item.color
              ? undefined
              : 'bg-linear-to-br from-sky-500 to-indigo-600'
          }
          badges={[
            {
              label: SHIFT_TYPE_LABELS[item.type] || item.type,
              variant: 'default' as const,
            },
            ...(!item.isActive
              ? [{ label: 'Inativo', variant: 'secondary' as const }]
              : []),
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Timer,
              label: formatDuration(item.durationHours),
              color: 'cyan',
            },
            right: {
              icon: Coffee,
              label: `${item.breakMinutes}min`,
              color: 'cyan',
            },
          }}
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => router.push(`/hr/shifts/${item.id}`)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-shift',
        title: 'Novo Turno',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreate]);

  // ============================================================================
  // LOADING STATE
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
        namespace: 'shifts',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Turnos', href: '/hr/shifts' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Turnos de Trabalho"
            description="Gerencie os turnos e horários da equipe"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={searchQuery}
            placeholder={shiftsConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar turnos"
              message="Ocorreu um erro ao tentar carregar os turnos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={shiftsConfig}
                items={filteredShifts}
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={
                  !!searchQuery ||
                  selectedTypes.length > 0 ||
                  selectedStatuses.length > 0
                }
                onItemDoubleClick={item => {
                  if (canView) {
                    router.push(`/hr/shifts/${item.id}`);
                  }
                }}
                showSorting={true}
                defaultSortField="name"
                defaultSortDirection="asc"
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Tipo"
                      icon={Layers}
                      options={SHIFT_TYPE_OPTIONS}
                      selected={selectedTypes}
                      onSelectionChange={setSelectedTypes}
                      activeColor="cyan"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado."
                    />
                    <FilterDropdown
                      label="Status"
                      icon={Power}
                      options={STATUS_OPTIONS}
                      selected={selectedStatuses}
                      onSelectionChange={setSelectedStatuses}
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                  </>
                }
              />
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Create Modal */}
          <CreateShiftModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={async data => {
              await shiftsApi.create(
                data as Parameters<typeof shiftsApi.create>[0]
              );
              queryClient.invalidateQueries({ queryKey: shiftKeys.all });
              setIsCreateOpen(false);
            }}
            isLoading={false}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => {
              setIsDeleteOpen(false);
              setDeleteTarget(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Excluir Turno"
            description="Digite seu PIN de ação para excluir este turno. Esta ação não pode ser desfeita."
          />

          <HRSelectionToolbar
            totalItems={filteredShifts.length}
            defaultActions={{
              delete: canDelete,
            }}
            handlers={{
              onDelete: async (ids: string[]) => {
                for (const id of ids) {
                  await deleteMutation.mutateAsync(id);
                }
              },
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
