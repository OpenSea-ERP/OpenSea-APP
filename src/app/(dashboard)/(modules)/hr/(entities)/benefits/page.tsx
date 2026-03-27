/**
 * OpenSea OS - Benefits Plans Listing Page
 * Página de listagem de planos de benefícios
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
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import type { BenefitPlan, BenefitType } from '@/types/hr';
import { Heart, Plus, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  benefitPlansApi,
  benefitsConfig,
  createBenefitPlan,
  deleteBenefitPlan,
  updateBenefitPlan,
  duplicateBenefitPlan,
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_COLORS,
  BENEFIT_TYPE_OPTIONS,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);

export default function BenefitsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <BenefitsPageContent />
    </Suspense>
  );
}

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function BenefitsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const typeFilter = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<BenefitPlan>({
    entityName: 'Plano de Benefício',
    entityNamePlural: 'Planos de Benefícios',
    queryKey: ['benefit-plans'],
    baseUrl: '/api/v1/hr/benefit-plans',
    listFn: async () => {
      const response = await benefitPlansApi.list({ perPage: 100 });
      return response.benefitPlans;
    },
    getFn: (id: string) => benefitPlansApi.get(id),
    createFn: createBenefitPlan,
    updateFn: updateBenefitPlan,
    deleteFn: deleteBenefitPlan,
    duplicateFn: duplicateBenefitPlan,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<BenefitPlan>({
    entityName: 'Plano de Benefício',
    entityNamePlural: 'Planos de Benefícios',
    queryKey: ['benefit-plans'],
    crud,
    viewRoute: id => `/hr/benefits/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.name.toLowerCase().includes(q) ||
          (item.provider && item.provider.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          BENEFIT_TYPE_LABELS[item.type]?.toLowerCase().includes(q)
      );
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (cópia)`,
      getData: item => ({
        name: `${item.name} (cópia)`,
        type: item.type,
        provider: item.provider,
        description: item.description,
        isActive: item.isActive,
        rules: item.rules,
      }),
    },
  });

  // ============================================================================
  // CLIENT-SIDE URL FILTERS
  // ============================================================================

  const displayedPlans = useMemo(() => {
    let items = page.filteredItems || [];
    if (typeFilter.length > 0) {
      const set = new Set(typeFilter);
      items = items.filter(p => set.has(p.type));
    }
    if (statusFilter.length > 0) {
      if (statusFilter.includes('active') && !statusFilter.includes('inactive')) {
        items = items.filter(p => p.isActive);
      } else if (statusFilter.includes('inactive') && !statusFilter.includes('active')) {
        items = items.filter(p => !p.isActive);
      }
    }
    return items;
  }, [page.filteredItems, typeFilter, statusFilter]);

  // Build URL preserving filter params
  const buildFilterUrl = useCallback(
    (params: { type?: string[]; status?: string[] }) => {
      const types = params.type !== undefined ? params.type : typeFilter;
      const statuses = params.status !== undefined ? params.status : statusFilter;
      const parts: string[] = [];
      if (types.length > 0) parts.push(`type=${types.join(',')}`);
      if (statuses.length > 0) parts.push(`status=${statuses.join(',')}`);
      return parts.length > 0
        ? `/hr/benefits?${parts.join('&')}`
        : '/hr/benefits';
    },
    [typeFilter, statusFilter]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ type: ids }));
    },
    [router, buildFilterUrl]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ status: ids }));
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

  const renderGridCard = (item: BenefitPlan, isSelected: boolean) => {
    const colors = BENEFIT_TYPE_COLORS[item.type];
    const typeLabel = BENEFIT_TYPE_LABELS[item.type] || item.type;
    const enrolledCount = item._count?.enrollments ?? 0;

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
          subtitle={item.provider || typeLabel}
          icon={Heart}
          iconBgColor={`bg-linear-to-br ${colors.gradient}`}
          badges={[
            {
              label: typeLabel,
              variant: 'outline',
            },
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'single',
            center: {
              icon: Users,
              label: `${enrolledCount} inscrito${enrolledCount !== 1 ? 's' : ''}`,
              color: 'pink',
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

  const renderListCard = (item: BenefitPlan, isSelected: boolean) => {
    const colors = BENEFIT_TYPE_COLORS[item.type];
    const typeLabel = BENEFIT_TYPE_LABELS[item.type] || item.type;
    const enrolledCount = item._count?.enrollments ?? 0;

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
          subtitle={item.provider || typeLabel}
          icon={Heart}
          iconBgColor={`bg-linear-to-br ${colors.gradient}`}
          badges={[
            {
              label: typeLabel,
              variant: 'outline',
            },
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'single',
            center: {
              icon: Users,
              label: `${enrolledCount} inscrito${enrolledCount !== 1 ? 's' : ''}`,
              color: 'pink',
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
    () => displayedPlans.map(i => i.id),
    [displayedPlans]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'enrollments',
        title: 'Inscrições',
        icon: Users,
        onClick: () => router.push('/hr/benefits/enrollments'),
        variant: 'outline',
      },
      {
        id: 'create-benefit',
        title: 'Novo Plano',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: benefitsConfig.permissions?.create,
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
        namespace: 'benefits',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Benefícios', href: '/hr/benefits' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Planos de Benefícios"
            description="Gerencie os planos de benefícios da organização"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={benefitsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar planos de benefícios"
              message="Ocorreu um erro ao tentar carregar os planos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={benefitsConfig}
              items={displayedPlans}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Tipo"
                    icon={Heart}
                    options={BENEFIT_TYPE_OPTIONS.map(o => ({
                      id: o.value,
                      label: o.label,
                    }))}
                    selected={typeFilter}
                    onSelectionChange={setTypeFilter}
                    activeColor="pink"
                    searchPlaceholder="Buscar tipo..."
                    emptyText="Nenhum tipo encontrado."
                  />
                  <FilterDropdown
                    label="Status"
                    options={[
                      { id: 'active', label: 'Ativo' },
                      { id: 'inactive', label: 'Inativo' },
                    ]}
                    selected={statusFilter}
                    onSelectionChange={setStatusFilter}
                    activeColor="emerald"
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
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedPlans.length}
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
            isSubmitting={crud.isCreating}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={page.handlers.handleDeleteConfirm}
            title="Excluir Plano de Benefício"
            description={`Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} plano(s). Esta ação não pode ser desfeita.`}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
