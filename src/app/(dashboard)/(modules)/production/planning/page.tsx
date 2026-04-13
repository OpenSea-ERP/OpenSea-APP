/**
 * Planning Page (Placeholder)
 * Página de planejamento de produção - Em breve
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { CalendarRange, Gauge, GitBranch, Layers } from 'lucide-react';

export default function PlanningPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-8" data-testid="planning-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Planejamento', href: '/production/planning' },
        ]}
      />

      <PageHeroBanner
        title="Planejamento"
        description="MRP, planejamento de capacidade e sequenciamento de ordens de produção."
        icon={Gauge}
        iconGradient="from-slate-500 to-slate-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              MRP
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Planejamento de Necessidades de Materiais. Cálculo automático de
            demanda de componentes e matérias-primas.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>

        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <CalendarRange className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Capacidade
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Planejamento de capacidade produtiva. Visualização de carga por
            posto e centro de trabalho.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>

        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Sequenciamento
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Sequenciamento e priorização de ordens de produção com base em
            prazos, prioridade e disponibilidade.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>
      </div>
    </div>
  );
}
