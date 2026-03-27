'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type {
  CreateLeadScoringRuleRequest,
  LeadScoreCondition,
  LeadScoreField,
} from '@/types/sales';
import {
  LEAD_SCORE_FIELD_LABELS,
  LEAD_SCORE_CONDITION_LABELS,
} from '@/types/sales';
import {
  Check,
  Loader2,
  Star,
  Target,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────

interface CreateScoringRuleWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateLeadScoringRuleRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Regra ────────────────────────────────────────────

function StepRuleConfig({
  name,
  onNameChange,
  field,
  onFieldChange,
  condition,
  onConditionChange,
  value,
  onValueChange,
  fieldErrors,
}: {
  name: string;
  onNameChange: (v: string) => void;
  field: LeadScoreField;
  onFieldChange: (v: LeadScoreField) => void;
  condition: LeadScoreCondition;
  onConditionChange: (v: LeadScoreCondition) => void;
  value: string;
  onValueChange: (v: string) => void;
  fieldErrors: Record<string, string>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Regra *</Label>
        <div className="relative">
          <Input
            placeholder="Ex: Lead com e-mail corporativo"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            aria-invalid={!!fieldErrors.name}
          />
          <FormErrorIcon message={fieldErrors.name} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Campo *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={field}
          onChange={e => onFieldChange(e.target.value as LeadScoreField)}
        >
          {(Object.keys(LEAD_SCORE_FIELD_LABELS) as LeadScoreField[]).map(f => (
            <option key={f} value={f}>
              {LEAD_SCORE_FIELD_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Condição *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={condition}
          onChange={e =>
            onConditionChange(e.target.value as LeadScoreCondition)
          }
        >
          {(
            Object.keys(LEAD_SCORE_CONDITION_LABELS) as LeadScoreCondition[]
          ).map(c => (
            <option key={c} value={c}>
              {LEAD_SCORE_CONDITION_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      {condition !== 'is_true' && condition !== 'is_false' && (
        <div className="space-y-2">
          <Label>Valor *</Label>
          <div className="relative">
            <Input
              placeholder="Valor da condição"
              value={value}
              onChange={e => onValueChange(e.target.value)}
              aria-invalid={!!fieldErrors.value}
            />
            <FormErrorIcon message={fieldErrors.value} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Pontuação e Revisão ──────────────────────────────

function StepPointsReview({
  name,
  field,
  condition,
  value,
  points,
  onPointsChange,
}: {
  name: string;
  field: LeadScoreField;
  condition: LeadScoreCondition;
  value: string;
  points: number;
  onPointsChange: (v: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pontuação *</Label>
        <Input
          type="number"
          min={-100}
          max={100}
          value={points}
          onChange={e => onPointsChange(parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          Valores positivos somam pontos, negativos penalizam.
        </p>
      </div>

      <div className="p-4 rounded-lg bg-muted/50 space-y-2 mt-4">
        <h4 className="font-medium text-sm">Resumo da Regra</h4>
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-sm text-muted-foreground">
          Quando <strong>{LEAD_SCORE_FIELD_LABELS[field]}</strong>{' '}
          <strong>{LEAD_SCORE_CONDITION_LABELS[condition]}</strong>
          {condition !== 'is_true' && condition !== 'is_false' && (
            <>
              {' '}
              <strong>&quot;{value}&quot;</strong>
            </>
          )}
          , atribuir{' '}
          <strong
            className={
              points >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }
          >
            {points > 0 ? '+' : ''}
            {points} ponto{Math.abs(points) !== 1 ? 's' : ''}
          </strong>
          .
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateScoringRuleWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateScoringRuleWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [field, setField] = useState<LeadScoreField>('source');
  const [condition, setCondition] = useState<LeadScoreCondition>('equals');
  const [value, setValue] = useState('');
  const [points, setPoints] = useState(10);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setField('source');
    setCondition('equals');
    setValue('');
    setPoints(10);
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateLeadScoringRuleRequest = {
      name: name.trim(),
      field,
      condition,
      value: (condition === 'is_true' || condition === 'is_false') ? 'true' : value.trim(),
      points,
      isActive: true,
    };

    try {
      await onSubmit(payload);
      handleClose();
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
    }
  }, [name, field, condition, value, points, onSubmit, handleClose]);

  const needsValue = condition !== 'is_true' && condition !== 'is_false';

  const steps: WizardStep[] = [
    {
      title: 'Configurar Regra',
      description: 'Defina o campo, condição e valor.',
      icon: <Target className="h-16 w-16 text-amber-400" strokeWidth={1.2} />,
      content: (
        <StepRuleConfig
          name={name}
          onNameChange={v => {
            setName(v);
            setFieldErrors(prev => {
              const { name: _, ...rest } = prev;
              return rest;
            });
          }}
          field={field}
          onFieldChange={setField}
          condition={condition}
          onConditionChange={setCondition}
          value={value}
          onValueChange={v => {
            setValue(v);
            setFieldErrors(prev => {
              const { value: _, ...rest } = prev;
              return rest;
            });
          }}
          fieldErrors={fieldErrors}
        />
      ),
      isValid:
        name.trim().length > 0 && (!needsValue || value.trim().length > 0),
    },
    {
      title: 'Pontuação',
      description: 'Defina os pontos e revise.',
      icon: <Star className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepPointsReview
          name={name}
          field={field}
          condition={condition}
          value={value}
          points={points}
          onPointsChange={setPoints}
        />
      ),
      isValid: points !== 0,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Regra
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
