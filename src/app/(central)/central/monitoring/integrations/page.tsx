'use client';

import { CentralBadge } from '@/components/central/central-badge';
import type { CentralBadgeVariant } from '@/components/central/central-badge';
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
import { useIntegrationStatus } from '@/hooks/admin/use-admin';
import type { IntegrationStatusReport } from '@/types/admin';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Link2,
  Loader2,
  ShieldAlert,
  Unplug,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_INTEGRATIONS: IntegrationStatusReport = {
  byType: [
    {
      type: 'Email (IMAP)',
      connected: 42,
      disconnected: 3,
      error: 1,
      total: 46,
    },
    {
      type: 'Pagamento',
      connected: 28,
      disconnected: 0,
      error: 0,
      total: 28,
    },
    {
      type: 'Nota Fiscal',
      connected: 15,
      disconnected: 2,
      error: 2,
      total: 19,
    },
    {
      type: 'Webhook',
      connected: 67,
      disconnected: 5,
      error: 0,
      total: 72,
    },
    {
      type: 'S3 / Storage',
      connected: 34,
      disconnected: 0,
      error: 0,
      total: 34,
    },
  ],
  errors: [
    {
      tenantName: 'Acme Corp',
      integrationType: 'Nota Fiscal',
      errorMessage: 'Certificado A1 expirado',
      lastCheckAt: '2026-03-21T08:30:00Z',
    },
    {
      tenantName: 'TechFlow Solutions',
      integrationType: 'Email (IMAP)',
      errorMessage: 'Falha na autenticação OAuth',
      lastCheckAt: '2026-03-21T07:15:00Z',
    },
    {
      tenantName: 'Global Trade',
      integrationType: 'Nota Fiscal',
      errorMessage: 'Timeout na SEFAZ',
      lastCheckAt: '2026-03-21T06:45:00Z',
    },
    {
      tenantName: 'StartUp Inc',
      integrationType: 'Webhook',
      errorMessage: 'Endpoint retornando 503',
      lastCheckAt: '2026-03-20T23:00:00Z',
    },
    {
      tenantName: 'Digital Agency',
      integrationType: 'Nota Fiscal',
      errorMessage: 'Certificado expira em 5 dias',
      lastCheckAt: '2026-03-20T18:30:00Z',
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getHealthPercent(connected: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((connected / total) * 100);
}

function getHealthBadge(
  connected: number,
  total: number
): { variant: CentralBadgeVariant; label: string } {
  const pct = getHealthPercent(connected, total);
  if (pct >= 95) return { variant: 'emerald', label: 'Saudável' };
  if (pct >= 80) return { variant: 'orange', label: 'Atenção' };
  return { variant: 'rose', label: 'Crítico' };
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function IntegrationsDetailPage() {
  const router = useRouter();
  const { data: apiData, isLoading } = useIntegrationStatus();

  const integrations = apiData ?? MOCK_INTEGRATIONS;

  const totalConnected = integrations.byType.reduce(
    (sum, i) => sum + i.connected,
    0
  );
  const totalErrors = integrations.byType.reduce((sum, i) => sum + i.error, 0);
  const totalDisconnected = integrations.byType.reduce(
    (sum, i) => sum + i.disconnected,
    0
  );
  const totalAll = integrations.byType.reduce((sum, i) => sum + i.total, 0);

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
          title="Integrações"
          description="Status detalhado de todas as integrações dos tenants"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2
            className="h-6 w-6 animate-spin"
            style={{ color: 'var(--central-text-muted)' }}
          />
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    color: '#10b981',
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {totalConnected}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Conectados
                  </p>
                </div>
              </div>
            </CentralCard>

            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(249,115,22,0.1)',
                    color: '#f97316',
                  }}
                >
                  <Unplug className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {totalDisconnected}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Desconectados
                  </p>
                </div>
              </div>
            </CentralCard>

            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(244,63,94,0.1)',
                    color: '#f43f5e',
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {totalErrors}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Com erro
                  </p>
                </div>
              </div>
            </CentralCard>

            <CentralCard className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{
                    backgroundColor: 'var(--central-avatar-bg)',
                    color: 'var(--central-avatar-text)',
                  }}
                >
                  <Link2 className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold tabular-nums"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    {totalAll}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Total
                  </p>
                </div>
              </div>
            </CentralCard>
          </div>

          {/* Integration by type */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link2
                className="h-4 w-4"
                style={{ color: 'var(--central-text-secondary)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Por tipo de integração
              </h3>
            </div>

            <CentralTable className="!p-0">
              <CentralTableHeader>
                <CentralTableRow>
                  <CentralTableHead>Integração</CentralTableHead>
                  <CentralTableHead>Conectados</CentralTableHead>
                  <CentralTableHead>Desconectados</CentralTableHead>
                  <CentralTableHead>Erros</CentralTableHead>
                  <CentralTableHead>Total</CentralTableHead>
                  <CentralTableHead>Saúde</CentralTableHead>
                </CentralTableRow>
              </CentralTableHeader>
              <CentralTableBody>
                {integrations.byType.map(item => {
                  const badge = getHealthBadge(item.connected, item.total);
                  return (
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
                          style={{
                            color:
                              item.disconnected > 0
                                ? '#f97316'
                                : 'var(--central-text-muted)',
                          }}
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
                      <CentralTableCell>
                        <CentralBadge variant={badge.variant}>
                          {badge.label}
                        </CentralBadge>
                      </CentralTableCell>
                    </CentralTableRow>
                  );
                })}
              </CentralTableBody>
            </CentralTable>
          </CentralCard>

          {/* Errors */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4" style={{ color: '#f43f5e' }} />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Erros e alertas recentes
              </h3>
              {integrations.errors.length > 0 && (
                <CentralBadge variant="rose">
                  {integrations.errors.length}
                </CentralBadge>
              )}
            </div>

            {integrations.errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <ShieldAlert
                  className="h-12 w-12 mb-3"
                  style={{ color: 'var(--central-text-muted)' }}
                />
                <p style={{ color: 'var(--central-text-muted)' }}>
                  Nenhum erro recente encontrado
                </p>
              </div>
            ) : (
              <CentralTable className="!p-0">
                <CentralTableHeader>
                  <CentralTableRow>
                    <CentralTableHead>Tenant</CentralTableHead>
                    <CentralTableHead>Integração</CentralTableHead>
                    <CentralTableHead>Erro</CentralTableHead>
                    <CentralTableHead>Última verificação</CentralTableHead>
                  </CentralTableRow>
                </CentralTableHeader>
                <CentralTableBody>
                  {integrations.errors.map((error, index) => (
                    <CentralTableRow
                      key={`${error.tenantName}-${error.integrationType}-${index}`}
                    >
                      <CentralTableCell>
                        <span className="font-medium">{error.tenantName}</span>
                      </CentralTableCell>
                      <CentralTableCell>
                        <CentralBadge variant="default">
                          {error.integrationType}
                        </CentralBadge>
                      </CentralTableCell>
                      <CentralTableCell>
                        <span style={{ color: '#f43f5e' }} className="text-sm">
                          {error.errorMessage}
                        </span>
                      </CentralTableCell>
                      <CentralTableCell>
                        <span
                          style={{ color: 'var(--central-text-secondary)' }}
                        >
                          {formatDate(error.lastCheckAt)}
                        </span>
                      </CentralTableCell>
                    </CentralTableRow>
                  ))}
                </CentralTableBody>
              </CentralTable>
            )}
          </CentralCard>
        </>
      )}
    </div>
  );
}
