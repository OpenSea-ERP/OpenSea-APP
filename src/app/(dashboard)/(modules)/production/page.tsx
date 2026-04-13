/**
 * Production Module Landing Page
 * Página inicial do módulo de produção com hero banner e cards de navegação
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { productionOrdersService } from '@/services/production';
import {
  ClipboardList,
  Cog,
  Factory,
  FlaskConical,
  Gauge,
  HardHat,
  LayoutList,
  Settings,
  Timer,
  Wrench,
  AlertTriangle,
  Bug,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import type { DashboardCard } from '@/components/layout/page-dashboard-sections';

const sections: {
  title: string;
  cards: DashboardCard[];
}[] = [
  {
    title: 'Engenharia',
    cards: [
      {
        id: 'boms',
        title: 'Lista de Materiais (BOM)',
        description: 'Estruturas de produto e composição de materiais',
        icon: LayoutList,
        href: '/production/engineering/boms',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: PRODUCTION_PERMISSIONS.ENGINEERING.ACCESS,
        countKey: 'boms',
      },
      {
        id: 'workstation-types',
        title: 'Tipos de Posto',
        description: 'Classificação dos postos de trabalho',
        icon: Settings,
        href: '/production/engineering/workstation-types',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: PRODUCTION_PERMISSIONS.ENGINEERING.ACCESS,
        countKey: 'workstationTypes',
      },
      {
        id: 'workstations',
        title: 'Postos de Trabalho',
        description: 'Máquinas e postos produtivos',
        icon: Cog,
        href: '/production/engineering/workstations',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: PRODUCTION_PERMISSIONS.ENGINEERING.ACCESS,
        countKey: 'workstations',
      },
      {
        id: 'work-centers',
        title: 'Centros de Trabalho',
        description: 'Agrupamento lógico de postos produtivos',
        icon: Factory,
        href: '/production/engineering/work-centers',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: PRODUCTION_PERMISSIONS.ENGINEERING.ACCESS,
        countKey: 'workCenters',
      },
      {
        id: 'downtime-reasons',
        title: 'Motivos de Parada',
        description: 'Cadastro de razões para paradas de produção',
        icon: AlertTriangle,
        href: '/production/engineering/downtime-reasons',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: PRODUCTION_PERMISSIONS.ENGINEERING.ACCESS,
        countKey: 'downtimeReasons',
      },
      {
        id: 'defect-types',
        title: 'Tipos de Defeito',
        description: 'Classificação de defeitos para controle de qualidade',
        icon: Bug,
        href: '/production/engineering/defect-types',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: PRODUCTION_PERMISSIONS.QUALITY.ACCESS,
        countKey: 'defectTypes',
      },
    ],
  },
  {
    title: 'Em Breve',
    cards: [
      {
        id: 'shop-floor',
        title: 'Chão de Fábrica',
        description: 'Apontamento e acompanhamento em tempo real',
        icon: HardHat,
        href: '/production/shop-floor',
        gradient: 'from-slate-400 to-slate-500',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        permission: PRODUCTION_PERMISSIONS.SHOPFLOOR.ACCESS,
      },
      {
        id: 'planning',
        title: 'Planejamento',
        description: 'MRP, capacidade e sequenciamento',
        icon: Gauge,
        href: '/production/planning',
        gradient: 'from-slate-400 to-slate-500',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        permission: PRODUCTION_PERMISSIONS.PLANNING.ACCESS,
      },
      {
        id: 'quality',
        title: 'Qualidade',
        description: 'Inspeções, não-conformidades e ações corretivas',
        icon: FlaskConical,
        href: '/production/quality',
        gradient: 'from-slate-400 to-slate-500',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        permission: PRODUCTION_PERMISSIONS.QUALITY.ACCESS,
      },
    ],
  },
];

const heroBannerButtons = [
  {
    id: 'orders',
    label: 'Ordens de Produção',
    icon: ClipboardList,
    href: '/production/orders',
    gradient: 'from-amber-500 to-amber-600',
    permission: PRODUCTION_PERMISSIONS.ORDERS.ACCESS,
  },
  {
    id: 'engineering',
    label: 'Engenharia',
    icon: Wrench,
    href: '/production/engineering/boms',
    gradient: 'from-indigo-500 to-indigo-600',
    permission: PRODUCTION_PERMISSIONS.ENGINEERING.ACCESS,
  },
];

export default function ProductionLandingPage() {
  const { hasPermission } = usePermissions();
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      const [ordersCount] = await Promise.allSettled([
        productionOrdersService.countByStatus(),
      ]);

      const totalOrders =
        ordersCount.status === 'fulfilled'
          ? Object.values(ordersCount.value).reduce(
              (sum: number, v: number) => sum + v,
              0,
            )
          : null;

      setCounts({
        orders: totalOrders,
      });
      setCountsLoading(false);
    }
    fetchCounts();
  }, []);

  return (
    <div className="space-y-8" data-testid="production-overview-page">
      <PageActionBar
        breadcrumbItems={[{ label: 'Produção', href: '/production' }]}
      />

      <PageHeroBanner
        title="Produção"
        description="Gerencie ordens de produção, estruturas de produto, postos de trabalho e toda a cadeia produtiva."
        icon={Factory}
        iconGradient="from-amber-500 to-amber-600"
        buttons={heroBannerButtons}
        hasPermission={hasPermission}
      />

      <PageDashboardSections
        sections={sections}
        counts={counts}
        countsLoading={countsLoading}
        hasPermission={hasPermission}
      />
    </div>
  );
}
