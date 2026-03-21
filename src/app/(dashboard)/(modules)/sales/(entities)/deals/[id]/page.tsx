'use client';

import { useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { useDeal, useUpdateDeal, useDeleteDeal, useChangeDealStage } from '@/hooks/sales/use-deals';
import { useTimeline } from '@/hooks/sales/use-timeline';
import { useActivitiesInfinite, useCreateActivity } from '@/hooks/sales/use-activities';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Check,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Plus,
  Send,
  Trophy,
  XCircle,
  Target,
} from 'lucide-react';
import type {
  Deal,
  DealStatus,
  PipelineStage,
  TimelineItem,
  Activity,
} from '@/types/sales';
import {
  DEAL_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
} from '@/types/sales';

/* ──────────────────────────────────────────────────────────
   Status styles
   ────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<
  DealStatus,
  { bg: string; text: string; icon: React.ElementType }
> = {
  OPEN: {
    bg: 'bg-blue-50 dark:bg-blue-500/8',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Target,
  },
  WON: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: Trophy,
  },
  LOST: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
    icon: XCircle,
  },
  ARCHIVED: {
    bg: 'bg-slate-100 dark:bg-slate-500/8',
    text: 'text-slate-600 dark:text-slate-400',
    icon: FileText,
  },
};

/* ══════════════════════════════════════════════════════════
   Deal Detail Content
   ══════════════════════════════════════════════════════════ */

function DealDetailContent() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const { hasPermission } = usePermissions();
  const canModify = hasPermission(PERMISSIONS.SALES.DEALS.MODIFY);
  const canDelete = hasPermission(PERMISSIONS.SALES.DEALS.REMOVE);

  const { data: dealData, isLoading, isError } = useDeal(dealId);
  const changeDealStage = useChangeDealStage();
  const deleteDeal = useDeleteDeal();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const deal = dealData?.deal;

  // Timeline
  const { items: timelineItems, isLoading: timelineLoading } = useTimeline(
    dealId,
    'deal'
  );

  // Activities
  const { activities, isLoading: activitiesLoading } = useActivitiesInfinite({
    dealId,
  });

  const createActivity = useCreateActivity();

  // Pipeline stages sorted
  const stages = useMemo(
    () =>
      deal?.pipeline?.stages
        ? [...deal.pipeline.stages].sort((a, b) => a.position - b.position)
        : [],
    [deal?.pipeline?.stages]
  );

  function handleStageClick(stage: PipelineStage) {
    if (!canModify || !deal) return;
    if (stage.id === deal.stageId) return;

    changeDealStage.mutate(
      { dealId: deal.id, data: { stageId: stage.id } },
      {
        onSuccess: () => {
          toast.success(`Negocio movido para "${stage.name}".`);
        },
        onError: () => {
          toast.error('Erro ao alterar etapa do negocio.');
        },
      }
    );
  }

  function handleDelete() {
    if (!deal) return;
    deleteDeal.mutate(deal.id, {
      onSuccess: () => {
        toast.success('Negocio excluido com sucesso.');
        router.push(
          deal.pipelineId
            ? `/sales/pipelines/${deal.pipelineId}`
            : '/sales/pipelines'
        );
      },
      onError: () => {
        toast.error('Erro ao excluir negocio.');
      },
    });
  }

  function handleAddNote() {
    if (!noteText.trim() || !deal) return;
    createActivity.mutate(
      {
        type: 'NOTE',
        subject: 'Nota',
        description: noteText.trim(),
        dealId: deal.id,
      },
      {
        onSuccess: () => {
          toast.success('Nota adicionada.');
          setNoteText('');
        },
        onError: () => {
          toast.error('Erro ao adicionar nota.');
        },
      }
    );
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  /* ── Error ── */
  if (isError || !deal) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Negocio nao encontrado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          O negocio solicitado nao existe ou voce nao tem permissao para
          acessa-lo.
        </p>
        <Link href="/sales/pipelines">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Pipelines
          </Button>
        </Link>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[deal.status];
  const StatusIcon = statusStyle.icon;

  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Pipelines', href: '/sales/pipelines' },
          ...(deal.pipeline
            ? [
                {
                  label: deal.pipeline.name,
                  href: `/sales/pipelines/${deal.pipelineId}`,
                },
              ]
            : []),
          { label: deal.title },
        ]}
        buttons={[
          ...(canDelete
            ? [
                {
                  id: 'delete',
                  title: 'Excluir',
                  icon: Trash2,
                  variant: 'destructive' as const,
                  onClick: () => setShowDeleteModal(true),
                },
              ]
            : []),
        ]}
      />

      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <DollarSign className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{deal.title}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {deal.pipeline && (
                  <>
                    <span>{deal.pipeline.name}</span>
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
                {deal.stage && <span>{deal.stage.name}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Value */}
            {deal.value !== undefined && deal.value !== null && (
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(deal.value)}
              </div>
            )}

            {/* Status badge */}
            <Badge
              variant="secondary"
              className={cn('gap-1', statusStyle.bg, statusStyle.text)}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {DEAL_STATUS_LABELS[deal.status]}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Stage Selector (visual step indicator) */}
      {stages.length > 0 && (
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {stages.map((stage, idx) => {
              const isCurrent = stage.id === deal.stageId;
              const currentIdx = stages.findIndex(s => s.id === deal.stageId);
              const isPast = idx < currentIdx;
              const isWon = stage.type === 'WON';
              const isLost = stage.type === 'LOST';

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => handleStageClick(stage)}
                  disabled={!canModify}
                  className={cn(
                    'flex-1 min-w-0 relative flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all',
                    'border',
                    isCurrent && !isWon && !isLost &&
                      'bg-violet-50 dark:bg-violet-500/10 border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-violet-300',
                    isCurrent && isWon &&
                      'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
                    isCurrent && isLost &&
                      'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300',
                    isPast &&
                      'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400',
                    !isCurrent && !isPast &&
                      'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-500',
                    canModify && 'cursor-pointer hover:border-violet-300 dark:hover:border-violet-500/30',
                    !canModify && 'cursor-default'
                  )}
                >
                  {isPast && <Check className="h-3 w-3 shrink-0" />}
                  {isWon && isCurrent && (
                    <Trophy className="h-3 w-3 shrink-0" />
                  )}
                  {isLost && isCurrent && (
                    <XCircle className="h-3 w-3 shrink-0" />
                  )}
                  <span className="truncate">{stage.name}</span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Value */}
              <DetailRow
                icon={DollarSign}
                label="Valor"
                value={formatCurrency(deal.value)}
              />

              {/* Currency */}
              <DetailRow
                icon={DollarSign}
                label="Moeda"
                value={deal.currency || 'BRL'}
              />

              {/* Expected close date */}
              <DetailRow
                icon={Calendar}
                label="Previsao de Fechamento"
                value={
                  deal.expectedCloseDate
                    ? new Date(deal.expectedCloseDate).toLocaleDateString(
                        'pt-BR'
                      )
                    : 'Nao definida'
                }
              />

              {/* Probability */}
              <DetailRow
                icon={Target}
                label="Probabilidade"
                value={
                  deal.probability !== undefined && deal.probability !== null
                    ? `${deal.probability}%`
                    : 'Nao definida'
                }
              />

              {/* Assigned to */}
              <DetailRow
                icon={User}
                label="Responsavel"
                value={deal.assignedToUserId || 'Nao atribuido'}
              />

              {/* Customer */}
              <DetailRow
                icon={User}
                label="Cliente"
                value={deal.customer?.name || 'Nenhum'}
              />

              {/* Created at */}
              <DetailRow
                icon={Clock}
                label="Criado em"
                value={new Date(deal.createdAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />

              {/* Tags */}
              {deal.tags && deal.tags.length > 0 && (
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground mb-1 block">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {deal.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-8">
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Contatos vinculados ao negocio serao exibidos aqui.
              </p>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            {timelineLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!timelineLoading && timelineItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Clock className="h-8 w-8 text-slate-400" />
                <p className="text-sm text-muted-foreground">
                  Nenhum evento na timeline ainda.
                </p>
              </div>
            )}

            {!timelineLoading && timelineItems.length > 0 && (
              <div className="space-y-4">
                {timelineItems.map(item => (
                  <TimelineItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            {/* Quick note creation */}
            <div className="flex gap-3 mb-6">
              <Textarea
                placeholder="Adicionar uma nota..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                size="sm"
                className="self-end gap-1.5"
                onClick={handleAddNote}
                disabled={!noteText.trim() || createActivity.isPending}
              >
                <Send className="h-3.5 w-3.5" />
                Enviar
              </Button>
            </div>

            {/* Notes list (from activities filtered by NOTE type) */}
            {activitiesLoading && (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            )}

            {!activitiesLoading && (
              <div className="space-y-3">
                {activities
                  .filter(a => a.type === 'NOTE')
                  .map(activity => (
                    <div
                      key={activity.id}
                      className="p-3 rounded-lg border border-border bg-muted/20"
                    >
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(activity.createdAt).toLocaleDateString(
                            'pt-BR',
                            {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  ))}

                {activities.filter(a => a.type === 'NOTE').length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma nota adicionada ainda.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Modal */}
      <VerifyActionPinModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDelete}
        title="Confirmar Exclusao"
        description={`Digite seu PIN de acao para excluir o negocio "${deal.title}".`}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────── */

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-xs text-muted-foreground block">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  ACTIVITY: Phone,
  DEAL_CREATED: Plus,
  DEAL_STAGE_CHANGED: ChevronRight,
  DEAL_WON: Trophy,
  DEAL_LOST: XCircle,
  NOTE: MessageSquare,
  EMAIL: Mail,
  CONTACT_CREATED: User,
};

function TimelineItemRow({ item }: { item: TimelineItem }) {
  const Icon = TIMELINE_ICONS[item.type] || Clock;

  return (
    <div className="flex gap-3 items-start">
      <div className="p-1.5 rounded-lg bg-muted/50 shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {item.description}
          </p>
        )}
        <span className="text-xs text-muted-foreground mt-1 block">
          {new Date(item.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Page Export
   ────────────────────────────────────────────────────────── */

export default function DealDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <DealDetailContent />
    </Suspense>
  );
}
