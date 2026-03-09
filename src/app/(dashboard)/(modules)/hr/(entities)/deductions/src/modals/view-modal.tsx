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
import type { Deduction } from '@/types/hr';
import { Calendar, MinusCircle, RefreshCcwDot, X } from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getAppliedLabel,
  getAppliedColor,
  formatInstallments,
} from '../utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deduction: Deduction | null;
}

export function ViewModal({ isOpen, onClose, deduction }: ViewModalProps) {
  const { getName } = useEmployeeMap(deduction ? [deduction.employeeId] : []);

  if (!deduction) return null;

  const installmentInfo = formatInstallments(deduction);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-red-500 to-red-600 p-2 rounded-lg">
                <MinusCircle className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Dedução</span>
                {deduction.name.length > 32
                  ? `${deduction.name.substring(0, 32)}...`
                  : deduction.name}
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
            <Badge variant={getAppliedColor(deduction)}>
              {getAppliedLabel(deduction)}
            </Badge>
            {deduction.isRecurring && (
              <Badge variant="outline">Recorrente</Badge>
            )}
            {installmentInfo && (
              <Badge variant="secondary">{installmentInfo}</Badge>
            )}
          </div>

          {/* Dados principais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados da Dedução</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-base mt-1">{deduction.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-base mt-1 font-semibold text-red-600">
                  {formatCurrency(deduction.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="text-base mt-1">{formatDate(deduction.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funcionário</p>
                <p className="text-base mt-1">
                  {getName(deduction.employeeId)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="text-base mt-1">{deduction.reason}</p>
              </div>
            </div>
          </Card>

          {/* Recorrência */}
          {deduction.isRecurring && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recorrência</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total de parcelas
                  </p>
                  <p className="text-base mt-1">
                    {deduction.installments ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parcela atual</p>
                  <p className="text-base mt-1">
                    {deduction.currentInstallment ?? '-'}
                  </p>
                </div>
                {deduction.installments && deduction.currentInstallment && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Progresso
                    </p>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-red-500 h-2.5 rounded-full transition-all"
                        style={{
                          width: `${(deduction.currentInstallment / deduction.installments) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {installmentInfo}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Aplicação */}
          {deduction.isApplied && deduction.appliedAt && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Aplicação</h3>
              <div>
                <p className="text-sm text-muted-foreground">Aplicada em</p>
                <p className="text-base mt-1">
                  {formatDate(deduction.appliedAt)}
                </p>
              </div>
            </Card>
          )}

          {/* Metadados */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metadados</h3>
            <div className="space-y-3">
              {deduction.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-500">Criado em:</span>
                  <span className="font-medium">
                    {formatDate(deduction.createdAt)}
                  </span>
                </div>
              )}
              {deduction.updatedAt &&
                deduction.updatedAt !== deduction.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCcwDot className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-500">Atualizado em:</span>
                    <span className="font-medium">
                      {formatDate(deduction.updatedAt)}
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
