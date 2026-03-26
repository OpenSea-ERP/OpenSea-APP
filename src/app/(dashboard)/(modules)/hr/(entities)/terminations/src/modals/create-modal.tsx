'use client';

import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type {
  CreateTerminationData,
  TerminationType,
  NoticeType,
} from '@/types/hr';
import {
  Check,
  ClipboardList,
  FileX2,
  Loader2,
  UserCheck,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  getTerminationTypeLabel,
  getNoticeTypeLabel,
  TERMINATION_TYPE_LABELS,
  NOTICE_TYPE_LABELS,
} from '../utils';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTerminationData) => void;
  isSubmitting: boolean;
}

const TERMINATION_TYPE_OPTIONS: { value: TerminationType; label: string }[] =
  Object.entries(TERMINATION_TYPE_LABELS).map(([value, label]) => ({
    value: value as TerminationType,
    label,
  }));

const NOTICE_TYPE_OPTIONS: { value: NoticeType; label: string }[] =
  Object.entries(NOTICE_TYPE_LABELS).map(([value, label]) => ({
    value: value as NoticeType,
    label,
  }));

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateModalProps) {
  // Step 1 state
  const [employeeId, setEmployeeId] = useState('');

  // Step 2 state
  const [type, setType] = useState<TerminationType | ''>('');
  const [terminationDate, setTerminationDate] = useState('');
  const [lastWorkDay, setLastWorkDay] = useState('');
  const [noticeType, setNoticeType] = useState<NoticeType | ''>('');
  const [noticeDays, setNoticeDays] = useState('30');
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = useCallback(() => {
    setEmployeeId('');
    setType('');
    setTerminationDate(new Date().toISOString().split('T')[0]);
    setLastWorkDay('');
    setNoticeType('');
    setNoticeDays('30');
    setPaymentDeadline('');
    setNotes('');
  }, []);

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!employeeId || !type || !terminationDate || !lastWorkDay || !noticeType || !paymentDeadline) return;

    const data: CreateTerminationData = {
      employeeId: employeeId.trim(),
      type: type as TerminationType,
      terminationDate,
      lastWorkDay,
      noticeType: noticeType as NoticeType,
      noticeDays: parseInt(noticeDays) || 30,
      paymentDeadline,
      notes: notes.trim() || undefined,
    };

    onSubmit(data);
  };

  // ============================================================================
  // STEPS
  // ============================================================================

  const steps: WizardStep[] = [
    {
      id: 'employee',
      title: 'Funcionário',
      description: 'Selecione o funcionário',
      icon: UserCheck,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Funcionário <span className="text-rose-500">*</span>
            </Label>
            <EmployeeSelector
              value={employeeId}
              onChange={id => setEmployeeId(id)}
              placeholder="Selecionar funcionário para rescisão..."
            />
          </div>
          <Card className="p-4 bg-rose-50/50 dark:bg-rose-500/5 border-rose-200 dark:border-rose-500/20">
            <div className="flex gap-3">
              <FileX2 className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                  Atenção
                </p>
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
                  A rescisão do contrato de trabalho é uma ação irreversível. Certifique-se
                  de selecionar o funcionário correto antes de prosseguir.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ),
      isValid: !!employeeId,
    },
    {
      id: 'details',
      title: 'Dados da Rescisão',
      description: 'Tipo, datas e aviso prévio',
      icon: ClipboardList,
      content: (
        <div className="space-y-4 p-1">
          {/* Tipo + Aviso Prévio */}
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                Tipo de Rescisão <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={v => setType(v as TerminationType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {TERMINATION_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                Tipo de Aviso Prévio <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={noticeType}
                onValueChange={v => setNoticeType(v as NoticeType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {NOTICE_TYPE_OPTIONS.map(opt => (
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
              <Label htmlFor="term-date" className="text-xs">
                Data da Rescisão <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="term-date"
                type="date"
                value={terminationDate}
                onChange={e => setTerminationDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="last-work-day" className="text-xs">
                Último Dia Trabalhado <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="last-work-day"
                type="date"
                value={lastWorkDay}
                onChange={e => setLastWorkDay(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Dias de Aviso + Prazo */}
          <div className="flex items-end gap-3">
            <div className="w-32 space-y-1.5">
              <Label htmlFor="notice-days" className="text-xs">
                Dias de Aviso
              </Label>
              <Input
                id="notice-days"
                type="number"
                min="0"
                value={noticeDays}
                onChange={e => setNoticeDays(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="payment-deadline" className="text-xs">
                Prazo de Pagamento <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="payment-deadline"
                type="date"
                value={paymentDeadline}
                onChange={e => setPaymentDeadline(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="term-notes" className="text-xs">
              Observações
            </Label>
            <Textarea
              id="term-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações adicionais sobre a rescisão..."
              rows={2}
            />
          </div>
        </div>
      ),
      isValid:
        !!type &&
        !!terminationDate &&
        !!lastWorkDay &&
        !!noticeType &&
        !!paymentDeadline,
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Confirme os dados',
      icon: Check,
      content: (
        <div className="space-y-4 p-1">
          <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h4 className="text-sm font-semibold mb-3 uppercase text-muted-foreground">
              Resumo da Rescisão
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo:</span>
                <p className="font-medium">
                  {type ? getTerminationTypeLabel(type) : '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Aviso Prévio:</span>
                <p className="font-medium">
                  {noticeType ? getNoticeTypeLabel(noticeType) : '-'} ({noticeDays} dias)
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Data da Rescisão:</span>
                <p className="font-medium">
                  {terminationDate
                    ? new Date(terminationDate).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Último Dia Trabalhado:
                </span>
                <p className="font-medium">
                  {lastWorkDay
                    ? new Date(lastWorkDay).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Prazo de Pagamento:
                </span>
                <p className="font-medium">
                  {paymentDeadline
                    ? new Date(paymentDeadline).toLocaleDateString('pt-BR')
                    : '-'}
                </p>
              </div>
              {notes && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Observações:</span>
                  <p className="font-medium">{notes}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Após confirmar, as verbas rescisórias poderão ser calculadas na página de detalhes
              da rescisão.
            </p>
          </Card>
        </div>
      ),
      isValid: true,
      footer: (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirmar Rescisão
          </Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
      title="Nova Rescisão"
      description="Registre uma nova rescisão de contrato de trabalho."
      steps={steps}
      onComplete={handleSubmit}
      onCancel={handleClose}
    />
  );
}
