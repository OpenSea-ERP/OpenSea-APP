/**
 * Create Warning Modal
 * StepWizard para registrar nova advertência disciplinar
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { employeesService } from '@/services/hr';
import type {
  CreateWarningData,
  WarningType,
  WarningSeverity,
} from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Search, User } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCreateWarning } from '../api';

// ============================================================================
// TYPE CONFIG
// ============================================================================

const WARNING_TYPES: {
  value: WarningType;
  label: string;
  description: string;
  color: string;
}[] = [
  {
    value: 'VERBAL',
    label: 'Verbal',
    description: 'Advertência verbal registrada formalmente',
    color: 'border-sky-500 bg-sky-50 dark:bg-sky-500/8',
  },
  {
    value: 'WRITTEN',
    label: 'Escrita',
    description: 'Advertência formal por escrito',
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-500/8',
  },
  {
    value: 'SUSPENSION',
    label: 'Suspensão',
    description: 'Suspensão disciplinar (até 30 dias - CLT Art. 474)',
    color: 'border-rose-500 bg-rose-50 dark:bg-rose-500/8',
  },
  {
    value: 'TERMINATION_WARNING',
    label: 'Aviso de Desligamento',
    description: 'Último aviso antes de rescisão por justa causa',
    color: 'border-rose-500 bg-rose-50 dark:bg-rose-500/8',
  },
];

const SEVERITY_LEVELS: {
  value: WarningSeverity;
  label: string;
  color: string;
}[] = [
  {
    value: 'LOW',
    label: 'Baixa',
    color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/8',
  },
  {
    value: 'MEDIUM',
    label: 'Média',
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-500/8',
  },
  {
    value: 'HIGH',
    label: 'Alta',
    color: 'border-orange-500 bg-orange-50 dark:bg-orange-500/8',
  },
  {
    value: 'CRITICAL',
    label: 'Crítica',
    color: 'border-rose-500 bg-rose-50 dark:bg-rose-500/8',
  },
];

// ============================================================================
// PROPS
// ============================================================================

interface CreateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWarningModal({
  isOpen,
  onClose,
}: CreateWarningModalProps) {
  const createWarning = useCreateWarning();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [employeeId, setEmployeeId] = useState('');
  const [issuedBy, setIssuedBy] = useState('');
  const [warningType, setWarningType] = useState<WarningType | ''>('');
  const [severity, setSeverity] = useState<WarningSeverity | ''>('');

  // Step 2 state
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [witnessName, setWitnessName] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('');

  // Employee search
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [issuerSearch, setIssuerSearch] = useState('');

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'warnings-modal'],
    queryFn: () =>
      employeesService.listEmployees({ perPage: 100, status: 'ACTIVE' }),
    staleTime: 60_000,
  });

  const employees = useMemo(
    () => employeesData?.employees ?? [],
    [employeesData]
  );

  const filteredEmployees = useMemo(
    () =>
      employees.filter(e =>
        e.fullName.toLowerCase().includes(employeeSearch.toLowerCase())
      ),
    [employees, employeeSearch]
  );

  const filteredIssuers = useMemo(
    () =>
      employees.filter(e =>
        e.fullName.toLowerCase().includes(issuerSearch.toLowerCase())
      ),
    [employees, issuerSearch]
  );

  const selectedEmployee = employees.find(e => e.id === employeeId);
  const selectedIssuer = employees.find(e => e.id === issuedBy);

  const resetForm = () => {
    setStep(1);
    setEmployeeId('');
    setIssuedBy('');
    setWarningType('');
    setSeverity('');
    setReason('');
    setDescription('');
    setIncidentDate('');
    setWitnessName('');
    setSuspensionDays('');
    setEmployeeSearch('');
    setIssuerSearch('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (
      !employeeId ||
      !issuedBy ||
      !warningType ||
      !severity ||
      !reason ||
      !incidentDate
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const warningData: CreateWarningData = {
      employeeId,
      issuedBy,
      type: warningType as WarningType,
      severity: severity as WarningSeverity,
      reason,
      description: description || undefined,
      incidentDate,
      witnessName: witnessName || undefined,
      suspensionDays: suspensionDays ? Number(suspensionDays) : undefined,
    };

    try {
      await createWarning.mutateAsync(warningData);
      handleClose();
    } catch {
      // toast handled by mutation
    }
  };

  // ============================================================================
  // STEPS
  // ============================================================================

  const steps: WizardStep[] = [
    {
      icon: <User className="h-16 w-16 text-violet-500 dark:text-violet-400" />,
      title: 'Funcionário e Tipo',
      description: 'Selecione o funcionário, emissor, tipo e gravidade',
      isValid: !!employeeId && !!issuedBy && !!warningType && !!severity,
      content: (
        <div className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Funcionário <span className="text-rose-500">*</span>
            </Label>
            {selectedEmployee ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedEmployee.fullName}</span>
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setEmployeeId('')}
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar funcionário..."
                    value={employeeSearch}
                    onChange={e => setEmployeeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto rounded-lg border">
                  {filteredEmployees.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      Nenhum funcionário encontrado
                    </p>
                  ) : (
                    filteredEmployees.slice(0, 8).map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        className="w-full flex items-center gap-2 p-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setEmployeeId(emp.id);
                          setEmployeeSearch('');
                        }}
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {emp.fullName}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Issuer Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Emissor (Gestor) <span className="text-rose-500">*</span>
            </Label>
            {selectedIssuer ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedIssuer.fullName}</span>
                <button
                  type="button"
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIssuedBy('')}
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar emissor..."
                    value={issuerSearch}
                    onChange={e => setIssuerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-32 overflow-y-auto rounded-lg border">
                  {filteredIssuers.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      Nenhum funcionário encontrado
                    </p>
                  ) : (
                    filteredIssuers.slice(0, 8).map(emp => (
                      <button
                        key={emp.id}
                        type="button"
                        className="w-full flex items-center gap-2 p-2.5 text-sm hover:bg-muted/50 transition-colors text-left"
                        onClick={() => {
                          setIssuedBy(emp.id);
                          setIssuerSearch('');
                        }}
                      >
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {emp.fullName}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Warning Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tipo <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {WARNING_TYPES.map(wt => (
                <button
                  key={wt.value}
                  type="button"
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    warningType === wt.value
                      ? wt.color + ' border-2'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setWarningType(wt.value)}
                >
                  <span className="text-sm font-medium">{wt.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {wt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Gravidade <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITY_LEVELS.map(sl => (
                <button
                  key={sl.value}
                  type="button"
                  className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                    severity === sl.value
                      ? sl.color + ' border-2'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setSeverity(sl.value)}
                >
                  <span className="text-sm font-medium">{sl.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: <FileText className="h-16 w-16 text-violet-500 dark:text-violet-400" />,
      title: 'Detalhes',
      description: 'Informe o motivo, data e detalhes do incidente',
      isValid: !!reason && reason.length >= 10 && !!incidentDate,
      onBack: () => setStep(1),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Data do Incidente <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="date"
              value={incidentDate}
              onChange={e => setIncidentDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Motivo <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              placeholder="Descreva o motivo da advertência (mín. 10 caracteres)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-xs text-rose-500">
                Mínimo de 10 caracteres ({reason.length}/10)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Descrição Detalhada</Label>
            <Textarea
              placeholder="Detalhes adicionais sobre o incidente (opcional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome da Testemunha</Label>
            <Input
              placeholder="Nome completo da testemunha (opcional)"
              value={witnessName}
              onChange={e => setWitnessName(e.target.value)}
            />
          </div>

          {warningType === 'SUSPENSION' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Dias de Suspensão <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                max={30}
                placeholder="1 a 30 dias"
                value={suspensionDays}
                onChange={e => setSuspensionDays(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Máximo de 30 dias conforme CLT Art. 474
              </p>
            </div>
          )}
        </div>
      ),
      footer: (
        <div className="flex justify-end gap-2 p-4 border-t border-border/50">
          <Button variant="ghost" onClick={handleClose} disabled={createWarning.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || reason.length < 10 || !incidentDate || createWarning.isPending}
          >
            {createWarning.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando...
              </span>
            ) : (
              'Registrar Advertência'
            )}
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
      currentStep={step}
      onStepChange={setStep}
      onClose={handleClose}
      heightClass="h-[540px]"
    />
  );
}
