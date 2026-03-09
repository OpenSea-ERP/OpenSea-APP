'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { TimeBank } from '@/types/hr';
import { formatBalance, getBalanceColor, formatYear } from '../utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeBank: TimeBank | null;
}

export function ViewModal({ isOpen, onClose, timeBank }: ViewModalProps) {
  const { getName } = useEmployeeMap(timeBank ? [timeBank.employeeId] : []);

  if (!timeBank) return null;

  const balanceColor = getBalanceColor(timeBank.balance);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes do Banco de Horas</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="text-sm font-medium">
                {getName(timeBank.employeeId)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ano</p>
              <p className="text-sm font-medium">{formatYear(timeBank.year)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-2xl font-bold font-mono ${balanceColor}`}>
              {formatBalance(timeBank.balance)}
            </p>
          </div>

          <div className="flex gap-2">
            {timeBank.hasPositiveBalance && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                Possui saldo positivo
              </Badge>
            )}
            {timeBank.hasNegativeBalance && (
              <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                Possui saldo negativo
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="text-sm">
                {new Date(timeBank.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Atualizado em</p>
              <p className="text-sm">
                {new Date(timeBank.updatedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
