/**
 * OpenSea OS - Positions Page
 * Pagina de gerenciamento de cargos usando o novo sistema OpenSea OS
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
import type { Position } from '@/types/hr';
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
import { useListCompanies } from '../companies/src';
import { useListDepartments } from '../departments/src';
import {
  createPosition,
  deletePosition,
  duplicatePosition,
  positionsApi,
  positionsConfig,
  updatePosition,
} from './src';

const CreateModal = dynamic(() => import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })), { ssr: false });
const EditModal = dynamic(() => import('./src/modals/edit-modal').then(m => ({ default: m.EditModal })), { ssr: false });
const ViewModal = dynamic(() => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })), { ssr: false });
const DeleteConfirmModal = dynamic(() => import('./src/modals/delete-confirm-modal').then(m => ({ default: m.DeleteConfirmModal })), { ssr: false });
const DuplicateConfirmModal = dynamic(() => import('./src/modals/duplicate-confirm-modal').then(m => ({ default: m.DuplicateConfirmModal })), { ssr: false });

export default function PositionsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <PositionsPageContent />
    </Suspense>
  );
}

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function PositionsPageContent() {
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

  const departmentIds = useMemo(() => {
    const raw = searchParams.get('department');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // ============================================================================
  // FETCH REFERENCE DATA FOR FILTERS AND ENRICHMENT
  // ============================================================================

  const { data: companiesData } = useListCompanies({ perPage: 100 });
  const { data: departmentsData } = useListDepartments({ perPage: 100 });

  // Build lookup maps for enriching positions
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

  const departmentMap = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; companyId: string | null }
    >();
    if (departmentsData?.departments) {
      for (const d of departmentsData.departments) {
        map.set(d.id, {
          id: d.id,
          name: d.name,
          companyId: d.companyId ?? null,
        });
      }
    }
    return map;
  }, [departmentsData?.departments]);

  // ============================================================================
  // CRUD SETUP (always fetches ALL positions - filtering is client-side)
  // ============================================================================

  const crud = useEntityCrud<Position>({
    entityName: 'Cargo',
    entityNamePlural: 'Cargos',
    queryKey: ['positions'],
    baseUrl: '/api/v1/hr/positions',
    listFn: async () => {
      const posResponse = await positionsApi.list({ perPage: 100 });
      return posResponse.positions;
    },
    getFn: (id: string) => positionsApi.get(id),
    createFn: createPosition,
    updateFn: updatePosition,
    deleteFn: deletePosition,
    duplicateFn: duplicatePosition,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Position>({
    entityName: 'Cargo',
    entityNamePlural: 'Cargos',
    queryKey: ['positions'],
    crud,
    viewRoute: id => `/hr/positions/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (copia)`,
      getData: item => ({
        name: `${item.name} (copia)`,
        code: `${item.code}_COPY`,
        description: item.description,
        departmentId: item.departmentId,
        level: item.level,
        minSalary: item.minSalary,
        maxSalary: item.maxSalary,
        isActive: item.isActive,
      }),
    },
  });

  // ============================================================================
  // CLIENT-SIDE URL FILTERS
  // ============================================================================

  const displayedPositions = useMemo(() => {
    let items = page.filteredItems || [];
    if (companyIds.length > 0) {
      const set = new Set(companyIds);
      items = items.filter(p => {
        const dept = p.departmentId ? departmentMap.get(p.departmentId) : null;
        return dept?.companyId && set.has(dept.companyId);
      });
    }
    if (departmentIds.length > 0) {
      const set = new Set(departmentIds);
      items = items.filter(p => p.departmentId && set.has(p.departmentId));
    }
    return items;
  }, [page.filteredItems, companyIds, departmentIds, departmentMap]);

  // Derive filter options from hook data
  const availableCompanies = useMemo(() => {
    if (!companiesData?.companies) return [];
    return companiesData.companies.map(c => ({
      id: c.id,
      name: c.tradeName || c.legalName,
    }));
  }, [companiesData?.companies]);

  const availableDepartments = useMemo(() => {
    if (!departmentsData?.departments) return [];

    // If no company filter, show all departments
    if (companyIds.length === 0) {
      return departmentsData.departments.map(d => ({
        id: d.id,
        name: d.name,
      }));
    }

    // Narrow: only departments belonging to selected companies
    const cmpSet = new Set(companyIds);
    return departmentsData.departments
      .filter(d => d.companyId && cmpSet.has(d.companyId))
      .map(d => ({
        id: d.id,
        name: d.name,
      }));
  }, [departmentsData?.departments, companyIds]);

  // Build URL preserving filter params
  const buildFilterUrl = useCallback(
    (params: { company?: string[]; department?: string[] }) => {
      const cmp = params.company !== undefined ? params.company : companyIds;
      const dept =
        params.department !== undefined ? params.department : departmentIds;
      const parts: string[] = [];
      if (cmp.length > 0) parts.push(`company=${cmp.join(',')}`);
      if (dept.length > 0) parts.push(`department=${dept.join(',')}`);
      return parts.length > 0
        ? `/hr/positions?${parts.join('&')}`
        : '/hr/positions';
    },
    [companyIds, departmentIds]
  );

  const setCompanyFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ company: ids }));
    },
    [router, buildFilterUrl]
  );

  const setDepartmentFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ department: ids }));
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

  const formatSalary = (value?: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderGridCard = (item: Position, isSelected: boolean) => {
    const employeeCount = item._count?.employees ?? 0;
    const salaryRange =
      item.minSalary || item.maxSalary
        ? `${formatSalary(item.minSalary) || '—'} - ${formatSalary(item.maxSalary) || '—'}`
        : null;

    // Get department and company info from lookup maps
    const deptInfo = item.departmentId
      ? departmentMap.get(item.departmentId)
      : null;
    const companyInfo = deptInfo?.companyId
      ? companyMap.get(deptInfo.companyId)
      : null;
    const deptLabel = deptInfo
      ? companyInfo
        ? `${deptInfo.name} - ${companyInfo.tradeName || companyInfo.legalName}`
        : deptInfo.name
      : null;

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
          subtitle={item.description || `Codigo: ${item.code}`}
          icon={Briefcase}
          iconBgColor="bg-linear-to-br from-indigo-500 to-purple-600"
          badges={[
            ...(deptLabel
              ? [
                  {
                    label: deptLabel,
                    variant: 'outline' as const,
                    icon: Building2,
                  },
                ]
              : []),
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          metadata={
            salaryRange ? (
              <span className="text-xs text-muted-foreground">
                Faixa salarial: {salaryRange}
              </span>
            ) : undefined
          }
          footer={{
            type: 'single',
            button: {
              icon: Users,
              label: `${employeeCount} funcionario${employeeCount !== 1 ? 's' : ''}`,
              href: `/hr/employees?position=${item.id}`,
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

  const renderListCard = (item: Position, isSelected: boolean) => {
    const employeeCount = item._count?.employees ?? 0;
    const salaryRange =
      item.minSalary || item.maxSalary
        ? `${formatSalary(item.minSalary) || '—'} - ${formatSalary(item.maxSalary) || '—'}`
        : null;

    // Get department and company info from lookup maps
    const deptInfo = item.departmentId
      ? departmentMap.get(item.departmentId)
      : null;
    const companyInfo = deptInfo?.companyId
      ? companyMap.get(deptInfo.companyId)
      : null;
    const deptLabel = deptInfo
      ? companyInfo
        ? `${deptInfo.name} - ${companyInfo.tradeName || companyInfo.legalName}`
        : deptInfo.name
      : null;

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
          subtitle={item.description || `Codigo: ${item.code}`}
          icon={Briefcase}
          iconBgColor="bg-linear-to-br from-indigo-500 to-purple-600"
          badges={[
            ...(deptLabel
              ? [
                  {
                    label: deptLabel,
                    variant: 'outline' as const,
                    icon: Building2,
                  },
                ]
              : []),
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          metadata={
            salaryRange ? (
              <span className="text-xs text-muted-foreground">
                Faixa salarial: {salaryRange}
              </span>
            ) : undefined
          }
          footer={{
            type: 'single',
            button: {
              icon: Users,
              label: `${employeeCount} funcionario${employeeCount !== 1 ? 's' : ''}`,
              href: `/hr/employees?position=${item.id}`,
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
    () => displayedPositions.map(i => i.id),
    [displayedPositions]
  );

  // Funcao de ordenacao customizada por codigo
  const customSortByCode = (
    a: Position,
    b: Position,
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
        id: 'import-positions',
        title: 'Importar',
        icon: Upload,
        onClick: () => router.push('/import/hr/positions'),
        variant: 'outline',
        permission: positionsConfig.permissions?.import,
      },
      {
        id: 'create-position',
        title: 'Novo Cargo',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: positionsConfig.permissions?.create,
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
        namespace: 'positions',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Cargos', href: '/hr/positions' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Cargos"
            description="Gerencie os cargos da organizacao"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={page.searchQuery}
            placeholder={positionsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar cargos"
              message="Ocorreu um erro ao tentar carregar os cargos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={positionsConfig}
              items={displayedPositions}
              toolbarStart={
                <>
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
                      onClick: () => router.push('/hr/companies'),
                      color: 'emerald',
                    }}
                  />
                  <FilterDropdown
                    label="Departamento"
                    icon={Building2}
                    options={availableDepartments.map(d => ({
                      id: d.id,
                      label: d.name,
                    }))}
                    selected={departmentIds}
                    onSelectionChange={setDepartmentFilter}
                    activeColor="blue"
                    searchPlaceholder="Buscar departamento..."
                    emptyText="Nenhum departamento encontrado."
                    footerAction={{
                      icon: ExternalLink,
                      label: 'Ver todos os departamentos',
                      onClick: () => router.push('/hr/departments'),
                      color: 'blue',
                    }}
                  />
                </>
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
              customSortFn={customSortByCode}
              customSortLabel="Codigo"
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedPositions.length}
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
            position={page.modals.viewingItem}
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
            position={page.modals.editingItem}
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
