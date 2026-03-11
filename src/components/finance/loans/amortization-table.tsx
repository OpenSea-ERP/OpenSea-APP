/**
 * Amortization Table Component
 * Displays SAC or Price amortization schedule with visual status indicators.
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AmortizationRow } from '@/lib/finance/amortization';
import type { LoanInstallment } from '@/types/finance';
import { FileText } from 'lucide-react';

interface AmortizationTableProps {
  rows: AmortizationRow[];
  installments?: LoanInstallment[];
  title?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getRowClassName(installment?: LoanInstallment): string {
  if (!installment) return '';
  if (installment.status === 'PAID') return 'bg-emerald-50 dark:bg-emerald-950/20';
  if (installment.status === 'OVERDUE') return 'bg-red-50 dark:bg-red-950/20';

  // Check if it's the next due installment
  const now = new Date();
  const dueDate = new Date(installment.dueDate);
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays >= 0 && diffDays <= 30 && installment.status === 'PENDING') {
    return 'bg-amber-50 dark:bg-amber-950/20';
  }

  return '';
}

function getInstallmentStatusLabel(installment?: LoanInstallment): string | null {
  if (!installment) return null;
  switch (installment.status) {
    case 'PAID': return 'Pago';
    case 'OVERDUE': return 'Vencido';
    case 'PENDING': return 'Pendente';
    default: return installment.status;
  }
}

function getInstallmentStatusVariant(status: string): 'success' | 'destructive' | 'secondary' {
  switch (status) {
    case 'PAID': return 'success';
    case 'OVERDUE': return 'destructive';
    default: return 'secondary';
  }
}

export function AmortizationTable({
  rows,
  installments,
  title = 'Tabela de Amortização',
}: AmortizationTableProps) {
  // Map installments by number for quick lookup
  const installmentMap = new Map<number, LoanInstallment>();
  if (installments) {
    for (const inst of installments) {
      installmentMap.set(inst.installmentNumber, inst);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-6 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
          <Badge variant="secondary">{rows.length} parcelas</Badge>
        </h2>
      </div>
      <div className="overflow-x-auto">
        <Table aria-label="Tabela de amortização do empréstimo">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Parcela</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Amortização</TableHead>
              <TableHead className="text-right">Juros</TableHead>
              <TableHead className="text-right">Saldo Devedor</TableHead>
              {installments && (
                <TableHead className="text-center">Status</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const inst = installmentMap.get(row.installment);
              const statusLabel = getInstallmentStatusLabel(inst);

              return (
                <TableRow
                  key={row.installment}
                  className={getRowClassName(inst)}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {row.installment}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.payment)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.principal)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.interest)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatCurrency(row.balance)}
                  </TableCell>
                  {installments && (
                    <TableCell className="text-center">
                      {statusLabel && inst && (
                        <Badge variant={getInstallmentStatusVariant(inst.status)}>
                          {statusLabel}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary footer */}
      <div className="p-4 sm:p-6 border-t bg-muted/30">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Pago</p>
            <p className="font-semibold font-mono">
              {formatCurrency(rows.reduce((sum, r) => sum + r.payment, 0))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Amortizado</p>
            <p className="font-semibold font-mono">
              {formatCurrency(rows.reduce((sum, r) => sum + r.principal, 0))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Juros</p>
            <p className="font-semibold font-mono">
              {formatCurrency(rows.reduce((sum, r) => sum + r.interest, 0))}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Custo Efetivo</p>
            <p className="font-semibold font-mono">
              {(
                ((rows.reduce((sum, r) => sum + r.interest, 0)) /
                  (rows[0]?.balance + (rows[0]?.principal ?? 0) || 1)) *
                100
              ).toFixed(2)}
              %
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
