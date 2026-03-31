/**
 * OpenSea OS - Create Cost Center Wizard
 * Wizard de 2 passos para criacao de centros de custo usando StepWizardDialog
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import type { CostCenter, CreateCostCenterData } from '@/types/finance';
import { translateError } from '@/lib/error-messages';
import { toast } from 'sonner';
import { Check, DollarSign, Loader2, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateCostCenterWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCostCenterData) => void;
  isSubmitting: boolean;
  nextCode: string;
  costCenters?: CostCenter[];
}

// =============================================================================
// STEP 1: DADOS DO CENTRO DE CUSTO
// =============================================================================

function StepCostCenterData({
  name,
  code,
  parentId,
  description,
  onNameChange,
  onParentChange,
  onDescriptionChange,
  availableParents,
}: {
  name: string;
  code: string;
  parentId: string;
  description: string;
  onNameChange: (value: string) => void;
  onParentChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  availableParents: Array<CostCenter & { level: number }>;
}) {
  return (
    <div className="space-y-4">
      {/* Código (auto-gerado) */}
      <div className="space-y-2">
        <Label htmlFor="cc-wiz-code">Código</Label>
        <Input
          id="cc-wiz-code"
          value={code}
          readOnly
          disabled
          className="font-mono bg-muted"
        />
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="cc-wiz-name">
          Nome <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="cc-wiz-name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Ex.: Departamento Comercial"
          autoFocus
        />
      </div>

      {/* Centro de Custo Pai */}
      <div className="space-y-2">
        <Label htmlFor="cc-wiz-parent">Centro de Custo Pai</Label>
        <Select value={parentId} onValueChange={onParentChange}>
          <SelectTrigger id="cc-wiz-parent">
            <SelectValue placeholder="Nenhum (raiz)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum (raiz)</SelectItem>
            {availableParents.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>
                {'─'.repeat(cc.level)} {cc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descricao */}
      <div className="space-y-2">
        <Label htmlFor="cc-wiz-description">Descrição</Label>
        <Textarea
          id="cc-wiz-description"
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder="Descrição opcional do centro de custo"
          rows={3}
        />
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2: ORCAMENTO
// =============================================================================

function StepBudget({
  monthlyBudget,
  annualBudget,
  onMonthlyChange,
  onAnnualChange,
}: {
  monthlyBudget: string;
  annualBudget: string;
  onMonthlyChange: (value: string) => void;
  onAnnualChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cc-wiz-monthly">Orçamento Mensal (R$)</Label>
          <Input
            id="cc-wiz-monthly"
            type="number"
            step="0.01"
            min="0"
            value={monthlyBudget}
            onChange={e => onMonthlyChange(e.target.value)}
            placeholder="0,00"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cc-wiz-annual">Orçamento Anual (R$)</Label>
          <Input
            id="cc-wiz-annual"
            type="number"
            step="0.01"
            min="0"
            value={annualBudget}
            onChange={e => onAnnualChange(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Os valores de orçamento são opcionais e servem como referência para
        acompanhamento dos gastos.
      </p>
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateCostCenterWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  nextCode,
  costCenters = [],
}: CreateCostCenterWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('none');
  const [description, setDescription] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [annualBudget, setAnnualBudget] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setName('');
      setParentId('none');
      setDescription('');
      setMonthlyBudget('');
      setAnnualBudget('');
    }
  }, [open]);

  // Build parent hierarchy
  const availableParents = useMemo(() => {
    const levelMap = new Map<string, number>();

    function computeLevel(cc: CostCenter): number {
      if (levelMap.has(cc.id)) return levelMap.get(cc.id)!;
      if (!cc.parentId) {
        levelMap.set(cc.id, 0);
        return 0;
      }
      const parent = costCenters.find(c => c.id === cc.parentId);
      if (!parent) {
        levelMap.set(cc.id, 0);
        return 0;
      }
      const parentLevel = computeLevel(parent);
      levelMap.set(cc.id, parentLevel + 1);
      return parentLevel + 1;
    }

    for (const cc of costCenters) {
      computeLevel(cc);
    }

    return costCenters
      .filter(cc => {
        const level = levelMap.get(cc.id) ?? 0;
        return level < 2 && cc.isActive;
      })
      .map(cc => ({
        ...cc,
        level: levelMap.get(cc.id) ?? 0,
      }));
  }, [costCenters]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const data: CreateCostCenterData = {
      code: nextCode,
      name: name.trim(),
      isActive: true,
      parentId: parentId !== 'none' ? parentId : undefined,
    };

    if (description.trim()) {
      data.description = description.trim();
    }

    const monthly = parseFloat(monthlyBudget);
    if (!isNaN(monthly) && monthly > 0) {
      data.monthlyBudget = monthly;
    }

    const annual = parseFloat(annualBudget);
    if (!isNaN(annual) && annual > 0) {
      data.annualBudget = annual;
    }

    try {
      await onSubmit(data);
    } catch (err) {
      toast.error(translateError(err));
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setName('');
    setParentId('none');
    setDescription('');
    setMonthlyBudget('');
    setAnnualBudget('');
    onOpenChange(false);
  };

  const steps: WizardStep[] = [
    {
      title: 'Dados do Centro de Custo',
      description: 'Preencha as informações básicas do centro de custo.',
      icon: <Target className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      content: (
        <StepCostCenterData
          name={name}
          code={nextCode}
          parentId={parentId}
          description={description}
          onNameChange={setName}
          onParentChange={setParentId}
          onDescriptionChange={setDescription}
          availableParents={availableParents}
        />
      ),
      isValid: !!name.trim(),
    },
    {
      title: 'Orçamento',
      description: 'Defina os limites orçamentários do centro de custo.',
      icon: (
        <DollarSign className="h-16 w-16 text-amber-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepBudget
          monthlyBudget={monthlyBudget}
          annualBudget={annualBudget}
          onMonthlyChange={setMonthlyBudget}
          onAnnualChange={setAnnualBudget}
        />
      ),
      isValid: true,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Centro de Custo
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
