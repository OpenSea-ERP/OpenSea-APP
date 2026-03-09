'use client';

/**
 * OpenSea OS - View Absence Modal (HR)
 *
 * Modal de visualização detalhada de uma ausência.
 */

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { Absence } from '@/types/hr';
import { Calendar, Clock, FileText, UserX } from 'lucide-react';
import {
  getTypeLabel,
  getStatusLabel,
  getStatusColor,
  getTypeColor,
} from '../utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  absence: Absence | null;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '\u2014';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ViewModal({ isOpen, onClose, absence }: ViewModalProps) {
  const idsToResolve = absence
    ? [absence.employeeId, ...(absence.approvedBy ? [absence.approvedBy] : [])]
    : [];
  const { getName } = useEmployeeMap(idsToResolve);

  if (!absence) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-rose-500 to-rose-600 p-2 rounded-lg">
                <UserX className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Ausência</span>
                {getTypeLabel(absence.type)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className={getTypeColor(absence.type)}>
              {getTypeLabel(absence.type)}
            </Badge>
            <Badge variant="outline" className={getStatusColor(absence.status)}>
              {getStatusLabel(absence.status)}
            </Badge>
            {absence.isPaid && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                Remunerada
              </Badge>
            )}
            {!absence.isPaid && (
              <Badge
                variant="outline"
                className="bg-slate-50 text-slate-600 border-slate-200"
              >
                Não Remunerada
              </Badge>
            )}
          </div>

          {/* Período */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data Início</p>
                <p className="text-base mt-1">
                  {formatDate(absence.startDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Fim</p>
                <p className="text-base mt-1">{formatDate(absence.endDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Dias</p>
                <p className="text-base mt-1 font-semibold">
                  {absence.totalDays} {absence.totalDays === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </div>
          </Card>

          {/* Detalhes */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Detalhes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Funcionário</p>
                <p className="text-sm mt-1">{getName(absence.employeeId)}</p>
              </div>
              {absence.cid && (
                <div>
                  <p className="text-sm text-muted-foreground">CID</p>
                  <p className="text-sm mt-1 font-mono">{absence.cid}</p>
                </div>
              )}
              {absence.reason && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Motivo</p>
                  <p className="text-sm mt-1">{absence.reason}</p>
                </div>
              )}
              {absence.documentUrl && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <a
                    href={absence.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm mt-1 text-blue-600 hover:underline break-all"
                  >
                    {absence.documentUrl}
                  </a>
                </div>
              )}
              {absence.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm mt-1">{absence.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Aprovação / Rejeição */}
          {(absence.approvedBy || absence.rejectionReason) && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Aprovação
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {absence.approvedBy && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Aprovado por
                    </p>
                    <p className="text-sm mt-1">
                      {getName(absence.approvedBy)}
                    </p>
                  </div>
                )}
                {absence.approvedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Aprovado em</p>
                    <p className="text-sm mt-1">
                      {formatDateTime(absence.approvedAt)}
                    </p>
                  </div>
                )}
                {absence.rejectionReason && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">
                      Motivo da Rejeição
                    </p>
                    <p className="text-sm mt-1 text-red-600">
                      {absence.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Metadados */}
          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>Criada em: {formatDateTime(absence.createdAt)}</span>
            <span>Atualizada em: {formatDateTime(absence.updatedAt)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ViewModal;
