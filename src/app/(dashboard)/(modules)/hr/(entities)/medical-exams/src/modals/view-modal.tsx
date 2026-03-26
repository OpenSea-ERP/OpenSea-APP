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
import type { MedicalExam } from '@/types/hr';
import {
  Calendar,
  ExternalLink,
  RefreshCcwDot,
  Stethoscope,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  formatDate,
  getExamTypeLabel,
  getExamResultLabel,
  getExamResultVariant,
} from '../utils';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: MedicalExam | null;
}

export function ViewModal({ isOpen, onClose, exam }: ViewModalProps) {
  const router = useRouter();
  const { getName } = useEmployeeMap(exam ? [exam.employeeId] : []);

  if (!exam) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-teal-500 to-teal-600 p-2 rounded-lg">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Exame Médico</span>
                {getExamTypeLabel(exam.type)}
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push(`/hr/medical-exams/${exam.id}`);
                  }}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver Detalhes</p>
              </TooltipContent>
            </Tooltip>

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
            <Badge variant="outline">{getExamTypeLabel(exam.type)}</Badge>
            <Badge variant={getExamResultVariant(exam.result)}>
              {getExamResultLabel(exam.result)}
            </Badge>
          </div>

          {/* Dados principais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados do Exame</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Funcionário</p>
                <p className="text-base mt-1">{getName(exam.employeeId)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="text-base mt-1">{getExamTypeLabel(exam.type)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data do Exame</p>
                <p className="text-base mt-1">{formatDate(exam.examDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validade</p>
                <p className="text-base mt-1">
                  {exam.expirationDate
                    ? formatDate(exam.expirationDate)
                    : 'Não informada'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Médico</p>
                <p className="text-base mt-1">{exam.doctorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CRM</p>
                <p className="text-base mt-1">{exam.doctorCrm}</p>
              </div>
              {exam.observations && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-base mt-1">{exam.observations}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Metadados */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metadados</h3>
            <div className="space-y-3">
              {exam.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-500">Criado em:</span>
                  <span className="font-medium">
                    {formatDate(exam.createdAt)}
                  </span>
                </div>
              )}
              {exam.updatedAt && exam.updatedAt !== exam.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCcwDot className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-500">Atualizado em:</span>
                  <span className="font-medium">
                    {formatDate(exam.updatedAt)}
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
