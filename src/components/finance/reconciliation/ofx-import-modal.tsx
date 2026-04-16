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
import type { Reconciliation, ReconciliationItem } from '@/types/finance';
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
  const [importedReconciliation, setImportedReconciliation] = useState<
    (Reconciliation & { items?: ReconciliationItem[] }) | null
  >(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: bankAccountsData } = useBankAccounts({ perPage: 100 });
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const importMutation = useImportOfx();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validExtensions = ['.ofx', '.ofc'];
    const ext = selectedFile.name
      .slice(selectedFile.name.lastIndexOf('.'))
      .toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error('Formato inválido. Selecione um arquivo .ofx ou .ofc.');
      return;
    }
    setFile(selectedFile);
  }, []);

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
      setImportedReconciliation(result.reconciliation);
      setStep(2);
    } catch {
      toast.error('Erro ao processar o arquivo OFX.');
    }
  }, [bankAccountId, file, importMutation]);

  const handleClose = useCallback(() => {
    setStep(1);
    setBankAccountId('');
    setFile(null);
    setImportedReconciliation(null);
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
                      isDragging ? 'text-sky-500' : 'text-muted-foreground'
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
      description: 'Confira todas as transações extraídas do arquivo OFX.',
      icon: (
        <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400 opacity-80" />
      ),
      isValid: true,
      onBack: () => setStep(1),
      content: importedReconciliation ? (
        <OfxImportPreview reconciliation={importedReconciliation} />
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
      heightClass="h-[640px]"
    />
  );
}

// ============================================================================
// OFX IMPORT PREVIEW
// ============================================================================

function OfxImportPreview({
  reconciliation,
}: {
  reconciliation: Reconciliation & { items?: ReconciliationItem[] };
}) {
  const items = reconciliation.items ?? [];
  const credits = items.filter(i => i.transactionType === 'CREDIT');
  const debits = items.filter(i => i.transactionType === 'DEBIT');
  const totalCredits = credits.reduce((sum, i) => sum + Math.abs(i.amount), 0);
  const totalDebits = debits.reduce((sum, i) => sum + Math.abs(i.amount), 0);
  const net = totalCredits - totalDebits;

  return (
    <div className="space-y-3 p-1" data-testid="ofx-import-preview">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border p-2.5 space-y-0.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Transações
          </p>
          <p className="text-lg font-bold tabular-nums">
            {reconciliation.totalItems}
          </p>
        </div>
        <div className="rounded-lg border p-2.5 space-y-0.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Período
          </p>
          <p className="text-xs font-medium leading-tight">
            {formatDate(reconciliation.periodStart)}
            <br />
            até {formatDate(reconciliation.periodEnd)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-500/8 p-2.5 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            <ArrowUpCircle className="h-3 w-3" />
            Créditos ({credits.length})
          </div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
            {formatCurrency(totalCredits)}
          </p>
        </div>
        <div className="rounded-lg border border-rose-200 dark:border-rose-800/40 bg-rose-50 dark:bg-rose-500/8 p-2.5 space-y-0.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-rose-700 dark:text-rose-300">
            <ArrowDownCircle className="h-3 w-3" />
            Débitos ({debits.length})
          </div>
          <p className="text-sm font-bold text-rose-700 dark:text-rose-300 font-mono tabular-nums">
            {formatCurrency(totalDebits)}
          </p>
        </div>
      </div>

      {/* Net Flow */}
      <div
        className={cn(
          'rounded-lg border p-2.5 flex items-center justify-between',
          net >= 0
            ? 'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-500/5'
            : 'border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-500/5'
        )}
      >
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Fluxo líquido
        </span>
        <span
          className={cn(
            'text-base font-bold font-mono tabular-nums',
            net >= 0
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-rose-700 dark:text-rose-300'
          )}
        >
          {net >= 0 ? '+' : ''}
          {formatCurrency(net)}
        </span>
      </div>

      {/* Transaction List */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
          Todas as transações ({items.length})
        </p>
        <div
          className="rounded-lg border border-border max-h-[280px] overflow-y-auto"
          data-testid="ofx-preview-list"
        >
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma transação detectada.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map(item => {
                const isCredit = item.transactionType === 'CREDIT';
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 transition-colors"
                    data-testid="ofx-preview-row"
                  >
                    <div
                      className={cn(
                        'h-6 w-6 rounded-md flex items-center justify-center shrink-0',
                        isCredit
                          ? 'bg-emerald-100 dark:bg-emerald-500/10'
                          : 'bg-rose-100 dark:bg-rose-500/10'
                      )}
                    >
                      {isCredit ? (
                        <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowDownCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(item.date)}
                        {item.fitId && ` · FITID ${item.fitId}`}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-sm font-mono font-semibold tabular-nums whitespace-nowrap',
                        isCredit
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-rose-700 dark:text-rose-300'
                      )}
                    >
                      {isCredit ? '+' : '-'}
                      {formatCurrency(Math.abs(item.amount))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        As transações serão comparadas com lançamentos existentes para sugestão
        automática.
      </p>
    </div>
  );
}
