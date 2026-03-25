'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  useFinanceCustomers,
} from '@/hooks/finance';
import { Plus, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { InlineBankAccountForm } from '../inline-bank-account-form';
import { InlineCategoryForm } from '../inline-category-form';
import { InlineCreateModal } from '../inline-create-modal';
import { InlineCostCenterForm } from '../inline-cost-center-form';
import { InlineSupplierForm } from '../inline-supplier-form';
import { InlineCustomerForm } from '../inline-customer-form';
import type { RecurringWizardData } from './recurring-wizard';

// =============================================================================
// TYPES
// =============================================================================

interface RecurringStepDetailsProps {
  data: RecurringWizardData;
  onChange: (partial: Partial<RecurringWizardData>) => void;
}

// =============================================================================
// PROPERTY ROW — label left, field right (130px label like payable)
// =============================================================================

function Row({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <div className="w-[130px] shrink-0 pt-1.5">
        <span className="text-sm text-muted-foreground">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// =============================================================================
// SECTION DIVIDER
// =============================================================================

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-3 pb-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <div className="flex-1 border-b border-border/40" />
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RecurringStepDetails({
  data,
  onChange,
}: RecurringStepDetailsProps) {
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [showCustomerCreate, setShowCustomerCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [showCostCenterCreate, setShowCostCenterCreate] = useState(false);
  const [showBankAccountCreate, setShowBankAccountCreate] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const { data: suppliersData } = useFinanceSuppliers();
  const suppliers = suppliersData?.suppliers ?? [];

  const { data: customersData } = useFinanceCustomers();
  const customers = customersData?.customers ?? [];

  const isPayable = data.type === 'PAYABLE';

  const { data: expenseCategoriesData } = useFinanceCategories({
    type: isPayable ? 'EXPENSE' : 'REVENUE',
  });
  const typedCategories = expenseCategoriesData?.categories ?? [];
  const { data: bothCategoriesData } = useFinanceCategories({ type: 'BOTH' });
  const bothCategories = bothCategoriesData?.categories ?? [];
  const categories = [
    ...typedCategories,
    ...bothCategories.filter(b => !typedCategories.some(e => e.id === b.id)),
  ];

  const { data: costCentersData } = useCostCenters();
  const costCenters = costCentersData?.costCenters ?? [];

  const { data: bankAccountsData } = useBankAccounts();
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  // ---------------------------------------------------------------------------
  // Tags
  // ---------------------------------------------------------------------------

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      onChange({ tags: [...data.tags, trimmed] });
      setTagInput('');
    }
  }, [tagInput, data.tags, onChange]);

  const removeTag = useCallback(
    (tag: string) => onChange({ tags: data.tags.filter(t => t !== tag) }),
    [data.tags, onChange]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-1">
      <div>
        {/* ============================================================= */}
        {/* IDENTIFICAÇÃO                                                  */}
        {/* ============================================================= */}
        <SectionDivider label="Identificação" />

        <Row label="Descrição" required>
          <Input
            value={data.description}
            onChange={e => onChange({ description: e.target.value })}
            placeholder="Ex: Aluguel do escritório"
            className="h-8"
          />
        </Row>

        {isPayable ? (
          <Row label="Fornecedor">
            <div className="flex items-center gap-1.5">
              <Select
                value={data.supplierId}
                onValueChange={val => {
                  const s = suppliers.find(s => s.id === val);
                  onChange({
                    supplierId: val,
                    supplierName: s?.name ?? '',
                  });
                }}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Selecionar..." />
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
                className="h-8 w-8 shrink-0"
                onClick={() => setShowSupplierCreate(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Row>
        ) : (
          <Row label="Cliente">
            <div className="flex items-center gap-1.5">
              <Select
                value={data.customerId}
                onValueChange={val => {
                  const c = customers.find(c => c.id === val);
                  onChange({
                    customerId: val,
                    customerName: c?.name ?? '',
                  });
                }}
              >
                <SelectTrigger className="flex-1 h-8">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setShowCustomerCreate(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Row>
        )}

        <Row label="Categoria" required>
          <div className="flex items-center gap-1.5">
            <Select
              value={data.categoryId}
              onValueChange={val => {
                const c = categories.find(c => c.id === val);
                onChange({ categoryId: val, categoryName: c?.name ?? '' });
              }}
            >
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setShowCategoryCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Row>

        {/* ============================================================= */}
        {/* VALORES                                                        */}
        {/* ============================================================= */}
        <SectionDivider label="Valores" />

        <Row label="Valor Esperado (R$)" required>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.expectedAmount || ''}
            onChange={e =>
              onChange({ expectedAmount: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
            className="h-8"
          />
        </Row>

        <Row label="Juros (% mensal)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.interestRate || ''}
            onChange={e =>
              onChange({ interestRate: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
            className="h-8"
          />
        </Row>

        <Row label="Multa (%)">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={data.penaltyRate || ''}
            onChange={e =>
              onChange({ penaltyRate: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
            className="h-8"
          />
        </Row>

        {/* ============================================================= */}
        {/* PAGAMENTO                                                      */}
        {/* ============================================================= */}
        <SectionDivider label="Pagamento" />

        <Row label="Conta Bancária">
          <div className="flex items-center gap-1.5">
            <Select
              value={data.bankAccountId}
              onValueChange={val => {
                const ba = bankAccounts.find(b => b.id === val);
                onChange({
                  bankAccountId: val,
                  bankAccountName: ba?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="Opcional" />
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
              className="h-8 w-8 shrink-0"
              onClick={() => setShowBankAccountCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Row>

        <Row label="Centro de Custo">
          <div className="flex items-center gap-1.5">
            <Select
              value={data.costCenterId}
              onValueChange={val => {
                const cc = costCenters.find(c => c.id === val);
                onChange({
                  costCenterId: val,
                  costCenterName: cc?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="flex-1 h-8">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {costCenters.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>
                    {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setShowCostCenterCreate(true)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Row>

        {/* ============================================================= */}
        {/* EXTRAS                                                         */}
        {/* ============================================================= */}
        <SectionDivider label="Extras" />

        <Row label="Tags">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Digitar e pressionar Enter"
                className="h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={addTag}
              >
                Adicionar
              </Button>
            </div>
            {data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded text-[11px] font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-200"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Row>

        <Row label="Observações">
          <Textarea
            value={data.notes}
            onChange={e => onChange({ notes: e.target.value })}
            placeholder="Opcional"
            rows={2}
            className="text-sm"
          />
        </Row>
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
            onChange({ supplierId: supplier.id, supplierName: supplier.name });
          }}
          onCancel={() => setShowSupplierCreate(false)}
        />
      </InlineCreateModal>

      <InlineCreateModal
        open={showCustomerCreate}
        onOpenChange={setShowCustomerCreate}
        title="Novo Cliente"
      >
        <InlineCustomerForm
          onCreated={customer => {
            setShowCustomerCreate(false);
            onChange({ customerId: customer.id, customerName: customer.name });
          }}
          onCancel={() => setShowCustomerCreate(false)}
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
        open={showCostCenterCreate}
        onOpenChange={setShowCostCenterCreate}
        title="Novo Centro de Custo"
      >
        <InlineCostCenterForm
          onCreated={costCenter => {
            setShowCostCenterCreate(false);
            onChange({
              costCenterId: costCenter.id,
              costCenterName: costCenter.name,
            });
          }}
          onCancel={() => setShowCostCenterCreate(false)}
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
