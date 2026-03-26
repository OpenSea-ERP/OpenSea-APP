/**
 * Sales Module — Dashboard
 * Painel com KPIs reais, gráfico de vendas diárias, pedidos por status,
 * acesso rápido a sub-módulos e atividade recente.
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import {
  DailySalesChart,
  OrdersByStatus,
  QuickAccessGrid,
  RecentOrdersTable,
  SalesKPICards,
} from '@/components/sales/dashboard';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useSalesDashboard } from '@/hooks/sales/use-sales-dashboard';
import {
  BarChart3,
  ClipboardList,
  GitBranch,
  Handshake,
  ShoppingCart,
  Users,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Hero banner buttons
// ---------------------------------------------------------------------------

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
  {
    id: 'contacts',
    label: 'Contatos',
    icon: Users,
    href: '/sales/contacts',
    gradient: 'from-teal-500 to-teal-600',
    permission: SALES_PERMISSIONS.CONTACTS.ACCESS,
  },
  {
    id: 'pipelines',
    label: 'Pipeline',
    icon: GitBranch,
    href: '/sales/pipelines',
    gradient: 'from-violet-500 to-violet-600',
    permission: SALES_PERMISSIONS.PIPELINES.ACCESS,
  },
  {
    id: 'deals',
    label: 'Negócios',
    icon: Handshake,
    href: '/sales/deals',
    gradient: 'from-emerald-500 to-emerald-600',
    permission: SALES_PERMISSIONS.DEALS.ACCESS,
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SalesDashboardPage() {
  const { hasPermission } = usePermissions();
  const { data, isLoading } = useSalesDashboard();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <PageActionBar breadcrumbItems={[{ label: 'Vendas', href: '/sales' }]} />

      {/* Hero Banner */}
      <PageHeroBanner
        title="Vendas"
        description="Gerencie pedidos, clientes, catálogos e toda a operação comercial do seu negócio."
        icon={ShoppingCart}
        iconGradient="from-blue-500 to-blue-600"
        buttons={heroBannerButtons}
        hasPermission={hasPermission}
      />

      {/* Row 1: KPI Summary Cards */}
      <SalesKPICards data={data} isLoading={isLoading} />

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DailySalesChart data={data} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <OrdersByStatus data={data} isLoading={isLoading} />
        </div>
      </div>

      {/* Row 3: Quick Access */}
      <QuickAccessGrid
        data={data}
        isLoading={isLoading}
        hasPermission={hasPermission}
      />

      {/* Row 4: Recent Activity */}
      <RecentOrdersTable data={data} isLoading={isLoading} />
    </div>
  );
}
