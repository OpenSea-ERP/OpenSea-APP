/**
 * OpenSea OS - Recruitment Kanban Page
 *
 * Pipeline visual estilo Gupy: 4 colunas (Triagem → Entrevista → Oferta → Contratado)
 * com drag-and-drop entre colunas, máquina de estados de transição,
 * optimistic update e PIN para operações sensíveis.
 *
 * Rota: /hr/recruitment/[id]/kanban
 */

'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DragDropContext,
  type DropResult,
  type OnDragEndResponder,
} from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  GitBranch,
  LayoutList,
  Loader2,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { KanbanColumn } from '@/components/hr/kanban-column';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import { CANDIDATE_SOURCE_OPTIONS } from '../../src/constants';
import {
  KANBAN_COLUMNS,
  evaluateKanbanTransition,
  findColumnForStatus,
  useChangeApplicationStatus,
  useFilteredKanbanCards,
  useGroupedFilteredCards,
  useJobPostingDetail,
  useKanbanBoard,
} from '@/hooks/hr/use-recruitment-kanban';
import type {
  ApplicationStatus,
  KanbanCandidateCard,
  KanbanColumnDefinition,
  KanbanColumnId,
  KanbanTransitionVerdict,
} from '@/types/hr';

// =============================================================================
// Pending transition state (entre drag → confirmação → mutate)
// =============================================================================

interface PendingTransition {
  applicationId: string;
  candidateName: string;
  fromColumn: KanbanColumnDefinition;
  toColumn: KanbanColumnDefinition;
  verdict: KanbanTransitionVerdict;
}

// =============================================================================
// Page wrapper (Suspense boundary)
// =============================================================================

export default function RecruitmentKanbanPage() {
  return (
    <Suspense fallback={<KanbanPageSkeleton />}>
      <RecruitmentKanbanContent />
    </Suspense>
  );
}

function KanbanPageSkeleton() {
  return (
    <PageLayout>
      <PageHeader>
        <Skeleton className="h-9 w-full" />
      </PageHeader>
      <PageBody>
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-3 flex gap-3">
          {Array.from({ length: 4 }).map((_, columnIndex) => (
            <div key={columnIndex} className="w-72 space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </PageBody>
    </PageLayout>
  );
}

// =============================================================================
// Main content
// =============================================================================

function RecruitmentKanbanContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobPostingId = (params.id as string | undefined) ?? null;

  const { hasPermission } = usePermissions();
  const canModify = hasPermission(HR_PERMISSIONS.RECRUITMENT.MODIFY);
  const canCreate = hasPermission(HR_PERMISSIONS.RECRUITMENT.REGISTER);

  // ----- Data -----
  const jobPostingQuery = useJobPostingDetail(jobPostingId);
  const { cards, isLoading, error } = useKanbanBoard(jobPostingId);
  const changeStatus = useChangeApplicationStatus();

  // ----- Filters -----
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [minRatingFilter, setMinRatingFilter] = useState<number | null>(null);

  const filteredCards = useFilteredKanbanCards(cards, {
    search: searchQuery,
    source: sourceFilter,
    minRating: minRatingFilter,
  });
  const cardsByColumn = useGroupedFilteredCards(filteredCards);

  // ----- Pending transition modal state -----
  const [pendingTransition, setPendingTransition] =
    useState<PendingTransition | null>(null);

  // ----- Drag handler with state machine -----
  const handleDragEnd = useCallback<OnDragEndResponder>(
    (result: DropResult) => {
      if (!canModify) {
        return;
      }
      const { source, destination, draggableId } = result;
      if (!destination || !jobPostingId) return;
      if (source.droppableId === destination.droppableId) return;

      const fromColumn = KANBAN_COLUMNS.find(
        column => column.id === (source.droppableId as KanbanColumnId)
      );
      const toColumn = KANBAN_COLUMNS.find(
        column => column.id === (destination.droppableId as KanbanColumnId)
      );
      if (!fromColumn || !toColumn) return;

      const draggedCard = cards.find(card => card.applicationId === draggableId);
      if (!draggedCard) return;

      const verdict = evaluateKanbanTransition({
        fromColumn,
        toColumn,
        rating: draggedCard.rating,
      });

      if (verdict.kind === 'blocked') {
        return;
      }

      if (verdict.kind === 'allowed') {
        changeStatus.mutate({
          applicationId: draggableId,
          newStatus: toColumn.targetStatus,
          jobPostingId,
        });
        return;
      }

      // confirm | pin → abre modal
      setPendingTransition({
        applicationId: draggableId,
        candidateName: draggedCard.candidateName,
        fromColumn,
        toColumn,
        verdict,
      });
    },
    [canModify, jobPostingId, cards, changeStatus]
  );

  const closePendingTransition = useCallback(() => {
    setPendingTransition(null);
  }, []);

  const applyPendingTransition = useCallback(() => {
    if (!pendingTransition || !jobPostingId) return;
    changeStatus.mutate(
      {
        applicationId: pendingTransition.applicationId,
        newStatus: pendingTransition.toColumn.targetStatus,
        jobPostingId,
      },
      {
        onSettled: () => {
          setPendingTransition(null);
        },
      }
    );
  }, [pendingTransition, jobPostingId, changeStatus]);

  // ----- Card click → navigate to candidate detail -----
  const handleCardClick = useCallback(
    (card: KanbanCandidateCard) => {
      router.push(`/hr/recruitment/candidates/${card.candidateId}`);
    },
    [router]
  );

  // ----- Layout helpers (kanban viewport height) -----
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>();

  const recalcViewportHeight = useCallback(() => {
    const element = viewportRef.current;
    if (!element) return;
    const topOffset = element.getBoundingClientRect().top;
    setViewportHeight(Math.max(240, window.innerHeight - topOffset - 24));
  }, []);

  useEffect(() => {
    let rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(recalcViewportHeight);
    });
    window.addEventListener('resize', recalcViewportHeight);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', recalcViewportHeight);
      document.documentElement.style.overflow = '';
    };
  }, [recalcViewportHeight]);

  // ----- Counts for hero -----
  const totalCandidates = cards.length;
  const filteredCount = filteredCards.length;

  // ----- Loading state -----
  if (jobPostingQuery.isLoading) {
    return <KanbanPageSkeleton />;
  }

  // ----- Error / not found -----
  if (jobPostingQuery.error || !jobPostingQuery.data) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Recrutamento', href: '/hr/recruitment' },
              { label: 'Kanban' },
            ]}
            buttons={[]}
          />
        </PageHeader>
        <PageBody>
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="rounded-2xl bg-rose-50 p-4 dark:bg-rose-500/10">
              <AlertTriangle className="h-10 w-10 text-rose-500" />
            </div>
            <h2 className="text-lg font-semibold">Vaga não encontrada</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              A vaga solicitada não existe ou você não tem permissão para
              acessá-la.
            </p>
            <Link href="/hr/recruitment">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Recrutamento
              </Button>
            </Link>
          </div>
        </PageBody>
      </PageLayout>
    );
  }

  const jobPosting = jobPostingQuery.data;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Recrutamento', href: '/hr/recruitment' },
            { label: jobPosting.title, href: `/hr/recruitment/${jobPosting.id}` },
            { label: 'Kanban' },
          ]}
          buttons={[
            {
              id: 'view-list',
              title: 'Ver Lista',
              icon: LayoutList,
              variant: 'outline' as const,
              onClick: () => router.push(`/hr/recruitment/${jobPosting.id}`),
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        <div data-testid="kanban-page" className="contents" />

        {/* Hero banner */}
        <Card className="relative overflow-hidden border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
          <div className="absolute right-0 top-0 h-44 w-44 -translate-y-1/2 translate-x-1/2 rounded-full bg-violet-500/15 opacity-60" />
          <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-1/2 translate-y-1/2 rounded-full bg-sky-500/10 opacity-60" />

          <div className="relative z-10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 p-2.5">
                  <GitBranch className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
                    {jobPosting.title}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    Pipeline de candidatos — arraste entre colunas para mudar
                    de etapa
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-6 text-sm md:flex">
                <SummaryStat
                  label="Candidatos"
                  value={totalCandidates}
                  icon={Users}
                />
                <SummaryStat
                  label="Visíveis"
                  value={filteredCount}
                  icon={Briefcase}
                />
              </div>
            </div>

            {/* Filter strip */}
            <div className="rounded-md bg-muted/30 px-3 py-2 dark:bg-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar candidato por nome ou email..."
                    value={searchQuery}
                    onChange={changeEvent =>
                      setSearchQuery(changeEvent.target.value)
                    }
                    className="h-9 border-gray-200 bg-white pl-9 dark:border-white/10 dark:bg-white/10"
                    data-testid="kanban-search"
                  />
                </div>

                <div data-testid="kanban-filter-source">
                  <FilterDropdown
                    label="Origem"
                    icon={Briefcase}
                    options={CANDIDATE_SOURCE_OPTIONS.map(option => ({
                      id: option.label,
                      label: option.label,
                    }))}
                    selected={sourceFilter ? [sourceFilter] : []}
                    onSelectionChange={selectedIds =>
                      setSourceFilter(selectedIds[0] ?? '')
                    }
                    activeColor="violet"
                    searchPlaceholder="Buscar origem..."
                    emptyText="Nenhuma origem encontrada."
                  />
                </div>

                <div data-testid="kanban-filter-rating">
                  <FilterDropdown
                    label="Avaliação mínima"
                    icon={Star}
                    options={[
                      { id: '1', label: '1 estrela ou mais' },
                      { id: '2', label: '2 estrelas ou mais' },
                      { id: '3', label: '3 estrelas ou mais' },
                      { id: '4', label: '4 estrelas ou mais' },
                      { id: '5', label: '5 estrelas' },
                    ]}
                    selected={
                      minRatingFilter !== null ? [String(minRatingFilter)] : []
                    }
                    onSelectionChange={selectedIds => {
                      const value = selectedIds[0];
                      setMinRatingFilter(value ? Number(value) : null);
                    }}
                    activeColor="cyan"
                    searchPlaceholder="Filtrar por nota..."
                    emptyText="Nenhuma opção."
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Error inside board */}
        {error && (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            Não foi possível carregar os candidatos. Tente novamente.
            <Button
              size="sm"
              variant="outline"
              className="ml-3"
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ['hr', 'recruitment', 'kanban'],
                })
              }
            >
              Recarregar
            </Button>
          </div>
        )}

        {/* Board */}
        <div
          ref={viewportRef}
          className="mt-3"
          style={
            viewportHeight
              ? { height: viewportHeight, overflow: 'hidden' }
              : undefined
          }
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="kanban-scroll h-full overflow-x-auto overflow-y-auto pb-2 sm:overflow-y-hidden">
              <div className="flex h-full flex-col gap-3 sm:min-w-max sm:flex-row">
                {KANBAN_COLUMNS.map(column => {
                  const columnCards = cardsByColumn.get(column.id) ?? [];
                  return (
                    <KanbanColumn
                      key={column.id}
                      column={column}
                      cards={columnCards}
                      isLoading={isLoading}
                      onCardClick={handleCardClick}
                      onAddCandidate={
                        canCreate
                          ? () => router.push('/hr/recruitment/candidates')
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          </DragDropContext>
        </div>

        {changeStatus.isPending && (
          <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs text-white shadow-lg">
            <Loader2 className="h-3 w-3 animate-spin" />
            Atualizando candidato...
          </div>
        )}

        {/* Confirm modal (warn dialog) */}
        {pendingTransition && pendingTransition.verdict.kind === 'confirm' && (
          <AlertDialog open onOpenChange={open => !open && closePendingTransition()}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar movimentação</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingTransition.verdict.reason}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                <p className="font-medium text-slate-900 dark:text-white">
                  {pendingTransition.candidateName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  De{' '}
                  <span className="font-semibold">
                    {pendingTransition.fromColumn.title}
                  </span>{' '}
                  para{' '}
                  <span className="font-semibold">
                    {pendingTransition.toColumn.title}
                  </span>
                </p>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={closePendingTransition}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction onClick={applyPendingTransition}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* PIN modal (sensitive transitions: → HIRED) */}
        {pendingTransition && pendingTransition.verdict.kind === 'pin' && (
          <VerifyActionPinModal
            isOpen
            onClose={closePendingTransition}
            onSuccess={applyPendingTransition}
            title="Confirmar contratação"
            description={`Digite seu PIN de ação para contratar ${pendingTransition.candidateName}. Esta operação não pode ser desfeita.`}
          />
        )}
      </PageBody>
    </PageLayout>
  );
}

// =============================================================================
// Helper sub-components
// =============================================================================

interface SummaryStatProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

function SummaryStat({ label, value, icon: Icon }: SummaryStatProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-violet-100 p-2 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
          {value}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </div>
    </div>
  );
}

// referência a `ApplicationStatus` para evitar tree-shake do enum em runtime checks
export type _UnusedApplicationStatusReference = ApplicationStatus;
