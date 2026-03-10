'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OcrExtractResult } from '@/services/finance';
import { Check, X } from 'lucide-react';
import { useCallback, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface OcrConfirmedData {
  valor?: number;
  vencimento?: string;
  beneficiario?: string;
  codigoBarras?: string;
  linhaDigitavel?: string;
}

interface OcrConfirmationStepProps {
  ocrResult: OcrExtractResult;
  onConfirm: (data: OcrConfirmedData) => void;
  onDiscard: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getConfidenceLabel(confidence: number): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
} {
  if (confidence >= 0.8) {
    return { label: 'Alta', variant: 'default' };
  }
  if (confidence >= 0.5) {
    return { label: 'Média', variant: 'secondary' };
  }
  return { label: 'Baixa', variant: 'destructive' };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OcrConfirmationStep({
  ocrResult,
  onConfirm,
  onDiscard,
}: OcrConfirmationStepProps) {
  const [valor, setValor] = useState<string>(
    ocrResult.extractedData.valor?.toString() ?? '',
  );
  const [vencimento, setVencimento] = useState<string>(
    ocrResult.extractedData.vencimento ?? '',
  );
  const [beneficiario, setBeneficiario] = useState<string>(
    ocrResult.extractedData.beneficiario ?? '',
  );

  const confidenceInfo = getConfidenceLabel(ocrResult.confidence);

  const handleConfirm = useCallback(() => {
    const data: OcrConfirmedData = {};

    if (valor) {
      const parsedValor = parseFloat(valor.replace(',', '.'));
      if (!isNaN(parsedValor) && parsedValor > 0) {
        data.valor = parsedValor;
      }
    }

    if (vencimento) {
      data.vencimento = vencimento;
    }

    if (beneficiario.trim()) {
      data.beneficiario = beneficiario.trim();
    }

    if (ocrResult.extractedData.codigoBarras) {
      data.codigoBarras = ocrResult.extractedData.codigoBarras;
    }

    if (ocrResult.extractedData.linhaDigitavel) {
      data.linhaDigitavel = ocrResult.extractedData.linhaDigitavel;
    }

    onConfirm(data);
  }, [valor, vencimento, beneficiario, ocrResult, onConfirm]);

  return (
    <Card className="p-4 space-y-4 border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Dados Extraídos</h4>
        <Badge variant={confidenceInfo.variant}>
          Confiança: {confidenceInfo.label}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground">
        Verifique e corrija os dados antes de confirmar. Os campos serão
        preenchidos automaticamente no formulário.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Valor */}
        <div className="space-y-1">
          <Label htmlFor="ocr-valor" className="text-xs">
            Valor (R$)
          </Label>
          <Input
            id="ocr-valor"
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="h-9"
          />
        </div>

        {/* Vencimento */}
        <div className="space-y-1">
          <Label htmlFor="ocr-vencimento" className="text-xs">
            Vencimento
          </Label>
          <Input
            id="ocr-vencimento"
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Beneficiario */}
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="ocr-beneficiario" className="text-xs">
            Beneficiário / Fornecedor
          </Label>
          <Input
            id="ocr-beneficiario"
            type="text"
            value={beneficiario}
            onChange={(e) => setBeneficiario(e.target.value)}
            placeholder="Nome do beneficiário"
            className="h-9"
          />
        </div>

        {/* Codigo de Barras (readonly) */}
        {ocrResult.extractedData.codigoBarras && (
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Código de Barras</Label>
            <Input
              type="text"
              value={ocrResult.extractedData.codigoBarras}
              readOnly
              className="h-9 bg-muted text-muted-foreground"
            />
          </div>
        )}

        {/* Linha Digitavel (readonly) */}
        {ocrResult.extractedData.linhaDigitavel && (
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Linha Digitável</Label>
            <Input
              type="text"
              value={ocrResult.extractedData.linhaDigitavel}
              readOnly
              className="h-9 bg-muted text-muted-foreground"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDiscard}
          className="gap-1"
        >
          <X className="h-3 w-3" />
          Descartar
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleConfirm}
          className="gap-1"
        >
          <Check className="h-3 w-3" />
          Confirmar e Preencher
        </Button>
      </div>
    </Card>
  );
}
