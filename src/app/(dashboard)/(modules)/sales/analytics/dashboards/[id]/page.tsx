'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, BarChart3, TrendingUp, PieChart } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function DashboardViewPage() {
  const params = useParams();
  const dashboardId = params.id as string;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics', href: '/sales/analytics' },
            { label: 'Dashboards', href: '/sales/analytics/dashboards' },
            { label: 'Visualizar' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <div className="space-y-4">
          {/* Placeholder widget grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Vendas do Mês', icon: TrendingUp, color: 'blue' },
              { title: 'Ticket Médio', icon: BarChart3, color: 'green' },
              { title: 'Meta', icon: LayoutDashboard, color: 'amber' },
              { title: 'Novos Clientes', icon: PieChart, color: 'purple' },
            ].map((widget) => (
              <Card
                key={widget.title}
                className="bg-white dark:bg-slate-800/60 border border-border"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${widget.color}-500/10`}>
                      <widget.icon className={`h-5 w-5 text-${widget.color}-500`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{widget.title}</p>
                      <p className="text-xl font-semibold">--</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardHeader>
                <CardTitle className="text-sm">Vendas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Gráfico será carregado com dados reais</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dashboard ID: {dashboardId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Widgets configuráveis em breve</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageBody>
    </PageLayout>
  );
}
