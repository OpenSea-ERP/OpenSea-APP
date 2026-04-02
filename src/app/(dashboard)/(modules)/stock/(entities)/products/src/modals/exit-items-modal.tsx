/**
 * ExitItemsModal - Two-step modal for item exit
 * Step 1: Select exit type
 * Step 2: Observation + confirmation
 */

'use client';

import { getUnitAbbreviation } from '@/helpers/formatters';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Item } from '@/types/stock';
import {
  ArrowLeft,
  ArrowUpRight,
  Building,
  Loader2,
  LogOut,
  Package,
  ShieldAlert,
  ShoppingCart,
  Undo2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ExitType } from '../types/products.types';

interface ExitOptionConfig {
  type: ExitType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'emerald' | 'amber' | 'violet' | 'sky' | 'rose';
  requiresPin?: boolean;
}

const EXIT_OPTIONS: ExitOptionConfig[] = [
  {
    type: 'PRODUCTION',
    label: 'Utilização',
    description: 'Uso interno ou ordem de serviço',
    icon: Building,
    color: 'amber',
  },
  {
    type: 'SAMPLE',
    label: 'Amostra',
    description: 'Saída para amostra ou mostruário',
    icon: ArrowUpRight,
    color: 'violet',
  },
  {
    type: 'SUPPLIER_RETURN',
    label: 'Devolução',
    description: 'Retorno do item ao fornecedor',
    icon: Undo2,
    color: 'sky',
    requiresPin: true,
  },
  {
    type: 'LOSS',
    label: 'Perda/Furto',
    description: 'Item perdido, furtado ou roubado',
    icon: ShieldAlert,
    color: 'rose',
    requiresPin: true,
  },
];

/** Map color names to Tailwind class sets */
const COLOR_CLASSES: Record<
  ExitOptionConfig['color'],
  {
    iconBg: string;
    iconText: string;
    iconBorder: string;
    hoverBorder: string;
    badgeClass: string;
  }
> = {
  emerald: {
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    iconBorder: 'border-emerald-600/25 dark:border-emerald-500/20',
    hoverBorder:
      'hover:border-emerald-400 dark:hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5',
    badgeClass:
      'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-600/25 dark:border-emerald-500/20',
  },
  amber: {
    iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    iconText: 'text-amber-600 dark:text-amber-400',
    iconBorder: 'border-amber-600/25 dark:border-amber-500/20',
    hoverBorder:
      'hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-500/5',
    badgeClass:
      'bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300 border-amber-600/25 dark:border-amber-500/20',
  },
  violet: {
    iconBg: 'bg-violet-50 dark:bg-violet-500/10',
    iconText: 'text-violet-600 dark:text-violet-400',
    iconBorder: 'border-violet-600/25 dark:border-violet-500/20',
    hoverBorder:
      'hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-500/5',
    badgeClass:
      'bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/20',
  },
  sky: {
    iconBg: 'bg-sky-50 dark:bg-sky-500/10',
    iconText: 'text-sky-600 dark:text-sky-400',
    iconBorder: 'border-sky-600/25 dark:border-sky-500/20',
    hoverBorder:
      'hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-500/5',
    badgeClass:
      'bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300 border-sky-600/25 dark:border-sky-500/20',
  },
  rose: {
    iconBg: 'bg-rose-50 dark:bg-rose-500/10',
    iconText: 'text-rose-600 dark:text-rose-400',
    iconBorder: 'border-rose-600/25 dark:border-rose-500/20',
    hoverBorder:
      'hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-500/5',
    badgeClass:
      'bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300 border-rose-600/25 dark:border-rose-500/20',
  },
};

export interface ExitItemsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItems: Item[];
  onConfirm: (exitType: ExitType, reason: string) => Promise<void>;
  /** Called when user selects TRANSFER - parent should open transfer modal */
  onTransfer?: () => void;
  /** When provided, skips step 1 and opens directly on step 2 with this type */
  initialExitType?: ExitType;
}

export function ExitItemsModal({
  open,
  onOpenChange,
  selectedItems,
  onConfirm,
  onTransfer: _onTransfer,
  initialExitType,
}: ExitItemsModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ExitType | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // When opening with initialExitType, skip to step 2
  useEffect(() => {
    if (open && initialExitType) {
      setSelectedType(initialExitType);
      setStep(2);
    }
  }, [open, initialExitType]);

  const handleSelectType = (type: ExitType) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleRequestSubmit = () => {
    if (!selectedType) return;
    const config = EXIT_OPTIONS.find(o => o.type === selectedType);
    if (config?.requiresPin) {
      setPinModalOpen(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setIsSubmitting(true);
    try {
      await onConfirm(selectedType, reason);
      handleClose();
    } catch (error) {
      logger.error(
        'Error processing exit',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (initialExitType) {
      handleClose();
      return;
    }
    setStep(1);
    setSelectedType(null);
    setReason('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setStep(1);
      setSelectedType(null);
      setReason('');
    }
  };

  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + item.currentQuantity,
    0
  );
  const unitAbbr =
    getUnitAbbreviation(selectedItems[0]?.templateUnitOfMeasure) || 'un';
  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3,
  }).format(totalQuantity);

  const itemName =
    selectedItems.length === 1
      ? [
          selectedItems[0].templateName,
          selectedItems[0].productName,
          selectedItems[0].variantName,
        ]
          .filter(Boolean)
          .join(' ') || 'Item selecionado'
      : `${selectedItems.length} itens selecionados`;
  const itemCode =
    selectedItems.length === 1
      ? selectedItems[0].fullCode || selectedItems[0].uniqueCode || ''
      : '';

  const selectedConfig = EXIT_OPTIONS.find(o => o.type === selectedType);
  const selectedColors = selectedConfig
    ? COLOR_CLASSES[selectedConfig.color]
    : null;

  /** Header icon color: sky for step 1, type color for step 2 */
  const headerColor =
    step === 1 ? 'sky' : (selectedConfig?.color ?? 'sky');
  const headerColors = COLOR_CLASSES[headerColor];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Hero header */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-500/10 dark:to-sky-500/5 border-b border-border px-6 pt-6 pb-5">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-lg border shrink-0',
                  headerColors.iconBg,
                  headerColors.iconBorder
                )}
              >
                {step === 1 ? (
                  <LogOut className={cn('h-5 w-5', headerColors.iconText)} />
                ) : (
                  selectedConfig && (
                    <selectedConfig.icon
                      className={cn('h-5 w-5', headerColors.iconText)}
                    />
                  )
                )}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base">
                  {step === 1 ? 'Dar Baixa no Estoque' : selectedConfig?.label}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {step === 1
                    ? selectedItems.length === 1
                      ? 'Selecione o motivo da saída do item.'
                      : `Selecione o motivo da saída dos ${selectedItems.length} itens.`
                    : 'Confirmação de saída. Essa ação não poderá ser desfeita!'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Item card (always visible) */}
          <div className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/15 mt-0.5">
              <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <span className="text-sm font-mono font-medium text-foreground truncate block">
                {itemCode || itemName}
              </span>
              {itemCode && (
                <p className="text-xs text-muted-foreground truncate">
                  {itemName}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-white/5 border border-border rounded-lg px-3 py-1 text-center shrink-0 self-center">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
                Quantidade
              </div>
              <div className="text-sm font-semibold text-foreground leading-tight">
                {formattedTotal} {unitAbbr}
              </div>
            </div>
          </div>

          {step === 1 ? (
            /* Step 1: Select exit type */
            <div className="grid grid-cols-2 gap-2">
              {EXIT_OPTIONS.map(option => {
                const Icon = option.icon;
                const colors = COLOR_CLASSES[option.color];
                return (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => handleSelectType(option.type)}
                    className={cn(
                      'flex flex-col items-start gap-3 p-3 rounded-lg border border-border cursor-pointer transition-all text-left',
                      colors.hoverBorder
                    )}
                  >
                    <div
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-lg',
                        colors.iconBg
                      )}
                    >
                      <Icon className={cn('h-5 w-5', colors.iconText)} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Step 2: Observation */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Observação (opcional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Digite uma observação..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 2) {
                handleBack();
              } else {
                handleClose();
              }
            }}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          {step === 1 ? (
            <Button disabled className="gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              Adicionar ao Carrinho
            </Button>
          ) : (
            <Button
              onClick={handleRequestSubmit}
              disabled={isSubmitting}
              variant="destructive"
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Confirmar Saída
            </Button>
          )}
        </div>
      </DialogContent>

      {/* PIN confirmation for sensitive exit types */}
      <VerifyActionPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={() => {
          setPinModalOpen(false);
          handleSubmit();
        }}
        title="Confirmar Saída"
        description={`Digite seu PIN de Ação para confirmar a saída por ${selectedConfig?.label?.toLowerCase() || 'este motivo'}. Esta ação não pode ser desfeita.`}
      />
    </Dialog>
  );
}
