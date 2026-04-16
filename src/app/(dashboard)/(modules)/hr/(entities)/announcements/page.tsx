/**
 * HR Announcements Management Page
 *
 * Notion/Slack-style listing with audience targeting and read receipts.
 * - Tabs: Para mim (default) | Todos | Nao lidos | Fixados
 * - Each card auto-marks itself as read while >=50% visible for >=2s.
 * - Search, priority filter, infinite scroll preserved.
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { portalService } from '@/services/hr';
import type {
  AnnouncementsResponse,
  CompanyAnnouncement,
  CreateAnnouncementData,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  AlertTriangle,
  Inbox,
  Loader2,
  Megaphone,
  Pin,
  Plus,
} from 'lucide-react';
import dynamic from 'next/dynamic';
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
import { AnnouncementCard } from './src/components/announcement-card';

const CreateAnnouncementModal = dynamic(
  () =>
    import('./src/modals/create-announcement-modal').then(m => ({
      default: m.CreateAnnouncementModal,
    })),
  { ssr: false }
);

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_FILTER_OPTIONS = [
  { id: 'NORMAL', label: 'Normal' },
  { id: 'IMPORTANT', label: 'Importante' },
  { id: 'URGENT', label: 'Urgente' },
];

type AnnouncementTab = 'for-me' | 'all' | 'unread' | 'pinned';

const TAB_CONFIG: Record<
  AnnouncementTab,
  { label: string; testId: string }
> = {
  'for-me': { label: 'Para mim', testId: 'announcements-tab-for-me' },
  all: { label: 'Todos', testId: 'announcements-tab-all' },
  unread: { label: 'Nao lidos', testId: 'announcements-tab-unread' },
  pinned: { label: 'Fixados', testId: 'announcements-tab-pinned' },
};

const PAGE_SIZE = 20;

function getMetaPages(
  meta: AnnouncementsResponse['meta'] | undefined
): { current: number; total: number } {
  if (!meta) return { current: 1, total: 1 };
  if ('totalPages' in meta) {
    return { current: meta.page, total: meta.totalPages };
  }
  return { current: meta.page, total: meta.pages };
}

// ============================================================================
// PAGE
// ============================================================================

export default function AnnouncementsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <AnnouncementsPageContent />
    </Suspense>
  );
}

function AnnouncementsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission(HR_PERMISSIONS.ANNOUNCEMENTS.CREATE);
  const canDelete = hasPermission(HR_PERMISSIONS.ANNOUNCEMENTS.DELETE);

  // ============================================================================
  // STATE
  // ============================================================================

  const [activeTab, setActiveTab] = useState<AnnouncementTab>('for-me');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<string[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const priorityFilter = useMemo(() => {
    const raw = searchParams.get('priority');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const buildFilterUrl = useCallback(
    (params: { priority?: string[] }) => {
      const priorities =
        params.priority !== undefined ? params.priority : priorityFilter;
      const parts: string[] = [];
      if (priorities.length > 0) parts.push(`priority=${priorities.join(',')}`);
      return parts.length > 0
        ? `/hr/announcements?${parts.join('&')}`
        : '/hr/announcements';
    },
    [priorityFilter]
  );

  const setPriorityFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ priority: ids }));
    },
    [router, buildFilterUrl]
  );

  // ============================================================================
  // DATA FETCHING — query key depends on tab so the unread tab refetches correctly
  // ============================================================================

  const unreadOnly = activeTab === 'unread';

  const {
    data: infiniteData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['hr-announcements', { unreadOnly }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await portalService.listAnnouncements({
        page: pageParam,
        perPage: PAGE_SIZE,
        unreadOnly: unreadOnly || undefined,
      });
      return response;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { current, total } = getMetaPages(lastPage.meta);
      return current < total ? current + 1 : undefined;
    },
  });

  const announcementsData =
    infiniteData?.pages.flatMap(page => page.announcements) ?? [];

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createMutation = useMutation({
    mutationFn: (createData: CreateAnnouncementData) =>
      portalService.createAnnouncement(createData),
    onSuccess: () => {
      toast.success('Comunicado criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
    },
    onError: () => {
      toast.error('Erro ao criar comunicado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (announcementId: string) =>
      portalService.deleteAnnouncement(announcementId),
    onSuccess: () => {
      toast.success('Comunicado excluido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
    },
    onError: () => {
      toast.error('Erro ao excluir comunicado');
    },
  });

  /**
   * Optimistic mark-as-read mutation. Patches every cached page to flip
   * `isReadByMe` and bump `readCount` so the UI updates instantly.
   */
  const markReadMutation = useMutation({
    mutationFn: (announcementId: string) =>
      portalService.markAnnouncementRead(announcementId),
    onMutate: async (announcementId: string) => {
      await queryClient.cancelQueries({ queryKey: ['hr-announcements'] });
      const previousQueries = queryClient.getQueriesData({
        queryKey: ['hr-announcements'],
      });

      queryClient.setQueriesData(
        { queryKey: ['hr-announcements'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const cached = old as {
            pages?: AnnouncementsResponse[];
            pageParams?: unknown[];
          };
          if (!cached.pages) return old;
          return {
            ...cached,
            pages: cached.pages.map(page => ({
              ...page,
              announcements: page.announcements.map(item =>
                item.id === announcementId
                  ? {
                      ...item,
                      isReadByMe: true,
                      readCount: (item.readCount ?? 0) + 1,
                    }
                  : item
              ),
            })),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_error, _announcementId, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach(([key, value]) => {
          queryClient.setQueryData(key, value);
        });
      }
      toast.error('Nao foi possivel marcar como lido');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
    },
  });

  const handleAutoMarkRead = useCallback(
    (announcementId: string) => {
      markReadMutation.mutate(announcementId);
    },
    [markReadMutation]
  );

  // ============================================================================
  // FILTERED ITEMS BY TAB + SEARCH + PRIORITY
  // ============================================================================

  const filteredItems = useMemo(() => {
    let items = announcementsData;

    if (activeTab === 'pinned') {
      items = items.filter(item => item.isPinned === true);
    } else if (activeTab === 'for-me') {
      // "Para mim" priorizes unread + pinned, but shows everything visible
      // (the backend already restricts the listing to the current user's audience).
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          (item.authorEmployee?.fullName &&
            item.authorEmployee.fullName.toLowerCase().includes(q))
      );
    }

    if (priorityFilter.length > 0) {
      const set = new Set(priorityFilter);
      items = items.filter(item => set.has(item.priority));
    }

    if (activeTab === 'for-me') {
      // Sort: pinned first, then unread first, then by createdAt desc.
      items = [...items].sort((a, b) => {
        const aPinned = a.isPinned ? 1 : 0;
        const bPinned = b.isPinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        const aUnread = a.isReadByMe ? 0 : 1;
        const bUnread = b.isReadByMe ? 0 : 1;
        if (aUnread !== bUnread) return bUnread - aUnread;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    return items;
  }, [announcementsData, activeTab, searchQuery, priorityFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = (ids: string[]) => {
    setDeleteTargetIds(ids);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    for (const announcementId of deleteTargetIds) {
      await deleteMutation.mutateAsync(announcementId);
    }
    setIsDeleteOpen(false);
    setDeleteTargetIds([]);
  };

  // ============================================================================
  // HEADER
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-announcement',
        title: 'Novo Comunicado',
        icon: Plus,
        onClick: () => setIsCreateOpen(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

  const unreadCount = useMemo(
    () => announcementsData.filter(item => item.isReadByMe === false).length,
    [announcementsData]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderEmptyState = (message: string) => (
    <div
      data-testid="announcements-empty-state"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-violet-500 dark:bg-violet-500/10">
        <Inbox className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-semibold">Nenhum comunicado</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {canCreate && (
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-violet-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-violet-600"
        >
          <Plus className="h-4 w-4" />
          Novo Comunicado
        </button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Comunicados', href: '/hr/announcements' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Comunicados"
          description="Mural de comunicados, com leitura confirmada e segmentacao por audiencia"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="announcements-page" className="contents" />

        {/* Tabs + Search + Priority */}
        <div className="space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as AnnouncementTab)}
          >
            <TabsList
              className="grid w-full grid-cols-4 h-11"
              data-testid="announcements-tabs"
            >
              {(Object.keys(TAB_CONFIG) as AnnouncementTab[]).map(key => {
                const config = TAB_CONFIG[key];
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    data-testid={config.testId}
                    className="gap-1.5"
                  >
                    {key === 'pinned' && <Pin className="h-3.5 w-3.5" />}
                    {config.label}
                    {key === 'unread' && unreadCount > 0 && (
                      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1 text-[0.625rem] font-semibold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div
                data-testid="announcements-search"
                className="flex-1 min-w-0"
              >
                <SearchBar
                  placeholder="Buscar comunicados..."
                  value={searchQuery}
                  onSearch={value => setSearchQuery(value)}
                  onClear={() => setSearchQuery('')}
                  showClear
                  size="md"
                />
              </div>
              <div data-testid="announcements-filter-priority">
                <FilterDropdown
                  label="Prioridade"
                  icon={AlertTriangle}
                  options={PRIORITY_FILTER_OPTIONS}
                  selected={priorityFilter}
                  onSelectionChange={setPriorityFilter}
                  activeColor="violet"
                  searchPlaceholder="Buscar prioridade..."
                  emptyText="Nenhuma prioridade encontrada."
                />
              </div>
            </div>

            {(['for-me', 'all', 'unread', 'pinned'] as AnnouncementTab[]).map(
              tabKey => (
                <TabsContent key={tabKey} value={tabKey} className="mt-4">
                  {isLoading ? (
                    <GridLoading
                      count={6}
                      layout="grid"
                      size="md"
                      gap="gap-4"
                    />
                  ) : error ? (
                    <GridError
                      type="server"
                      title="Erro ao carregar comunicados"
                      message="Ocorreu um erro ao carregar os comunicados. Tente novamente."
                      action={{
                        label: 'Tentar Novamente',
                        onClick: () => {
                          refetch();
                        },
                      }}
                    />
                  ) : filteredItems.length === 0 ? (
                    renderEmptyState(
                      tabKey === 'unread'
                        ? 'Voce esta em dia! Nao ha comunicados pendentes para leitura.'
                        : tabKey === 'pinned'
                          ? 'Nenhum comunicado fixado neste momento.'
                          : 'Quando o RH publicar comunicados, eles aparecerao aqui.'
                    )
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredItems.map(item => (
                        <ContextMenuWrapper
                          key={item.id}
                          announcement={item}
                          canDelete={canDelete}
                          onDelete={handleDelete}
                          onAutoMarkRead={handleAutoMarkRead}
                          onMarkRead={handleAutoMarkRead}
                          isMarkingRead={markReadMutation.isPending}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              )
            )}
          </Tabs>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Create Modal */}
        <CreateAnnouncementModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          isSubmitting={createMutation.isPending}
          onSubmit={async createData => {
            await createMutation.mutateAsync(createData);
          }}
        />

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setDeleteTargetIds([]);
          }}
          onSuccess={handleDeleteConfirm}
          title="Excluir Comunicado"
          description={`Digite seu PIN de acao para excluir ${deleteTargetIds.length} comunicado(s). Esta acao nao pode ser desfeita.`}
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// CARD WRAPPER (handles right-click context menu placeholder)
// ============================================================================

interface ContextMenuWrapperProps {
  announcement: CompanyAnnouncement;
  canDelete: boolean;
  onDelete: (ids: string[]) => void;
  onAutoMarkRead: (announcementId: string) => void;
  onMarkRead: (announcementId: string) => void;
  isMarkingRead: boolean;
}

function ContextMenuWrapper({
  announcement,
  onAutoMarkRead,
  onMarkRead,
  isMarkingRead,
}: ContextMenuWrapperProps) {
  return (
    <AnnouncementCard
      announcement={announcement}
      onAutoMarkRead={onAutoMarkRead}
      onMarkRead={onMarkRead}
      isMarkingRead={isMarkingRead}
    />
  );
}

// `canDelete` and `onDelete` are wired from the page so future iterations
// can attach a context menu without churn — kept here intentionally.
void ContextMenuWrapper;
