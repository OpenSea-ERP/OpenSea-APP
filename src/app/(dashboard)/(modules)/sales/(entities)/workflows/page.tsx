/**
 * OpenSea OS - Workflows Page
 * Página de gerenciamento de workflows com infinite scroll e filtros server-side
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
import { workflowsConfig } from '@/config/entities/workflows.config';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useWorkflowsInfinite,
  useCreateWorkflow,
  useDeleteWorkflow,
} from '@/hooks/sales/use-workflows';
import { CreateWorkflowWizard } from './src/components/create-workflow-wizard';
import type { Workflow } from '@/types/sales';
import { WORKFLOW_TRIGGER_LABELS } from '@/types/sales';
import { GitBranch, Plus, Trash2, Zap, ZapOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
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

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

export default function WorkflowsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <WorkflowsPageContent />
    </Suspense>
  );
}

function WorkflowsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const triggerFilter = useMemo(() => {
    const raw = searchParams.get('trigger');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

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
    data: infiniteData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWorkflowsInfinite({
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateWorkflow();
  const deleteMutation = useDeleteWorkflow();

  const allWorkflows = useMemo(() => {
    return (infiniteData?.pages.flatMap(p => p.workflows) ??
      []) as unknown as Workflow[];
  }, [infiniteData]);

  // Client-side filtering
  const workflows = useMemo(() => {
    let list = allWorkflows;

    if (triggerFilter.length > 0) {
      list = list.filter(w => triggerFilter.includes(w.trigger));
    }

    if (statusFilter.length > 0) {
      list = list.filter(w => {
        if (statusFilter.includes('active') && w.isActive) return true;
        if (statusFilter.includes('inactive') && !w.isActive) return true;
        return false;
      });
    }

    return list;
  }, [allWorkflows, triggerFilter, statusFilter]);

  const total = workflows.length;

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
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { trigger?: string[]; status?: string[] }) => {
      const parts: string[] = [];
      const t = params.trigger !== undefined ? params.trigger : triggerFilter;
      const s = params.status !== undefined ? params.status : statusFilter;
      if (t.length > 0) parts.push(`trigger=${t.join(',')}`);
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      return parts.length > 0
        ? `/sales/workflows?${parts.join('&')}`
        : '/sales/workflows';
    },
    [triggerFilter, statusFilter]
  );

  const setTriggerFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ trigger: ids })),
    [router, buildFilterUrl]
  );

  const setStatusFilterUrl = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const triggerOptions = useMemo(
    () =>
      Object.entries(WORKFLOW_TRIGGER_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  const statusOptions = useMemo(
    () => [
      { id: 'active', label: 'Ativo' },
      { id: 'inactive', label: 'Inativo' },
    ],
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/workflows/${ids[0]}`);
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/workflows/${ids[0]}/edit`);
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
        ? 'Workflow excluído com sucesso!'
        : `${itemsToDelete.length} workflows excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Workflow, isSelected: boolean) => {
    const triggerLabel = WORKFLOW_TRIGGER_LABELS[item.trigger] || item.trigger;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          workflowsConfig.permissions.update &&
          hasPermission(workflowsConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(workflowsConfig.permissions.delete)
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
          subtitle={triggerLabel}
          icon={GitBranch}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
          badges={[
            {
              label: item.isActive ? 'Ativo' : 'Inativo',
              variant: item.isActive ? 'default' : 'secondary',
            },
            {
              label: triggerLabel,
              variant: 'default',
            },
          ]}
          footer={
            item.executionCount > 0
              ? {
                  type: 'single' as const,
                  button: {
                    icon: Zap,
                    label: `${item.executionCount} execução(ões)`,
                    onClick: () => {},
                    color: 'secondary' as const,
                  },
                }
              : undefined
          }
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

  const renderListCard = (item: Workflow, isSelected: boolean) => {
    const triggerLabel = WORKFLOW_TRIGGER_LABELS[item.trigger] || item.trigger;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof Zap;
      color: string;
    }[] = [
      {
        label: item.isActive ? 'Ativo' : 'Inativo',
        variant: 'outline',
        icon: item.isActive ? Zap : ZapOff,
        color: item.isActive
          ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
          : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
      },
      {
        label: triggerLabel,
        variant: 'outline',
        color:
          'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
      },
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          workflowsConfig.permissions.update &&
          hasPermission(workflowsConfig.permissions.update)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(workflowsConfig.permissions.delete)
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
              {item.executionCount > 0 && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.executionCount} execução(ões)
                </span>
              )}
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
          icon={GitBranch}
          iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
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

  const initialIds = useMemo(() => workflows.map(i => i.id), [workflows]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-workflow',
        title: 'Novo Workflow',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: workflowsConfig.permissions.create,
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
        namespace: 'workflows',
        initialIds,
      }}
    >
      <PageLayout data-testid="workflows-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Workflows', href: '/sales/workflows' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Workflows"
            description="Gerencie automações e fluxos de trabalho"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder={workflowsConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar workflows"
              message="Ocorreu um erro ao tentar carregar os workflows. Por favor, tente novamente."
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
                config={workflowsConfig}
                items={workflows}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Gatilho"
                      icon={Zap}
                      options={triggerOptions}
                      selected={triggerFilter}
                      onSelectionChange={setTriggerFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar gatilho..."
                      emptyText="Nenhum gatilho encontrado."
                    />
                    <FilterDropdown
                      label="Status"
                      icon={GitBranch}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilterUrl}
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'workflow' : 'workflows'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/workflows/${item.id}`)
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

              <div ref={sentinelRef} className="h-1" />
            </>
          )}

          <CreateWorkflowWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Workflow criado com sucesso!');
            }}
            isSubmitting={createMutation.isPending}
          />

          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de ação para excluir este workflow. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} workflows. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
