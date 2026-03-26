/**
 * OpenSea OS - Create Dependant Wizard
 * Modal de criacao rapida de dependente
 */

'use client';

import { Button } from '@/components/ui/button';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Switch } from '@/components/ui/switch';
import { translateError } from '@/lib/error-messages';
import type { CreateDependantData } from '@/types/hr';
import { Heart, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CreateDependantMutationData } from '../api/mutations';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDependantMutationData) => Promise<void>;
  preselectedEmployeeId?: string;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'SPOUSE', label: 'Cônjuge' },
  { value: 'CHILD', label: 'Filho(a)' },
  { value: 'STEPCHILD', label: 'Enteado(a)' },
  { value: 'PARENT', label: 'Pai/Mãe' },
  { value: 'OTHER', label: 'Outro' },
];

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  preselectedEmployeeId,
}: CreateModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isIrrfDependant, setIsIrrfDependant] = useState(false);
  const [isSalarioFamilia, setIsSalarioFamilia] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(preselectedEmployeeId ?? '');
      setName('');
      setCpf('');
      setBirthDate('');
      setRelationship('');
      setIsIrrfDependant(false);
      setIsSalarioFamilia(false);
      setHasDisability(false);
      setFieldErrors({});
    }
  }, [isOpen, preselectedEmployeeId]);

  const canSubmit =
    employeeId.trim() && name.trim() && birthDate && relationship;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const data: CreateDependantMutationData = {
        employeeId: employeeId.trim(),
        name: name.trim(),
        birthDate,
        relationship,
        isIrrfDependant,
        isSalarioFamilia,
        hasDisability,
      };

      if (cpf.trim()) {
        (data as CreateDependantData & { cpf?: string }).cpf = cpf
          .replace(/\D/g, '')
          .trim();
      }

      await onSubmit(data);
      setEmployeeId(preselectedEmployeeId ?? '');
      setName('');
      setCpf('');
      setBirthDate('');
      setRelationship('');
      setIsIrrfDependant(false);
      setIsSalarioFamilia(false);
      setHasDisability(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('already') || msg.includes('cpf')) {
        setFieldErrors(prev => ({ ...prev, cpf: translateError(msg) }));
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
        title: 'Novo Dependente',
        description: 'Cadastre um novo dependente de funcionário.',
        icon: (
          <Heart
            className="h-16 w-16 text-pink-400 opacity-50"
            strokeWidth={1.2}
          />
        ),
        isValid: !!canSubmit,
        content: (
          <div className="space-y-4 py-2">
            {/* Funcionario */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Funcionário <span className="text-rose-500">*</span>
              </Label>
              <EmployeeSelector
                value={employeeId}
                onChange={id => setEmployeeId(id)}
                placeholder="Selecionar funcionário..."
                disabled={!!preselectedEmployeeId}
              />
            </div>

            {/* Nome + CPF */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="dep-name" className="text-xs">
                  Nome Completo <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="dep-name"
                    value={name}
                    aria-invalid={!!fieldErrors.name}
                    onChange={e => {
                      setName(e.target.value);
                      if (fieldErrors.name)
                        setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    placeholder="Ex.: Maria Silva"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.name} />
                </div>
              </div>
              <div className="w-44 space-y-1.5">
                <Label htmlFor="dep-cpf" className="text-xs">
                  CPF
                </Label>
                <div className="relative">
                  <Input
                    id="dep-cpf"
                    value={cpf}
                    aria-invalid={!!fieldErrors.cpf}
                    onChange={e => {
                      setCpf(e.target.value);
                      if (fieldErrors.cpf)
                        setFieldErrors(prev => ({ ...prev, cpf: '' }));
                    }}
                    placeholder="000.000.000-00"
                    className="h-9"
                  />
                  <FormErrorIcon message={fieldErrors.cpf} />
                </div>
              </div>
            </div>

            {/* Data de Nascimento + Parentesco */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="dep-birthdate" className="text-xs">
                  Data de Nascimento <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="dep-birthdate"
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs">
                  Parentesco <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={relationship}
                  onValueChange={setRelationship}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="dep-irrf"
                  className="cursor-pointer text-xs"
                >
                  Dependente para o IRRF
                </Label>
                <Switch
                  id="dep-irrf"
                  checked={isIrrfDependant}
                  onCheckedChange={setIsIrrfDependant}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="dep-salario-familia"
                  className="cursor-pointer text-xs"
                >
                  Salário Família
                </Label>
                <Switch
                  id="dep-salario-familia"
                  checked={isSalarioFamilia}
                  onCheckedChange={setIsSalarioFamilia}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="dep-disability"
                  className="cursor-pointer text-xs"
                >
                  Pessoa com Deficiência (PcD)
                </Label>
                <Switch
                  id="dep-disability"
                  checked={hasDisability}
                  onCheckedChange={setHasDisability}
                />
              </div>
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
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Dependente'
              )}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      employeeId,
      name,
      cpf,
      birthDate,
      relationship,
      isIrrfDependant,
      isSalarioFamilia,
      hasDisability,
      isSubmitting,
      canSubmit,
      onClose,
      fieldErrors,
      preselectedEmployeeId,
    ]
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
