'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { usePipelines } from '@/hooks/sales/use-pipelines';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type { CreateDealRequest } from '@/types/sales';
import { Check, DollarSign, Handshake, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

interface CreateDealWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateDealRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Informações Basicas ──────────────────────────────

function StepBasicInfo({
  title,
  onTitleChange,
  pipelineId,
  onPipelineChange,
  stageId,
  onStageChange,
  pipelines,
  fieldErrors,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  pipelineId: string;
  onPipelineChange: (v: string) => void;
  stageId: string;
  onStageChange: (v: string) => void;
  pipelines: {
    id: string;
    name: string;
    stages: { id: string; name: string }[];
  }[];
  fieldErrors: Record<string, string>;
}) {
  const selectedPipeline = pipelines.find(p => p.id === pipelineId);
  const stages = selectedPipeline?.stages ?? [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Título *</Label>
        <div className="relative">
          <Input
            placeholder="Ex: Proposta comercial - Empresa X"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            aria-invalid={!!fieldErrors.title}
          />
          <FormErrorIcon message={fieldErrors.title} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pipeline *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={pipelineId}
          onChange={e => {
            onPipelineChange(e.target.value);
            onStageChange('');
          }}
        >
          <option value="">Selecione um pipeline</option>
          {pipelines.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Etapa *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={stageId}
          onChange={e => onStageChange(e.target.value)}
          disabled={!pipelineId}
        >
          <option value="">Selecione uma etapa</option>
          {stages.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Step 2: Valor e Detalhes ─────────────────────────────────

function StepValueAndDetails({
  value,
  onValueChange,
  expectedCloseDate,
  onExpectedCloseDateChange,
  probability,
  onProbabilityChange,
}: {
  value: string;
  onValueChange: (v: string) => void;
  expectedCloseDate: string;
  onExpectedCloseDateChange: (v: string) => void;
  probability: string;
  onProbabilityChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Valor (R$)</Label>
        <Input
          type="number"
          placeholder="0,00"
          value={value}
          onChange={e => onValueChange(e.target.value)}
          min="0"
          step="0.01"
        />
      </div>

      <div className="space-y-2">
        <Label>Data prevista de fechamento</Label>
        <Input
          type="date"
          value={expectedCloseDate}
          onChange={e => onExpectedCloseDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Probabilidade (%)</Label>
        <Input
          type="number"
          placeholder="0"
          value={probability}
          onChange={e => onProbabilityChange(e.target.value)}
          min="0"
          max="100"
        />
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateDealWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateDealWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [stageId, setStageId] = useState('');
  const [value, setValue] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [probability, setProbability] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: pipelinesData } = usePipelines({ isActive: true });
  const pipelines = useMemo(
    () => pipelinesData?.pipelines ?? [],
    [pipelinesData]
  );

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setTitle('');
    setPipelineId('');
    setStageId('');
    setValue('');
    setExpectedCloseDate('');
    setProbability('');
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateDealRequest = {
      title: title.trim(),
      pipelineId,
      stageId,
      value: value ? parseFloat(value) : undefined,
      expectedCloseDate: expectedCloseDate || undefined,
      probability: probability ? parseInt(probability, 10) : undefined,
    };

    try {
      await onSubmit(payload);
      handleClose();
    } catch (err) {
      const apiError = ApiError.from(err);
      const fieldMap: Record<string, string> = {
        'title already': 'title',
        'Deal not found': 'title',
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
    }
  }, [
    title,
    pipelineId,
    stageId,
    value,
    expectedCloseDate,
    probability,
    onSubmit,
    handleClose,
  ]);

  const steps: WizardStep[] = [
    {
      title: 'Informações Basicas',
      description: 'Defina o título, pipeline e etapa do negócio.',
      icon: (
        <Handshake className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      content: (
        <StepBasicInfo
          title={title}
          onTitleChange={v => {
            setTitle(v);
            setFieldErrors(prev => {
              const { title: _, ...rest } = prev;
              return rest;
            });
          }}
          pipelineId={pipelineId}
          onPipelineChange={setPipelineId}
          stageId={stageId}
          onStageChange={setStageId}
          pipelines={pipelines}
          fieldErrors={fieldErrors}
        />
      ),
      isValid: title.trim().length > 0 && !!pipelineId && !!stageId,
    },
    {
      title: 'Valor e Detalhes',
      description: 'Informe o valor e detalhes complementares.',
      icon: <DollarSign className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepValueAndDetails
          value={value}
          onValueChange={setValue}
          expectedCloseDate={expectedCloseDate}
          onExpectedCloseDateChange={setExpectedCloseDate}
          probability={probability}
          onProbabilityChange={setProbability}
        />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Negócio
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
