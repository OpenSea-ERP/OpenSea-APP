'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { translateError } from '@/lib/error-messages';
import type { CreatePayrollData } from '@/types/hr';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Check, Loader2, Receipt, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePayrollData) => void;
  isSubmitting: boolean;
}

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateModalProps) {
  const [referenceMonth, setReferenceMonth] = useState('');
  const [referenceYear, setReferenceYear] = useState(
    String(new Date().getFullYear())
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setReferenceMonth('');
      setReferenceYear(String(new Date().getFullYear()));
      setFieldErrors({});
    }
  }, [isOpen]);

  const parsedYear = parseInt(referenceYear, 10);
  const isYearValid =
    !isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;
  const canSubmit = referenceMonth && isYearValid;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    const data: CreatePayrollData = {
      referenceMonth: parseInt(referenceMonth, 10),
      referenceYear: parsedYear,
    };

    try {
      await onSubmit(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('exists') || msg.includes('já existe')) {
        setFieldErrors(prev => ({ ...prev, referenceMonth: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[800px] max-w-[800px] h-[490px] p-0 gap-0 overflow-hidden flex flex-row"
      >
        <VisuallyHidden>
          <DialogTitle>Nova Folha de Pagamento</DialogTitle>
        </VisuallyHidden>

        {/* Left icon column */}
        <div className="w-[200px] shrink-0 bg-slate-50 dark:bg-white/5 flex items-center justify-center border-r border-border/50">
          <Receipt className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
        </div>

        {/* Right content column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h2 className="text-lg font-semibold leading-none">
                Nova Folha de Pagamento
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Crie uma folha de pagamento para o período desejado.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Mês de referência */}
              <div className="space-y-2">
                <Label htmlFor="payroll-month">Mês de Referência *</Label>
                <Select
                  value={referenceMonth}
                  onValueChange={setReferenceMonth}
                >
                  <SelectTrigger id="payroll-month">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ano de referência */}
              <div className="space-y-2">
                <Label htmlFor="payroll-year">Ano de Referência *</Label>
                <div className="relative">
                  <Input
                    id="payroll-year"
                    type="number"
                    min={2000}
                    max={2100}
                    value={referenceYear}
                    onChange={e => {
                      setReferenceYear(e.target.value);
                      if (fieldErrors.referenceYear) setFieldErrors(prev => ({ ...prev, referenceYear: '' }));
                    }}
                    placeholder="Ex.: 2026"
                    required
                    aria-invalid={!!fieldErrors.referenceYear}
                  />
                  <FormErrorIcon message={fieldErrors.referenceYear} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Criar Folha
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
