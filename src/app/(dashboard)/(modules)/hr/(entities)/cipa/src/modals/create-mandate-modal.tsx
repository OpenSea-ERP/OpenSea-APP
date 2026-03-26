/**
 * OpenSea OS - Create CIPA Mandate Wizard
 * Modal de criacao rapida de mandato CIPA
 */

'use client';

import { Button } from '@/components/ui/button';
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
import type { CreateCipaMandateData, CipaMandateStatus } from '@/types/hr';
import { Loader2, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CreateMandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCipaMandateData) => Promise<void>;
}

const STATUS_OPTIONS: { value: CipaMandateStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Encerrado' },
];

export function CreateMandateModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateMandateModalProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<CipaMandateStatus>('DRAFT');
  const [electionDate, setElectionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setStatus('DRAFT');
      setElectionDate('');
      setNotes('');
      setIsSubmitting(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  const canSubmit = name.trim() && startDate && endDate;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const data: CreateCipaMandateData = {
        name: name.trim(),
        startDate,
        endDate,
        status,
        electionDate: electionDate || undefined,
        notes: notes.trim() || undefined,
      };
      await onSubmit(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('exists')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
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
        title: 'Novo Mandato CIPA',
        description: 'Cadastre um novo mandato da Comissao Interna de Prevencao de Acidentes.',
        icon: (
          <Shield className="h-16 w-16 text-amber-400 opacity-50" />
        ),
        isValid: !!canSubmit,
        content: (
          <div className="space-y-4 py-2">
            {/* Nome + Status */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="mandate-name" className="text-xs">
                  Nome do Mandato <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="mandate-name"
                    value={name}
                    aria-invalid={!!fieldErrors.name}
                    onChange={e => {
                      setName(e.target.value);
                      if (fieldErrors.name)
                        setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Ex: CIPA 2026/2027"
                    className="h-9"
                    autoFocus
                  />
                  <FormErrorIcon message={fieldErrors.name} />
                </div>
              </div>
              <div className="w-40 space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={status}
                  onValueChange={v => setStatus(v as CipaMandateStatus)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Periodo */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="start-date" className="text-xs">
                  Data de Inicio <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="end-date" className="text-xs">
                  Data de Termino <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Data da Eleicao */}
            <div className="w-1/2 space-y-1.5">
              <Label htmlFor="election-date" className="text-xs">
                Data da Eleicao
              </Label>
              <Input
                id="election-date"
                type="date"
                value={electionDate}
                onChange={e => setElectionDate(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Observacoes */}
            <div className="space-y-1.5">
              <Label htmlFor="mandate-notes" className="text-xs">
                Observacoes
              </Label>
              <Textarea
                id="mandate-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Informacoes adicionais sobre o mandato..."
                rows={2}
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
                  Criando...
                </>
              ) : (
                'Criar Mandato'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [name, startDate, endDate, status, electionDate, notes, isSubmitting, canSubmit, onClose, fieldErrors]
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
