/**
 * OpenSea OS - Performance Review Edit Page (Lattice-style)
 *
 * Pagina de edicao de uma performance review com:
 *   - CollapsibleSection: Auto-avaliacao (textarea + score slider)
 *   - CollapsibleSection: Avaliacao do gestor (textarea + score slider)
 *   - CollapsibleSection: Pontos fortes / a melhorar / metas
 *   - CollapsibleSection: Competencias (lista editavel inline)
 *
 * Persiste via:
 *   - PATCH /v1/hr/performance-reviews/:id/self-assessment
 *   - PATCH /v1/hr/performance-reviews/:id/manager-review
 *   - PATCH/POST/DELETE /v1/hr/performance-reviews/:id/competencies/...
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { ScoreSlider } from '@/components/hr/score-slider';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCreateCompetency,
  useDeleteCompetency,
  useReviewWithCompetencies,
  useSeedDefaults,
  useUpdateCompetency,
} from '@/hooks/hr/use-review-competencies';
import { reviewsService } from '@/services/hr/reviews.service';
import type { ReviewCompetency } from '@/types/hr';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Star,
  Target,
  ThumbsUp,
  Trash2,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { HR_PERMISSIONS } from '../../../../../../_shared/constants/hr-permissions';
import { performanceReviewKeys } from '@/hooks/hr/use-review-competencies';

import { CollapsibleSection } from '@/components/hr/collapsible-section';

const REVIEW_SECTION_WRAPPER = 'border-b border-border/40 last:border-0';
const REVIEW_SECTION_BODY = 'px-5 pb-4 pt-1';

// ============================================================================
// PAGE
// ============================================================================

export default function PerformanceReviewEditPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const cycleId = params.id as string;
  const reviewId = params.reviewId as string;

  const canModify = hasPermission(HR_PERMISSIONS.REVIEWS.UPDATE);

  // ==========================================================================
  // DATA
  // ==========================================================================

  const {
    data: bundle,
    isLoading,
    error,
  } = useReviewWithCompetencies(reviewId);
  const review = bundle?.review;
  const remoteCompetencies = bundle?.competencies ?? [];

  // ==========================================================================
  // FORM STATE
  // ==========================================================================

  // Reflexoes
  const [selfComments, setSelfComments] = useState('');
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [managerComments, setManagerComments] = useState('');
  const [managerScore, setManagerScore] = useState<number | null>(null);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [goals, setGoals] = useState('');

  // Competencias locais (espelham as do servidor + edicoes pendentes)
  const [localCompetencies, setLocalCompetencies] = useState<
    ReviewCompetency[]
  >([]);

  // Hidrata o form quando a review chega.
  useEffect(() => {
    if (review) {
      setSelfComments(review.selfComments ?? '');
      setSelfScore(review.selfScore);
      setManagerComments(review.managerComments ?? '');
      setManagerScore(review.managerScore);
      setStrengths(review.strengths ?? '');
      setImprovements(review.improvements ?? '');
      setGoals(review.goals ?? '');
    }
  }, [review]);

  useEffect(() => {
    setLocalCompetencies(remoteCompetencies);
  }, [remoteCompetencies]);

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const createCompetencyMutation = useCreateCompetency(reviewId);
  const updateCompetencyMutation = useUpdateCompetency(reviewId);
  const deleteCompetencyMutation = useDeleteCompetency(reviewId);
  const seedDefaultsMutation = useSeedDefaults(reviewId);

  const saveSelfMutation = useMutation({
    mutationFn: () =>
      reviewsService.submitSelfAssessment(reviewId, {
        selfScore: selfScore ?? 0,
        selfComments: selfComments.trim() || undefined,
        strengths: strengths.trim() || undefined,
        improvements: improvements.trim() || undefined,
        goals: goals.trim() || undefined,
      }),
  });

  const saveManagerMutation = useMutation({
    mutationFn: () =>
      reviewsService.submitManagerReview(reviewId, {
        managerScore: managerScore ?? 0,
        managerComments: managerComments.trim() || undefined,
        strengths: strengths.trim() || undefined,
        improvements: improvements.trim() || undefined,
        goals: goals.trim() || undefined,
      }),
  });

  const [isSaving, setIsSaving] = useState(false);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  /**
   * Aplica em batch as alteracoes nas competencias locais (apenas as que
   * realmente mudaram em relacao ao servidor).
   */
  const persistCompetencyEdits = async () => {
    const tasks: Promise<unknown>[] = [];
    for (const local of localCompetencies) {
      const remote = remoteCompetencies.find(c => c.id === local.id);
      if (!remote) continue;
      const changed =
        remote.name !== local.name ||
        remote.weight !== local.weight ||
        remote.selfScore !== local.selfScore ||
        remote.managerScore !== local.managerScore ||
        (remote.comments ?? '') !== (local.comments ?? '');
      if (changed) {
        tasks.push(
          updateCompetencyMutation.mutateAsync({
            competencyId: local.id,
            payload: {
              name: local.name,
              weight: local.weight,
              selfScore: local.selfScore,
              managerScore: local.managerScore,
              comments: local.comments,
            },
          })
        );
      }
    }
    await Promise.all(tasks);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // Salva reflexoes (self e manager) e competencias em paralelo.
      await Promise.all([
        saveSelfMutation.mutateAsync(),
        saveManagerMutation.mutateAsync(),
        persistCompetencyEdits(),
      ]);
      queryClient.invalidateQueries({
        queryKey: performanceReviewKeys.detail(reviewId),
      });
      toast.success('Avaliacao salva com sucesso');
      router.push(`/hr/reviews/${cycleId}/review/${reviewId}`);
    } catch {
      toast.error('Erro ao salvar avaliacao');
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================================================
  // LOADING / ERROR / FORBIDDEN
  // ==========================================================================

  if (isLoading) {
    return (
      <PageLayout data-testid="performance-review-edit-loading">
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
      <PageLayout data-testid="performance-review-edit-error">
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

  if (!canModify) {
    return (
      <PageLayout data-testid="performance-review-edit-forbidden">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Avaliacoes', href: '/hr/reviews' },
              { label: 'Editar' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError message="Voce nao tem permissao para editar avaliacoes" />
        </PageBody>
      </PageLayout>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout data-testid="performance-review-edit-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Avaliacoes', href: '/hr/reviews' },
            { label: 'Ciclo', href: `/hr/reviews/${cycleId}` },
            {
              label: 'Avaliacao',
              href: `/hr/reviews/${cycleId}/review/${reviewId}`,
            },
            { label: 'Editar' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-2.5 rounded-lg text-sm"
                onClick={() =>
                  router.push(`/hr/reviews/${cycleId}/review/${reviewId}`)
                }
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
                onClick={handleSaveAll}
                disabled={isSaving}
                data-testid="performance-review-save"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    Salvar alteracoes
                  </>
                )}
              </Button>
            </div>
          }
        />
      </PageHeader>

      <PageBody>
        {/* Identity strip */}
        <Card className="bg-white/5 p-5 mb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold">Editar avaliacao</h1>
            <p className="text-xs text-muted-foreground">
              Preencha as secoes abaixo. As alteracoes sao salvas em batch.
            </p>
          </div>
        </Card>

        {/* Reflexoes (self / manager / strengths / improvements / goals) */}
        <Card className="bg-white/5 py-2 overflow-hidden mb-4">
          <CollapsibleSection
            icon={User}
            iconColorClass="text-rose-500"
            title="Auto-avaliacao"
            subtitle="Reflexao do colaborador sobre o proprio desempenho"
          
            wrapperClassName={REVIEW_SECTION_WRAPPER}
            bodyClassName={REVIEW_SECTION_BODY}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nota geral (auto)</Label>
                <ScoreSlider
                  value={selfScore}
                  onChange={next => setSelfScore(next)}
                  starColorClass="text-rose-400"
                  testId="self-score-slider"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="self-comments">Comentarios</Label>
                <Textarea
                  id="self-comments"
                  value={selfComments}
                  onChange={event => setSelfComments(event.target.value)}
                  rows={4}
                  placeholder="Compartilhe sua reflexao sobre os ultimos meses..."
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={Users}
            iconColorClass="text-violet-500"
            title="Avaliacao do gestor"
            subtitle="Visao do gestor direto sobre o desempenho do colaborador"
          
            wrapperClassName={REVIEW_SECTION_WRAPPER}
            bodyClassName={REVIEW_SECTION_BODY}
          >
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nota geral (gestor)</Label>
                <ScoreSlider
                  value={managerScore}
                  onChange={next => setManagerScore(next)}
                  starColorClass="text-violet-400"
                  testId="manager-score-slider"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="manager-comments">Comentarios</Label>
                <Textarea
                  id="manager-comments"
                  value={managerComments}
                  onChange={event => setManagerComments(event.target.value)}
                  rows={4}
                  placeholder="Avaliacao detalhada do gestor..."
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={ThumbsUp}
            iconColorClass="text-emerald-500"
            title="Pontos fortes / a melhorar / metas"
            subtitle="Sintese qualitativa para os proximos ciclos"
          
            wrapperClassName={REVIEW_SECTION_WRAPPER}
            bodyClassName={REVIEW_SECTION_BODY}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="strengths"
                  className="flex items-center gap-1.5"
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                  Pontos fortes
                </Label>
                <Textarea
                  id="strengths"
                  value={strengths}
                  onChange={event => setStrengths(event.target.value)}
                  rows={4}
                  placeholder="O que mais se destacou neste ciclo?"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="improvements"
                  className="flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-sky-500" />
                  Pontos a melhorar
                </Label>
                <Textarea
                  id="improvements"
                  value={improvements}
                  onChange={event => setImprovements(event.target.value)}
                  rows={4}
                  placeholder="Quais comportamentos ou habilidades podem evoluir?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="goals" className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-amber-500" />
                  Metas
                </Label>
                <Textarea
                  id="goals"
                  value={goals}
                  onChange={event => setGoals(event.target.value)}
                  rows={4}
                  placeholder="Compromissos para o proximo ciclo..."
                />
              </div>
            </div>
          </CollapsibleSection>
        </Card>

        {/* Competencias */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <CollapsibleSection
            icon={Star}
            iconColorClass="text-amber-500"
            title="Competencias"
            subtitle={`${localCompetencies.length} competencia(s) avaliada(s)`}
          
            wrapperClassName={REVIEW_SECTION_WRAPPER}
            bodyClassName={REVIEW_SECTION_BODY}
          >
            <CompetenciesEditor
              competencies={localCompetencies}
              onChange={setLocalCompetencies}
              onSeedDefaults={() => seedDefaultsMutation.mutate()}
              isSeeding={seedDefaultsMutation.isPending}
              onAddNew={(name, weight) =>
                createCompetencyMutation.mutate({ name, weight })
              }
              isAdding={createCompetencyMutation.isPending}
              onDelete={competencyId =>
                deleteCompetencyMutation.mutate(competencyId)
              }
              isDeleting={deleteCompetencyMutation.isPending}
            />
          </CollapsibleSection>
        </Card>
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// COMPETENCIES EDITOR (inline list)
// ============================================================================

function CompetenciesEditor({
  competencies,
  onChange,
  onSeedDefaults,
  isSeeding,
  onAddNew,
  isAdding,
  onDelete,
  isDeleting,
}: {
  competencies: ReviewCompetency[];
  onChange: (next: ReviewCompetency[]) => void;
  onSeedDefaults: () => void;
  isSeeding: boolean;
  onAddNew: (name: string, weight: number) => void;
  isAdding: boolean;
  onDelete: (competencyId: string) => void;
  isDeleting: boolean;
}) {
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState('1');

  const updateField = (
    competencyId: string,
    field: keyof ReviewCompetency,
    value: string | number | null
  ) => {
    onChange(
      competencies.map(competency =>
        competency.id === competencyId
          ? { ...competency, [field]: value }
          : competency
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          variant="outline"
          className="h-9 px-2.5 rounded-lg text-sm"
          onClick={onSeedDefaults}
          disabled={isSeeding}
        >
          <Sparkles className="mr-1.5 h-4 w-4 text-violet-500" />
          Restaurar padroes
        </Button>
      </div>

      {competencies.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Nenhuma competencia. Use "Restaurar padroes" para criar as 5
          competencias-base ou adicione manualmente abaixo.
        </div>
      ) : (
        <div className="space-y-2">
          {competencies.map(competency => (
            <div
              key={competency.id}
              className="rounded-lg border border-border/60 bg-white dark:bg-slate-800/40 p-3"
              data-testid={`competency-row-${competency.id}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                {/* Nome */}
                <div className="md:col-span-3">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Nome
                  </Label>
                  <Input
                    value={competency.name}
                    onChange={event =>
                      updateField(competency.id, 'name', event.target.value)
                    }
                    className="mt-1 h-9"
                  />
                </div>

                {/* Peso */}
                <div className="md:col-span-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Peso
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={competency.weight}
                    onChange={event =>
                      updateField(
                        competency.id,
                        'weight',
                        Number(event.target.value) || 1
                      )
                    }
                    className="mt-1 h-9 text-center"
                  />
                </div>

                {/* Self */}
                <div className="md:col-span-3">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Auto
                  </Label>
                  <div className="mt-1.5">
                    <ScoreSlider
                      value={competency.selfScore}
                      onChange={next =>
                        updateField(competency.id, 'selfScore', next)
                      }
                      starColorClass="text-rose-400"
                      hideStars
                    />
                  </div>
                </div>

                {/* Manager */}
                <div className="md:col-span-3">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Gestor
                  </Label>
                  <div className="mt-1.5">
                    <ScoreSlider
                      value={competency.managerScore}
                      onChange={next =>
                        updateField(competency.id, 'managerScore', next)
                      }
                      starColorClass="text-violet-400"
                      hideStars
                    />
                  </div>
                </div>

                {/* Acoes */}
                <div className="md:col-span-2 flex justify-end items-end h-full">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    onClick={() => onDelete(competency.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Comentario */}
                <div className="md:col-span-12">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Comentario
                  </Label>
                  <Textarea
                    value={competency.comments ?? ''}
                    onChange={event =>
                      updateField(
                        competency.id,
                        'comments',
                        event.target.value || null
                      )
                    }
                    rows={2}
                    className="mt-1"
                    placeholder="Observacoes sobre o desempenho nesta competencia..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new competency */}
      <div className="rounded-lg border border-dashed border-border/60 bg-slate-50/50 dark:bg-slate-900/20 p-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label
              htmlFor="new-competency"
              className="text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Nova competencia
            </Label>
            <Input
              id="new-competency"
              value={newName}
              onChange={event => setNewName(event.target.value)}
              placeholder="Ex: Adaptabilidade"
              className="mt-1 h-9"
            />
          </div>
          <div className="w-20">
            <Label
              htmlFor="new-weight"
              className="text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              Peso
            </Label>
            <Input
              id="new-weight"
              type="number"
              step="0.5"
              min="0.5"
              value={newWeight}
              onChange={event => setNewWeight(event.target.value)}
              className="mt-1 h-9 text-center"
            />
          </div>
          <Button
            size="sm"
            className="h-9 px-2.5 rounded-lg text-sm shadow-sm"
            onClick={() => {
              if (!newName.trim()) {
                toast.error('Informe o nome da competencia');
                return;
              }
              onAddNew(newName.trim(), Number(newWeight) || 1);
              setNewName('');
              setNewWeight('1');
            }}
            disabled={isAdding || !newName.trim()}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
