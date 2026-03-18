/**
 * OpenSea OS - Locations Dashboard Page
 * Página de gerenciamento de localizações (armazéns) usando o sistema padronizado OpenSea OS
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
import { warehousesConfig } from '@/config/entities/warehouses.config';
import { usePermissions } from '@/hooks/use-permissions';
import { apiClient } from '@/lib/api-client';
import type {
  Warehouse,
  WarehousesResponse,
  WarehouseResponse,
} from '@/types/stock';
import {
  Pencil,
  Plus,
  Tag,
  Trash2,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { StockLocationSearch, LocationHealthCards, WarehouseCardNew } from './src/components';
import { LocationSetupWizard } from './src/modals';

export default function LocationsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <LocationsDashboardContent />
    </Suspense>
  );
}

function LocationsDashboardContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // STATE
  // ============================================================================

  const [wizardOpen, setWizardOpen] = useState(false);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<Warehouse>({
    entityName: 'Armazém',
    entityNamePlural: 'Armazéns',
    queryKey: ['warehouses'],
    baseUrl: '/api/v1/warehouses',
    listFn: async () => {
      const response = await apiClient.get<WarehousesResponse>('/v1/warehouses');
      return response.warehouses;
    },
    getFn: async (id: string) => {
      const response = await apiClient.get<WarehouseResponse>(`/v1/warehouses/${id}`);
      return response.warehouse;
    },
    createFn: async (data) => {
      const response = await apiClient.post<WarehouseResponse>('/v1/warehouses', data);
      return response.warehouse;
    },
    updateFn: async (id, data) => {
      const response = await apiClient.patch<WarehouseResponse>(`/v1/warehouses/${id}`, data);
      return response.warehouse;
    },
    deleteFn: async (id: string) => {
      await apiClient.delete(`/v1/warehouses/${id}`);
    },
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Warehouse>({
    entityName: 'Armazém',
    entityNamePlural: 'Armazéns',
    queryKey: ['warehouses'],
    crud,
    viewRoute: (id) => `/stock/locations/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return (
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      );
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    page.handlers.handleItemsView(ids);
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/locations/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Warehouse, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={[
          {
            id: 'delete',
            label: 'Excluir',
            icon: Trash2,
            onClick: handleContextDelete,
            variant: 'destructive',
            separator: 'before',
          },
        ]}
      >
        <WarehouseCardNew warehouse={item} isSelected={isSelected} />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Warehouse, isSelected: boolean) => {
    const stats = item.stats;
    const zoneLabel = stats
      ? `${stats.totalZones} ${stats.totalZones === 1 ? 'zona' : 'zonas'}`
      : '';
    const binLabel = stats ? `${stats.totalBins.toLocaleString()} bins` : '';
    const occupancy = stats ? `${stats.occupancyPercentage.toFixed(0)}% ocupação` : '';

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={handleContextEdit}
        actions={[
          {
            id: 'delete',
            label: 'Excluir',
            icon: Trash2,
            onClick: handleContextDelete,
            variant: 'destructive',
            separator: 'before',
          },
        ]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-mono font-bold text-sm text-foreground shrink-0">
                {item.code}
              </span>
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
            </span>
          }
          metadata={
            stats ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0 border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300">
                  {zoneLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0 border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300">
                  {binLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0 border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                  {occupancy}
                </span>
              </div>
            ) : undefined
          }
          icon={WarehouseIcon}
          iconBgColor="bg-linear-to-br from-blue-500 to-indigo-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : ('secondary' as const),
            },
          ]}
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

  const selectedIds = useMemo(
    () => Array.from(page.selection?.state.selectedIds || []),
    [page.selection?.state.selectedIds]
  );

  const hasSelection = selectedIds.length > 0;

  const displayedWarehouses = page.filteredItems || [];

  const initialIds = useMemo(
    () =>
      (Array.isArray(displayedWarehouses) ? displayedWarehouses : []).map(
        (i) => i.id
      ),
    [displayedWarehouses]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(
    () => [
      {
        id: 'labels-link',
        title: 'Etiquetas',
        icon: Tag,
        onClick: () => router.push('/stock/locations/labels'),
        variant: 'outline',
      },
      {
        id: 'create-warehouse',
        title: 'Novo Armazém',
        icon: Plus,
        onClick: () => setWizardOpen(true),
        variant: 'default',
      },
    ],
    [router]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'locations',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Localizações"
            description="Gerencie armazéns, zonas, corredores, prateleiras e nichos"
          />
        </PageHeader>

        <PageBody>
          {/* Busca global por endereço, produto ou SKU */}
          <StockLocationSearch />

          {/* Cards de saúde */}
          <LocationHealthCards />

          {/* Barra de busca de armazéns */}
          <SearchBar
            placeholder="Buscar armazéns por código ou nome..."
            value={page.searchQuery}
            onSearch={(value) => page.handlers.handleSearch(value)}
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
              title="Erro ao carregar armazéns"
              message="Ocorreu um erro ao tentar carregar os armazéns. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={warehousesConfig}
              items={displayedWarehouses}
              showItemCount={false}
              toolbarStart={
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Total de {displayedWarehouses.length}{' '}
                  {displayedWarehouses.length === 1 ? 'armazém' : 'armazéns'}
                  {selectedIds.length > 0 &&
                    ` · ${selectedIds.length} selecionado${selectedIds.length > 1 ? 's' : ''}`}
                </p>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={(item) =>
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
              totalItems={displayedWarehouses.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: true,
                edit: true,
                duplicate: false,
                delete: true,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: page.handlers.handleItemsEdit,
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={() => page.handlers.handleDeleteConfirm()}
            title="Confirmar Exclusão"
            description={
              page.modals.itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir este armazém. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} armazéns. Esta ação não pode ser desfeita.`
            }
          />

          {/* Setup Wizard */}
          <LocationSetupWizard
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onSuccess={(id) => router.push(`/stock/locations/${id}`)}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
