/**
 * OpenSea OS - Create Bank Account Wizard
 * Wizard de 2 passos para criacao de contas bancarias usando StepWizardDialog
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
import { Switch } from '@/components/ui/switch';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { companiesService } from '@/services/admin/companies.service';
import type { CreateBankAccountData, PixKeyType } from '@/types/finance';
import { BANK_ACCOUNT_TYPE_LABELS, PIX_KEY_TYPE_LABELS } from '@/types/finance';
import { useQuery } from '@tanstack/react-query';
import { Check, Landmark, Loader2, QrCode } from 'lucide-react';
import { useState } from 'react';

import { BankSelect } from './bank-select';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateBankAccountWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBankAccountData) => Promise<void>;
  isSubmitting?: boolean;
}

// =============================================================================
// INITIAL FORM STATE
// =============================================================================

const INITIAL_FORM = {
  name: '',
  bankCode: '',
  bankName: '',
  agency: '',
  agencyDigit: '',
  accountNumber: '',
  accountDigit: '',
  accountType: 'CHECKING' as const,
  pixKeyType: '',
  pixKey: '',
  color: '#3b82f6',
  companyId: '',
  isDefault: false,
};

// =============================================================================
// STEP 1: DADOS DA CONTA
// =============================================================================

function StepAccountData({
  form,
  onChange,
  companies,
  isLoadingCompanies,
}: {
  form: typeof INITIAL_FORM;
  onChange: (updates: Partial<typeof INITIAL_FORM>) => void;
  companies: Array<{
    id: string;
    tradeName?: string | null;
    legalName: string;
  }>;
  isLoadingCompanies: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Row 1: Nome + Cor */}
      <div className="grid grid-cols-[1fr_80px] gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wiz-name">
            Nome <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="wiz-name"
            placeholder="Ex: Conta Principal"
            value={form.name}
            onChange={e => onChange({ name: e.target.value })}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wiz-color">Cor</Label>
          <Input
            id="wiz-color"
            type="color"
            value={form.color}
            onChange={e => onChange({ color: e.target.value })}
            className="h-9 p-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Row 2: Banco + Agencia */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            Banco <span className="text-rose-500">*</span>
          </Label>
          <BankSelect
            value={form.bankCode}
            onSelect={bank =>
              onChange({
                bankCode: bank.bankCode,
                bankName: bank.bankName,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>
            Agência <span className="text-rose-500">*</span>
          </Label>
          <div className="grid grid-cols-[1fr_60px] gap-2">
            <Input
              placeholder="0001"
              value={form.agency}
              onChange={e => onChange({ agency: e.target.value })}
            />
            <Input
              placeholder="Díg"
              value={form.agencyDigit}
              onChange={e => onChange({ agencyDigit: e.target.value })}
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Tipo de Conta + Conta */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wiz-accountType">
            Tipo de Conta <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={form.accountType}
            onValueChange={value =>
              onChange({ accountType: value as typeof form.accountType })
            }
          >
            <SelectTrigger id="wiz-accountType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BANK_ACCOUNT_TYPE_LABELS).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Conta <span className="text-rose-500">*</span>
          </Label>
          <div className="grid grid-cols-[1fr_60px] gap-2">
            <Input
              placeholder="12345"
              value={form.accountNumber}
              onChange={e => onChange({ accountNumber: e.target.value })}
            />
            <Input
              placeholder="Díg"
              value={form.accountDigit}
              onChange={e => onChange({ accountDigit: e.target.value })}
              maxLength={2}
            />
          </div>
        </div>
      </div>

      {/* Row 4: Empresa */}
      <div className="space-y-1.5">
        <Label htmlFor="wiz-companyId">Empresa</Label>
        <Select
          value={form.companyId}
          onValueChange={value => onChange({ companyId: value })}
        >
          <SelectTrigger id="wiz-companyId">
            <SelectValue
              placeholder={
                isLoadingCompanies
                  ? 'Carregando...'
                  : 'Selecione uma empresa (opcional)'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {companies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.tradeName || company.legalName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// =============================================================================
// STEP 2: PIX E CONFIGURACAO
// =============================================================================

function StepPixConfig({
  form,
  onChange,
}: {
  form: typeof INITIAL_FORM;
  onChange: (updates: Partial<typeof INITIAL_FORM>) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Tipo de Chave PIX + Chave PIX */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="wiz-pixKeyType">Tipo de Chave PIX</Label>
          <Select
            value={form.pixKeyType}
            onValueChange={value => onChange({ pixKeyType: value })}
          >
            <SelectTrigger id="wiz-pixKeyType">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PIX_KEY_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wiz-pixKey">Chave PIX</Label>
          <Input
            id="wiz-pixKey"
            placeholder="Ex: email@exemplo.com"
            value={form.pixKey}
            onChange={e => onChange({ pixKey: e.target.value })}
            disabled={!form.pixKeyType}
          />
        </div>
      </div>

      {/* Conta Padrao */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label
            htmlFor="wiz-isDefault"
            className="text-sm font-medium cursor-pointer"
          >
            Conta Padrão
          </Label>
          <p className="text-xs text-muted-foreground">
            Definir esta conta como a conta padrão para novos lançamentos.
          </p>
        </div>
        <Switch
          id="wiz-isDefault"
          checked={form.isDefault}
          onCheckedChange={checked => onChange({ isDefault: checked })}
        />
      </div>
    </div>
  );
}

// =============================================================================
// MAIN WIZARD
// =============================================================================

export function CreateBankAccountWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateBankAccountWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);

  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies-for-bank-account'],
    queryFn: () => companiesService.listCompanies({ perPage: 100 }),
    enabled: open,
  });

  const companies = companiesData?.companies ?? [];

  const handleChange = (updates: Partial<typeof INITIAL_FORM>) => {
    setForm(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    const data: CreateBankAccountData = {
      name: form.name,
      bankCode: form.bankCode,
      agency: form.agency,
      accountNumber: form.accountNumber,
      accountType: form.accountType,
      bankName: form.bankName || undefined,
      agencyDigit: form.agencyDigit || undefined,
      accountDigit: form.accountDigit || undefined,
      pixKeyType: (form.pixKeyType || undefined) as PixKeyType | undefined,
      pixKey: form.pixKey || undefined,
      color: form.color || undefined,
      companyId: form.companyId || undefined,
      isDefault: form.isDefault,
    };

    await onSubmit(data);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setForm(INITIAL_FORM);
    onOpenChange(false);
  };

  const isStep1Valid =
    !!form.name.trim() &&
    !!form.bankCode.trim() &&
    !!form.agency.trim() &&
    !!form.accountNumber.trim();

  const steps: WizardStep[] = [
    {
      title: 'Dados da Conta',
      description: 'Preencha as informações bancárias da conta.',
      icon: (
        <Landmark className="h-16 w-16 text-purple-400" strokeWidth={1.2} />
      ),
      content: (
        <StepAccountData
          form={form}
          onChange={handleChange}
          companies={companies}
          isLoadingCompanies={isLoadingCompanies}
        />
      ),
      isValid: isStep1Valid,
    },
    {
      title: 'PIX e Configuração',
      description: 'Configure chave PIX e preferências da conta.',
      icon: <QrCode className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />,
      onBack: () => setCurrentStep(1),
      content: <StepPixConfig form={form} onChange={handleChange} />,
      isValid: true,
      footer: (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !isStep1Valid}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Criar Conta Bancária
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
