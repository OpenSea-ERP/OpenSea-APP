/**
 * Shop Floor Page (Placeholder)
 * Página de chão de fábrica - Em breve
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { HardHat, Timer, BarChart3, Wifi } from 'lucide-react';

export default function ShopFloorPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-8" data-testid="shop-floor-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Chão de Fábrica', href: '/production/shop-floor' },
        ]}
      />

      <PageHeroBanner
        title="Chão de Fábrica"
        description="Apontamento e acompanhamento em tempo real da produção. Controle de paradas, tempos e eficiência."
        icon={HardHat}
        iconGradient="from-slate-500 to-slate-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <Timer className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Apontamento
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Registro de tempos de produção, paradas e apontamentos por operação.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>

        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Tempo Real
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Dashboard em tempo real do status de cada posto de trabalho e ordem
            em execução.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>

        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              OEE
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Indicador de Eficiência Global dos Equipamentos (disponibilidade,
            performance e qualidade).
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>
      </div>
    </div>
  );
}
