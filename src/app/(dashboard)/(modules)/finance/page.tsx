/**
 * Finance Module — Smart Command Center
 * Dashboard acionável com widgets de posição de caixa, KPIs, obrigações,
 * aging de vencidos, atividade recente e navegação rápida.
 */

'use client';

import { FinanceChatWidget } from '@/components/finance/finance-chat-widget';
import { QuickEntryModal } from '@/components/finance/quick-entry-modal';
import {
  AnomalyAlerts,
  CashPositionBanner,
  CashflowAlertsBanner,
  FinanceKPICards,
  HealthScoreWidget,
  OverdueHeatmap,
  PaymentTimingWidget,
  QuickActionsWidget,
  QuickNavGrid,
  RecentActivityFeed,
  WeeklyObligations,
} from '@/components/finance/dashboard';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { usePermissions } from '@/hooks/use-permissions';
import { Settings, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function FinanceCommandCenter() {
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'Financeiro', href: '/finance' }]}
        hasPermission={hasPermission}
        buttons={[
          {
            id: 'quick-entry',
            title: 'Lançamento Rápido',
            icon: Zap,
            variant: 'default',
            onClick: () => setQuickEntryOpen(true),
          },
          {
            id: 'settings',
            icon: Settings,
            variant: 'outline',
            tooltip: 'Configurações',
            onClick: () => router.push('/finance/settings'),
          },
        ]}
      />

      {/* Row 0: Cashflow Alerts Banner (above everything) */}
      <CashflowAlertsBanner />

      {/* Row 0.5: Financial Health Score */}
      <HealthScoreWidget />

      {/* Row 1: Cash Position Banner */}
      <CashPositionBanner />

      {/* Row 2: KPI Cards */}
      <FinanceKPICards />

      {/* Row 2.5: Anomaly Alerts */}
      <AnomalyAlerts />

      {/* Row 2.7: Quick Actions */}
      <QuickActionsWidget />

      {/* Row 3: Obligations + Overdue Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeeklyObligations />
        </div>
        <div className="lg:col-span-1">
          <OverdueHeatmap />
        </div>
      </div>

      {/* Row 4: Payment Timing + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PaymentTimingWidget />
        </div>
        <div className="lg:col-span-1">
          <RecentActivityFeed />
        </div>
        <div className="lg:col-span-1">
          <QuickNavGrid />
        </div>
      </div>

      {/* Quick Entry Modal */}
      <QuickEntryModal open={quickEntryOpen} onOpenChange={setQuickEntryOpen} />

      {/* Atlas Conversational Finance Widget */}
      <FinanceChatWidget />
    </div>
  );
}
