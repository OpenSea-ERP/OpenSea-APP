/**
 * CreateContractWizard - Modal de criação de contratos
 * Usa NavigationWizardDialog com 4 seções:
 * Dados Básicos, Período, Valores, Vinculação
 */

'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  useCreateContract,
  useFinanceCategories,
} from '@/hooks/finance';
import type { PaymentFrequency } from '@/types/finance';
import { PAYMENT_FREQUENCY_LABELS } from '@/types/finance';
import {
  Calendar,
  DollarSign,
  FileText,
  Link,
  Loader2,
  Plus,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateContractWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type SectionId = 'basic' | 'period' | 'values' | 'linking';

interface FormData {
  title: string;
  description: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  renewalPeriodMonths: string;
  alertDaysBefore: string;
  totalValue: string;
  paymentAmount: string;
  paymentFrequency: PaymentFrequency;
  bankAccountId: string;
  costCenterId: string;
  categoryId: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormData = {
  title: '',
  description: '',
  companyName: '',
  contactName: '',
  contactEmail: '',
  startDate: '',
  endDate: '',
  autoRenew: false,
  renewalPeriodMonths: '12',
  alertDaysBefore: '30',
  totalValue: '',
  paymentAmount: '',
  paymentFrequency: 'MONTHLY',
  bankAccountId: '',
  costCenterId: '',
  categoryId: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateContractWizard({
  open,
  onOpenChange,
  onCreated,
}: CreateContractWizardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Data sources for linking section
  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();
  const { data: categoriesData } = useFinanceCategories();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];
  const categories = categoriesData?.categories ?? [];

  const createMutation = useCreateContract();
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
        description: 'Título, empresa e contato',
      },
      {
        id: 'period',
        label: 'Período',
        icon: <Calendar className="w-4 h-4" />,
        description: 'Vigência e renovação automática',
      },
      {
        id: 'values',
        label: 'Valores',
        icon: <DollarSign className="w-4 h-4" />,
        description: 'Valor total, parcela e frequência',
      },
      {
        id: 'linking',
        label: 'Vinculação',
        icon: <Link className="w-4 h-4" />,
        description: 'Conta bancária, centro de custo e categoria',
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

    // Basic section
    if (!formData.title.trim()) {
      errors.title = 'Título é obrigatório';
      secErrors.basic = true;
    }
    if (!formData.companyName.trim()) {
      errors.companyName = 'Empresa/Fornecedor é obrigatório';
      secErrors.basic = true;
    }

    // Period section
    if (!formData.startDate) {
      errors.startDate = 'Data de início é obrigatória';
      secErrors.period = true;
    }
    if (!formData.endDate) {
      errors.endDate = 'Data de término é obrigatória';
      secErrors.period = true;
    }
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = 'Data de término deve ser posterior ao início';
      secErrors.period = true;
    }

    // Values section
    if (!formData.totalValue || Number(formData.totalValue) <= 0) {
      errors.totalValue = 'Valor total deve ser maior que zero';
      secErrors.values = true;
    }
    if (!formData.paymentAmount || Number(formData.paymentAmount) <= 0) {
      errors.paymentAmount = 'Valor da parcela deve ser maior que zero';
      secErrors.values = true;
    }

    setFieldErrors(errors);
    setSectionErrors(secErrors);

    if (Object.keys(errors).length > 0) {
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

    try {
      await createMutation.mutateAsync({
        title: formData.title.trim(),
        companyName: formData.companyName.trim(),
        totalValue: Number(formData.totalValue),
        paymentFrequency: formData.paymentFrequency,
        paymentAmount: Number(formData.paymentAmount),
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description.trim() || undefined,
        contactName: formData.contactName.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        autoRenew: formData.autoRenew,
        renewalPeriodMonths: formData.autoRenew
          ? Number(formData.renewalPeriodMonths) || 12
          : undefined,
        alertDaysBefore: Number(formData.alertDaysBefore) || 30,
        bankAccountId: formData.bankAccountId || undefined,
        costCenterId: formData.costCenterId || undefined,
        categoryId: formData.categoryId || undefined,
        notes: formData.notes.trim() || undefined,
      });
      toast.success('Contrato criado com sucesso!');
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar contrato';
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
      title="Novo Contrato"
      subtitle="Cadastre um novo contrato com fornecedor"
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
                Criar Contrato
              </>
            )}
          </Button>
        </>
      }
    >
      {/* Section: Dados Básicos */}
      {activeSection === 'basic' && (
        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="contract-title">
              Título <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contract-title"
              placeholder="Ex: Contrato de Fornecimento de Matéria-Prima"
              value={formData.title}
              onChange={e => updateField('title', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.title && (
              <p className="text-xs text-rose-500">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="contract-description">Descrição</Label>
            <Textarea
              id="contract-description"
              placeholder="Descrição detalhada do contrato..."
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>

          {/* Company name */}
          <div className="space-y-2">
            <Label htmlFor="contract-company">
              Empresa/Fornecedor <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contract-company"
              placeholder="Razão social ou nome fantasia"
              value={formData.companyName}
              onChange={e => updateField('companyName', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.companyName && (
              <p className="text-xs text-rose-500">{fieldErrors.companyName}</p>
            )}
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract-contact-name">Nome do Contato</Label>
              <Input
                id="contract-contact-name"
                placeholder="Responsável pelo contrato"
                value={formData.contactName}
                onChange={e => updateField('contactName', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contract-contact-email">E-mail do Contato</Label>
              <Input
                id="contract-contact-email"
                type="email"
                placeholder="email@empresa.com"
                value={formData.contactEmail}
                onChange={e => updateField('contactEmail', e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section: Período */}
      {activeSection === 'period' && (
        <div className="space-y-5">
          {/* Start date */}
          <div className="space-y-2">
            <Label htmlFor="contract-start-date">
              Data de Início <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contract-start-date"
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
            <Label htmlFor="contract-end-date">
              Data de Término <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contract-end-date"
              type="date"
              value={formData.endDate}
              onChange={e => updateField('endDate', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.endDate && (
              <p className="text-xs text-rose-500">{fieldErrors.endDate}</p>
            )}
          </div>

          {/* Auto renew */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="contract-auto-renew"
                checked={formData.autoRenew}
                onCheckedChange={checked =>
                  updateField('autoRenew', checked === true)
                }
                disabled={isPending}
              />
              <Label htmlFor="contract-auto-renew" className="font-normal text-sm">
                Renovação automática
              </Label>
            </div>
            {formData.autoRenew && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="contract-renewal-months">
                  Período de renovação (meses)
                </Label>
                <Input
                  id="contract-renewal-months"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="12"
                  value={formData.renewalPeriodMonths}
                  onChange={e => updateField('renewalPeriodMonths', e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          {/* Alert days before */}
          <div className="space-y-2">
            <Label htmlFor="contract-alert-days">
              Alerta de vencimento (dias antes)
            </Label>
            <Input
              id="contract-alert-days"
              type="number"
              min="1"
              max="365"
              placeholder="30"
              value={formData.alertDaysBefore}
              onChange={e => updateField('alertDaysBefore', e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Quantos dias antes do vencimento o sistema deve alertar
            </p>
          </div>
        </div>
      )}

      {/* Section: Valores */}
      {activeSection === 'values' && (
        <div className="space-y-5">
          {/* Total value */}
          <div className="space-y-2">
            <Label htmlFor="contract-total-value">
              Valor Total (R$) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contract-total-value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.totalValue}
              onChange={e => updateField('totalValue', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.totalValue && (
              <p className="text-xs text-rose-500">{fieldErrors.totalValue}</p>
            )}
          </div>

          {/* Payment amount */}
          <div className="space-y-2">
            <Label htmlFor="contract-payment-amount">
              Valor da Parcela (R$) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="contract-payment-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.paymentAmount}
              onChange={e => updateField('paymentAmount', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.paymentAmount && (
              <p className="text-xs text-rose-500">{fieldErrors.paymentAmount}</p>
            )}
          </div>

          {/* Payment frequency */}
          <div className="space-y-2">
            <Label htmlFor="contract-frequency">Frequência de Pagamento</Label>
            <Select
              value={formData.paymentFrequency}
              onValueChange={v => updateField('paymentFrequency', v as PaymentFrequency)}
              disabled={isPending}
            >
              <SelectTrigger id="contract-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_FREQUENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Section: Vinculação */}
      {activeSection === 'linking' && (
        <div className="space-y-5">
          {/* Bank account */}
          <div className="space-y-2">
            <Label htmlFor="contract-bank-account">Conta Bancária</Label>
            <Select
              value={formData.bankAccountId}
              onValueChange={v => updateField('bankAccountId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="contract-bank-account">
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
            {bankAccounts.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhuma conta bancária cadastrada.
              </p>
            )}
          </div>

          {/* Cost center */}
          <div className="space-y-2">
            <Label htmlFor="contract-cost-center">Centro de Custo</Label>
            <Select
              value={formData.costCenterId}
              onValueChange={v => updateField('costCenterId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="contract-cost-center">
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
            {costCenters.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Nenhum centro de custo cadastrado.
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="contract-category">Categoria</Label>
            <Select
              value={formData.categoryId}
              onValueChange={v => updateField('categoryId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="contract-category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="contract-notes">Observações</Label>
            <Textarea
              id="contract-notes"
              placeholder="Notas adicionais sobre o contrato..."
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
