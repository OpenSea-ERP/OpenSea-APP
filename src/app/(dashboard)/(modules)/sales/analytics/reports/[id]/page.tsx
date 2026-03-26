/**
 * OpenSea OS - Report Detail Page
 * Página de detalhes do relatório de vendas
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { useReportsInfinite } from '@/hooks/sales/use-analytics';
import type { AnalyticsReport, ReportType } from '@/types/sales';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  SALES_SUMMARY: 'Resumo de Vendas',
  COMMISSION_REPORT: 'Comissões',
  PIPELINE_REPORT: 'Pipeline',
  PRODUCT_PERFORMANCE: 'Produtos',
  CUSTOMER_ANALYSIS: 'Clientes',
  BID_REPORT: 'Licitações',
  MARKETPLACE_REPORT: 'Marketplaces',
  CASHIER_REPORT: 'Caixa',
  GOAL_PROGRESS: 'Metas',
  CURVA_ABC: 'Curva ABC',
  CUSTOM: 'Personalizado',
};

const TYPE_COLORS: Record<string, string> = {
  SALES_SUMMARY: 'from-sky-500 to-blue-600',
  COMMISSION_REPORT: 'from-emerald-500 to-teal-600',
  PIPELINE_REPORT: 'from-violet-500 to-purple-600',
  PRODUCT_PERFORMANCE: 'from-amber-500 to-orange-600',
  CUSTOMER_ANALYSIS: 'from-teal-500 to-cyan-600',
  CUSTOM: 'from-gray-400 to-gray-500',
};

// ============================================================================
// INFO ROW
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  // We load the list and find the specific report (no individual GET endpoint in service)
  const { data, isLoading, error } = useReportsInfinite();

  const report = useMemo(() => {
    if (!data) return undefined;
    const allReports = data.pages.flatMap(page => page.reports);
    return allReports.find(r => r.id === reportId);
  }, [data, reportId]);

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Relatórios', href: '/sales/analytics/reports' },
    { label: report?.name || '...' },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !report) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Relatório não encontrado"
            message="O relatório que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Relatórios',
              onClick: () => router.push('/sales/analytics/reports'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const formatDateTime = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems} />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br',
                TYPE_COLORS[report.type] ?? 'from-sky-500 to-blue-600'
              )}
            >
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {REPORT_TYPE_LABELS[report.type] ?? report.type}
              </p>
              <h1 className="text-xl font-bold truncate">{report.name}</h1>
              <p className="text-sm text-muted-foreground">
                Formato: {report.format}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                  report.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                )}
              >
                {report.isActive ? 'Ativo' : 'Inativo'}
              </div>
              {report.isScheduled && (
                <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                  Agendado
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Detalhes do Relatório
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configuração e informações do relatório
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow
                  icon={FileText}
                  label="Tipo"
                  value={REPORT_TYPE_LABELS[report.type] ?? report.type}
                />
                <InfoRow
                  icon={FileText}
                  label="Formato"
                  value={report.format}
                />
                <InfoRow
                  icon={Calendar}
                  label="Criado em"
                  value={formatDate(report.createdAt)}
                />
                <InfoRow
                  icon={Clock}
                  label="Última geração"
                  value={
                    report.lastGeneratedAt
                      ? formatDateTime(report.lastGeneratedAt)
                      : 'Nunca gerado'
                  }
                />
                {report.scheduleFrequency && (
                  <InfoRow
                    icon={Clock}
                    label="Frequência"
                    value={report.scheduleFrequency}
                  />
                )}
                {report.deliveryMethod && (
                  <InfoRow
                    icon={Settings}
                    label="Método de entrega"
                    value={report.deliveryMethod}
                  />
                )}
              </div>

              {report.lastStatus && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Status da última geração
                  </p>
                  <p className="text-sm font-medium">{report.lastStatus}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
