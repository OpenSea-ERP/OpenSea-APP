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
import type { Overtime } from '@/types/hr';
import { Calendar, Coffee, RefreshCcwDot, X } from 'lucide-react';
import {
  formatDate,
  formatHours,
  getApprovalLabel,
  getApprovalColor,
} from '../utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  overtime: Overtime | null;
}

export function ViewModal({ isOpen, onClose, overtime }: ViewModalProps) {
  const { getName } = useEmployeeMap(
    overtime ? [overtime.employeeId, ...(overtime.approvedBy ? [overtime.approvedBy] : [])] : []
  );

  if (!overtime) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                <Coffee className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Hora Extra</span>
                {overtime.reason.length > 32
                  ? `${overtime.reason.substring(0, 32)}...`
                  : overtime.reason}
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
          {/* Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={getApprovalColor(overtime)}>
              {getApprovalLabel(overtime)}
            </Badge>
          </div>

          {/* Dados principais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados da Hora Extra</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="text-base mt-1">{formatDate(overtime.date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Horas</p>
                <p className="text-base mt-1 font-semibold text-orange-600">
                  {formatHours(overtime.hours)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Funcionário</p>
                <p className="text-base mt-1">
                  {getName(overtime.employeeId)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Motivo</p>
                <p className="text-base mt-1">{overtime.reason}</p>
              </div>
            </div>
          </Card>

          {/* Aprovacao */}
          {overtime.approved && overtime.approvedBy && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Aprovação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado por</p>
                  <p className="text-base mt-1">
                    {getName(overtime.approvedBy!)}
                  </p>
                </div>
                {overtime.approvedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovado em</p>
                    <p className="text-base mt-1">
                      {formatDate(overtime.approvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Metadados */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metadados</h3>
            <div className="space-y-3">
              {overtime.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-500">Criado em:</span>
                  <span className="font-medium">
                    {formatDate(overtime.createdAt)}
                  </span>
                </div>
              )}
              {overtime.updatedAt &&
                overtime.updatedAt !== overtime.createdAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <RefreshCcwDot className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-500">Atualizado em:</span>
                    <span className="font-medium">
                      {formatDate(overtime.updatedAt)}
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
