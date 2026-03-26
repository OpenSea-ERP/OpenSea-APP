'use client';

/**
 * OpenSea OS - Sell Vacation Days Modal (HR)
 *
 * Modal para venda de dias de férias (abono pecuniário).
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translateError } from '@/lib/error-messages';
import { DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import type { SellVacationDaysData } from '@/types/hr';

interface SellDaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacationId: string | null;
  onSell: (id: string, data: SellVacationDaysData) => void;
  isSubmitting: boolean;
}

export function SellDaysModal({
  isOpen,
  onClose,
  vacationId,
  onSell,
  isSubmitting,
}: SellDaysModalProps) {
  const [daysToSell, setDaysToSell] = useState(10);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function resetForm() {
    setDaysToSell(10);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!vacationId || daysToSell <= 0) return;

    try {
      await onSell(vacationId, { daysToSell });
      resetForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('days') || msg.includes('dias') || msg.includes('exceed')) {
        setFieldErrors(prev => ({ ...prev, daysToSell: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  }

  const isValid = daysToSell > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) {
          resetForm();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-amber-500 to-amber-600 p-2 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
            Vender Dias de Férias
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Informe a quantidade de dias a serem vendidos (abono pecuniário). O
          máximo permitido por lei é 1/3 do período, ou seja, 10 dias.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sell-days">Dias para Vender</Label>
            <div className="relative">
              <Input
                id="sell-days"
                type="number"
                min={1}
                max={10}
                value={daysToSell}
                onChange={e => {
                  setDaysToSell(Number(e.target.value));
                  if (fieldErrors.daysToSell) setFieldErrors(prev => ({ ...prev, daysToSell: '' }));
                }}
                required
                aria-invalid={!!fieldErrors.daysToSell}
              />
              <FormErrorIcon message={fieldErrors.daysToSell} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Vendendo...' : 'Vender Dias'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default SellDaysModal;
