'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import { usePayViaPix } from '@/hooks/finance/use-pix-operations';
import type { FinanceEntry } from '@/types/finance';

interface PixPayConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FinanceEntry;
  onSuccess?: () => void;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

const PIX_KEY_TYPE_LABELS: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  EVP: 'Chave Aleatória',
};

export function PixPayConfirmModal({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: PixPayConfirmModalProps) {
  const payViaPix = usePayViaPix();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await payViaPix.mutateAsync({
        entryId: entry.id,
      });
      toast.success('Pagamento via PIX registrado com sucesso!');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao registrar pagamento PIX.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [entry.id, payViaPix, onOpenChange, onSuccess]);

  const paymentAmount = entry.remainingBalance > 0
    ? entry.remainingBalance
    : entry.totalDue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/10">
              <Send className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Pagar via PIX</DialogTitle>
              <DialogDescription>
                Confirme os dados do pagamento PIX
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Amount */}
          <div className="text-center py-3 bg-emerald-50 dark:bg-emerald-500/8 rounded-lg">
            <p className="text-sm text-muted-foreground">Valor do Pagamento</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(paymentAmount)}
            </p>
          </div>

          {/* Entry Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Descrição</span>
              <span className="font-medium text-right max-w-[60%] truncate">
                {entry.description}
              </span>
            </div>

            {entry.supplierName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fornecedor</span>
                <span className="font-medium">{entry.supplierName}</span>
              </div>
            )}

            {entry.pixKey && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chave PIX</span>
                <div className="flex items-center gap-2">
                  {entry.pixKeyType && (
                    <Badge variant="outline" className="text-xs">
                      {PIX_KEY_TYPE_LABELS[entry.pixKeyType] || entry.pixKeyType}
                    </Badge>
                  )}
                  <span className="font-mono text-xs">{entry.pixKey}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Vencimento</span>
              <span className="font-medium">{formatDate(entry.dueDate)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Método</span>
              <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 border-0">
                PIX
              </Badge>
            </div>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground text-center">
            O pagamento será registrado automaticamente como efetuado. A
            transferência PIX real deve ser realizada pelo aplicativo bancário.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
