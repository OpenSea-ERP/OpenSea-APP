'use client';

import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSalesDashboard } from '@/hooks/sales';
import {
  BarChart3,
  Target,
  FileText,
  Trophy,
  LayoutDashboard,
  TrendingUp,
  Users,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ANALYTICS_SECTIONS = [
  {
    title: 'Metas',
    description: 'Acompanhe metas de vendas individuais, por equipe ou globais',
    icon: Target,
    href: '/sales/analytics/goals',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'Relatórios',
    description: 'Gere e agende relatórios de vendas, comissões e performance',
    icon: FileText,
    href: '/sales/analytics/reports',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: 'Rankings',
    description: 'Leaderboards de vendedores, produtos e clientes',
    icon: Trophy,
    href: '/sales/analytics/rankings',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    title: 'Dashboards',
    description: 'Dashboards personalizados com widgets configuráveis',
    icon: LayoutDashboard,
    href: '/sales/analytics/dashboards',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KPICardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  accentBg: string;
  accentIcon: string;
  isLoading: boolean;
}

function KPICard({
  label,
  value,
  subtitle,
  icon: Icon,
  accentBg,
  accentIcon,
  isLoading,
}: KPICardProps) {
  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {label}
            </p>
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <p className="text-xl font-bold tracking-tight tabular-nums">
                  {value}
                </p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </>
            )}
          </div>
          <div className={`p-2.5 rounded-xl ${accentBg} shrink-0`}>
            <Icon className={`h-5 w-5 ${accentIcon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AnalyticsPage() {
  const { data, isLoading } = useSalesDashboard();

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[{ label: 'Vendas' }, { label: 'Analytics' }]}
        />
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Quick Stats — wired to real data */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Vendas do Mês"
              value={data ? formatCurrency(data.monthlyRevenue) : '--'}
              subtitle={
                data
                  ? `${data.monthlyOrderCount} pedido${data.monthlyOrderCount !== 1 ? 's' : ''} confirmado${data.monthlyOrderCount !== 1 ? 's' : ''}`
                  : undefined
              }
              icon={TrendingUp}
              accentBg="bg-emerald-50 dark:bg-emerald-500/10"
              accentIcon="text-emerald-600 dark:text-emerald-400"
              isLoading={isLoading}
            />
            <KPICard
              label="Pedidos Pendentes"
              value={data ? data.pendingOrders.toLocaleString('pt-BR') : '--'}
              subtitle={data ? `${data.openDeals} negócios abertos` : undefined}
              icon={ShoppingCart}
              accentBg="bg-blue-50 dark:bg-blue-500/10"
              accentIcon="text-blue-600 dark:text-blue-400"
              isLoading={isLoading}
            />
            <KPICard
              label="Ticket Médio"
              value={data ? formatCurrency(data.averageTicket) : '--'}
              icon={BarChart3}
              accentBg="bg-violet-50 dark:bg-violet-500/10"
              accentIcon="text-violet-600 dark:text-violet-400"
              isLoading={isLoading}
            />
            <KPICard
              label="Clientes Cadastrados"
              value={data ? data.totalCustomers.toLocaleString('pt-BR') : '--'}
              subtitle={
                data
                  ? `${data.conversionRate.toFixed(1)}% taxa de conversão`
                  : undefined
              }
              icon={Users}
              accentBg="bg-sky-50 dark:bg-sky-500/10"
              accentIcon="text-sky-600 dark:text-sky-400"
              isLoading={isLoading}
            />
          </div>

          {/* Section Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ANALYTICS_SECTIONS.map(section => (
              <Link key={section.href} href={section.href}>
                <Card className="bg-white dark:bg-slate-800/60 border border-border hover:border-primary/30 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${section.bgColor}`}>
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <CardTitle className="text-base">
                        {section.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </PageBody>
    </PageLayout>
  );
}
