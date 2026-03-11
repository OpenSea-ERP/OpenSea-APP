/**
 * ItemsActionBar - Floating action bar for selected items
 * Shows actions available for selected items
 */

'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ArrowRightLeft,
  Bookmark,
  Building,
  Printer,
  ShieldAlert,
  ShoppingCart,
  Undo2,
  X,
} from 'lucide-react';

export interface ItemsActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onSell: () => void;
  onInternalUse: () => void;
  onReturn: () => void;
  onTransfer: () => void;
  onLoss: () => void;
  onReserve: () => void;
  onPrintLabel: () => void;
  className?: string;
}

export function ItemsActionBar({
  selectedCount,
  onClearSelection,
  onSell,
  onInternalUse,
  onReturn,
  onTransfer,
  onLoss,
  onReserve,
  onPrintLabel,
  className,
}: ItemsActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 p-2 rounded-xl',
        'bg-sky-600 dark:bg-sky-700',
        'border border-sky-400/50 dark:border-sky-500/50',
        'shadow-[0_0_30px_rgba(14,165,233,0.4)] dark:shadow-[0_0_30px_rgba(14,165,233,0.3)]',
        'animate-in slide-in-from-bottom-4 duration-300',
        className
      )}
    >
      {/* Primary Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-sky-500/50 gap-1.5"
          onClick={onSell}
          title="Vender"
          aria-label="Vender itens selecionados"
        >
          <ShoppingCart className="h-4 w-4" />
          <span className="hidden sm:inline">Vender</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-sky-500/50 gap-1.5"
          onClick={onInternalUse}
          title="Utilizar (Consumo Interno)"
          aria-label="Registrar consumo interno"
        >
          <Building className="h-4 w-4" />
          <span className="hidden sm:inline">Utilizar</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-sky-500/50 gap-1.5"
          onClick={onReturn}
          title="Devolver ao Fornecedor"
          aria-label="Devolver ao fornecedor"
        >
          <Undo2 className="h-4 w-4" />
          <span className="hidden sm:inline">Devolver</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-sky-500/50 gap-1.5"
          onClick={onTransfer}
          title="Transferir de Local"
          aria-label="Transferir item de local"
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Transferir</span>
        </Button>
      </div>

      <div className="h-6 w-px bg-sky-400/30" />

      {/* Secondary Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-red-200 hover:text-white hover:bg-red-500/50 gap-1.5"
          onClick={onLoss}
          title="Registrar Desvio (Perda/Furto/Roubo)"
          aria-label="Registrar desvio"
        >
          <ShieldAlert className="h-4 w-4" />
          <span className="hidden sm:inline">Desvio</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-sky-500/50 gap-1.5"
          onClick={onReserve}
          title="Reservar Item"
          aria-label="Reservar item"
        >
          <Bookmark className="h-4 w-4" />
          <span className="hidden sm:inline">Reserva</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-sky-500/50 gap-1.5"
          onClick={onPrintLabel}
          title="Imprimir Etiqueta"
          aria-label="Imprimir etiqueta"
        >
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Etiqueta</span>
        </Button>
      </div>

      <div className="h-6 w-px bg-sky-400/30" />

      {/* Selection Count & Clear */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-medium text-white">
          {selectedCount} {selectedCount === 1 ? 'item' : 'itens'}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-sky-100 hover:text-white hover:bg-sky-500/50"
          onClick={onClearSelection}
          title="Limpar seleção"
          aria-label="Limpar seleção"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
