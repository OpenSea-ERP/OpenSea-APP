'use client';

import { Card } from '@/components/ui/card';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { translateError } from '@/lib/error-messages';
import type { BenefitPlan, BenefitType } from '@/types/hr';
import { Heart, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  BENEFIT_TYPE_OPTIONS,
  BENEFIT_TYPE_COLORS,
  getBenefitRuleDescription,
} from '../utils/benefits.utils';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSubmitting: boolean;
  onSubmit: (data: Partial<BenefitPlan>) => Promise<void>;
}

export function CreateModal({
  isOpen,
  onClose,
  isSubmitting,
  onSubmit,
}: CreateModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState<BenefitType | null>(null);
  const [planName, setPlanName] = useState('');
  const [planProvider, setPlanProvider] = useState('');
  const [planPolicyNumber, setPlanPolicyNumber] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [wasOpen, setWasOpen] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset when modal opens
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setCurrentStep(1);
    setSelectedType(null);
    setPlanName('');
    setPlanProvider('');
    setPlanPolicyNumber('');
    setPlanDescription('');
    setFieldErrors({});
  }
  if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  const handleSelectType = (type: BenefitType) => {
    setSelectedType(type);
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    if (!selectedType || !planName) return;

    try {
      await onSubmit({
        name: planName,
        type: selectedType,
        provider: planProvider || undefined,
        policyNumber: planPolicyNumber || undefined,
        description: planDescription || undefined,
        isActive: true,
        rules: {},
      });

      handleClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes('name already') ||
        msg.includes('already exists') ||
        msg.includes('nome')
      ) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  // Focus name input when entering step 2
  useEffect(() => {
    if (currentStep === 2 && isOpen) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep, isOpen]);

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Tipo de Benefício',
        description: 'Selecione o tipo de benefício para o novo plano',
        icon: <Heart className="h-16 w-16 text-pink-500/60" />,
        isValid: false,
        footer: (
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
        ),
        content: (
          <ScrollArea className="max-h-[400px]">
            <div className="grid grid-cols-2 gap-2">
              {BENEFIT_TYPE_OPTIONS.map(option => {
                const colors = BENEFIT_TYPE_COLORS[option.value];
                return (
                  <div
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent transition-colors border ${
                      selectedType === option.value
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10'
                        : 'border-transparent'
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectType(option.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectType(option.value);
                      }
                    }}
                  >
                    <div
                      className={`flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br ${colors.gradient} shrink-0`}
                    >
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getBenefitRuleDescription(option.value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ),
      },
      {
        title: 'Dados do Plano',
        description: 'Preencha as informações do novo plano de benefício',
        icon: <Heart className="h-16 w-16 text-pink-500/60" />,
        isValid: !!planName && !isSubmitting,
        onBack: () => setCurrentStep(1),
        content: (
          <div className="flex flex-col h-full space-y-4">
            {/* Selected type */}
            {selectedType && (
              <Card className="p-3 bg-muted/50">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center h-9 w-9 rounded-lg bg-linear-to-br ${BENEFIT_TYPE_COLORS[selectedType].gradient} shrink-0`}
                  >
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium text-sm truncate">
                      {
                        BENEFIT_TYPE_OPTIONS.find(
                          o => o.value === selectedType
                        )?.label
                      }
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome do Plano <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    ref={nameInputRef}
                    id="name"
                    placeholder="Ex: Plano Saúde Básico"
                    value={planName}
                    onChange={e => {
                      setPlanName(e.target.value);
                      if (fieldErrors.name)
                        setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    aria-invalid={!!fieldErrors.name}
                  />
                  <FormErrorIcon message={fieldErrors.name || ''} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Operadora/Fornecedor</Label>
                <Input
                  id="provider"
                  placeholder="Ex: Unimed, Alelo"
                  value={planProvider}
                  onChange={e => setPlanProvider(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="policyNumber">Número da Apólice</Label>
              <Input
                id="policyNumber"
                placeholder="Número do contrato (opcional)"
                value={planPolicyNumber}
                onChange={e => setPlanPolicyNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                placeholder="Descrição do plano (opcional)"
                value={planDescription}
                onChange={e => setPlanDescription(e.target.value)}
                className="flex-1 min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        ),
        footer: (
          <Button
            type="button"
            disabled={isSubmitting || !planName}
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Plano'
            )}
          </Button>
        ),
      },
    ],
    [
      selectedType,
      planName,
      planProvider,
      planPolicyNumber,
      planDescription,
      isSubmitting,
      fieldErrors,
    ]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && handleClose()}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
