'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { SearchBar } from '@/components/layout/search-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Button } from '@/components/ui/button';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { OkrTreeNode as OkrTreeNodeView } from '@/components/hr/okr-tree-node';
import {
  buildOkrTree,
  filterOkrTree,
  flattenOkrTree,
} from '@/lib/hr/okr-rollup';
import type { OKRObjective, ObjectiveLevel, ObjectiveStatus } from '@/types/hr';
import {
  BarChart3,
  Building2,
  Calendar,
  ExternalLink,
  ListTree,
  Loader2,
  Pencil,
  Plus,
  Rows3,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  okrsConfig,
  useListObjectives,
  useDeleteObjective,
  getObjectiveLevelLabel,
  getObjectiveLevelColor,
  getObjectiveStatusLabel,
  getObjectiveStatusColor,
  getProgressBarClass,
  getProgressColor,
  formatPeriodLabel,
} from './src';
import { HR_PERMISSIONS } from '../../_shared/constants/hr-permissions';

const CreateOKRModal = dynamic(
  () =>
    import('@/components/hr/create-okr-modal').then(m => ({
      default: m.CreateOKRModal,
    })),
  { ssr: false }
);

// ============================================================================
// FILTER OPTIONS
// ============================================================================

const LEVEL_OPTIONS: { value: ObjectiveLevel; label: string }[] = [
  { value: 'COMPANY', label: 'Empresa' },
  { value: 'DEPARTMENT', label: 'Departamento' },
  { value: 'TEAM', label: 'Equipe' },
  { value: 'INDIVIDUAL', label: 'Individual' },
];

const STATUS_OPTIONS: { value: ObjectiveStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PERIOD_OPTIONS = [
  { value: 'Q1_2026', label: '1T 2026' },
  { value: 'Q2_2026', label: '2T 2026' },
  { value: 'Q3_2026', label: '3T 2026' },
  { value: 'Q4_2026', label: '4T 2026' },
  { value: 'Q1_2027', label: '1T 2027' },
  { value: 'Q2_2027', label: '2T 2027' },
];

type ViewMode = 'tree' | 'list';

// ============================================================================
// PAGE
// ============================================================================

export default function OKRsPage() {
  const router = useRouter();
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canView = hasPermission(HR_PERMISSIONS.OKRS.VIEW);
  const canCreate = hasPermission(HR_PERMISSIONS.OKRS.CREATE);
  const canUpdate = hasPermission(HR_PERMISSIONS.OKRS.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.OKRS.DELETE);

  // ============================================================================
  // VIEW MODE + FILTERS
  // ============================================================================

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<ObjectiveLevel | ''>('');
  const [filterStatus, setFilterStatus] = useState<ObjectiveStatus | ''>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterOwnerId, setFilterOwnerId] = useState<string>('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 50 };
    if (filterLevel) params.level = filterLevel;
    if (filterStatus) params.status = filterStatus;
    if (filterPeriod) params.period = filterPeriod;
    if (filterOwnerId) params.ownerId = filterOwnerId;
    return params;
  }, [filterLevel, filterStatus, filterPeriod, filterOwnerId]);

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useListObjectives(queryParams);
  const deleteObjective = useDeleteObjective();

  const allObjectives = useMemo(
    () => data?.pages.flatMap(p => p.objectives ?? []) ?? [],
    [data]
  );

  const ownerOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const objective of allObjectives) {
      if (objective.owner) {
        seen.set(objective.owner.id, objective.owner.fullName);
      }
    }
    return Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [allObjectives]);

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return allObjectives;
    const term = searchQuery.toLowerCase();
    return allObjectives.filter(objective => {
      const title = (objective.title ?? '').toLowerCase();
      const description = (objective.description ?? '').toLowerCase();
      const ownerName = (objective.owner?.fullName ?? '').toLowerCase();
      return (
        title.includes(term) ||
        description.includes(term) ||
        ownerName.includes(term)
      );
    });
  }, [allObjectives, searchQuery]);

  // Tree must be built from full set so children with non-matching parents
  // still cascade up properly; then we filter the tree post-build.
  const tree = useMemo(
    () => buildOkrTree(allObjectives),
    [allObjectives]
  );

  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return tree;
    const matchedIds = new Set(filteredBySearch.map(o => o.id));
    return filterOkrTree(tree, node => matchedIds.has(node.objective.id));
  }, [tree, filteredBySearch, searchQuery]);

  // Infinite scroll sentinel (somente em list view)
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || viewMode !== 'list') return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, viewMode]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const totalsByHealth = useMemo(() => {
    const flat = flattenOkrTree(tree);
    return flat.reduce(
      (acc, node) => {
        acc[node.health] = (acc[node.health] ?? 0) + 1;
        acc.total += 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [tree]);

  const initialIds = useMemo(
    () => filteredBySearch.map(item => item.id),
    [filteredBySearch]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = useCallback((objectiveId: string) => {
    setDeleteTargetId(objectiveId);
    setShowDeletePin(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTargetId) {
      deleteObjective.mutate(deleteTargetId);
    }
    setShowDeletePin(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteObjective]);

  const handleSelectNode = useCallback(
    (objectiveId: string) => {
      router.push(`/hr/okrs/${objectiveId}`);
    },
    [router]
  );

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(() => {
    const actions: ContextMenuAction[] = [];
    if (canView) {
      actions.push({
        id: 'open',
        label: 'Visualizar',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/okrs/${ids[0]}`);
        },
      });
    }
    if (canUpdate) {
      actions.push({
        id: 'edit',
        label: 'Editar',
        icon: Pencil,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/okrs/${ids[0]}/edit`);
        },
      });
    }
    if (canDelete) {
      actions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        separator: 'before',
        variant: 'destructive',
        onClick: (ids: string[]) => {
          if (ids.length > 0) handleDelete(ids[0]);
        },
      });
    }
    return actions;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, canUpdate, canDelete]);

  // ============================================================================
  // RENDER CARDS (LIST VIEW)
  // ============================================================================

  const renderGridCard = (item: OKRObjective, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={
        canView
          ? (ids: string[]) => {
              if (ids.length > 0) router.push(`/hr/okrs/${ids[0]}`);
            }
          : undefined
      }
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.title}
        subtitle={formatPeriodLabel(item.period)}
        icon={Target}
        iconBgColor="bg-linear-to-br from-violet-500 to-violet-600"
        badges={[
          {
            label: getObjectiveLevelLabel(item.level),
            variant: 'outline',
            color: getObjectiveLevelColor(item.level),
          },
          {
            label: getObjectiveStatusLabel(item.status),
            variant: 'outline',
            color: getObjectiveStatusColor(item.status),
          },
        ]}
        metadata={
          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span>Progresso</span>
                <span className="font-medium">{item.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full transition-all ${getProgressBarClass(item.progress)}`}
                  style={{ width: `${Math.min(100, item.progress)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" />
              <span>{item._count?.keyResults ?? 0} resultado(s)-chave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3" />
              <span>{item.owner?.fullName ?? 'Sem responsável'}</span>
            </div>
          </div>
        }
        isSelected={isSelected}
        showSelection={false}
        clickable
        onClick={() => router.push(`/hr/okrs/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: OKRObjective, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={
        canView
          ? (ids: string[]) => {
              if (ids.length > 0) router.push(`/hr/okrs/${ids[0]}`);
            }
          : undefined
      }
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={item.title}
        subtitle={formatPeriodLabel(item.period)}
        icon={Target}
        iconBgColor="bg-linear-to-br from-violet-500 to-violet-600"
        badges={[
          {
            label: getObjectiveLevelLabel(item.level),
            variant: 'outline',
            color: getObjectiveLevelColor(item.level),
          },
          {
            label: getObjectiveStatusLabel(item.status),
            variant: 'outline',
            color: getObjectiveStatusColor(item.status),
          },
          {
            label: `${item.progress}%`,
            variant: 'outline',
            color: getProgressColor(item.progress),
          },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {item.owner?.fullName ?? 'Sem responsável'}
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {item._count?.keyResults ?? 0} KRs
            </span>
          </div>
        }
        isSelected={isSelected}
        showSelection={false}
        clickable
        onClick={() => router.push(`/hr/okrs/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-objective',
        title: 'Novo Objetivo',
        icon: Plus,
        onClick: () => setShowCreateModal(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

  // ============================================================================
  // LOADING
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
        namespace: 'okrs',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'OKRs', href: '/hr/okrs' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Objetivos e Resultados-Chave"
            description="Gestão de OKRs da organização"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="okrs-page" className="contents" />

          {/* Search + view toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <div data-testid="okrs-search" className="flex-1 min-w-[220px]">
              <SearchBar
                value={searchQuery}
                placeholder="Buscar objetivos, responsáveis..."
                onSearch={value => setSearchQuery(value)}
                onClear={() => setSearchQuery('')}
                showClear={true}
                size="md"
              />
            </div>
            <div
              role="group"
              aria-label="Modo de visualização"
              className="inline-flex rounded-md border border-input bg-background p-0.5"
              data-testid="okrs-view-toggle"
            >
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setViewMode('tree')}
                data-testid="okrs-view-toggle-tree"
                aria-pressed={viewMode === 'tree'}
              >
                <ListTree className="h-4 w-4 mr-1" />
                Árvore
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                className="h-8 px-3"
                onClick={() => setViewMode('list')}
                data-testid="okrs-view-toggle-list"
                aria-pressed={viewMode === 'list'}
              >
                <Rows3 className="h-4 w-4 mr-1" />
                Lista
              </Button>
            </div>
          </div>

          {/* Filtros (acessíveis em ambas as views) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div data-testid="okrs-filter-period">
              <FilterDropdown
                label="Período"
                icon={Calendar}
                options={PERIOD_OPTIONS}
                value={filterPeriod}
                onChange={value => setFilterPeriod(value)}
                activeColor="violet"
              />
            </div>
            <div data-testid="okrs-filter-level">
              <FilterDropdown
                label="Nível"
                icon={Building2}
                options={LEVEL_OPTIONS}
                value={filterLevel}
                onChange={value => setFilterLevel(value as ObjectiveLevel | '')}
                activeColor="violet"
              />
            </div>
            <div data-testid="okrs-filter-status">
              <FilterDropdown
                label="Status"
                icon={Target}
                options={STATUS_OPTIONS}
                value={filterStatus}
                onChange={value =>
                  setFilterStatus(value as ObjectiveStatus | '')
                }
                activeColor="emerald"
              />
            </div>
            {ownerOptions.length > 0 && (
              <div data-testid="okrs-filter-owner">
                <FilterDropdown
                  label="Responsável"
                  icon={Users}
                  options={ownerOptions}
                  value={filterOwnerId}
                  onChange={value => setFilterOwnerId(value)}
                  activeColor="blue"
                />
              </div>
            )}
            {totalsByHealth.total > 0 && (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant="outline"
                  className="border-emerald-500 text-emerald-700 dark:text-emerald-300"
                >
                  No caminho: {totalsByHealth.ON_TRACK ?? 0}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-700 dark:text-amber-300"
                >
                  Em risco: {totalsByHealth.AT_RISK ?? 0}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-rose-500 text-rose-700 dark:text-rose-300"
                >
                  Fora do caminho: {totalsByHealth.OFF_TRACK ?? 0}
                </Badge>
              </div>
            )}
          </div>

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar objetivos"
              message="Ocorreu um erro ao tentar carregar os objetivos. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : viewMode === 'tree' ? (
            <div data-testid="okrs-tree" className="space-y-3">
              {filteredTree.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">
                    Nenhum objetivo encontrado
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crie um OKR de empresa para começar a hierarquia.
                  </p>
                  {canCreate && (
                    <Button
                      size="sm"
                      className="mt-4 h-9 px-2.5"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Novo Objetivo
                    </Button>
                  )}
                </div>
              ) : (
                filteredTree.map(rootNode => (
                  <OkrTreeNodeView
                    key={rootNode.objective.id}
                    node={rootNode}
                    onSelect={handleSelectNode}
                  />
                ))
              )}
            </div>
          ) : (
            <EntityGrid
              config={okrsConfig}
              items={filteredBySearch}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={searchQuery.trim().length > 0}
              onItemDoubleClick={item => {
                if (canView) {
                  router.push(`/hr/okrs/${item.id}`);
                }
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          {viewMode === 'list' && (
            <>
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          <CreateOKRModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            availableObjectives={allObjectives}
          />

          <VerifyActionPinModal
            isOpen={showDeletePin}
            onClose={() => {
              setShowDeletePin(false);
              setDeleteTargetId(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description="Digite seu PIN de ação para excluir este objetivo."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
