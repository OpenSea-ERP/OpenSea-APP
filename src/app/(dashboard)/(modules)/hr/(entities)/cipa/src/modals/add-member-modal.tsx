/**
 * OpenSea OS - Add CIPA Member Wizard
 * Modal de adicao de membro a CIPA
 */

'use client';

import { Button } from '@/components/ui/button';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { translateError } from '@/lib/error-messages';
import type {
  CreateCipaMemberData,
  CipaMemberRole,
  CipaMemberType,
} from '@/types/hr';
import { Loader2, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCipaMemberData) => Promise<void>;
}

const ROLE_OPTIONS: { value: CipaMemberRole; label: string }[] = [
  { value: 'PRESIDENTE', label: 'Presidente' },
  { value: 'VICE_PRESIDENTE', label: 'Vice-Presidente' },
  { value: 'SECRETARIO', label: 'Secretario' },
  { value: 'MEMBRO_TITULAR', label: 'Membro Titular' },
  { value: 'MEMBRO_SUPLENTE', label: 'Membro Suplente' },
];

const TYPE_OPTIONS: { value: CipaMemberType; label: string }[] = [
  { value: 'EMPREGADOR', label: 'Representante do Empregador' },
  { value: 'EMPREGADO', label: 'Representante dos Empregados' },
];

export function AddMemberModal({
  isOpen,
  onClose,
  onSubmit,
}: AddMemberModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<CipaMemberRole | ''>('');
  const [type, setType] = useState<CipaMemberType | ''>('');
  const [isStable, setIsStable] = useState(false);
  const [stableUntil, setStableUntil] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setEmployeeId('');
      setRole('');
      setType('');
      setIsStable(false);
      setStableUntil('');
      setIsSubmitting(false);
      setFieldErrors({});
    }
  }, [isOpen]);

  const canSubmit = employeeId.trim() && role && type;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const data: CreateCipaMemberData = {
        employeeId: employeeId.trim(),
        role: role as CipaMemberRole,
        type: type as CipaMemberType,
        isStable,
        stableUntil: isStable && stableUntil ? stableUntil : undefined,
      };
      await onSubmit(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('exists') || msg.includes('member')) {
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
        title: 'Adicionar Membro',
        description: 'Selecione o funcionario e defina seu cargo na CIPA.',
        icon: (
          <UserPlus className="h-16 w-16 text-amber-400 opacity-50" />
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

            {/* Cargo + Representacao */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">
                  Cargo na CIPA <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={role}
                  onValueChange={v => setRole(v as CipaMemberRole)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecionar cargo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">
                  Representacao <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={type}
                  onValueChange={v => setType(v as CipaMemberType)}
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
            </div>

            {/* Estabilidade */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={isStable}
                  onCheckedChange={setIsStable}
                />
                <Label className="text-xs">
                  Possui estabilidade provisoria
                </Label>
              </div>
              {isStable && (
                <div className="w-1/2 space-y-1.5">
                  <Label htmlFor="stable-until" className="text-xs">
                    Estabilidade ate
                  </Label>
                  <Input
                    id="stable-until"
                    type="date"
                    value={stableUntil}
                    onChange={e => setStableUntil(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}
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
                  Adicionando...
                </>
              ) : (
                'Adicionar Membro'
              )}
            </Button>
          </div>
        ),
      },
    ],
    [employeeId, role, type, isStable, stableUntil, isSubmitting, canSubmit, onClose, fieldErrors]
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
