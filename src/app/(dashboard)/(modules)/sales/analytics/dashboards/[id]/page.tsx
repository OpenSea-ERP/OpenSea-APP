'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useDashboard, useDeleteDashboard } from '@/hooks/sales/use-analytics';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Pencil,
  Trash2,
  ArrowLeft,
  Eye,
  Lock,
  Target,
  ShoppingCart,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  SELLER: 'Vendedor',
  MANAGER: 'Gerente',
  DIRECTOR: 'Diretor',
  BID_SPECIALIST: 'Licitador',
  MARKETPLACE_OPS: 'Marketplace',
  CASHIER: 'Caixa',
};

const VISIBILITY_CONFIG: Record<
  string,
  { label: string; icon: typeof Lock; color: string }
> = {
  PRIVATE: { label: 'Privado', icon: Lock, color: 'text-slate-500' },
  TEAM: { label: 'Equipe', icon: Users, color: 'text-blue-500' },
  TENANT: { label: 'Todos', icon: Eye, color: 'text-green-500' },
};

const WIDGET_PLACEHOLDERS = [
  {
    title: 'Receita Total',
    icon: DollarSign,
    color: 'emerald',
    value: '--',
    description: 'Receita acumulada no periodo',
  },
  {
    title: 'Pedidos',
    icon: ShoppingCart,
    color: 'blue',
    value: '--',
    description: 'Total de pedidos realizados',
  },
  {
    title: 'Ticket Medio',
    icon: BarChart3,
    color: 'amber',
    value: '--',
    description: 'Valor medio por pedido',
  },
  {
    title: 'Novos Clientes',
    icon: UserCheck,
    color: 'purple',
    value: '--',
    description: 'Clientes cadastrados no periodo',
  },
];

export default function DashboardViewPage() {
  const params = useParams();
  const router = useRouter();
  const dashboardId = params.id as string;

  const { data: dashboard, isLoading, error } = useDashboard(dashboardId);
  const deleteMutation = useDeleteDashboard();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(dashboardId);
      toast.success('Dashboard excluído com sucesso.');
      router.push('/sales/analytics/dashboards');
    } catch {
      toast.error('Erro ao excluir dashboard.');
    }
  }, [dashboardId, deleteMutation, router]);

  const breadcrumbItems = [
    { label: 'Vendas' },
    { label: 'Analytics', href: '/sales/analytics' },
    { label: 'Dashboards', href: '/sales/analytics/dashboards' },
    { label: dashboard?.name ?? 'Carregando...' },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Dashboard não encontrado"
            message="O dashboard solicitado não foi encontrado."
            action={{
              label: 'Voltar para Dashboards',
              onClick: () => router.push('/sales/analytics/dashboards'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const vis =
    VISIBILITY_CONFIG[dashboard.visibility] ?? VISIBILITY_CONFIG.PRIVATE;
  const VisIcon = vis.icon;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems}>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => router.push('/sales/analytics/dashboards')}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
            {!dashboard.isSystem && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-2.5 bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Excluir
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-2.5"
                  onClick={() =>
                    router.push(
                      `/sales/analytics/dashboards/${dashboardId}/edit`
                    )
                  }
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Editar
                </Button>
              </>
            )}
          </div>
        </PageActionBar>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Identity Card */}
          <Card className="bg-white/5 p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <LayoutDashboard className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{dashboard.name}</h2>
                {dashboard.description && (
                  <p className="text-sm text-muted-foreground">
                    {dashboard.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <VisIcon className={`h-3.5 w-3.5 ${vis.color}`} />
                    <span className="text-xs text-muted-foreground">
                      {vis.label}
                    </span>
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
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                Criado em{' '}
                {new Date(dashboard.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </Card>

          {/* KPI Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {WIDGET_PLACEHOLDERS.map(widget => (
              <Card
                key={widget.title}
                className="bg-white dark:bg-slate-800/60 border border-border"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${widget.color}-500/10`}>
                      <widget.icon
                        className={`h-5 w-5 text-${widget.color}-500`}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {widget.title}
                      </p>
                      <p className="text-xl font-semibold">{widget.value}</p>
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
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  Vendas por Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">
                      Grafico sera carregado com dados reais
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800/60 border border-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-emerald-500" />
                  Distribuicao por Canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Widgets configuraveis em breve</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Goals widget */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                Metas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">As metas ativas serao exibidas aqui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Dashboard"
        description={`Digite seu PIN de ação para excluir o dashboard "${dashboard.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
