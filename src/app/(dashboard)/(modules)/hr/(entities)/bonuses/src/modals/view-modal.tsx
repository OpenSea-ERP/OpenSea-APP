'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { Bonus } from '@/types/hr';
import { Calendar, PlusCircle, RefreshCcwDot, X } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getPaidLabel,
  getPaidColor,
} from '../utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonus: Bonus | null;
}

export function ViewModal({ isOpen, onClose, bonus }: ViewModalProps) {
  const { getName } = useEmployeeMap(bonus ? [bonus.employeeId] : []);

  if (!bonus) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-lime-500 to-lime-600 p-2 rounded-lg">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Bonificação</span>
                {bonus.name.length > 32
                  ? `${bonus.name.substring(0, 32)}...`
                  : bonus.name}
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onClose()}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Fechar</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getPaidColor(bonus)}>
              {getPaidLabel(bonus)}
            </Badge>
          </div>

          {/* Dados principais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados da Bonificação</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-base mt-1">{bonus.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-base mt-1 font-semibold text-green-600">
                  {formatCurrency(bonus.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="text-base mt-1">{formatDate(bonus.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funcionário</p>
                <p className="text-base mt-1">
                  {getName(bonus.employeeId)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="text-base mt-1">{bonus.reason}</p>
              </div>
            </div>
          </Card>

          {/* Metadados */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metadados</h3>
            <div className="space-y-3">
              {bonus.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-500">Criado em:</span>
                  <span className="font-medium">
                    {formatDate(bonus.createdAt)}
                  </span>
                </div>
              )}
              {bonus.updatedAt &&
                bonus.updatedAt !== bonus.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCcwDot className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-500">Atualizado em:</span>
                    <span className="font-medium">
                      {formatDate(bonus.updatedAt)}
                    </span>
                  </div>
                )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
