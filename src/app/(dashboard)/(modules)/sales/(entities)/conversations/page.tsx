/**
 * OpenSea OS - Conversations Page
 * Página de gerenciamento de conversas com infinite scroll e filtros
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
  useConversationsInfinite,
  useCreateConversation,
  useDeleteConversation,
} from '@/hooks/sales/use-conversations';
import { CreateConversationWizard } from './src/components/create-conversation-wizard';
import type { Conversation, ConversationStatus } from '@/types/sales';
import { CONVERSATION_STATUS_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { MessageSquare, Plus, Trash2, User } from 'lucide-react';
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

export default function ConversationsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <ConversationsPageContent />
    </Suspense>
  );
}

function ConversationsPageContent() {
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
  } = useConversationsInfinite({
    search: debouncedSearch || undefined,
    status: statusFilter.length === 1 ? statusFilter[0] : undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateConversation();
  const deleteMutation = useDeleteConversation();

  const conversations = useMemo(() => {
    return (infiniteData?.pages.flatMap(p => p.conversations) ??
      []) as unknown as Conversation[];
  }, [infiniteData]);

  const total = conversations.length;

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
        ? `/sales/conversations?${parts.join('&')}`
        : '/sales/conversations';
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
      Object.entries(CONVERSATION_STATUS_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/conversations/${ids[0]}`);
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
        ? 'Conversa excluída com sucesso!'
        : `${itemsToDelete.length} conversas excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // STATUS COLOR HELPER
  // ============================================================================

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'OPEN':
        return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
      case 'CLOSED':
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
      case 'ARCHIVED':
        return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
      default:
        return 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400';
    }
  };

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: Conversation, isSelected: boolean) => {
    const statusLabel = CONVERSATION_STATUS_LABELS[item.status] || item.status;
    const lastMsg = item.messages?.[item.messages.length - 1];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        actions={[
          ...(hasPermission(SALES_PERMISSIONS.CONVERSATIONS.ADMIN)
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
          title={item.subject}
          subtitle={item.customerName || 'Cliente não identificado'}
          icon={MessageSquare}
          iconBgColor="bg-linear-to-br from-sky-500 to-blue-600"
          badges={[
            {
              label: statusLabel,
              variant: 'default',
            },
          ]}
          footer={
            lastMsg
              ? {
                  type: 'single' as const,
                  button: {
                    icon: MessageSquare,
                    label:
                      lastMsg.content.length > 50
                        ? `${lastMsg.content.substring(0, 50)}...`
                        : lastMsg.content,
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

  const renderListCard = (item: Conversation, isSelected: boolean) => {
    const statusLabel = CONVERSATION_STATUS_LABELS[item.status] || item.status;
    const lastMsg = item.messages?.[item.messages.length - 1];

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: typeof MessageSquare;
      color: string;
    }[] = [
      {
        label: statusLabel,
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      ...(item.customerName
        ? [
            {
              label: item.customerName,
              variant: 'outline' as const,
              icon: User as typeof MessageSquare,
              color:
                'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        actions={[
          ...(hasPermission(SALES_PERMISSIONS.CONVERSATIONS.ADMIN)
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
                {item.subject}
              </span>
              {lastMsg && (
                <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[200px]">
                  {lastMsg.content.length > 40
                    ? `${lastMsg.content.substring(0, 40)}...`
                    : lastMsg.content}
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
          icon={MessageSquare}
          iconBgColor="bg-linear-to-br from-sky-500 to-blue-600"
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

  const initialIds = useMemo(
    () => conversations.map(i => i.id),
    [conversations]
  );

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-conversation',
        title: 'Nova Conversa',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: SALES_PERMISSIONS.CONVERSATIONS.ACCESS,
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
        namespace: 'conversations',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Conversas', href: '/sales/conversations' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Conversas"
            description="Gerencie conversas com clientes"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder="Buscar conversas por assunto ou cliente..."
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
              title="Erro ao carregar conversas"
              message="Ocorreu um erro ao tentar carregar as conversas. Por favor, tente novamente."
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
                    labels: { singular: 'conversa', plural: 'conversas' },
                    titleField: 'id' as const,
                  },
                  name: 'conversation',
                  api: { baseUrl: '' },
                  routes: { list: '/sales/conversations' },
                  permissions: { view: '', create: '', delete: '' },
                }}
                items={conversations}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={MessageSquare}
                      options={statusOptions}
                      selected={statusFilter}
                      onSelectionChange={setStatusFilterUrl}
                      activeColor="blue"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'conversa' : 'conversas'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/conversations/${item.id}`)
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

          <CreateConversationWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Conversa criada com sucesso!');
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
                ? 'Digite seu PIN de ação para excluir esta conversa. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} conversas. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
