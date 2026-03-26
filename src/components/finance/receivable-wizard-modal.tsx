'use client';

import { translateError } from '@/lib/error-messages';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useCreateFinanceEntry } from '@/hooks/finance';
import type { CreateFinanceEntryData } from '@/types/finance';
import { CheckCircle, FileText, PenLine } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  ReceivableConfirmationFooter,
  ReceivableStepConfirmation,
} from './receivable-step-confirmation';
import { ReceivableStepDetails } from './receivable-step-details';
import { ReceivableStepEntry } from './receivable-step-entry';

// ============================================================================
// TYPES
// ============================================================================

export interface ReceivableWizardData {
  // Step 1 — entry mode + type
  entryMode: 'NF' | 'MANUAL' | null;
  subType: string | null;
  ocrApplied: boolean;
  // Step 2 — details
  description: string;
  customerId: string;
  customerName: string;
  categoryId: string;
  categoryName: string;
  costCenterId: string;
  costCenterName: string;
  bankAccountId: string;
  bankAccountName: string;
  expectedAmount: number;
  interest: number;
  penalty: number;
  discount: number;
  issueDate: string;
  dueDate: string;
  competenceDate: string;
  tags: string[];
  notes: string;
  currency: string;
  // Installment
  installmentEnabled: boolean;
  totalInstallments: number;
  recurrenceUnit: 'MONTHLY' | 'BIWEEKLY' | 'WEEKLY';
}

const INITIAL_DATA: ReceivableWizardData = {
  entryMode: null,
  subType: null,
  ocrApplied: false,
  description: '',
  customerId: '',
  customerName: '',
  categoryId: '',
  categoryName: '',
  costCenterId: '',
  costCenterName: '',
  bankAccountId: '',
  bankAccountName: '',
  expectedAmount: 0,
  interest: 0,
  penalty: 0,
  discount: 0,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  competenceDate: '',
  tags: [],
  notes: '',
  currency: 'BRL',
  installmentEnabled: false,
  totalInstallments: 2,
  recurrenceUnit: 'MONTHLY',
};

// ============================================================================
// PROPS
// ============================================================================

interface ReceivableWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReceivableWizardModal({
  open,
  onOpenChange,
  onCreated,
}: ReceivableWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<ReceivableWizardData>({
    ...INITIAL_DATA,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateFinanceEntry();

  const updateData = useCallback((partial: Partial<ReceivableWizardData>) => {
    setWizardData(prev => ({ ...prev, ...partial }));
  }, []);

  // --------------------------------------------------------------------------
  // Step validation
  // --------------------------------------------------------------------------

  const isStep1Valid =
    wizardData.entryMode !== null &&
    (wizardData.entryMode === 'NF' || wizardData.subType !== null);

  const isStep2Valid =
    wizardData.description !== '' &&
    wizardData.categoryId !== '' &&
    wizardData.expectedAmount > 0 &&
    wizardData.dueDate !== '';

  // --------------------------------------------------------------------------
  // Reset & close
  // --------------------------------------------------------------------------

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setWizardData({
      ...INITIAL_DATA,
      issueDate: new Date().toISOString().split('T')[0],
    });
    setFieldErrors({});
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onOpenChange(false);
  }, [handleReset, onOpenChange]);

  // --------------------------------------------------------------------------
  // Submit
  // --------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    try {
      const payload: CreateFinanceEntryData = {
        type: 'RECEIVABLE',
        description: wizardData.description,
        categoryId: wizardData.categoryId,
        expectedAmount: wizardData.expectedAmount,
        issueDate: wizardData.issueDate,
        dueDate: wizardData.dueDate,
        competenceDate: wizardData.competenceDate || undefined,
        customerId: wizardData.customerId || undefined,
        customerName: wizardData.customerName || undefined,
        costCenterId: wizardData.costCenterId || undefined,
        bankAccountId: wizardData.bankAccountId || undefined,
        interest: wizardData.interest || undefined,
        penalty: wizardData.penalty || undefined,
        discount: wizardData.discount || undefined,
        notes: wizardData.notes || undefined,
        tags: wizardData.tags.length > 0 ? wizardData.tags : undefined,
        currency:
          wizardData.currency !== 'BRL' ? wizardData.currency : undefined,
        // Installment fields
        ...(wizardData.installmentEnabled
          ? {
              recurrenceType: 'INSTALLMENT' as const,
              totalInstallments: wizardData.totalInstallments,
              recurrenceUnit: wizardData.recurrenceUnit,
              recurrenceInterval: 1,
            }
          : {}),
      };

      await createMutation.mutateAsync(payload);
      toast.success('Conta a receber criada com sucesso!');

      handleClose();
      onCreated?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('description') || msg.includes('Description')) {
        setFieldErrors({ description: translateError(msg) });
        setCurrentStep(2);
      } else if (msg.includes('category') || msg.includes('Category')) {
        setFieldErrors({ categoryId: translateError(msg) });
        setCurrentStep(2);
      } else if (msg.includes('amount') || msg.includes('Amount')) {
        setFieldErrors({ expectedAmount: translateError(msg) });
        setCurrentStep(2);
      } else if (msg.includes('due date') || msg.includes('Due date')) {
        setFieldErrors({ dueDate: translateError(msg) });
        setCurrentStep(2);
      } else {
        toast.error(translateError(msg));
      }
    }
  }, [wizardData, createMutation, handleClose, onCreated]);

  // --------------------------------------------------------------------------
  // Steps
  // --------------------------------------------------------------------------

  const steps: WizardStep[] = [
    {
      title: 'Entrada',
      description: 'Tipo e origem da receita',
      icon: <FileText className="h-16 w-16 text-emerald-500" />,
      content: <ReceivableStepEntry data={wizardData} onChange={updateData} />,
      isValid: isStep1Valid,
    },
    {
      title: 'Detalhes',
      description: 'Categorização e valores',
      icon: <PenLine className="h-16 w-16 text-sky-500" />,
      content: (
        <ReceivableStepDetails
          data={wizardData}
          onChange={partial => {
            updateData(partial);
            const keys = Object.keys(partial);
            if (keys.some(k => fieldErrors[k])) {
              setFieldErrors(prev => {
                const next = { ...prev };
                keys.forEach(k => {
                  if (next[k]) delete next[k];
                });
                return next;
              });
            }
          }}
          fieldErrors={fieldErrors}
        />
      ),
      isValid: isStep2Valid,
    },
    {
      title: 'Confirmação',
      description: 'Revisão e envio',
      icon: <CheckCircle className="h-16 w-16 text-emerald-500" />,
      content: (
        <ReceivableStepConfirmation
          data={wizardData}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      ),
      footer: (
        <ReceivableConfirmationFooter
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
