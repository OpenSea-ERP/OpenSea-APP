'use client';

import { useState, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  ArrowRightLeft,
  PackageMinus,
  PackagePlus,
  MapPin,
  Tag,
  Barcode,
  Factory,
  Copy,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
// TODO: re-add permission checks once mobile RBAC is stable
// import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { TransferFlow } from '@/components/mobile/transfer-flow';
import { ExitFlow } from '@/components/mobile/exit-flow';
import type { LookupResult } from '@/services/stock/lookup.service';

// ============================================
// Helpers
// ============================================

/** Returns relative luminance (0–1) from a hex color to decide contrast */
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function get(result: LookupResult, key: string): string | undefined {
  const value = result.entity[key];
  if (value == null) return undefined;
  return String(value);
}


const UOM_ABBREV: Record<string, string> = {
  UNITS: 'un',
  METERS: 'm',
  KILOGRAMS: 'kg',
  GRAMS: 'g',
  LITERS: 'L',
  MILLILITERS: 'mL',
  SQUARE_METERS: 'm²',
  PAIRS: 'par',
  BOXES: 'cx',
  PACKS: 'pct',
};

// ============================================
// Pattern / Color helpers
// ============================================

function getPatternStyle(
  colorHex: string,
  secondaryColorHex?: string,
  pattern?: string
): React.CSSProperties {
  const secondary = secondaryColorHex || colorHex;
  const p = pattern || 'SOLID';

  switch (p) {
    case 'STRIPED':
      return {
        background: `repeating-linear-gradient(135deg, ${colorHex}, ${colorHex} 6px, ${secondary} 6px, ${secondary} 12px)`,
      };
    case 'PLAID':
      return {
        background: `repeating-linear-gradient(0deg, ${secondary}40 0px, ${secondary}40 3px, transparent 3px, transparent 10px), repeating-linear-gradient(90deg, ${secondary}40 0px, ${secondary}40 3px, transparent 3px, transparent 10px), ${colorHex}`,
      };
    case 'GRADIENT':
      return {
        background: `linear-gradient(135deg, ${colorHex}, ${secondary})`,
      };
    case 'PRINTED':
      return {
        background: `radial-gradient(circle at 20% 30%, ${secondary} 4px, transparent 4px), radial-gradient(circle at 70% 60%, ${secondary} 4px, transparent 4px), radial-gradient(circle at 45% 80%, ${secondary} 3px, transparent 3px), ${colorHex}`,
      };
    case 'JACQUARD':
      return {
        background: `repeating-conic-gradient(${colorHex} 0% 25%, ${secondary} 0% 50%) 50% / 14px 14px`,
      };
    default:
      if (secondaryColorHex && secondaryColorHex !== colorHex) {
        return {
          background: `linear-gradient(135deg, ${colorHex} 50%, ${secondaryColorHex} 50%)`,
        };
      }
      return { backgroundColor: colorHex };
  }
}

// ============================================
// Hero Banner
// ============================================

interface HeroBannerProps {
  result: LookupResult;
  line1: string;
  line2?: string;
  quantityLabel?: string;
}

function HeroBanner({ result, line1, line2, quantityLabel }: HeroBannerProps) {
  const colorHex = get(result, 'colorHex');
  const hasColor = !!colorHex;

  const bannerStyle: React.CSSProperties = hasColor
    ? getPatternStyle(
        colorHex!,
        get(result, 'secondaryColorHex'),
        get(result, 'pattern')
      )
    : {
        background:
          'linear-gradient(135deg, rgb(99 102 241 / 0.25), rgb(15 23 42))',
      };

  const isLight = hasColor && luminance(colorHex!) > 0.35;
  const pattern = get(result, 'pattern') || 'SOLID';
  const isBusyPattern = ['STRIPED', 'PLAID', 'JACQUARD'].includes(pattern);

  const pillColor = isBusyPattern
    ? (isLight ? 'bg-black/70' : 'bg-white/70')
    : (isLight ? 'bg-black/40' : 'bg-white/40');
  const bgPanel = isBusyPattern
    ? 'bg-slate-900 border border-white/10'
    : (isLight ? 'bg-black/40 backdrop-blur-sm' : 'bg-white/15 backdrop-blur-sm');
  const shadow = '0 1px 4px rgb(0 0 0 / 0.6)';

  return (
    <div className="relative overflow-hidden rounded-t-lg border-b border-white/10" style={{ minHeight: 128 }}>
      {/* Pattern/color layer */}
      <div className="absolute inset-0" style={bannerStyle} />

      {/* Custom drag handle pill */}
      <div className={cn('relative mx-auto mt-4 h-1.5 w-12 rounded-full', pillColor)} />

      {/* Content overlay */}
      <div className="absolute inset-x-0 bottom-0 flex items-stretch gap-3 px-4 pb-3">
        {/* Text panel */}
        <div className={cn('flex min-w-0 flex-1 flex-col justify-center rounded-xl px-3 py-2', bgPanel)}>
          <p
            className="truncate text-lg font-bold text-white leading-tight"
            style={{ textShadow: shadow }}
          >
            {line1}
          </p>
          {line2 && (
            <p
              className="mt-0.5 truncate text-sm font-medium text-slate-200"
              style={{ textShadow: shadow }}
            >
              {line2}
            </p>
          )}
        </div>

        {/* Quantity badge */}
        {quantityLabel && (
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-xl px-3',
              bgPanel
            )}
          >
            <span
              className="text-lg font-bold tabular-nums text-white"
              style={{ textShadow: shadow }}
            >
              {quantityLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Detail Cell (for 2-column grid)
// ============================================

function DetailCell({
  icon,
  label,
  value,
  badge,
  badgeColor,
  copyable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: boolean;
  badgeColor?: { text: string; bg: string; dot: string };
  copyable?: boolean;
}) {
  const handleCopy = () => {
    if (!copyable) return;
    navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copiado`);
    });
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl bg-slate-800/50 px-3 py-2.5',
        copyable && 'active:bg-slate-700/60 cursor-pointer'
      )}
      onClick={handleCopy}
    >
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-500">{label}</p>
        {badge && badgeColor ? (
          <span
            className={cn(
              'mt-0.5 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
              badgeColor.bg,
              badgeColor.text
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', badgeColor.dot)} />
            {value}
          </span>
        ) : (
          <p className="truncate text-sm font-medium text-slate-200">{value}</p>
        )}
      </div>
      {copyable && (
        <Copy className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" />
      )}
    </div>
  );
}

// ============================================
// Action Button
// ============================================

function ActionButton({
  icon,
  label,
  colorClass,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 py-3 text-xs font-medium active:bg-slate-700/80',
        colorClass
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ============================================
// Shared Body — used by both Sheet (mobile) and Dialog (desktop)
// ============================================

interface ScanResultBodyProps {
  result: LookupResult;
  onClose: () => void;
  variant: 'mobile' | 'desktop';
}

function ScanResultBody({ result, onClose, variant }: ScanResultBodyProps) {
  const [showTransfer, setShowTransfer] = useState(false);
  const [showExit, setShowExit] = useState(false);

  const resetSubFlow = useCallback(() => {
    setShowTransfer(false);
    setShowExit(false);
  }, []);

  const handleSuccess = useCallback(() => {
    resetSubFlow();
    onClose();
  }, [onClose, resetSubFlow]);

  // --- Extract fields ---
  const templateName = get(result, 'templateName');
  const productName = get(result, 'productName');
  const variantName = get(result, 'variantName');
  const reference = get(result, 'reference');
  const manufacturerName = get(result, 'manufacturerName');
  const categoryName = get(result, 'categoryName');
  const sku = get(result, 'sku');
  const binLabel = get(result, 'binLabel') || get(result, 'location');
  const customFields =
    (result.entity.customFields as Array<{
      key: string;
      label: string;
      value: unknown;
      type: string;
      unitOfMeasure?: string;
    }>) || [];
  const quantity = get(result, 'quantity');
  const rawUom = result.entity.unitOfMeasure;
  const unitOfMeasure =
    typeof rawUom === 'string'
      ? rawUom
      : rawUom && typeof rawUom === 'object' && 'value' in rawUom
        ? String((rawUom as Record<string, unknown>).value)
        : '';

  // --- Build banner lines (2 lines only) ---
  const line1 =
    [templateName, productName].filter(Boolean).join(' · ') || result.entityId;
  const line2Parts = [
    reference ? `Ref: ${reference}` : null,
    variantName,
  ].filter(Boolean);
  const line2 = line2Parts.length ? line2Parts.join(' · ') : undefined;

  // --- Quantity label ---
  const uomAbbr =
    UOM_ABBREV[unitOfMeasure] || unitOfMeasure.toLowerCase().slice(0, 3);
  const quantityLabel =
    quantity != null
      ? `${quantity}${uomAbbr ? ` ${uomAbbr}` : ''}`
      : undefined;

  const isItem = result.entityType === 'ITEM';

  if (showTransfer && isItem) {
    return (
      <TransferFlow
        item={result}
        onClose={resetSubFlow}
        onSuccess={handleSuccess}
      />
    );
  }
  if (showExit && isItem) {
    return (
      <ExitFlow item={result} onClose={resetSubFlow} onSuccess={handleSuccess} />
    );
  }

  const heroWrapperClass = variant === 'mobile' ? '-mt-6 shrink-0' : 'shrink-0';
  const actionsWrapperClass =
    variant === 'mobile'
      ? 'shrink-0 border-t border-slate-800 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]'
      : 'shrink-0 border-t border-slate-800 px-4 py-3';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Hero banner */}
      <div className={heroWrapperClass}>
        <HeroBanner
          result={result}
          line1={line1}
          line2={line2}
          quantityLabel={quantityLabel}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <DetailCell
            icon={<Factory className="h-3.5 w-3.5" />}
            label="Fabricante"
            value={manufacturerName || '—'}
          />
          <DetailCell
            icon={<Tag className="h-3.5 w-3.5" />}
            label="Categoria"
            value={categoryName || 'Nenhuma'}
          />
          <DetailCell
            icon={<Barcode className="h-3.5 w-3.5" />}
            label="SKU"
            value={sku || '—'}
            copyable={!!sku}
          />
          <DetailCell
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Localização"
            value={binLabel || '—'}
            copyable={!!binLabel}
          />
          {customFields.map(field => {
            const display =
              field.type === 'boolean'
                ? field.value
                  ? 'Sim'
                  : 'Não'
                : field.unitOfMeasure
                  ? `${field.value} ${field.unitOfMeasure}`
                  : String(field.value);
            return (
              <DetailCell
                key={field.key}
                icon={<FileText className="h-3.5 w-3.5" />}
                label={field.label}
                value={display}
              />
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className={actionsWrapperClass}>
        <div className="flex gap-2">
          <ActionButton
            icon={<ArrowRightLeft className="h-4 w-4" />}
            label="Transferir"
            colorClass="text-amber-400"
            onClick={() => setShowTransfer(true)}
          />
          <ActionButton
            icon={<PackageMinus className="h-4 w-4" />}
            label="Dar Baixa"
            colorClass="text-rose-400"
            onClick={() => setShowExit(true)}
          />
          <ActionButton
            icon={<PackagePlus className="h-4 w-4" />}
            label="Add Volume"
            colorClass="text-sky-400"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================
// Mobile Sheet (bottom drawer)
// ============================================

interface ScanResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: LookupResult | null;
}

export function ScanResultSheet({
  open,
  onOpenChange,
  result,
}: ScanResultSheetProps) {
  if (!result) return null;
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
    >
      <DrawerContent className="bg-slate-900 border-slate-700 [&>div:first-child]:hidden max-h-[85vh]">
        <VisuallyHidden>
          <DrawerTitle>Resultado da leitura</DrawerTitle>
        </VisuallyHidden>
        <ScanResultBody
          result={result}
          variant="mobile"
          onClose={() => onOpenChange(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

// ============================================
// Desktop Dialog — same content, properly sized window
// ============================================

interface ScanResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: LookupResult | null;
}

export function ScanResultDialog({
  open,
  onOpenChange,
  result,
}: ScanResultDialogProps) {
  if (!result) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden bg-slate-900 border-slate-700 gap-0 h-[640px] max-h-[85vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>Resultado da leitura</DialogTitle>
        </VisuallyHidden>
        <ScanResultBody
          result={result}
          variant="desktop"
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
