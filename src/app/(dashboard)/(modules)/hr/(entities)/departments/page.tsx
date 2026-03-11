/**
 * OpenSea OS - Departments Page
 * Pagina de gerenciamento de departamentos usando o novo sistema OpenSea OS
 */

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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
  type SortDirection,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import type { Department } from '@/types/hr';
import {
  Briefcase,
  Building2,
  ExternalLink,
  Plus,
  Upload,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';
import { useListCompanies } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src';
import {
  createDepartment,
  deleteDepartment,
  departmentsApi,
  departmentsConfig,
  duplicateDepartment,
  updateDepartment,
} from './src';

const CreateModal = dynamic(() => import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })), { ssr: false });
const EditModal = dynamic(() => import('./src/modals/edit-modal').then(m => ({ default: m.EditModal })), { ssr: false });
const ViewModal = dynamic(() => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })), { ssr: false });
const DeleteConfirmModal = dynamic(() => import('./src/modals/delete-confirm-modal').then(m => ({ default: m.DeleteConfirmModal })), { ssr: false });
const DuplicateConfirmModal = dynamic(() => import('./src/modals/duplicate-confirm-modal').then(m => ({ default: m.DuplicateConfirmModal })), { ssr: false });

export default function DepartmentsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <DepartmentsPageContent />
    </Suspense>
  );
}

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function DepartmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const companyIds = useMemo(() => {
    const raw = searchParams.get('company');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // ============================================================================
  // FETCH COMPANIES FOR FILTER DROPDOWN
  // ============================================================================

  const { data: companiesData } = useListCompanies({ perPage: 100 });

  // Build company lookup map for enriching departments
  const companyMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; tradeName: string | null; legalName: string }
    >();
    if (companiesData?.companies) {
      for (const c of companiesData.companies) {
        map.set(c.id, {
          id: c.id,
          tradeName: c.tradeName ?? null,
          legalName: c.legalName,
        });
      }
    }
    return map;
  }, [companiesData?.companies]);

  // ============================================================================
  // CRUD SETUP (always fetches ALL departments - filtering is client-side)
  // ============================================================================

  const crud = useEntityCrud<Department>({
    entityName: 'Departamento',
    entityNamePlural: 'Departamentos',
    queryKey: ['departments'],
    baseUrl: '/api/v1/hr/departments',
    listFn: async () => {
      const deptResponse = await departmentsApi.list({ perPage: 100 });
      return deptResponse.departments;
    },
    getFn: (id: string) => departmentsApi.get(id),
    createFn: createDepartment,
    updateFn: updateDepartment,
    deleteFn: deleteDepartment,
    duplicateFn: duplicateDepartment,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Department>({
    entityName: 'Departamento',
    entityNamePlural: 'Departamentos',
    queryKey: ['departments'],
    crud,
    viewRoute: id => `/hr/departments/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (cópia)`,
      getData: item => ({
        name: `${item.name} (cópia)`,
        code: `${item.code}_COPY`,
        description: item.description,
        parentId: item.parentId,
        managerId: item.managerId,
        isActive: item.isActive,
      }),
    },
  });

  // ============================================================================
  // CLIENT-SIDE URL FILTERS
  // ============================================================================

  const displayedDepartments = useMemo(() => {
    let items = page.filteredItems || [];
    if (companyIds.length > 0) {
      const set = new Set(companyIds);
      items = items.filter(d => d.companyId && set.has(d.companyId));
    }
    return items;
  }, [page.filteredItems, companyIds]);

  // Derive filter options from companies data (fetched via useListCompanies)
  const availableCompanies = useMemo(() => {
    if (!companiesData?.companies) return [];
    return companiesData.companies.map(c => ({
      id: c.id,
      name: c.tradeName || c.legalName,
    }));
  }, [companiesData?.companies]);

  // Build URL preserving filter params
  const buildFilterUrl = useCallback(
    (params: { company?: string[] }) => {
      const cmp = params.company !== undefined ? params.company : companyIds;
      const parts: string[] = [];
      if (cmp.length > 0) parts.push(`company=${cmp.join(',')}`);
      return parts.length > 0
        ? `/hr/departments?${parts.join('&')}`
        : '/hr/departments';
    },
    [companyIds]
  );

  const setCompanyFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ company: ids }));
    },
    [router, buildFilterUrl]
  );

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

  const renderGridCard = (item: Department, isSelected: boolean) => {
    const companyInfo = item.companyId ? companyMap.get(item.companyId) : null;
    const companyName = companyInfo?.tradeName || companyInfo?.legalName;
    const positionsCount = item._count?.positions ?? 0;
    const employeesCount = item._count?.employees ?? 0;

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
          subtitle={companyName || item.description || `Código: ${item.code}`}
          icon={Building2}
          iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Briefcase,
              label: `${positionsCount} cargo${positionsCount !== 1 ? 's' : ''}`,
              href: `/hr/positions?department=${item.id}`,
              color: 'emerald',
            },
            right: {
              icon: Users,
              label: `${employeesCount} func.`,
              href: `/hr/employees?department=${item.id}`,
              color: 'emerald',
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

  const renderListCard = (item: Department, isSelected: boolean) => {
    const companyInfo = item.companyId ? companyMap.get(item.companyId) : null;
    const companyName = companyInfo?.tradeName || companyInfo?.legalName;
    const positionsCount = item._count?.positions ?? 0;
    const employeesCount = item._count?.employees ?? 0;

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
          subtitle={companyName || item.description || `Código: ${item.code}`}
          icon={Building2}
          iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Briefcase,
              label: `${positionsCount} cargo${positionsCount !== 1 ? 's' : ''}`,
              href: `/hr/positions?department=${item.id}`,
              color: 'emerald',
            },
            right: {
              icon: Users,
              label: `${employeesCount} func.`,
              href: `/hr/employees?department=${item.id}`,
              color: 'emerald',
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

  const initialIds = useMemo(
    () => displayedDepartments.map(i => i.id),
    [displayedDepartments]
  );

  // Funcao de ordenacao customizada por codigo
  const customSortByCode = (
    a: Department,
    b: Department,
    direction: SortDirection
  ) => {
    const codeA = a.code?.toLowerCase() ?? '';
    const codeB = b.code?.toLowerCase() ?? '';
    const result = codeA.localeCompare(codeB, 'pt-BR');
    return direction === 'asc' ? result : -result;
  };

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'import-departments',
        title: 'Importar',
        icon: Upload,
        onClick: () => router.push('/import/hr/departments'),
        variant: 'outline',
        permission: departmentsConfig.permissions?.import,
      },
      {
        id: 'create-department',
        title: 'Novo Departamento',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: departmentsConfig.permissions?.create,
      },
    ],
    [handleCreate, router]
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
        namespace: 'departments',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Departamentos', href: '/hr/departments' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Departamentos"
            description="Gerencie os departamentos da organização"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={departmentsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar departamentos"
              message="Ocorreu um erro ao tentar carregar os departamentos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={departmentsConfig}
              items={displayedDepartments}
              toolbarStart={
                <FilterDropdown
                  label="Empresa"
                  icon={Building2}
                  options={availableCompanies.map(c => ({
                    id: c.id,
                    label: c.name,
                  }))}
                  selected={companyIds}
                  onSelectionChange={setCompanyFilter}
                  activeColor="emerald"
                  searchPlaceholder="Buscar empresa..."
                  emptyText="Nenhuma empresa encontrada."
                  footerAction={{
                    icon: ExternalLink,
                    label: 'Ver todas as empresas',
                    onClick: () => router.push('/admin/companies'),
                    color: 'emerald',
                  }}
                />
              }
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
              customSortFn={customSortByCode}
              customSortLabel="Código"
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedDepartments.length}
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
            department={page.modals.viewingItem}
          />

          {/* Create Modal */}
          <CreateModal
            isOpen={page.modals.isOpen('create')}
            onClose={() => page.modals.close('create')}
            isSubmitting={crud.isCreating}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Edit Modal */}
          <EditModal
            isOpen={page.modals.isOpen('edit')}
            onClose={() => page.modals.close('edit')}
            department={page.modals.editingItem}
            isSubmitting={crud.isUpdating}
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
