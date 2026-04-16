/**
 * OpenSea OS - Surveys Listing Page
 *
 * Página de listagem de pesquisas com tabs de status (Ativas / Para Responder
 * / Resultados / Rascunhos) e cards ricos com métricas. Inspirado em 15Five
 * (Pulse) e Lattice (Engagement) — destaque para pesquisas que pedem ação do
 * usuário e visão clara de progresso.
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { surveysService } from '@/services/hr/surveys.service';
import type { Survey, SurveyStatus, SurveyType } from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
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
import {
  SURVEY_TYPE_LABELS,
  SURVEY_TYPE_COLORS,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_COLORS,
} from './src';
import { CreateSurveyModal } from './src/modals/create-survey-modal';

type StatusTab = 'active' | 'pending' | 'results' | 'drafts' | 'all';

const TAB_CONFIG: Record<
  StatusTab,
  { label: string; description: string; status?: SurveyStatus[] }
> = {
  active: {
    label: 'Ativas',
    description: 'Pesquisas em andamento aceitando respostas.',
    status: ['ACTIVE'],
  },
  pending: {
    label: 'Para Responder',
    description: 'Pesquisas ativas que aguardam sua participação.',
    status: ['ACTIVE'],
  },
  results: {
    label: 'Resultados',
    description: 'Pesquisas encerradas e resultados consolidados.',
    status: ['CLOSED'],
  },
  drafts: {
    label: 'Rascunhos',
    description: 'Pesquisas em preparação que ainda não foram ativadas.',
    status: ['DRAFT'],
  },
  all: {
    label: 'Todas',
    description: 'Todas as pesquisas do tenant.',
  },
};

export default function SurveysPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="grid" size="md" gap="gap-4" />}
    >
      <SurveysPageContent />
    </Suspense>
  );
}

function SurveysPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);

  const canAccess = hasPermission(HR_PERMISSIONS.SURVEYS.ACCESS);
  const canCreate = hasPermission(HR_PERMISSIONS.SURVEYS.REGISTER);
  const canModify = hasPermission(HR_PERMISSIONS.SURVEYS.MODIFY);
  const canDelete = hasPermission(HR_PERMISSIONS.SURVEYS.REMOVE);

  // ============================================================================
  // STATUS TAB
  // ============================================================================

  const tabFromUrl = (searchParams.get('tab') as StatusTab) || 'active';
  const activeTab: StatusTab = TAB_CONFIG[tabFromUrl] ? tabFromUrl : 'active';

  const setTab = useCallback(
    (next: StatusTab) => {
      router.push(next === 'active' ? '/hr/surveys' : `/hr/surveys?tab=${next}`);
    },
    [router]
  );

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
    queryKey: ['surveys', 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      return surveysService.list({
        page: pageParam,
        perPage: PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.page ?? 1;
      const totalPages = lastPage.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  const allSurveys = useMemo(
    () => infiniteData?.pages.flatMap(p => p.surveys ?? []) ?? [],
    [infiniteData]
  );

  // Sentinel ref for infinite scroll
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
    mutationFn: surveysService.create.bind(surveysService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Pesquisa criada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao criar pesquisa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: surveysService.delete.bind(surveysService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Pesquisa excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir pesquisa');
    },
  });

  // ============================================================================
  // FILTERED LISTS PER TAB
  // ============================================================================

  const tabCounts = useMemo(() => {
    const counts: Record<StatusTab, number> = {
      active: 0,
      pending: 0,
      results: 0,
      drafts: 0,
      all: allSurveys.length,
    };
    for (const survey of allSurveys) {
      if (survey.status === 'ACTIVE') counts.active += 1;
      if (survey.status === 'CLOSED') counts.results += 1;
      if (survey.status === 'DRAFT') counts.drafts += 1;
      // pending = active surveys (until backend exposes "responded by user")
      if (survey.status === 'ACTIVE') counts.pending += 1;
    }
    return counts;
  }, [allSurveys]);

  const displayedSurveys = useMemo(() => {
    let items = allSurveys;
    const allowedStatus = TAB_CONFIG[activeTab].status;
    if (allowedStatus) {
      const allowed = new Set<string>(allowedStatus);
      items = items.filter(survey => allowed.has(survey.status));
    }

    if (searchQuery) {
      const term = searchQuery.toLowerCase();
      items = items.filter(
        survey =>
          survey.title.toLowerCase().includes(term) ||
          (survey.description &&
            survey.description.toLowerCase().includes(term)) ||
          SURVEY_TYPE_LABELS[survey.type]?.toLowerCase().includes(term)
      );
    }

    return items;
  }, [allSurveys, activeTab, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = (surveyId: string) => {
    setSurveyToDelete(surveyId);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (surveyToDelete) {
      await deleteMutation.mutateAsync(surveyToDelete);
      setSurveyToDelete(null);
      setIsDeleteOpen(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Pesquisas', href: '/hr/surveys' },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'create-survey',
                    title: 'Nova Pesquisa',
                    icon: Plus,
                    onClick: () => setIsCreateOpen(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />

        <Header
          title="Pesquisas"
          description="Acompanhe engajamento, eNPS e clima organizacional com pesquisas curtas e recorrentes."
        />
      </PageHeader>

      <PageBody>
        <div data-testid="surveys-page" className="contents" />

        {/* Status Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={value => setTab(value as StatusTab)}
        >
          <TabsList className="grid w-full grid-cols-5 h-12 mb-4">
            {(['active', 'pending', 'results', 'drafts', 'all'] as StatusTab[]).map(
              tab => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  data-testid={`surveys-tab-${tab}`}
                >
                  {TAB_CONFIG[tab].label}
                  {tabCounts[tab] > 0 && (
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                      {tabCounts[tab]}
                    </span>
                  )}
                </TabsTrigger>
              )
            )}
          </TabsList>
        </Tabs>

        {/* Search Bar */}
        <div data-testid="surveys-search" className="mb-4">
          <SearchBar
            placeholder={`Buscar em ${TAB_CONFIG[activeTab].label.toLowerCase()}...`}
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />
        </div>

        {/* Tab description */}
        <p className="text-xs text-muted-foreground mb-4">
          {TAB_CONFIG[activeTab].description}
        </p>

        {/* Content */}
        {!canAccess ? (
          <GridError
            type="server"
            title="Sem permissão"
            message="Você não tem permissão para visualizar pesquisas."
          />
        ) : isLoading ? (
          <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar pesquisas"
            message="Ocorreu um erro ao tentar carregar as pesquisas. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () =>
                queryClient.invalidateQueries({ queryKey: ['surveys'] }),
            }}
          />
        ) : displayedSurveys.length === 0 ? (
          <SurveysEmptyState
            tab={activeTab}
            search={searchQuery}
            canCreate={canCreate}
            onCreate={() => setIsCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedSurveys.map(survey => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                showRespondCta={activeTab === 'pending'}
                onView={() => router.push(`/hr/surveys/${survey.id}`)}
                onRespond={() =>
                  router.push(`/hr/surveys/respond/${survey.id}`)
                }
                onDelete={
                  canDelete &&
                  (survey.status === 'DRAFT' || survey.status === 'CLOSED')
                    ? () => handleDelete(survey.id)
                    : undefined
                }
                canModify={canModify}
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

        {/* Create Modal */}
        <CreateSurveyModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          isSubmitting={createMutation.isPending}
          onSubmit={async payload => {
            await createMutation.mutateAsync(payload);
          }}
        />

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSurveyToDelete(null);
          }}
          onSuccess={handleDeleteConfirm}
          title="Excluir Pesquisa"
          description="Digite seu PIN de ação para excluir esta pesquisa. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function SurveysEmptyState({
  tab,
  search,
  canCreate,
  onCreate,
}: {
  tab: StatusTab;
  search: string;
  canCreate: boolean;
  onCreate: () => void;
}) {
  if (search) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ClipboardList className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum resultado encontrado</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Nenhuma pesquisa encontrada para &ldquo;{search}&rdquo;. Tente outra
          busca ou troque a aba.
        </p>
      </div>
    );
  }

  const messages: Record<
    StatusTab,
    { title: string; description: string; icon: React.ReactNode }
  > = {
    active: {
      title: 'Nenhuma pesquisa ativa',
      description:
        'Quando você ativar uma pesquisa, ela aparecerá aqui para o time responder.',
      icon: <ClipboardList className="h-8 w-8 text-muted-foreground" />,
    },
    pending: {
      title: 'Tudo em dia',
      description:
        'Você não tem pesquisas pendentes para responder no momento. Bom trabalho!',
      icon: <CheckCircle2 className="h-8 w-8 text-emerald-500" />,
    },
    results: {
      title: 'Sem resultados ainda',
      description:
        'Pesquisas encerradas e seus resultados consolidados aparecerão aqui.',
      icon: <Inbox className="h-8 w-8 text-muted-foreground" />,
    },
    drafts: {
      title: 'Nenhum rascunho',
      description:
        'Comece criando uma pesquisa Pulse curta para medir o sentimento da equipe.',
      icon: <Sparkles className="h-8 w-8 text-violet-500" />,
    },
    all: {
      title: 'Nenhuma pesquisa criada',
      description:
        'Crie a primeira pesquisa para começar a medir o engajamento da equipe.',
      icon: <ClipboardList className="h-8 w-8 text-muted-foreground" />,
    },
  };

  const config = messages[tab];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">{config.icon}</div>
      <h3 className="text-lg font-semibold">{config.title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        {config.description}
      </p>
      {canCreate && (tab === 'all' || tab === 'drafts' || tab === 'active') && (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Criar primeira pesquisa
        </button>
      )}
    </div>
  );
}

// ============================================================================
// SURVEY CARD
// ============================================================================

function SurveyCard({
  survey,
  showRespondCta,
  onView,
  onRespond,
  onDelete,
}: {
  survey: Survey;
  showRespondCta: boolean;
  onView: () => void;
  onRespond: () => void;
  onDelete?: () => void;
  canModify: boolean;
}) {
  const typeLabel = SURVEY_TYPE_LABELS[survey.type] ?? survey.type;
  const typeColors =
    SURVEY_TYPE_COLORS[survey.type as SurveyType] ?? SURVEY_TYPE_COLORS.CUSTOM;
  const statusLabel = SURVEY_STATUS_LABELS[survey.status] ?? survey.status;
  const statusColors =
    SURVEY_STATUS_COLORS[survey.status as SurveyStatus] ??
    SURVEY_STATUS_COLORS.DRAFT;

  const responsesCount = survey._count?.responses ?? 0;
  const questionsCount = survey._count?.questions ?? 0;

  return (
    <div
      className="group relative rounded-xl border bg-white dark:bg-slate-800/60 p-5 transition-all hover:shadow-md cursor-pointer"
      onClick={onView}
      data-testid={`survey-card-${survey.id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${typeColors.gradient} text-white`}
        >
          <ClipboardList className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-tight truncate">
            {survey.title}
          </h3>
          {survey.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {survey.description}
            </p>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge
          variant="outline"
          className={`text-xs ${typeColors.bg} ${typeColors.text} border-0`}
        >
          {typeLabel}
        </Badge>
        <Badge
          variant="outline"
          className={`text-xs ${statusColors.bg} ${statusColors.text} border-0`}
        >
          {statusLabel}
        </Badge>
        {survey.isAnonymous && (
          <Badge
            variant="outline"
            className="text-xs bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300 border-0"
          >
            <Lock className="h-3 w-3 mr-1" />
            Anônima
          </Badge>
        )}
        {questionsCount > 0 && (
          <Badge
            variant="outline"
            className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300 border-0"
          >
            {questionsCount} {questionsCount === 1 ? 'pergunta' : 'perguntas'}
          </Badge>
        )}
      </div>

      {/* Metrics row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>
            {responsesCount} {responsesCount === 1 ? 'resposta' : 'respostas'}
          </span>
        </div>
        {survey.startDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(survey.startDate).toLocaleDateString('pt-BR')}
            </span>
            {survey.endDate && (
              <>
                <span className="mx-1">→</span>
                <span>
                  {new Date(survey.endDate).toLocaleDateString('pt-BR')}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* CTA respond */}
      {showRespondCta && (
        <button
          type="button"
          onClick={event => {
            event.stopPropagation();
            onRespond();
          }}
          className="w-full mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
        >
          Responder agora
        </button>
      )}

      {/* Hover actions */}
      {onDelete && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={event => {
              event.stopPropagation();
              onDelete();
            }}
            className="h-7 px-2 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 text-xs font-medium hover:bg-rose-100"
            title="Excluir"
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
