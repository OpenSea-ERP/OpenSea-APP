'use client';

import type { OcrExtractResult } from '@/services/finance';
import { FileText, PenLine } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  OcrConfirmationStep,
  type OcrConfirmedData,
} from './ocr-confirmation-step';
import { OcrUploadButton } from './ocr-upload-button';
import type { ReceivableWizardData } from './receivable-wizard-modal';

// ============================================================================
// TYPES
// ============================================================================

type EntryMode = 'NF' | 'MANUAL' | null;

type ManualSubType = 'INVOICE' | 'BILL' | 'SALARY' | 'BONUS' | 'REBATE';

const MANUAL_SUBTYPES: { type: ManualSubType; label: string }[] = [
  { type: 'INVOICE', label: 'Fatura' },
  { type: 'BILL', label: 'Duplicata' },
  { type: 'SALARY', label: 'Salário' },
  { type: 'BONUS', label: 'Bonificação' },
  { type: 'REBATE', label: 'Reembolso' },
];

interface ReceivableStepEntryProps {
  data: ReceivableWizardData;
  onChange: (partial: Partial<ReceivableWizardData>) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ReceivableStepEntry({
  data,
  onChange,
}: ReceivableStepEntryProps) {
  const [entryMode, setEntryMode] = useState<EntryMode>(
    data.entryMode ?? null
  );
  const [ocrResult, setOcrResult] = useState<OcrExtractResult | null>(null);

  // --------------------------------------------------------------------------
  // Mode selection
  // --------------------------------------------------------------------------

  const handleSelectMode = useCallback(
    (mode: EntryMode) => {
      setEntryMode(mode);
      onChange({
        entryMode: mode,
        subType: mode === 'NF' ? 'VENDA' : null,
      });
      setOcrResult(null);
    },
    [onChange]
  );

  // --------------------------------------------------------------------------
  // OCR handlers
  // --------------------------------------------------------------------------

  const handleOcrExtracted = useCallback((result: OcrExtractResult) => {
    setOcrResult(result);
  }, []);

  const handleOcrConfirm = useCallback(
    (confirmed: OcrConfirmedData) => {
      const updates: Partial<ReceivableWizardData> = {};
      if (confirmed.valor) updates.expectedAmount = confirmed.valor;
      if (confirmed.vencimento) updates.dueDate = confirmed.vencimento;
      if (confirmed.beneficiario) updates.customerName = confirmed.beneficiario;
      updates.ocrApplied = true;
      onChange(updates);
      setOcrResult(null);
    },
    [onChange]
  );

  const handleOcrDiscard = useCallback(() => {
    setOcrResult(null);
  }, []);

  // --------------------------------------------------------------------------
  // Manual sub-type selection
  // --------------------------------------------------------------------------

  const handleManualSubType = useCallback(
    (type: ManualSubType) => {
      onChange({ subType: type as ReceivableWizardData['subType'] });
    },
    [onChange]
  );

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1 — Entry Mode Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSelectMode('NF')}
          className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all text-left ${
            entryMode === 'NF'
              ? 'border-2 border-emerald-500 bg-emerald-500/8'
              : 'border-2 border-border opacity-50'
          }`}
        >
          <FileText className="size-6 shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium text-sm">Nota Fiscal</p>
            <p className="text-xs text-muted-foreground">
              Importar dados via OCR de nota fiscal
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMode('MANUAL')}
          className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all text-left ${
            entryMode === 'MANUAL'
              ? 'border-2 border-sky-500 bg-sky-500/8'
              : 'border-2 border-border opacity-50'
          }`}
        >
          <PenLine className="size-6 shrink-0 text-sky-500" />
          <div>
            <p className="font-medium text-sm">Outro</p>
            <p className="text-xs text-muted-foreground">
              Entrada manual de conta a receber
            </p>
          </div>
        </button>
      </div>

      {/* Row 2 — NF: OCR upload */}
      {entryMode === 'NF' && (
        <div className="flex flex-col gap-3">
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

          {data.ocrApplied && !ocrResult && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Dados importados com sucesso
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Os campos foram preenchidos automaticamente. Você pode
                ajustá-los no próximo passo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Row 2 — Manual: Sub-type chips */}
      {entryMode === 'MANUAL' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Tipo de receita
          </p>
          <div className="flex flex-wrap gap-2">
            {MANUAL_SUBTYPES.map(({ type, label }) => {
              const isSelected = data.subType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleManualSubType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300 border border-sky-500/40'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:border-sky-500/30'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
