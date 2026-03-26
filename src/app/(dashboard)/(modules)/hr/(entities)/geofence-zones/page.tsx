/**
 * OpenSea OS - Geofence Zones Listing Page
 * Gerenciamento de zonas de geofencing para controle de ponto
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
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import type { GeofenceZone } from '@/types/hr';
import {
  ExternalLink,
  MapPin,
  Navigation,
  Plus,
  Radius,
  Trash2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo } from 'react';
import {
  createGeofenceZone,
  deleteGeofenceZone,
  duplicateGeofenceZone,
  formatCoordinates,
  formatRadius,
  geofenceZonesApi,
  geofenceZonesConfig,
  updateGeofenceZone,
} from './src';

const CreateModal = dynamic(
  () =>
    import('./src/modals/create-modal').then(m => ({ default: m.CreateModal })),
  { ssr: false }
);

export default function GeofenceZonesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <GeofenceZonesPageContent />
    </Suspense>
  );
}

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function GeofenceZonesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  const canView = hasPermission(HR_PERMISSIONS.GEOFENCE_ZONES.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.GEOFENCE_ZONES.CREATE);
  const canEdit = hasPermission(HR_PERMISSIONS.GEOFENCE_ZONES.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.GEOFENCE_ZONES.DELETE);

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<GeofenceZone>({
    entityName: 'Zona de Geofencing',
    entityNamePlural: 'Zonas de Geofencing',
    queryKey: ['geofence-zones'],
    baseUrl: '/api/v1/hr/geofence-zones',
    listFn: async () => {
      const zones = await geofenceZonesApi.list();
      return zones;
    },
    getFn: (id: string) => geofenceZonesApi.get(id),
    createFn: createGeofenceZone,
    updateFn: updateGeofenceZone,
    deleteFn: deleteGeofenceZone,
    duplicateFn: duplicateGeofenceZone,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<GeofenceZone>({
    entityName: 'Zona de Geofencing',
    entityNamePlural: 'Zonas de Geofencing',
    queryKey: ['geofence-zones'],
    crud,
    viewRoute: id => `/hr/geofence-zones/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.name.toLowerCase().includes(q) ||
          (item.address && item.address.toLowerCase().includes(q))
      );
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (cópia)`,
      getData: item => ({
        name: `${item.name} (cópia)`,
        latitude: item.latitude,
        longitude: item.longitude,
        radiusMeters: item.radiusMeters,
        isActive: item.isActive,
        address: item.address,
      }),
    },
  });

  // ============================================================================
  // CLIENT-SIDE URL FILTERS
  // ============================================================================

  const displayedZones = useMemo(() => {
    let items = page.filteredItems || [];
    if (statusFilter.length > 0) {
      const activeSet = new Set(statusFilter);
      items = items.filter(z => {
        if (activeSet.has('active') && z.isActive) return true;
        if (activeSet.has('inactive') && !z.isActive) return true;
        return false;
      });
    }
    return items;
  }, [page.filteredItems, statusFilter]);

  // Build URL preserving filter params
  const buildFilterUrl = useCallback(
    (params: { status?: string[] }) => {
      const sts = params.status !== undefined ? params.status : statusFilter;
      const parts: string[] = [];
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      return parts.length > 0
        ? `/hr/geofence-zones?${parts.join('&')}`
        : '/hr/geofence-zones';
    },
    [statusFilter]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ status: ids }));
    },
    [router, buildFilterUrl]
  );

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const getContextActions = useCallback(
    (item: GeofenceZone): ContextMenuAction[] => {
      const actions: ContextMenuAction[] = [];

      if (canView) {
        actions.push({
          id: 'open',
          label: 'Abrir',
          icon: ExternalLink,
          onClick: (ids: string[]) => {
            if (ids.length > 0) router.push(`/hr/geofence-zones/${ids[0]}`);
          },
        });
      }

      if (canDelete) {
        actions.push({
          id: 'delete',
          label: 'Excluir',
          icon: Trash2,
          variant: 'destructive',
          separator: 'before',
          onClick: (ids: string[]) => {
            page.modals.setItemsToDelete(ids);
            page.modals.open('delete');
          },
        });
      }

      return actions;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canView, canDelete]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: GeofenceZone, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/geofence-zones/${ids[0]}`);
              }
            : undefined
        }
        onEdit={
          canEdit
            ? (ids: string[]) => {
                page.handlers.handleItemsEdit(ids);
              }
            : undefined
        }
        onDuplicate={
          canCreate
            ? (ids: string[]) => {
                page.handlers.handleItemsDuplicate(ids);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={
            item.address || formatCoordinates(item.latitude, item.longitude)
          }
          icon={MapPin}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: item.isActive ? 'Ativa' : 'Inativa',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Radius,
              label: formatRadius(item.radiusMeters),
              color: 'emerald',
            },
            right: {
              icon: Navigation,
              label: `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => {
            if (canView) router.push(`/hr/geofence-zones/${item.id}`);
          }}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: GeofenceZone, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={
          canView
            ? (ids: string[]) => {
                if (ids.length > 0) router.push(`/hr/geofence-zones/${ids[0]}`);
              }
            : undefined
        }
        onEdit={
          canEdit
            ? (ids: string[]) => {
                page.handlers.handleItemsEdit(ids);
              }
            : undefined
        }
        onDuplicate={
          canCreate
            ? (ids: string[]) => {
                page.handlers.handleItemsDuplicate(ids);
              }
            : undefined
        }
        actions={getContextActions(item)}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={
            item.address || formatCoordinates(item.latitude, item.longitude)
          }
          icon={MapPin}
          iconBgColor="bg-linear-to-br from-teal-500 to-emerald-600"
          badges={[
            {
              label: item.isActive ? 'Ativa' : 'Inativa',
              variant: item.isActive ? 'default' : 'secondary',
            },
          ]}
          footer={{
            type: 'split',
            left: {
              icon: Radius,
              label: formatRadius(item.radiusMeters),
              color: 'emerald',
            },
            right: {
              icon: Navigation,
              label: `${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`,
              color: 'emerald',
            },
          }}
          isSelected={isSelected}
          showSelection={true}
          clickable
          onClick={() => {
            if (canView) router.push(`/hr/geofence-zones/${item.id}`);
          }}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
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
    () => displayedZones.map(i => i.id),
    [displayedZones]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(() => {
    const buttons: ActionButtonWithPermission[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-zone',
        title: 'Nova Zona',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate, handleCreate]);

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
        namespace: 'geofence-zones',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Zonas de Geofencing', href: '/hr/geofence-zones' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Zonas de Geofencing"
            description="Gerencie as zonas de geofencing para controle de ponto por localização"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={geofenceZonesConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar zonas de geofencing"
              message="Ocorreu um erro ao tentar carregar as zonas. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={geofenceZonesConfig}
              items={displayedZones}
              toolbarStart={
                <FilterDropdown
                  label="Status"
                  icon={MapPin}
                  options={[
                    { id: 'active', label: 'Ativa' },
                    { id: 'inactive', label: 'Inativa' },
                  ]}
                  selected={statusFilter}
                  onSelectionChange={setStatusFilter}
                  activeColor="emerald"
                  searchPlaceholder="Filtrar status..."
                  emptyText="Nenhum status disponível."
                />
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/geofence-zones/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="name"
              defaultSortDirection="asc"
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedZones.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: canView,
                edit: canEdit,
                duplicate: canCreate,
                delete: canDelete,
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
            title="Excluir Zona de Geofencing"
            description={`Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} zona(s) de geofencing. Esta ação não pode ser desfeita.`}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
