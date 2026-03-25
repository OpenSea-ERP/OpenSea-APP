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
  Barcode,
  CalendarIcon,
  DollarSign,
  FileText,
  Landmark,
  Lightbulb,
  Plus,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InlineBankAccountForm } from './inline-bank-account-form';
import { InlineCategoryForm } from './inline-category-form';
import { InlineCreateModal } from './inline-create-modal';
import { InlineSupplierForm } from './inline-supplier-form';
import { PayableBatchTable } from './payable-batch-table';
import type { PayableWizardData } from './payable-wizard-modal';

// =============================================================================
// TYPES
// =============================================================================

interface PayableStepDetailsProps {
  data: PayableWizardData;
  onChange: (partial: Partial<PayableWizardData>) => void;
}

// =============================================================================
// SECTION HEADER (matches finance edit page pattern)
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PayableStepDetails({
  data,
  onChange,
}: PayableStepDetailsProps) {
  const isBatchMode = data.batchEntries.length >= 2;

  if (isBatchMode) {
    return <PayableBatchTable data={data} onChange={onChange} />;
  }

  return <SingleEntryForm data={data} onChange={onChange} />;
}

// =============================================================================
// SINGLE ENTRY FORM (Layout A)
// =============================================================================

function SingleEntryForm({ data, onChange }: PayableStepDetailsProps) {
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [showBankAccountCreate, setShowBankAccountCreate] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Track pre-filled fields from Step 1
  const [preFilledFields] = useState<Set<string>>(() => {
    const fields = new Set<string>();
    if (data.beneficiaryName) fields.add('beneficiaryName');
    if (data.expectedAmount > 0) fields.add('expectedAmount');
    if (data.dueDate) fields.add('dueDate');
    return fields;
  });

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Supplier pattern learning
  // ---------------------------------------------------------------------------

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
        const cat = categories.find(
          (c) => c.id === supplierSuggestion.categoryId,
        );
        if (cat) {
          updates.categoryId = cat.id;
          updates.categoryName = cat.name;
        }
      }

      if (supplierSuggestion.costCenterId) {
        updates.costCenterId = supplierSuggestion.costCenterId;
        const cc = costCenters.find(
          (c) => c.id === supplierSuggestion.costCenterId,
        );
        if (cc) updates.costCenterName = cc.name;
      }

      if (Object.keys(updates).length > 0) onChange(updates);
    }
  }, [
    supplierSuggestion,
    data.supplierName,
    data.categoryId,
    categories,
    costCenters,
    onChange,
  ]);

  // Default issue date
  useEffect(() => {
    if (!data.issueDate) {
      onChange({ issueDate: new Date().toISOString().split('T')[0] });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Tag helpers
  // ---------------------------------------------------------------------------

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      onChange({ tags: [...data.tags, trimmed] });
      setTagInput('');
    }
  }, [tagInput, data.tags, onChange]);

  const removeTag = useCallback(
    (tag: string) => onChange({ tags: data.tags.filter((t) => t !== tag) }),
    [data.tags, onChange],
  );

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const pfClass = (field: string) =>
    preFilledFields.has(field) ? 'border-violet-500/30' : '';

  const isBoleto = data.paymentType === 'BOLETO';
  const isPix = data.paymentType === 'PIX';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-5 overflow-y-auto max-h-[420px] pr-1">
      {/* ================================================================== */}
      {/* EXTRACTION SUMMARY CARD                                            */}
      {/* ================================================================== */}
      {(data.bankName || data.beneficiaryName || data.expectedAmount > 0) && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                isBoleto
                  ? 'bg-violet-500/15 text-violet-500'
                  : 'bg-emerald-500/15 text-emerald-500',
              )}
            >
              {isBoleto ? (
                <Barcode className="h-4 w-4" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold">
                Dados extraídos automaticamente
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isBoleto ? 'Via código de barras' : 'Via código Pix'}
                {data.bankName && ` · ${data.bankName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {data.expectedAmount > 0 && (
              <span className="font-semibold text-violet-600 dark:text-violet-400">
                {formatCurrency(data.expectedAmount)}
              </span>
            )}
            {data.dueDate && (
              <span className="text-muted-foreground">
                Venc.{' '}
                {format(parseISO(data.dueDate), 'dd/MM/yyyy', {
                  locale: ptBR,
                })}
              </span>
            )}
            {data.beneficiaryName && (
              <span className="text-muted-foreground truncate">
                {data.beneficiaryName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* SECTION 1: IDENTIFICAÇÃO                                           */}
      {/* ================================================================== */}
      <div className="space-y-3">
        <SectionHeader
          icon={FileText}
          title="Identificação"
          subtitle="Dados básicos da conta a pagar"
        />
        <div className="rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60 space-y-3">
          {/* Row: Descrição (full width) */}
          <div className="grid gap-1.5">
            <Label htmlFor="step2-description">
              Descrição <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="step2-description"
              value={data.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Descrição do lançamento"
            />
          </div>

          {/* Row: Beneficiário + Fornecedor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="step2-beneficiary">Beneficiário</Label>
              <Input
                id="step2-beneficiary"
                value={data.beneficiaryName}
                onChange={(e) =>
                  onChange({ beneficiaryName: e.target.value })
                }
                placeholder="Nome do beneficiário"
                className={pfClass('beneficiaryName')}
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <Label>Fornecedor</Label>
                {supplierSuggestion?.categoryId &&
                  data.categoryId === supplierSuggestion.categoryId && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                      <Lightbulb className="h-3 w-3" />
                      Sugestão
                    </span>
                  )}
              </div>
              <div className="flex items-center gap-1.5">
                <Select
                  value={data.supplierId}
                  onValueChange={(val) => {
                    const s = suppliers.find((s) => s.id === val);
                    onChange({
                      supplierId: val,
                      supplierName: s?.name ?? '',
                    });
                  }}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Selecionar..." />
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
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowSupplierCreate(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Row: Categoria + Centro de Custo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>
                Categoria <span className="text-rose-500">*</span>
              </Label>
              <div className="flex items-center gap-1.5">
                <Select
                  value={data.categoryId}
                  onValueChange={(val) => {
                    const c = categories.find((c) => c.id === val);
                    onChange({
                      categoryId: val,
                      categoryName: c?.name ?? '',
                    });
                  }}
                >
                  <SelectTrigger className="flex-1 h-9">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
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
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowCategoryCreate(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label>Centro de Custo</Label>
              <Select
                value={data.costCenterId}
                onValueChange={(val) => {
                  const cc = costCenters.find((c) => c.id === val);
                  onChange({
                    costCenterId: val,
                    costCenterName: cc?.name ?? '',
                  });
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 2: VALORES E DATAS                                         */}
      {/* ================================================================== */}
      <div className="space-y-3">
        <SectionHeader
          icon={DollarSign}
          title="Valores e Datas"
          subtitle="Montantes, vencimento e encargos"
        />
        <div className="rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60 space-y-3">
          {/* Row: Valor + Vencimento + Emissão */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="step2-amount">
                Valor (R$) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="step2-amount"
                type="number"
                step="0.01"
                min="0"
                value={data.expectedAmount || ''}
                onChange={(e) =>
                  onChange({
                    expectedAmount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0,00"
                className={pfClass('expectedAmount')}
              />
            </div>

            <DatePicker
              label="Vencimento"
              required
              value={data.dueDate}
              onChange={(d) => onChange({ dueDate: d })}
              className={pfClass('dueDate')}
            />

            <DatePicker
              label="Data de Emissão"
              value={data.issueDate}
              onChange={(d) => onChange({ issueDate: d })}
            />
          </div>

          {/* Row: Juros + Multa + Desconto */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="step2-interest">Juros (R$)</Label>
              <Input
                id="step2-interest"
                type="number"
                step="0.01"
                min="0"
                value={data.interest || ''}
                onChange={(e) =>
                  onChange({ interest: parseFloat(e.target.value) || 0 })
                }
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="step2-penalty">Multa (R$)</Label>
              <Input
                id="step2-penalty"
                type="number"
                step="0.01"
                min="0"
                value={data.penalty || ''}
                onChange={(e) =>
                  onChange({ penalty: parseFloat(e.target.value) || 0 })
                }
                placeholder="0,00"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="step2-discount">Desconto (R$)</Label>
              <Input
                id="step2-discount"
                type="number"
                step="0.01"
                min="0"
                value={data.discount || ''}
                onChange={(e) =>
                  onChange({ discount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Competência (optional, same row) */}
          <div className="grid grid-cols-3 gap-3">
            <DatePicker
              label="Competência"
              value={data.competenceDate}
              onChange={(d) => onChange({ competenceDate: d })}
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 3: CONTA BANCÁRIA                                          */}
      {/* ================================================================== */}
      <div className="space-y-3">
        <SectionHeader
          icon={Landmark}
          title="Conta Bancária"
          subtitle="Conta de pagamento associada"
        />
        <div className="rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Select
              value={data.bankAccountId}
              onValueChange={(val) => {
                const ba = bankAccounts.find((b) => b.id === val);
                onChange({
                  bankAccountId: val,
                  bankAccountName: ba?.name ?? '',
                });
              }}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder="Selecionar conta (opcional)" />
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
              className="h-9 w-9 shrink-0"
              onClick={() => setShowBankAccountCreate(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 4: OBSERVAÇÕES E TAGS                                      */}
      {/* ================================================================== */}
      <div className="space-y-3">
        <SectionHeader
          icon={Tag}
          title="Observações e Tags"
          subtitle="Notas adicionais e categorização"
        />
        <div className="rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60 space-y-3">
          {/* Tags */}
          <div className="grid gap-1.5">
            <Label>Tags</Label>
            <div className="flex items-center gap-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Adicionar tag e pressionar Enter"
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
              <div className="flex flex-wrap gap-1.5 mt-1">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-violet-400 hover:text-violet-600 dark:hover:text-violet-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="grid gap-1.5">
            <Label htmlFor="step2-notes">Observações</Label>
            <Textarea
              id="step2-notes"
              value={data.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              placeholder="Observações adicionais (opcional)"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* INLINE CREATE MODALS                                               */}
      {/* ================================================================== */}
      <InlineCreateModal
        open={showSupplierCreate}
        onOpenChange={setShowSupplierCreate}
        title="Novo Fornecedor"
      >
        <InlineSupplierForm
          onCreated={(supplier) => {
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
          onCreated={(category) => {
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
          onCreated={(bankAccount) => {
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

// =============================================================================
// DATE PICKER HELPER
// =============================================================================

function DatePicker({
  label,
  value,
  onChange,
  required = false,
  className,
}: {
  label: string;
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
  className?: string;
}) {
  const dateValue = value ? parseISO(value) : undefined;

  return (
    <div className="grid gap-1.5">
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
              className,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateValue
              ? format(dateValue, 'dd/MM/yyyy', { locale: ptBR })
              : 'Selecionar'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(date) => {
              if (date) onChange(format(date, 'yyyy-MM-dd'));
            }}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
