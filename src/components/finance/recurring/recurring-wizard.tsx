'use client';

import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useCreateRecurringConfig } from '@/hooks/finance/use-recurring';
import type {
  CreateRecurringConfigRequest,
  FinanceEntryType,
  RecurrenceUnit,
} from '@/types/finance';
import { CheckCircle, FileText, Repeat } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { RecurringStepConfig } from './recurring-step-config';
import {
  RecurringConfirmationFooter,
  RecurringStepConfirmation,
} from './recurring-step-confirmation';
import { RecurringStepDetails } from './recurring-step-details';

// ============================================================================
// TYPES
// ============================================================================

export interface RecurringWizardData {
  // Step 1 — Configuração
  type: FinanceEntryType | null;
  frequencyUnit: RecurrenceUnit;
  frequencyInterval: number;
  totalOccurrences: number;
  startDate: string;
  endDate: string;
  // Step 2 — Detalhes
  description: string;
  supplierId: string;
  supplierName: string;
  customerId: string;
  customerName: string;
  categoryId: string;
  categoryName: string;
  costCenterId: string;
  costCenterName: string;
  bankAccountId: string;
  bankAccountName: string;
  expectedAmount: number;
  interestRate: number;
  penaltyRate: number;
  tags: string[];
  notes: string;
}

const INITIAL_DATA: RecurringWizardData = {
  type: null,
  frequencyUnit: 'MONTHLY',
  frequencyInterval: 1,
  totalOccurrences: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  description: '',
  supplierId: '',
  supplierName: '',
  customerId: '',
  customerName: '',
  categoryId: '',
  categoryName: '',
  costCenterId: '',
  costCenterName: '',
  bankAccountId: '',
  bankAccountName: '',
  expectedAmount: 0,
  interestRate: 0,
  penaltyRate: 0,
  tags: [],
  notes: '',
};

// ============================================================================
// PROPS
// ============================================================================

interface RecurringWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RecurringWizard({
  open,
  onOpenChange,
  onCreated,
}: RecurringWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<RecurringWizardData>({
    ...INITIAL_DATA,
  });

  const createMutation = useCreateRecurringConfig();

  const updateData = useCallback((partial: Partial<RecurringWizardData>) => {
    setWizardData(prev => ({ ...prev, ...partial }));
  }, []);

  // --------------------------------------------------------------------------
  // Step validation
  // --------------------------------------------------------------------------

  const isStep1Valid =
    wizardData.type !== null &&
    wizardData.frequencyUnit !== null &&
    wizardData.frequencyInterval >= 1 &&
    wizardData.startDate !== '';

  const isStep2Valid =
    wizardData.description !== '' &&
    wizardData.categoryId !== '' &&
    wizardData.expectedAmount > 0;

  // --------------------------------------------------------------------------
  // Reset & close
  // --------------------------------------------------------------------------

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setWizardData({
      ...INITIAL_DATA,
      startDate: new Date().toISOString().split('T')[0],
    });
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onOpenChange(false);
  }, [handleReset, onOpenChange]);

  // --------------------------------------------------------------------------
  // Submit
  // --------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!wizardData.type) return;

    const payload: CreateRecurringConfigRequest = {
      type: wizardData.type,
      description: wizardData.description,
      categoryId: wizardData.categoryId,
      expectedAmount: wizardData.expectedAmount,
      frequencyUnit: wizardData.frequencyUnit,
      frequencyInterval: wizardData.frequencyInterval,
      startDate: wizardData.startDate,
    };

    if (wizardData.bankAccountId)
      payload.bankAccountId = wizardData.bankAccountId;
    if (wizardData.costCenterId)
      payload.costCenterId = wizardData.costCenterId;
    if (wizardData.type === 'PAYABLE' && wizardData.supplierName)
      payload.supplierName = wizardData.supplierName;
    if (wizardData.type === 'PAYABLE' && wizardData.supplierId)
      payload.supplierId = wizardData.supplierId;
    if (wizardData.type === 'RECEIVABLE' && wizardData.customerName)
      payload.customerName = wizardData.customerName;
    if (wizardData.type === 'RECEIVABLE' && wizardData.customerId)
      payload.customerId = wizardData.customerId;
    if (wizardData.totalOccurrences > 0)
      payload.totalOccurrences = wizardData.totalOccurrences;
    if (wizardData.endDate) payload.endDate = wizardData.endDate;
    if (wizardData.interestRate > 0)
      payload.interestRate = wizardData.interestRate;
    if (wizardData.penaltyRate > 0)
      payload.penaltyRate = wizardData.penaltyRate;
    if (wizardData.notes) payload.notes = wizardData.notes;

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Recorrência criada com sucesso!');
      handleClose();
      onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar recorrência.';
      toast.error(message);
    }
  }, [wizardData, createMutation, handleClose, onCreated]);

  // --------------------------------------------------------------------------
  // Steps
  // --------------------------------------------------------------------------

  const steps: WizardStep[] = [
    {
      title: 'Configuração',
      description: 'Tipo e frequência da recorrência',
      icon: <Repeat className="h-16 w-16 text-violet-500" />,
      content: (
        <RecurringStepConfig data={wizardData} onChange={updateData} />
      ),
      isValid: isStep1Valid,
    },
    {
      title: 'Detalhes',
      description: 'Categorização, valores e pagamento',
      icon: <FileText className="h-16 w-16 text-sky-500" />,
      content: (
        <RecurringStepDetails data={wizardData} onChange={updateData} />
      ),
      isValid: isStep2Valid,
    },
    {
      title: 'Confirmação',
      description: 'Revisão e criação',
      icon: <CheckCircle className="h-16 w-16 text-emerald-500" />,
      content: <RecurringStepConfirmation data={wizardData} />,
      footer: (
        <RecurringConfirmationFooter
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
          onBack={() => setCurrentStep(2)}
        />
      ),
      isValid: true,
    },
  ];

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
      nextLabel="Próximo"
      backLabel="Voltar"
      cancelLabel="Cancelar"
      heightClass="h-[540px]"
    />
  );
}
