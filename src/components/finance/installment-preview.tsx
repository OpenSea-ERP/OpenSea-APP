'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RecurrenceUnit } from '@/types/finance';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMemo } from 'react';

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function calculateDueDate(
  baseDate: Date,
  installmentIndex: number,
  interval: number,
  unit: RecurrenceUnit
): Date {
  const totalIntervals = installmentIndex * interval;

  switch (unit) {
    case 'DAILY':
      return addDays(baseDate, totalIntervals);
    case 'WEEKLY':
      return addWeeks(baseDate, totalIntervals);
    case 'BIWEEKLY':
      return addWeeks(baseDate, totalIntervals * 2);
    case 'MONTHLY':
      return addMonths(baseDate, totalIntervals);
    case 'QUARTERLY':
      return addMonths(baseDate, totalIntervals * 3);
    case 'SEMIANNUAL':
      return addMonths(baseDate, totalIntervals * 6);
    case 'ANNUAL':
      return addMonths(baseDate, totalIntervals * 12);
    default:
      return addMonths(baseDate, totalIntervals);
  }
}

// ============================================================================
// PROPS
// ============================================================================

interface InstallmentPreviewProps {
  dueDate: string;
  amount: number;
  totalInstallments: number;
  interval: number;
  unit: RecurrenceUnit;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function InstallmentPreview({
  dueDate,
  amount,
  totalInstallments,
  interval,
  unit,
}: InstallmentPreviewProps) {
  const installments = useMemo(() => {
    if (!dueDate || totalInstallments < 2 || amount <= 0) return [];

    const baseDate = parseISO(dueDate);
    const baseAmount = Math.floor((amount / totalInstallments) * 100) / 100;
    const result: { index: number; date: Date; value: number }[] = [];

    for (let i = 0; i < totalInstallments; i++) {
      const date = calculateDueDate(baseDate, i, interval, unit);
      // Last installment gets remainder
      const value =
        i === totalInstallments - 1
          ? amount - baseAmount * (totalInstallments - 1)
          : baseAmount;

      result.push({ index: i + 1, date, value });
    }

    return result;
  }, [dueDate, amount, totalInstallments, interval, unit]);

  if (installments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Preencha a data de vencimento e o valor para visualizar as parcelas.
      </p>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto border rounded-lg">
      <Table aria-label="Tabela de pré-visualização de parcelas">
        <TableHeader>
          <TableRow>
            <TableHead>Parcela</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((inst) => (
            <TableRow key={inst.index}>
              <TableCell className="font-medium">
                {inst.index}/{totalInstallments}
              </TableCell>
              <TableCell>
                {format(inst.date, 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(inst.value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
