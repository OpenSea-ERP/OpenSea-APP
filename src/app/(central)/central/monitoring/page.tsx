'use client';

import { CentralCard } from '@/components/central/central-card';
import { CentralPageHeader } from '@/components/central/central-page-header';
import {
  CentralTable,
  CentralTableBody,
  CentralTableCell,
  CentralTableHead,
  CentralTableHeader,
  CentralTableRow,
} from '@/components/central/central-table';
import {
  useIntegrationStatus,
  useRevenueMetrics,
  useSupportMetrics,
  useSystemHealth,
} from '@/hooks/admin/use-admin';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Clock,
  Database,
  DollarSign,
  Headphones,
  Link2,
  Loader2,
  Radio,
  Sparkles,
  Star,
  Timer,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Components ─────────────────────────────────────────────────────────────────

type HealthStatus = 'ok' | 'warning' | 'error';

function HealthItem({
  label,
  value,
  status,
  icon,
}: {
  label: string;
  value: string;
  status: HealthStatus;
  icon: React.ReactNode;
}) {
  const statusColors: Record<HealthStatus, string> = {
    ok: '#10b981',
    warning: '#f97316',
    error: '#f43f5e',
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--central-card-bg)' }}
    >
      <div
        className="flex items-center justify-center w-9 h-9 rounded-lg"
        style={{
          backgroundColor: `${statusColors[status]}15`,
          color: statusColors[status],
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColors[status] }}
          />
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--central-text-primary)' }}
          >
            {label}
          </p>
        </div>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--central-text-secondary)' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function RevenueCard({
  icon,
  label,
  value,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColor =
    trend === 'up'
      ? '#10b981'
      : trend === 'down'
        ? '#f43f5e'
        : 'var(--central-text-secondary)';

  return (
    <CentralCard className="p-4">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{
            backgroundColor: 'var(--central-avatar-bg)',
            color: 'var(--central-avatar-text)',
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: 'var(--central-text-primary)' }}
            >
              {value}
            </p>
            {trend === 'up' && (
              <TrendingUp
                className="h-3.5 w-3.5"
                style={{ color: trendColor }}
              />
            )}
            {trend === 'down' && (
              <TrendingDown
                className="h-3.5 w-3.5"
                style={{ color: trendColor }}
              />
            )}
          </div>
          <p
            className="text-xs"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {label}
          </p>
        </div>
      </div>
    </CentralCard>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}h${remaining}min` : `${hours}h`;
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function MonitoringDashboardPage() {
  const router = useRouter();

  const { data: health, isLoading: loadingHealth } = useSystemHealth();
  const { data: integrations, isLoading: loadingIntegrations } =
    useIntegrationStatus();
  const { data: revenue, isLoading: loadingRevenue } = useRevenueMetrics();
  const { data: supportMetrics, isLoading: loadingSupport } =
    useSupportMetrics();

  const dbStatus: HealthStatus = health
    ? health.databaseStatus === 'ok'
      ? 'ok'
      : health.databaseStatus === 'warning'
        ? 'warning'
        : 'error'
    : 'ok';

  const busStatus: HealthStatus = health
    ? health.eventBusStatus === 'ok'
      ? 'ok'
      : health.eventBusStatus === 'warning'
        ? 'warning'
        : 'error'
    : 'ok';

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Header */}
      <CentralPageHeader
        title="Monitoramento"
        description="Saude do sistema, integracoes e metricas"
      />

      {/* System Health */}
      <CentralCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity
            className="h-4 w-4"
            style={{ color: 'var(--central-text-secondary)' }}
          />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--central-text-primary)' }}
          >
            Saude do Sistema
          </h3>
        </div>

        {loadingHealth ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: 'var(--central-text-muted)' }}
            />
          </div>
        ) : !health ? (
          <p
            className="text-xs text-center py-8"
            style={{ color: 'var(--central-text-muted)' }}
          >
            Dados de saude indisponiveis
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <HealthItem
              icon={<Activity className="h-4 w-4" />}
              label="API"
              value={`Uptime: ${health.apiUptime}`}
              status="ok"
            />
            <HealthItem
              icon={<Database className="h-4 w-4" />}
              label="Banco de Dados"
              value={`${health.databaseLatencyMs}ms latencia media`}
              status={dbStatus}
            />
            <HealthItem
              icon={<Radio className="h-4 w-4" />}
              label="Event Bus"
              value={`${health.eventBusEventsPerMinute} eventos/min`}
              status={busStatus}
            />
          </div>
        )}
      </CentralCard>

      {/* Integration Status */}
      <CentralCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2
              className="h-4 w-4"
              style={{ color: 'var(--central-text-secondary)' }}
            />
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--central-text-primary)' }}
            >
              Status das Integracoes
            </h3>
            <span
              className="text-xs"
              style={{ color: 'var(--central-text-muted)' }}
            >
              (todos os tenants)
            </span>
          </div>
          <button
            onClick={() => router.push('/central/monitoring/integrations')}
            className="text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--central-accent)' }}
          >
            Ver detalhes
          </button>
        </div>

        {loadingIntegrations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: 'var(--central-text-muted)' }}
            />
          </div>
        ) : !integrations || integrations.byType.length === 0 ? (
          <p
            className="text-xs text-center py-8"
            style={{ color: 'var(--central-text-muted)' }}
          >
            Nenhuma integracao encontrada
          </p>
        ) : (
          <CentralTable className="!p-0">
            <CentralTableHeader>
              <CentralTableRow>
                <CentralTableHead>Integracao</CentralTableHead>
                <CentralTableHead>Conectados</CentralTableHead>
                <CentralTableHead>Desconectados</CentralTableHead>
                <CentralTableHead>Erros</CentralTableHead>
                <CentralTableHead>Total</CentralTableHead>
              </CentralTableRow>
            </CentralTableHeader>
            <CentralTableBody>
              {integrations.byType.map(item => (
                <CentralTableRow key={item.type}>
                  <CentralTableCell>
                    <span className="font-medium">{item.type}</span>
                  </CentralTableCell>
                  <CentralTableCell>
                    <span
                      style={{ color: '#10b981' }}
                      className="font-semibold tabular-nums"
                    >
                      {item.connected}
                    </span>
                  </CentralTableCell>
                  <CentralTableCell>
                    <span
                      style={{ color: '#f97316' }}
                      className="font-semibold tabular-nums"
                    >
                      {item.disconnected}
                    </span>
                  </CentralTableCell>
                  <CentralTableCell>
                    <span
                      style={{
                        color:
                          item.error > 0
                            ? '#f43f5e'
                            : 'var(--central-text-muted)',
                      }}
                      className="font-semibold tabular-nums"
                    >
                      {item.error}
                    </span>
                  </CentralTableCell>
                  <CentralTableCell>
                    <span className="tabular-nums">{item.total}</span>
                  </CentralTableCell>
                </CentralTableRow>
              ))}
            </CentralTableBody>
          </CentralTable>
        )}
      </CentralCard>

      {/* Revenue */}
      {loadingRevenue ? (
        <div className="flex items-center justify-center py-4">
          <Loader2
            className="h-5 w-5 animate-spin"
            style={{ color: 'var(--central-text-muted)' }}
          />
        </div>
      ) : revenue ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <RevenueCard
            icon={<DollarSign className="h-4 w-4" />}
            label="MRR"
            value={formatCurrency(revenue.mrr)}
            trend="up"
          />
          <RevenueCard
            icon={<ArrowDownRight className="h-4 w-4" />}
            label="Churn"
            value={`${revenue.churnRate}%`}
            trend="down"
          />
          <RevenueCard
            icon={<ArrowUpRight className="h-4 w-4" />}
            label="Overage"
            value={formatCurrency(revenue.overageTotal)}
            trend="neutral"
          />
          <RevenueCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Upgrades este mes"
            value={String(revenue.upgradesThisMonth)}
            trend="up"
          />
        </div>
      ) : null}

      {/* AI Usage link */}
      <CentralCard
        hover
        className="p-5 cursor-pointer"
        onClick={() => router.push('/central/monitoring/ai-usage')}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{
                backgroundColor: 'rgba(139,92,246,0.1)',
                color: '#8b5cf6',
              }}
            >
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Uso de IA
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--central-text-secondary)' }}
              >
                Consumo e custos de IA por tier e tenant
              </p>
            </div>
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--central-accent)' }}
          >
            Ver relatorio
          </span>
        </div>
      </CentralCard>

      {/* Support Metrics */}
      <CentralCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Headphones
              className="h-4 w-4"
              style={{ color: 'var(--central-text-secondary)' }}
            />
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--central-text-primary)' }}
            >
              Suporte
            </h3>
          </div>
          <button
            onClick={() => router.push('/central/support')}
            className="text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'var(--central-accent)' }}
          >
            Ver tickets
          </button>
        </div>
        {loadingSupport ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin"
              style={{ color: 'var(--central-text-muted)' }}
            />
          </div>
        ) : !supportMetrics ? (
          <p
            className="text-xs text-center py-8"
            style={{ color: 'var(--central-text-muted)' }}
          >
            Metricas de suporte indisponiveis
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--central-card-bg)' }}
            >
              <Timer
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  {formatMinutes(supportMetrics.avgFirstResponseMinutes)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Tempo medio 1.a resposta
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--central-card-bg)' }}
            >
              <Clock
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  {formatMinutes(supportMetrics.avgResolutionMinutes)}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Tempo medio resolucao
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--central-card-bg)' }}
            >
              <Star
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  {supportMetrics.satisfactionAvg.toFixed(1)}/5
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Satisfacao
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--central-card-bg)' }}
            >
              <Sparkles
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  {supportMetrics.aiResolutionRate}%
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Resolvidos por IA
                </p>
              </div>
            </div>
          </div>
        )}
      </CentralCard>
    </div>
  );
}
