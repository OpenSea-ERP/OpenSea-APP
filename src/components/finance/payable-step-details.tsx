'use client';

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
  useCostCenters,
  useFinanceCategories,
  useFinanceSuppliers,
} from '@/hooks/finance';
import { useLastSupplierEntry } from '@/hooks/finance/use-ocr';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarIcon,
  Lightbulb,
  Plus,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InlineBankAccountForm } from './inline-bank-account-form';
import { InlineCategoryForm } from './inline-category-form';
import { InlineCreateModal } from './inline-create-modal';
import { InlineSupplierForm } from './inline-supplier-form';
import { PayableBatchTable } from './payable-batch-table';
import type { PayableWizardData } from './payable-wizard-modal';

// ============================================================================
// TYPES
// ============================================================================

interface PayableStepDetailsProps {
  data: PayableWizardData;
  onChange: (partial: Partial<PayableWizardData>) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Checks if a field was pre-filled from extraction (barcode/OCR/Pix).
 * Pre-filled fields get a violet border highlight.
 */
function isPreFilled(value: string | number): boolean {
  if (typeof value === 'number') return value > 0;
  return value.length > 0;
}

const formatCurrencyInput = (value: number): string => {
  if (value === 0) return '';
  return value.toString();
};

// ============================================================================
// COMPONENT
// ============================================================================

export function PayableStepDetails({ data, onChange }: PayableStepDetailsProps) {
  // --------------------------------------------------------------------------
  // Batch mode detection
  // --------------------------------------------------------------------------

  const isBatchMode = data.batchEntries.length >= 2;

  if (isBatchMode) {
    return <PayableBatchTable data={data} onChange={onChange} />;
  }

  return <SingleEntryForm data={data} onChange={onChange} />;
}

// ============================================================================
// SINGLE ENTRY FORM (Layout A)
// ============================================================================

function SingleEntryForm({
  data,
  onChange,
}: PayableStepDetailsProps) {
  // Inline create modals
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [showBankAccountCreate, setShowBankAccountCreate] = useState(false);

  // Tag input
  const [tagInput, setTagInput] = useState('');

  // Track which fields were pre-filled from Step 1 extraction
  const [preFilledFields] = useState<Set<string>>(() => {
    const fields = new Set<string>();
    if (data.beneficiaryName) fields.add('beneficiaryName');
    if (data.expectedAmount > 0) fields.add('expectedAmount');
    if (data.dueDate) fields.add('dueDate');
    return fields;
  });

  // --------------------------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------------------------

  const { data: suppliersData } = useFinanceSuppliers();
  const suppliers = suppliersData?.suppliers ?? [];

  const { data: categoriesData } = useFinanceCategories({ type: 'EXPENSE' });
  const expenseCategories = categoriesData?.categories ?? [];
  const { data: bothCategoriesData } = useFinanceCategories({ type: 'BOTH' });
  const bothCategories = bothCategoriesData?.categories ?? [];
  const categories = [...expenseCategories, ...bothCategories];

  const { data: costCentersData } = useCostCenters();
  const costCenters = costCentersData?.costCenters ?? [];

  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // --------------------------------------------------------------------------
  // Supplier pattern learning
  // --------------------------------------------------------------------------

  const { data: supplierSuggestion } = useLastSupplierEntry(data.supplierName);
  const lastAppliedSupplier = useRef<string>('');

  useEffect(() => {
    if (
      supplierSuggestion &&
      data.supplierName &&
      data.supplierName !== lastAppliedSupplier.current &&
      !data.categoryId
    ) {
      lastAppliedSupplier.current = data.supplierName;
      const updates: Partial<PayableWizardData> = {};

      if (supplierSuggestion.categoryId) {
        const cat = categories.find(c => c.id === supplierSuggestion.categoryId);
        if (cat) {
          updates.categoryId = cat.id;
          updates.categoryName = cat.name;
        }
      }

      if (supplierSuggestion.costCenterId) {
        updates.costCenterId = supplierSuggestion.costCenterId;
        const cc = costCenters.find(c => c.id === supplierSuggestion.costCenterId);
        if (cc) {
          updates.costCenterName = cc.name;
        }
      }

      if (Object.keys(updates).length > 0) {
        onChange(updates);
      }
    }
  }, [
    supplierSuggestion,
    data.supplierName,
    data.categoryId,
    categories,
    costCenters,
    onChange,
  ]);

  // --------------------------------------------------------------------------
  // Default issue date
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (!data.issueDate) {
      onChange({ issueDate: new Date().toISOString().split('T')[0] });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --------------------------------------------------------------------------
  // Tag helpers
  // --------------------------------------------------------------------------

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      onChange({ tags: [...data.tags, trimmed] });
      setTagInput('');
    }
  }, [tagInput, data.tags, onChange]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange({ tags: data.tags.filter(t => t !== tag) });
    },
    [data.tags, onChange]
  );

  // --------------------------------------------------------------------------
  // Pre-filled border class
  // --------------------------------------------------------------------------

  const preFilledBorder = (field: string) =>
    preFilledFields.has(field) ? 'border-violet-500/30' : '';

  // --------------------------------------------------------------------------
  // Date picker helper
  // --------------------------------------------------------------------------

  const renderDatePicker = (
    label: string,
    value: string,
    onDateChange: (date: string) => void,
    required = false,
    fieldKey?: string
  ) => {
    const dateValue = value ? parseISO(value) : undefined;
    const hasPreFill = fieldKey && preFilledFields.has(fieldKey);

    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-9',
                !dateValue && 'text-muted-foreground',
                hasPreFill && 'border-violet-500/30'
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
              onSelect={date => {
                if (date) {
                  onDateChange(format(date, 'yyyy-MM-dd'));
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
    <div className="space-y-4 overflow-y-auto max-h-[420px] pr-1">
      <div className="grid grid-cols-2 gap-4">
        {/* 1. Descrição */}
        <div className="space-y-1.5">
          <Label htmlFor="step2-description">
            Descrição <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="step2-description"
            value={data.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder="Descrição do lançamento"
          />
        </div>

        {/* 2. Beneficiário */}
        <div className="space-y-1.5">
          <Label htmlFor="step2-beneficiary">Beneficiário</Label>
          <Input
            id="step2-beneficiary"
            value={data.beneficiaryName}
            onChange={e => onChange({ beneficiaryName: e.target.value })}
            placeholder="Nome do beneficiário"
            className={preFilledBorder('beneficiaryName')}
          />
        </div>

        {/* 3. Fornecedor */}
        <div className="space-y-1.5">
          <Label>Fornecedor</Label>
          <div className="flex items-center gap-2">
            <Select
              value={data.supplierId}
              onValueChange={val => {
                const selected = suppliers.find(s => s.id === val);
                onChange({
                  supplierId: val,
                  supplierName: selected?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
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
              className="h-9 w-9 shrink-0"
              onClick={() => setShowSupplierCreate(true)}
              title="Criar novo fornecedor"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 4. Categoria */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label>
              Categoria <span className="text-rose-500">*</span>
            </Label>
            {supplierSuggestion?.categoryId &&
              data.categoryId === supplierSuggestion.categoryId && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3" />
                  Sugestão automática
                </span>
              )}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={data.categoryId}
              onValueChange={val => {
                const selected = categories.find(c => c.id === val);
                onChange({
                  categoryId: val,
                  categoryName: selected?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="flex-1 h-9">
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowCategoryCreate(true)}
              title="Criar nova categoria"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 5. Centro de Custo */}
        <div className="space-y-1.5">
          <Label>Centro de Custo</Label>
          <Select
            value={data.costCenterId}
            onValueChange={val => {
              const selected = costCenters.find(c => c.id === val);
              onChange({
                costCenterId: val,
                costCenterName: selected?.name ?? '',
              });
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Selecione (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {costCenters.map(cc => (
                <SelectItem key={cc.id} value={cc.id}>
                  {cc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 6. Conta Bancária */}
        <div className="space-y-1.5">
          <Label>Conta Bancária</Label>
          <div className="flex items-center gap-2">
            <Select
              value={data.bankAccountId}
              onValueChange={val => {
                const selected = bankAccounts.find(ba => ba.id === val);
                onChange({
                  bankAccountId: val,
                  bankAccountName: selected?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map(ba => (
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
              className="h-9 w-9 shrink-0"
              onClick={() => setShowBankAccountCreate(true)}
              title="Criar nova conta bancária"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 7. Valor */}
        <div className="space-y-1.5">
          <Label htmlFor="step2-amount">
            Valor (R$) <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="step2-amount"
            type="number"
            step="0.01"
            min="0"
            value={formatCurrencyInput(data.expectedAmount)}
            onChange={e =>
              onChange({ expectedAmount: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
            className={preFilledBorder('expectedAmount')}
          />
        </div>

        {/* 8. Data de Emissão */}
        {renderDatePicker('Data de Emissão', data.issueDate, date =>
          onChange({ issueDate: date })
        )}

        {/* 9. Vencimento */}
        {renderDatePicker(
          'Vencimento',
          data.dueDate,
          date => onChange({ dueDate: date }),
          true,
          'dueDate'
        )}

        {/* 10. Competência */}
        {renderDatePicker('Competência', data.competenceDate, date =>
          onChange({ competenceDate: date })
        )}

        {/* 11. Juros */}
        <div className="space-y-1.5">
          <Label htmlFor="step2-interest">Juros (R$)</Label>
          <Input
            id="step2-interest"
            type="number"
            step="0.01"
            min="0"
            value={data.interest || ''}
            onChange={e =>
              onChange({ interest: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
          />
        </div>

        {/* 12. Multa */}
        <div className="space-y-1.5">
          <Label htmlFor="step2-penalty">Multa (R$)</Label>
          <Input
            id="step2-penalty"
            type="number"
            step="0.01"
            min="0"
            value={data.penalty || ''}
            onChange={e =>
              onChange({ penalty: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
          />
        </div>

        {/* 13. Desconto */}
        <div className="space-y-1.5">
          <Label htmlFor="step2-discount">Desconto (R$)</Label>
          <Input
            id="step2-discount"
            type="number"
            step="0.01"
            min="0"
            value={data.discount || ''}
            onChange={e =>
              onChange({ discount: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
          />
        </div>

        {/* 14. Tags */}
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <div className="flex items-center gap-2">
            <Input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Adicionar tag"
              className="h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={addTag}
            >
              Adicionar
            </Button>
          </div>
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {data.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-secondary px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 15. Observações (full width) */}
        <div className="col-span-2 space-y-1.5">
          <Label htmlFor="step2-notes">Observações</Label>
          <Textarea
            id="step2-notes"
            value={data.notes}
            onChange={e => onChange({ notes: e.target.value })}
            placeholder="Observações adicionais (opcional)"
            rows={3}
          />
        </div>
      </div>

      {/* Inline Create Modals */}
      <InlineCreateModal
        open={showSupplierCreate}
        onOpenChange={setShowSupplierCreate}
        title="Novo Fornecedor"
      >
        <InlineSupplierForm
          onCreated={supplier => {
            setShowSupplierCreate(false);
            onChange({
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
          onCreated={category => {
            setShowCategoryCreate(false);
            onChange({
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
          onCreated={bankAccount => {
            setShowBankAccountCreate(false);
            onChange({
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
