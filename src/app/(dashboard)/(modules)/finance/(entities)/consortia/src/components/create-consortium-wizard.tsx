/**
 * CreateConsortiumWizard - Modal de criacao de consorcios
 * Usa NavigationWizardDialog com 3 secoes:
 * Dados Basicos, Pagamentos, Vinculacao
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
import { useBankAccounts, useCostCenters, useCreateConsortium } from '@/hooks/finance';
import type { CreateConsortiumData } from '@/types/finance';
import {
  Calendar,
  FileText,
  Link,
  Loader2,
  Plus,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateConsortiumWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

type SectionId = 'basic' | 'payments' | 'linking';

interface FormData {
  name: string;
  administrator: string;
  groupNumber: string;
  quotaNumber: string;
  contractNumber: string;
  creditValue: string;
  description: string;
  monthlyPayment: string;
  totalInstallments: string;
  startDate: string;
  paymentDay: string;
  bankAccountId: string;
  costCenterId: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INITIAL_FORM: FormData = {
  name: '',
  administrator: '',
  groupNumber: '',
  quotaNumber: '',
  contractNumber: '',
  creditValue: '',
  description: '',
  monthlyPayment: '',
  totalInstallments: '',
  startDate: '',
  paymentDay: '',
  bankAccountId: '',
  costCenterId: '',
  notes: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateConsortiumWizard({
  open,
  onOpenChange,
  onCreated,
}: CreateConsortiumWizardProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Data sources for linking section
  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];

  const createMutation = useCreateConsortium();
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
        description: 'Administradora, grupo, cota e crédito',
      },
      {
        id: 'payments',
        label: 'Pagamentos',
        icon: <Calendar className="w-4 h-4" />,
        description: 'Parcela mensal, quantidade e data de início',
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
    if (!formData.administrator.trim()) {
      errors.administrator = 'Administradora é obrigatória';
      secErrors.basic = true;
    }
    if (!formData.name.trim()) {
      errors.name = 'Nome/Descrição é obrigatório';
      secErrors.basic = true;
    }
    if (!formData.creditValue || Number(formData.creditValue) <= 0) {
      errors.creditValue = 'Valor do crédito deve ser maior que zero';
      secErrors.basic = true;
    }

    // Payments section validation
    if (!formData.monthlyPayment || Number(formData.monthlyPayment) <= 0) {
      errors.monthlyPayment = 'Parcela mensal deve ser maior que zero';
      secErrors.payments = true;
    }
    if (
      !formData.totalInstallments ||
      Number(formData.totalInstallments) <= 0
    ) {
      errors.totalInstallments = 'Quantidade de parcelas é obrigatória';
      secErrors.payments = true;
    }
    if (!formData.startDate) {
      errors.startDate = 'Data de adesão é obrigatória';
      secErrors.payments = true;
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

    const data: CreateConsortiumData = {
      name: formData.name.trim(),
      administrator: formData.administrator.trim(),
      creditValue: Number(formData.creditValue),
      monthlyPayment: Number(formData.monthlyPayment),
      totalInstallments: Number(formData.totalInstallments),
      startDate: formData.startDate,
      bankAccountId: formData.bankAccountId,
      costCenterId: formData.costCenterId,
      groupNumber: formData.groupNumber.trim() || undefined,
      quotaNumber: formData.quotaNumber.trim() || undefined,
      contractNumber: formData.contractNumber.trim() || undefined,
      paymentDay: formData.paymentDay
        ? Number(formData.paymentDay)
        : undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(data);
      toast.success('Consórcio criado com sucesso!');
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar consórcio';
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
      title="Novo Consórcio"
      subtitle="Cadastre uma nova cota de consórcio"
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
                Criar Consórcio
              </>
            )}
          </Button>
        </>
      }
    >
      {/* Section: Dados Basicos */}
      {activeSection === 'basic' && (
        <div className="space-y-5">
          {/* Name / Description */}
          <div className="space-y-2">
            <Label htmlFor="consortium-name">
              Nome / Descrição <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="consortium-name"
              placeholder="Ex: Consórcio Imóvel Residencial"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-500">{fieldErrors.name}</p>
            )}
          </div>

          {/* Administrator */}
          <div className="space-y-2">
            <Label htmlFor="consortium-administrator">
              Administradora <span className="text-rose-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                id="consortium-administrator"
                placeholder="Ex: Porto Seguro, Embracon, Rodobens..."
                value={formData.administrator}
                onChange={e => updateField('administrator', e.target.value)}
                disabled={isPending}
              />
            </div>
            {fieldErrors.administrator && (
              <p className="text-xs text-rose-500">{fieldErrors.administrator}</p>
            )}
          </div>

          {/* Group + Quota */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consortium-group">Grupo</Label>
              <Input
                id="consortium-group"
                placeholder="Ex: 0123"
                value={formData.groupNumber}
                onChange={e => updateField('groupNumber', e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consortium-quota">Cota</Label>
              <Input
                id="consortium-quota"
                placeholder="Ex: 045"
                value={formData.quotaNumber}
                onChange={e => updateField('quotaNumber', e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          {/* Credit Value */}
          <div className="space-y-2">
            <Label htmlFor="consortium-credit">
              Valor do Crédito (R$) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="consortium-credit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.creditValue}
              onChange={e => updateField('creditValue', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.creditValue && (
              <p className="text-xs text-rose-500">{fieldErrors.creditValue}</p>
            )}
          </div>

          {/* Contract number */}
          <div className="space-y-2">
            <Label htmlFor="consortium-contract">Número do Contrato</Label>
            <Input
              id="consortium-contract"
              placeholder="Ex: CTR-2026-001"
              value={formData.contractNumber}
              onChange={e => updateField('contractNumber', e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="consortium-description">Descrição</Label>
            <Textarea
              id="consortium-description"
              placeholder="Informações adicionais sobre o consórcio..."
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              disabled={isPending}
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Section: Pagamentos */}
      {activeSection === 'payments' && (
        <div className="space-y-5">
          {/* Monthly payment */}
          <div className="space-y-2">
            <Label htmlFor="consortium-monthly">
              Parcela Mensal (R$) <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="consortium-monthly"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.monthlyPayment}
              onChange={e => updateField('monthlyPayment', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.monthlyPayment && (
              <p className="text-xs text-rose-500">{fieldErrors.monthlyPayment}</p>
            )}
          </div>

          {/* Total installments */}
          <div className="space-y-2">
            <Label htmlFor="consortium-installments">
              Total de Parcelas <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="consortium-installments"
              type="number"
              min="1"
              placeholder="Ex: 120"
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
            <Label htmlFor="consortium-start-date">
              Data de Adesão <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="consortium-start-date"
              type="date"
              value={formData.startDate}
              onChange={e => updateField('startDate', e.target.value)}
              disabled={isPending}
            />
            {fieldErrors.startDate && (
              <p className="text-xs text-rose-500">{fieldErrors.startDate}</p>
            )}
          </div>

          {/* Payment day */}
          <div className="space-y-2">
            <Label htmlFor="consortium-payment-day">
              Dia de Vencimento da Parcela
            </Label>
            <Input
              id="consortium-payment-day"
              type="number"
              min="1"
              max="31"
              placeholder="Ex: 15"
              value={formData.paymentDay}
              onChange={e => updateField('paymentDay', e.target.value)}
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
            <Label htmlFor="consortium-bank-account">
              Conta Bancária <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.bankAccountId}
              onValueChange={v => updateField('bankAccountId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="consortium-bank-account">
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
                criar o consórcio.
              </p>
            )}
          </div>

          {/* Cost center */}
          <div className="space-y-2">
            <Label htmlFor="consortium-cost-center">
              Centro de Custo <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.costCenterId}
              onValueChange={v => updateField('costCenterId', v)}
              disabled={isPending}
            >
              <SelectTrigger id="consortium-cost-center">
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
                antes de criar o consórcio.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="consortium-notes">Observações</Label>
            <Textarea
              id="consortium-notes"
              placeholder="Notas adicionais sobre o consórcio..."
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
