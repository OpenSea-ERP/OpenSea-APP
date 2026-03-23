'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePriceTable } from '@/hooks/sales/use-price-tables';
import type { PriceTableType, CreatePriceTableRequest } from '@/types/sales';
import { PRICE_TABLE_TYPE_LABELS } from '@/types/sales';
import { CalendarDays, Check, DollarSign, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Local Types ───────────────────────────────────────────────

interface CreatePriceTableWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Step 1: Informações Básicas ──────────────────────────────

function StepBasicInfo({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  type,
  onTypeChange,
  priority,
  onPriorityChange,
}: {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  type: PriceTableType;
  onTypeChange: (v: PriceTableType) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input
          placeholder="Ex: Tabela Varejo 2026"
          value={name}
          onChange={e => onNameChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          placeholder="Descrição da tabela de preço..."
          rows={3}
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={type}
            onChange={e => onTypeChange(e.target.value as PriceTableType)}
          >
            {Object.entries(PRICE_TABLE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={priority}
            onChange={e => onPriorityChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Ativação e Vigência ──────────────────────────────

function StepActivation({
  isActive,
  onIsActiveChange,
  validFrom,
  onValidFromChange,
  validUntil,
  onValidUntilChange,
}: {
  isActive: boolean;
  onIsActiveChange: (v: boolean) => void;
  validFrom: string;
  onValidFromChange: (v: string) => void;
  validUntil: string;
  onValidUntilChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onIsActiveChange(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-600/25 dark:border-emerald-500/20'
                : 'bg-background text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            Ativa
          </button>
          <button
            type="button"
            onClick={() => onIsActiveChange(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              !isActive
                ? 'bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300 border-slate-600/25 dark:border-slate-500/20'
                : 'bg-background text-muted-foreground border-border hover:bg-accent'
            }`}
          >
            Inativa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Válida a partir de</Label>
          <Input
            type="date"
            value={validFrom}
            onChange={e => onValidFromChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Válida até</Label>
          <Input
            type="date"
            value={validUntil}
            onChange={e => onValidUntilChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
        <p>
          As datas de vigência são opcionais. Se não informadas, a tabela ficará
          ativa por tempo indeterminado.
        </p>
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

export function CreatePriceTableWizard({
  open,
  onOpenChange,
}: CreatePriceTableWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PriceTableType>('DEFAULT');
  const [priority, setPriority] = useState('0');

  // Step 2 state
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const createPriceTable = useCreatePriceTable();
  const isSubmitting = createPriceTable.isPending;

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setName('');
    setDescription('');
    setType('DEFAULT');
    setPriority('0');
    setIsActive(true);
    setValidFrom('');
    setValidUntil('');
    onOpenChange(false);
  }, [onOpenChange]);

  async function handleSubmit() {
    const payload: CreatePriceTableRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      priority: Number(priority) || 0,
      isActive,
      validFrom: validFrom || undefined,
      validUntil: validUntil || undefined,
    };

    try {
      await createPriceTable.mutateAsync(payload);
      toast.success('Tabela de preço criada com sucesso.');
      handleClose();
    } catch {
      toast.error('Erro ao criar tabela de preço.');
    }
  }

  const step1Valid = name.trim().length > 0;

  const steps: WizardStep[] = [
    {
      title: 'Informações Básicas',
      description: 'Defina o nome, tipo e prioridade da tabela.',
      icon: (
        <DollarSign className="h-16 w-16 text-blue-400" strokeWidth={1.2} />
      ),
      content: (
        <StepBasicInfo
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          type={type}
          onTypeChange={setType}
          priority={priority}
          onPriorityChange={setPriority}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Ativação e Vigência',
      description: 'Configure o status e período de validade.',
      icon: (
        <CalendarDays
          className="h-16 w-16 text-emerald-400"
          strokeWidth={1.2}
        />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepActivation
          isActive={isActive}
          onIsActiveChange={setIsActive}
          validFrom={validFrom}
          onValidFromChange={setValidFrom}
          validUntil={validUntil}
          onValidUntilChange={setValidUntil}
        />
      ),
      isValid: true,
      footer: (
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Tabela de Preço
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
