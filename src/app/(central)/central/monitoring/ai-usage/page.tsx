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
import { useAiUsageReport } from '@/hooks/admin/use-admin';
import {
  ArrowLeft,
  Brain,
  Building2,
  DollarSign,
  Hash,
  Layers,
  Loader2,
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

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function AiUsagePage() {
  const router = useRouter();
  const { data: apiData, isLoading } = useAiUsageReport();

  const report = apiData;

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
          title="Uso de IA"
          description="Consumo e custos de IA por tier e tenant"
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
          <Brain
            className="h-12 w-12"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <p className="text-sm" style={{ color: 'var(--central-text-muted)' }}>
            Dados de uso de IA indisponiveis
          </p>
        </div>
      ) : (
        <>
          {/* Summary */}
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
                  <Hash className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {formatNumber(report.totalQueries)}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Total de consultas
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
                  <Layers className="h-4 w-4" />
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

          {/* By Tier */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain
                className="h-4 w-4"
                style={{ color: 'var(--central-text-secondary)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Por Tier
              </h3>
            </div>

            <CentralTable className="!p-0">
              <CentralTableHeader>
                <CentralTableRow>
                  <CentralTableHead>Tier</CentralTableHead>
                  <CentralTableHead>Consultas</CentralTableHead>
                  <CentralTableHead>Custo</CentralTableHead>
                  <CentralTableHead>%</CentralTableHead>
                </CentralTableRow>
              </CentralTableHeader>
              <CentralTableBody>
                {report.byTier.map(tier => (
                  <CentralTableRow key={tier.tier}>
                    <CentralTableCell>
                      <CentralBadge variant="violet">{tier.tier}</CentralBadge>
                    </CentralTableCell>
                    <CentralTableCell>
                      <span className="tabular-nums font-medium">
                        {formatNumber(tier.queries)}
                      </span>
                    </CentralTableCell>
                    <CentralTableCell>
                      <span className="tabular-nums font-medium">
                        {formatCurrency(tier.cost)}
                      </span>
                    </CentralTableCell>
                    <CentralTableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.max(tier.percentage, 5)}%`,
                            maxWidth: 80,
                            backgroundColor: '#8b5cf6',
                          }}
                        />
                        <span
                          className="text-xs tabular-nums"
                          style={{ color: 'var(--central-text-secondary)' }}
                        >
                          {tier.percentage}%
                        </span>
                      </div>
                    </CentralTableCell>
                  </CentralTableRow>
                ))}
              </CentralTableBody>
            </CentralTable>
          </CentralCard>

          {/* Top Tenants */}
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
                Top Tenants por Custo IA
              </h3>
            </div>

            <div className="space-y-2">
              {report.topTenants.map((tenant, index) => {
                const maxCost = report.topTenants[0]?.cost ?? 1;
                const widthPercent = Math.round((tenant.cost / maxCost) * 100);

                return (
                  <div
                    key={tenant.tenantName}
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
                          {formatCurrency(tenant.cost)}
                        </span>
                      </div>
                      <div
                        className="h-1 rounded-full"
                        style={{
                          backgroundColor: 'var(--central-separator)',
                        }}
                      >
                        <div
                          className="h-1 rounded-full transition-all"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: '#8b5cf6',
                          }}
                        />
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
