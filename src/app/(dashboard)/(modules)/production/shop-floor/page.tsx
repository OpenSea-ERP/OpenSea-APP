/**
 * Shop Floor Page — Chão de Fábrica
 * Apontamento, paradas e OEE em tempo real.
 */

'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  HardHat,
  Play,
  CheckCircle2,
  PauseCircle,
  ClipboardList,
  AlertTriangle,
  StopCircle,
  Gauge,
  BarChart3,
  Clock,
  Loader2,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  jobCardsService,
  downtimeRecordsService,
  workstationsService,
} from '@/services/production';
import type {
  JobCard,
  JobCardStatus,
  DowntimeRecord,
} from '@/types/production';

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  JobCardStatus,
  { label: string; color: string; badgeClass: string }
> = {
  IN_PROGRESS: {
    label: 'Em Produção',
    color: 'emerald',
    badgeClass:
      'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/8 dark:text-emerald-300',
  },
  PENDING: {
    label: 'Aguardando',
    color: 'amber',
    badgeClass:
      'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/8 dark:text-amber-300',
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'sky',
    badgeClass:
      'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/8 dark:text-sky-300',
  },
  ON_HOLD: {
    label: 'Em Espera',
    color: 'rose',
    badgeClass:
      'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300',
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'slate',
    badgeClass:
      'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300',
  },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function elapsedMinutes(startIso: string): number {
  return Math.round(
    (Date.now() - new Date(startIso).getTime()) / (1000 * 60),
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}min`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ShopFloorPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('apontamento');

  const canAct = hasPermission(PRODUCTION_PERMISSIONS.SHOPFLOOR.REGISTER);

  // ---- Data queries -------------------------------------------------------

  const {
    data: jobCardsData,
    isLoading: isLoadingCards,
    error: cardsError,
  } = useQuery({
    queryKey: ['production', 'job-cards'],
    queryFn: async () => {
      const res = await jobCardsService.list();
      return res.jobCards;
    },
  });

  const {
    data: downtimeData,
    isLoading: isLoadingDowntime,
    error: downtimeError,
  } = useQuery({
    queryKey: ['production', 'downtime-records'],
    queryFn: async () => {
      const res = await downtimeRecordsService.list();
      return res.downtimeRecords;
    },
  });

  const { data: workstationsData } = useQuery({
    queryKey: ['production', 'workstations'],
    queryFn: async () => {
      const res = await workstationsService.list();
      return res.workstations;
    },
  });

  // Build workstation name map
  const wsMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (workstationsData) {
      for (const ws of workstationsData) {
        map[ws.id] = ws.name;
      }
    }
    return map;
  }, [workstationsData]);

  // ---- Stats --------------------------------------------------------------

  const jobCards = jobCardsData ?? [];

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: jobCards.length,
      inProgress: jobCards.filter((c) => c.status === 'IN_PROGRESS').length,
      pending: jobCards.filter((c) => c.status === 'PENDING').length,
      completedToday: jobCards.filter(
        (c) =>
          c.status === 'COMPLETED' &&
          c.actualEnd &&
          new Date(c.actualEnd).toDateString() === today,
      ).length,
    };
  }, [jobCards]);

  // ---- Mutations ----------------------------------------------------------

  const startMutation = useMutation({
    mutationFn: (id: string) => jobCardsService.start(id),
    onSuccess: () => {
      toast.success('Cartão iniciado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['production', 'job-cards'] });
    },
    onError: () => toast.error('Erro ao iniciar cartão'),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => jobCardsService.complete(id),
    onSuccess: () => {
      toast.success('Cartão concluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['production', 'job-cards'] });
    },
    onError: () => toast.error('Erro ao concluir cartão'),
  });

  const holdMutation = useMutation({
    mutationFn: (id: string) => jobCardsService.hold(id),
    onSuccess: () => {
      toast.success('Cartão pausado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['production', 'job-cards'] });
    },
    onError: () => toast.error('Erro ao pausar cartão'),
  });

  const endDowntimeMutation = useMutation({
    mutationFn: (id: string) => downtimeRecordsService.end(id),
    onSuccess: () => {
      toast.success('Parada encerrada com sucesso');
      queryClient.invalidateQueries({
        queryKey: ['production', 'downtime-records'],
      });
    },
    onError: () => toast.error('Erro ao encerrar parada'),
  });

  const isMutating =
    startMutation.isPending ||
    completeMutation.isPending ||
    holdMutation.isPending ||
    endDowntimeMutation.isPending;

  // ---- OEE calculations ---------------------------------------------------

  const oee = useMemo(() => {
    const completed = jobCards.filter((c) => c.status === 'COMPLETED');
    if (completed.length === 0)
      return { availability: 0, performance: 0, quality: 0, overall: 0 };

    // Availability: ratio of cards that actually ran (have actualStart) vs total
    const totalCards = jobCards.length || 1;
    const ranCards = jobCards.filter((c) => c.actualStart).length;
    const availability = Math.min((ranCards / totalCards) * 100, 100);

    // Performance: completed quantity vs planned quantity (across completed cards)
    const totalPlanned = completed.reduce(
      (sum, c) => sum + c.quantityPlanned,
      0,
    );
    const totalCompleted = completed.reduce(
      (sum, c) => sum + c.quantityCompleted,
      0,
    );
    const performance =
      totalPlanned > 0
        ? Math.min((totalCompleted / totalPlanned) * 100, 100)
        : 0;

    // Quality: (completed - scrapped) / completed
    const totalScrapped = completed.reduce(
      (sum, c) => sum + c.quantityScrapped,
      0,
    );
    const quality =
      totalCompleted > 0
        ? Math.min(
            ((totalCompleted - totalScrapped) / totalCompleted) * 100,
            100,
          )
        : 0;

    const overall = (availability / 100) * (performance / 100) * (quality / 100) * 100;

    return { availability, performance, quality, overall };
  }, [jobCards]);

  // ---- Active cards (non-terminal) ----------------------------------------

  const activeCards = useMemo(
    () =>
      jobCards.filter(
        (c) =>
          c.status === 'PENDING' ||
          c.status === 'IN_PROGRESS' ||
          c.status === 'ON_HOLD',
      ),
    [jobCards],
  );

  const activeDowntimes = useMemo(
    () => (downtimeData ?? []).filter((d) => !d.endTime),
    [downtimeData],
  );

  // ---- Render helpers -----------------------------------------------------

  const statsCards = [
    {
      label: 'Total de Cartões',
      value: stats.total,
      icon: ClipboardList,
      from: 'from-violet-500',
      to: 'to-violet-600',
    },
    {
      label: 'Em Produção',
      value: stats.inProgress,
      icon: Play,
      from: 'from-emerald-500',
      to: 'to-emerald-600',
    },
    {
      label: 'Aguardando',
      value: stats.pending,
      icon: Clock,
      from: 'from-amber-500',
      to: 'to-amber-600',
    },
    {
      label: 'Concluídos Hoje',
      value: stats.completedToday,
      icon: CheckCircle2,
      from: 'from-sky-500',
      to: 'to-sky-600',
    },
  ];

  // ---- Page ---------------------------------------------------------------

  return (
    <div className="space-y-6" data-testid="shop-floor-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Chão de Fábrica', href: '/production/shop-floor' },
        ]}
      />

      <PageHeroBanner
        title="Chão de Fábrica"
        description="Apontamento e acompanhamento em tempo real da produção. Controle de paradas, tempos e eficiência."
        icon={HardHat}
        iconGradient="from-amber-500 to-orange-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => (
          <Card
            key={s.label}
            className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl bg-linear-to-br ${s.from} ${s.to} flex items-center justify-center`}
              >
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {s.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
          <TabsTrigger value="apontamento" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Apontamento
          </TabsTrigger>
          <TabsTrigger value="paradas" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Paradas
          </TabsTrigger>
          <TabsTrigger value="oee" className="gap-2">
            <Gauge className="h-4 w-4" />
            OEE
          </TabsTrigger>
        </TabsList>

        {/* --- Apontamento tab --- */}
        <TabsContent value="apontamento" className="space-y-4">
          {isLoadingCards && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {cardsError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao carregar cartões de produção.
              </p>
            </Card>
          )}

          {!isLoadingCards && !cardsError && activeCards.length === 0 && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-gray-500 dark:text-white/60">
                Nenhum cartão de produção ativo no momento.
              </p>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeCards.map((card) => (
              <JobCardTile
                key={card.id}
                card={card}
                wsName={card.workstationId ? wsMap[card.workstationId] : null}
                canAct={canAct}
                isMutating={isMutating}
                onStart={() => startMutation.mutate(card.id)}
                onComplete={() => completeMutation.mutate(card.id)}
                onHold={() => holdMutation.mutate(card.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* --- Paradas tab --- */}
        <TabsContent value="paradas" className="space-y-4">
          {isLoadingDowntime && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {downtimeError && (
            <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-sm text-rose-600 dark:text-rose-400">
                Erro ao carregar registros de parada.
              </p>
            </Card>
          )}

          {!isLoadingDowntime &&
            !downtimeError &&
            activeDowntimes.length === 0 && (
              <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
                <p className="text-sm text-gray-500 dark:text-white/60">
                  Nenhuma parada ativa no momento.
                </p>
              </Card>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeDowntimes.map((dt) => (
              <DowntimeTile
                key={dt.id}
                record={dt}
                wsName={wsMap[dt.workstationId]}
                canAct={canAct}
                isMutating={isMutating}
                onEnd={() => endDowntimeMutation.mutate(dt.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* --- OEE tab --- */}
        <TabsContent value="oee" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OeeGaugeCard
              label="Disponibilidade"
              value={oee.availability}
              icon={Clock}
              from="from-sky-500"
              to="to-sky-600"
            />
            <OeeGaugeCard
              label="Performance"
              value={oee.performance}
              icon={BarChart3}
              from="from-emerald-500"
              to="to-emerald-600"
            />
            <OeeGaugeCard
              label="Qualidade"
              value={oee.quality}
              icon={CheckCircle2}
              from="from-violet-500"
              to="to-violet-600"
            />
            <OeeGaugeCard
              label="OEE Geral"
              value={oee.overall}
              icon={Gauge}
              from="from-amber-500"
              to="to-amber-600"
            />
          </div>

          <Card className="p-5 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <p className="text-sm text-gray-500 dark:text-white/60">
              O OEE (Overall Equipment Effectiveness) é calculado como{' '}
              <span className="font-medium text-gray-700 dark:text-white/80">
                Disponibilidade x Performance x Qualidade
              </span>
              . Os valores acima são estimados com base nos cartões de produção
              registrados.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function JobCardTile({
  card,
  wsName,
  canAct,
  isMutating,
  onStart,
  onComplete,
  onHold,
}: {
  card: JobCard;
  wsName: string | null;
  canAct: boolean;
  isMutating: boolean;
  onStart: () => void;
  onComplete: () => void;
  onHold: () => void;
}) {
  const cfg = STATUS_CONFIG[card.status];
  const progress =
    card.quantityPlanned > 0
      ? Math.round((card.quantityCompleted / card.quantityPlanned) * 100)
      : 0;

  return (
    <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          {card.barcode && (
            <p className="text-xs font-mono text-gray-400 dark:text-white/40 truncate">
              {card.barcode}
            </p>
          )}
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {wsName ?? 'Sem posto'}
          </p>
        </div>
        <Badge variant="outline" className={cfg.badgeClass}>
          {cfg.label}
        </Badge>
      </div>

      {/* Quantities */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500 dark:text-white/50">Planejado</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {card.quantityPlanned}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-white/50">Produzido</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {card.quantityCompleted}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-white/50">Refugo</p>
          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {card.quantityScrapped}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-white/40 text-right">
        {progress}% concluído
      </p>

      {/* Dates */}
      <div className="text-xs text-gray-500 dark:text-white/50 space-y-1">
        <div className="flex justify-between">
          <span>Início previsto</span>
          <span>{formatDate(card.scheduledStart)}</span>
        </div>
        <div className="flex justify-between">
          <span>Fim previsto</span>
          <span>{formatDate(card.scheduledEnd)}</span>
        </div>
      </div>

      {/* Actions */}
      {canAct && (
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
          {card.status === 'PENDING' && (
            <Button
              size="sm"
              className="h-9 px-2.5 gap-1"
              disabled={isMutating}
              onClick={onStart}
            >
              <Play className="h-4 w-4" />
              Iniciar
            </Button>
          )}
          {card.status === 'IN_PROGRESS' && (
            <>
              <Button
                size="sm"
                className="h-9 px-2.5 gap-1"
                disabled={isMutating}
                onClick={onComplete}
              >
                <CheckCircle2 className="h-4 w-4" />
                Concluir
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-2.5 gap-1"
                disabled={isMutating}
                onClick={onHold}
              >
                <PauseCircle className="h-4 w-4" />
                Pausar
              </Button>
            </>
          )}
          {card.status === 'ON_HOLD' && (
            <Button
              size="sm"
              className="h-9 px-2.5 gap-1"
              disabled={isMutating}
              onClick={onStart}
            >
              <Play className="h-4 w-4" />
              Retomar
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function DowntimeTile({
  record,
  wsName,
  canAct,
  isMutating,
  onEnd,
}: {
  record: DowntimeRecord;
  wsName: string | undefined;
  canAct: boolean;
  isMutating: boolean;
  onEnd: () => void;
}) {
  const minutes = elapsedMinutes(record.startTime);

  return (
    <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {wsName ?? 'Posto desconhecido'}
        </p>
        <Badge
          variant="outline"
          className="border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/8 dark:text-rose-300"
        >
          Parada Ativa
        </Badge>
      </div>

      <div className="text-xs text-gray-500 dark:text-white/50 space-y-1">
        <div className="flex justify-between">
          <span>Início</span>
          <span>{formatDate(record.startTime)}</span>
        </div>
        <div className="flex justify-between">
          <span>Duração</span>
          <span className="font-medium text-rose-600 dark:text-rose-400">
            {formatDuration(minutes)}
          </span>
        </div>
        {record.notes && (
          <p className="pt-1 text-gray-600 dark:text-white/60 line-clamp-2">
            {record.notes}
          </p>
        )}
      </div>

      {canAct && (
        <div className="pt-1 border-t border-gray-100 dark:border-white/5">
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-2.5 gap-1 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-300 dark:hover:bg-rose-500/10"
            disabled={isMutating}
            onClick={onEnd}
          >
            <StopCircle className="h-4 w-4" />
            Encerrar
          </Button>
        </div>
      )}
    </Card>
  );
}

function OeeGaugeCard({
  label,
  value,
  icon: Icon,
  from,
  to,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  from: string;
  to: string;
}) {
  const pct = Math.round(value);
  const color =
    pct >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
    pct >= 60 ? 'text-amber-600 dark:text-amber-400' :
    'text-rose-600 dark:text-rose-400';

  return (
    <Card className="p-5 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl bg-linear-to-br ${from} ${to} flex items-center justify-center`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm text-gray-500 dark:text-white/60">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{pct}%</p>
      {/* Simple bar */}
      <div className="w-full bg-gray-100 dark:bg-white/10 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            pct >= 85
              ? 'bg-emerald-500'
              : pct >= 60
                ? 'bg-amber-500'
                : 'bg-rose-500'
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </Card>
  );
}
