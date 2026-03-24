'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import {
  MobileVariantSelector,
  type VariantOption,
} from '@/components/mobile/mobile-variant-selector';
import { useAllBins } from '@/app/(dashboard)/(modules)/stock/(entities)/locations/src/api/bins.queries';
import { useTemplate } from '@/hooks/stock/use-stock-other';
import { itemsService } from '@/services/stock/items.service';
import { scanSuccess, scanError } from '@/lib/scan-feedback';
import {
  formatUnitAbbreviation,
  sanitizeQuantityInput,
} from '@/helpers/formatters';
import type {
  Bin,
  RegisterItemEntryRequest,
  TemplateAttribute,
} from '@/types/stock';
import {
  MapPin,
  Search,
  Check,
  Loader2,
  Plus,
  ChevronDown,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

interface FormData {
  quantity: string;
  attributes: Record<string, unknown>;
}

const INITIAL_FORM: FormData = {
  quantity: '1',
  attributes: {},
};

// ============================================
// Mobile Bin Selector
// ============================================

function MobileBinSelector({
  value,
  onChange,
  disabled,
}: {
  value: Bin | null;
  onChange: (bin: Bin | null) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: bins = [], isLoading } = useAllBins();

  const filtered = useMemo(() => {
    if (!search.trim()) return bins;
    const q = search.toLowerCase();
    return bins.filter(b => b.address.toLowerCase().includes(q));
  }, [bins, search]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
          value
            ? 'border-sky-500/30 bg-sky-500/5'
            : 'border-slate-700/50 bg-slate-800/60',
          disabled && 'opacity-50'
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            value ? 'bg-sky-500/20' : 'bg-slate-700/60'
          )}
        >
          <MapPin
            className={cn(
              'h-4 w-4',
              value ? 'text-sky-400' : 'text-slate-400'
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          {value ? (
            <>
              <p className="truncate font-mono text-sm font-medium text-slate-100">
                {value.address}
              </p>
              <p className="text-[11px] text-slate-500">
                {value.currentOccupancy}
                {value.capacity ? `/${value.capacity}` : ''} itens
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Selecionar nicho (bin)...</p>
          )}
        </div>
        {value ? (
          <button
            onClick={e => {
              e.stopPropagation();
              onChange(null);
            }}
            className="shrink-0 p-1 text-slate-500 active:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <MobileTopBar
        title="Selecionar Nicho"
        showBack
        rightContent={
          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-slate-400 active:text-slate-200"
          >
            Fechar
          </button>
        }
      />
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
            placeholder="Buscar endereço..."
            autoFocus
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 font-mono text-sm text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Nenhum nicho encontrado
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(bin => {
              const isSelected = value?.id === bin.id;
              const isEmpty = bin.currentOccupancy === 0;
              return (
                <button
                  key={bin.id}
                  onClick={() => {
                    onChange(bin);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors active:bg-slate-700/60',
                    isSelected
                      ? 'bg-sky-500/10 border border-sky-500/30'
                      : 'bg-slate-800/40'
                  )}
                >
                  <div
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full',
                      isEmpty ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                  <span className="flex-1 truncate font-mono text-sm font-medium text-slate-200">
                    {bin.address}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">
                    {bin.currentOccupancy}
                    {bin.capacity ? `/${bin.capacity}` : ''}
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-sky-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Template Attributes (Mobile)
// ============================================

function MobileAttributeFields({
  attributes,
  values,
  onChange,
  disabled,
}: {
  attributes: Record<string, TemplateAttribute>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}) {
  const entries = Object.entries(attributes);
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-slate-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Atributos do Template
        </span>
      </div>
      <div className="space-y-2">
        {entries.map(([key, config]) => {
          const rawValue = values[key];
          const currentValue = String(rawValue ?? config.defaultValue ?? '');
          const isBooleanType =
            config.type === 'boolean' ||
            (config.type as string) === 'sim/nao';

          if (isBooleanType) {
            const isChecked =
              rawValue === true ||
              currentValue === 'true' ||
              currentValue === 'sim' ||
              currentValue === '1';
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/60 p-3"
              >
                <span className="text-sm text-slate-200">
                  {config.label || key}
                  {config.required && (
                    <span className="ml-1 text-rose-400">*</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => !disabled && onChange(key, !isChecked)}
                  disabled={disabled}
                  className={cn(
                    'h-7 w-12 rounded-full transition-colors',
                    isChecked ? 'bg-indigo-500' : 'bg-slate-600'
                  )}
                >
                  <div
                    className={cn(
                      'mx-0.5 h-6 w-6 rounded-full bg-white transition-transform',
                      isChecked && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            );
          }

          if (config.type === 'select') {
            return (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  {config.label || key}
                  {config.required && (
                    <span className="ml-1 text-rose-400">*</span>
                  )}
                </label>
                <select
                  value={currentValue}
                  onChange={e => onChange(key, e.target.value)}
                  disabled={disabled}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-base text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Selecione...</option>
                  {config.options?.map(opt => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          const isNumber = config.type === 'number';
          const unit = config.unitOfMeasure || '';

          return (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">
                {config.label || key}
                {config.required && (
                  <span className="ml-1 text-rose-400">*</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={config.type === 'date' ? 'date' : 'text'}
                  inputMode={isNumber ? 'decimal' : undefined}
                  value={currentValue}
                  onChange={e => {
                    if (isNumber) {
                      // Store raw string during editing (converted to number on submit)
                      onChange(key, e.target.value.replace(/[^0-9.,]/g, ''));
                    } else {
                      onChange(key, e.target.value);
                    }
                  }}
                  placeholder={config.placeholder || ''}
                  disabled={disabled}
                  className={cn(
                    'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-base text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                    unit && 'pr-12'
                  )}
                />
                {unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// Main Page
// ============================================

export default function QuickEntryPage() {
  const queryClient = useQueryClient();

  // Persistent selections
  const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    null
  );

  // Form state (resets after each entry)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  // Counter
  const [addedCount, setAddedCount] = useState(0);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  // Fetch template for dynamic attributes when variant changes
  const { data: template } = useTemplate(selectedVariant?.templateId || '');

  const itemAttributes = useMemo(() => {
    if (!template?.itemAttributes) return {};
    return template.itemAttributes as Record<string, TemplateAttribute>;
  }, [template]);

  const hasAttributes = Object.keys(itemAttributes).length > 0;

  const unitOfMeasure = useMemo(
    () => formatUnitAbbreviation(template?.unitOfMeasure),
    [template]
  );

  const parsedQuantity = useMemo(() => {
    const q = parseFloat(formData.quantity.replace(',', '.'));
    return isNaN(q) || q <= 0 ? 0 : Math.round(q * 1000) / 1000;
  }, [formData.quantity]);

  // Reset attributes when variant changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, attributes: {} }));
  }, [selectedVariant?.id]);

  // Mutation
  const registerEntry = useMutation({
    mutationFn: (data: RegisterItemEntryRequest) =>
      itemsService.registerEntry(data),
    onSuccess: () => {
      scanSuccess();
      setAddedCount(prev => prev + 1);
      setLastAdded(
        `${selectedVariant?.productName} · ${selectedVariant?.name}`
      );

      // Reset form but keep bin and variant
      setFormData({ quantity: '1', attributes: {} });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['bins'] });

      toast.success('Item registrado com sucesso!');
    },
    onError: (error: Error) => {
      scanError();
      toast.error(`Erro ao registrar: ${error.message}`);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!selectedVariant || !selectedBin) {
      toast.error('Selecione uma variante e um nicho');
      return;
    }
    if (parsedQuantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    // Convert numeric attribute strings to actual numbers for the API
    const parsedAttributes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData.attributes)) {
      const attrDef = itemAttributes[key];
      if (attrDef?.type === 'number' && typeof value === 'string') {
        const num = parseFloat(value.replace(',', '.'));
        parsedAttributes[key] = isNaN(num) ? value : num;
      } else {
        parsedAttributes[key] = value;
      }
    }

    const data: RegisterItemEntryRequest = {
      variantId: selectedVariant.id,
      binId: selectedBin.id,
      quantity: parsedQuantity,
      movementType: 'PURCHASE',
      attributes: parsedAttributes,
    };

    registerEntry.mutate(data);
  }, [selectedVariant, selectedBin, parsedQuantity, formData.attributes, itemAttributes, registerEntry]);

  const updateAttribute = useCallback((key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  }, []);

  const canSubmit =
    !!selectedVariant &&
    !!selectedBin &&
    parsedQuantity > 0 &&
    !registerEntry.isPending;

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col bg-slate-950">
      <MobileTopBar title="Cadastro Rápido" subtitle="Entrada de itens" showBack />

      <div className="flex-1 space-y-4 px-4 py-4">
        {/* Counter badge */}
        {addedCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20">
              <Check className="h-4 w-4 text-green-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-green-400">
                {addedCount} {addedCount === 1 ? 'item adicionado' : 'itens adicionados'}
              </p>
              {lastAdded && (
                <p className="truncate text-[11px] text-green-500/70">
                  Último: {lastAdded}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bin selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nicho (Bin)
          </label>
          <MobileBinSelector
            value={selectedBin}
            onChange={setSelectedBin}
            disabled={registerEntry.isPending}
          />
        </div>

        {/* Variant selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Variante
          </label>
          <MobileVariantSelector
            value={selectedVariant}
            onChange={setSelectedVariant}
            disabled={registerEntry.isPending}
          />
        </div>

        {/* Quantity */}
        {selectedVariant && selectedBin && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Quantidade
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const q = Math.max(1, parsedQuantity - 1);
                  setFormData(prev => ({ ...prev, quantity: String(q) }));
                }}
                disabled={registerEntry.isPending || parsedQuantity <= 1}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 text-xl font-bold text-slate-300 active:bg-slate-700 disabled:opacity-30"
              >
                −
              </button>
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.quantity}
                  onChange={e => {
                    const sanitized = sanitizeQuantityInput(e.target.value);
                    setFormData(prev => ({ ...prev, quantity: sanitized }));
                  }}
                  disabled={registerEntry.isPending}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 text-center text-lg font-bold tabular-nums text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {unitOfMeasure && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                    {unitOfMeasure}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const q = parsedQuantity + 1;
                  setFormData(prev => ({ ...prev, quantity: String(q) }));
                }}
                disabled={registerEntry.isPending}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700/50 bg-slate-800/60 text-xl font-bold text-slate-300 active:bg-slate-700 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Template attributes */}
        {selectedVariant && selectedBin && hasAttributes && (
          <MobileAttributeFields
            attributes={itemAttributes}
            values={formData.attributes}
            onChange={updateAttribute}
            disabled={registerEntry.isPending}
          />
        )}
      </div>

      {/* Submit button */}
      <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur-sm">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors',
            canSubmit
              ? 'bg-indigo-500 text-white active:bg-indigo-600'
              : 'bg-slate-800 text-slate-500'
          )}
        >
          {registerEntry.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Adicionar Item
            </>
          )}
        </button>
      </div>
    </div>
  );
}
