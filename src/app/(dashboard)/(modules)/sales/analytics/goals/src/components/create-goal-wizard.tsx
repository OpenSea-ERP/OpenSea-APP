'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { useCreateGoal } from '@/hooks/sales/use-analytics';
import type {
  GoalType,
  GoalPeriod,
  GoalScope,
  CreateGoalRequest,
} from '@/types/sales';
import { CalendarDays, Check, Loader2, Target } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Local Types ───────────────────────────────────────────────

interface CreateGoalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'REVENUE', label: 'Receita' },
  { value: 'QUANTITY', label: 'Quantidade' },
  { value: 'DEALS_WON', label: 'Negócios Fechados' },
  { value: 'NEW_CUSTOMERS', label: 'Novos Clientes' },
  { value: 'TICKET_AVERAGE', label: 'Ticket Médio' },
  { value: 'CONVERSION_RATE', label: 'Taxa de Conversão' },
  { value: 'COMMISSION', label: 'Comissão' },
  { value: 'BID_WIN_RATE', label: 'Taxa de Licitações' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

const PERIOD_OPTIONS: { value: GoalPeriod; label: string }[] = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'QUARTERLY', label: 'Trimestral' },
  { value: 'YEARLY', label: 'Anual' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

const SCOPE_OPTIONS: { value: GoalScope; label: string }[] = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'TEAM', label: 'Equipe' },
  { value: 'TENANT', label: 'Empresa' },
];

// ─── Step 1: Informações da Meta ──────────────────────────────

function StepGoalInfo({
  name,
  onNameChange,
  type,
  onTypeChange,
  targetValue,
  onTargetValueChange,
  unit,
  onUnitChange,
  scope,
  onScopeChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  type: GoalType;
  onTypeChange: (v: GoalType) => void;
  targetValue: string;
  onTargetValueChange: (v: string) => void;
  unit: string;
  onUnitChange: (v: string) => void;
  scope: GoalScope;
  onScopeChange: (v: GoalScope) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Meta *</Label>
        <Input
          placeholder="Ex: Receita Mensal Q1"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={type}
            onChange={e => onTypeChange(e.target.value as GoalType)}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Escopo</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={scope}
            onChange={e => onScopeChange(e.target.value as GoalScope)}
          >
            {SCOPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor Alvo *</Label>
          <Input
            type="number"
            min={0}
            placeholder="100000"
            value={targetValue}
            onChange={e => onTargetValueChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Unidade</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={unit}
            onChange={e => onUnitChange(e.target.value)}
          >
            <option value="BRL">BRL (R$)</option>
            <option value="un">Unidades</option>
            <option value="%">Percentual (%)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Período e Datas ──────────────────────────────────

function StepPeriod({
  period,
  onPeriodChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: {
  period: GoalPeriod;
  onPeriodChange: (v: GoalPeriod) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Período *</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={period}
          onChange={e => onPeriodChange(e.target.value as GoalPeriod)}
        >
          {PERIOD_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data Início *</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => onStartDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Data Fim *</Label>
          <Input
            type="date"
            value={endDate}
            onChange={e => onEndDateChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <p>
          A meta será acompanhada automaticamente durante o período selecionado.
          Você poderá editar os valores a qualquer momento.
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreateGoalWizard({
  open,
  onOpenChange,
}: CreateGoalWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('REVENUE');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('BRL');
  const [scope, setScope] = useState<GoalScope>('TENANT');

  // Step 2 state
  const [period, setPeriod] = useState<GoalPeriod>('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const createGoal = useCreateGoal();
  const isSubmitting = createGoal.isPending;

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setType('REVENUE');
    setTargetValue('');
    setUnit('BRL');
    setScope('TENANT');
    setPeriod('MONTHLY');
    setStartDate('');
    setEndDate('');
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreateGoalRequest = {
      name: name.trim(),
      type,
      targetValue: Number(targetValue),
      unit,
      period,
      startDate,
      endDate,
      scope,
    };

    try {
      await createGoal.mutateAsync(payload);
      toast.success('Meta criada com sucesso.');
      handleClose();
    } catch {
      toast.error('Erro ao criar meta.');
    }
  }

  const step1Valid =
    name.trim().length > 0 && targetValue.length > 0 && Number(targetValue) > 0;

  const step2Valid = startDate.length > 0 && endDate.length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações da Meta',
      description: 'Defina o nome, tipo e valor alvo da meta.',
      icon: <Target className="h-16 w-16 text-blue-400" strokeWidth={1.2} />,
      content: (
        <StepGoalInfo
          name={name}
          onNameChange={setName}
          type={type}
          onTypeChange={setType}
          targetValue={targetValue}
          onTargetValueChange={setTargetValue}
          unit={unit}
          onUnitChange={setUnit}
          scope={scope}
          onScopeChange={setScope}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Período e Datas',
      description: 'Configure o período de acompanhamento da meta.',
      icon: (
        <CalendarDays
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepPeriod
          period={period}
          onPeriodChange={setPeriod}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
        />
      ),
      isValid: step2Valid,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !step2Valid}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Meta
        </Button>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
