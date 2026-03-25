'use client';

import { CentralBadge } from '@/components/central/central-badge';
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
import { useApiUsageReport } from '@/hooks/admin/use-admin';
import type { ApiUsageCategory } from '@/types/admin';
import {
  Activity,
  ArrowLeft,
  Banknote,
  Brain,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  HardDrive,
  Loader2,
  MessageSquare,
  ShoppingBag,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function getMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    ai_queries_t1: 'IA — Tier 1 (Flash)',
    ai_queries_t2: 'IA — Tier 2 (Pro)',
    whatsapp_messages: 'WhatsApp — Mensagens',
    whatsapp_conversations: 'WhatsApp — Conversas',
    instagram_messages: 'Instagram — Mensagens',
    telegram_messages: 'Telegram — Mensagens',
    fiscal_documents: 'Documentos Fiscais',
    marketplace_api_calls: 'Marketplace — Chamadas API',
    marketplace_orders: 'Marketplace — Pedidos',
    pix_transactions: 'PIX — Transações',
    storage_gb: 'Armazenamento (GB)',
  };
  return labels[metric] ?? metric;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ai: <Brain className="h-4 w-4" />,
  messaging: <MessageSquare className="h-4 w-4" />,
  fiscal: <FileText className="h-4 w-4" />,
  marketplace: <ShoppingBag className="h-4 w-4" />,
  payments: <Banknote className="h-4 w-4" />,
  storage: <HardDrive className="h-4 w-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  ai: '#8b5cf6',
  messaging: '#0ea5e9',
  fiscal: '#10b981',
  marketplace: '#f97316',
  payments: '#ec4899',
  storage: '#6366f1',
};

function getUsageColor(used: number, included: number): string {
  if (included <= 0) return '#f43f5e'; // rose — no quota
  const ratio = used / included;
  if (ratio > 1) return '#f43f5e'; // rose — over limit
  if (ratio >= 0.8) return '#f97316'; // orange/yellow — warning
  return '#10b981'; // green — healthy
}

function getUsageBadgeVariant(
  used: number,
  included: number
): 'emerald' | 'orange' | 'rose' {
  if (included <= 0) return 'rose';
  const ratio = used / included;
  if (ratio > 1) return 'rose';
  if (ratio >= 0.8) return 'orange';
  return 'emerald';
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function ApiConsumptionPage() {
  const router = useRouter();
  const { data: report, isLoading } = useApiUsageReport();

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/central/monitoring')}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: 'var(--central-avatar-bg)',
            color: 'var(--central-avatar-text)',
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <CentralPageHeader
          title="Consumo de APIs"
          description="Consumo e custos de todas as APIs externas por tenant"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: 'var(--central-text-muted)' }}
          />
        </div>
      ) : !report ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Activity
            className="h-12 w-12"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <p className="text-sm" style={{ color: 'var(--central-text-muted)' }}>
            Dados de consumo de APIs indisponíveis
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(139,92,246,0.1)',
                    color: '#8b5cf6',
                  }}
                >
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {formatNumber(report.totalRequests)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Total de requisições
                  </p>
                </div>
              </div>
            </CentralCard>

            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    color: '#10b981',
                  }}
                >
                  <DollarSign className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {formatCurrency(report.totalCost)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Custo total
                  </p>
                </div>
              </div>
            </CentralCard>

            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(14,165,233,0.1)',
                    color: '#0ea5e9',
                  }}
                >
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {report.period}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Período
                  </p>
                </div>
              </div>
            </CentralCard>
          </div>

          {/* Categories */}
          {report.categories.map((category: ApiUsageCategory) => {
            const color =
              CATEGORY_COLORS[category.category] ?? category.color;
            const icon = CATEGORY_ICONS[category.category] ?? (
              <Activity className="h-4 w-4" />
            );

            return (
              <CentralCard key={category.category} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span style={{ color }}>
                      {icon}
                    </span>
                    <h3
                      className="text-sm font-semibold"
                      style={{ color: 'var(--central-text-primary)' }}
                    >
                      {category.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: 'var(--central-text-secondary)' }}
                    >
                      {formatNumber(category.totalUsed)} / {formatNumber(category.totalIncluded)} usados
                    </span>
                    <span
                      className="text-sm font-semibold tabular-nums"
                      style={{ color }}
                    >
                      {formatCurrency(category.totalCost)}
                    </span>
                  </div>
                </div>

                <CentralTable className="!p-0">
                  <CentralTableHeader>
                    <CentralTableRow>
                      <CentralTableHead>Métrica</CentralTableHead>
                      <CentralTableHead>Usado</CentralTableHead>
                      <CentralTableHead>Incluído</CentralTableHead>
                      <CentralTableHead>Excedente</CentralTableHead>
                      <CentralTableHead>Custo</CentralTableHead>
                      <CentralTableHead>Uso</CentralTableHead>
                    </CentralTableRow>
                  </CentralTableHeader>
                  <CentralTableBody>
                    {category.metrics.map(metric => {
                      const usagePercent =
                        metric.included > 0
                          ? Math.round((metric.used / metric.included) * 100)
                          : metric.used > 0
                            ? 100
                            : 0;
                      const barColor = getUsageColor(
                        metric.used,
                        metric.included
                      );
                      const badgeVariant = getUsageBadgeVariant(
                        metric.used,
                        metric.included
                      );

                      return (
                        <CentralTableRow key={metric.metric}>
                          <CentralTableCell>
                            <span className="font-medium">
                              {getMetricLabel(metric.metric)}
                            </span>
                          </CentralTableCell>
                          <CentralTableCell>
                            <span className="tabular-nums font-medium">
                              {formatNumber(metric.used)}
                            </span>
                          </CentralTableCell>
                          <CentralTableCell>
                            <span className="tabular-nums">
                              {formatNumber(metric.included)}
                            </span>
                          </CentralTableCell>
                          <CentralTableCell>
                            {metric.overage > 0 ? (
                              <CentralBadge variant={badgeVariant}>
                                +{formatNumber(metric.overage)}
                              </CentralBadge>
                            ) : (
                              <span
                                className="text-xs tabular-nums"
                                style={{
                                  color: 'var(--central-text-muted)',
                                }}
                              >
                                0
                              </span>
                            )}
                          </CentralTableCell>
                          <CentralTableCell>
                            <span className="tabular-nums font-medium">
                              {formatCurrency(metric.cost)}
                            </span>
                          </CentralTableCell>
                          <CentralTableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex-1 h-1.5 rounded-full max-w-[80px]"
                                style={{
                                  backgroundColor:
                                    'var(--central-separator)',
                                }}
                              >
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${Math.min(usagePercent, 100)}%`,
                                    backgroundColor: barColor,
                                  }}
                                />
                              </div>
                              <span
                                className="text-xs tabular-nums"
                                style={{
                                  color: 'var(--central-text-secondary)',
                                }}
                              >
                                {usagePercent}%
                              </span>
                            </div>
                          </CentralTableCell>
                        </CentralTableRow>
                      );
                    })}
                  </CentralTableBody>
                </CentralTable>
              </CentralCard>
            );
          })}

          {/* Top Tenants by Total Cost */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2
                className="h-4 w-4"
                style={{ color: 'var(--central-text-secondary)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Top Tenants por Custo Total
              </h3>
            </div>

            <div className="space-y-2">
              {report.topTenantsByCost.map((tenant, index) => {
                const maxCost = report.topTenantsByCost[0]?.totalCost ?? 1;

                // Build stacked bar segments from breakdown
                const segments = Object.entries(tenant.breakdown)
                  .filter(([, cost]) => cost > 0)
                  .map(([cat, cost]) => ({
                    category: cat,
                    cost,
                    color: CATEGORY_COLORS[cat] ?? '#6b7280',
                    widthPercent: Math.round((cost / maxCost) * 100),
                  }));

                return (
                  <div
                    key={tenant.tenantId}
                    className="flex items-center gap-3 p-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--central-card-bg)' }}
                  >
                    <span
                      className="text-xs font-bold tabular-nums w-5 text-center flex-shrink-0"
                      style={{ color: 'var(--central-text-muted)' }}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--central-text-primary)' }}
                        >
                          {tenant.tenantName}
                        </span>
                        <span
                          className="text-sm font-semibold tabular-nums flex-shrink-0 ml-2"
                          style={{ color: 'var(--central-text-primary)' }}
                        >
                          {formatCurrency(tenant.totalCost)}
                        </span>
                      </div>
                      <div
                        className="flex h-1 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: 'var(--central-separator)',
                        }}
                      >
                        {segments.map(seg => (
                          <div
                            key={seg.category}
                            className="h-1 transition-all"
                            style={{
                              width: `${seg.widthPercent}%`,
                              backgroundColor: seg.color,
                            }}
                          />
                        ))}
                      </div>
                      {/* Legend chips */}
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {segments.map(seg => (
                          <span
                            key={seg.category}
                            className="flex items-center gap-1 text-[10px] tabular-nums"
                            style={{
                              color: 'var(--central-text-secondary)',
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: seg.color }}
                            />
                            {formatCurrency(seg.cost)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CentralCard>
        </>
      )}
    </div>
  );
}
