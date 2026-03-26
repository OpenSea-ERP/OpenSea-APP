/**
 * OpenSea OS - Forms Page
 * Página de gerenciamento de formulários com infinite scroll e filtros
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
} from '@/core';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useFormsInfinite,
  useCreateForm,
  useDeleteForm,
} from '@/hooks/sales/use-forms';
import { CreateFormWizard } from './src/components/create-form-wizard';
import type { Form, FormStatus } from '@/types/sales';
import { FORM_STATUS_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { ClipboardList, FileText, Plus, Trash2 } from 'lucide-react';
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

export default function FormsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <FormsPageContent />
    </Suspense>
  );
}

function FormsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

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
  } = useFormsInfinite({
    search: debouncedSearch || undefined,
    status: statusFilter.length === 1 ? statusFilter[0] : undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateForm();
  const deleteMutation = useDeleteForm();

  const forms = useMemo(() => {
    return (infiniteData?.pages.flatMap(p => p.forms) ??
      []) as unknown as Form[];
  }, [infiniteData]);

  const total = forms.length;

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
    (params: { status?: string[] }) => {
      const parts: string[] = [];
      const s = params.status !== undefined ? params.status : statusFilter;
      if (s.length > 0) parts.push(`status=${s.join(',')}`);
      return parts.length > 0
        ? `/sales/forms?${parts.join('&')}`
        : '/sales/forms';
    },
    [statusFilter]
  );

  const setStatusFilterUrl = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const statusOptions = useMemo(
    () =>
      Object.entries(FORM_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // STATUS COLOR HELPER
  // ============================================================================

  const getStatusColor = (status: FormStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
      case 'PUBLISHED':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      case 'ARCHIVED':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      default:
        return '';
    }
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/forms/${ids[0]}`);
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/forms/${ids[0]}/edit`);
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
        ? 'Formulário excluído com sucesso!'
        : `${itemsToDelete.length} formulários excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Form, isSelected: boolean) => {
    const statusLabel = FORM_STATUS_LABELS[item.status] || item.status;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(SALES_PERMISSIONS.FORMS.ADMIN)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(SALES_PERMISSIONS.FORMS.ADMIN)
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
          title={item.title}
          subtitle={item.description || 'Sem descrição'}
          icon={FileText}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
          ]}
          footer={
            item.submissionCount > 0
              ? {
                  type: 'single' as const,
                  button: {
                    icon: ClipboardList,
                    label: `${item.submissionCount} envio(s)`,
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

  const renderListCard = (item: Form, isSelected: boolean) => {
    const statusLabel = FORM_STATUS_LABELS[item.status] || item.status;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof FileText;
      color: string;
    }[] = [
      {
        label: statusLabel,
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      ...(item.submissionCount > 0
        ? [
            {
              label: `${item.submissionCount} envio(s)`,
              variant: 'outline' as const,
              icon: ClipboardList as typeof FileText,
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
          hasPermission(SALES_PERMISSIONS.FORMS.ADMIN)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(SALES_PERMISSIONS.FORMS.ADMIN)
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
                {item.title}
              </span>
              {item.description && (
                <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[200px]">
                  {item.description}
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
          icon={FileText}
          iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
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

  const initialIds = useMemo(() => forms.map(i => i.id), [forms]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-form',
        title: 'Novo Formulário',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: SALES_PERMISSIONS.FORMS.ADMIN,
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
        namespace: 'forms',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Formulários', href: '/sales/forms' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Formulários"
            description="Gerencie formulários de captura de dados"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder="Buscar formulários por título..."
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
              title="Erro ao carregar formulários"
              message="Ocorreu um erro ao tentar carregar os formulários. Por favor, tente novamente."
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
                config={{
                  display: {
                    labels: { singular: 'formulário', plural: 'formulários' },
                    titleField: 'id' as const,
                  },
                  name: 'form',
                  api: { baseUrl: '' },
                  routes: { list: '/sales/forms' },
                  permissions: { view: '', create: '', delete: '' },
                }}
                items={forms}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={FileText}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilterUrl}
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'formulário' : 'formulários'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/forms/${item.id}`)
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

          <CreateFormWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Formulário criado com sucesso!');
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
                ? 'Digite seu PIN de ação para excluir este formulário. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} formulários. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
