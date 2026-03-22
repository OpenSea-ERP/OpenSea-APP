'use client';

import { CentralAlertBar } from '@/components/central/central-alert-bar';
import { CentralBadge } from '@/components/central/central-badge';
import { CentralCard } from '@/components/central/central-card';
import { CentralHero } from '@/components/central/central-hero';
import { CentralStatPill } from '@/components/central/central-stat-pill';
import { useCentralTheme } from '@/contexts/central-theme-context';
import {
  useAdminTenants,
  useDashboardStats,
  useRevenueMetrics,
} from '@/hooks/admin/use-admin';
import { adminApi } from '@/services/admin/admin-api';
import { useQuery } from '@tanstack/react-query';
import { Building2, Clock, DollarSign, Loader2, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ========================
// Color definitions
// ========================

const MODULE_COLORS = {
  light: {
    SALES: '#6366f1',
    HR: '#0ea5e9',
    STOCK: '#10b981',
    FIN: '#f43f5e',
    TOOLS: '#14b8a6',
    AI: '#4f46e5',
  },
  dark: {
    SALES: '#818cf8',
    HR: '#38bdf8',
    STOCK: '#34d399',
    FIN: '#fb7185',
    TOOLS: '#2dd4bf',
    AI: '#a5b4fc',
  },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#f43f5e',
  high: '#f43f5e',
  medium: '#f97316',
  low: '#10b981',
};

const TENANT_AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f43f5e'];

// ========================
// Helpers
// ========================

function formatMrr(value: number): string {
  if (value >= 1000) {
    return `R$${(value / 1000).toFixed(1)}k`;
  }
  return `R$${value}`;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// ========================
// Page Component
// ========================

export default function CentralDashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: revenueData } = useRevenueMetrics();
  const { data: tenantsData } = useAdminTenants(1, 5);
  const { data: tickets } = useQuery({
    queryKey: ['admin', 'support', 'tickets'],
    queryFn: () => adminApi.listTickets(),
  });
  const { theme } = useCentralTheme();
  const isDark = theme === 'dark';

  const chartTextColor = isDark ? '#94a3b8' : '#64748b';
  const chartGridColor = isDark
    ? 'rgba(148,163,184,0.08)'
    : 'rgba(100,116,139,0.12)';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? 'rgba(148,163,184,0.2)' : 'rgba(0,0,0,0.1)';
  const tooltipColor = isDark ? '#f1f5f9' : '#1e293b';

  const moduleColors = isDark ? MODULE_COLORS.dark : MODULE_COLORS.light;
  const moduleColorMap: Record<string, string> = {
    SALES: moduleColors.SALES,
    HR: moduleColors.HR,
    STOCK: moduleColors.STOCK,
    FIN: moduleColors.FIN,
    TOOLS: moduleColors.TOOLS,
    AI: moduleColors.AI,
  };

  const totalTenants = stats?.totalTenants ?? 0;
  const totalUsers = stats?.totalUsers ?? 0;
  const mrr = stats?.mrr ?? 0;

  // Derive revenue per module from revenueMetrics tenantsByStatus or show empty
  const revenueChartData =
    revenueData?.tenantsByStatus?.map(s => ({
      name: s.status,
      value: s.count,
    })) ?? [];

  // Growth chart from real monthly data
  const growthData = stats?.monthlyGrowth ?? [];

  // Recent tickets (top 3)
  const recentTickets = (tickets ?? []).slice(0, 3);

  // Top tenants
  const topTenants = (tenantsData?.tenants ?? []).slice(0, 3);

  const lineStroke = isDark ? '#818cf8' : '#6366f1';

  const ticketCount = tickets?.length ?? 0;

  return (
    <div>
      {/* Hero Banner */}
      <CentralHero
        greeting="Bom dia, Admin"
        subtitle="Visao geral do sistema e metricas em tempo real"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-white/50" />
        ) : (
          <>
            <CentralStatPill
              icon={<Building2 className="h-3.5 w-3.5" />}
              iconColor="indigo"
              value={String(totalTenants)}
              label="Tenants"
            />
            <CentralStatPill
              icon={<Users className="h-3.5 w-3.5" />}
              iconColor="sky"
              value={String(totalUsers)}
              label="Usuarios"
            />
            <CentralStatPill
              icon={<DollarSign className="h-3.5 w-3.5" />}
              iconColor="emerald"
              value={formatMrr(mrr)}
              label="MRR"
            />
            <CentralStatPill
              icon={<Clock className="h-3.5 w-3.5" />}
              iconColor="teal"
              value={String(ticketCount)}
              label="Tickets"
            />
          </>
        )}
      </CentralHero>

      {/* Content area */}
      <div className="px-6 py-4 space-y-3">
        {/* Alert bar — only show if there are actual issues */}
        {revenueData &&
          (revenueData.overageTotal > 0 || revenueData.churnRate > 5) && (
            <CentralAlertBar
              items={[
                ...(revenueData.overageTotal > 0
                  ? [{ text: `Overage total: R$${revenueData.overageTotal}` }]
                  : []),
                ...(revenueData.churnRate > 5
                  ? [{ text: `Churn elevado: ${revenueData.churnRate}%` }]
                  : []),
              ]}
            />
          )}

        {/* Row 1: Revenue chart + Tickets */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3">
          {/* Revenue by Module */}
          <CentralCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-semibold text-xs"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Tenants por Status
              </span>
              <CentralBadge variant="violet">
                {new Date().toLocaleDateString('pt-BR', {
                  month: 'short',
                  year: 'numeric',
                })}
              </CentralBadge>
            </div>
            {isLoading ? (
              <div
                className="h-[200px] animate-pulse rounded-lg"
                style={{ background: 'var(--central-card-bg)' }}
              />
            ) : revenueChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center">
                <p
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Sem dados disponiveis
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueChartData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: chartTextColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartTextColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipColor,
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => [value, 'Quantidade']}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {revenueChartData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={
                          moduleColorMap[entry.name] ??
                          Object.values(moduleColorMap)[
                            i % Object.values(moduleColorMap).length
                          ]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CentralCard>

          {/* Recent Tickets */}
          <CentralCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-semibold text-xs"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Tickets Recentes
              </span>
              {ticketCount > 0 && (
                <CentralBadge variant="rose">
                  {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'}
                </CentralBadge>
              )}
            </div>
            <div className="space-y-3">
              {recentTickets.length === 0 ? (
                <p
                  className="text-xs py-4 text-center"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Nenhum ticket encontrado
                </p>
              ) : (
                recentTickets.map(ticket => (
                  <div key={ticket.id} className="flex items-start gap-2.5">
                    <span
                      className="mt-1.5 flex-shrink-0 rounded-full"
                      style={{
                        width: 7,
                        height: 7,
                        backgroundColor:
                          PRIORITY_COLORS[ticket.priority] ?? '#a1a1aa',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-tight">
                        <span
                          className="font-bold"
                          style={{ color: 'var(--central-text-primary)' }}
                        >
                          #{ticket.ticketNumber}
                        </span>
                        <span
                          className="ml-1.5"
                          style={{ color: isDark ? '#818cf8' : '#6366f1' }}
                        >
                          {ticket.tenantName ?? ''}
                        </span>
                      </p>
                      <p
                        className="text-[11px] mt-0.5 truncate"
                        style={{ color: 'var(--central-text-secondary)' }}
                      >
                        {ticket.subject}
                      </p>
                    </div>
                    <span
                      className="text-[10px] flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--central-text-secondary)' }}
                    >
                      {getTimeAgo(ticket.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CentralCard>
        </div>

        {/* Row 2: Top Tenants + Growth chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Top Tenants */}
          <CentralCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-semibold text-xs"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Tenants Recentes
              </span>
            </div>
            <div className="space-y-3">
              {topTenants.length === 0 ? (
                <p
                  className="text-xs py-4 text-center"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Nenhum tenant encontrado
                </p>
              ) : (
                topTenants.map((tenant, i) => (
                  <div key={tenant.id} className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor:
                          TENANT_AVATAR_COLORS[i % TENANT_AVATAR_COLORS.length],
                      }}
                    >
                      <span className="text-white text-[10px] font-bold">
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-xs truncate"
                        style={{ color: 'var(--central-text-primary)' }}
                      >
                        {tenant.name}
                      </p>
                      <p
                        className="text-[9px] truncate"
                        style={{ color: 'var(--central-text-secondary)' }}
                      >
                        {tenant.slug}
                      </p>
                    </div>
                    <CentralBadge
                      variant={
                        tenant.status === 'ACTIVE' ? 'emerald' : 'orange'
                      }
                    >
                      {tenant.status === 'ACTIVE' ? 'Ativa' : tenant.status}
                    </CentralBadge>
                  </div>
                ))
              )}
            </div>
          </CentralCard>

          {/* Growth Chart */}
          <CentralCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-semibold text-xs"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Crescimento
              </span>
              <CentralBadge variant="sky">
                {growthData.length} {growthData.length === 1 ? 'mes' : 'meses'}
              </CentralBadge>
            </div>
            {isLoading ? (
              <div
                className="h-[200px] animate-pulse rounded-lg"
                style={{ background: 'var(--central-card-bg)' }}
              />
            ) : growthData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center">
                <p
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Sem dados de crescimento
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={lineStroke}
                        stopOpacity={0.15}
                      />
                      <stop
                        offset="100%"
                        stopColor={lineStroke}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartGridColor}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: chartTextColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartTextColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      border: `1px solid ${tooltipBorder}`,
                      borderRadius: '8px',
                      color: tooltipColor,
                      fontSize: '11px',
                    }}
                    formatter={(value: number) => [value, 'Tenants']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={lineStroke}
                    strokeWidth={2}
                    fill="url(#growthFill)"
                    dot={{ fill: lineStroke, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: lineStroke }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CentralCard>
        </div>
      </div>
    </div>
  );
}
