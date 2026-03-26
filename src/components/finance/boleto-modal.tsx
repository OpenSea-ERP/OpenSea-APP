'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';
import type { BoletoResult } from '@/types/finance';

interface BoletoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boleto: BoletoResult | null;
  customerName?: string | null;
  entryDescription?: string;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function BoletoModal({
  open,
  onOpenChange,
  boleto,
  customerName,
  entryDescription,
}: BoletoModalProps) {
  if (!boleto) return null;

  const handleCopyDigitableLine = async () => {
    try {
      await navigator.clipboard.writeText(boleto.digitableLine);
      toast.success('Copiado!');
    } catch {
      toast.error('Erro ao copiar para a área de transferência.');
    }
  };

  const handleDownloadPdf = () => {
    if (boleto.pdfUrl) {
      window.open(boleto.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Boleto Gerado</DialogTitle>
              <DialogDescription>
                {entryDescription || 'Cobrança registrada com sucesso'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(boleto.amount)}
            </p>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Vencimento</p>
              <p className="font-medium">{formatDate(boleto.dueDate)}</p>
            </div>
            {customerName && (
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{customerName}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">ID da Cobrança</p>
              <Badge variant="outline" className="font-mono text-xs">
                {boleto.chargeId}
              </Badge>
            </div>
          </div>

          {/* Barcode Number */}
          {boleto.barcodeNumber && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Código de Barras
              </p>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="font-mono text-base tracking-wider break-all">
                  {boleto.barcodeNumber}
                </p>
              </div>
            </div>
          )}

          {/* Digitable Line */}
          {boleto.digitableLine && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Linha Digitável
              </p>
              <div className="bg-sky-50 dark:bg-sky-500/8 rounded-lg p-3">
                <p className="font-mono text-sm tracking-wide break-all text-sky-700 dark:text-sky-300">
                  {boleto.digitableLine}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={handleCopyDigitableLine}
            >
              <Copy className="h-4 w-4" />
              Copiar Linha Digitável
            </Button>

            {boleto.pdfUrl && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleDownloadPdf}
              >
                <Download className="h-4 w-4" />
                Baixar PDF
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              disabled
              title="Em breve"
            >
              <Mail className="h-4 w-4" />
              Enviar por E-mail
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
