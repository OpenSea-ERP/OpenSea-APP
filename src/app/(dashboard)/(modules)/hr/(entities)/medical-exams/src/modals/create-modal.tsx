'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CreateMedicalExamData, MedicalExamType, MedicalExamResult } from '@/types/hr';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Check, Loader2, Stethoscope, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMedicalExamData) => void;
  isSubmitting: boolean;
}

const EXAM_TYPE_OPTIONS: { value: MedicalExamType; label: string }[] = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periódico' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudança de Função' },
  { value: 'RETORNO', label: 'Retorno ao Trabalho' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
];

const EXAM_RESULT_OPTIONS: { value: MedicalExamResult; label: string }[] = [
  { value: 'APTO', label: 'Apto' },
  { value: 'INAPTO', label: 'Inapto' },
  { value: 'APTO_COM_RESTRICOES', label: 'Apto com Restrições' },
];

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<MedicalExamType | ''>('');
  const [examDate, setExamDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorCrm, setDoctorCrm] = useState('');
  const [result, setResult] = useState<MedicalExamResult | ''>('');
  const [observations, setObservations] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmployeeId('');
      setType('');
      setExamDate(new Date().toISOString().split('T')[0]);
      setExpirationDate('');
      setDoctorName('');
      setDoctorCrm('');
      setResult('');
      setObservations('');
      setDocumentUrl('');
    }
  }, [isOpen]);

  const canSubmit =
    employeeId.trim() &&
    type &&
    examDate &&
    doctorName.trim() &&
    doctorCrm.trim() &&
    result;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const data: CreateMedicalExamData = {
      employeeId: employeeId.trim(),
      type: type as MedicalExamType,
      examDate,
      expirationDate: expirationDate || undefined,
      doctorName: doctorName.trim(),
      doctorCrm: doctorCrm.trim(),
      result: result as MedicalExamResult,
      observations: observations.trim() || undefined,
      documentUrl: documentUrl.trim() || undefined,
    };

    onSubmit(data);
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[800px] max-w-[800px] h-[560px] p-0 gap-0 overflow-hidden flex flex-row"
      >
        <VisuallyHidden>
          <DialogTitle>Novo Exame Médico</DialogTitle>
        </VisuallyHidden>

        {/* Left icon column */}
        <div className="w-[200px] shrink-0 bg-slate-50 dark:bg-white/5 flex items-center justify-center border-r border-border/50">
          <Stethoscope
            className="h-16 w-16 text-teal-400"
            strokeWidth={1.2}
          />
        </div>

        {/* Right content column */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <h2 className="text-lg font-semibold leading-none">
                Novo Exame Médico
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Registre um novo exame médico ocupacional.
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
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col min-h-0"
          >
            <div
              className="flex-1 overflow-y-auto px-6 py-2 space-y-4"
              onWheel={e => e.stopPropagation()}
            >
              {/* Funcionário */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Funcionário <span className="text-rose-500">*</span>
                </Label>
                <EmployeeSelector
                  value={employeeId}
                  onChange={id => setEmployeeId(id)}
                  placeholder="Selecionar funcionário..."
                />
              </div>

              {/* Tipo + Resultado */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">
                    Tipo de Exame <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={type}
                    onValueChange={v => setType(v as MedicalExamType)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">
                    Resultado <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={result}
                    onValueChange={v => setResult(v as MedicalExamResult)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecionar resultado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_RESULT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Datas */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="exam-date" className="text-xs">
                    Data do Exame <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="exam-date"
                    type="date"
                    value={examDate}
                    onChange={e => setExamDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="exam-expiration" className="text-xs">
                    Data de Validade
                  </Label>
                  <Input
                    id="exam-expiration"
                    type="date"
                    value={expirationDate}
                    onChange={e => setExpirationDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Médico */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="doctor-name" className="text-xs">
                    Nome do Médico <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    placeholder="Dr. Nome Completo"
                    className="h-9"
                  />
                </div>
                <div className="w-40 space-y-1.5">
                  <Label htmlFor="doctor-crm" className="text-xs">
                    CRM <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="doctor-crm"
                    value={doctorCrm}
                    onChange={e => setDoctorCrm(e.target.value)}
                    placeholder="CRM/UF 00000"
                    className="h-9"
                  />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="exam-observations" className="text-xs">
                  Observações
                </Label>
                <Textarea
                  id="exam-observations"
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  placeholder="Observações adicionais sobre o exame..."
                  rows={2}
                />
              </div>

              {/* URL do Documento */}
              <div className="space-y-1.5">
                <Label htmlFor="exam-doc-url" className="text-xs">
                  URL do Documento
                </Label>
                <Input
                  id="exam-doc-url"
                  value={documentUrl}
                  onChange={e => setDocumentUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-9"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-border/50">
              <Button type="submit" disabled={isSubmitting || !canSubmit}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Registrar Exame
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
