'use client';

/**
 * /hr/punch/dashboard — Manager dashboard (Phase 7 / Plan 07-06 / Task 3).
 *
 * Layout (responsive):
 *   - Desktop (lg+): grid 2/3 (heatmap) + 1/3 (feed) on top, then 2 compact
 *     cards (missing + devices) underneath at full width.
 *   - Mobile: stacks vertically; heatmap scrolls horizontally with sticky
 *     first column.
 *
 * Permission-gated by NOT rendering when user lacks
 * `hr.punch-approvals.access` or `hr.punch-approvals.admin`.
 */

import { Suspense, useState } from 'react';
import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { EmployeeDayHeatmap } from '@/components/ui/heatmap/employee-day-heatmap';
import type { HeatmapCell } from '@/components/ui/heatmap/employee-day-heatmap';
import { PunchDashboardFeed } from '@/components/hr/punch/PunchDashboardFeed';
import { PunchMissingCard } from '@/components/hr/punch/PunchMissingCard';
import { PunchDeviceStatusCard } from '@/components/hr/punch/PunchDeviceStatusCard';
import { PunchExportModal } from '@/components/hr/punch/PunchExportModal';
import { PunchCellDetailDrawer } from '@/components/hr/punch/PunchCellDetailDrawer';
import { usePunchHeatmap } from '@/hooks/hr/use-punch-heatmap';
import { Download } from 'lucide-react';

function HeatmapSkeleton() {
  return (
    <Card data-testid="punch-heatmap-skeleton" className="space-y-2 p-4">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </Card>
  );
}

function Content() {
  const { hasPermission } = usePermissions();
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [exportOpen, setExportOpen] = useState(false);
  const [drawerCell, setDrawerCell] = useState<HeatmapCell | null>(null);
  const heatmap = usePunchHeatmap({ month });

  const canAccess =
    hasPermission('hr.punch-approvals.access') ||
    hasPermission('hr.punch-approvals.admin');

  if (!canAccess) {
    // Permission-gated: do not render the dashboard at all.
    return null;
  }

  // Avoid unused-var lint while keeping the setter for future month picker.
  void setMonth;

  const todayColId = new Date().toISOString().slice(0, 10);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Ponto', href: '/hr/punch/dashboard' },
            { label: 'Dashboard', href: '/hr/punch/dashboard' },
          ]}
          buttons={[
            {
              id: 'export',
              label: 'Exportar',
              icon: Download,
              onClick: () => setExportOpen(true),
              variant: 'outline',
            },
          ]}
        />
        <Header
          title="Dashboard de Ponto"
          description="Acompanhe batidas em tempo real e exceções pendentes"
        />
      </PageHeader>

      <PageBody>
        <div
          data-testid="punch-dashboard-page"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          <div className="lg:col-span-2 overflow-x-auto">
            {heatmap.isError ? (
              <GridError
                type="server"
                message={heatmap.error?.message ?? 'Falha ao carregar heatmap'}
                action={{
                  label: 'Tentar novamente',
                  onClick: () => {
                    void heatmap.refetch();
                  },
                }}
              />
            ) : heatmap.isLoading ? (
              <HeatmapSkeleton />
            ) : !heatmap.data ? null : (
              <EmployeeDayHeatmap
                rows={heatmap.data.rows}
                columns={heatmap.data.columns}
                cells={heatmap.data.cells}
                onCellClick={cell => setDrawerCell(cell)}
                todayColId={todayColId}
                emptyMessage="Sem dados para este mês."
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <PunchDashboardFeed />
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <PunchMissingCard />
            <PunchDeviceStatusCard />
          </div>
        </div>
      </PageBody>

      <PunchExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />

      {drawerCell && (
        <PunchCellDetailDrawer
          cell={drawerCell}
          onClose={() => setDrawerCell(null)}
        />
      )}
    </PageLayout>
  );
}

export default function PunchDashboardPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-2" />}
    >
      <Content />
    </Suspense>
  );
}
