/**
 * OpenSea OS - Workflow Detail Page
 * Página de detalhes do workflow com informações, etapas e log de execução
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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWorkflow } from '@/hooks/sales/use-workflows';
import { usePermissions } from '@/hooks/use-permissions';
import { workflowsConfig } from '@/config/entities/workflows.config';
import type { Workflow, WorkflowStep } from '@/types/sales';
import {
  WORKFLOW_TRIGGER_LABELS,
  WORKFLOW_STEP_TYPE_LABELS,
} from '@/types/sales';
import {
  ArrowRight,
  Calendar,
  Edit,
  GitBranch,
  Hash,
  Info,
  Zap,
  ZapOff,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const workflowId = params.id as string;

  const { data: workflowData, isLoading, error } = useWorkflow(workflowId);

  const workflow = workflowData?.workflow as Workflow | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(workflowsConfig.permissions.update &&
    hasPermission(workflowsConfig.permissions.update)
      ? [
          {
            id: 'edit',
            title: 'Editar Workflow',
            icon: Edit,
            onClick: () => router.push(`/sales/workflows/${workflowId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Workflows', href: '/sales/workflows' },
    { label: workflow?.name || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !workflow) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Workflow não encontrado"
            message="O workflow que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Workflows',
              onClick: () => router.push('/sales/workflows'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const triggerLabel =
    WORKFLOW_TRIGGER_LABELS[workflow.trigger] || workflow.trigger;

  const createdDate = new Date(workflow.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const steps = workflow.steps || [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="workflow-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <GitBranch className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Workflow</p>
              <h1 className="text-xl font-bold truncate">{workflow.name}</h1>
              {workflow.description && (
                <p className="text-sm text-muted-foreground">
                  {workflow.description}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  workflow.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {workflow.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="steps">Etapas</TabsTrigger>
            <TabsTrigger value="executions">Execuções</TabsTrigger>
          </TabsList>

          {/* TAB: Informações */}
          <TabsContent value="info" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Dados do Workflow
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações de configuração e gatilho
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={Zap} label="Gatilho" value={triggerLabel} />
                    <InfoRow
                      icon={workflow.isActive ? Zap : ZapOff}
                      label="Status"
                      value={workflow.isActive ? 'Ativo' : 'Inativo'}
                    />
                    <InfoRow
                      icon={Hash}
                      label="Total de Execuções"
                      value={String(workflow.executionCount)}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Última Execução"
                      value={
                        workflow.lastExecutedAt
                          ? new Date(
                              workflow.lastExecutedAt
                            ).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca executado'
                      }
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Criado em"
                      value={createdDate}
                    />
                    <InfoRow
                      icon={Hash}
                      label="Etapas"
                      value={`${steps.length} etapa(s)`}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Etapas (Pipeline Visual) */}
          <TabsContent value="steps" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Pipeline de Etapas
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Sequência ordenada de ações do workflow
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {steps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <GitBranch className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhuma etapa configurada
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Edite o workflow para adicionar etapas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps
                      .sort((a, b) => a.order - b.order)
                      .map((step: WorkflowStep, index: number) => (
                        <div key={step.id} className="flex items-center gap-3">
                          <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-sm font-bold">
                                {step.order}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold">
                                  {WORKFLOW_STEP_TYPE_LABELS[step.type] ||
                                    step.type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Etapa {step.order}
                                </p>
                              </div>
                              <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                                {WORKFLOW_STEP_TYPE_LABELS[step.type] ||
                                  step.type}
                              </div>
                            </div>
                          </div>
                          {index < steps.length - 1 && (
                            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 hidden sm:block" />
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Execuções */}
          <TabsContent value="executions" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-base font-semibold text-muted-foreground">
                    Log de Execuções
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O histórico detalhado de execuções estará disponível em
                    breve.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
