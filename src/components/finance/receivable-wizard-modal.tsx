'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateFinanceEntry } from '@/hooks/finance';
import { financeEntriesService } from '@/services/finance';
import type {
  CostCenterAllocation,
  CreateFinanceEntryData,
  FinanceAttachmentType,
  RecurrenceUnit,
  ReceivableSubType,
} from '@/types/finance';
import {
  RECEIVABLE_SUBTYPE_LABELS,
  RECURRENCE_UNIT_LABELS,
} from '@/types/finance';
import type { OcrExtractResult } from '@/services/finance';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileUp,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { InstallmentPreview } from './installment-preview';
import { OcrConfirmationStep, type OcrConfirmedData } from './ocr-confirmation-step';
import { OcrUploadButton } from './ocr-upload-button';
import { WizardStepDataReceivable } from './wizard-step-data-receivable';
import { WizardStepTypeReceivable } from './wizard-step-type-receivable';

// ============================================================================
// TYPES
// ============================================================================

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface ReceivableWizardData {
  subType: ReceivableSubType | null;
  description: string;
  customerId: string;
  customerName: string;
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
  notes: string;
  tags: string[];
}

const INITIAL_WIZARD_DATA: ReceivableWizardData = {
  subType: null,
  description: '',
  customerId: '',
  customerName: '',
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
  notes: '',
  tags: [],
};

const STEP_LABELS = ['Tipo', 'Dados', 'Parcelas', 'Anexo', 'Confirmacao'];

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

const ATTACHMENT_TYPE_LABELS: Record<FinanceAttachmentType, string> = {
  BOLETO: 'Boleto',
  PAYMENT_RECEIPT: 'Comprovante',
  INVOICE: 'Nota Fiscal',
  CONTRACT: 'Contrato',
  OTHER: 'Outro',
};

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateStr;
  }
}

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
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [wizardData, setWizardData] = useState<ReceivableWizardData>({
    ...INITIAL_WIZARD_DATA,
  });

  const [ocrResult, setOcrResult] = useState<OcrExtractResult | null>(null);

  const createMutation = useCreateFinanceEntry();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleReset = useCallback(() => {
    setCurrentStep(1);
    setWizardData({ ...INITIAL_WIZARD_DATA, issueDate: new Date().toISOString().split('T')[0] });
    setOcrResult(null);
  }, []);

  const handleOcrExtracted = useCallback((result: OcrExtractResult) => {
    setOcrResult(result);
  }, []);

  const handleOcrConfirm = useCallback((data: OcrConfirmedData) => {
    const updates: Partial<ReceivableWizardData> = {};
    if (data.valor) updates.expectedAmount = data.valor;
    if (data.vencimento) updates.dueDate = data.vencimento;
    if (data.beneficiario) updates.customerName = data.beneficiario;

    setWizardData((prev) => ({ ...prev, ...updates }));
    setOcrResult(null);
    setCurrentStep(2); // Auto-advance to Dados step
  }, []);

  const handleOcrDiscard = useCallback(() => {
    setOcrResult(null);
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

  const updateWizardData = useCallback((updates: Partial<ReceivableWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...updates }));
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    setCurrentStep(step);
  }, []);

  const handleConfirm = useCallback(async () => {
    const payload: CreateFinanceEntryData = {
      type: 'RECEIVABLE',
      description: wizardData.description,
      categoryId: wizardData.categoryId,
      expectedAmount: wizardData.expectedAmount,
      issueDate: wizardData.issueDate,
      dueDate: wizardData.dueDate,
      competenceDate: wizardData.competenceDate || undefined,
      customerName: wizardData.customerName || undefined,
      customerId: wizardData.customerId || undefined,
      bankAccountId: wizardData.bankAccountId || undefined,
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
      toast.success('Conta a receber criada com sucesso!');

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
        err instanceof Error ? err.message : 'Erro ao criar conta a receber.';
      toast.error(message);
    }
  }, [wizardData, createMutation, handleOpenChange, onCreated]);

  // --------------------------------------------------------------------------
  // Attachment handlers
  // --------------------------------------------------------------------------

  const handleFileChange = useCallback(
    (file: File | null) => {
      updateWizardData({ attachmentFile: file });
    },
    [updateWizardData]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileChange(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file) {
      handleFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    handleFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Conta a Receber</DialogTitle>
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
          <div className="space-y-4">
            <WizardStepTypeReceivable
              wizardData={wizardData}
              updateWizardData={updateWizardData}
              goToStep={goToStep}
            />

            {/* OCR Section */}
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Importar dados automaticamente
              </p>
              <OcrUploadButton onExtracted={handleOcrExtracted} />
              {ocrResult && (
                <OcrConfirmationStep
                  ocrResult={ocrResult}
                  onConfirm={handleOcrConfirm}
                  onDiscard={handleOcrDiscard}
                />
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <WizardStepDataReceivable
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            goToStep={goToStep}
          />
        )}

        {currentStep === 3 && (
          <ReceivableInstallmentsStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            goToStep={goToStep}
          />
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Anexe um documento ao lancamento (opcional).
            </p>

            {/* Attachment Type */}
            <div className="space-y-2">
              <Label>Tipo de Anexo</Label>
              <Select
                value={wizardData.attachmentType}
                onValueChange={(val) =>
                  updateWizardData({
                    attachmentType: val as FinanceAttachmentType,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ATTACHMENT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Drop Zone */}
            {!wizardData.attachmentFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Arraste ou clique para enviar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, PNG, DOC, DOCX
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                <FileUp className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {wizardData.attachmentFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(wizardData.attachmentFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => goToStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={() => goToStep(5)}>
                Proximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <ReceivableConfirmationStep
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

// ============================================================================
// INSTALLMENTS STEP (inline, adapted for receivable types)
// ============================================================================

function ReceivableInstallmentsStep({
  wizardData,
  updateWizardData,
  goToStep,
}: {
  wizardData: ReceivableWizardData;
  updateWizardData: (updates: Partial<ReceivableWizardData>) => void;
  goToStep: (step: WizardStep) => void;
}) {
  const isInstallment = wizardData.recurrenceType === 'INSTALLMENT';

  return (
    <div className="space-y-4">
      {/* Toggle: Avulso vs Parcelado */}
      <div className="space-y-2">
        <Label>Tipo de Lancamento</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateWizardData({ recurrenceType: 'SINGLE' })}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              !isInstallment
                ? 'border-primary bg-primary/5 font-medium'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-sm">Avulso</span>
            <p className="text-xs text-muted-foreground mt-1">
              Lancamento unico
            </p>
          </button>
          <button
            type="button"
            onClick={() => updateWizardData({ recurrenceType: 'INSTALLMENT' })}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              isInstallment
                ? 'border-primary bg-primary/5 font-medium'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-sm">Parcelado</span>
            <p className="text-xs text-muted-foreground mt-1">
              Dividir em parcelas
            </p>
          </button>
        </div>
      </div>

      {/* Single summary */}
      {!isInstallment && (
        <div className="p-4 bg-muted/50 rounded-lg text-sm space-y-1">
          <p>
            <span className="text-muted-foreground">Descricao:</span>{' '}
            {wizardData.description || '--'}
          </p>
          <p>
            <span className="text-muted-foreground">Valor:</span>{' '}
            {formatCurrency(wizardData.expectedAmount)}
          </p>
          <p>
            <span className="text-muted-foreground">Vencimento:</span>{' '}
            {wizardData.dueDate || '--'}
          </p>
        </div>
      )}

      {/* Installment config */}
      {isInstallment && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="wizard-rcv-installments">Parcelas</Label>
              <Input
                id="wizard-rcv-installments"
                type="number"
                min={2}
                max={120}
                value={wizardData.totalInstallments}
                onChange={(e) =>
                  updateWizardData({
                    totalInstallments: Math.max(2, parseInt(e.target.value) || 2),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wizard-rcv-interval">Intervalo</Label>
              <Input
                id="wizard-rcv-interval"
                type="number"
                min={1}
                max={12}
                value={wizardData.recurrenceInterval}
                onChange={(e) =>
                  updateWizardData({
                    recurrenceInterval: Math.max(
                      1,
                      parseInt(e.target.value) || 1
                    ),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={wizardData.recurrenceUnit}
                onValueChange={(val) =>
                  updateWizardData({
                    recurrenceUnit: val as RecurrenceUnit,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_UNIT_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Previa das Parcelas</Label>
            <InstallmentPreview
              dueDate={wizardData.dueDate}
              amount={wizardData.expectedAmount}
              totalInstallments={wizardData.totalInstallments}
              interval={wizardData.recurrenceInterval}
              unit={wizardData.recurrenceUnit}
            />
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => goToStep(2)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={() => goToStep(4)}>
          Proximo
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIRMATION STEP (inline, adapted for receivable)
// ============================================================================

function ReceivableConfirmationStep({
  wizardData,
  goToStep,
  onConfirm,
  isPending,
}: {
  wizardData: ReceivableWizardData;
  goToStep: (step: WizardStep) => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Confira os dados antes de confirmar:
      </p>

      {/* Tipo */}
      <Card className="p-4 space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Tipo
        </h4>
        <p className="font-medium">
          {wizardData.subType
            ? RECEIVABLE_SUBTYPE_LABELS[wizardData.subType]
            : '--'}
        </p>
      </Card>

      {/* Dados Gerais */}
      <Card className="p-4 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Dados Gerais
        </h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Descricao:</span>
            <p className="font-medium">{wizardData.description || '--'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Cliente:</span>
            <p className="font-medium">{wizardData.customerName || '--'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Categoria:</span>
            <p className="font-medium">{wizardData.categoryName || '--'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Conta Bancaria:</span>
            <p className="font-medium">{wizardData.bankAccountName || '--'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Valor:</span>
            <p className="font-medium">
              {formatCurrency(wizardData.expectedAmount)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Data de Emissao:</span>
            <p className="font-medium">{formatDate(wizardData.issueDate)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Data de Vencimento:</span>
            <p className="font-medium">{formatDate(wizardData.dueDate)}</p>
          </div>
          {wizardData.competenceDate && (
            <div>
              <span className="text-muted-foreground">
                Data de Competencia:
              </span>
              <p className="font-medium">
                {formatDate(wizardData.competenceDate)}
              </p>
            </div>
          )}
        </div>

        {/* Cost Center */}
        {wizardData.useRateio &&
        wizardData.costCenterAllocations.length > 0 ? (
          <div className="text-sm">
            <span className="text-muted-foreground">
              Centros de Custo (Rateio):
            </span>
            <ul className="mt-1 space-y-1">
              {wizardData.costCenterAllocations.map((alloc, idx) => (
                <li key={idx} className="font-medium">
                  {alloc.costCenterName || alloc.costCenterId} -{' '}
                  {alloc.percentage.toFixed(2)}% (
                  {formatCurrency(
                    (alloc.percentage / 100) * wizardData.expectedAmount
                  )}
                  )
                </li>
              ))}
            </ul>
          </div>
        ) : wizardData.costCenterName ? (
          <div className="text-sm">
            <span className="text-muted-foreground">Centro de Custo:</span>
            <p className="font-medium">{wizardData.costCenterName}</p>
          </div>
        ) : null}

        {wizardData.notes && (
          <div className="text-sm">
            <span className="text-muted-foreground">Observacoes:</span>
            <p className="font-medium">{wizardData.notes}</p>
          </div>
        )}
      </Card>

      {/* Parcelas */}
      {wizardData.recurrenceType === 'INSTALLMENT' && (
        <Card className="p-4 space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Parcelamento
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Parcelas:</span>
              <p className="font-medium">{wizardData.totalInstallments}x</p>
            </div>
            <div>
              <span className="text-muted-foreground">Intervalo:</span>
              <p className="font-medium">{wizardData.recurrenceInterval}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Unidade:</span>
              <p className="font-medium">
                {RECURRENCE_UNIT_LABELS[wizardData.recurrenceUnit]}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Anexo */}
      {wizardData.attachmentFile && (
        <Card className="p-4 space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Anexo
          </h4>
          <p className="text-sm font-medium">
            {wizardData.attachmentFile.name} (
            {(wizardData.attachmentFile.size / 1024).toFixed(1)} KB)
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => goToStep(4)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onConfirm} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
