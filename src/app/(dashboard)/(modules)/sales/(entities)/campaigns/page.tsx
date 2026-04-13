/**
 * OpenSea OS - Campaigns Page
 * Página de gerenciamento de campanhas promocionais com infinite scroll e filtros server-side
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
import { campaignsConfig } from '@/config/entities/campaigns.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCampaignsInfinite,
  useDeleteCampaign,
} from '@/hooks/sales/use-campaigns';
import { CreateCampaignWizard } from './src/components/create-campaign-wizard';
import type { Campaign, CampaignStatus } from '@/types/sales';
import {
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
} from '@/types/sales';
import { cn } from '@/lib/utils';
import { Megaphone, Plus, Trash2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// HELPERS
// ============================================================================

const STATUS_ICON_COLORS: Record<CampaignStatus, string> = {
  DRAFT: 'bg-linear-to-br from-gray-400 to-gray-500',
  SCHEDULED: 'bg-linear-to-br from-blue-500 to-indigo-600',
  ACTIVE: 'bg-linear-to-br from-emerald-500 to-teal-600',
  PAUSED: 'bg-linear-to-br from-amber-500 to-orange-600',
  ENDED: 'bg-linear-to-br from-rose-500 to-pink-600',
  ARCHIVED: 'bg-linear-to-br from-gray-400 to-gray-500',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function CampaignsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <CampaignsPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function CampaignsPageContent() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>(
    'createdAt'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    campaigns,
    total,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCampaignsInfinite({
    search: debouncedSearch || undefined,
    status: (statusFilter[0] as CampaignStatus) || undefined,
    type: typeFilter[0] as Campaign['type'] | undefined,
  });

  const deleteMutation = useDeleteCampaign();

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

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
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () =>
      Object.entries(CAMPAIGN_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const typeOptions = useMemo(
    () =>
      Object.entries(CAMPAIGN_TYPE_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/campaigns/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/sales/campaigns/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Campanha excluída com sucesso!'
        : `${itemsToDelete.length} campanhas excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Campaign, isSelected: boolean) => {
    const statusLabel = CAMPAIGN_STATUS_LABELS[item.status] || item.status;
    const typeLabel = CAMPAIGN_TYPE_LABELS[item.type] || item.type;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          campaignsConfig.permissions!.update &&
          hasPermission(campaignsConfig.permissions!.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(campaignsConfig.permissions!.delete)
            ? [
                {
                  id: 'delete',
                  label: 'Excluir',
                  icon: Trash2,
                  onClick: handleContextDelete,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={`${formatDate(item.startDate)} - ${formatDate(item.endDate)}`}
          icon={Megaphone}
          iconBgColor={STATUS_ICON_COLORS[item.status]}
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
            {
              label: typeLabel,
              variant: 'secondary',
            },
            ...(item.usageCount > 0
              ? [
                  {
                    label: `${item.usageCount} usos`,
                    variant: 'outline' as const,
                  },
                ]
              : []),
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

  const renderListCard = (item: Campaign, isSelected: boolean) => {
    const statusLabel = CAMPAIGN_STATUS_LABELS[item.status] || item.status;
    const statusColor =
      CAMPAIGN_STATUS_COLORS[item.status] || CAMPAIGN_STATUS_COLORS.DRAFT;
    const typeLabel = CAMPAIGN_TYPE_LABELS[item.type] || item.type;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Megaphone;
      color: string;
    }[] = [
      {
        label: statusLabel,
        variant: 'outline',
        color: statusColor,
      },
      {
        label: typeLabel,
        variant: 'outline',
        icon: Megaphone,
        color:
          'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
      },
      ...(item.usageCount > 0
        ? [
            {
              label: `${item.usageCount} usos`,
              variant: 'outline' as const,
              color:
                'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          campaignsConfig.permissions!.update &&
          hasPermission(campaignsConfig.permissions!.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(campaignsConfig.permissions!.delete)
            ? [
                {
                  id: 'delete',
                  label: 'Excluir',
                  icon: Trash2,
                  onClick: handleContextDelete,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
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
                  {badge.icon && <badge.icon className="w-3 h-3" />}
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={Megaphone}
          iconBgColor={STATUS_ICON_COLORS[item.status]}
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

  const initialIds = useMemo(() => campaigns.map(i => i.id), [campaigns]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-campaign',
        title: 'Nova Campanha',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: campaignsConfig.permissions!.create,
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
        namespace: 'campaigns',
        initialIds,
      }}
    >
      <PageLayout data-testid="campaigns-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Campanhas', href: '/sales/campaigns' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Campanhas"
            description="Gerencie campanhas promocionais e descontos"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            placeholder={campaignsConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
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
              title="Erro ao carregar campanhas"
              message="Ocorreu um erro ao tentar carregar as campanhas. Por favor, tente novamente."
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
                config={campaignsConfig}
                items={campaigns}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={Zap}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Tipo"
                      icon={Megaphone}
                      options={typeOptions}
                      selected={typeFilter}
                      onSelectionChange={setTypeFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'campanha' : 'campanhas'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/campaigns/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as 'name' | 'createdAt' | 'updatedAt');
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          {/* Create Wizard */}
          <CreateCampaignWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
          />

          {/* Delete Confirmation */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir esta campanha. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} campanhas. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
