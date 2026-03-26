'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateBlueprint } from '@/hooks/sales/use-blueprints';
import { usePipelines } from '@/hooks/sales/use-pipelines';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import { Check, FileCode2, GitBranch, Layers, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { BlueprintStageFieldRule } from '@/types/sales';

interface CreateBlueprintWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StageRuleEntry {
  stageId: string;
  stageName: string;
  requiredFields: BlueprintStageFieldRule[];
}

function StepBasicInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  pipelineId,
  onPipelineIdChange,
  pipelines,
  fieldErrors,
}: {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  pipelineId: string;
  onPipelineIdChange: (v: string) => void;
  pipelines: Array<{ id: string; name: string }>;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Modelo *</Label>
        <div className="relative">
          <Input
            placeholder="Ex: Processo de Qualificação"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            autoFocus
            aria-invalid={!!fieldErrors.name}
          />
          <FormErrorIcon message={fieldErrors.name} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pipeline *</Label>
        <Select value={pipelineId} onValueChange={onPipelineIdChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um pipeline" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descreva o propósito deste modelo..."
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

function StepStageRules({
  stageRules,
  onAddField,
  onRemoveField,
  onChangeFieldName,
  onToggleRequired,
}: {
  stageRules: StageRuleEntry[];
  onAddField: (stageId: string) => void;
  onRemoveField: (stageId: string, index: number) => void;
  onChangeFieldName: (stageId: string, index: number, name: string) => void;
  onToggleRequired: (stageId: string, index: number) => void;
}) {
  if (stageRules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Layers className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Selecione um pipeline na etapa anterior para configurar as regras
          por etapa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Configure os campos obrigatórios para cada etapa do pipeline.
      </p>

      {stageRules.map(rule => (
        <div
          key={rule.stageId}
          className="border border-border rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-violet-500" />
            <h4 className="text-sm font-semibold">{rule.stageName}</h4>
          </div>

          {rule.requiredFields.map((field, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                placeholder="Nome do campo"
                value={field.fieldName}
                onChange={e =>
                  onChangeFieldName(rule.stageId, idx, e.target.value)
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant={field.isRequired ? 'default' : 'outline'}
                size="sm"
                className="text-xs shrink-0"
                onClick={() => onToggleRequired(rule.stageId, idx)}
              >
                {field.isRequired ? 'Obrigatório' : 'Opcional'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                onClick={() => onRemoveField(rule.stageId, idx)}
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
            onClick={() => onAddField(rule.stageId)}
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Campo
          </Button>
        </div>
      ))}
    </div>
  );
}

export function CreateBlueprintWizard({
  open,
  onOpenChange,
}: CreateBlueprintWizardProps) {
  const router = useRouter();
  const createBlueprint = useCreateBlueprint();
  const { data: pipelinesData } = usePipelines();

  const pipelines = pipelinesData?.pipelines ?? [];

  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageRules, setStageRules] = useState<StageRuleEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handlePipelineChange = useCallback(
    (newPipelineId: string) => {
      setPipelineId(newPipelineId);
      const pipeline = pipelines.find(p => p.id === newPipelineId);
      if (pipeline?.stages) {
        const sorted = [...pipeline.stages].sort(
          (a, b) => a.position - b.position
        );
        setStageRules(
          sorted.map(stage => ({
            stageId: stage.id,
            stageName: stage.name,
            requiredFields: [],
          }))
        );
      }
    },
    [pipelines]
  );

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setPipelineId('');
    setStageRules([]);
    setIsSubmitting(false);
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAddField = useCallback((stageId: string) => {
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
  }, []);

  const handleRemoveField = useCallback(
    (stageId: string, index: number) => {
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
    },
    []
  );

  const handleChangeFieldName = useCallback(
    (stageId: string, index: number, newName: string) => {
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
    },
    []
  );

  const handleToggleRequired = useCallback(
    (stageId: string, index: number) => {
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
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await createBlueprint.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        pipelineId,
        stageRules: stageRules
          .filter(rule => rule.requiredFields.length > 0)
          .map(rule => ({
            stageId: rule.stageId,
            requiredFields: rule.requiredFields.filter(
              f => f.fieldName.trim().length > 0
            ),
          })),
      });

      toast.success('Modelo de processo criado com sucesso!');
      handleClose();
      router.push(`/sales/blueprints/${response.blueprint.id}`);
    } catch (err) {
      const apiError = ApiError.from(err);
      if (apiError.fieldErrors?.length) {
        const errors: Record<string, string> = {};
        for (const fe of apiError.fieldErrors) {
          errors[fe.field] = translateError(fe.message);
        }
        setFieldErrors(errors);
        setCurrentStep(1);
      } else {
        toast.error(translateError(apiError.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    name,
    description,
    pipelineId,
    stageRules,
    createBlueprint,
    handleClose,
    router,
  ]);

  const steps: WizardStep[] = [
    {
      title: 'Novo Modelo de Processo',
      description: 'Defina o nome e selecione o pipeline.',
      icon: (
        <FileCode2 className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
      ),
      content: (
        <StepBasicInfo
          name={name}
          onNameChange={v => {
            setName(v);
            setFieldErrors(prev => {
              const { name: _, ...rest } = prev;
              return rest;
            });
          }}
          description={description}
          onDescriptionChange={setDescription}
          pipelineId={pipelineId}
          onPipelineIdChange={handlePipelineChange}
          pipelines={pipelines}
          fieldErrors={fieldErrors}
        />
      ),
      isValid: name.trim().length > 0 && pipelineId.length > 0,
    },
    {
      title: 'Regras por Etapa',
      description: 'Configure campos obrigatórios e validações.',
      icon: (
        <Layers className="h-16 w-16 text-sky-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepStageRules
          stageRules={stageRules}
          onAddField={handleAddField}
          onRemoveField={handleRemoveField}
          onChangeFieldName={handleChangeFieldName}
          onToggleRequired={handleToggleRequired}
        />
      ),
      isValid: true,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Modelo
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
