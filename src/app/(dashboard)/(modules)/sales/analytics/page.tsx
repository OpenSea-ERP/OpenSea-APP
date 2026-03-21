'use client';

import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  Target,
  FileText,
  Trophy,
  LayoutDashboard,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

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

export default function AnalyticsPage() {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendas do Mês</p>
                    <p className="text-xl font-semibold">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Target className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progresso da Meta</p>
                    <p className="text-xl font-semibold">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-xl font-semibold">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Trophy className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Novos Clientes</p>
                    <p className="text-xl font-semibold">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ANALYTICS_SECTIONS.map((section) => (
              <Link key={section.href} href={section.href}>
                <Card className="bg-white dark:bg-slate-800/60 border border-border hover:border-primary/30 transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${section.bgColor}`}>
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <CardTitle className="text-base">{section.title}</CardTitle>
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
