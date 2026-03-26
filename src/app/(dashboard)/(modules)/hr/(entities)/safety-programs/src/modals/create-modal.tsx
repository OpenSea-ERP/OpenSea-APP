/**
 * OpenSea OS - Create Safety Program Wizard
 * Modal de criacao rapida de programa de seguranca
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
import type {
  CreateSafetyProgramData,
  SafetyProgramType,
  SafetyProgramStatus,
} from '@/types/hr';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSafetyProgramData) => Promise<void>;
}

const TYPE_OPTIONS: { value: SafetyProgramType; label: string }[] = [
  { value: 'PCMSO', label: 'PCMSO — Prog. Controle Medico de Saude Ocupacional' },
  { value: 'PGR', label: 'PGR — Programa de Gerenciamento de Riscos' },
  { value: 'LTCAT', label: 'LTCAT — Laudo Tecnico das Condicoes Ambientais' },
  { value: 'PPRA', label: 'PPRA — Prog. Prevencao de Riscos Ambientais' },
];

const STATUS_OPTIONS: { value: SafetyProgramStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Expirado' },
];

export function CreateModal({ isOpen, onClose, onSubmit }: CreateModalProps) {
  const [type, setType] = useState<SafetyProgramType | ''>('');
  const [name, setName] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [responsibleName, setResponsibleName] = useState('');
  const [responsibleRegistration, setResponsibleRegistration] = useState('');
  const [status, setStatus] = useState<SafetyProgramStatus>('DRAFT');
  const [documentUrl, setDocumentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setType('');
      setName('');
      setValidFrom(new Date().toISOString().split('T')[0]);
      setValidUntil('');
      setResponsibleName('');
      setResponsibleRegistration('');
      setStatus('DRAFT');
      setDocumentUrl('');
      setNotes('');
      setIsSubmitting(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  const canSubmit =
    type &&
    name.trim() &&
    validFrom &&
    validUntil &&
    responsibleName.trim() &&
    responsibleRegistration.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const data: CreateSafetyProgramData = {
        type: type as SafetyProgramType,
        name: name.trim(),
        validFrom,
        validUntil,
        responsibleName: responsibleName.trim(),
        responsibleRegistration: responsibleRegistration.trim(),
        status,
        documentUrl: documentUrl.trim() || undefined,
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
        title: 'Novo Programa de Seguranca',
        description: 'Cadastre um novo programa de seguranca do trabalho.',
        icon: (
          <ShieldCheck className="h-16 w-16 text-emerald-400 opacity-50" />
        ),
        isValid: !!canSubmit,
        content: (
          <div className="space-y-4 py-2">
            {/* Tipo + Status */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">
                  Tipo <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={v => setType(v as SafetyProgramType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecionar tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-40 space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={status}
                  onValueChange={v => setStatus(v as SafetyProgramStatus)}
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

            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="program-name" className="text-xs">
                Nome do Programa <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="program-name"
                  value={name}
                  aria-invalid={!!fieldErrors.name}
                  onChange={e => {
                    setName(e.target.value);
                    if (fieldErrors.name)
                      setFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="Ex: PCMSO 2026"
                  className="h-9"
                  autoFocus
                />
                <FormErrorIcon message={fieldErrors.name} />
              </div>
            </div>

            {/* Vigencia */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="valid-from" className="text-xs">
                  Vigencia Inicio <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="valid-from"
                  type="date"
                  value={validFrom}
                  onChange={e => setValidFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="valid-until" className="text-xs">
                  Vigencia Fim <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="valid-until"
                  type="date"
                  value={validUntil}
                  onChange={e => setValidUntil(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            {/* Responsavel */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="responsible-name" className="text-xs">
                  Responsavel Tecnico <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="responsible-name"
                    value={responsibleName}
                    aria-invalid={!!fieldErrors.responsibleName}
                    onChange={e => {
                      setResponsibleName(e.target.value);
                      if (fieldErrors.responsibleName)
                        setFieldErrors(prev => ({ ...prev, responsibleName: '' }));
                    }}
                    placeholder="Nome completo"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.responsibleName} />
                </div>
              </div>
              <div className="w-48 space-y-1.5">
                <Label htmlFor="responsible-reg" className="text-xs">
                  Registro <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="responsible-reg"
                    value={responsibleRegistration}
                    aria-invalid={!!fieldErrors.responsibleRegistration}
                    onChange={e => {
                      setResponsibleRegistration(e.target.value);
                      if (fieldErrors.responsibleRegistration)
                        setFieldErrors(prev => ({ ...prev, responsibleRegistration: '' }));
                    }}
                    placeholder="CRM/CREA/etc."
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.responsibleRegistration} />
                </div>
              </div>
            </div>

            {/* Observacoes */}
            <div className="space-y-1.5">
              <Label htmlFor="program-notes" className="text-xs">
                Observacoes
              </Label>
              <Textarea
                id="program-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Informacoes adicionais sobre o programa..."
                rows={2}
              />
            </div>

            {/* URL do Documento */}
            <div className="space-y-1.5">
              <Label htmlFor="program-doc-url" className="text-xs">
                URL do Documento
              </Label>
              <Input
                id="program-doc-url"
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
                  Criando...
                </>
              ) : (
                'Criar Programa'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [type, name, validFrom, validUntil, responsibleName, responsibleRegistration, status, documentUrl, notes, isSubmitting, canSubmit, onClose, fieldErrors]
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
