'use client';

import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useCreateFinanceEntry } from '@/hooks/finance';
import { financeEntriesService } from '@/services/finance';
import type { CreateFinanceEntryData } from '@/types/finance';
import { Barcode, CheckCircle, FileText } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  PayableConfirmationFooter,
  PayableStepConfirmation,
} from './payable-step-confirmation';
import { PayableStepDetails } from './payable-step-details';
import { PayableStepEntry } from './payable-step-entry';

// ============================================================================
// TYPES
// ============================================================================

export interface BatchEntry {
  id: string;
  beneficiaryName: string;
  beneficiaryCpfCnpj: string;
  supplierId: string;
  supplierName: string;
  expectedAmount: number;
  dueDate: string;
  interest: number;
  penalty: number;
  discount: number;
  boletoBarcode: string;
  boletoDigitLine: string;
  ocrConfidence: number;
  hasWarning: boolean;
}

export interface PayableWizardData {
  // Step 1 — type + input
  paymentType: 'BOLETO' | 'PIX' | null;
  boletoBarcode: string;
  boletoDigitLine: string;
  pixKey: string;
  pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'EVP' | null;
  pixInputType: 'COPIA_COLA' | 'CHAVE' | null;
  // Extracted data
  beneficiaryName: string;
  beneficiaryCpfCnpj: string;
  bankCode: string;
  bankName: string;
  // Step 2 — details
  description: string;
  supplierId: string;
  supplierName: string;
  categoryId: string;
  categoryName: string;
  costCenterId: string;
  costCenterName: string;
  bankAccountId: string;
  bankAccountName: string;
  expectedAmount: number;
  issueDate: string;
  dueDate: string;
  competenceDate: string;
  interest: number;
  penalty: number;
  discount: number;
  tags: string[];
  notes: string;
  // Batch entries (from multi-PDF upload)
  batchEntries: BatchEntry[];
  // Uploaded files
  uploadedFiles: File[];
}

const INITIAL_DATA: PayableWizardData = {
  paymentType: null,
  boletoBarcode: '',
  boletoDigitLine: '',
  pixKey: '',
  pixKeyType: null,
  pixInputType: null,
  beneficiaryName: '',
  beneficiaryCpfCnpj: '',
  bankCode: '',
  bankName: '',
  description: '',
  supplierId: '',
  supplierName: '',
  categoryId: '',
  categoryName: '',
  costCenterId: '',
  costCenterName: '',
  bankAccountId: '',
  bankAccountName: '',
  expectedAmount: 0,
  issueDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  competenceDate: '',
  interest: 0,
  penalty: 0,
  discount: 0,
  tags: [],
  notes: '',
  batchEntries: [],
  uploadedFiles: [],
};

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
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<PayableWizardData>({
    ...INITIAL_DATA,
  });

  const createMutation = useCreateFinanceEntry();

  const updateData = useCallback((partial: Partial<PayableWizardData>) => {
    setWizardData(prev => ({ ...prev, ...partial }));
  }, []);

  const isBatchMode = wizardData.batchEntries.length >= 2;

  // --------------------------------------------------------------------------
  // Step validation
  // --------------------------------------------------------------------------

  const isStep1Valid =
    wizardData.paymentType !== null &&
    (wizardData.paymentType === 'BOLETO'
      ? wizardData.boletoBarcode !== '' ||
        wizardData.uploadedFiles.length > 0 ||
        wizardData.batchEntries.length > 0
      : wizardData.pixKey !== '');

  const isStep2Valid = isBatchMode
    ? wizardData.categoryId !== '' &&
      wizardData.batchEntries.every(e => e.expectedAmount > 0)
    : wizardData.description !== '' &&
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
      if (isBatchMode) {
        // Batch mode — create multiple entries
        const entries: CreateFinanceEntryData[] = wizardData.batchEntries.map(
          entry => ({
            type: 'PAYABLE' as const,
            description:
              entry.beneficiaryName || wizardData.description || 'Boleto',
            categoryId: wizardData.categoryId,
            costCenterId: wizardData.costCenterId || undefined,
            bankAccountId: wizardData.bankAccountId || undefined,
            expectedAmount: entry.expectedAmount,
            interest: entry.interest || undefined,
            penalty: entry.penalty || undefined,
            discount: entry.discount || undefined,
            issueDate: wizardData.issueDate,
            dueDate: entry.dueDate,
            supplierId: entry.supplierId || undefined,
            supplierName: entry.supplierName || undefined,
            beneficiaryName: entry.beneficiaryName || undefined,
            beneficiaryCpfCnpj: entry.beneficiaryCpfCnpj || undefined,
            boletoBarcode: entry.boletoBarcode || undefined,
            boletoDigitLine: entry.boletoDigitLine || undefined,
          })
        );

        await financeEntriesService.createBatch({ entries });
        toast.success(
          `${entries.length} contas a pagar criadas com sucesso!`
        );
      } else {
        // Single entry
        const payload: CreateFinanceEntryData = {
          type: 'PAYABLE',
          description: wizardData.description,
          categoryId: wizardData.categoryId,
          expectedAmount: wizardData.expectedAmount,
          issueDate: wizardData.issueDate,
          dueDate: wizardData.dueDate,
          competenceDate: wizardData.competenceDate || undefined,
          supplierId: wizardData.supplierId || undefined,
          supplierName: wizardData.supplierName || undefined,
          costCenterId: wizardData.costCenterId || undefined,
          bankAccountId: wizardData.bankAccountId || undefined,
          interest: wizardData.interest || undefined,
          penalty: wizardData.penalty || undefined,
          discount: wizardData.discount || undefined,
          beneficiaryName: wizardData.beneficiaryName || undefined,
          beneficiaryCpfCnpj: wizardData.beneficiaryCpfCnpj || undefined,
          boletoBarcode: wizardData.boletoBarcode || undefined,
          boletoDigitLine: wizardData.boletoDigitLine || undefined,
          pixKey: wizardData.pixKey || undefined,
          pixKeyType: wizardData.pixKeyType || undefined,
          notes: wizardData.notes || undefined,
          tags: wizardData.tags.length > 0 ? wizardData.tags : undefined,
        };

        const result = await createMutation.mutateAsync(payload);

        // Upload attachment if files were selected
        if (wizardData.uploadedFiles.length > 0 && result?.entry?.id) {
          try {
            await financeEntriesService.uploadAttachment(
              result.entry.id,
              wizardData.uploadedFiles[0],
              'OTHER'
            );
          } catch {
            toast.warning(
              'Conta criada, mas o anexo não foi enviado. Você pode enviá-lo pela página de detalhes.'
            );
          }
        }

        toast.success('Conta a pagar criada com sucesso!');
      }

      handleClose();
      onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar conta a pagar.';
      toast.error(message);
    }
  }, [
    wizardData,
    isBatchMode,
    createMutation,
    handleClose,
    onCreated,
  ]);

  // --------------------------------------------------------------------------
  // Steps
  // --------------------------------------------------------------------------

  const steps: WizardStep[] = [
    {
      title: 'Entrada',
      description: 'Tipo e dados do pagamento',
      icon: <Barcode className="h-16 w-16 text-primary/60" />,
      content: <PayableStepEntry data={wizardData} onChange={updateData} />,
      isValid: isStep1Valid,
    },
    {
      title: 'Detalhes',
      description: 'Categorização e valores',
      icon: <FileText className="h-16 w-16 text-primary/60" />,
      content: <PayableStepDetails data={wizardData} onChange={updateData} />,
      isValid: isStep2Valid,
    },
    {
      title: 'Confirmação',
      description: 'Revisão e envio',
      icon: <CheckCircle className="h-16 w-16 text-primary/60" />,
      content: (
        <PayableStepConfirmation
          data={wizardData}
          isBatch={isBatchMode}
          onSubmit={handleSubmit}
          isPending={createMutation.isPending}
        />
      ),
      footer: (
        <PayableConfirmationFooter
          isBatch={isBatchMode}
          entryCount={wizardData.batchEntries.length}
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
