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
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import type { WorkSchedule } from '@/types/hr';
import {
  Clock,
  Coffee,
  Loader2,
  Pencil,
  Plus,
  Timer,
  Trash2,
} from 'lucide-react';
import { useInfiniteQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createWorkSchedule,
  deleteWorkSchedule,
  duplicateWorkSchedule,
  formatWeeklyHours,
  updateWorkSchedule,
  WEEK_DAYS,
  workSchedulesApi,
  workSchedulesConfig,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);
const RenameModal = dynamic(
  () =>
    import('./src/modals/rename-modal').then(m => ({
      default: m.RenameModal,
    })),
  { ssr: false }
);
const DuplicateConfirmModal = dynamic(
  () =>
    import('./src/modals/duplicate-confirm-modal').then(m => ({
      default: m.DuplicateConfirmModal,
    })),
  { ssr: false }
);

export default function WorkSchedulesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <WorkSchedulesPageContent />
    </Suspense>
  );
}

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function WorkSchedulesPageContent() {
  const { hasPermission } = usePermissions();

  // ============================================================================
  // INFINITE SCROLL DATA FETCHING
  // ============================================================================

  const PAGE_SIZE = 20;

  const {
    data: infiniteData,
    isLoading: infiniteIsLoading,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['work-schedules', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return workSchedulesApi.list({ page: pageParam, perPage: PAGE_SIZE });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? lastPage.page ?? 1;
      const total = lastPage.meta?.totalPages ?? lastPage.totalPages ?? 1;
      return currentPage < total ? currentPage + 1 : undefined;
    },
  });

  const allWorkSchedulesInfinite = useMemo(
    () => infiniteData?.pages.flatMap(p => p.workSchedules ?? []) ?? [],
    [infiniteData]
  );

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // CRUD SETUP (mutations only — listing comes from useInfiniteQuery above)
  // ============================================================================

  const crud = useEntityCrud<WorkSchedule>({
    entityName: 'Escala de Trabalho',
    entityNamePlural: 'Escalas de Trabalho',
    queryKey: ['work-schedules'],
    baseUrl: '/api/v1/hr/work-schedules',
    listFn: async () => {
      return allWorkSchedulesInfinite;
    },
    getFn: (id: string) => workSchedulesApi.get(id),
    createFn: createWorkSchedule,
    updateFn: updateWorkSchedule,
    deleteFn: deleteWorkSchedule,
    duplicateFn: duplicateWorkSchedule,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<WorkSchedule>({
    entityName: 'Escala de Trabalho',
    entityNamePlural: 'Escalas de Trabalho',
    queryKey: ['work-schedules'],
    crud,
    viewRoute: id => `/hr/work-schedules/${id}`,
    editRoute: id => `/hr/work-schedules/${id}/edit`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (cópia)`,
      getData: item => ({
        name: `${item.name} (cópia)`,
        description: item.description,
        breakDuration: item.breakDuration,
        isActive: item.isActive,
        mondayStart: item.mondayStart,
        mondayEnd: item.mondayEnd,
        tuesdayStart: item.tuesdayStart,
        tuesdayEnd: item.tuesdayEnd,
        wednesdayStart: item.wednesdayStart,
        wednesdayEnd: item.wednesdayEnd,
        thursdayStart: item.thursdayStart,
        thursdayEnd: item.thursdayEnd,
        fridayStart: item.fridayStart,
        fridayEnd: item.fridayEnd,
        saturdayStart: item.saturdayStart,
        saturdayEnd: item.saturdayEnd,
        sundayStart: item.sundayStart,
        sundayEnd: item.sundayEnd,
      }),
    },
  });

  // ============================================================================
  // HELPERS
  // ============================================================================

  function countWorkDays(schedule: WorkSchedule): number {
    let count = 0;
    for (const day of WEEK_DAYS) {
      const startKey = `${day}Start` as keyof WorkSchedule;
      if (schedule[startKey]) count++;
    }
    return count;
  }

  // ============================================================================
  // RENAME STATE
  // ============================================================================

  const [renameItem, setRenameItem] = useState<WorkSchedule | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    page.handlers.handleItemsView(ids);
  };

  const handleContextEdit = (ids: string[]) => {
    page.handlers.handleItemsEdit(ids);
  };

  const handleContextRename = useCallback(
    (ids: string[]) => {
      const item = allWorkSchedulesInfinite.find(i => i.id === ids[0]) || null;
      setRenameItem(item);
      setRenameOpen(true);
    },
    [allWorkSchedulesInfinite]
  );

  const handleRenameSubmit = useCallback(
    async (id: string, newName: string) => {
      setIsRenaming(true);
      try {
        await crud.update(id, { name: newName });
        setRenameOpen(false);
        setRenameItem(null);
      } finally {
        setIsRenaming(false);
      }
    },
    [crud]
  );

  const handleContextDuplicate = (ids: string[]) => {
    page.handlers.handleItemsDuplicate(ids);
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions = useMemo(
    () => [
      {
        id: 'rename',
        label: 'Renomear',
        icon: Pencil,
        onClick: handleContextRename,
        hidden: (ids: string[]) => ids.length > 1,
      },
      {
        id: 'duplicate',
        label: 'Duplicar',
        icon: Clock,
        onClick: handleContextDuplicate,
        separator: 'before' as const,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        separator: 'before' as const,
        variant: 'destructive' as const,
      },
    ],
    [handleContextRename]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: WorkSchedule, isSelected: boolean) => {
    const workDays = countWorkDays(item);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.description || `${workDays} dias úteis`}
          icon={Clock}
          iconBgColor="bg-linear-to-br from-indigo-500 to-violet-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Timer,
              label: formatWeeklyHours(item.weeklyHours),
              color: 'violet',
            },
            right: {
              icon: Coffee,
              label: `${item.breakDuration}min intervalo`,
              color: 'violet',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: WorkSchedule, isSelected: boolean) => {
    const workDays = countWorkDays(item);

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={contextActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={item.description || `${workDays} dias úteis`}
          icon={Clock}
          iconBgColor="bg-linear-to-br from-indigo-500 to-violet-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Timer,
              label: formatWeeklyHours(item.weeklyHours),
              color: 'violet',
            },
            right: {
              icon: Coffee,
              label: `${item.breakDuration}min intervalo`,
              color: 'violet',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedIds = Array.from(page.selection?.state.selectedIds || []);
  const hasSelection = selectedIds.length > 0;
  const displayedItems = useMemo(() => {
    let items = allWorkSchedulesInfinite;

    // Apply search filter (mirrors useEntityPage filterFn)
    if (page.searchQuery.trim()) {
      const q = page.searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return items;
  }, [allWorkSchedulesInfinite, page.searchQuery]);

  const initialIds = useMemo(
    () => displayedItems.map(i => i.id),
    [displayedItems]
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-work-schedule',
        title: 'Nova Escala',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: workSchedulesConfig.permissions?.create,
      },
    ],
    [handleCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'work-schedules',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Escalas de Trabalho', href: '/hr/work-schedules' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Escalas de Trabalho"
            description="Gerencie as escalas e jornadas de trabalho da organização"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={workSchedulesConfig.display.labels.searchPlaceholder}
            value={page.searchQuery}
            onSearch={value => page.handlers.handleSearch(value)}
            onClear={() => page.handlers.handleSearch('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {infiniteIsLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : infiniteError ? (
            <GridError
              type="server"
              title="Erro ao carregar escalas"
              message="Ocorreu um erro ao tentar carregar as escalas de trabalho. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={workSchedulesConfig}
              items={displayedItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={infiniteIsLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedItems.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: true,
                edit: true,
                duplicate: true,
                delete: true,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDuplicate: page.handlers.handleItemsDuplicate,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            isLoading={crud.isCreating}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Rename Modal */}
          <RenameModal
            isOpen={renameOpen}
            onClose={() => {
              setRenameOpen(false);
              setRenameItem(null);
            }}
            workSchedule={renameItem}
            isSubmitting={isRenaming}
            onSubmit={handleRenameSubmit}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={() => page.handlers.handleDeleteConfirm()}
            title="Confirmar Exclusão"
            description={
              page.modals.itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir esta escala de trabalho. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} escalas de trabalho. Esta ação não pode ser desfeita.`
            }
          />

          {/* Duplicate Confirmation */}
          <DuplicateConfirmModal
            isOpen={page.modals.isOpen('duplicate')}
            onClose={() => page.modals.close('duplicate')}
            itemCount={page.modals.itemsToDuplicate.length}
            onConfirm={page.handlers.handleDuplicateConfirm}
            isLoading={crud.isDuplicating}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
