'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { ApiError } from '@/lib/errors/api-error';
import { translateError } from '@/lib/error-messages';
import type {
  CadenceStepType,
  CreateCadenceRequest,
  CreateCadenceStepInput,
} from '@/types/sales';
import { CADENCE_STEP_TYPE_LABELS } from '@/types/sales';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Linkedin,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Route,
  SquareCheck,
  Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────

interface CreateCadenceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCadenceRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step Type Icons ──────────────────────────────────────────

const STEP_TYPE_ICONS: Record<CadenceStepType, React.ElementType> = {
  EMAIL: Mail,
  CALL: Phone,
  TASK: SquareCheck,
  LINKEDIN: Linkedin,
  WHATSAPP: MessageSquare,
  WAIT: Clock,
};

const STEP_TYPE_COLORS: Record<CadenceStepType, string> = {
  EMAIL: 'bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/20',
  CALL: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
  TASK: 'bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20',
  LINKEDIN: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
  WHATSAPP: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/20',
  WAIT: 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500/20',
};

// ─── Step 1: Nome e Descrição ─────────────────────────────────

function StepBasicInfo({
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
        <Label>Nome da Cadência *</Label>
        <div className="relative">
          <Input
            placeholder="Ex: Prospecção Outbound B2B"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            aria-invalid={!!fieldErrors.name}
          />
          <FormErrorIcon message={fieldErrors.name} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descreva o objetivo desta cadência..."
          rows={3}
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 2: Configuração de Etapas ──────────────────────────

function StepConfiguration({
  steps,
  onStepsChange,
}: {
  steps: CreateCadenceStepInput[];
  onStepsChange: (steps: CreateCadenceStepInput[]) => void;
}) {
  const addStep = () => {
    onStepsChange([
      ...steps,
      { type: 'EMAIL' as CadenceStepType, delayDays: 1 },
    ]);
  };

  const removeStep = (index: number) => {
    onStepsChange(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<CreateCadenceStepInput>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onStepsChange(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    onStepsChange(newSteps);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {steps.length} {steps.length === 1 ? 'etapa' : 'etapas'} configurada{steps.length !== 1 ? 's' : ''}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addStep}>
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Etapa
        </Button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma etapa adicionada. Clique em &quot;Adicionar Etapa&quot; para começar.
        </div>
      ) : (
        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
          {steps.map((step, index) => {
            const Icon = STEP_TYPE_ICONS[step.type];
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-white dark:bg-slate-800/60"
              >
                {/* Order + Move */}
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

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={step.type}
                      onChange={e =>
                        updateStep(index, {
                          type: e.target.value as CadenceStepType,
                        })
                      }
                    >
                      {(Object.keys(CADENCE_STEP_TYPE_LABELS) as CadenceStepType[]).map(
                        type => (
                          <option key={type} value={type}>
                            {CADENCE_STEP_TYPE_LABELS[type]}
                          </option>
                        )
                      )}
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
                      <span className="text-xs text-muted-foreground">dias</span>
                    </div>
                  </div>

                  {step.type !== 'WAIT' && (
                    <Input
                      placeholder="Observações da etapa (opcional)"
                      value={step.notes || ''}
                      onChange={e =>
                        updateStep(index, { notes: e.target.value })
                      }
                      className="h-8 text-sm"
                    />
                  )}
                </div>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Revisão ──────────────────────────────────────────

function StepReview({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: CreateCadenceStepInput[];
}) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-muted/50 space-y-2">
        <h4 className="font-medium text-sm">Cadência</h4>
        <p className="text-sm font-semibold">{name}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-sm">
          Etapas ({steps.length})
        </h4>
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma etapa configurada.</p>
        ) : (
          <div className="space-y-2">
            {steps.map((step, index) => {
              const Icon = STEP_TYPE_ICONS[step.type];
              return (
                <div
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-2.5 rounded-lg border',
                    STEP_TYPE_COLORS[step.type]
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold w-5 text-center">
                      {index + 1}
                    </span>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">
                    {CADENCE_STEP_TYPE_LABELS[step.type]}
                  </span>
                  <span className="text-xs ml-auto">
                    {step.delayDays > 0
                      ? `${step.delayDays} dia${step.delayDays !== 1 ? 's' : ''} de espera`
                      : 'Imediato'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateCadenceWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateCadenceWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<CreateCadenceStepInput[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setSteps([]);
    setFieldErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    const payload: CreateCadenceRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      isActive: true,
      steps,
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
  }, [name, description, steps, onSubmit, handleClose]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Defina o nome e descrição da cadência.',
      icon: <Route className="h-16 w-16 text-cyan-400" strokeWidth={1.2} />,
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
          fieldErrors={fieldErrors}
        />
      ),
      isValid: name.trim().length > 0,
    },
    {
      title: 'Etapas da Cadência',
      description: 'Configure as etapas e intervalos.',
      icon: <Clock className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepConfiguration steps={steps} onStepsChange={setSteps} />
      ),
      isValid: true,
    },
    {
      title: 'Revisão',
      description: 'Confirme os dados antes de criar.',
      icon: <Check className="h-16 w-16 text-violet-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(2),
      content: (
        <StepReview name={name} description={description} steps={steps} />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Cadência
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={wizardSteps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
