/**
 * OpenSea OS - Create Category Wizard
 * Wizard de 2 passos para criacao de categorias financeiras usando StepWizardDialog
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
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import type { FinanceCategory, FinanceCategoryType } from '@/types/finance';
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import { Check, FolderTree, Loader2, Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateCategoryWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    type: FinanceCategoryType;
    description?: string;
    displayOrder?: number;
    parentId?: string;
    iconUrl?: string;
    interestRate?: number;
    penaltyRate?: number;
  }) => Promise<void>;
  isSubmitting: boolean;
  nextDisplayOrder: number;
  categories?: FinanceCategory[];
  defaultType?: FinanceCategoryType;
}

// =============================================================================
// STEP 1: DADOS DA CATEGORIA
// =============================================================================

function StepCategoryData({
  name,
  type,
  parentId,
  iconUrl,
  onNameChange,
  onTypeChange,
  onParentChange,
  onIconUrlChange,
  availableParents,
}: {
  name: string;
  type: FinanceCategoryType;
  parentId: string;
  iconUrl: string;
  onNameChange: (value: string) => void;
  onTypeChange: (value: FinanceCategoryType) => void;
  onParentChange: (value: string) => void;
  onIconUrlChange: (value: string) => void;
  availableParents: Array<FinanceCategory & { level: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cat-wiz-name">
          Nome <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="cat-wiz-name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Nome da categoria"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-wiz-type">
          Tipo <span className="text-rose-500">*</span>
        </Label>
        <Select
          value={type}
          onValueChange={v => onTypeChange(v as FinanceCategoryType)}
        >
          <SelectTrigger id="cat-wiz-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FINANCE_CATEGORY_TYPE_LABELS).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-wiz-parent">Categoria Pai</Label>
        <Select value={parentId} onValueChange={onParentChange}>
          <SelectTrigger id="cat-wiz-parent">
            <SelectValue placeholder="Nenhuma (raiz)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma (raiz)</SelectItem>
            {availableParents.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {'─'.repeat(cat.level)} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-wiz-icon">URL do Ícone</Label>
        <Input
          id="cat-wiz-icon"
          value={iconUrl}
          onChange={e => onIconUrlChange(e.target.value)}
          placeholder="https://exemplo.com/icone.svg (opcional)"
        />
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2: CONFIGURACAO
// =============================================================================

function StepCategoryConfig({
  interestRate,
  penaltyRate,
  displayOrder,
  onInterestRateChange,
  onPenaltyRateChange,
  onDisplayOrderChange,
}: {
  interestRate: string;
  penaltyRate: string;
  displayOrder: number;
  onInterestRateChange: (value: string) => void;
  onPenaltyRateChange: (value: string) => void;
  onDisplayOrderChange: (value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cat-wiz-interest">Taxa de Juros Padrão (%)</Label>
          <Input
            id="cat-wiz-interest"
            type="number"
            step="0.01"
            min="0"
            value={interestRate}
            onChange={e => onInterestRateChange(e.target.value)}
            placeholder="0,00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cat-wiz-penalty">Taxa de Multa Padrão (%)</Label>
          <Input
            id="cat-wiz-penalty"
            type="number"
            step="0.01"
            min="0"
            value={penaltyRate}
            onChange={e => onPenaltyRateChange(e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cat-wiz-order">Ordem de Exibição</Label>
        <Input
          id="cat-wiz-order"
          type="number"
          min="1"
          value={displayOrder}
          onChange={e =>
            onDisplayOrderChange(parseInt(e.target.value, 10) || 1)
          }
        />
        <p className="text-xs text-muted-foreground">
          Define a posição desta categoria na listagem.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateCategoryWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  nextDisplayOrder,
  categories = [],
  defaultType = 'EXPENSE',
}: CreateCategoryWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceCategoryType>(defaultType);
  const [parentId, setParentId] = useState('none');
  const [iconUrl, setIconUrl] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [penaltyRate, setPenaltyRate] = useState('');
  const [displayOrder, setDisplayOrder] = useState(nextDisplayOrder);

  // Sync defaults when modal opens
  useEffect(() => {
    if (open) {
      setType(defaultType);
      setParentId('none');
      setName('');
      setIconUrl('');
      setInterestRate('');
      setPenaltyRate('');
      setDisplayOrder(nextDisplayOrder);
      setCurrentStep(1);
    }
  }, [open, defaultType, nextDisplayOrder]);

  // Only show parents of the same type (or BOTH) and max level 1
  const availableParents = useMemo(() => {
    const levelMap = new Map<string, number>();

    function computeLevel(cat: FinanceCategory): number {
      if (levelMap.has(cat.id)) return levelMap.get(cat.id)!;
      if (!cat.parentId) {
        levelMap.set(cat.id, 0);
        return 0;
      }
      const parent = categories.find(c => c.id === cat.parentId);
      if (!parent) {
        levelMap.set(cat.id, 0);
        return 0;
      }
      const parentLevel = computeLevel(parent);
      levelMap.set(cat.id, parentLevel + 1);
      return parentLevel + 1;
    }

    for (const cat of categories) {
      computeLevel(cat);
    }

    return categories
      .filter(c => {
        const catLevel = levelMap.get(c.id) ?? 0;
        if (catLevel >= 2) return false;
        return c.type === type || c.type === 'BOTH';
      })
      .map(c => ({
        ...c,
        level: levelMap.get(c.id) ?? 0,
      }));
  }, [categories, type]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    const interest = parseFloat(interestRate);
    const penalty = parseFloat(penaltyRate);

    await onSubmit({
      name: name.trim(),
      type,
      parentId: parentId !== 'none' ? parentId : undefined,
      iconUrl: iconUrl.trim() || undefined,
      displayOrder,
      interestRate: !isNaN(interest) && interest > 0 ? interest : undefined,
      penaltyRate: !isNaN(penalty) && penalty > 0 ? penalty : undefined,
    });
  };

  const handleClose = () => {
    setCurrentStep(1);
    setName('');
    setType(defaultType);
    setParentId('none');
    setIconUrl('');
    setInterestRate('');
    setPenaltyRate('');
    setDisplayOrder(nextDisplayOrder);
    onOpenChange(false);
  };

  const steps: WizardStep[] = [
    {
      title: 'Dados da Categoria',
      description: 'Preencha as informações básicas da categoria.',
      icon: (
        <FolderTree className="h-16 w-16 text-cyan-400" strokeWidth={1.2} />
      ),
      content: (
        <StepCategoryData
          name={name}
          type={type}
          parentId={parentId}
          iconUrl={iconUrl}
          onNameChange={setName}
          onTypeChange={setType}
          onParentChange={setParentId}
          onIconUrlChange={setIconUrl}
          availableParents={availableParents}
        />
      ),
      isValid: !!name.trim(),
    },
    {
      title: 'Configuração',
      description: 'Defina taxas padrão e ordem de exibição.',
      icon: <Settings className="h-16 w-16 text-slate-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: (
        <StepCategoryConfig
          interestRate={interestRate}
          penaltyRate={penaltyRate}
          displayOrder={displayOrder}
          onInterestRateChange={setInterestRate}
          onPenaltyRateChange={setPenaltyRate}
          onDisplayOrderChange={setDisplayOrder}
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
          Criar Categoria
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
