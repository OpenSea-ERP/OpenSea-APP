'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RecurringStatusBadge } from './recurring-status-badge';
import type { RecurringConfig } from '@/types/finance';
import { FREQUENCY_LABELS, FINANCE_ENTRY_TYPE_LABELS } from '@/types/finance';
import { MoreHorizontal, Pause, Play, X, Pencil } from 'lucide-react';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatFrequency(config: RecurringConfig): string {
  const unit = FREQUENCY_LABELS[config.frequencyUnit] ?? config.frequencyUnit;
  if (config.frequencyInterval > 1) {
    return `A cada ${config.frequencyInterval}x ${unit}`;
  }
  return unit;
}

interface RecurringListProps {
  configs: RecurringConfig[];
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (config: RecurringConfig) => void;
  isPending?: boolean;
}

export function RecurringList({
  configs,
  onPause,
  onResume,
  onCancel,
  onEdit,
  isPending,
}: RecurringListProps) {
  if (configs.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground mb-2">
          Nenhuma recorrência encontrada
        </p>
        <p className="text-sm text-muted-foreground">
          Crie uma nova recorrência para automatizar seus lançamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Tabela de recorrências financeiras">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Frequência</TableHead>
            <TableHead>Próximo Vencimento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((config) => (
            <TableRow key={config.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{config.description}</span>
                  {config.isVariable && (
                    <span className="text-xs text-muted-foreground">
                      Valor variável
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={config.type === 'PAYABLE' ? 'destructive' : 'success'}
                >
                  {FINANCE_ENTRY_TYPE_LABELS[config.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCurrency(config.expectedAmount)}
              </TableCell>
              <TableCell className="text-sm">
                {formatFrequency(config)}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(config.nextDueDate)}
              </TableCell>
              <TableCell>
                <RecurringStatusBadge status={config.status} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={isPending}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {config.status !== 'CANCELLED' && (
                      <DropdownMenuItem onClick={() => onEdit(config)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {config.status === 'ACTIVE' && (
                      <DropdownMenuItem onClick={() => onPause(config.id)}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </DropdownMenuItem>
                    )}
                    {config.status === 'PAUSED' && (
                      <DropdownMenuItem onClick={() => onResume(config.id)}>
                        <Play className="h-4 w-4 mr-2" />
                        Retomar
                      </DropdownMenuItem>
                    )}
                    {config.status !== 'CANCELLED' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onCancel(config.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
