/**
 * OpenSea OS - HR Teams Page
 * Página de gerenciamento de equipes no contexto HR
 * Usa infinite scroll com useInfiniteQuery + IntersectionObserver
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
  useEntityPage,
  type ContextMenuAction,
} from '@/core';
import { logger } from '@/lib/logger';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { usePermissions } from '@/hooks/use-permissions';
import { teamsService } from '@/services/core/teams.service';
import type { Team } from '@/types/core';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { PiUsersThreeDuotone } from 'react-icons/pi';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CreateModal,
  RenameModal,
  formatMembersCount,
  getStatusBadgeVariant,
  getStatusLabel,
  hrTeamsConfig,
  updateTeam,
} from './src';

export default function HRTeamsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <HRTeamsPageContent />
    </Suspense>
  );
}

function HRTeamsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  // Permissions
  const canView = hasPermission(HR_PERMISSIONS.TEAMS.LIST);
  const canEdit = hasPermission(HR_PERMISSIONS.TEAMS.UPDATE);
  const canCreate = hasPermission(HR_PERMISSIONS.TEAMS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.TEAMS.DELETE);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);

  // Rename modal state
  const [renameTeamData, setRenameTeamData] = useState<Team | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isRenameSubmitting, setIsRenameSubmitting] = useState(false);

  // ============================================================================
  // INFINITE SCROLL DATA FETCHING
  // ============================================================================

  const PAGE_SIZE = 20;

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['hr-teams', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return teamsService.listTeams({
        page: pageParam,
        limit: PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.pages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const allTeams = useMemo(
    () => infiniteData?.pages.flatMap(p => p.data ?? []) ?? [],
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
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => teamsService.deleteTeam(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
      showSuccessToast('Equipe(s) excluída(s) com sucesso');
      setItemsToDelete([]);
    },
    onError: err => {
      logger.error(
        'Erro ao excluir equipe(s)',
        err instanceof Error ? err : undefined
      );
      showErrorToast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
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
    let items = allTeams;

    // Search filter (client-side)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        team =>
          team.name?.toLowerCase().includes(q) ||
          team.slug?.toLowerCase().includes(q) ||
          team.description?.toLowerCase().includes(q) ||
          team.creatorName?.toLowerCase().includes(q)
      );
    }

    // Active filter
    if (activeFilter.length === 1) {
      if (activeFilter[0] === 'true') {
        items = items.filter(team => team.isActive);
      } else if (activeFilter[0] === 'false') {
        items = items.filter(team => !team.isActive);
      }
    }

    return items;
  }, [allTeams, searchQuery, activeFilter]);

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
    if (ids.length === 1) {
      router.push(`/hr/teams/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/hr/teams/${ids[0]}/edit`);
    }
  };

  const handleContextRename = (ids: string[]) => {
    if (ids.length === 0) return;
    const team = allTeams.find(item => item.id === ids[0]);
    if (team) {
      setRenameTeamData(team);
      setIsRenameOpen(true);
    }
  };

  const handleRenameSubmit = async (id: string, data: { name: string }) => {
    setIsRenameSubmitting(true);
    try {
      await updateTeam(id, data);
      showSuccessToast('Equipe renomeada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
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
    setItemsToDelete(ids);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemsToDelete.length > 0) {
      deleteMutation.mutate(itemsToDelete);
    }
    setIsDeleteOpen(false);
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
        separator: 'before',
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
  }, [canEdit, canDelete, allTeams]);

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

  const initialIds = useMemo(
    () => displayedTeams.map(i => i.id),
    [displayedTeams]
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const handleCreate = useCallback(() => {
    setIsCreateOpen(true);
  }, []);

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
              { label: 'RH', href: '/hr' },
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
            value={searchQuery}
            placeholder={hrTeamsConfig.display.labels.searchPlaceholder}
            onSearch={value => setSearchQuery(value)}
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
              title="Erro ao carregar equipes"
              message="Ocorreu um erro ao tentar carregar as equipes. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () =>
                  queryClient.invalidateQueries({ queryKey: ['hr-teams'] }),
              }}
            />
          ) : (
            <EntityGrid
              config={hrTeamsConfig}
              items={displayedTeams}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemClick={(item, e) => {
                // no-op for selection handled by CoreProvider
              }}
              onItemDoubleClick={item => handleDoubleClick(item.id)}
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

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Create Modal */}
          <CreateModal
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['hr-teams'] });
              setIsCreateOpen(false);
            }}
          />

          {/* Rename Modal */}
          <RenameModal
            isOpen={isRenameOpen}
            onClose={() => setIsRenameOpen(false)}
            team={renameTeamData}
            isSubmitting={isRenameSubmitting}
            onSubmit={handleRenameSubmit}
          />

          {/* Delete PIN Confirmation */}
          <VerifyActionPinModal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={`Digite seu PIN de ação para excluir ${itemsToDelete.length} equipe(s). Esta ação não pode ser desfeita.`}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
