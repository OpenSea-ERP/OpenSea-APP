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
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { usePermissions } from '@/hooks/use-permissions';
import type { OKRObjective, ObjectiveLevel, ObjectiveStatus } from '@/types/hr';
import {
  BarChart3,
  Building2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
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
  getObjectiveStatusLabel,
  getObjectiveLevelColor,
  getObjectiveStatusColor,
  getProgressBarClass,
  getProgressColor,
  formatPeriodLabel,
  formatDate,
} from './src';
import { HR_PERMISSIONS } from '../../_shared/constants/hr-permissions';

const CreateObjectiveModal = dynamic(
  () =>
    import('./src/modals/create-objective-modal').then(m => ({
      default: m.CreateObjectiveModal,
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
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<ObjectiveLevel | ''>('');
  const [filterStatus, setFilterStatus] = useState<ObjectiveStatus | ''>('');

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = { perPage: 20 };
    if (filterLevel) params.level = filterLevel;
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [filterLevel, filterStatus]);

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

  const allObjectives = data?.pages.flatMap(p => p.objectives ?? []) ?? [];

  const objectives = useMemo(() => {
    if (!searchQuery.trim()) return allObjectives;
    const q = searchQuery.toLowerCase();
    return allObjectives.filter(o => {
      const title = (o.title ?? '').toLowerCase();
      const description = (o.description ?? '').toLowerCase();
      return title.includes(q) || description.includes(q);
    });
  }, [allObjectives, searchQuery]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // STATE
  // ============================================================================

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeletePin, setShowDeletePin] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const initialIds = useMemo(() => objectives.map(i => i.id), [objectives]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = useCallback((id: string) => {
    setDeleteTargetId(id);
    setShowDeletePin(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTargetId) {
      deleteObjective.mutate(deleteTargetId);
    }
    setShowDeletePin(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, deleteObjective]);

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
  // RENDER CARDS
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
            {/* Progress bar */}
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
          <div data-testid="okrs-search">
            <SearchBar
              value={searchQuery}
              placeholder="Buscar objetivos..."
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
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
          ) : (
            <EntityGrid
              config={okrsConfig}
              items={objectives}
              toolbarStart={
                <>
                  <div data-testid="okrs-filter-level">
                    <FilterDropdown
                      label="Nível"
                      icon={Building2}
                      options={LEVEL_OPTIONS}
                      value={filterLevel}
                      onChange={v => setFilterLevel(v as ObjectiveLevel | '')}
                      activeColor="violet"
                    />
                  </div>
                  <div data-testid="okrs-filter-status">
                    <FilterDropdown
                      label="Status"
                      icon={Target}
                      options={STATUS_OPTIONS}
                      value={filterStatus}
                      onChange={v => setFilterStatus(v as ObjectiveStatus | '')}
                      activeColor="emerald"
                    />
                  </div>
                </>
              }
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

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          <CreateObjectiveModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
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
