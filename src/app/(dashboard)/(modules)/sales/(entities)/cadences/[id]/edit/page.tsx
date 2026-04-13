/**
 * OpenSea OS - Cadence Edit Page
 * Edição de cadência com editor de etapas
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { cadencesConfig } from '@/config/entities/cadences.config';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCadence,
  useUpdateCadence,
  useDeleteCadence,
} from '@/hooks/sales/use-cadences';
import type { CadenceStepType, CreateCadenceStepInput } from '@/types/sales';
import { CADENCE_STEP_TYPE_LABELS } from '@/types/sales';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Plus,
  Route,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function CadenceEditPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const cadenceId = params.id as string;

  const { data, isLoading, error, refetch } = useCadence(cadenceId);
  const updateMutation = useUpdateCadence();
  const deleteMutation = useDeleteCadence();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [steps, setSteps] = useState<CreateCadenceStepInput[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load data into form
  useEffect(() => {
    if (data?.cadence && !initialized) {
      setName(data.cadence.name);
      setDescription(data.cadence.description || '');
      setIsActive(data.cadence.isActive);
      setSteps(
        (data.cadence.steps || [])
          .sort((a, b) => a.order - b.order)
          .map(s => ({
            type: s.type,
            delayDays: s.delayDays,
            subject: s.subject,
            content: s.content,
            notes: s.notes,
          }))
      );
      setInitialized(true);
    }
  }, [data, initialized]);

  const handleSave = useCallback(async () => {
    try {
      await updateMutation.mutateAsync({
        cadenceId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          isActive,
          steps,
        },
      });
      toast.success('Cadência atualizada com sucesso!');
      router.push(`/sales/cadences/${cadenceId}`);
    } catch {
      toast.error('Erro ao atualizar cadência.');
    }
  }, [cadenceId, name, description, isActive, steps, updateMutation, router]);

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(cadenceId);
    setDeleteModalOpen(false);
    toast.success('Cadência excluída com sucesso!');
    router.push('/sales/cadences');
  }, [cadenceId, deleteMutation, router]);

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      { type: 'EMAIL' as CadenceStepType, delayDays: 1 },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateStep = (
    index: number,
    updates: Partial<CreateCadenceStepInput>
  ) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], ...updates };
      return newSteps;
    });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const newSteps = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newSteps.length) return prev;
      [newSteps[index], newSteps[targetIndex]] = [
        newSteps[targetIndex],
        newSteps[index],
      ];
      return newSteps;
    });
  };

  // ─── Loading / Error ──────────────────────────────────────

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Cadências', href: '/sales/cadences' },
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

  if (error || !data?.cadence) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Cadências', href: '/sales/cadences' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar cadência"
            message="Não foi possível carregar os dados da cadência."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="cadence-edit">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Cadências', href: '/sales/cadences' },
            { label: data.cadence.name, href: `/sales/cadences/${cadenceId}` },
            { label: 'Editar' },
          ]}
          buttons={[
            ...(hasPermission(cadencesConfig.permissions.delete)
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
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default' as const,
              disabled: updateMutation.isPending || !name.trim(),
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0">
              <Route className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Editar Cadência
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Criada em{' '}
                {new Date(data.cadence.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                placeholder="Nome da cadência"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Descrição da cadência"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>Cadência ativa</Label>
            </div>
          </div>
        </Card>

        {/* Steps Editor */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Etapas ({steps.length})</h3>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>

          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma etapa. Clique em &quot;Adicionar&quot; para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border"
                >
                  <div className="flex flex-col items-center gap-0.5 pt-1">
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-medium text-muted-foreground w-5 text-center">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm"
                        value={step.type}
                        onChange={e =>
                          updateStep(index, {
                            type: e.target.value as CadenceStepType,
                          })
                        }
                      >
                        {(
                          Object.keys(
                            CADENCE_STEP_TYPE_LABELS
                          ) as CadenceStepType[]
                        ).map(type => (
                          <option key={type} value={type}>
                            {CADENCE_STEP_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="number"
                          min={0}
                          className="w-16 h-9"
                          value={step.delayDays}
                          onChange={e =>
                            updateStep(index, {
                              delayDays: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          dias
                        </span>
                      </div>
                    </div>
                    {step.type !== 'WAIT' && (
                      <Input
                        placeholder="Observações (opcional)"
                        value={step.notes || ''}
                        onChange={e =>
                          updateStep(index, { notes: e.target.value })
                        }
                        className="h-8 text-sm"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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
          description="Digite seu PIN de ação para excluir esta cadência. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
