/**
 * OpenSea OS - Performance Review Detail Page (Lattice-style)
 *
 * Pagina de detalhes de uma performance review individual com:
 *   - Identity card (avatar funcionario + ciclo + status)
 *   - Card de avaliacao geral (self vs manager + diff)
 *   - Card de radar comparativo por competencia
 *   - Tabela de competencias com edicao inline (modal)
 *   - Reflexoes (autoavaliacao, gestor, fortes, melhorias, metas)
 *   - Botao "Avancar status" (PIN required)
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { ReviewRadarChart } from '@/components/hr/review-radar-chart';
import { ScoreSlider, ScoreStars } from '@/components/hr/score-slider';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCreateCompetency,
  useDeleteCompetency,
  useReviewWithCompetencies,
  useSeedDefaults,
  useUpdateCompetency,
} from '@/hooks/hr/use-review-competencies';
import { apiClient } from '@/lib/api-client';
import { reviewsService } from '@/services/hr/reviews.service';
import { employeesService } from '@/services/hr/employees.service';
import type {
  PerformanceReviewStatus,
  ReviewCompetency,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Edit,
  MessageSquare,
  Plus,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { HR_PERMISSIONS } from '../../../../../_shared/constants/hr-permissions';
import {
  PERFORMANCE_REVIEW_STATUS_COLORS,
  PERFORMANCE_REVIEW_STATUS_LABELS,
} from '../../../src/constants';

// ============================================================================
// HELPERS
// ============================================================================

const NEXT_STATUS: Record<PerformanceReviewStatus, PerformanceReviewStatus | null> = {
  PENDING: 'SELF_ASSESSMENT',
  SELF_ASSESSMENT: 'MANAGER_REVIEW',
  MANAGER_REVIEW: 'COMPLETED',
  COMPLETED: null,
};

const NEXT_STATUS_LABEL: Record<PerformanceReviewStatus, string> = {
  PENDING: 'Iniciar autoavaliacao',
  SELF_ASSESSMENT: 'Enviar para gestor',
  MANAGER_REVIEW: 'Concluir avaliacao',
  COMPLETED: '',
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return '—';
  return score.toFixed(1).replace('.', ',');
}

// ============================================================================
// PAGE
// ============================================================================

export default function PerformanceReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const cycleId = params.id as string;
  const reviewId = params.reviewId as string;

  const canModify = hasPermission(HR_PERMISSIONS.REVIEWS.UPDATE);
  const canDelete = hasPermission(HR_PERMISSIONS.REVIEWS.DELETE);
  const canAdmin = hasPermission(HR_PERMISSIONS.REVIEWS.MANAGE);

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isDeleteReviewOpen, setIsDeleteReviewOpen] = useState(false);
  const [isAdvanceStatusOpen, setIsAdvanceStatusOpen] = useState(false);
  const [pendingDeleteCompetencyId, setPendingDeleteCompetencyId] = useState<
    string | null
  >(null);
  const [editingCompetency, setEditingCompetency] =
    useState<ReviewCompetency | null>(null);
  const [isAddingCompetency, setIsAddingCompetency] = useState(false);

  // ==========================================================================
  // DATA
  // ==========================================================================

  const {
    data: reviewBundle,
    isLoading,
    error,
  } = useReviewWithCompetencies(reviewId);

  const review = reviewBundle?.review;
  const competencies = useMemo(
    () => reviewBundle?.competencies ?? [],
    [reviewBundle]
  );

  const { data: cycleData } = useQuery({
    queryKey: ['review-cycles', cycleId],
    queryFn: async () => {
      const response = await reviewsService.getCycle(cycleId);
      return response.reviewCycle;
    },
    enabled: !!cycleId,
  });

  const { data: employeeBundle } = useQuery({
    queryKey: ['employees', 'pair-for-review', review?.employeeId, review?.reviewerId],
    queryFn: async () => {
      if (!review) return { employee: null, reviewer: null };
      const [employeeResp, reviewerResp] = await Promise.all([
        employeesService
          .getEmployee(review.employeeId)
          .then(response => response.employee)
          .catch(() => null),
        employeesService
          .getEmployee(review.reviewerId)
          .then(response => response.employee)
          .catch(() => null),
      ]);
      return { employee: employeeResp, reviewer: reviewerResp };
    },
    enabled: !!review,
  });

  const employeeName = employeeBundle?.employee?.fullName ?? 'Funcionario';
  const employeePhotoUrl = employeeBundle?.employee?.photoUrl ?? null;
  const reviewerName = employeeBundle?.reviewer?.fullName ?? 'Avaliador';

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const createCompetencyMutation = useCreateCompetency(reviewId);
  const updateCompetencyMutation = useUpdateCompetency(reviewId);
  const deleteCompetencyMutation = useDeleteCompetency(reviewId);
  const seedDefaultsMutation = useSeedDefaults(reviewId);

  const deleteReviewMutation = useMutation({
    mutationFn: () =>
      apiClient.delete<void>(`/v1/hr/performance-reviews/${reviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-reviews'] });
      toast.success('Avaliacao excluida com sucesso');
      router.push(`/hr/reviews/${cycleId}`);
    },
    onError: () => toast.error('Erro ao excluir avaliacao'),
  });

  const advanceStatusMutation = useMutation({
    mutationFn: async () => {
      if (!review) return;
      const next = NEXT_STATUS[review.status];
      if (!next) return;
      // O backend tem endpoints especificos: self-assessment, manager-review e
      // acknowledge. Mapeamos para a transicao adequada.
      if (next === 'SELF_ASSESSMENT') {
        await reviewsService.submitSelfAssessment(reviewId, {
          selfScore: review.selfScore ?? 0,
        });
      } else if (next === 'MANAGER_REVIEW') {
        await reviewsService.submitSelfAssessment(reviewId, {
          selfScore: review.selfScore ?? 0,
        });
      } else if (next === 'COMPLETED') {
        await reviewsService.submitManagerReview(reviewId, {
          managerScore: review.managerScore ?? 0,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['performance-reviews', 'detail', reviewId],
      });
      toast.success('Status atualizado com sucesso');
    },
    onError: () => toast.error('Erro ao avancar status'),
  });

  // ==========================================================================
  // LOADING / ERROR STATES
  // ==========================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="performance-review-detail-loading">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Avaliacoes', href: '/hr/reviews' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={4} layout="grid" size="md" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !review) {
    return (
      <PageLayout data-testid="performance-review-detail-error">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Avaliacoes', href: '/hr/reviews' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError message="Avaliacao nao encontrada" />
        </PageBody>
      </PageLayout>
    );
  }

  // ==========================================================================
  // DERIVED VALUES
  // ==========================================================================

  const statusColors =
    PERFORMANCE_REVIEW_STATUS_COLORS[review.status as PerformanceReviewStatus];
  const statusLabel =
    PERFORMANCE_REVIEW_STATUS_LABELS[
      review.status as PerformanceReviewStatus
    ] ?? review.status;

  const selfAggregate =
    review.aggregatedSelfScore ?? review.selfScore ?? null;
  const managerAggregate =
    review.aggregatedManagerScore ?? review.managerScore ?? null;
  const diff =
    selfAggregate !== null && managerAggregate !== null
      ? Number((managerAggregate - selfAggregate).toFixed(2))
      : null;

  const diffStyles =
    diff === null
      ? { bg: 'bg-slate-50 dark:bg-slate-500/8', text: 'text-slate-600 dark:text-slate-400', label: '—' }
      : diff > 0
        ? { bg: 'bg-emerald-50 dark:bg-emerald-500/8', text: 'text-emerald-700 dark:text-emerald-300', label: `+${diff.toFixed(1).replace('.', ',')}` }
        : diff < 0
          ? { bg: 'bg-rose-50 dark:bg-rose-500/8', text: 'text-rose-700 dark:text-rose-300', label: diff.toFixed(1).replace('.', ',') }
          : { bg: 'bg-slate-50 dark:bg-slate-500/8', text: 'text-slate-700 dark:text-slate-300', label: '0,0' };

  const nextStatus = NEXT_STATUS[review.status as PerformanceReviewStatus];
  const nextStatusLabel = NEXT_STATUS_LABEL[review.status as PerformanceReviewStatus];

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout data-testid="performance-review-detail-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Avaliacoes', href: '/hr/reviews' },
            { label: cycleData?.name ?? 'Ciclo', href: `/hr/reviews/${cycleId}` },
            { label: employeeName },
          ]}
          actions={
            <div className="flex items-center gap-2">
              {canAdmin && nextStatus && (
                <Button
                  size="sm"
                  className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
                  onClick={() => setIsAdvanceStatusOpen(true)}
                >
                  <ArrowRight className="mr-1.5 h-4 w-4" />
                  {nextStatusLabel}
                </Button>
              )}
              {canModify && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-2.5 rounded-lg text-sm"
                  onClick={() =>
                    router.push(
                      `/hr/reviews/${cycleId}/review/${reviewId}/edit`
                    )
                  }
                  data-testid="performance-review-edit"
                >
                  <Edit className="mr-1.5 h-4 w-4" />
                  Editar
                </Button>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 px-2.5 rounded-lg text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => setIsDeleteReviewOpen(true)}
                  data-testid="performance-review-delete"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Excluir
                </Button>
              )}
            </div>
          }
        />
      </PageHeader>

      <PageBody>
        {/* ============================================================ */}
        {/* IDENTITY CARD                                                */}
        {/* ============================================================ */}
        <Card className="bg-white/5 p-5 mb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-violet-500/20">
              {employeePhotoUrl ? (
                <AvatarImage src={employeePhotoUrl} alt={employeeName} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-600 text-white text-base font-semibold">
                {getInitials(employeeName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold leading-tight">
                {employeeName}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <ChevronRight className="h-3 w-3" />
                <span>Avaliador: {reviewerName}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusColors?.bg ?? ''} ${statusColors?.text ?? ''} border-0`}
                  data-testid="performance-review-status-chip"
                >
                  {statusLabel}
                </Badge>
                {review.employeeAcknowledged && (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-0"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Reconhecida
                  </Badge>
                )}
                {cycleData && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {cycleData.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ============================================================ */}
        {/* GRID: AVALIACAO GERAL + RADAR                                */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Card Avaliacao Geral (1 col) */}
          <Card
            className="bg-white dark:bg-slate-800/60 border border-border p-5 md:col-span-1"
            data-testid="performance-review-overview"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
              <Star className="h-3.5 w-3.5" />
              Avaliacao Geral
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ScorePillar
                label="Auto"
                value={selfAggregate}
                accent="rose"
                testId="self-aggregate"
              />
              <ScorePillar
                label="Gestor"
                value={managerAggregate}
                accent="violet"
                testId="manager-aggregate"
              />
            </div>
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Diferenca (gestor — auto)
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffStyles.bg} ${diffStyles.text}`}
                >
                  {diffStyles.label}
                </span>
              </div>
              {review.finalScore !== null && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Nota final
                  </span>
                  <span className="text-sm font-semibold">
                    {formatScore(review.finalScore)}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Card Radar Comparativo (2 cols on md+) */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                Radar Comparativo
              </div>
              {competencies.length > 0 && canModify && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs"
                        onClick={() => seedDefaultsMutation.mutate()}
                        disabled={seedDefaultsMutation.isPending}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Restaurar competencias padrao
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <ReviewRadarChart
              competencies={competencies}
              height={280}
              onSeedDefaults={
                canModify ? () => seedDefaultsMutation.mutate() : undefined
              }
              isSeeding={seedDefaultsMutation.isPending}
            />
          </Card>
        </div>

        {/* ============================================================ */}
        {/* COMPETENCIES TABLE                                           */}
        {/* ============================================================ */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border mb-4">
          <div className="flex items-center justify-between p-4 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">
                Competencias ({competencies.length})
              </h2>
            </div>
            {canModify && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-2.5 rounded-lg text-sm"
                  onClick={() => seedDefaultsMutation.mutate()}
                  disabled={seedDefaultsMutation.isPending}
                >
                  <Sparkles className="mr-1.5 h-4 w-4 text-violet-500" />
                  Restaurar padroes
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
                  onClick={() => setIsAddingCompetency(true)}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Adicionar competencia
                </Button>
              </div>
            )}
          </div>

          {competencies.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma competencia cadastrada. Use o botao acima para
              restaurar as 5 competencias padrao.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="competencies-table">
                <thead className="text-xs text-muted-foreground border-b border-border/60">
                  <tr>
                    <th className="text-left font-medium px-4 py-3">Nome</th>
                    <th className="text-center font-medium px-4 py-3">Peso</th>
                    <th className="text-left font-medium px-4 py-3">Auto</th>
                    <th className="text-left font-medium px-4 py-3">Gestor</th>
                    <th className="text-left font-medium px-4 py-3">
                      Comentario
                    </th>
                    <th className="text-right font-medium px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {competencies.map(competency => (
                    <tr
                      key={competency.id}
                      className="border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{competency.name}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground tabular-nums">
                        x{competency.weight.toFixed(1)}
                      </td>
                      <td className="px-4 py-3">
                        <ScoreStars
                          value={competency.selfScore}
                          starColorClass="text-rose-400"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <ScoreStars
                          value={competency.managerScore}
                          starColorClass="text-violet-400"
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[24ch] truncate">
                        {competency.comments ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canModify && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => setEditingCompetency(competency)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                              onClick={() =>
                                setPendingDeleteCompetencyId(competency.id)
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ============================================================ */}
        {/* REFLEXOES                                                    */}
        {/* ============================================================ */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            Reflexoes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReflectionField
              icon={<User className="h-3.5 w-3.5 text-rose-500" />}
              label="Auto-avaliacao"
              content={review.selfComments}
            />
            <ReflectionField
              icon={<User className="h-3.5 w-3.5 text-violet-500" />}
              label="Avaliacao do gestor"
              content={review.managerComments}
            />
            <ReflectionField
              icon={<ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />}
              label="Pontos fortes"
              content={review.strengths}
            />
            <ReflectionField
              icon={<TrendingUp className="h-3.5 w-3.5 text-sky-500" />}
              label="Pontos a melhorar"
              content={review.improvements}
            />
            <ReflectionField
              icon={<Target className="h-3.5 w-3.5 text-amber-500" />}
              label="Metas"
              content={review.goals}
              fullWidth
            />
          </div>
        </Card>
      </PageBody>

      {/* ============================================================ */}
      {/* MODAIS                                                       */}
      {/* ============================================================ */}

      {/* Excluir review */}
      <VerifyActionPinModal
        isOpen={isDeleteReviewOpen}
        onClose={() => setIsDeleteReviewOpen(false)}
        onSuccess={() => {
          setIsDeleteReviewOpen(false);
          deleteReviewMutation.mutate();
        }}
        title="Excluir avaliacao"
        description={`Digite seu PIN de acao para excluir definitivamente a avaliacao de ${employeeName}. Esta operacao nao pode ser desfeita.`}
      />

      {/* Avancar status */}
      <VerifyActionPinModal
        isOpen={isAdvanceStatusOpen}
        onClose={() => setIsAdvanceStatusOpen(false)}
        onSuccess={() => {
          setIsAdvanceStatusOpen(false);
          advanceStatusMutation.mutate();
        }}
        title={nextStatusLabel || 'Avancar status'}
        description="Digite seu PIN de acao para avancar o status desta avaliacao. Notas e comentarios atuais serao preservados."
      />

      {/* Excluir competencia */}
      <VerifyActionPinModal
        isOpen={pendingDeleteCompetencyId !== null}
        onClose={() => setPendingDeleteCompetencyId(null)}
        onSuccess={() => {
          if (pendingDeleteCompetencyId) {
            deleteCompetencyMutation.mutate(pendingDeleteCompetencyId);
          }
          setPendingDeleteCompetencyId(null);
        }}
        title="Excluir competencia"
        description="Digite seu PIN de acao para remover esta competencia. As notas atribuidas serao perdidas."
      />

      {/* Editar competencia */}
      <CompetencyEditDialog
        competency={editingCompetency}
        open={editingCompetency !== null}
        onClose={() => setEditingCompetency(null)}
        onSave={payload => {
          if (!editingCompetency) return;
          updateCompetencyMutation.mutate(
            { competencyId: editingCompetency.id, payload },
            {
              onSuccess: () => {
                setEditingCompetency(null);
                toast.success('Competencia atualizada com sucesso');
              },
            }
          );
        }}
        isSaving={updateCompetencyMutation.isPending}
      />

      {/* Adicionar competencia */}
      <CompetencyCreateDialog
        open={isAddingCompetency}
        onClose={() => setIsAddingCompetency(false)}
        onSave={payload => {
          createCompetencyMutation.mutate(payload, {
            onSuccess: () => setIsAddingCompetency(false),
          });
        }}
        isSaving={createCompetencyMutation.isPending}
      />
    </PageLayout>
  );
}

// ============================================================================
// SCORE PILLAR
// ============================================================================

function ScorePillar({
  label,
  value,
  accent,
  testId,
}: {
  label: string;
  value: number | null;
  accent: 'rose' | 'violet';
  testId?: string;
}) {
  const accentClass =
    accent === 'rose'
      ? 'text-rose-600 dark:text-rose-300'
      : 'text-violet-600 dark:text-violet-300';

  return (
    <div className="flex flex-col items-center justify-center py-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-border/40">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </span>
      <span
        className={`text-2xl font-semibold tabular-nums ${accentClass}`}
        data-testid={testId}
      >
        {formatScore(value)}
      </span>
    </div>
  );
}

// ============================================================================
// REFLECTION FIELD
// ============================================================================

function ReflectionField({
  icon,
  label,
  content,
  fullWidth = false,
}: {
  icon: React.ReactNode;
  label: string;
  content: string | null;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'md:col-span-2' : undefined}>
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
        {icon}
        {label}
      </div>
      <div className="rounded-lg bg-slate-50/80 dark:bg-slate-900/30 border border-border/40 p-3 min-h-[80px]">
        {content ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        ) : (
          <p className="text-xs italic text-muted-foreground">
            Nao preenchido
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// COMPETENCY EDIT DIALOG
// ============================================================================

interface CompetencyEditPayload {
  name?: string;
  weight?: number;
  selfScore?: number | null;
  managerScore?: number | null;
  comments?: string | null;
}

function CompetencyEditDialog({
  competency,
  open,
  onClose,
  onSave,
  isSaving,
}: {
  competency: ReviewCompetency | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: CompetencyEditPayload) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [managerScore, setManagerScore] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  // Hydrate quando o modal abre / muda de competencia.
  useEffect(() => {
    if (competency) {
      setName(competency.name);
      setWeight(String(competency.weight));
      setSelfScore(competency.selfScore);
      setManagerScore(competency.managerScore);
      setComments(competency.comments ?? '');
    }
  }, [competency]);

  if (!competency) return null;

  const handleSave = () => {
    const parsedWeight = Number(weight);
    onSave({
      name: name.trim(),
      weight: Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : 1,
      selfScore,
      managerScore,
      comments: comments.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Editar competencia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="competency-name">Nome</Label>
            <Input
              id="competency-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Ex: Comunicacao"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="competency-weight">Peso (multiplicador)</Label>
            <Input
              id="competency-weight"
              type="number"
              step="0.5"
              min="0.5"
              value={weight}
              onChange={event => setWeight(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Auto-avaliacao</Label>
              <ScoreSlider
                value={selfScore}
                onChange={next => setSelfScore(next)}
                starColorClass="text-rose-400"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Avaliacao do gestor</Label>
              <ScoreSlider
                value={managerScore}
                onChange={next => setManagerScore(next)}
                starColorClass="text-violet-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="competency-comments">Comentario</Label>
            <Textarea
              id="competency-comments"
              value={comments}
              onChange={event => setComments(event.target.value)}
              rows={3}
              placeholder="Observacoes sobre o desempenho nesta competencia..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5 rounded-lg text-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            Salvar alteracoes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// COMPETENCY CREATE DIALOG (somente nome + peso, scores via edit)
// ============================================================================

function CompetencyCreateDialog({
  open,
  onClose,
  onSave,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (payload: { name: string; weight?: number }) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');

  const handleSave = () => {
    const parsedWeight = Number(weight);
    onSave({
      name: name.trim(),
      weight:
        Number.isFinite(parsedWeight) && parsedWeight > 0
          ? parsedWeight
          : undefined,
    });
    setName('');
    setWeight('1');
  };

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Adicionar competencia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-competency-name">Nome</Label>
            <Input
              id="new-competency-name"
              value={name}
              onChange={event => setName(event.target.value)}
              placeholder="Ex: Lideranca"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-competency-weight">Peso (multiplicador)</Label>
            <Input
              id="new-competency-weight"
              type="number"
              step="0.5"
              min="0.5"
              value={weight}
              onChange={event => setWeight(event.target.value)}
            />
          </div>

          <div className="rounded-lg bg-violet-50/60 dark:bg-violet-500/8 border border-violet-200 dark:border-violet-500/20 p-3 flex items-start gap-2">
            <ClipboardCheck className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              As notas (auto e gestor) podem ser atribuidas em seguida atraves
              do botao "Editar" da competencia.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5 rounded-lg text-sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
