'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardsInfinite } from '@/hooks/sales/use-analytics';
import type { AnalyticsDashboard } from '@/types/sales';
import { LayoutDashboard, Plus, Eye, Lock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const ROLE_LABELS: Record<string, string> = {
  SELLER: 'Vendedor',
  MANAGER: 'Gerente',
  DIRECTOR: 'Diretor',
  BID_SPECIALIST: 'Licitador',
  MARKETPLACE_OPS: 'Marketplace',
  CASHIER: 'Caixa',
};

const VISIBILITY_CONFIG: Record<string, { label: string; icon: typeof Lock; color: string }> = {
  PRIVATE: { label: 'Privado', icon: Lock, color: 'text-slate-500' },
  TEAM: { label: 'Equipe', icon: Users, color: 'text-blue-500' },
  TENANT: { label: 'Todos', icon: Eye, color: 'text-green-500' },
};

export default function DashboardsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useDashboardsInfinite();

  const dashboards = useMemo(
    () => data?.pages.flatMap((page) => page.dashboards) ?? [],
    [data],
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics', href: '/sales/analytics' },
            { label: 'Dashboards' },
          ]}
        >
          <Button size="sm" className="h-9 px-2.5">
            <Plus className="h-4 w-4 mr-1" />
            Novo Dashboard
          </Button>
        </PageActionBar>
      </PageHeader>

      <PageBody>
        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError />
        ) : dashboards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <LayoutDashboard className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg font-medium">Nenhum dashboard encontrado</p>
            <p className="text-sm">Crie um dashboard personalizado para visualizar seus dados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map((dashboard: AnalyticsDashboard) => {
              const vis = VISIBILITY_CONFIG[dashboard.visibility] ?? VISIBILITY_CONFIG.PRIVATE;
              const VisIcon = vis.icon;

              return (
                <Card
                  key={dashboard.id}
                  className="bg-white dark:bg-slate-800/60 border border-border hover:border-primary/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/sales/analytics/dashboards/${dashboard.id}`)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <LayoutDashboard className="h-4 w-4 text-purple-500" />
                        </div>
                        <div>
                          <h3 className="font-medium">{dashboard.name}</h3>
                          {dashboard.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {dashboard.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <VisIcon className={`h-3.5 w-3.5 ${vis.color}`} />
                        <span className="text-xs text-muted-foreground">{vis.label}</span>
                      </div>
                      {dashboard.role && (
                        <Badge variant="outline" className="text-xs">
                          {ROLE_LABELS[dashboard.role] ?? dashboard.role}
                        </Badge>
                      )}
                      {dashboard.isSystem && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300"
                        >
                          Sistema
                        </Badge>
                      )}
                      {dashboard.isDefault && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-green-50 text-green-700 dark:bg-green-500/8 dark:text-green-300"
                        >
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
