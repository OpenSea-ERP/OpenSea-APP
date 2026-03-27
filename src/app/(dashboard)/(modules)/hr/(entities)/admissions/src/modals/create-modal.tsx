'use client';

import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { translateError } from '@/lib/error-messages';
import type {
  CreateAdmissionData,
  ContractType,
  WorkRegime,
} from '@/types/hr';
import {
  Briefcase,
  Check,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import {
  CONTRACT_TYPE_LABELS,
  WORK_REGIME_LABELS,
} from '../utils';

// Department and Position selectors
import { useQuery } from '@tanstack/react-query';
import { departmentsService, positionsService } from '@/services/hr';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdmissionData) => void;
  isSubmitting: boolean;
}

const CONTRACT_TYPE_OPTIONS: { value: ContractType; label: string }[] =
  Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => ({
    value: value as ContractType,
    label,
  }));

const WORK_REGIME_OPTIONS: { value: WorkRegime; label: string }[] =
  Object.entries(WORK_REGIME_LABELS).map(([value, label]) => ({
    value: value as WorkRegime,
    label,
  }));

export function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreateModalProps) {
  // Step 1 state — candidate info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Step 2 state — position/contract
  const [positionId, setPositionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [salary, setSalary] = useState('');
  const [contractType, setContractType] = useState<ContractType | ''>('');
  const [workRegime, setWorkRegime] = useState<WorkRegime | ''>('');

  const [currentStep, setCurrentStep] = useState(1);

  // Fetch departments and positions
  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn: async () => {
      const res = await departmentsService.listDepartments({ perPage: 200 });
      return (res as { departments?: { id: string; name: string }[] }).departments ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: positionsData } = useQuery({
    queryKey: ['positions', 'all'],
    queryFn: async () => {
      const res = await positionsService.listPositions({ perPage: 200 });
      return (res as { positions?: { id: string; name: string }[] }).positions ?? [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const departments = departmentsData ?? [];
  const positions = positionsData ?? [];

  const resetForm = useCallback(() => {
    setFullName('');
    setEmail('');
    setPhone('');
    setFieldErrors({});
    setPositionId('');
    setDepartmentId('');
    setExpectedStartDate('');
    setSalary('');
    setContractType('');
    setWorkRegime('');
    setCurrentStep(1);
  }, []);

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!fullName || !email || !positionId || !departmentId || !expectedStartDate || !contractType || !workRegime)
      return;

    const data: CreateAdmissionData = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      positionId,
      departmentId,
      expectedStartDate,
      salary: salary ? parseFloat(salary) : undefined,
      contractType: contractType as ContractType,
      workRegime: workRegime as WorkRegime,
    };

    try {
      await onSubmit(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('email') || msg.includes('e-mail')) {
        setFieldErrors(prev => ({ ...prev, email: translateError(msg) }));
        setCurrentStep(1);
      } else {
        toast.error(translateError(msg));
      }
    }
  };

  // ============================================================================
  // STEPS
  // ============================================================================

  const step1Valid = !!fullName.trim() && !!email.trim() && email.includes('@');
  const step2Valid =
    !!positionId && !!departmentId && !!expectedStartDate && !!contractType && !!workRegime;

  const steps: WizardStep[] = [
    {
      title: 'Dados do Candidato',
      description: 'Informações básicas do candidato',
      icon: <UserPlus className="h-16 w-16 text-blue-500/60" />,
      content: (
        <div className="space-y-4 p-1">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Nome Completo <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Nome completo do candidato"
                className="h-9"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                E-mail <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (fieldErrors.email)
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                  }}
                  placeholder="email@exemplo.com"
                  className="h-9"
                />
                <FormErrorIcon message={fieldErrors.email || ''} />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-9"
              />
            </div>
          </div>

          <Card className="p-4 bg-blue-50/50 dark:bg-blue-500/5 border-blue-200 dark:border-blue-500/20">
            <div className="flex gap-3">
              <UserPlus className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Admissão Digital
                </p>
                <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                  Um link de admissão será enviado ao candidato para que ele preencha
                  seus dados pessoais, envie documentos e assine digitalmente.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ),
      isValid: step1Valid,
    },
    {
      title: 'Vaga e Contrato',
      description: 'Cargo, departamento e condições',
      icon: <Briefcase className="h-16 w-16 text-blue-500/60" />,
      content: (
        <div className="space-y-4 p-1">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                Departamento <span className="text-rose-500">*</span>
              </Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar departamento..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                Cargo <span className="text-rose-500">*</span>
              </Label>
              <Select value={positionId} onValueChange={setPositionId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar cargo..." />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                Tipo de Contrato <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={contractType}
                onValueChange={v => setContractType(v as ContractType)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">
                Regime de Trabalho <span className="text-rose-500">*</span>
              </Label>
              <Select
                value={workRegime}
                onValueChange={v => setWorkRegime(v as WorkRegime)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {WORK_REGIME_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="start-date" className="text-xs">
                Data de Início Prevista <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="start-date"
                type="date"
                value={expectedStartDate}
                onChange={e => setExpectedStartDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="salary" className="text-xs">
                Salário (R$)
              </Label>
              <Input
                id="salary"
                type="number"
                min="0"
                step="0.01"
                value={salary}
                onChange={e => setSalary(e.target.value)}
                placeholder="0,00"
                className="h-9"
              />
            </div>
          </div>
        </div>
      ),
      isValid: step2Valid,
      footer: (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting || !step2Valid}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Criar Convite
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
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
