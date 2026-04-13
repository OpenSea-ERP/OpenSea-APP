/**
 * Production Analytics Page — Análise de Produção
 * Indicadores de desempenho e visão geral da produção.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, ClipboardList, Loader2, Play } from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { Card } from '@/components/ui/card';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { analyticsService } from '@/services/production';

// ---------------------------------------------------------------------------
// Status color mapping
// ---------------------------------------------------------------------------

const STATUS_COLOR_MAP: Record<
  string,
  { label: string; from: string; to: string }
> = {
  DRAFT: { label: 'Rascunho', from: 'from-slate-400', to: 'to-slate-500' },
  PLANNED: { label: 'Planejada', from: 'from-blue-500', to: 'to-blue-600' },
  FIRM: { label: 'Firme', from: 'from-indigo-500', to: 'to-indigo-600' },
  RELEASED: {
    label: 'Liberada',
    from: 'from-violet-500',
    to: 'to-violet-600',
  },
  IN_PROCESS: {
    label: 'Em Processo',
    from: 'from-amber-500',
    to: 'to-amber-600',
  },
  TECHNICALLY_COMPLETE: {
    label: 'Tecnicamente Concluída',
    from: 'from-emerald-500',
    to: 'to-emerald-600',
  },
  CLOSED: { label: 'Encerrada', from: 'from-green-500', to: 'to-green-600' },
  CANCELLED: {
    label: 'Cancelada',
    from: 'from-rose-500',
    to: 'to-rose-600',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProductionAnalyticsPage() {
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(PRODUCTION_PERMISSIONS.ANALYTICS.ACCESS);

  if (!canAccess) return null;

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['production', 'analytics', 'dashboard'],
    queryFn: async () => {
      return analyticsService.getDashboard();
    },
    enabled: hasPermission(PRODUCTION_PERMISSIONS.ANALYTICS.ACCESS),
  });

  const orderCounts = dashboard?.orderCounts ?? {};

  return (
    <div className="space-y-6" data-testid="production-analytics-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Análise', href: '/production/analytics' },
        ]}
      />

      <PageHeroBanner
        title="Análise de Produção"
        description="Indicadores de desempenho e visão geral da produção"
        icon={BarChart3}
        iconGradient="from-sky-500 to-sky-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <p className="text-sm text-rose-600 dark:text-rose-400">
            Erro ao carregar dados de análise.
          </p>
        </Card>
      )}

      {/* Summary stats */}
      {!isLoading && !error && dashboard && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Total de Ordens
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboard.totalOrders}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-white/60">
                    Ordens Ativas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboard.activeOrders}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Status breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-white/80 mb-3">
              Ordens por Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(orderCounts).map(([status, count]) => {
                const cfg = STATUS_COLOR_MAP[status] ?? {
                  label: status,
                  from: 'from-gray-400',
                  to: 'to-gray-500',
                };
                return (
                  <Card
                    key={status}
                    className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full bg-linear-to-br ${cfg.from} ${cfg.to}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-500 dark:text-white/60 truncate">
                          {cfg.label}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {count}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
