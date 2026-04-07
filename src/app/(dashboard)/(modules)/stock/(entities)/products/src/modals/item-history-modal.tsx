/**
 * ItemHistoryModal - Modal showing item movement history
 * Shows proper action labels, icons, colors per movement type/reason
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { getUnitAbbreviation } from '@/helpers/formatters';
import { movementsService } from '@/services/stock';
import type { Item, ItemMovementExtended } from '@/types/stock';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  Bookmark,
  Building,
  Clock,
  ExternalLink,
  History,
  MapPin,
  Package,
  ShieldAlert,
  ShoppingCart,
  Undo2,
} from 'lucide-react';
import Link from 'next/link';
import {
  PiCalendarBlankDuotone,
  PiHashStraightDuotone,
  PiMapPinDuotone,
  PiUserDuotone,
} from 'react-icons/pi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function formatUnit(unit?: string): string {
  if (!unit) return 'un';
  return getUnitAbbreviation(unit) || unit;
}

export interface ItemHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  /** Optional productId — when provided, shows a "Ver Produto" link in the footer */
  productId?: string;
  /** When provided, shows a "Voltar" button in the footer */
  onBack?: () => void;
}

/** Action config resolved from movementType + reasonCode */
interface ActionConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeClass: string;
  iconColor: string;
  iconBg: string;
  iconBorder: string;
  quantityPrefix: '+' | '-' | '';
}

/**
 * Resolve the display action from backend movementType.
 *
 * Backend movementType values (aligned with Prisma):
 *  - PURCHASE, CUSTOMER_RETURN (entrada)
 *  - SALE, PRODUCTION, SAMPLE, LOSS, SUPPLIER_RETURN (saida)
 *  - TRANSFER, INVENTORY_ADJUSTMENT, ZONE_RECONFIGURE (outros)
 */
const getActionConfig = (
  movementType: string,
  _reasonCode?: string | null
): ActionConfig => {
  if (movementType === 'PURCHASE') {
    return {
      label: 'Compra',
      icon: ArrowDownRight,
      badgeClass:
        'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-600/25 dark:border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconBorder: 'border-emerald-600/25 dark:border-emerald-500/20',
      quantityPrefix: '+',
    };
  }

  if (movementType === 'CUSTOMER_RETURN') {
    return {
      label: 'Devolução (Cliente)',
      icon: ArrowDownRight,
      badgeClass:
        'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-600/25 dark:border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconBorder: 'border-emerald-600/25 dark:border-emerald-500/20',
      quantityPrefix: '+',
    };
  }

  if (movementType === 'SALE') {
    return {
      label: 'Venda',
      icon: ShoppingCart,
      badgeClass:
        'bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-600/25 dark:border-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconBorder: 'border-emerald-600/25 dark:border-emerald-500/20',
      quantityPrefix: '-',
    };
  }

  if (movementType === 'PRODUCTION') {
    return {
      label: 'Utilização',
      icon: Building,
      badgeClass:
        'bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300 border-amber-600/25 dark:border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconBorder: 'border-amber-600/25 dark:border-amber-500/20',
      quantityPrefix: '-',
    };
  }

  if (movementType === 'SAMPLE') {
    return {
      label: 'Amostra',
      icon: ArrowUpRight,
      badgeClass:
        'bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconBorder: 'border-violet-600/25 dark:border-violet-500/20',
      quantityPrefix: '-',
    };
  }

  if (movementType === 'LOSS') {
    return {
      label: 'Perda',
      icon: ShieldAlert,
      badgeClass:
        'bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300 border-rose-600/25 dark:border-rose-500/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-500/10',
      iconBorder: 'border-rose-600/25 dark:border-rose-500/20',
      quantityPrefix: '-',
    };
  }

  if (movementType === 'SUPPLIER_RETURN') {
    return {
      label: 'Devolução (Fornecedor)',
      icon: Undo2,
      badgeClass:
        'bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300 border-sky-600/25 dark:border-sky-500/20',
      iconColor: 'text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-500/10',
      iconBorder: 'border-sky-600/25 dark:border-sky-500/20',
      quantityPrefix: '-',
    };
  }

  if (movementType === 'TRANSFER') {
    return {
      label: 'Transferência',
      icon: ArrowRightLeft,
      badgeClass:
        'bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300 border-amber-600/25 dark:border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconBorder: 'border-amber-600/25 dark:border-amber-500/20',
      quantityPrefix: '',
    };
  }

  if (movementType === 'INVENTORY_ADJUSTMENT') {
    return {
      label: 'Ajuste',
      icon: Package,
      badgeClass:
        'bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300 border-amber-600/25 dark:border-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconBorder: 'border-amber-600/25 dark:border-amber-500/20',
      quantityPrefix: '',
    };
  }

  if (movementType === 'ZONE_RECONFIGURE') {
    return {
      label: 'Reconfiguração',
      icon: ArrowRightLeft,
      badgeClass:
        'bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconBorder: 'border-violet-600/25 dark:border-violet-500/20',
      quantityPrefix: '',
    };
  }

  // Fallback
  return {
    label: 'Movimento',
    icon: ArrowRightLeft,
    badgeClass:
      'bg-gray-50 dark:bg-gray-500/8 text-gray-700 dark:text-gray-300 border-gray-600/25 dark:border-gray-500/20',
    iconColor: 'text-gray-600 dark:text-gray-400',
    iconBg: 'bg-gray-50 dark:bg-gray-500/10',
    iconBorder: 'border-gray-600/25 dark:border-gray-500/20',
    quantityPrefix: '',
  };
};

export function ItemHistoryModal({
  open,
  onOpenChange,
  item,
  productId,
  onBack,
}: ItemHistoryModalProps) {
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['item-history', item?.id],
    queryFn: async () => {
      if (!item?.id) return { movements: [] };
      return movementsService.listMovements({ itemId: item.id, limit: 50 });
    },
    enabled: open && !!item?.id,
  });

  const movements = historyData?.movements || [];
  const itemCode =
    item?.fullCode || item?.uniqueCode || item?.id.substring(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] w-[calc(100vw-1rem)] sm:w-full flex flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Hero header — stacks vertically on mobile, horizontal on desktop */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 dark:from-sky-500/10 dark:to-sky-500/5 border-b border-border px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-5">
          <DialogHeader>
            <div className="flex flex-col gap-3">
              {/* Title row */}
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-500/15 border border-sky-600/25 dark:border-sky-500/20 shrink-0">
                  <History className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base text-left">
                    Histórico do Item
                  </DialogTitle>
                  {item && (
                    <DialogDescription className="mt-0.5 text-left">
                      <span className="font-mono text-xs sm:text-sm break-all">
                        {itemCode}
                      </span>
                    </DialogDescription>
                  )}
                </div>
              </div>
              {/* Stats — full width row, wraps on mobile */}
              {item && (item.bin?.address || item.currentQuantity !== undefined) && (
                <div className="flex flex-wrap items-stretch gap-2">
                  {item.bin?.address && (
                    <div className="flex-1 min-w-[120px] bg-white dark:bg-white/5 border border-border rounded-lg px-3 py-1.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        Localização
                      </div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-1 mt-0.5 break-all">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        {item.bin.address}
                      </div>
                    </div>
                  )}
                  {item.currentQuantity !== undefined && (
                    <div className="flex-1 min-w-[120px] bg-white dark:bg-white/5 border border-border rounded-lg px-3 py-1.5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        Quantidade
                      </div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">
                        {new Intl.NumberFormat('pt-BR', {
                          maximumFractionDigits: 3,
                        }).format(item.currentQuantity)}{' '}
                        <span className="text-muted-foreground font-normal">
                          {formatUnit(item.templateUnitOfMeasure)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : movements.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">Nenhum histórico</h3>
              <p className="text-sm text-muted-foreground">
                Este item ainda não possui movimentações registradas.
              </p>
            </div>
          ) : (
            <div className="py-4 space-y-1">
              {movements.map((movement, index) => (
                <MovementItem
                  key={movement.id}
                  movement={movement}
                  isLast={index === movements.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="gap-1.5 flex-1 sm:flex-none"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            {(productId || item?.productId) && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 flex-1 sm:flex-none"
                asChild
              >
                <Link href={`/stock/products/${productId || item?.productId}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver Produto
                </Link>
              </Button>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MovementItem({
  movement,
  isLast,
}: {
  movement: ItemMovementExtended;
  isLast: boolean;
}) {
  const config = getActionConfig(movement.movementType, movement.reasonCode);
  const Icon = config.icon;

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return String(date);
    }
  };

  // Format quantity with proper sign
  const formatMovementQuantity = () => {
    if (movement.quantity === undefined || movement.quantity === null)
      return null;
    const absQty = Math.abs(movement.quantity);
    if (config.quantityPrefix === '-') return `-${absQty}`;
    if (config.quantityPrefix === '+') return `+${absQty}`;
    return String(movement.quantity);
  };

  const quantityDisplay = formatMovementQuantity();

  // Extract location from destinationRef (format: "Bin: ADDRESS")
  const locationDisplay = movement.destinationRef?.startsWith('Bin: ')
    ? movement.destinationRef.slice(5)
    : movement.destinationRef || null;

  return (
    <div className="flex gap-3">
      {/* Timeline indicator — rounded-lg filled squares */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'flex items-center justify-center h-9 w-9 rounded-lg border',
            config.iconBg,
            config.iconBorder
          )}
        >
          <Icon className={cn('h-4 w-4', config.iconColor)} />
        </div>
        {!isLast && <div className="flex-1 w-0.5 bg-border my-1" />}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0 pb-4', isLast && 'pb-0')}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                config.badgeClass
              )}
            >
              {config.label}
            </span>

            <div className="mt-2 text-sm text-muted-foreground space-y-0.5 break-words">
              {quantityDisplay && (
                <p className="flex items-center gap-1">
                  <PiHashStraightDuotone className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">Quantidade:</span>
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      config.quantityPrefix === '-'
                        ? 'text-rose-600 dark:text-rose-400'
                        : config.quantityPrefix === '+'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                    )}
                  >
                    {quantityDisplay}
                  </span>
                </p>
              )}

              {movement.originRef && locationDisplay ? (
                <p className="flex items-center gap-1">
                  <PiMapPinDuotone className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">Localização:</span>
                  {movement.originRef.startsWith('Bin: ')
                    ? movement.originRef.slice(5)
                    : movement.originRef}
                  <ArrowRightLeft className="h-3 w-3 shrink-0 mx-0.5" />
                  {locationDisplay}
                </p>
              ) : locationDisplay ? (
                <p className="flex items-center gap-1">
                  <PiMapPinDuotone className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">Localização:</span>
                  {locationDisplay}
                </p>
              ) : movement.originRef ? (
                <p className="flex items-center gap-1">
                  <PiMapPinDuotone className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold">Localização:</span>
                  {movement.originRef.startsWith('Bin: ')
                    ? movement.originRef.slice(5)
                    : movement.originRef}
                </p>
              ) : null}

              {movement.notes && (
                <p className="italic">&ldquo;{movement.notes}&rdquo;</p>
              )}
            </div>
          </div>

          <div className="sm:text-right sm:shrink-0">
            <p className="flex items-center gap-1 text-xs text-muted-foreground sm:justify-end">
              <PiCalendarBlankDuotone className="h-3.5 w-3.5 shrink-0" />
              {formatDate(movement.createdAt)}
            </p>
            {movement.user && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 sm:justify-end">
                <PiUserDuotone className="h-3.5 w-3.5 shrink-0" />
                {movement.user.name || 'Sistema'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
