/**
 * OpenSea OS - HR Teams Page
 * Página de gerenciamento de equipes no contexto do módulo de Recursos Humanos
 */

'use client';

import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
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
import { AccessDenied } from '@/components/rbac/access-denied';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
  SelectionToolbar,
  useEntityCrud,
  useEntityPage,
  type ContextMenuAction,
} from '@/core';
import { logger } from '@/lib/logger';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { usePermissions } from '@/hooks/use-permissions';
import type { Team } from '@/types/core';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  CreateModal,
  RenameModal,
  createTeam,
  deleteTeam,
  formatMembersCount,
  getStatusBadgeVariant,
  getStatusLabel,
  getTeam,
  hrTeamsConfig,
  listTeams,
  updateTeam,
} from './src';

export default function HRTeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.TEAMS.LIST);
  const canEdit = hasPermission(HR_PERMISSIONS.TEAMS.UPDATE);
  const canCreate = hasPermission(HR_PERMISSIONS.TEAMS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.TEAMS.DELETE);

  // Rename modal state
  const [renameTeam, setRenameTeam] = useState<Team | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isRenameSubmitting, setIsRenameSubmitting] = useState(false);

  // ============================================================================
  // CRUD SETUP
  // ============================================================================

  const crud = useEntityCrud<Team>({
    entityName: 'Equipe',
    entityNamePlural: 'Equipes',
    queryKey: ['hr-teams'],
    baseUrl: '/v1/teams',
    listFn: listTeams,
    getFn: getTeam,
    createFn: async (data: Record<string, unknown>) => {
      return createTeam(data as Parameters<typeof createTeam>[0]);
    },
    updateFn: async (id, data: Record<string, unknown>) => {
      return updateTeam(id, data);
    },
    deleteFn: deleteTeam,
  });

  // ============================================================================
  // PAGE SETUP
  // ============================================================================

  const page = useEntityPage<Team>({
    entityName: 'Equipe',
    entityNamePlural: 'Equipes',
    queryKey: ['hr-teams'],
    crud,
    viewRoute: id => `/hr/teams/${id}`,
    filterFn: (item, query) => {
      const q = query.toLowerCase();
      return Boolean(
        item.name?.toLowerCase().includes(q) ||
          item.slug?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.creatorName?.toLowerCase().includes(q)
      );
    },
  });

  // ============================================================================
  // FILTERS (URL-based)
  // ============================================================================

  const activeFilter = useMemo(() => {
    const raw = searchParams.get('isActive');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const displayedTeams = useMemo(() => {
    let items = page.filteredItems;

    if (activeFilter.length === 1) {
      if (activeFilter[0] === 'true') {
        items = items.filter(team => team.isActive);
      } else if (activeFilter[0] === 'false') {
        items = items.filter(team => !team.isActive);
      }
    }

    return items;
  }, [page.filteredItems, activeFilter]);

  const buildFilterUrl = useCallback(
    (params: { isActive?: string[] }) => {
      const parts: string[] = [];
      const active =
        params.isActive !== undefined ? params.isActive : activeFilter;

      if (active.length > 0) parts.push(`isActive=${active.join(',')}`);

      return parts.length > 0 ? `/hr/teams?${parts.join('&')}` : '/hr/teams';
    },
    [activeFilter]
  );

  const setActiveFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ isActive: ids })),
    [router, buildFilterUrl]
  );

  const activeFilterOptions = useMemo(
    () => [
      { id: 'true', label: 'Ativas' },
      { id: 'false', label: 'Inativas' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    page.handlers.handleItemsView(ids);
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/hr/teams/${ids[0]}/edit`);
    }
  };

  const handleContextRename = (ids: string[]) => {
    if (ids.length === 0) return;
    const team = page.filteredItems.find(item => item.id === ids[0]);
    if (team) {
      setRenameTeam(team);
      setIsRenameOpen(true);
    }
  };

  const handleRenameSubmit = async (id: string, data: { name: string }) => {
    setIsRenameSubmitting(true);
    try {
      await updateTeam(id, data);
      showSuccessToast('Equipe renomeada com sucesso');
      page.crud.refetch();
    } catch (error) {
      logger.error(
        'Erro ao renomear equipe',
        error instanceof Error ? error : undefined
      );
      showErrorToast({
        title: 'Erro ao renomear equipe',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsRenameSubmitting(false);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    page.modals.setItemsToDelete(ids);
    page.modals.open('delete');
  };

  const handleDoubleClick = (itemId: string) => {
    router.push(`/hr/teams/${itemId}`);
  };

  // ============================================================================
  // CONTEXT MENU ACTIONS
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];

    if (canEdit) {
      actions.push({
        id: 'edit',
        label: 'Editar',
        icon: Pencil,
        onClick: handleContextEdit,
      });
      actions.push({
        id: 'rename',
        label: 'Renomear',
        icon: Pencil,
        onClick: handleContextRename,
      });
    }

    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive',
        separator: 'before',
      });
    }

    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, canDelete, page.filteredItems]);

  // ============================================================================
  // SORT OPTIONS
  // ============================================================================

  const sortOptions = useMemo(
    () => [
      {
        field: 'name' as const,
        direction: 'asc' as const,
        label: 'Nome (A-Z)',
        icon: PiUsersThreeDuotone,
      },
      {
        field: 'name' as const,
        direction: 'desc' as const,
        label: 'Nome (Z-A)',
        icon: PiUsersThreeDuotone,
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

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Team, isSelected: boolean) => {
    const iconStyle = item.color
      ? {
          background: `linear-gradient(to bottom right, ${item.color}, ${item.color}CC)`,
        }
      : undefined;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        actions={contextActions}
        contentClassName="w-56"
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={item.slug}
          icon={PiUsersThreeDuotone}
          iconBgColor={
            !item.color
              ? 'bg-linear-to-br from-blue-500 to-cyan-600'
              : undefined
          }
          iconBgStyle={iconStyle}
          badges={[
            {
              label: getStatusLabel(item.isActive),
              variant: getStatusBadgeVariant(item.isActive),
            },
          ]}
          metadata={
            <div className="space-y-2">
              <div className="flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                  <span className="text-muted-foreground">
                    {formatMembersCount(item.membersCount)}
                  </span>
                </div>
                {item.creatorName && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground/70">
                      Criado por:
                    </span>
                    <span className="truncate text-muted-foreground">
                      {item.creatorName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          onDoubleClick={() => handleDoubleClick(item.id)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: Team, isSelected: boolean) => {
    const iconStyle = item.color
      ? {
          background: `linear-gradient(to bottom right, ${item.color}, ${item.color}CC)`,
        }
      : undefined;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        actions={contextActions}
        contentClassName="w-56"
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          subtitle={item.slug}
          icon={PiUsersThreeDuotone}
          iconBgColor={
            !item.color
              ? 'bg-linear-to-br from-blue-500 to-cyan-600'
              : undefined
          }
          iconBgStyle={iconStyle}
          badges={[
            {
              label: getStatusLabel(item.isActive),
              variant: getStatusBadgeVariant(item.isActive),
            },
          ]}
          metadata={
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {formatMembersCount(item.membersCount)}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          onDoubleClick={() => handleDoubleClick(item.id)}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt ?? undefined}
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
    () => displayedTeams.map(i => i.id),
    [displayedTeams]
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleCreate = useCallback(() => {
    page.modals.open('create');
  }, [page.modals]);

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];

    if (canCreate) {
      buttons.push({
        id: 'create-team',
        title: 'Nova Equipe',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }

    return buttons;
  }, [canCreate, handleCreate]);

  // ============================================================================
  // LOADING / ACCESS CHECK
  // ============================================================================

  if (isLoadingPermissions) {
    return (
      <PageLayout>
        <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
      </PageLayout>
    );
  }

  if (!canView) {
    return (
      <AccessDenied
        title="Acesso Restrito"
        message="Você não tem permissão para visualizar equipes."
      />
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'hr-teams',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Equipes', href: '/hr/teams' },
            ]}
            buttons={actionButtons}
          />

          <Header
            title="Equipes"
            description="Gerencie equipes e seus membros"
          />
        </PageHeader>

        <PageBody>
          {/* Search Bar */}
          <SearchBar
            value={page.searchQuery}
            placeholder={hrTeamsConfig.display.labels.searchPlaceholder}
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
              title="Erro ao carregar equipes"
              message="Ocorreu um erro ao tentar carregar as equipes. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => crud.refetch(),
              }}
            />
          ) : (
            <EntityGrid
              config={hrTeamsConfig}
              items={displayedTeams}
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
              customSortOptions={sortOptions}
              toolbarStart={
                <FilterDropdown
                  label="Status"
                  icon={CheckCircle2}
                  options={activeFilterOptions}
                  selected={activeFilter}
                  onSelectionChange={setActiveFilter}
                  activeColor="blue"
                  searchPlaceholder="Buscar..."
                  emptyText="Nenhuma opção encontrada."
                />
              }
            />
          )}

          {/* Selection Toolbar */}
          {hasSelection && (
            <SelectionToolbar
              selectedIds={selectedIds}
              totalItems={displayedTeams.length}
              onClear={() => page.selection?.actions.clear()}
              onSelectAll={() => page.selection?.actions.selectAll()}
              defaultActions={{
                view: canView,
                edit: canEdit,
                delete: canDelete,
              }}
              handlers={{
                onView: page.handlers.handleItemsView,
                onEdit: (ids: string[]) => {
                  if (ids.length === 1) {
                    router.push(`/hr/teams/${ids[0]}/edit`);
                  }
                },
                onDelete: page.handlers.handleItemsDelete,
              }}
            />
          )}

          {/* Create Modal */}
          <CreateModal
            open={page.modals.isOpen('create')}
            onOpenChange={() => page.modals.close('create')}
            onSuccess={() => {
              page.crud.refetch();
              page.modals.close('create');
            }}
          />

          {/* Rename Modal */}
          <RenameModal
            isOpen={isRenameOpen}
            onClose={() => setIsRenameOpen(false)}
            team={renameTeam}
            isSubmitting={isRenameSubmitting}
            onSubmit={handleRenameSubmit}
          />

          {/* Delete PIN Confirmation */}
          <VerifyActionPinModal
            isOpen={page.modals.isOpen('delete')}
            onClose={() => page.modals.close('delete')}
            onSuccess={() => page.handlers.handleDeleteConfirm()}
            title="Confirmar Exclusão"
            description={`Digite seu PIN de ação para excluir ${page.modals.itemsToDelete.length} equipe(s). Esta ação não pode ser desfeita.`}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
