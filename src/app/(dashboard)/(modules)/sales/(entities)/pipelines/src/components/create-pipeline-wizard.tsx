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
  useCreatePipeline,
  useCreatePipelineStage,
} from '@/hooks/sales/use-pipelines';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import {
  Check,
  GitBranch,
  Layers,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

interface CreatePipelineWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StageEntry {
  id: string;
  name: string;
}

let stageCounter = 0;
function nextStageId(): string {
  stageCounter += 1;
  return `temp-stage-${stageCounter}`;
}

// ─── Step 1: Informações do Pipeline ──────────────────────────

function StepPipelineInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  fieldErrors,
}: {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Pipeline *</Label>
        <div className="relative">
          <Input
            placeholder="Ex: Pipeline de Vendas"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            autoFocus
            aria-invalid={!!fieldErrors.name}
          />
          <FormErrorIcon message={fieldErrors.name} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descreva o proposito deste pipeline..."
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Etapas Iniciais ──────────────────────────────────

function StepInitialStages({
  stages,
  onAdd,
  onRemove,
  onChangeName,
}: {
  stages: StageEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChangeName: (id: string, name: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Defina as etapas iniciais do seu pipeline. Voce podera edita-las depois.
      </p>

      <div className="space-y-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
              <GripVertical className="h-4 w-4" />
              <span className="text-xs font-medium w-5 text-center tabular-nums">
                {index + 1}
              </span>
            </div>
            <Input
              placeholder={`Nome da etapa ${index + 1}`}
              value={stage.name}
              onChange={e => onChangeName(stage.id, e.target.value)}
              className="flex-1"
              autoFocus={index === stages.length - 1}
            />
            {stages.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 shrink-0"
                onClick={() => onRemove(stage.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={onAdd}
      >
        <Plus className="h-4 w-4" />
        Adicionar Etapa
      </Button>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreatePipelineWizard({
  open,
  onOpenChange,
}: CreatePipelineWizardProps) {
  const router = useRouter();
  const createPipeline = useCreatePipeline();
  const createStage = useCreatePipelineStage();

  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<StageEntry[]>([
    { id: nextStageId(), name: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setStages([{ id: nextStageId(), name: '' }]);
    setIsSubmitting(false);
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAddStage = useCallback(() => {
    setStages(prev => [...prev, { id: nextStageId(), name: '' }]);
  }, []);

  const handleRemoveStage = useCallback((id: string) => {
    setStages(prev => prev.filter(s => s.id !== id));
  }, []);

  const handleChangeStageName = useCallback((id: string, newName: string) => {
    setStages(prev =>
      prev.map(s => (s.id === id ? { ...s, name: newName } : s))
    );
  }, []);

  const validStages = stages.filter(s => s.name.trim().length > 0);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // 1. Create the pipeline
      const response = await createPipeline.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      const pipelineId = response.pipeline.id;

      // 2. Create stages in order
      for (let i = 0; i < validStages.length; i++) {
        await createStage.mutateAsync({
          pipelineId,
          data: {
            name: validStages[i].name.trim(),
          },
        });
      }

      toast.success('Pipeline criado com sucesso!');
      handleClose();
      router.push(`/sales/pipelines/${pipelineId}`);
    } catch (err) {
      const apiError = ApiError.from(err);
      const fieldMap: Record<string, string> = {
        'name already': 'name',
        'Pipeline name already': 'name',
      };
      let mapped = false;
      if (apiError.fieldErrors?.length) {
        const errors: Record<string, string> = {};
        for (const fe of apiError.fieldErrors) {
          errors[fe.field] = translateError(fe.message);
          mapped = true;
        }
        if (mapped) {
          setFieldErrors(errors);
          setCurrentStep(1);
        }
      }
      if (!mapped) {
        for (const [pattern, field] of Object.entries(fieldMap)) {
          if (apiError.message.includes(pattern)) {
            setFieldErrors({ [field]: translateError(apiError.message) });
            setCurrentStep(1);
            mapped = true;
            break;
          }
        }
      }
      if (!mapped) {
        toast.error(translateError(apiError.message));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    name,
    description,
    validStages,
    createPipeline,
    createStage,
    handleClose,
    router,
  ]);

  const steps: WizardStep[] = [
    {
      title: 'Novo Pipeline',
      description: 'Defina o nome e a descrição do pipeline.',
      icon: (
        <GitBranch className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
      ),
      content: (
        <StepPipelineInfo
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
          fieldErrors={fieldErrors}
        />
      ),
      isValid: name.trim().length > 0,
    },
    {
      title: 'Etapas Iniciais',
      description: 'Configure as etapas do funil.',
      icon: <Layers className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepInitialStages
          stages={stages}
          onAdd={handleAddStage}
          onRemove={handleRemoveStage}
          onChangeName={handleChangeStageName}
        />
      ),
      isValid: validStages.length > 0,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || validStages.length === 0}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Pipeline
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
