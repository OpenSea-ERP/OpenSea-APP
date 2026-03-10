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
import { Clock, Coffee, Plus, Timer } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useMemo } from 'react';
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

const CreateModal = dynamic(() => import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })), { ssr: false });
const EditModal = dynamic(() => import('./src/modals/edit-modal').then(m => ({ default: m.EditModal })), { ssr: false });
const ViewModal = dynamic(() => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })), { ssr: false });
const DeleteConfirmModal = dynamic(() => import('./src/modals/delete-confirm-modal').then(m => ({ default: m.DeleteConfirmModal })), { ssr: false });
const DuplicateConfirmModal = dynamic(() => import('./src/modals/duplicate-confirm-modal').then(m => ({ default: m.DuplicateConfirmModal })), { ssr: false });

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
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<WorkSchedule>({
    entityName: 'Escala de Trabalho',
    entityNamePlural: 'Escalas de Trabalho',
    queryKey: ['work-schedules'],
    baseUrl: '/api/v1/hr/work-schedules',
    listFn: async () => {
      const response = await workSchedulesApi.list({ perPage: 100 });
      return response.workSchedules;
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
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    page.handlers.handleItemsView(ids);
  };

  const handleContextEdit = (ids: string[]) => {
    page.handlers.handleItemsEdit(ids);
  };

  const handleContextDuplicate = (ids: string[]) => {
    page.handlers.handleItemsDuplicate(ids);
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

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
        onDuplicate={handleContextDuplicate}
        onDelete={handleContextDelete}
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
        onDuplicate={handleContextDuplicate}
        onDelete={handleContextDelete}
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
  const displayedItems = page.filteredItems || [];

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
          {page.isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : page.error ? (
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
              isLoading={page.isLoading}
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

          {/* View Modal */}
          <ViewModal
            isOpen={page.modals.isOpen('view')}
            onClose={() => page.modals.close('view')}
            workSchedule={page.modals.viewingItem}
          />

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            isLoading={crud.isCreating}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Edit Modal */}
          <EditModal
            isOpen={page.modals.isOpen('edit')}
            onClose={() => page.modals.close('edit')}
            workSchedule={page.modals.editingItem}
            isLoading={crud.isUpdating}
            onSubmit={async (id, data) => {
              await crud.update(id, data);
            }}
          />

          {/* Delete Confirmation */}
          <DeleteConfirmModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            itemCount={page.modals.itemsToDelete.length}
            onConfirm={page.handlers.handleDeleteConfirm}
            isLoading={crud.isDeleting}
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
