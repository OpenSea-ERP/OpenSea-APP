'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { useReportsInfinite } from '@/hooks/sales/use-analytics';
import type { AnalyticsReport } from '@/types/sales';
import { FileText, Plus, Clock, Calendar } from 'lucide-react';
import { useMemo, useState } from 'react';

const TYPE_LABELS: Record<string, string> = {
  SALES_SUMMARY: 'Resumo de Vendas',
  COMMISSION_REPORT: 'Comissões',
  PIPELINE_REPORT: 'Pipeline',
  PRODUCT_PERFORMANCE: 'Performance de Produtos',
  CUSTOMER_ANALYSIS: 'Análise de Clientes',
  BID_REPORT: 'Licitações',
  MARKETPLACE_REPORT: 'Marketplace',
  CASHIER_REPORT: 'Caixa',
  GOAL_PROGRESS: 'Progresso de Metas',
  CURVA_ABC: 'Curva ABC',
  CUSTOM: 'Personalizado',
};

const FORMAT_LABELS: Record<string, string> = {
  PDF: 'PDF',
  EXCEL: 'Excel',
  CSV: 'CSV',
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
};

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'SALES_SUMMARY', label: 'Resumo de Vendas' },
  { value: 'COMMISSION_REPORT', label: 'Comissões' },
  { value: 'PRODUCT_PERFORMANCE', label: 'Performance de Produtos' },
  { value: 'CUSTOMER_ANALYSIS', label: 'Análise de Clientes' },
  { value: 'GOAL_PROGRESS', label: 'Progresso de Metas' },
  { value: 'CURVA_ABC', label: 'Curva ABC' },
];

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState('');

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {};
    if (typeFilter) f.type = typeFilter;
    return f;
  }, [typeFilter]);

  const { data, isLoading, error } = useReportsInfinite(filters);

  const reports = useMemo(
    () => data?.pages.flatMap((page) => page.reports) ?? [],
    [data],
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics', href: '/sales/analytics' },
            { label: 'Relatórios' },
          ]}
        >
          <Button size="sm" className="h-9 px-2.5">
            <Plus className="h-4 w-4 mr-1" />
            Novo Relatório
          </Button>
        </PageActionBar>
      </PageHeader>

      <PageBody>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FilterDropdown
              label="Tipo"
              options={TYPE_FILTER_OPTIONS}
              value={typeFilter}
              onChange={setTypeFilter}
            />
          </div>

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError />
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-40" />
              <p className="text-lg font-medium">Nenhum relatório encontrado</p>
              <p className="text-sm">Crie seu primeiro relatório para gerar insights de vendas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: AnalyticsReport) => (
                <Card
                  key={report.id}
                  className="bg-white dark:bg-slate-800/60 border border-border hover:border-primary/20 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <FileText className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{report.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">
                              {TYPE_LABELS[report.type] ?? report.type}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {FORMAT_LABELS[report.format] ?? report.format}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        {report.isScheduled && report.scheduleFrequency && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs">
                              {FREQUENCY_LABELS[report.scheduleFrequency]}
                            </span>
                          </div>
                        )}
                        {report.lastGeneratedAt && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs">
                              {new Date(report.lastGeneratedAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        <Badge
                          variant="secondary"
                          className={
                            report.isActive
                              ? 'bg-green-50 text-green-700 dark:bg-green-500/8 dark:text-green-300'
                              : 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300'
                          }
                        >
                          {report.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageBody>
    </PageLayout>
  );
}
