/**
 * OpenSea OS - Edit Workflow Page
 * Página de edição do workflow com configuração de etapas
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
} from '@/hooks/sales/use-workflows';
import { usePermissions } from '@/hooks/use-permissions';
import { workflowsConfig } from '@/config/entities/workflows.config';
import { logger } from '@/lib/logger';
import type {
  Workflow,
  WorkflowTrigger,
  WorkflowStepType,
} from '@/types/sales';
import {
  WORKFLOW_TRIGGER_LABELS,
  WORKFLOW_STEP_TYPE_LABELS,
} from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import { GitBranch, Info, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// STEP EDITOR ROW
// =============================================================================

interface StepRow {
  order: number;
  type: WorkflowStepType;
  config: Record<string, unknown>;
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const workflowId = params.id as string;

  const {
    data: workflowData,
    isLoading: isLoadingWorkflow,
    error,
  } = useWorkflow(workflowId);

  const workflow = workflowData?.workflow as Workflow | undefined;

  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState<WorkflowTrigger>('ORDER_CREATED');
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<StepRow[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (workflow) {
      setName(workflow.name || '');
      setDescription(workflow.description || '');
      setTrigger(workflow.trigger || 'ORDER_CREATED');
      setIsActive(workflow.isActive ?? true);
      setSteps(
        (workflow.steps ?? []).map(s => ({
          order: s.order,
          type: s.type,
          config: s.config || {},
        }))
      );
    }
  }, [workflow]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAddStep = () => {
    setSteps(prev => [
      ...prev,
      {
        order: prev.length + 1,
        type: 'SEND_EMAIL' as WorkflowStepType,
        config: {},
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(prev =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const handleStepTypeChange = (index: number, type: WorkflowStepType) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, type } : s)));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: workflowId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          trigger,
          isActive,
          steps: steps.map(s => ({
            order: s.order,
            type: s.type,
            config: s.config,
          })),
        } as unknown as Record<string, unknown>,
      });

      toast.success('Workflow atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['workflows', workflowId],
      });
      router.push(`/sales/workflows/${workflowId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar workflow',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar workflow', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(workflowId);
      toast.success('Workflow excluído com sucesso!');
      router.push('/sales/workflows');
    } catch (err) {
      logger.error(
        'Erro ao deletar workflow',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar workflow', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(workflowsConfig.permissions!.delete &&
    hasPermission(workflowsConfig.permissions!.delete)
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Workflows', href: '/sales/workflows' },
    {
      label: workflow?.name || '...',
      href: `/sales/workflows/${workflowId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingWorkflow) {
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
            message="O workflow solicitado não foi encontrado."
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
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="workflow-edit">
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
              <p className="text-sm text-muted-foreground">Editando workflow</p>
              <h1 className="text-xl font-bold truncate">{workflow.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados Básicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Info}
                title="Dados do Workflow"
                subtitle="Informações básicas de identificação"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do workflow"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="trigger">
                      Gatilho <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={trigger}
                      onValueChange={v => setTrigger(v as WorkflowTrigger)}
                    >
                      <SelectTrigger id="trigger">
                        <SelectValue placeholder="Selecione o gatilho..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WORKFLOW_TRIGGER_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição do workflow..."
                    rows={3}
                  />
                </div>

                {/* Mobile toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Etapas */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={GitBranch}
                title="Etapas do Workflow"
                subtitle="Configure a sequência de ações"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white dark:bg-slate-800/40"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-sm font-bold">
                      {step.order}
                    </div>
                    <div className="flex-1">
                      <Select
                        value={step.type}
                        onValueChange={v =>
                          handleStepTypeChange(index, v as WorkflowStepType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(WORKFLOW_STEP_TYPE_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStep(index)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStep}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Workflow"
        description={`Digite seu PIN de ação para excluir o workflow "${workflow.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
