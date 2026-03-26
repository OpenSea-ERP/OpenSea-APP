/**
 * OpenSea OS - Create Medical Exam Wizard
 * Modal de criacao rapida de exame medico
 */

'use client';

import { Button } from '@/components/ui/button';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { translateError } from '@/lib/error-messages';
import type { CreateMedicalExamData, MedicalExamType, MedicalExamResult } from '@/types/hr';
import { Loader2, Stethoscope } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMedicalExamData) => Promise<void>;
}

const EXAM_TYPE_OPTIONS: { value: MedicalExamType; label: string }[] = [
  { value: 'ADMISSIONAL', label: 'Admissional' },
  { value: 'PERIODICO', label: 'Periodico' },
  { value: 'MUDANCA_FUNCAO', label: 'Mudanca de Funcao' },
  { value: 'RETORNO', label: 'Retorno ao Trabalho' },
  { value: 'DEMISSIONAL', label: 'Demissional' },
];

const EXAM_RESULT_OPTIONS: { value: MedicalExamResult; label: string }[] = [
  { value: 'APTO', label: 'Apto' },
  { value: 'INAPTO', label: 'Inapto' },
  { value: 'APTO_COM_RESTRICOES', label: 'Apto com Restricoes' },
];

export function CreateModal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [type, setType] = useState<MedicalExamType | ''>('');
  const [examDate, setExamDate] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorCrm, setDoctorCrm] = useState('');
  const [result, setResult] = useState<MedicalExamResult | ''>('');
  const [observations, setObservations] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setEmployeeId('');
      setType('');
      setExamDate(new Date().toISOString().split('T')[0]);
      setExpirationDate('');
      setDoctorName('');
      setDoctorCrm('');
      setResult('');
      setObservations('');
      setDocumentUrl('');
      setIsSubmitting(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  const canSubmit =
    employeeId.trim() &&
    type &&
    examDate &&
    doctorName.trim() &&
    doctorCrm.trim() &&
    result;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
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
      await onSubmit(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('exists')) {
        setFieldErrors(prev => ({ ...prev, employeeId: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: WizardStep[] = useMemo(
    () => [
      {
        title: 'Novo Exame Medico',
        description: 'Registre um novo exame medico ocupacional.',
        icon: (
          <Stethoscope className="h-16 w-16 text-teal-400 opacity-50" />
        ),
        isValid: !!canSubmit,
        content: (
          <div className="space-y-4 py-2">
            {/* Funcionario */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Funcionario <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <EmployeeSelector
                  value={employeeId}
                  onChange={id => {
                    setEmployeeId(id);
                    if (fieldErrors.employeeId)
                      setFieldErrors(prev => ({ ...prev, employeeId: '' }));
                  }}
                  placeholder="Selecionar funcionario..."
                />
                <FormErrorIcon message={fieldErrors.employeeId} />
              </div>
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

            {/* Medico */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="doctor-name" className="text-xs">
                  Nome do Medico <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    aria-invalid={!!fieldErrors.doctorName}
                    onChange={e => {
                      setDoctorName(e.target.value);
                      if (fieldErrors.doctorName)
                        setFieldErrors(prev => ({ ...prev, doctorName: '' }));
                    }}
                    placeholder="Dr. Nome Completo"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.doctorName} />
                </div>
              </div>
              <div className="w-40 space-y-1.5">
                <Label htmlFor="doctor-crm" className="text-xs">
                  CRM <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="doctor-crm"
                    value={doctorCrm}
                    aria-invalid={!!fieldErrors.doctorCrm}
                    onChange={e => {
                      setDoctorCrm(e.target.value);
                      if (fieldErrors.doctorCrm)
                        setFieldErrors(prev => ({ ...prev, doctorCrm: '' }));
                    }}
                    placeholder="CRM/UF 00000"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.doctorCrm} />
                </div>
              </div>
            </div>

            {/* Observacoes */}
            <div className="space-y-1.5">
              <Label htmlFor="exam-observations" className="text-xs">
                Observacoes
              </Label>
              <Textarea
                id="exam-observations"
                value={observations}
                onChange={e => setObservations(e.target.value)}
                placeholder="Observacoes adicionais sobre o exame..."
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
        ),
        footer: (
          <div className="flex items-center justify-end gap-2 w-full">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                'Registrar Exame'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [employeeId, type, examDate, expirationDate, doctorName, doctorCrm, result, observations, documentUrl, isSubmitting, canSubmit, onClose, fieldErrors]
  );

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => !open && onClose()}
      steps={steps}
      currentStep={1}
      onStepChange={() => {}}
      onClose={onClose}
    />
  );
}
