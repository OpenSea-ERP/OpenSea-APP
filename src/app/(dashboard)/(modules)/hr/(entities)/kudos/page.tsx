/**
 * HR Kudos / Recognition Feed Page
 *
 * Feed social de reconhecimento estilo Slack/Lattice:
 * - Hero compacto com CTA "Enviar Kudos"
 * - Tabs: Todos | Enviados | Recebidos
 * - Pinned section acima do feed (apenas em "Todos")
 * - Cards verticais com reactions, replies e contextual actions
 * - Infinite scroll via IntersectionObserver
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { KudosCard } from '@/components/hr/kudos-card';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { Button } from '@/components/ui/button';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import {
  useDeleteKudos,
  useKudosFeed,
  usePinKudos,
  useReceivedKudosFeed,
  useSentKudosFeed,
  useToggleKudosReaction,
  useUnpinKudos,
} from '@/hooks/hr/use-kudos';
import { useMyEmployee } from '@/hooks/use-me';
import { usePermissions } from '@/hooks/use-permissions';
import { translateError } from '@/lib/error-messages';
import { portalService } from '@/services/hr';
import type { EmployeeKudos, KudosCategory, SendKudosData } from '@/types/hr';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Handshake,
  Inbox,
  Lightbulb,
  Loader2,
  Pin,
  Plus,
  Send,
  Shield,
  Sparkles,
  Star,
  type LucideIcon,
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

const SendKudosModal = dynamic(
  () =>
    import('./src/modals/send-kudos-modal').then(m => ({
      default: m.SendKudosModal,
    })),
  { ssr: false }
);

// ============================================================================
// CONSTANTS
// ============================================================================

type TabValue = 'feed' | 'sent' | 'received';

interface CategoryMeta {
  id: KudosCategory;
  label: string;
  icon: LucideIcon;
}

const CATEGORY_OPTIONS: CategoryMeta[] = [
  { id: 'TEAMWORK', label: 'Trabalho em Equipe', icon: Handshake },
  { id: 'INNOVATION', label: 'Inovação', icon: Lightbulb },
  { id: 'LEADERSHIP', label: 'Liderança', icon: Shield },
  { id: 'EXCELLENCE', label: 'Excelência', icon: Star },
  { id: 'HELPFULNESS', label: 'Prestatividade', icon: Sparkles },
];

// ============================================================================
// PAGE WRAPPER
// ============================================================================

export default function KudosPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-4" />}
    >
      <KudosPageContent />
    </Suspense>
  );
}

// ============================================================================
// PAGE CONTENT
// ============================================================================

function KudosPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { data: myEmployee } = useMyEmployee();

  const currentEmployeeId = myEmployee?.employee?.id;

  // Permissions
  const canSend = hasPermission(HR_PERMISSIONS.KUDOS.CREATE);
  const canPin = hasPermission(HR_PERMISSIONS.KUDOS.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.KUDOS.DELETE);
  const canAdminReplies = hasPermission(HR_PERMISSIONS.KUDOS.MANAGE);

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteKudos, setPendingDeleteKudos] =
    useState<EmployeeKudos | null>(null);

  // ============================================================================
  // URL-DRIVEN FILTERS
  // ============================================================================

  const activeTab = useMemo<TabValue>(() => {
    const raw = searchParams.get('tab');
    if (raw === 'sent' || raw === 'received') return raw;
    return 'feed';
  }, [searchParams]);

  const categoryFilter = useMemo(() => {
    const raw = searchParams.get('category');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const buildFilterUrl = useCallback(
    (params: { tab?: TabValue; category?: string[] }) => {
      const tab = params.tab ?? activeTab;
      const categories =
        params.category !== undefined ? params.category : categoryFilter;
      const parts: string[] = [];
      if (tab !== 'feed') parts.push(`tab=${tab}`);
      if (categories.length > 0) parts.push(`category=${categories.join(',')}`);
      return parts.length > 0 ? `/hr/kudos?${parts.join('&')}` : '/hr/kudos';
    },
    [activeTab, categoryFilter]
  );

  const setActiveTab = useCallback(
    (tab: TabValue) => {
      router.push(buildFilterUrl({ tab, category: [] }));
      setSearchQuery('');
    },
    [router, buildFilterUrl]
  );

  const setCategoryFilter = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ category: ids }));
    },
    [router, buildFilterUrl]
  );

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  // Pinned section: only on "feed" tab
  const pinnedQuery = useKudosFeed({
    filter: 'pinned',
    enabled: activeTab === 'feed',
  });

  // Regular feed (or sent/received based on tab)
  const regularFeedQuery = useKudosFeed({
    filter: 'regular',
    enabled: activeTab === 'feed',
  });
  const sentQuery = useSentKudosFeed();
  const receivedQuery = useReceivedKudosFeed();

  const activeQuery =
    activeTab === 'sent'
      ? sentQuery
      : activeTab === 'received'
        ? receivedQuery
        : regularFeedQuery;

  const pinnedItems = useMemo(
    () => pinnedQuery.data?.pages.flatMap(p => p.kudos) ?? [],
    [pinnedQuery.data]
  );
  const regularItems = useMemo(
    () => activeQuery.data?.pages.flatMap(p => p.kudos) ?? [],
    [activeQuery.data]
  );

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0].isIntersecting &&
          activeQuery.hasNextPage &&
          !activeQuery.isFetchingNextPage
        ) {
          activeQuery.fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeQuery]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const sendKudosMutation = useMutation({
    mutationFn: (payload: SendKudosData) => portalService.sendKudos(payload),
    onSuccess: () => {
      toast.success('Reconhecimento enviado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr', 'kudos'] });
    },
    onError: (err: unknown) => {
      toast.error(
        translateError(err instanceof Error ? err.message : String(err))
      );
    },
  });

  const toggleReactionMutation = useToggleKudosReaction();
  const pinMutation = usePinKudos();
  const unpinMutation = useUnpinKudos();
  const deleteMutation = useDeleteKudos();

  const handleReact = useCallback(
    (kudosId: string, emoji: string) => {
      toggleReactionMutation.mutate({ kudosId, emoji });
    },
    [toggleReactionMutation]
  );

  const handleTogglePin = useCallback(
    (kudos: EmployeeKudos) => {
      const mutation = kudos.isPinned ? unpinMutation : pinMutation;
      mutation.mutate(kudos.id, {
        onSuccess: () => {
          toast.success(
            kudos.isPinned
              ? 'Reconhecimento desafixado'
              : 'Reconhecimento fixado no topo'
          );
        },
        onError: (err: unknown) => {
          toast.error(
            translateError(err instanceof Error ? err.message : String(err))
          );
        },
      });
    },
    [pinMutation, unpinMutation]
  );

  const handleDeleteRequest = useCallback((kudos: EmployeeKudos) => {
    setPendingDeleteKudos(kudos);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteKudos) return;
    deleteMutation.mutate(pendingDeleteKudos.id, {
      onSuccess: () => {
        toast.success('Reconhecimento excluido');
        setPendingDeleteKudos(null);
      },
      onError: (err: unknown) => {
        toast.error(
          translateError(err instanceof Error ? err.message : String(err))
        );
        setPendingDeleteKudos(null);
      },
    });
  }, [deleteMutation, pendingDeleteKudos]);

  // ============================================================================
  // CLIENT-SIDE FILTERING (search + category)
  // ============================================================================

  const filterItems = useCallback(
    (items: EmployeeKudos[]) => {
      let visible = items;
      if (searchQuery) {
        const needle = searchQuery.toLowerCase();
        visible = visible.filter(
          item =>
            item.message.toLowerCase().includes(needle) ||
            item.fromEmployee?.fullName?.toLowerCase().includes(needle) ||
            item.toEmployee?.fullName?.toLowerCase().includes(needle)
        );
      }
      if (categoryFilter.length > 0) {
        const allowed = new Set(categoryFilter);
        visible = visible.filter(item => allowed.has(item.category));
      }
      return visible;
    },
    [searchQuery, categoryFilter]
  );

  const visiblePinned = useMemo(
    () => filterItems(pinnedItems),
    [pinnedItems, filterItems]
  );
  const visibleRegular = useMemo(
    () => filterItems(regularItems),
    [regularItems, filterItems]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  const tabs: { value: TabValue; label: string; icon: LucideIcon }[] = [
    { value: 'feed', label: 'Todos', icon: Award },
    { value: 'sent', label: 'Enviados', icon: Send },
    { value: 'received', label: 'Recebidos', icon: Inbox },
  ];

  const isFeedLoading = activeQuery.isLoading;
  const feedError = activeQuery.error;
  const totalVisible = visiblePinned.length + visibleRegular.length;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Reconhecimento', href: '/hr/kudos' },
          ]}
        />

        {/* HERO compacto */}
        <div
          data-testid="kudos-page"
          className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-amber-50/40 p-5 dark:border-violet-500/15 dark:from-violet-500/8 dark:via-slate-900/40 dark:to-amber-500/5"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 text-white shadow-sm">
              <Award className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Reconhecimento
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Celebre conquistas, reaja com emojis e mantenha o time motivado.
              </p>
            </div>
            {canSend && (
              <Button
                type="button"
                size="sm"
                onClick={() => setIsSendOpen(true)}
                data-testid="kudos-send-button"
              >
                <Plus className="h-4 w-4" />
                Enviar Kudos
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Tabs */}
        <Tabs value={activeTab} className="w-full" data-testid="kudos-tabs">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-2"
                  data-testid={`kudos-tab-${tab.value}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Search + Filter */}
        <div className="flex items-center gap-3">
          <div className="flex-1" data-testid="kudos-search">
            <SearchBar
              placeholder="Buscar por nome ou mensagem..."
              value={searchQuery}
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>
          <div data-testid="kudos-filter-category">
            <FilterDropdown
              label="Categoria"
              icon={Award}
              options={CATEGORY_OPTIONS.map(({ id, label }) => ({
                id,
                label,
              }))}
              selected={categoryFilter}
              onSelectionChange={setCategoryFilter}
              activeColor="violet"
              searchPlaceholder="Buscar categoria..."
              emptyText="Nenhuma categoria encontrada."
            />
          </div>
        </div>

        {/* Feed */}
        <div className="mt-2 space-y-6" data-testid="kudos-feed">
          {isFeedLoading ? (
            <GridLoading count={6} layout="list" size="md" gap="gap-4" />
          ) : feedError ? (
            <GridError
              type="server"
              title="Erro ao carregar reconhecimentos"
              message="Ocorreu um erro ao tentar carregar o feed. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  activeQuery.refetch();
                },
              }}
            />
          ) : totalVisible === 0 ? (
            <EmptyState
              tab={activeTab}
              canSend={canSend}
              onCreate={() => setIsSendOpen(true)}
            />
          ) : (
            <>
              {/* Pinned section (only on "feed" tab) */}
              {activeTab === 'feed' && visiblePinned.length > 0 && (
                <section
                  data-testid="kudos-pinned-section"
                  className="space-y-3"
                >
                  <header className="flex items-center gap-2">
                    <Pin className="h-4 w-4 text-amber-500" />
                    <h2 className="text-sm font-semibold text-foreground">
                      Destaques
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      ({visiblePinned.length})
                    </span>
                  </header>
                  <div className="space-y-3">
                    {visiblePinned.map(kudos => (
                      <KudosCard
                        key={kudos.id}
                        kudos={kudos}
                        currentEmployeeId={currentEmployeeId}
                        canPin={canPin}
                        canDelete={canDelete}
                        canAdminReplies={canAdminReplies}
                        onReact={handleReact}
                        onTogglePin={handleTogglePin}
                        onDelete={handleDeleteRequest}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Regular feed */}
              {visibleRegular.length > 0 && (
                <section className="space-y-3">
                  {activeTab === 'feed' && visiblePinned.length > 0 && (
                    <header className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-violet-500" />
                      <h2 className="text-sm font-semibold text-foreground">
                        Recentes
                      </h2>
                    </header>
                  )}
                  <div className="space-y-3">
                    {visibleRegular.map(kudos => (
                      <KudosCard
                        key={kudos.id}
                        kudos={kudos}
                        currentEmployeeId={currentEmployeeId}
                        canPin={canPin}
                        canDelete={canDelete}
                        canAdminReplies={canAdminReplies}
                        onReact={handleReact}
                        onTogglePin={handleTogglePin}
                        onDelete={handleDeleteRequest}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="h-1" />
        {activeQuery.isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Send Modal */}
        <SendKudosModal
          isOpen={isSendOpen}
          onClose={() => setIsSendOpen(false)}
          isSubmitting={sendKudosMutation.isPending}
          onSubmit={async payload => {
            await sendKudosMutation.mutateAsync(payload);
          }}
        />

        {/* Delete confirmation (PIN) */}
        <VerifyActionPinModal
          isOpen={!!pendingDeleteKudos}
          onClose={() => setPendingDeleteKudos(null)}
          onSuccess={handleConfirmDelete}
          title="Excluir Reconhecimento"
          description="Digite seu PIN de Acao para excluir este reconhecimento. Essa acao nao pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  tab: TabValue;
  canSend: boolean;
  onCreate: () => void;
}

function EmptyState({ tab, canSend, onCreate }: EmptyStateProps) {
  const titleByTab: Record<TabValue, string> = {
    feed: 'Nenhum reconhecimento por aqui ainda',
    sent: 'Voce ainda nao enviou reconhecimentos',
    received: 'Voce ainda nao recebeu reconhecimentos',
  };
  const descriptionByTab: Record<TabValue, string> = {
    feed: 'Reconheca um colega e seja a faisca dessa cultura.',
    sent: 'Que tal celebrar uma conquista recente de alguem?',
    received:
      'Continue fazendo um otimo trabalho — em breve aparecerao por aqui.',
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white/40 px-6 py-16 text-center dark:bg-slate-900/20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-amber-500/15">
        <Award className="h-8 w-8 text-violet-500" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {titleByTab[tab]}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {descriptionByTab[tab]}
      </p>
      {canSend && tab !== 'received' && (
        <Button
          type="button"
          size="sm"
          className="mt-4"
          onClick={onCreate}
          data-testid="kudos-empty-cta"
        >
          <Plus className="h-4 w-4" />
          Enviar primeiro Kudos
        </Button>
      )}
    </div>
  );
}
