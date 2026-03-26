/**
 * Sales Module Landing Page
 * Página inicial do módulo de vendas com KPIs reais e cards de navegação
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
  Bell,
  BookOpen,
  ClipboardList,
  Contact,
  CreditCard,
  DollarSign,
  FileText,
  Gavel,
  GitBranch,
  Globe,
  Handshake,
  Megaphone,
  Monitor,
  Package,
  PackageCheck,
  Palette,
  Percent,
  RotateCcw,
  ShoppingCart,
  Target,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
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
        icon: ShoppingCart,
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
        id: 'contacts',
        title: 'Contatos',
        description: 'Gerencie contatos comerciais',
        icon: Contact,
        href: '/sales/contacts',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: SALES_PERMISSIONS.CONTACTS.ACCESS,
      },
      {
        id: 'catalogs',
        title: 'Catálogos',
        description: 'Catálogos de produtos para apresentação',
        icon: BookOpen,
        href: '/sales/catalogs',
        gradient: 'from-purple-500 to-purple-600',
        hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-500/10',
        permission: SALES_PERMISSIONS.CATALOGS.ACCESS,
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
        permission: SALES_PERMISSIONS.RETURNS.ACCESS,
      },
      {
        id: 'payment-conditions',
        title: 'Condições de Pagamento',
        description: 'Configure condições e prazos de pagamento',
        icon: CreditCard,
        href: '/sales/payment-conditions',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
      },
    ],
  },
  {
    title: 'CRM e Pipeline',
    cards: [
      {
        id: 'pipelines',
        title: 'Pipelines',
        description: 'Funis de vendas e etapas do processo comercial',
        icon: GitBranch,
        href: '/sales/pipelines',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: SALES_PERMISSIONS.PIPELINES.ACCESS,
      },
      {
        id: 'deals',
        title: 'Negócios',
        description: 'Oportunidades e negociações em andamento',
        icon: Handshake,
        href: '/sales/deals',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: SALES_PERMISSIONS.DEALS.ACCESS,
      },
      {
        id: 'item-reservations',
        title: 'Reservas de Itens',
        description: 'Controle de reservas de produtos para pedidos',
        icon: PackageCheck,
        href: '/sales/item-reservations',
        gradient: 'from-orange-500 to-orange-600',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
      },
    ],
  },
  {
    title: 'Preços e Promoções',
    cards: [
      {
        id: 'pricing',
        title: 'Tabelas de Preço',
        description: 'Gerencie tabelas de preço e políticas comerciais',
        icon: DollarSign,
        href: '/sales/pricing',
        gradient: 'from-emerald-500 to-emerald-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        permission: SALES_PERMISSIONS.PRICE_TABLES.ACCESS,
      },
      {
        id: 'customer-prices',
        title: 'Preços por Cliente',
        description: 'Preços especiais e negociados por cliente',
        icon: UserCheck,
        href: '/sales/customer-prices',
        gradient: 'from-cyan-500 to-cyan-600',
        hoverBg: 'hover:bg-cyan-50 dark:hover:bg-cyan-500/10',
        permission: SALES_PERMISSIONS.CUSTOMER_PRICES.ACCESS,
      },
      {
        id: 'campaigns',
        title: 'Campanhas',
        description: 'Campanhas de marketing e comunicação',
        icon: Megaphone,
        href: '/sales/campaigns',
        gradient: 'from-pink-500 to-pink-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        permission: SALES_PERMISSIONS.CAMPAIGNS.ACCESS,
      },
      {
        id: 'combos',
        title: 'Combos',
        description: 'Pacotes e combos de produtos',
        icon: Package,
        href: '/sales/combos',
        gradient: 'from-blue-500 to-blue-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        permission: SALES_PERMISSIONS.COMBOS.ACCESS,
      },
      {
        id: 'coupons',
        title: 'Cupons',
        description: 'Cupons de desconto e códigos promocionais',
        icon: Ticket,
        href: '/sales/coupons',
        gradient: 'from-fuchsia-500 to-fuchsia-600',
        hoverBg: 'hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10',
        permission: SALES_PERMISSIONS.COUPONS.ACCESS,
      },
      {
        id: 'variant-promotions',
        title: 'Promoções de Variantes',
        description: 'Promoções aplicadas a variantes de produtos',
        icon: Percent,
        href: '/sales/variant-promotions',
        gradient: 'from-amber-500 to-amber-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        permission: SALES_PERMISSIONS.PROMOTIONS.ACCESS,
      },
      {
        id: 'store-credits',
        title: 'Créditos de Loja',
        description: 'Gerencie créditos e saldos de clientes',
        icon: Wallet,
        href: '/sales/store-credits',
        gradient: 'from-teal-500 to-teal-600',
        hoverBg: 'hover:bg-teal-50 dark:hover:bg-teal-500/10',
        permission: SALES_PERMISSIONS.STORE_CREDITS.ACCESS,
      },
    ],
  },
  {
    title: 'Canais de Venda',
    cards: [
      {
        id: 'pos',
        title: 'PDV',
        description: 'Ponto de venda e operações de caixa',
        icon: Monitor,
        href: '/sales/pos',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: SALES_PERMISSIONS.POS.ACCESS,
      },
      {
        id: 'marketplaces',
        title: 'Marketplaces',
        description: 'Integrações com marketplaces e canais externos',
        icon: Globe,
        href: '/sales/marketplaces',
        gradient: 'from-sky-500 to-sky-600',
        hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-500/10',
        permission: SALES_PERMISSIONS.MARKETPLACES.ACCESS,
      },
      {
        id: 'bids',
        title: 'Licitações',
        description: 'Gerencie licitações e processos públicos',
        icon: Gavel,
        href: '/sales/bids',
        gradient: 'from-slate-500 to-slate-600',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        permission: SALES_PERMISSIONS.BIDS.ACCESS,
      },
    ],
  },
  {
    title: 'Conteúdo e Marca',
    cards: [
      {
        id: 'brand',
        title: 'Marca',
        description: 'Identidade visual e diretrizes da marca',
        icon: Palette,
        href: '/sales/brand',
        gradient: 'from-rose-500 to-rose-600',
        hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
        permission: SALES_PERMISSIONS.BRAND.ACCESS,
      },
      {
        id: 'content',
        title: 'Conteúdo',
        description: 'Gestão de conteúdo e materiais de marketing',
        icon: FileText,
        href: '/sales/content',
        gradient: 'from-violet-500 to-violet-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        permission: SALES_PERMISSIONS.CONTENT.ACCESS,
      },
    ],
  },
  {
    title: 'Inteligência',
    cards: [
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Relatórios e indicadores de vendas',
        icon: BarChart3,
        href: '/sales/analytics',
        gradient: 'from-indigo-500 to-indigo-600',
        hoverBg: 'hover:bg-indigo-50 dark:hover:bg-indigo-500/10',
        permission: SALES_PERMISSIONS.ANALYTICS.ACCESS,
      },
      {
        id: 'notification-preferences',
        title: 'Preferências de Notificação',
        description: 'Configure alertas e notificações de vendas',
        icon: Bell,
        href: '/sales/notification-preferences',
        gradient: 'from-orange-500 to-orange-600',
        hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
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
        description="Gerencie pedidos, clientes, catálogos e toda a operação comercial do seu negócio."
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
          label="Catálogos"
          value={kpi.totalCatalogs}
          loading={loading}
          icon={BookOpen}
          iconColor="text-purple-500"
          iconBg="bg-purple-500/10"
        />
        <KpiCard
          label="Meta do Mês"
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
