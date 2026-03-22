/**
 * CreateLoanWizard - Modal de criacao de emprestimos
 * Usa NavigationWizardDialog com 3 secoes:
 * Dados Basicos, Parcelas, Vinculacao
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useBankAccounts,
  useCostCenters,
  useCreateLoan,
} from '@/hooks/finance';
import type { CreateLoanData, LoanType } from '@/types/finance';
import { LOAN_TYPE_LABELS } from '@/types/finance';
import {
  Calendar,
  FileText,
  Landmark,
  Link,
  Loader2,
  Plus,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateLoanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type SectionId = 'basic' | 'installments' | 'linking';

interface FormData {
  name: string;
  type: LoanType | '';
  description: string;
  principalAmount: string;
  interestRate: string;
  interestType: string;
  contractNumber: string;
  totalInstallments: string;
  startDate: string;
  installmentDay: string;
  endDate: string;
  bankAccountId: string;
  costCenterId: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormData = {
  name: '',
  type: '',
  description: '',
  principalAmount: '',
  interestRate: '',
  interestType: 'MONTHLY',
  contractNumber: '',
  totalInstallments: '',
  startDate: '',
  installmentDay: '',
  endDate: '',
  bankAccountId: '',
  costCenterId: '',
  notes: '',
};

const LOAN_TYPES: LoanType[] = [
  'PERSONAL',
  'BUSINESS',
  'WORKING_CAPITAL',
  'EQUIPMENT',
  'REAL_ESTATE',
  'CREDIT_LINE',
  'OTHER',
];

const INTEREST_TYPE_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
  FIXED: 'Fixo',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateLoanWizard({
  open,
  onOpenChange,
  onCreated,
}: CreateLoanWizardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>(
    {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Data sources for linking section
  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];

  const createMutation = useCreateLoan();
  const isPending = createMutation.isPending;

  // Reset form on open
  useEffect(() => {
    if (open) {
      setFormData(INITIAL_FORM);
      setActiveSection('basic');
      setSectionErrors({});
      setFieldErrors({});
    }
  }, [open]);

  // ---------------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------------

  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'basic',
        label: 'Dados Básicos',
        icon: <FileText className="w-4 h-4" />,
        description: 'Instituição, tipo e valores',
      },
      {
        id: 'installments',
        label: 'Parcelas',
        icon: <Calendar className="w-4 h-4" />,
        description: 'Quantidade, início e frequência',
      },
      {
        id: 'linking',
        label: 'Vinculação',
        icon: <Link className="w-4 h-4" />,
        description: 'Conta bancária e centro de custo',
      },
    ],
    []
  );

  // ---------------------------------------------------------------------------
  // Field updater
  // ---------------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setFormData(prev => ({ ...prev, [key]: value }));
      // Clear field error on change
      if (fieldErrors[key]) {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [fieldErrors]
  );

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const secErrors: Record<string, boolean> = {};

    // Basic section validation
    if (!formData.name.trim()) {
      errors.name = 'Nome da instituição é obrigatório';
      secErrors.basic = true;
    }
    if (!formData.type) {
      errors.type = 'Tipo do empréstimo é obrigatório';
      secErrors.basic = true;
    }
    if (!formData.principalAmount || Number(formData.principalAmount) <= 0) {
      errors.principalAmount = 'Valor principal deve ser maior que zero';
      secErrors.basic = true;
    }

    // Installments section validation
    if (
      !formData.totalInstallments ||
      Number(formData.totalInstallments) <= 0
    ) {
      errors.totalInstallments = 'Quantidade de parcelas é obrigatória';
      secErrors.installments = true;
    }
    if (!formData.startDate) {
      errors.startDate = 'Data de início é obrigatória';
      secErrors.installments = true;
    }

    // Linking section validation
    if (!formData.bankAccountId) {
      errors.bankAccountId = 'Conta bancária é obrigatória';
      secErrors.linking = true;
    }
    if (!formData.costCenterId) {
      errors.costCenterId = 'Centro de custo é obrigatório';
      secErrors.linking = true;
    }

    setFieldErrors(errors);
    setSectionErrors(secErrors);

    if (Object.keys(errors).length > 0) {
      // Navigate to first section with error
      const firstErrorSection = Object.keys(secErrors)[0] as SectionId;
      setActiveSection(firstErrorSection);
      return false;
    }

    return true;
  }, [formData]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const data: CreateLoanData = {
      name: formData.name.trim(),
      type: formData.type as LoanType,
      principalAmount: Number(formData.principalAmount),
      interestRate: formData.interestRate ? Number(formData.interestRate) : 0,
      interestType: formData.interestType || undefined,
      contractNumber: formData.contractNumber.trim() || undefined,
      totalInstallments: Number(formData.totalInstallments),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      installmentDay: formData.installmentDay
        ? Number(formData.installmentDay)
        : undefined,
      bankAccountId: formData.bankAccountId,
      costCenterId: formData.costCenterId,
      notes: formData.notes.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(data);
      toast.success('Empréstimo criado com sucesso!');
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar empréstimo';
      toast.error(message);
    }
  }, [formData, validate, createMutation, onOpenChange, onCreated]);

  // ---------------------------------------------------------------------------
  // Close handler
  // ---------------------------------------------------------------------------

  const handleClose = useCallback(
    (val: boolean) => {
      if (isPending) return;
      onOpenChange(val);
    },
    [isPending, onOpenChange]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title="Novo Empréstimo"
      subtitle="Cadastre um novo empréstimo ou financiamento"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={id => setActiveSection(id as SectionId)}
      sectionErrors={sectionErrors}
      isPending={isPending}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Criar Empréstimo
              </>
            )}
          </Button>
        </>
      }
    >
      {/* Section: Dados Basicos */}
      {activeSection === 'basic' && (
        <div className="space-y-5">
          {/* Institution name */}
          <div className="space-y-2">
            <Label htmlFor="loan-name">
              Instituição / Nome <span className="text-rose-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                id="loan-name"
                placeholder="Ex: Banco do Brasil, Caixa Econômica..."
                value={formData.name}
                onChange={e => updateField('name', e.target.value)}
                disabled={isPending}
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-rose-500">{fieldErrors.name}</p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="loan-type">
              Tipo <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={v => updateField('type', v as LoanType)}
              disabled={isPending}
            >
              <SelectTrigger id="loan-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {LOAN_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.type && (
              <p className="text-xs text-rose-500">{fieldErrors.type}</p>
            )}
          </div>

          {/* Contract number */}
          <div className="space-y-2">
            <Label htmlFor="loan-contract">Número do Contrato</Label>
            <Input
              id="loan-contract"
              placeholder="Ex: CTR-2026-001"
              value={formData.contractNumber}
              onChange={e => updateField('contractNumber', e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Principal amount + interest rate */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loan-principal">
                Valor Principal <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="loan-principal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.principalAmount}
                onChange={e => updateField('principalAmount', e.target.value)}
                disabled={isPending}
              />
              {fieldErrors.principalAmount && (
                <p className="text-xs text-rose-500">
                  {fieldErrors.principalAmount}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan-interest">Taxa de Juros (%)</Label>
              <Input
                id="loan-interest"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={formData.interestRate}
                onChange={e => updateField('interestRate', e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Interest type */}
          <div className="space-y-2">
            <Label htmlFor="loan-interest-type">Tipo de Juros</Label>
            <Select
              value={formData.interestType}
              onValueChange={v => updateField('interestType', v)}
              disabled={isPending}
            >
              <SelectTrigger id="loan-interest-type">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INTEREST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description / Notes */}
          <div className="space-y-2">
            <Label htmlFor="loan-description">Descrição</Label>
            <Textarea
              id="loan-description"
              placeholder="Observações sobre o empréstimo..."
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Section: Parcelas */}
      {activeSection === 'installments' && (
        <div className="space-y-5">
          {/* Total installments */}
          <div className="space-y-2">
            <Label htmlFor="loan-installments">
              Quantidade de Parcelas <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="loan-installments"
              type="number"
              min="1"
              placeholder="Ex: 36"
              value={formData.totalInstallments}
              onChange={e => updateField('totalInstallments', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.totalInstallments && (
              <p className="text-xs text-rose-500">
                {fieldErrors.totalInstallments}
              </p>
            )}
          </div>

          {/* Start date */}
          <div className="space-y-2">
            <Label htmlFor="loan-start-date">
              Data de Início <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="loan-start-date"
              type="date"
              value={formData.startDate}
              onChange={e => updateField('startDate', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.startDate && (
              <p className="text-xs text-rose-500">{fieldErrors.startDate}</p>
            )}
          </div>

          {/* End date */}
          <div className="space-y-2">
            <Label htmlFor="loan-end-date">Data de Término</Label>
            <Input
              id="loan-end-date"
              type="date"
              value={formData.endDate}
              onChange={e => updateField('endDate', e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Installment day */}
          <div className="space-y-2">
            <Label htmlFor="loan-installment-day">
              Dia de Vencimento da Parcela
            </Label>
            <Input
              id="loan-installment-day"
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 15"
              value={formData.installmentDay}
              onChange={e => updateField('installmentDay', e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Dia do mês em que as parcelas vencem (1-31)
            </p>
          </div>
        </div>
      )}

      {/* Section: Vinculacao */}
      {activeSection === 'linking' && (
        <div className="space-y-5">
          {/* Bank account */}
          <div className="space-y-2">
            <Label htmlFor="loan-bank-account">
              Conta Bancária <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.bankAccountId}
              onValueChange={v => updateField('bankAccountId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="loan-bank-account">
                <SelectValue placeholder="Selecione a conta bancária" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                    {account.bankName ? ` - ${account.bankName}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.bankAccountId && (
              <p className="text-xs text-rose-500">
                {fieldErrors.bankAccountId}
              </p>
            )}
            {bankAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma conta bancária cadastrada. Cadastre uma conta antes de
                criar o empréstimo.
              </p>
            )}
          </div>

          {/* Cost center */}
          <div className="space-y-2">
            <Label htmlFor="loan-cost-center">
              Centro de Custo <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.costCenterId}
              onValueChange={v => updateField('costCenterId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="loan-cost-center">
                <SelectValue placeholder="Selecione o centro de custo" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.costCenterId && (
              <p className="text-xs text-rose-500">
                {fieldErrors.costCenterId}
              </p>
            )}
            {costCenters.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum centro de custo cadastrado. Cadastre um centro de custo
                antes de criar o empréstimo.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="loan-notes">Observações</Label>
            <Textarea
              id="loan-notes"
              placeholder="Notas adicionais sobre o empréstimo..."
              value={formData.notes}
              onChange={e => updateField('notes', e.target.value)}
              disabled={isPending}
              rows={4}
            />
          </div>
        </div>
      )}
    </NavigationWizardDialog>
  );
}
