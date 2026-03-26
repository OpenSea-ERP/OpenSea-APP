'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useBlueprint,
  useUpdateBlueprint,
  useDeleteBlueprint,
} from '@/hooks/sales/use-blueprints';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowLeft,
  FileCode2,
  Trash2,
  Save,
  Loader2,
  Plus,
  GitBranch,
} from 'lucide-react';
import type {
  BlueprintStatus,
  BlueprintStageFieldRule,
} from '@/types/sales';
import { BLUEPRINT_STATUS_LABELS } from '@/types/sales';

function BlueprintEditContent() {
  const params = useParams();
  const router = useRouter();
  const blueprintId = params.id as string;

  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(SALES_PERMISSIONS.BLUEPRINTS.ADMIN);

  const { data, isLoading, isError } = useBlueprint(blueprintId);
  const updateBlueprint = useUpdateBlueprint();
  const deleteBlueprint = useDeleteBlueprint();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<BlueprintStatus>('DRAFT');
  const [stageRules, setStageRules] = useState<
    Array<{
      stageId: string;
      stageName: string;
      requiredFields: BlueprintStageFieldRule[];
    }>
  >([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.blueprint) {
      const bp = data.blueprint;
      setName(bp.name);
      setDescription(bp.description || '');
      setStatus(bp.status);
      const sorted = [...(bp.stageRules ?? [])].sort(
        (a, b) => a.position - b.position
      );
      setStageRules(
        sorted.map(rule => ({
          stageId: rule.stageId,
          stageName: rule.stageName,
          requiredFields: [...rule.requiredFields],
        }))
      );
    }
  }, [data?.blueprint]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      await updateBlueprint.mutateAsync({
        id: blueprintId,
        data: {
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          stageRules: stageRules.map(rule => ({
            stageId: rule.stageId,
            requiredFields: rule.requiredFields.filter(
              f => f.fieldName.trim().length > 0
            ),
          })),
        },
      });

      toast.success('Modelo de processo atualizado com sucesso!');
      router.push(`/sales/blueprints/${blueprintId}`);
    } catch (err) {
      const apiError = ApiError.from(err);
      toast.error(translateError(apiError.message));
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    blueprintId,
    name,
    description,
    status,
    stageRules,
    updateBlueprint,
    router,
  ]);

  function handleDelete() {
    deleteBlueprint.mutate(blueprintId, {
      onSuccess: () => {
        toast.success('Modelo de processo excluído com sucesso.');
        router.push('/sales/blueprints');
      },
      onError: () => {
        toast.error('Erro ao excluir modelo de processo.');
      },
    });
  }

  function addField(stageId: string) {
    setStageRules(prev =>
      prev.map(rule =>
        rule.stageId === stageId
          ? {
              ...rule,
              requiredFields: [
                ...rule.requiredFields,
                { fieldName: '', isRequired: true },
              ],
            }
          : rule
      )
    );
  }

  function removeField(stageId: string, index: number) {
    setStageRules(prev =>
      prev.map(rule =>
        rule.stageId === stageId
          ? {
              ...rule,
              requiredFields: rule.requiredFields.filter(
                (_, i) => i !== index
              ),
            }
          : rule
      )
    );
  }

  function changeFieldName(stageId: string, index: number, newName: string) {
    setStageRules(prev =>
      prev.map(rule =>
        rule.stageId === stageId
          ? {
              ...rule,
              requiredFields: rule.requiredFields.map((f, i) =>
                i === index ? { ...f, fieldName: newName } : f
              ),
            }
          : rule
      )
    );
  }

  function toggleRequired(stageId: string, index: number) {
    setStageRules(prev =>
      prev.map(rule =>
        rule.stageId === stageId
          ? {
              ...rule,
              requiredFields: rule.requiredFields.map((f, i) =>
                i === index ? { ...f, isRequired: !f.isRequired } : f
              ),
            }
          : rule
      )
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data?.blueprint) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">
          Modelo de processo não encontrado
        </h2>
        <Link href="/sales/blueprints">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Modelos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Modelos de Processo', href: '/sales/blueprints' },
          {
            label: data.blueprint.name,
            href: `/sales/blueprints/${blueprintId}`,
          },
          { label: 'Editar' },
        ]}
        buttons={[
          ...(canAdmin
            ? [
                {
                  id: 'delete',
                  title: 'Excluir',
                  icon: Trash2,
                  variant: 'destructive' as const,
                  onClick: () => setShowDeleteModal(true),
                },
              ]
            : []),
          {
            id: 'save',
            title: 'Salvar',
            icon: isSaving ? Loader2 : Save,
            variant: 'default' as const,
            onClick: handleSave,
            disabled: isSaving || !name.trim(),
          },
        ]}
      />

      {/* Identity Card */}
      <Card className="bg-white/5 p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-500/10">
            <FileCode2 className="h-6 w-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Editar Modelo de Processo</h1>
            <p className="text-sm text-muted-foreground">
              Criado em{' '}
              {new Date(data.blueprint.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </Card>

      {/* Form Card */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Nome do modelo"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={v => setStatus(v as BlueprintStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLUEPRINT_STATUS_LABELS).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição do modelo"
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Stage Rules Editor */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="h-5 w-5 text-violet-500" />
          <h2 className="text-base font-semibold">
            Regras por Etapa do Pipeline
          </h2>
        </div>

        <div className="space-y-4">
          {stageRules.map(rule => (
            <div
              key={rule.stageId}
              className="border border-border rounded-lg p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-violet-500" />
                {rule.stageName}
              </h3>

              {rule.requiredFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome do campo"
                    value={field.fieldName}
                    onChange={e =>
                      changeFieldName(rule.stageId, idx, e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={field.isRequired ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs shrink-0"
                    onClick={() => toggleRequired(rule.stageId, idx)}
                  >
                    {field.isRequired ? 'Obrigatório' : 'Opcional'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                    onClick={() => removeField(rule.stageId, idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => addField(rule.stageId)}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Campo
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Delete Modal */}
      <VerifyActionPinModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDelete}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir o modelo "${data.blueprint.name}".`}
      />
    </div>
  );
}

export default function BlueprintEditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <BlueprintEditContent />
    </Suspense>
  );
}
