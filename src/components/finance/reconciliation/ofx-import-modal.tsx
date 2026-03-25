'use client';

import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBankAccounts } from '@/hooks/finance/use-bank-accounts';
import { useImportOfx } from '@/hooks/finance/use-reconciliation';
import type { ReconciliationImportPreview } from '@/types/finance';
import { cn } from '@/lib/utils';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  FileUp,
  Loader2,
  Upload,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface OfxImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: () => void;
}

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
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OfxImportModal({
  open,
  onOpenChange,
  onImported,
}: OfxImportModalProps) {
  const [step, setStep] = useState(1);
  const [bankAccountId, setBankAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ReconciliationImportPreview | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: bankAccountsData } = useBankAccounts({ perPage: 100 });
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const importMutation = useImportOfx();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = useCallback(
    (selectedFile: File) => {
      const validExtensions = ['.ofx', '.ofc'];
      const ext = selectedFile.name
        .slice(selectedFile.name.lastIndexOf('.'))
        .toLowerCase();
      if (!validExtensions.includes(ext)) {
        toast.error('Formato inválido. Selecione um arquivo .ofx ou .ofc.');
        return;
      }
      setFile(selectedFile);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const handleImport = useCallback(async () => {
    if (!bankAccountId || !file) return;

    try {
      const result = await importMutation.mutateAsync({
        bankAccountId,
        file,
      });
      setPreview(result.preview);
      setStep(2);
    } catch {
      toast.error('Erro ao processar o arquivo OFX.');
    }
  }, [bankAccountId, file, importMutation]);

  const handleClose = useCallback(() => {
    setStep(1);
    setBankAccountId('');
    setFile(null);
    setPreview(null);
    setIsDragging(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleConfirm = useCallback(() => {
    toast.success('Importação OFX realizada com sucesso!');
    onImported?.();
    handleClose();
  }, [onImported, handleClose]);

  // ============================================================================
  // STEP DEFINITIONS
  // ============================================================================

  const step1Valid = !!bankAccountId && !!file;

  const steps: WizardStep[] = [
    {
      title: 'Upload do Arquivo OFX',
      description:
        'Selecione a conta bancária e o arquivo OFX para importação.',
      icon: (
        <Upload className="h-16 w-16 text-sky-500 dark:text-sky-400 opacity-80" />
      ),
      isValid: step1Valid,
      content: (
        <div className="space-y-5 p-1">
          {/* Bank Account Select */}
          <div className="space-y-2">
            <Label htmlFor="bank-account">Conta Bancária</Label>
            <Select value={bankAccountId} onValueChange={setBankAccountId}>
              <SelectTrigger id="bank-account">
                <SelectValue placeholder="Selecione a conta bancária..." />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts
                  .filter(ba => ba.status === 'ACTIVE')
                  .map(ba => (
                    <SelectItem key={ba.id} value={ba.id}>
                      {ba.name} — {ba.bankName || ba.bankCode}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Drop Zone */}
          <div className="space-y-2">
            <Label>Arquivo OFX</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
                isDragging
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/8'
                  : file
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/8'
                    : 'border-border hover:border-sky-400 hover:bg-muted/50'
              )}
            >
              {file ? (
                <>
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(file.size / 1024).toFixed(1)} KB — Clique para
                      substituir
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <FileUp
                    className={cn(
                      'h-10 w-10',
                      isDragging
                        ? 'text-sky-500'
                        : 'text-muted-foreground'
                    )}
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Arraste o arquivo aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceitos: .ofx, .ofc
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.ofc"
                onChange={handleInputChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      ),
      footer: (
        <div className="flex items-center justify-between w-full px-6 py-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!step1Valid || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processando...
              </>
            ) : (
              'Importar e Visualizar'
            )}
          </Button>
        </div>
      ),
    },
    {
      title: 'Prévia da Importação',
      description: 'Confira os dados extraídos do arquivo OFX.',
      icon: (
        <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400 opacity-80" />
      ),
      isValid: true,
      onBack: () => setStep(1),
      content: preview ? (
        <div className="space-y-4 p-1">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">
                Total de Transações
              </p>
              <p className="text-xl font-bold">
                {preview.totalTransactions}
              </p>
            </div>
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="text-sm font-medium">
                {formatDate(preview.periodStart)} a{' '}
                {formatDate(preview.periodEnd)}
              </p>
            </div>
          </div>

          {/* Credits / Debits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-500/8 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Créditos ({preview.creditCount})
              </div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                {formatCurrency(preview.totalCredits)}
              </p>
            </div>
            <div className="rounded-lg border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-500/8 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                Débitos ({preview.debitCount})
              </div>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300 font-mono">
                {formatCurrency(preview.totalDebits)}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            As transações serão comparadas com os lançamentos existentes para
            sugestão automática de conciliação.
          </p>
        </div>
      ) : null,
      footer: (
        <div className="flex items-center justify-between w-full px-6 py-4 border-t border-border/50">
          <Button variant="ghost" onClick={() => setStep(1)}>
            Voltar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Importação</Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      onClose={handleClose}
      heightClass="h-[520px]"
    />
  );
}
