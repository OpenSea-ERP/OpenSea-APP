'use client';

import { parseBoleto } from '@/lib/boleto-parser';
import { parsePix } from '@/lib/pix-parser';
import { financeOcrService } from '@/services/finance/finance-ocr.service';
import { format, parseISO } from 'date-fns';
import { Barcode, Loader2, Upload, X, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import type { PayableWizardData } from './payable-wizard-modal';

// ============================================================================
// TYPES
// ============================================================================

interface PayableStepEntryProps {
  data: PayableWizardData;
  onChange: (partial: Partial<PayableWizardData>) => void;
}

type PaymentType = 'BOLETO' | 'PIX';

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    value
  );

const formatDate = (iso: string) => {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy');
  } catch {
    return iso;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PayableStepEntry({ data, onChange }: PayableStepEntryProps) {
  const [boletoInput, setBoletoInput] = useState('');
  const [pixInput, setPixInput] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Payment type selection
  // --------------------------------------------------------------------------

  const handleSelectType = useCallback(
    (type: PaymentType) => {
      onChange({
        paymentType: type,
        // Reset fields when switching type
        boletoBarcode: '',
        boletoDigitLine: '',
        pixKey: '',
        pixKeyType: null,
        pixInputType: null,
        beneficiaryName: '',
        beneficiaryCpfCnpj: '',
        bankCode: '',
        bankName: '',
        expectedAmount: 0,
        dueDate: '',
        batchEntries: [],
        uploadedFiles: [],
      });
      setBoletoInput('');
      setPixInput('');
    },
    [onChange]
  );

  // --------------------------------------------------------------------------
  // Boleto input handler
  // --------------------------------------------------------------------------

  const handleBoletoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setBoletoInput(raw);

      const digits = raw.replace(/\D/g, '');

      if (digits.length === 44 || digits.length === 47) {
        const result = parseBoleto(digits);
        if (result.success) {
          onChange({
            expectedAmount: result.amount ?? 0,
            dueDate: result.dueDate ?? '',
            bankCode: result.bankCode ?? '',
            bankName: result.bankName ?? '',
            boletoBarcode:
              result.inputType === 'codigo_barras' ? digits : '',
            boletoDigitLine:
              result.inputType === 'linha_digitavel' ? digits : '',
          });
        }
      }
    },
    [onChange]
  );

  // --------------------------------------------------------------------------
  // Pix input handler
  // --------------------------------------------------------------------------

  const handlePixChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setPixInput(raw);

      if (!raw.trim()) return;

      const result = parsePix(raw);
      if (!result.success) return;

      if (result.type === 'COPIA_COLA') {
        onChange({
          pixKey: result.pixKey,
          pixKeyType: result.pixKeyType,
          pixInputType: 'COPIA_COLA',
          beneficiaryName: result.merchantName ?? '',
          expectedAmount: result.amount ?? 0,
        });
      } else {
        onChange({
          pixKey: result.pixKey,
          pixKeyType: result.pixKeyType,
          pixInputType: 'CHAVE',
        });
      }
    },
    [onChange]
  );

  // --------------------------------------------------------------------------
  // File upload (DnD) handler
  // --------------------------------------------------------------------------

  const handleFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      onChange({ uploadedFiles: acceptedFiles });
      setIsOcrLoading(true);

      try {
        const ocrResult = await financeOcrService.ocrUploadBatch(acceptedFiles);

        const batchEntries = ocrResult.results.map((r) => {
          const extracted = r.extractedData;
          const hasMissingFields =
            !extracted.valor || !extracted.vencimento || !extracted.beneficiario;
          const lowConfidence = r.confidence < 0.5;

          return {
            id: crypto.randomUUID(),
            beneficiaryName: extracted.beneficiario ?? '',
            beneficiaryCpfCnpj: '',
            supplierId: '',
            supplierName: '',
            expectedAmount: extracted.valor ?? 0,
            dueDate: extracted.vencimento ?? '',
            interest: 0,
            penalty: 0,
            discount: 0,
            boletoBarcode: extracted.codigoBarras ?? '',
            boletoDigitLine: extracted.linhaDigitavel ?? '',
            ocrConfidence: r.confidence,
            hasWarning: lowConfidence || hasMissingFields,
          };
        });

        onChange({ batchEntries });
      } catch {
        // Keep uploaded files but no batch entries
        onChange({ batchEntries: [] });
      } finally {
        setIsOcrLoading(false);
      }
    },
    [onChange]
  );

  const handleRemoveFile = useCallback(
    (index: number) => {
      const newFiles = data.uploadedFiles.filter((_, i) => i !== index);
      onChange({ uploadedFiles: newFiles });
      if (newFiles.length === 0) {
        onChange({ batchEntries: [] });
      }
    },
    [data.uploadedFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024,
    onDrop: handleFileDrop,
  });

  // --------------------------------------------------------------------------
  // Boleto parsed feedback
  // --------------------------------------------------------------------------

  const boletoParsed = (() => {
    const digits = boletoInput.replace(/\D/g, '');
    if (digits.length !== 44 && digits.length !== 47) return null;
    const result = parseBoleto(digits);
    if (!result.success) return null;
    return result;
  })();

  // --------------------------------------------------------------------------
  // Pix parsed result
  // --------------------------------------------------------------------------

  const pixParsed = (() => {
    if (!pixInput.trim()) return null;
    const result = parsePix(pixInput);
    if (!result.success) return null;
    return result;
  })();

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1 — Payment Type Cards */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleSelectType('BOLETO')}
          className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all text-left ${
            data.paymentType === 'BOLETO'
              ? 'border-2 border-violet-500 bg-violet-500/8'
              : 'border-2 border-border opacity-50'
          }`}
        >
          <Barcode className="size-6 shrink-0 text-violet-500" />
          <div>
            <p className="font-medium text-sm">Boleto</p>
            <p className="text-xs text-muted-foreground">
              Pagamento via boleto bancário
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectType('PIX')}
          className={`rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all text-left ${
            data.paymentType === 'PIX'
              ? 'border-2 border-violet-500 bg-violet-500/8'
              : 'border-2 border-border opacity-50'
          }`}
        >
          <Zap className="size-6 shrink-0 text-violet-500" />
          <div>
            <p className="font-medium text-sm">Pix / Transferência</p>
            <p className="text-xs text-muted-foreground">
              Pix, TED ou transferência bancária
            </p>
          </div>
        </button>
      </div>

      {/* Row 2 — Input Field */}
      {data.paymentType === 'BOLETO' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Linha digitável ou código de barras
          </label>
          <input
            type="text"
            value={boletoInput}
            onChange={handleBoletoChange}
            placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
          {boletoParsed && (
            <p className="text-xs text-violet-500 font-medium">
              {boletoParsed.bankName ?? `Banco ${boletoParsed.bankCode}`}
              {boletoParsed.amount != null &&
                ` · ${formatCurrency(boletoParsed.amount)}`}
              {boletoParsed.dueDate &&
                ` · venc. ${formatDate(boletoParsed.dueDate)}`}
            </p>
          )}
        </div>
      )}

      {data.paymentType === 'PIX' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Chave Pix ou código Copia e Cola
          </label>
          <input
            type="text"
            value={pixInput}
            onChange={handlePixChange}
            placeholder="CPF, CNPJ, e-mail, telefone, chave aleatória ou código Copia e Cola"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      )}

      {/* Row 3 — Context Area */}
      {data.paymentType === 'BOLETO' && (
        <div className="flex flex-col gap-3">
          {/* DnD Upload Zone */}
          <div
            {...getRootProps()}
            className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-violet-500 bg-violet-500/5'
                : 'border-border hover:border-violet-500/40'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">
              Arraste PDFs de boletos aqui
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou clique para selecionar · aceita múltiplos arquivos para criação
              em lote
            </p>
          </div>

          {/* File List */}
          {data.uploadedFiles.length > 0 && (
            <div className="flex flex-col gap-2">
              {data.uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Barcode className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="p-1 rounded-md hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* OCR Loading */}
          {isOcrLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="size-5 animate-spin text-violet-500" />
              <span className="text-sm text-muted-foreground">
                Processando boletos via OCR...
              </span>
            </div>
          )}
        </div>
      )}

      {/* Pix Copia e Cola — Green Summary Card */}
      {data.paymentType === 'PIX' &&
        pixParsed?.type === 'COPIA_COLA' &&
        pixParsed.success && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3">
              Dados do Pix
            </p>
            <div className="grid grid-cols-2 gap-3">
              {pixParsed.merchantName && (
                <div>
                  <p className="text-xs text-muted-foreground">Destinatário</p>
                  <p className="text-sm font-medium">{pixParsed.merchantName}</p>
                </div>
              )}
              {pixParsed.amount != null && pixParsed.amount > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-sm font-medium">
                    {formatCurrency(pixParsed.amount)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
