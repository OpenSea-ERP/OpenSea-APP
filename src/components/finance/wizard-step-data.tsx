'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  useFinanceCategories,
  useFinanceSuppliers,
} from '@/hooks/finance';
import { cn } from '@/lib/utils';
import { parseBoleto } from '@/lib/boleto-parser';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, CalendarIcon, Loader2, Plus, Zap } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { CostCenterAllocationComponent } from './cost-center-allocation';
import { InlineBankAccountForm } from './inline-bank-account-form';
import { InlineCategoryForm } from './inline-category-form';
import { InlineCreateModal } from './inline-create-modal';
import { InlineSupplierForm } from './inline-supplier-form';
import type { WizardData, WizardStep } from './payable-wizard-modal';

// ============================================================================
// PROPS
// ============================================================================

interface WizardStepDataProps {
  wizardData: WizardData;
  updateWizardData: (updates: Partial<WizardData>) => void;
  goToStep: (step: WizardStep) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WizardStepData({
  wizardData,
  updateWizardData,
  goToStep,
}: WizardStepDataProps) {
  // Inline modal states (managed here to avoid parent re-renders)
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [showBankAccountCreate, setShowBankAccountCreate] = useState(false);

  // Boleto auto-fill state
  const [parsingBoleto, setParsingBoleto] = useState(false);
  const [boletoAutoFilled, setBoletoAutoFilled] = useState(false);
  const [parsedBankName, setParsedBankName] = useState<string | null>(null);

  const handleBoletoAutoFill = useCallback(
    (input: string, source: 'linha_digitavel' | 'codigo_barras') => {
      const digits = input.replace(/\D/g, '');
      const expectedLen = source === 'linha_digitavel' ? 47 : 44;

      // Only parse when we have the full expected length
      if (digits.length !== expectedLen) {
        setBoletoAutoFilled(false);
        setParsedBankName(null);
        return;
      }

      setParsingBoleto(true);

      // Small delay for visual feedback
      setTimeout(() => {
        const result = parseBoleto(input);

        if (result.success) {
          const updates: Partial<typeof wizardData> = {};

          if (result.amount !== null && result.amount > 0) {
            updates.expectedAmount = result.amount;
          }

          if (result.dueDate) {
            updates.dueDate = result.dueDate;
          }

          // Sync the other field
          if (source === 'linha_digitavel') {
            updates.boletoDigitLine = input;
          } else {
            updates.boletoBarcode = input;
          }

          if (Object.keys(updates).length > 0) {
            updateWizardData(updates);
            setBoletoAutoFilled(true);
            setParsedBankName(result.bankName);

            const parts: string[] = [];
            if (result.amount) parts.push(`R$ ${result.amount.toFixed(2)}`);
            if (result.dueDate) {
              const [y, m, d] = result.dueDate.split('-');
              parts.push(`venc. ${d}/${m}/${y}`);
            }
            if (result.bankName) parts.push(result.bankName);

            toast.success(`Dados extraídos: ${parts.join(' · ')}`);
          }
        }

        setParsingBoleto(false);
      }, 150);
    },
    [updateWizardData, wizardData]
  );

  // Data fetching
  const { data: suppliersData } = useFinanceSuppliers();
  const suppliers = suppliersData?.suppliers ?? [];

  const { data: categoriesData } = useFinanceCategories({
    type: 'EXPENSE',
  });
  const allCategories = categoriesData?.categories ?? [];
  // Include BOTH type too
  const { data: bothCategoriesData } = useFinanceCategories({
    type: 'BOTH',
  });
  const bothCategories = bothCategoriesData?.categories ?? [];
  const categories = [...allCategories, ...bothCategories];

  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // Validation
  const validate = useCallback((): boolean => {
    if (!wizardData.description.trim()) {
      toast.error('Preencha a descrição.');
      return false;
    }
    if (!wizardData.categoryId) {
      toast.error('Selecione uma categoria.');
      return false;
    }
    if (wizardData.expectedAmount <= 0) {
      toast.error('Informe um valor maior que zero.');
      return false;
    }
    if (!wizardData.dueDate) {
      toast.error('Informe a data de vencimento.');
      return false;
    }
    return true;
  }, [wizardData]);

  const handleNext = () => {
    if (validate()) {
      goToStep(3);
    }
  };

  // --------------------------------------------------------------------------
  // Date picker helper
  // --------------------------------------------------------------------------

  const renderDatePicker = (
    label: string,
    value: string,
    onChange: (date: string) => void,
    required = false
  ) => {
    const dateValue = value ? parseISO(value) : undefined;

    return (
      <div className="space-y-2">
        <Label>
          {label}
          {required && ' *'}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateValue && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue
                ? format(dateValue, 'dd/MM/yyyy', { locale: ptBR })
                : 'Selecionar data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, 'yyyy-MM-dd'));
                }
              }}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="wizard-description">Descrição *</Label>
        <Input
          id="wizard-description"
          value={wizardData.description}
          onChange={(e) => updateWizardData({ description: e.target.value })}
          placeholder="Descrição do lançamento"
          required
        />
      </div>

      {/* Fornecedor */}
      <div className="space-y-2">
        <Label>Fornecedor</Label>
        <div className="flex items-center gap-2">
          <Select
            value={wizardData.supplierId}
            onValueChange={(val) => {
              const selected = suppliers.find((s) => s.id === val);
              updateWizardData({
                supplierId: val,
                supplierName: selected?.name ?? '',
              });
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowSupplierCreate(true)}
            title="Criar novo fornecedor"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categoria */}
      <div className="space-y-2">
        <Label>Categoria *</Label>
        <div className="flex items-center gap-2">
          <Select
            value={wizardData.categoryId}
            onValueChange={(val) => {
              const selected = categories.find((c) => c.id === val);
              updateWizardData({
                categoryId: val,
                categoryName: selected?.name ?? '',
              });
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowCategoryCreate(true)}
            title="Criar nova categoria"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Centro de Custo (single/rateio) */}
      <CostCenterAllocationComponent
        value={wizardData.costCenterAllocations}
        onChange={(allocations) =>
          updateWizardData({ costCenterAllocations: allocations })
        }
        totalAmount={wizardData.expectedAmount}
        useRateio={wizardData.useRateio}
        onToggleRateio={(useRateio) => updateWizardData({ useRateio })}
        costCenterId={wizardData.costCenterId}
        costCenterName={wizardData.costCenterName}
        onCostCenterChange={(id, name) =>
          updateWizardData({ costCenterId: id, costCenterName: name })
        }
      />

      {/* Conta Bancária */}
      <div className="space-y-2">
        <Label>Conta Bancária</Label>
        <div className="flex items-center gap-2">
          <Select
            value={wizardData.bankAccountId}
            onValueChange={(val) => {
              const selected = bankAccounts.find((ba) => ba.id === val);
              updateWizardData({
                bankAccountId: val,
                bankAccountName: selected?.name ?? '',
              });
            }}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecione uma conta (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((ba) => (
                <SelectItem key={ba.id} value={ba.id}>
                  {ba.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowBankAccountCreate(true)}
            title="Criar nova conta bancaria"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Valor */}
      <div className="space-y-2">
        <Label htmlFor="wizard-amount">Valor (R$) *</Label>
        <Input
          id="wizard-amount"
          type="number"
          step="0.01"
          min="0"
          value={wizardData.expectedAmount || ''}
          onChange={(e) =>
            updateWizardData({
              expectedAmount: parseFloat(e.target.value) || 0,
            })
          }
          placeholder="0,00"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        {renderDatePicker('Data de Emissão', wizardData.issueDate, (date) =>
          updateWizardData({ issueDate: date })
        )}
        {renderDatePicker(
          'Data de Vencimento',
          wizardData.dueDate,
          (date) => updateWizardData({ dueDate: date }),
          true
        )}
      </div>

      {renderDatePicker(
        'Data de Competência',
        wizardData.competenceDate,
        (date) => updateWizardData({ competenceDate: date })
      )}

      {/* Boleto-specific fields */}
      {wizardData.subType === 'BOLETO' && (
        <div className="space-y-4 p-3 bg-muted/50 rounded-lg border border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Dados do Boleto</p>
            {boletoAutoFilled && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                Preenchido automaticamente
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-digitline">Linha Digitável</Label>
            <div className="flex items-center gap-2">
              <Input
                id="wizard-digitline"
                value={wizardData.boletoDigitLine}
                onChange={(e) => {
                  updateWizardData({ boletoDigitLine: e.target.value });
                  handleBoletoAutoFill(e.target.value, 'linha_digitavel');
                }}
                placeholder="Cole a linha digitável (47 dígitos)"
                className="font-mono text-sm"
              />
              {parsingBoleto && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ao colar a linha digitável, o valor e vencimento serão preenchidos automaticamente
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-barcode">Código de Barras</Label>
            <Input
              id="wizard-barcode"
              value={wizardData.boletoBarcode}
              onChange={(e) => {
                updateWizardData({ boletoBarcode: e.target.value });
                handleBoletoAutoFill(e.target.value, 'codigo_barras');
              }}
              placeholder="Código de barras (44 dígitos)"
              className="font-mono text-sm"
            />
          </div>
          {parsedBankName && (
            <p className="text-xs text-muted-foreground">
              Banco identificado: <span className="font-medium">{parsedBankName}</span>
            </p>
          )}
        </div>
      )}

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="wizard-notes">Observações</Label>
        <Textarea
          id="wizard-notes"
          value={wizardData.notes}
          onChange={(e) => updateWizardData({ notes: e.target.value })}
          placeholder="Observações adicionais (opcional)"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => goToStep(1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleNext}>
          Próximo
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Inline Create Modals */}
      <InlineCreateModal
        open={showSupplierCreate}
        onOpenChange={setShowSupplierCreate}
        title="Novo Fornecedor"
      >
        <InlineSupplierForm
          onCreated={(supplier) => {
            setShowSupplierCreate(false);
            updateWizardData({
              supplierId: supplier.id,
              supplierName: supplier.name,
            });
          }}
          onCancel={() => setShowSupplierCreate(false)}
        />
      </InlineCreateModal>

      <InlineCreateModal
        open={showCategoryCreate}
        onOpenChange={setShowCategoryCreate}
        title="Nova Categoria"
      >
        <InlineCategoryForm
          onCreated={(category) => {
            setShowCategoryCreate(false);
            updateWizardData({
              categoryId: category.id,
              categoryName: category.name,
            });
          }}
          onCancel={() => setShowCategoryCreate(false)}
        />
      </InlineCreateModal>

      <InlineCreateModal
        open={showBankAccountCreate}
        onOpenChange={setShowBankAccountCreate}
        title="Nova Conta Bancária"
      >
        <InlineBankAccountForm
          onCreated={(bankAccount) => {
            setShowBankAccountCreate(false);
            updateWizardData({
              bankAccountId: bankAccount.id,
              bankAccountName: bankAccount.name,
            });
          }}
          onCancel={() => setShowBankAccountCreate(false)}
        />
      </InlineCreateModal>
    </div>
  );
}
