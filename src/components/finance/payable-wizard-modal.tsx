'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateFinanceEntry } from '@/hooks/finance';
import { financeEntriesService } from '@/services/finance';
import type {
  CostCenterAllocation,
  CreateFinanceEntryData,
  FinanceAttachmentType,
  PayableSubType,
  RecurrenceUnit,
} from '@/types/finance';
import { Check } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { WizardStepAttachment } from './wizard-step-attachment';
import { WizardStepConfirmation } from './wizard-step-confirmation';
import { WizardStepData } from './wizard-step-data';
import { WizardStepInstallments } from './wizard-step-installments';
import { WizardStepType } from './wizard-step-type';

// ============================================================================
// TYPES
// ============================================================================

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardData {
  subType: PayableSubType | null;
  description: string;
  supplierId: string;
  supplierName: string;
  categoryId: string;
  categoryName: string;
  costCenterId: string;
  costCenterName: string;
  costCenterAllocations: CostCenterAllocation[];
  useRateio: boolean;
  bankAccountId: string;
  bankAccountName: string;
  expectedAmount: number;
  issueDate: string;
  dueDate: string;
  competenceDate: string;
  recurrenceType: 'SINGLE' | 'INSTALLMENT';
  totalInstallments: number;
  recurrenceInterval: number;
  recurrenceUnit: RecurrenceUnit;
  attachmentFile: File | null;
  attachmentType: FinanceAttachmentType;
  boletoBarcode: string;
  boletoDigitLine: string;
  notes: string;
  tags: string[];
}

const INITIAL_WIZARD_DATA: WizardData = {
  subType: null,
  description: '',
  supplierId: '',
  supplierName: '',
  categoryId: '',
  categoryName: '',
  costCenterId: '',
  costCenterName: '',
  costCenterAllocations: [],
  useRateio: false,
  bankAccountId: '',
  bankAccountName: '',
  expectedAmount: 0,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  competenceDate: '',
  recurrenceType: 'SINGLE',
  totalInstallments: 2,
  recurrenceInterval: 1,
  recurrenceUnit: 'MONTHLY',
  attachmentFile: null,
  attachmentType: 'OTHER',
  boletoBarcode: '',
  boletoDigitLine: '',
  notes: '',
  tags: [],
};

const STEP_LABELS = ['Tipo', 'Dados', 'Parcelas', 'Anexo', 'Confirmacao'];

// ============================================================================
// PROPS
// ============================================================================

interface PayableWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PayableWizardModal({
  open,
  onOpenChange,
  onCreated,
}: PayableWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    ...INITIAL_WIZARD_DATA,
  });

  const createMutation = useCreateFinanceEntry();

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setWizardData({ ...INITIAL_WIZARD_DATA, issueDate: new Date().toISOString().split('T')[0] });
  }, []);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        handleReset();
      }
      onOpenChange(value);
    },
    [onOpenChange, handleReset]
  );

  const updateWizardData = useCallback((updates: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const handleConfirm = useCallback(async () => {
    const payload: CreateFinanceEntryData = {
      type: 'PAYABLE',
      description: wizardData.description,
      categoryId: wizardData.categoryId,
      expectedAmount: wizardData.expectedAmount,
      issueDate: wizardData.issueDate,
      dueDate: wizardData.dueDate,
      competenceDate: wizardData.competenceDate || undefined,
      supplierName: wizardData.supplierName || undefined,
      supplierId: wizardData.supplierId || undefined,
      bankAccountId: wizardData.bankAccountId || undefined,
      boletoBarcode: wizardData.boletoBarcode || undefined,
      boletoDigitLine: wizardData.boletoDigitLine || undefined,
      notes: wizardData.notes || undefined,
      tags: wizardData.tags.length > 0 ? wizardData.tags : undefined,
      recurrenceType: wizardData.recurrenceType === 'INSTALLMENT' ? 'INSTALLMENT' : 'SINGLE',
      totalInstallments:
        wizardData.recurrenceType === 'INSTALLMENT'
          ? wizardData.totalInstallments
          : undefined,
      recurrenceInterval:
        wizardData.recurrenceType === 'INSTALLMENT'
          ? wizardData.recurrenceInterval
          : undefined,
      recurrenceUnit:
        wizardData.recurrenceType === 'INSTALLMENT'
          ? wizardData.recurrenceUnit
          : undefined,
    };

    // Cost center: single or rateio
    if (wizardData.useRateio && wizardData.costCenterAllocations.length > 0) {
      payload.costCenterAllocations = wizardData.costCenterAllocations.map(
        (a) => ({
          costCenterId: a.costCenterId,
          percentage: a.percentage,
        })
      );
    } else if (wizardData.costCenterId) {
      payload.costCenterId = wizardData.costCenterId;
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      toast.success('Conta a pagar criada com sucesso!');

      // Upload attachment if file was selected
      if (wizardData.attachmentFile && result?.entry?.id) {
        try {
          await financeEntriesService.uploadAttachment(
            result.entry.id,
            wizardData.attachmentFile,
            wizardData.attachmentType
          );
        } catch {
          toast.warning(
            'Conta criada, mas o anexo nao foi enviado. Voce pode envia-lo pela pagina de detalhes.'
          );
        }
      }

      handleOpenChange(false);
      onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar conta a pagar.';
      toast.error(message);
    }
  }, [wizardData, createMutation, handleOpenChange, onCreated]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta a Pagar</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {STEP_LABELS.map((label, index) => {
            const stepNum = (index + 1) as WizardStep;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <div
                key={label}
                className="flex flex-col items-center flex-1"
              >
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        isCompleted || isActive
                          ? 'bg-primary'
                          : 'bg-muted-foreground/20'
                      }`}
                    />
                  )}
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium shrink-0 ${
                      isCompleted
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      stepNum
                    )}
                  </div>
                  {index < STEP_LABELS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 ${
                        isCompleted
                          ? 'bg-primary'
                          : 'bg-muted-foreground/20'
                      }`}
                    />
                  )}
                </div>
                <span
                  className={`text-xs mt-1 ${
                    isActive || isCompleted
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <WizardStepType
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            goToStep={goToStep}
          />
        )}

        {currentStep === 2 && (
          <WizardStepData
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            goToStep={goToStep}
          />
        )}

        {currentStep === 3 && (
          <WizardStepInstallments
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            goToStep={goToStep}
          />
        )}

        {currentStep === 4 && (
          <WizardStepAttachment
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            goToStep={goToStep}
          />
        )}

        {currentStep === 5 && (
          <WizardStepConfirmation
            wizardData={wizardData}
            goToStep={goToStep}
            onConfirm={handleConfirm}
            isPending={createMutation.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
