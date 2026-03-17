/**
 * OpenSea OS - Manufacturers Page
 * Página de gerenciamento de fabricantes usando o novo sistema OpenSea OS
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
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { productsService } from '@/services/stock';
import type { Manufacturer, Product } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import { COUNTRIES } from '@/components/ui/country-select';
import { formatCNPJ } from '@/lib/masks';
import {
  ArrowDownAZ,
  Calendar,
  ChevronRight,
  Clock,
  Copy,
  Factory,
  Globe,
  Hash,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CircleFlag } from 'react-circle-flags';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreateManufacturerWizard,
  createManufacturer,
  deleteManufacturer,
  DuplicateConfirmModal,
  duplicateManufacturer,
  manufacturersApi,
  manufacturersConfig,
  RenameModal,
  updateManufacturer,
} from './src';

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function ManufacturersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // STATE
  // ============================================================================

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameManufacturer, setRenameManufacturer] =
    useState<Manufacturer | null>(null);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<Manufacturer>({
    entityName: 'Fabricante',
    entityNamePlural: 'Fabricantes',
    queryKey: ['manufacturers'],
    baseUrl: '/api/v1/manufacturers',
    listFn: async () => {
      const response = await manufacturersApi.list();
      return response.manufacturers.filter(
        (manufacturer: Manufacturer) => !manufacturer.deletedAt
      );
    },
    getFn: (id: string) => manufacturersApi.get(id),
    createFn: createManufacturer,
    updateFn: updateManufacturer,
    deleteFn: deleteManufacturer,
    duplicateFn: duplicateManufacturer,
    onDeleteSuccess: () => {
      /* noop */
    },
  });

  // ============================================================================
  // PRODUCT COUNTS
  // ============================================================================

  const { data: products } = useQuery<Product[]>({
    queryKey: ['products-for-manufacturer-counts'],
    queryFn: async () => {
      const response = await productsService.listProducts();
      return response.products;
    },
  });

  const productCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!products) return map;
    for (const product of products) {
      if (product.manufacturerId) {
        map.set(
          product.manufacturerId,
          (map.get(product.manufacturerId) || 0) + 1
        );
      }
    }
    return map;
  }, [products]);

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Manufacturer>({
    entityName: 'Fabricante',
    entityNamePlural: 'Fabricantes',
    queryKey: ['manufacturers'],
    crud,
    viewRoute: id => `/stock/manufacturers/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      const name = item.name?.toLowerCase() || '';
      const country = item.country?.toLowerCase() || '';
      const email = item.email?.toLowerCase() || '';
      return [name, country, email].some(value => value.includes(q));
    },
    duplicateConfig: {
      getNewName: item => `${item.name} (Cópia)`,
      getData: item => ({
        name: `${item.name} (Cópia)`,
        country: item.country,
        isActive: item.isActive,
      }),
    },
  });

  // ============================================================================
  // OPEN CREATE MODAL VIA URL PARAM
  // ============================================================================
  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      page.modals.open('create');
      window.history.replaceState(null, '', '/stock/manufacturers');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/manufacturers/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/stock/manufacturers/${ids[0]}/edit`);
    }
  };

  const handleContextRename = useCallback(
    (ids: string[]) => {
      const manufacturer = crud.items?.find(m => m.id === ids[0]) || null;
      setRenameManufacturer(manufacturer);
      setRenameModalOpen(true);
    },
    [crud.items]
  );

  const handleRenameSubmit = useCallback(
    async (id: string, data: Partial<Manufacturer>) => {
      await crud.update(id, data);
      await crud.invalidate();
      setRenameModalOpen(false);
      setRenameManufacturer(null);
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

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

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
        icon: Copy,
        onClick: handleContextDuplicate,
        separator: 'before' as const,
      },
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive' as const,
        separator: 'before' as const,
      },
    ],
    [handleContextRename]
  );

  // ============================================================================
  // BADGES
  // ============================================================================

  /** Resolve country name → ISO code for flag */
  const getCountryCode = useCallback((name: string): string | null => {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    const match = COUNTRIES.find(c => c.name.toLowerCase() === lower);
    return match?.code ?? null;
  }, []);

  /** Create a flag icon component for a given country code */
  const makeFlagIcon = useCallback(
    (cc: string) =>
      function FlagIcon() {
        return <CircleFlag countryCode={cc} height={12} width={12} />;
      },
    []
  );

  const getManufacturerBadges = (item: Manufacturer) => {
    const badges: {
      label: string;
      variant: 'outline';
      icon?: typeof Globe;
      color: string;
      flag?: string;
    }[] = [];

    // Country badge with flag (violet) — first
    const cc = getCountryCode(item.country);
    badges.push({
      label: item.country || '—',
      variant: 'outline',
      icon:
        cc && cc !== 'OTHER'
          ? (makeFlagIcon(cc.toLowerCase()) as unknown as typeof Globe)
          : Globe,
      color:
        'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
      flag: cc && cc !== 'OTHER' ? cc.toLowerCase() : undefined,
    });

    // Code badge (slate) — second
    if (item.code) {
      badges.push({
        label: item.code,
        variant: 'outline',
        icon: Hash,
        color:
          'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
      });
    }

    // Website badge (sky)
    if (item.website) {
      badges.push({
        label: 'Website',
        variant: 'outline',
        icon: Globe,
        color:
          'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
      });
    }

    // Inactive badge (amber)
    if (!item.isActive) {
      badges.push({
        label: 'Inativo',
        variant: 'outline',
        color:
          'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
      });
    }

    return badges;
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const sortOptions = useMemo(
    () => [
      {
        field: 'custom' as const,
        direction: 'asc' as const,
        label: 'Nome (A-Z)',
        icon: ArrowDownAZ,
      },
      {
        field: 'custom' as const,
        direction: 'desc' as const,
        label: 'Nome (Z-A)',
        icon: ArrowDownAZ,
      },
      {
        field: 'createdAt' as const,
        direction: 'desc' as const,
        label: 'Mais recentes',
        icon: Calendar,
      },
      {
        field: 'createdAt' as const,
        direction: 'asc' as const,
        label: 'Mais antigos',
        icon: Calendar,
      },
      {
        field: 'updatedAt' as const,
        direction: 'desc' as const,
        label: 'Última atualização',
        icon: Clock,
      },
    ],
    []
  );

  const renderGridCard = (item: Manufacturer, isSelected: boolean) => {
    const productCount = productCountMap.get(item.id) || 0;

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
          title={(item.name || '').toUpperCase()}
          subtitle={item.cnpj ? formatCNPJ(item.cnpj) : 'Sem CNPJ'}
          icon={Factory}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          badges={getManufacturerBadges(item)}
          footer={{
            type: 'single',
            button: {
              icon: Package,
              label: `${productCount} ${productCount === 1 ? 'produto' : 'produtos'}`,
              href: `/stock/products?manufacturer=${item.id}`,
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

  const renderListCard = (item: Manufacturer, isSelected: boolean) => {
    const productCount = productCountMap.get(item.id) || 0;
    const listBadges = getManufacturerBadges(item);

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
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {(item.name || '').toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.cnpj ? formatCNPJ(item.cnpj) : 'Sem CNPJ'}
              </span>
            </span>
          }
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges.map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
                    badge.color
                  )}
                >
                  {badge.flag ? (
                    <CircleFlag
                      countryCode={badge.flag}
                      height={12}
                      width={12}
                      className="shrink-0"
                    />
                  ) : badge.icon ? (
                    <badge.icon className="w-3 h-3" />
                  ) : null}
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={Factory}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          <Link
            href={`/stock/products?manufacturer=${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
            onClick={e => e.stopPropagation()}
          >
            <Package className="h-3.5 w-3.5" />
            {productCount} produto{productCount !== 1 ? 's' : ''}
            <ChevronRight className="h-3 w-3" />
          </Link>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const selectedIds = Array.from(page.selection?.state.selectedIds || []);
  const hasSelection = selectedIds.length > 0;

  const initialIds = useMemo(
    () => (page.filteredItems ?? []).map(i => i.id),
    [page.filteredItems]
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const handleImport = useCallback(() => {
    router.push('/import/stock/manufacturers');
  }, [router]);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'import-manufacturers',
        title: 'Importar',
        icon: Upload,
        onClick: handleImport,
        variant: 'ghost',
        permission: manufacturersConfig.permissions?.import,
      },
      {
        id: 'create-manufacturer',
        title: 'Novo Fabricante',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: manufacturersConfig.permissions?.create,
      },
    ],
    [handleImport, handleCreate]
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
        namespace: 'manufacturers',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Fabricantes', href: '/stock/manufacturers' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Fabricantes"
            description="Gerencie os fabricantes de produtos"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={page.searchQuery}
            placeholder={manufacturersConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar fabricantes"
              message="Ocorreu um erro ao tentar carregar os fabricantes. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={manufacturersConfig}
              items={page.filteredItems}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={page.isLoading}
              isSearching={!!page.searchQuery}
              onItemClick={(item, e) => page.handlers.handleItemClick(item, e)}
              onItemDoubleClick={item =>
                page.handlers.handleItemDoubleClick(item)
              }
              showSorting={true}
              showItemCount={false}
              toolbarStart={
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Total de {page.filteredItems.length}{' '}
                  {page.filteredItems.length === 1
                    ? 'fabricante'
                    : 'fabricantes'}
                </p>
              }
              defaultSortField="custom"
              defaultSortDirection="asc"
              customSortOptions={sortOptions}
              customSortFn={(a, b, direction) => {
                const multiplier = direction === 'asc' ? 1 : -1;
                const nameA = a.name?.toLowerCase() ?? '';
                const nameB = b.name?.toLowerCase() ?? '';
                return nameA.localeCompare(nameB, 'pt-BR') * multiplier;
              }}
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={page.filteredItems.length}
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

          {/* Create Wizard */}
          <CreateManufacturerWizard
            open={page.modals.isOpen('create')}
            onOpenChange={open => !open && page.modals.close('create')}
            onSubmit={async data => {
              await crud.create(data);
            }}
          />

          {/* Rename Modal */}
          <RenameModal
            isOpen={renameModalOpen}
            onClose={() => {
              setRenameModalOpen(false);
              setRenameManufacturer(null);
            }}
            manufacturer={renameManufacturer}
            isSubmitting={crud.isUpdating}
            onSubmit={handleRenameSubmit}
          />

          {/* Delete Confirmation (PIN) */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={() => page.handlers.handleDeleteConfirm()}
            title="Confirmar Exclusão"
            description={`Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} ${page.modals.itemsToDelete.length === 1 ? 'fabricante' : 'fabricantes'}.`}
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
