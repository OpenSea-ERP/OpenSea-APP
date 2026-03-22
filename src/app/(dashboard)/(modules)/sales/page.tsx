/**
 * Sales Module Landing Page
 * Pagina inicial do modulo de vendas com KPIs reais e cards de navegacao
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageDashboardSections } from '@/components/layout/page-dashboard-sections';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { Card, CardContent } from '@/components/ui/card';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  customersService,
  ordersService,
  catalogsService,
} from '@/services/sales';

import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Megaphone,
  Percent,
  RotateCcw,
  ShoppingCart,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SalesKpi {
  totalOrders: number | null;
  totalCustomers: number | null;
  totalCatalogs: number | null;
}

interface CardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  hoverBg: string;
  permission?: string;
  countKey?: string;
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  loading,
  icon: Icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string | number | null;
  loading: boolean;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <div className="h-7 w-16 mt-0.5 rounded bg-gray-200 dark:bg-white/10 animate-pulse" />
            ) : (
              <p className="text-xl font-semibold">
                {value !== null ? value : '--'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

const sections: { title: string; cards: CardItem[] }[] = [
  {
    title: 'Comercial',
    cards: [
      {
        id: 'orders',
        title: 'Pedidos',
        description: 'Crie e gerencie pedidos de venda',
        icon: ClipboardList,
        href: '/sales/orders',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: SALES_PERMISSIONS.ORDERS.ACCESS,
        countKey: 'orders',
      },
      {
        id: 'customers',
        title: 'Clientes',
        description: 'Cadastro de clientes e contatos',
        icon: Users,
        href: '/sales/customers',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: SALES_PERMISSIONS.CUSTOMERS.ACCESS,
        countKey: 'customers',
      },
      {
        id: 'catalogs',
        title: 'Catalogos',
        description: 'Catalogos de produtos para apresentacao',
        icon: BookOpen,
        href: '/sales/catalogs',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        countKey: 'catalogs',
      },
      {
        id: 'returns',
        title: 'Devoluções',
        description: 'Gerencie devoluções e trocas',
        icon: RotateCcw,
        href: '/sales/returns',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
      },
    ],
  },
  {
    title: 'Marketing e Promoções',
    cards: [
      {
        id: 'promotions',
        title: 'Promoções',
        description: 'Gerencie promoções de produtos',
        icon: Percent,
        href: '/sales/promotions',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: SALES_PERMISSIONS.PROMOTIONS.ACCESS,
      },
      {
        id: 'campaigns',
        title: 'Campanhas',
        description: 'Campanhas de marketing e comunicacao',
        icon: Megaphone,
        href: '/sales/campaigns',
        gradient: 'from-cyan-500 to-cyan-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
        permission: SALES_PERMISSIONS.CAMPAIGNS.ACCESS,
      },
    ],
  },
];

const heroBannerButtons = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/sales/analytics',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: ClipboardList,
    href: '/sales/orders',
    gradient: 'from-blue-500 to-blue-600',
    permission: SALES_PERMISSIONS.ORDERS.ACCESS,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SalesLandingPage() {
  const { hasPermission } = usePermissions();
  const [kpi, setKpi] = useState<SalesKpi>({
    totalOrders: null,
    totalCustomers: null,
    totalCatalogs: null,
  });
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [ordersRes, customersRes, catalogsRes] = await Promise.allSettled([
        ordersService.listOrders({ page: 1, limit: 1 }),
        customersService.listCustomers(),
        catalogsService.listCatalogs(),
      ]);

      const orderCount =
        ordersRes.status === 'fulfilled'
          ? (ordersRes.value.meta?.total ??
            ordersRes.value.data?.length ??
            null)
          : null;

      const customerCount =
        customersRes.status === 'fulfilled'
          ? (customersRes.value.customers?.length ?? null)
          : null;

      const catalogCount =
        catalogsRes.status === 'fulfilled'
          ? (catalogsRes.value.data?.length ?? null)
          : null;

      setKpi({
        totalOrders: orderCount,
        totalCustomers: customerCount,
        totalCatalogs: catalogCount,
      });

      setCounts({
        orders: orderCount,
        customers: customerCount,
        catalogs: catalogCount,
      });

      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <PageActionBar breadcrumbItems={[{ label: 'Vendas', href: '/sales' }]} />

      <PageHeroBanner
        title="Vendas"
        description="Gerencie pedidos, clientes, catalogos e toda a operacao comercial do seu negocio."
        icon={ShoppingCart}
        iconGradient="from-blue-500 to-blue-600"
        buttons={heroBannerButtons}
        hasPermission={hasPermission}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de Pedidos"
          value={kpi.totalOrders}
          loading={loading}
          icon={TrendingUp}
          iconColor="text-blue-500"
          iconBg="bg-blue-500/10"
        />
        <KpiCard
          label="Clientes"
          value={kpi.totalCustomers}
          loading={loading}
          icon={Users}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-500/10"
        />
        <KpiCard
          label="Catalogos"
          value={kpi.totalCatalogs}
          loading={loading}
          icon={BookOpen}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
        <KpiCard
          label="Meta do Mes"
          value="--"
          loading={false}
          icon={Target}
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
        />
      </div>

      <PageDashboardSections
        sections={sections}
        counts={counts}
        countsLoading={loading}
        hasPermission={hasPermission}
      />
    </div>
  );
}
