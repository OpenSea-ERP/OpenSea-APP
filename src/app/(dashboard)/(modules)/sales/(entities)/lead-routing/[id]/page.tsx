/**
 * OpenSea OS - Lead Routing Rule Detail Page
 * Detalhes da regra de roteamento com estatísticas de atribuição
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useDeleteLeadRoutingRule,
  useLeadRoutingRule,
} from '@/hooks/sales/use-lead-routing';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { LeadRoutingStrategy } from '@/types/sales';
import { LEAD_ROUTING_STRATEGY_LABELS } from '@/types/sales';
import {
  GitBranch,
  Globe,
  RefreshCcw,
  Scale,
  Shuffle,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

const STRATEGY_ICONS: Record<LeadRoutingStrategy, React.ElementType> = {
  ROUND_ROBIN: RefreshCcw,
  TERRITORY: Globe,
  SEGMENT: GitBranch,
  LOAD_BALANCE: Scale,
};

export default function LeadRoutingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const ruleId = params.id as string;

  const { data, isLoading, error, refetch } = useLeadRoutingRule(ruleId);
  const deleteMutation = useDeleteLeadRoutingRule();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const rule = data?.rule;

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(ruleId);
    setDeleteModalOpen(false);
    toast.success('Regra excluída com sucesso!');
    router.push('/sales/lead-routing');
  }, [ruleId, deleteMutation, router]);

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Lead Routing', href: '/sales/lead-routing' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="grid" size="md" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !rule) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Lead Routing', href: '/sales/lead-routing' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar regra"
            message="Não foi possível carregar os dados da regra de roteamento."
            action={{
              label: 'Tentar Novamente',
              onClick: async () => {
                await refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const StrategyIcon = STRATEGY_ICONS[rule.strategy];

  return (
    <PageLayout data-testid="lead-route-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Lead Routing', href: '/sales/lead-routing' },
            { label: rule.name },
          ]}
          buttons={[
            ...(hasPermission(SALES_PERMISSIONS.LEAD_ROUTING.REMOVE)
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
              <Shuffle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {rule.name}
              </h1>
              {rule.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {rule.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    rule.isActive
                      ? 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-300 bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                  )}
                >
                  {rule.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <StrategyIcon className="h-3 w-3" />
                  {LEAD_ROUTING_STRATEGY_LABELS[rule.strategy]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Criada em{' '}
                  {new Date(rule.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-teal-500" />
              <div>
                <p className="text-sm font-medium">
                  {rule.assignments?.length ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Vendedores</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Shuffle className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-sm font-medium">{rule.totalRouted}</p>
                <p className="text-xs text-muted-foreground">Leads Roteados</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Assignments */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 mt-4">
          <h3 className="text-sm font-semibold mb-4">
            Vendedores Atribuídos ({rule.assignments?.length ?? 0})
          </h3>

          {!rule.assignments || rule.assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum vendedor atribuído a esta regra.
            </p>
          ) : (
            <div className="space-y-3">
              {rule.assignments.map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {assignment.userName || assignment.userId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.totalAssigned} leads atribuídos
                    </p>
                  </div>
                  {assignment.lastAssignedAt && (
                    <span className="text-xs text-muted-foreground">
                      Último:{' '}
                      {new Date(assignment.lastAssignedAt).toLocaleDateString(
                        'pt-BR'
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDelete}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta regra. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
