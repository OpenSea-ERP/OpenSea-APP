/**
 * HR Kudos / Recognition Feed Page
 * Feed de reconhecimento entre colaboradores
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { portalService } from '@/services/hr';
import type {
  EmployeeKudos,
  KudosCategory,
  KudosListResponse,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Handshake,
  Inbox,
  Lightbulb,
  Loader2,
  Plus,
  Send,
  Shield,
  Sparkles,
  Star,
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

const CATEGORY_CONFIG: Record<
  KudosCategory,
  {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    gradient: string;
  }
> = {
  TEAMWORK: {
    label: 'Trabalho em Equipe',
    icon: Handshake,
    badgeClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
  },
  INNOVATION: {
    label: 'Inovação',
    icon: Lightbulb,
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
  },
  LEADERSHIP: {
    label: 'Liderança',
    icon: Shield,
    badgeClass:
      'bg-purple-50 text-purple-700 dark:bg-purple-500/8 dark:text-purple-300',
    gradient: 'from-purple-500 to-purple-600',
  },
  EXCELLENCE: {
    label: 'Excelência',
    icon: Star,
    badgeClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  HELPFULNESS: {
    label: 'Prestatividade',
    icon: Sparkles,
    badgeClass:
      'bg-pink-50 text-pink-700 dark:bg-pink-500/8 dark:text-pink-300',
    gradient: 'from-pink-500 to-pink-600',
  },
};

const CATEGORY_FILTER_OPTIONS = [
  { id: 'TEAMWORK', label: 'Trabalho em Equipe' },
  { id: 'INNOVATION', label: 'Inovação' },
  { id: 'LEADERSHIP', label: 'Liderança' },
  { id: 'EXCELLENCE', label: 'Excelência' },
  { id: 'HELPFULNESS', label: 'Prestatividade' },
];

const TAB_QUERY_KEYS: Record<TabValue, string> = {
  feed: 'hr-kudos-feed',
  sent: 'hr-kudos-sent',
  received: 'hr-kudos-received',
};

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

  // Everyone with HR access can view the feed; sending requires employee link
  const canSend = hasPermission(HR_PERMISSIONS.EMPLOYEES.LIST);

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tab from URL or default "feed"
  const activeTab = useMemo<TabValue>(() => {
    const raw = searchParams.get('tab');
    if (raw === 'sent' || raw === 'received') return raw;
    return 'feed';
  }, [searchParams]);

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

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

  const PAGE_SIZE = 20;

  const fetchFn = useCallback(
    async (pageParam: number): Promise<KudosListResponse> => {
      const params = { page: pageParam, perPage: PAGE_SIZE };
      switch (activeTab) {
        case 'sent':
          return portalService.listSentKudos(params);
        case 'received':
          return portalService.listReceivedKudos(params);
        default:
          return portalService.listKudosFeed(params);
      }
    },
    [activeTab]
  );

  const {
    data: infiniteData,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [TAB_QUERY_KEYS[activeTab]],
    queryFn: async ({ pageParam = 1 }) => fetchFn(pageParam),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      if (currentPage < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },
  });

  const kudosData = infiniteData?.pages.flatMap(p => p.kudos) ?? [];

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

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

  const sendMutation = useMutation({
    mutationFn: portalService.sendKudos,
    onSuccess: () => {
      toast.success('Reconhecimento enviado com sucesso');
      // Invalidate all tabs since the new kudos appears in feed + sent
      Object.values(TAB_QUERY_KEYS).forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    onError: () => {
      toast.error('Erro ao enviar reconhecimento');
    },
  });

  // ============================================================================
  // FILTERED ITEMS
  // ============================================================================

  const filteredItems = useMemo(() => {
    let items = kudosData;

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        item =>
          item.message.toLowerCase().includes(q) ||
          (item.fromEmployee?.fullName &&
            item.fromEmployee.fullName.toLowerCase().includes(q)) ||
          (item.toEmployee?.fullName &&
            item.toEmployee.fullName.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter.length > 0) {
      const set = new Set(categoryFilter);
      items = items.filter(item => set.has(item.category));
    }

    return items;
  }, [kudosData, searchQuery, categoryFilter]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleView = useCallback(
    (id: string) => {
      router.push(`/hr/kudos/${id}`);
    },
    [router]
  );

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canSend) {
      buttons.push({
        id: 'send-kudos',
        title: 'Enviar Reconhecimento',
        icon: Plus,
        onClick: () => setIsSendOpen(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canSend]);

  // ============================================================================
  // TAB LABELS
  // ============================================================================

  const tabLabels: { value: TabValue; label: string; icon: LucideIcon }[] = [
    { value: 'feed', label: 'Feed', icon: Award },
    { value: 'sent', label: 'Enviados', icon: Send },
    { value: 'received', label: 'Recebidos', icon: Inbox },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Reconhecimento', href: '/hr/kudos' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Reconhecimento"
          description="Reconheça e celebre as conquistas dos seus colegas de equipe"
        />
      </PageHeader>

      <PageBody>
        {/* Tabs */}
        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            {tabLabels.map(tab => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className="flex items-center gap-2"
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
          <div className="flex-1">
            <SearchBar
              placeholder="Buscar por nome ou mensagem..."
              value={searchQuery}
              onSearch={value => setSearchQuery(value)}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>
          <FilterDropdown
            label="Categoria"
            icon={Award}
            options={CATEGORY_FILTER_OPTIONS}
            selected={categoryFilter}
            onSelectionChange={setCategoryFilter}
            activeColor="violet"
            searchPlaceholder="Buscar categoria..."
            emptyText="Nenhuma categoria encontrada."
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <GridLoading count={6} layout="list" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar reconhecimentos"
            message="Ocorreu um erro ao tentar carregar o feed de reconhecimentos. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              {activeTab === 'feed'
                ? 'Nenhum reconhecimento no feed'
                : activeTab === 'sent'
                  ? 'Você ainda não enviou reconhecimentos'
                  : 'Você ainda não recebeu reconhecimentos'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {activeTab === 'feed'
                ? 'Seja o primeiro a reconhecer um colega!'
                : activeTab === 'sent'
                  ? 'Envie um reconhecimento para um colega de trabalho.'
                  : 'Continue fazendo um ótimo trabalho!'}
            </p>
            {canSend && activeTab !== 'received' && (
              <button
                onClick={() => setIsSendOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Enviar Reconhecimento
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(kudos => (
              <KudosCard
                key={kudos.id}
                kudos={kudos}
                activeTab={activeTab}
                onView={handleView}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Send Modal */}
        <SendKudosModal
          isOpen={isSendOpen}
          onClose={() => setIsSendOpen(false)}
          isSubmitting={sendMutation.isPending}
          onSubmit={async data => {
            await sendMutation.mutateAsync(data);
          }}
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// KUDOS CARD COMPONENT
// ============================================================================

interface KudosCardProps {
  kudos: EmployeeKudos;
  activeTab: TabValue;
  onView: (id: string) => void;
}

function KudosCard({ kudos, activeTab, onView }: KudosCardProps) {
  const config = CATEGORY_CONFIG[kudos.category];
  const CategoryIcon = config.icon;

  const senderName = kudos.fromEmployee?.fullName ?? 'Colaborador';
  const receiverName = kudos.toEmployee?.fullName ?? 'Colaborador';
  const senderPosition = kudos.fromEmployee?.position?.name;
  const receiverPosition = kudos.toEmployee?.position?.name;
  const senderDept = kudos.fromEmployee?.department?.name;
  const receiverDept = kudos.toEmployee?.department?.name;

  const formattedDate = new Date(kudos.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const relativeTime = getRelativeTime(kudos.createdAt);

  return (
    <button
      type="button"
      onClick={() => onView(kudos.id)}
      className="w-full text-left rounded-lg border bg-white dark:bg-slate-800/60 border-border p-4 transition-all hover:shadow-md hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-4">
        {/* Category icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${config.gradient} text-white`}
        >
          <CategoryIcon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header line */}
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <span className="font-semibold text-foreground">{senderName}</span>
            <span className="text-muted-foreground">reconheceu</span>
            <span className="font-semibold text-foreground">
              {receiverName}
            </span>
          </div>

          {/* Subtitle: positions/departments */}
          <div className="flex items-center gap-1 flex-wrap mt-0.5 text-xs text-muted-foreground">
            {senderPosition && <span>{senderPosition}</span>}
            {senderDept && (
              <>
                <span>-</span>
                <span>{senderDept}</span>
              </>
            )}
            <span className="mx-1">{'>'}</span>
            {receiverPosition && <span>{receiverPosition}</span>}
            {receiverDept && (
              <>
                <span>-</span>
                <span>{receiverDept}</span>
              </>
            )}
          </div>

          {/* Message */}
          <p className="mt-2 text-sm text-foreground/80 line-clamp-3">
            {kudos.message}
          </p>

          {/* Footer: badge + time */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}
            >
              <CategoryIcon className="h-3 w-3" />
              {config.label}
            </span>

            {!kudos.isPublic && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400">
                Privado
              </span>
            )}

            <span className="ml-auto text-xs text-muted-foreground">
              {relativeTime}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `${diffMin} min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}
