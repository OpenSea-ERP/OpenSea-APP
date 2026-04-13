/**
 * OpenSea OS - Create Chart of Account Wizard
 * Wizard de 2 passos para criacao de contas do plano de contas usando StepWizardDialog
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
import type {
  ChartOfAccount,
  ChartOfAccountClass,
  ChartOfAccountNature,
  ChartOfAccountType,
  CreateChartOfAccountData,
} from '@/types/finance';
import { translateError } from '@/lib/error-messages';
import { toast } from 'sonner';
import { BookOpen, Check, FolderTree, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPE_OPTIONS: { value: ChartOfAccountType; label: string }[] = [
  { value: 'ASSET', label: 'Ativo' },
  { value: 'LIABILITY', label: 'Passivo' },
  { value: 'EQUITY', label: 'Patrimônio Líquido' },
  { value: 'REVENUE', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
];

const CLASS_OPTIONS: { value: ChartOfAccountClass; label: string }[] = [
  { value: 'CURRENT', label: 'Circulante' },
  { value: 'NON_CURRENT', label: 'Não Circulante' },
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'OTHER', label: 'Outro' },
];

const NATURE_OPTIONS: { value: ChartOfAccountNature; label: string }[] = [
  { value: 'DEBIT', label: 'Débito' },
  { value: 'CREDIT', label: 'Crédito' },
];

// =============================================================================
// TYPES
// =============================================================================

export interface CreateChartOfAccountWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateChartOfAccountData) => void;
  isSubmitting: boolean;
  accounts?: ChartOfAccount[];
}

// =============================================================================
// STEP 1: DADOS BASICOS
// =============================================================================

function StepBasicData({
  code,
  name,
  type,
  nature,
  onCodeChange,
  onNameChange,
  onTypeChange,
  onNatureChange,
}: {
  code: string;
  name: string;
  type: ChartOfAccountType | '';
  nature: ChartOfAccountNature | '';
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onTypeChange: (value: ChartOfAccountType) => void;
  onNatureChange: (value: ChartOfAccountNature) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coa-wiz-code">
          Código <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="coa-wiz-code"
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          placeholder="Ex.: 1.1.1.01"
          className="font-mono"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Use formato hierarquico com pontos (ex.: 1.1.1.01)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coa-wiz-name">
          Nome <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="coa-wiz-name"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Ex.: Banco Bradesco"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="coa-wiz-type">
            Tipo <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={type}
            onValueChange={v => onTypeChange(v as ChartOfAccountType)}
          >
            <SelectTrigger id="coa-wiz-type">
              <SelectValue placeholder="Selecione o tipo" />
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

        <div className="space-y-2">
          <Label htmlFor="coa-wiz-nature">
            Natureza <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={nature}
            onValueChange={v => onNatureChange(v as ChartOfAccountNature)}
          >
            <SelectTrigger id="coa-wiz-nature">
              <SelectValue placeholder="Selecione a natureza" />
            </SelectTrigger>
            <SelectContent>
              {NATURE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2: CLASSIFICACAO
// =============================================================================

function StepClassification({
  accountClass,
  parentId,
  onClassChange,
  onParentChange,
  availableParents,
}: {
  accountClass: ChartOfAccountClass | '';
  parentId: string;
  onClassChange: (value: ChartOfAccountClass) => void;
  onParentChange: (value: string) => void;
  availableParents: Array<ChartOfAccount & { level: number }>;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="coa-wiz-class">
          Classe <span className="text-rose-500">*</span>
        </Label>
        <Select
          value={accountClass}
          onValueChange={v => onClassChange(v as ChartOfAccountClass)}
        >
          <SelectTrigger id="coa-wiz-class">
            <SelectValue placeholder="Selecione a classe" />
          </SelectTrigger>
          <SelectContent>
            {CLASS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="coa-wiz-parent">Conta Pai (opcional)</Label>
        <Select value={parentId} onValueChange={onParentChange}>
          <SelectTrigger id="coa-wiz-parent">
            <SelectValue placeholder="Nenhuma (raiz)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma (raiz)</SelectItem>
            {availableParents.map(acc => (
              <SelectItem key={acc.id} value={acc.id}>
                {'─'.repeat(acc.level)} {acc.code} - {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecione uma conta pai para criar hierarquia no plano de contas.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateChartOfAccountWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  accounts = [],
}: CreateChartOfAccountWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ChartOfAccountType | ''>('');
  const [nature, setNature] = useState<ChartOfAccountNature | ''>('');
  const [accountClass, setAccountClass] = useState<ChartOfAccountClass | ''>(
    ''
  );
  const [parentId, setParentId] = useState('none');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setCode('');
      setName('');
      setType('');
      setNature('');
      setAccountClass('');
      setParentId('none');
    }
  }, [open]);

  // Build parent hierarchy
  const availableParents = useMemo(() => {
    const levelMap = new Map<string, number>();

    function computeLevel(acc: ChartOfAccount): number {
      if (levelMap.has(acc.id)) return levelMap.get(acc.id)!;
      if (!acc.parentId) {
        levelMap.set(acc.id, 0);
        return 0;
      }
      const parent = accounts.find(a => a.id === acc.parentId);
      if (!parent) {
        levelMap.set(acc.id, 0);
        return 0;
      }
      const parentLevel = computeLevel(parent);
      levelMap.set(acc.id, parentLevel + 1);
      return parentLevel + 1;
    }

    for (const acc of accounts) {
      computeLevel(acc);
    }

    return accounts
      .filter(acc => acc.isActive)
      .map(acc => ({
        ...acc,
        level: levelMap.get(acc.id) ?? 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [accounts]);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim() || !type || !nature || !accountClass)
      return;

    const data: CreateChartOfAccountData = {
      code: code.trim(),
      name: name.trim(),
      type: type as ChartOfAccountType,
      accountClass: accountClass as ChartOfAccountClass,
      nature: nature as ChartOfAccountNature,
      isActive: true,
      parentId: parentId !== 'none' ? parentId : undefined,
    };

    try {
      await onSubmit(data);
    } catch (err) {
      toast.error(translateError(err));
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    onOpenChange(false);
  };

  const step1Valid = !!code.trim() && !!name.trim() && !!type && !!nature;
  const step2Valid = !!accountClass;

  const steps: WizardStep[] = [
    {
      title: 'Dados Básicos',
      description:
        'Preencha o código, nome, tipo e natureza da conta contábil.',
      icon: (
        <BookOpen className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
      ),
      content: (
        <StepBasicData
          code={code}
          name={name}
          type={type}
          nature={nature}
          onCodeChange={setCode}
          onNameChange={setName}
          onTypeChange={setType}
          onNatureChange={setNature}
        />
      ),
      isValid: step1Valid,
    },
    {
      title: 'Classificação',
      description: 'Defina a classe e a conta pai (opcional).',
      icon: (
        <FolderTree className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: (
        <StepClassification
          accountClass={accountClass}
          parentId={parentId}
          onClassChange={setAccountClass}
          onParentChange={setParentId}
          availableParents={availableParents}
        />
      ),
      isValid: step2Valid,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !step1Valid || !step2Valid}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Conta
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
