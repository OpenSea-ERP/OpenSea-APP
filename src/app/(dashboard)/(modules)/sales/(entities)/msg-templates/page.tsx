/**
 * OpenSea OS - Message Templates Page
 * Página de gerenciamento de modelos de mensagem com infinite scroll e filtros
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
  useMessageTemplatesInfinite,
  useCreateMessageTemplate,
  useDeleteMessageTemplate,
} from '@/hooks/sales/use-message-templates';
import { CreateMessageTemplateWizard } from './src/components/create-msg-template-wizard';
import type { MessageTemplate, MessageChannel } from '@/types/sales';
import { MESSAGE_CHANNEL_LABELS } from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  Mail,
  MessageCircle,
  Plus,
  Send,
  Smartphone,
  Trash2,
  Bell,
} from 'lucide-react';
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

const CHANNEL_ICONS: Record<
  MessageChannel,
  React.ComponentType<{ className?: string }>
> = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
  NOTIFICATION: Bell,
};

const CHANNEL_COLORS: Record<MessageChannel, string> = {
  EMAIL:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  WHATSAPP:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  SMS: 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  NOTIFICATION:
    'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
};

const CHANNEL_GRADIENTS: Record<MessageChannel, string> = {
  EMAIL: 'bg-linear-to-br from-sky-500 to-blue-600',
  WHATSAPP: 'bg-linear-to-br from-emerald-500 to-green-600',
  SMS: 'bg-linear-to-br from-violet-500 to-purple-600',
  NOTIFICATION: 'bg-linear-to-br from-teal-500 to-cyan-600',
};

export default function MessageTemplatesPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <MessageTemplatesPageContent />
    </Suspense>
  );
}

function MessageTemplatesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // FILTER STATE
  // ============================================================================

  const channelFilter = useMemo(() => {
    const raw = searchParams.get('channel');
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
  } = useMessageTemplatesInfinite({
    search: debouncedSearch || undefined,
    channel: channelFilter.length === 1 ? channelFilter[0] : undefined,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateMessageTemplate();
  const deleteMutation = useDeleteMessageTemplate();

  const templates = useMemo(() => {
    return (infiniteData?.pages.flatMap(p => p.messageTemplates) ??
      []) as unknown as MessageTemplate[];
  }, [infiniteData]);

  const total = templates.length;

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
    (params: { channel?: string[] }) => {
      const parts: string[] = [];
      const c = params.channel !== undefined ? params.channel : channelFilter;
      if (c.length > 0) parts.push(`channel=${c.join(',')}`);
      return parts.length > 0
        ? `/sales/msg-templates?${parts.join('&')}`
        : '/sales/msg-templates';
    },
    [channelFilter]
  );

  const setChannelFilterUrl = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ channel: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const channelOptions = useMemo(
    () =>
      Object.entries(MESSAGE_CHANNEL_LABELS).map(([id, label]) => ({
        id,
        label,
      })),
    []
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/msg-templates/${ids[0]}`);
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) router.push(`/sales/msg-templates/${ids[0]}/edit`);
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
        ? 'Modelo excluído com sucesso!'
        : `${itemsToDelete.length} modelos excluídos!`
    );
  }, [itemsToDelete, deleteMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: MessageTemplate, isSelected: boolean) => {
    const channelLabel = MESSAGE_CHANNEL_LABELS[item.channel] || item.channel;
    const ChannelIcon = CHANNEL_ICONS[item.channel] || Send;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN)
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
          subtitle={item.subject || channelLabel}
          icon={ChannelIcon}
          iconBgColor={CHANNEL_GRADIENTS[item.channel]}
          badges={[
            {
              label: channelLabel,
              variant: 'default',
            },
            ...(!item.isActive
              ? [
                  {
                    label: 'Inativo',
                    variant: 'secondary' as const,
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

  const renderListCard = (item: MessageTemplate, isSelected: boolean) => {
    const channelLabel = MESSAGE_CHANNEL_LABELS[item.channel] || item.channel;
    const ChannelIcon = CHANNEL_ICONS[item.channel] || Send;

    const listBadges: {
      label: string;
      variant: 'outline';
      icon?: React.ComponentType<{ className?: string }>;
      color: string;
    }[] = [
      {
        label: channelLabel,
        variant: 'outline',
        icon: ChannelIcon,
        color: CHANNEL_COLORS[item.channel],
      },
      ...(!item.isActive
        ? [
            {
              label: 'Inativo',
              variant: 'outline' as const,
              color:
                'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={handleContextView}
        onEdit={
          hasPermission(SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN)
            ? handleContextEdit
            : undefined
        }
        actions={[
          ...(hasPermission(SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN)
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
              {item.subject && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.subject}
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
          icon={ChannelIcon}
          iconBgColor={CHANNEL_GRADIENTS[item.channel]}
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

  const initialIds = useMemo(() => templates.map(i => i.id), [templates]);

  const handleCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-template',
        title: 'Novo Modelo',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN,
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
        namespace: 'msg-templates',
        initialIds,
      }}
    >
      <PageLayout data-testid="msg-templates-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              {
                label: 'Modelos de Mensagem',
                href: '/sales/msg-templates',
              },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Modelos de Mensagem"
            description="Gerencie templates de mensagem por canal"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            placeholder="Buscar modelos por nome..."
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
              title="Erro ao carregar modelos"
              message="Ocorreu um erro ao tentar carregar os modelos de mensagem. Por favor, tente novamente."
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
                    labels: { singular: 'modelo', plural: 'modelos' },
                    titleField: 'id' as const,
                  },
                  name: 'msg-template',
                  api: { baseUrl: '' },
                  routes: { list: '/sales/msg-templates' },
                  permissions: { view: '', create: '', delete: '' },
                }}
                items={templates}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Canal"
                      icon={Send}
                      options={channelOptions}
                      selected={channelFilter}
                      onSelectionChange={setChannelFilterUrl}
                      activeColor="blue"
                      searchPlaceholder="Buscar canal..."
                      emptyText="Nenhum canal encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'modelo' : 'modelos'}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/sales/msg-templates/${item.id}`)
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

          <CreateMessageTemplateWizard
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSubmit={async data => {
              await createMutation.mutateAsync(
                data as unknown as Record<string, unknown>
              );
              toast.success('Modelo criado com sucesso!');
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
                ? 'Digite seu PIN de ação para excluir este modelo. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de ação para excluir ${itemsToDelete.length} modelos. Esta ação não pode ser desfeita.`
            }
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
