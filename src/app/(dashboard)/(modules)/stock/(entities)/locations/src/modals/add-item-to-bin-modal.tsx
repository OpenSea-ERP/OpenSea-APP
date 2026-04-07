'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ItemEntryFormModal } from '@/app/(dashboard)/(modules)/stock/(entities)/products/src/modals/item-entry-form-modal';
import {
  MobileVariantSelector,
  type VariantOption,
} from '@/components/mobile/mobile-variant-selector';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTemplate } from '@/hooks/stock/use-stock-other';
import { useBinDetail } from '../api/bins.queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itemsService } from '@/services/stock';
import {
  formatUnitAbbreviation,
  sanitizeQuantityInput,
} from '@/helpers/formatters';
import type {
  RegisterItemEntryRequest,
  TemplateAttribute,
} from '@/types/stock';
import {
  MapPin,
  Plus,
  Loader2,
  SlidersHorizontal,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================

interface AddItemToBinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binId: string;
}

interface FormData {
  quantity: string;
  attributes: Record<string, unknown>;
}

const INITIAL_FORM: FormData = { quantity: '1', attributes: {} };

// ============================================
// Mobile Attribute Fields
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
          Atributos
        </span>
      </div>
      <div className="space-y-2">
        {entries.map(([key, config]) => {
          const rawValue = values[key];
          const currentValue = String(rawValue ?? config.defaultValue ?? '');
          const isBooleanType =
            config.type === 'boolean' || (config.type as string) === 'sim/nao';

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
// Mobile Sheet
// ============================================

function MobileAddItemSheet({
  open,
  onOpenChange,
  binId,
}: AddItemToBinModalProps) {
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [addedCount, setAddedCount] = useState(0);

  const { data: binData } = useBinDetail(binId);
  const binAddress = binData?.bin?.address;

  const { data: template } = useTemplate(selectedVariant?.templateId || '');

  const itemAttributes = useMemo(() => {
    if (!template?.itemAttributes) return {};
    return template.itemAttributes as Record<string, TemplateAttribute>;
  }, [template]);

  const unitOfMeasure = useMemo(
    () => formatUnitAbbreviation(template?.unitOfMeasure),
    [template]
  );

  const parsedQuantity = useMemo(() => {
    const q = parseFloat(formData.quantity.replace(',', '.'));
    return isNaN(q) || q <= 0 ? 0 : Math.round(q * 1000) / 1000;
  }, [formData.quantity]);

  // Reset form when variant changes
  useEffect(() => {
    setFormData(INITIAL_FORM);
  }, [selectedVariant?.id]);

  // Pre-populate attribute defaults when template loads
  useEffect(() => {
    if (!itemAttributes || Object.keys(itemAttributes).length === 0) return;
    setFormData(prev => {
      const defaults: Record<string, unknown> = {};
      for (const [key, config] of Object.entries(itemAttributes)) {
        if (
          config.defaultValue !== undefined &&
          config.defaultValue !== null &&
          config.defaultValue !== ''
        ) {
          if (!(key in prev.attributes)) defaults[key] = config.defaultValue;
        }
      }
      if (Object.keys(defaults).length === 0) return prev;
      return { ...prev, attributes: { ...defaults, ...prev.attributes } };
    });
  }, [itemAttributes]);

  // Reset all state on close
  useEffect(() => {
    if (!open) {
      setSelectedVariant(null);
      setFormData(INITIAL_FORM);
      setAddedCount(0);
    }
  }, [open]);

  const registerEntry = useMutation({
    mutationFn: (data: RegisterItemEntryRequest) =>
      itemsService.registerEntry(data),
    onSuccess: () => {
      setAddedCount(prev => prev + 1);
      setFormData({ quantity: '1', attributes: {} });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['bin-detail'] });
      queryClient.invalidateQueries({ queryKey: ['zone-items'] });
      queryClient.invalidateQueries({ queryKey: ['bins'] });
      toast.success('Item adicionado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateAttribute = useCallback((key: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!selectedVariant || parsedQuantity <= 0) return;

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

    registerEntry.mutate({
      variantId: selectedVariant.id,
      binId,
      quantity: parsedQuantity,
      movementType: 'PURCHASE',
      attributes: parsedAttributes,
    });
  }, [
    selectedVariant,
    parsedQuantity,
    formData.attributes,
    itemAttributes,
    binId,
    registerEntry,
  ]);

  const canSubmit =
    !!selectedVariant && parsedQuantity > 0 && !registerEntry.isPending;

  // modal={false}: evita focus trap + body pointerEvents lock que entram em
  // conflito com o portal do MobileVariantSelector (renderizado em document.body).
  // dismissible={false}: previne fechamento por clique externo (drawer só fecha pelo X).
  // noBodyStyles: previne position:fixed no body em iOS Safari (Vaul iOS-specific).
  // repositionInputs={false}: previne jump quando teclado virtual aparece.
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      repositionInputs={false}
      dismissible={false}
      noBodyStyles
      modal={false}
    >
      <DrawerContent className="bg-slate-950 border-slate-700 [&>div:first-child]:hidden max-h-[92vh] flex flex-col">
        <VisuallyHidden>
          <DrawerTitle>Adicionar Item</DrawerTitle>
        </VisuallyHidden>

        {/* Header */}
        <div
          data-vaul-no-drag
          className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 shrink-0"
        >
          <button
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 active:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-slate-100">
              Adicionar Item
            </h2>
            {binAddress && (
              <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="font-mono truncate">{binAddress}</span>
              </p>
            )}
          </div>
          {addedCount > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
              <Check className="h-3 w-3" />
              {addedCount}
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div
          data-vaul-no-drag
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
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
          {selectedVariant && (
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
          {selectedVariant && Object.keys(itemAttributes).length > 0 && (
            <MobileAttributeFields
              attributes={itemAttributes}
              values={formData.attributes}
              onChange={updateAttribute}
              disabled={registerEntry.isPending}
            />
          )}
        </div>

        {/* Submit */}
        <div
          data-vaul-no-drag
          className="shrink-0 border-t border-slate-800 bg-slate-900/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm"
        >
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-colors',
              canSubmit
                ? 'bg-emerald-600 text-white active:bg-emerald-700'
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
      </DrawerContent>
    </Drawer>
  );
}

// ============================================
// Export — desktop uses NavigationWizardDialog,
// mobile uses the bottom-sheet quick-entry style
// ============================================

export function AddItemToBinModal({
  open,
  onOpenChange,
  binId,
}: AddItemToBinModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileAddItemSheet
        open={open}
        onOpenChange={onOpenChange}
        binId={binId}
      />
    );
  }

  return (
    <ItemEntryFormModal
      open={open}
      onOpenChange={onOpenChange}
      product={null}
      variant={null}
      initialBinId={binId}
      extraInvalidateKeys={[['bin-detail'], ['zone-items'], ['warehouse']]}
    />
  );
}
