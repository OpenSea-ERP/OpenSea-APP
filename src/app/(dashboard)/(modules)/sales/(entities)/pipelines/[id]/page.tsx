'use client';

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  Suspense,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { cn, formatCurrency } from '@/lib/utils';
import { usePipeline } from '@/hooks/sales/use-pipelines';
import { useDealsInfinite, useChangeDealStage } from '@/hooks/sales/use-deals';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  GitBranch,
  AlertTriangle,
  ArrowLeft,
  Search,
  Plus,
  Clock,
  AlertCircle,
  Trophy,
  XCircle,
  User,
} from 'lucide-react';
import type { Deal, PipelineStage, PipelineStageType } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

function getDaysInStage(stageEnteredAt?: string): number {
  if (!stageEnteredAt) return 0;
  const entered = new Date(stageEnteredAt);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}

function getDaysLabel(days: number): string {
  if (days === 0) return 'Hoje';
  if (days === 1) return '1 dia';
  return `${days} dias`;
}

function getStageColumnStyle(type: PipelineStageType): {
  bgClass: string;
  borderClass: string;
  headerBg: string;
} {
  switch (type) {
    case 'WON':
      return {
        bgClass: 'bg-emerald-50/50 dark:bg-emerald-500/[0.03]',
        borderClass: 'border-emerald-200 dark:border-emerald-500/20',
        headerBg: 'from-emerald-500/10 to-emerald-500/5',
      };
    case 'LOST':
      return {
        bgClass: 'bg-rose-50/50 dark:bg-rose-500/[0.03]',
        borderClass: 'border-rose-200 dark:border-rose-500/20',
        headerBg: 'from-rose-500/10 to-rose-500/5',
      };
    default:
      return {
        bgClass: 'bg-muted/20 dark:bg-white/[0.02]',
        borderClass: 'border-gray-200 dark:border-white/10',
        headerBg: '',
      };
  }
}

/* ──────────────────────────────────────────────────────────
   Build stage → deals map
   ────────────────────────────────────────────────────────── */

function buildDealMap(
  stageIds: string[],
  deals: Deal[]
): Map<string, Deal[]> {
  const map = new Map<string, Deal[]>();
  for (const id of stageIds) map.set(id, []);
  for (const deal of deals) {
    const arr = map.get(deal.stageId);
    if (arr) arr.push(deal);
  }
  return map;
}

/* ═══════════════════════════════════════════════════════════
   Pipeline Kanban Board Page
   ═══════════════════════════════════════════════════════════ */

function PipelineKanbanContent() {
  const params = useParams();
  const router = useRouter();
  const pipelineId = params.id as string;
  const queryClient = useQueryClient();

  const { hasPermission } = usePermissions();
  const canAccessDeals = hasPermission(PERMISSIONS.SALES.DEALS.ACCESS);
  const canCreateDeals = hasPermission(PERMISSIONS.SALES.DEALS.REGISTER);

  const {
    data: pipelineData,
    isLoading: pipelineLoading,
    isError: pipelineError,
  } = usePipeline(pipelineId);

  const { deals, isLoading: dealsLoading } = useDealsInfinite({
    pipelineId,
    status: 'OPEN',
  });

  // Also load WON/LOST deals for those columns
  const { deals: wonDeals } = useDealsInfinite({
    pipelineId,
    status: 'WON',
  });
  const { deals: lostDeals } = useDealsInfinite({
    pipelineId,
    status: 'LOST',
  });

  const allDeals = useMemo(
    () => [...deals, ...wonDeals, ...lostDeals],
    [deals, wonDeals, lostDeals]
  );

  const changeDealStage = useChangeDealStage();

  const [search, setSearch] = useState('');

  const pipeline = pipelineData?.pipeline;

  const stages = useMemo(
    () => [...(pipeline?.stages ?? [])].sort((a, b) => a.position - b.position),
    [pipeline?.stages]
  );

  const stageIds = useMemo(() => stages.map(s => s.id), [stages]);

  // Filter deals by search
  const filteredDeals = useMemo(() => {
    if (!search.trim()) return allDeals;
    const q = search.trim().toLowerCase();
    return allDeals.filter(
      d =>
        d.title.toLowerCase().includes(q) ||
        d.customer?.name?.toLowerCase().includes(q)
    );
  }, [allDeals, search]);

  const dealsByStage = useMemo(
    () => buildDealMap(stageIds, filteredDeals),
    [stageIds, filteredDeals]
  );

  // Compute totals per stage
  const stageTotals = useMemo(() => {
    const totals = new Map<string, { count: number; value: number }>();
    for (const [stageId, stageDeals] of dealsByStage) {
      totals.set(stageId, {
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
      });
    }
    return totals;
  }, [dealsByStage]);

  /* ── Drag End Handler with Optimistic Update ── */

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId) return;

      const dealId = draggableId;
      const newStageId = destination.droppableId;
      const targetStage = stages.find(s => s.id === newStageId);

      // Optimistic: update deals cache
      queryClient.setQueriesData(
        { queryKey: ['deals'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          return old;
        }
      );

      changeDealStage.mutate(
        {
          dealId,
          data: { stageId: newStageId },
        },
        {
          onSuccess: () => {
            toast.success(
              `Negocio movido para "${targetStage?.name ?? 'nova etapa'}".`
            );
            // Invalidate all deals queries to refresh
            queryClient.invalidateQueries({ queryKey: ['deals'] });
          },
          onError: () => {
            toast.error('Erro ao mover negocio. Tente novamente.');
            queryClient.invalidateQueries({ queryKey: ['deals'] });
          },
        }
      );
    },
    [changeDealStage, stages, queryClient]
  );

  /* ── Viewport height for kanban scroll ── */
  const viewRef = useRef<HTMLDivElement>(null);
  const [viewHeight, setViewHeight] = useState<number | undefined>();

  const updateViewHeight = useCallback(() => {
    const el = viewRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    setViewHeight(Math.max(200, window.innerHeight - top - 16));
  }, []);

  useEffect(() => {
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(updateViewHeight);
    });
    window.addEventListener('resize', updateViewHeight);
    document.documentElement.style.overflow = 'hidden';

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateViewHeight);
      document.documentElement.style.overflow = '';
    };
  }, [updateViewHeight, pipelineLoading]);

  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  /* ── Loading state ── */
  if (pipelineLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex gap-3 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-72 space-y-3">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (pipelineError || !pipeline) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Pipeline nao encontrado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          O pipeline solicitado nao existe ou voce nao tem permissao para
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

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Pipelines', href: '/sales/pipelines' },
          { label: pipeline.name },
        ]}
        buttons={[
          ...(canCreateDeals
            ? [
                {
                  id: 'create-deal',
                  title: 'Novo Negocio',
                  icon: Plus,
                  variant: 'default' as const,
                  onClick: () => {
                    toast.info('Criacao rapida de negocio em breve.');
                  },
                },
              ]
            : []),
        ]}
      />

      {/* Hero Banner */}
      <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
        {/* Decorative blobs */}
        <div
          className="absolute top-0 right-0 w-44 h-44 rounded-full opacity-60 -translate-y-1/2 translate-x-1/2"
          style={{
            backgroundColor: pipeline.color
              ? `${pipeline.color}25`
              : '#8b5cf625',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-60 translate-y-1/2 -translate-x-1/2"
          style={{
            backgroundColor: pipeline.color
              ? `${pipeline.color}20`
              : '#8b5cf620',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: pipeline.color
                    ? `linear-gradient(135deg, ${pipeline.color}, ${pipeline.color}cc)`
                    : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                }}
              >
                <GitBranch className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                  {pipeline.name}
                </h1>
                {pipeline.description && (
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    {pipeline.description}
                  </p>
                )}
              </div>
            </div>

            {/* Summary stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {allDeals.length}
                </div>
                <div className="text-xs text-muted-foreground">Negocios</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {formatCurrency(
                    allDeals.reduce((sum, d) => sum + (d.value ?? 0), 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Valor Total
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-slate-900 dark:text-white">
                  {stages.length}
                </div>
                <div className="text-xs text-muted-foreground">Etapas</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-muted/30 dark:bg-white/5 rounded-md px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar negocios..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-white dark:bg-white/10 border-gray-200 dark:border-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Kanban Board */}
      <div
        ref={viewRef}
        style={
          viewHeight ? { height: viewHeight, overflow: 'hidden' } : undefined
        }
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="pipeline" type="CARD" direction="horizontal">
            {boardProvided => (
              <div
                className="kanban-scroll h-full overflow-x-auto sm:overflow-y-hidden overflow-y-auto pb-2"
              >
                <div
                  ref={boardProvided.innerRef}
                  {...boardProvided.droppableProps}
                  className="flex flex-col sm:flex-row gap-3 sm:min-w-max h-full"
                >
                  {stages.map(stage => {
                    const stageDeals = dealsByStage.get(stage.id) ?? [];
                    const totals = stageTotals.get(stage.id) ?? {
                      count: 0,
                      value: 0,
                    };
                    return (
                      <StageColumn
                        key={stage.id}
                        stage={stage}
                        deals={stageDeals}
                        dealCount={totals.count}
                        totalValue={totals.value}
                        isLoading={dealsLoading}
                        onDealClick={deal =>
                          router.push(`/sales/deals/${deal.id}`)
                        }
                      />
                    );
                  })}
                  {boardProvided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Stage Column
   ────────────────────────────────────────────────────────── */

interface StageColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  dealCount: number;
  totalValue: number;
  isLoading: boolean;
  onDealClick: (deal: Deal) => void;
}

function StageColumn({
  stage,
  deals,
  dealCount,
  totalValue,
  isLoading,
  onDealClick,
}: StageColumnProps) {
  const columnStyle = getStageColumnStyle(stage.type);
  const colColor = stage.color || '#8b5cf6';

  const stageIcon = useMemo(() => {
    switch (stage.type) {
      case 'WON':
        return <Trophy className="h-3.5 w-3.5 text-emerald-500" />;
      case 'LOST':
        return <XCircle className="h-3.5 w-3.5 text-rose-500" />;
      default:
        return null;
    }
  }, [stage.type]);

  return (
    <div className="flex flex-col w-full sm:w-[300px] shrink-0">
      {/* Column header */}
      <div
        className={cn(
          'flex items-center gap-1.5 px-3 py-2.5 rounded-t-xl border border-b-0',
          columnStyle.borderClass
        )}
        style={
          columnStyle.headerBg
            ? undefined
            : {
                background: `linear-gradient(135deg, ${colColor}12, ${colColor}06)`,
                borderTopColor: `${colColor}30`,
              }
        }
      >
        {/* Color dot or icon */}
        {stageIcon || (
          <span
            className="h-3 w-3 rounded shrink-0"
            style={{ backgroundColor: colColor }}
          />
        )}

        {/* Stage name */}
        <h3 className="text-sm font-semibold truncate flex-1">
          {stage.name}
        </h3>

        {/* Count + value */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md text-muted-foreground bg-muted/50">
            {dealCount}
          </span>
          {totalValue > 0 && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground hidden lg:inline">
              {formatCurrency(totalValue)}
            </span>
          )}
        </div>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={stage.id} type="CARD">
        {(dropProvided, dropSnapshot) => (
          <div
            ref={dropProvided.innerRef}
            {...dropProvided.droppableProps}
            className={cn(
              'flex-1 space-y-2 rounded-b-xl border p-2 transition-colors min-h-[80px]',
              columnStyle.bgClass,
              columnStyle.borderClass,
              dropSnapshot.isDraggingOver && 'ring-2 ring-inset ring-violet-300 dark:ring-violet-500/30'
            )}
          >
            {isLoading && deals.length === 0 && (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
            )}

            {deals.map((deal, index) => (
              <Draggable key={deal.id} draggableId={deal.id} index={index}>
                {(cardProvided, cardSnapshot) => (
                  <DealCard
                    deal={deal}
                    stage={stage}
                    onClick={() => onDealClick(deal)}
                    provided={cardProvided}
                    isDragging={cardSnapshot.isDragging}
                  />
                )}
              </Draggable>
            ))}
            {dropProvided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Deal Card
   ────────────────────────────────────────────────────────── */

interface DealCardProps {
  deal: Deal;
  stage: PipelineStage;
  onClick: () => void;
  provided: import('@hello-pangea/dnd').DraggableProvided;
  isDragging: boolean;
}

function DealCard({ deal, stage, onClick, provided, isDragging }: DealCardProps) {
  const daysInStage = getDaysInStage(deal.stageEnteredAt);
  const isRotten =
    stage.rottenAfterDays !== undefined &&
    stage.rottenAfterDays !== null &&
    stage.rottenAfterDays > 0 &&
    daysInStage > stage.rottenAfterDays;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      className={cn(
        'group rounded-lg border p-3 cursor-pointer transition-all',
        'bg-white dark:bg-slate-800/80 border-gray-200 dark:border-white/10',
        'hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/30',
        isDragging && 'shadow-lg rotate-2 opacity-90',
        isRotten && 'border-l-2 border-l-amber-500'
      )}
    >
      {/* Title */}
      <h4 className="text-sm font-medium line-clamp-2 mb-1.5">{deal.title}</h4>

      {/* Customer */}
      {deal.customer && (
        <p className="text-xs text-muted-foreground truncate mb-2">
          {deal.customer.name}
        </p>
      )}

      {/* Value */}
      {deal.value !== undefined && deal.value !== null && deal.value > 0 && (
        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
          {formatCurrency(deal.value)}
        </div>
      )}

      {/* Footer: assignedTo + days in stage */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {/* Assigned user */}
        <div className="flex items-center gap-1 truncate">
          <User className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {deal.assignedToUserId ? 'Atribuido' : 'Sem responsavel'}
          </span>
        </div>

        {/* Days in stage */}
        <div
          className={cn(
            'flex items-center gap-1 shrink-0',
            isRotten
              ? 'text-amber-600 dark:text-amber-400 font-medium'
              : 'text-muted-foreground'
          )}
        >
          {isRotten ? (
            <AlertCircle className="h-3 w-3" />
          ) : (
            <Clock className="h-3 w-3" />
          )}
          <span>{getDaysLabel(daysInStage)}</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Page Export with Suspense
   ────────────────────────────────────────────────────────── */

export default function PipelineKanbanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <div className="flex gap-3 mt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-72 rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <PipelineKanbanContent />
    </Suspense>
  );
}
