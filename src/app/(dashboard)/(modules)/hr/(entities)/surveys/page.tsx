/**
 * OpenSea OS - Surveys Listing Page
 * Página de listagem de pesquisas
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
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { surveysService } from '@/services/hr/surveys.service';
import type { Survey, SurveyType, SurveyStatus } from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Calendar,
  ClipboardList,
  Eye,
  Loader2,
  Lock,
  Plus,
  Tag,
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
  SURVEY_TYPE_OPTIONS,
  SURVEY_STATUS_LABELS,
  SURVEY_STATUS_COLORS,
  SURVEY_STATUS_OPTIONS,
} from './src';
import { CreateSurveyModal } from './src/modals/create-survey-modal';

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

  const canCreate = hasPermission(HR_PERMISSIONS.SURVEYS.REGISTER);
  const canModify = hasPermission(HR_PERMISSIONS.SURVEYS.MODIFY);
  const canDelete = hasPermission(HR_PERMISSIONS.SURVEYS.REMOVE);

  // ============================================================================
  // URL-BASED FILTERS
  // ============================================================================

  const typeFilter = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const statusFilter = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

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

  const activateMutation = useMutation({
    mutationFn: surveysService.activate.bind(surveysService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Pesquisa ativada com sucesso');
    },
    onError: () => {
      toast.error(
        'Erro ao ativar pesquisa. Verifique se há pelo menos uma pergunta.'
      );
    },
  });

  const closeMutation = useMutation({
    mutationFn: surveysService.close.bind(surveysService),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success('Pesquisa encerrada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao encerrar pesquisa');
    },
  });

  // ============================================================================
  // CLIENT-SIDE FILTERS
  // ============================================================================

  const displayedSurveys = useMemo(() => {
    let items = allSurveys;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          SURVEY_TYPE_LABELS[s.type]?.toLowerCase().includes(q)
      );
    }

    if (typeFilter.length > 0) {
      const set = new Set(typeFilter);
      items = items.filter(s => set.has(s.type));
    }

    if (statusFilter.length > 0) {
      const set = new Set(statusFilter);
      items = items.filter(s => set.has(s.status));
    }

    return items;
  }, [allSurveys, searchQuery, typeFilter, statusFilter]);

  // ============================================================================
  // URL FILTER BUILDERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { type?: string[]; status?: string[] }) => {
      const types = params.type !== undefined ? params.type : typeFilter;
      const statuses =
        params.status !== undefined ? params.status : statusFilter;
      const parts: string[] = [];
      if (types.length > 0) parts.push(`type=${types.join(',')}`);
      if (statuses.length > 0) parts.push(`status=${statuses.join(',')}`);
      return parts.length > 0
        ? `/hr/surveys?${parts.join('&')}`
        : '/hr/surveys';
    },
    [typeFilter, statusFilter]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

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
          description="Gerencie pesquisas de engajamento, satisfação e clima organizacional"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="surveys-page" className="contents" />
        {/* Search Bar */}
        <div data-testid="surveys-search">
          <SearchBar
            placeholder="Buscar pesquisas..."
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div data-testid="surveys-filter-type">
            <FilterDropdown
              label="Tipo"
              icon={Tag}
              options={SURVEY_TYPE_OPTIONS.map(o => ({
                id: o.value,
                label: o.label,
              }))}
              selected={typeFilter}
              onSelectionChange={setTypeFilter}
              activeColor="violet"
              searchPlaceholder="Buscar tipo..."
              emptyText="Nenhum tipo encontrado."
            />
          </div>
          <div data-testid="surveys-filter-status">
            <FilterDropdown
              label="Status"
              options={SURVEY_STATUS_OPTIONS.map(o => ({
                id: o.value,
                label: o.label,
              }))}
              selected={statusFilter}
              onSelectionChange={setStatusFilter}
              activeColor="emerald"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {searchQuery
                ? 'Nenhuma pesquisa encontrada'
                : 'Nenhuma pesquisa cadastrada'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {searchQuery
                ? `Nenhum resultado para "${searchQuery}". Tente outra busca.`
                : 'Crie a primeira pesquisa para começar a medir o engajamento da equipe.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedSurveys.map(survey => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onView={() => router.push(`/hr/surveys/${survey.id}`)}
                onEdit={
                  canModify && survey.status === 'DRAFT'
                    ? () => router.push(`/hr/surveys/${survey.id}/edit`)
                    : undefined
                }
                onActivate={
                  canModify && survey.status === 'DRAFT'
                    ? () => activateMutation.mutate(survey.id)
                    : undefined
                }
                onClose={
                  canModify && survey.status === 'ACTIVE'
                    ? () => closeMutation.mutate(survey.id)
                    : undefined
                }
                onDelete={
                  canDelete &&
                  (survey.status === 'DRAFT' || survey.status === 'CLOSED')
                    ? () => handleDelete(survey.id)
                    : undefined
                }
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
          onSubmit={async data => {
            await createMutation.mutateAsync(data);
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
// SURVEY CARD
// ============================================================================

function SurveyCard({
  survey,
  onView,
  onEdit,
  onActivate,
  onClose,
  onDelete,
}: {
  survey: Survey;
  onView: () => void;
  onEdit?: () => void;
  onActivate?: () => void;
  onClose?: () => void;
  onDelete?: () => void;
}) {
  const typeLabel = SURVEY_TYPE_LABELS[survey.type] ?? survey.type;
  const typeColors =
    SURVEY_TYPE_COLORS[survey.type as SurveyType] ?? SURVEY_TYPE_COLORS.CUSTOM;
  const statusLabel = SURVEY_STATUS_LABELS[survey.status] ?? survey.status;
  const statusColors =
    SURVEY_STATUS_COLORS[survey.status as SurveyStatus] ??
    SURVEY_STATUS_COLORS.DRAFT;

  return (
    <div
      className="group relative rounded-xl border bg-white dark:bg-slate-800/60 p-5 transition-all hover:shadow-md cursor-pointer"
      onClick={onView}
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
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
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
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {survey.startDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(survey.startDate).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        {survey.endDate && (
          <div className="flex items-center gap-1">
            <span>até</span>
            <span>{new Date(survey.endDate).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
        {survey._count && (
          <>
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              <span>{survey._count.responses} respostas</span>
            </div>
          </>
        )}
      </div>

      {/* Context Actions (hover) */}
      {(onEdit || onActivate || onClose || onDelete) && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onEdit && (
            <button
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-7 w-7 rounded-md bg-background border flex items-center justify-center hover:bg-accent text-xs"
              title="Editar"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
