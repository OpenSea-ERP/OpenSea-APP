/**
 * PaymentOrderModal
 * Dialog para criar uma ordem de pagamento bancário (PIX, TED ou Boleto)
 * que fica pendente de aprovação pelo gestor financeiro.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Banknote, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { paymentOrdersService } from '@/services/finance';

// ============================================================================
// TYPES
// ============================================================================

interface PaymentOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  bankAccountId: string;
  entryDescription?: string;
  entryAmount?: number;
  onSuccess?: () => void;
}

type PaymentMethod = 'PIX' | 'TED' | 'BOLETO';

const METHOD_OPTIONS: { value: PaymentMethod; label: string; description: string }[] = [
  { value: 'PIX', label: 'PIX', description: 'Transferência instantânea via chave PIX' },
  { value: 'TED', label: 'TED', description: 'Transferência eletrônica disponível (D+1)' },
  { value: 'BOLETO', label: 'Boleto', description: 'Pagamento via código de barras' },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PaymentOrderModal({
  open,
  onOpenChange,
  entryId,
  bankAccountId,
  entryDescription,
  entryAmount,
  onSuccess,
}: PaymentOrderModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setMethod('PIX');
      setNotes('');
      setIsLoading(false);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!method) {
      toast.error('Selecione o método de pagamento.');
      return;
    }

    setIsLoading(true);
    try {
      await paymentOrdersService.create({
        entryId,
        bankAccountId,
        method,
        amount: entryAmount ?? 0,
        recipientData: notes ? { notes } : {},
      });
      setSuccess(true);
      toast.success('Ordem de pagamento criada. Aguardando aprovação.');
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(
        e?.response?.data?.message ??
          'Erro ao criar ordem de pagamento. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-sky-100 dark:bg-sky-500/10">
              <Banknote className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Solicitar Pagamento</DialogTitle>
              <DialogDescription>
                {entryDescription || 'Criar ordem de pagamento para aprovação'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-600/20 dark:border-emerald-500/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Ordem criada com sucesso!
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Aguardando aprovação do gestor financeiro.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            {/* Entry summary */}
            {(entryAmount !== undefined || entryDescription) && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Resumo do pagamento
                </p>
                <div className="space-y-1 text-sm">
                  {entryDescription && (
                    <div>
                      <span className="text-muted-foreground">Descrição: </span>
                      <span className="font-medium">{entryDescription}</span>
                    </div>
                  )}
                  {entryAmount !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Valor: </span>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">
                        {formatCurrency(entryAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Method selector */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <Select
                value={method}
                onValueChange={v => setMethod(v as PaymentMethod)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Selecione o método..." />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          — {opt.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Approval notice */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/8 border border-amber-600/20 p-3">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                A ordem de pagamento será enviada para aprovação antes de ser
                executada. O gestor financeiro receberá uma notificação.
              </p>
            </div>

            {/* Optional notes */}
            <div className="space-y-1.5">
              <Label htmlFor="paymentNotes">
                Observações{' '}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </Label>
              <Textarea
                id="paymentNotes"
                placeholder="Informações adicionais para o aprovador..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <Button
                className="w-full gap-2"
                onClick={handleSubmit}
                disabled={isLoading || !method}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando para aprovação...
                  </>
                ) : (
                  <>
                    <Banknote className="h-4 w-4" />
                    Solicitar Pagamento
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
