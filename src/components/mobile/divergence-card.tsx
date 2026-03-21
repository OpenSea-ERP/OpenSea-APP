'use client';

import {
  AlertTriangle,
  PackageX,
  PackagePlus,
  MapPinOff,
  ArrowRight,
  UserCheck,
  MapPin,
  Undo2,
  FileX2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  InventorySessionItem,
  InventorySessionItemStatus,
  DivergenceResolution,
} from '@/types/stock';

interface DivergenceCardProps {
  item: InventorySessionItem;
  onResolve: (resolution: DivergenceResolution, notes?: string) => void;
  isPending?: boolean;
}

interface ResolutionOption {
  resolution: DivergenceResolution;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

function getStatusConfig(status: InventorySessionItemStatus) {
  switch (status) {
    case 'MISSING':
      return {
        label: 'Item Ausente',
        icon: <PackageX className="h-4 w-4" />,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
      };
    case 'EXTRA':
      return {
        label: 'Item Extra',
        icon: <PackagePlus className="h-4 w-4" />,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
      };
    case 'WRONG_BIN':
      return {
        label: 'Bin Incorreto',
        icon: <MapPinOff className="h-4 w-4" />,
        color: 'text-sky-400',
        bg: 'bg-sky-500/10 border-sky-500/20',
      };
    default:
      return {
        label: 'Divergência',
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-slate-400',
        bg: 'bg-slate-500/10 border-slate-500/20',
      };
  }
}

function getResolutionOptions(
  status: InventorySessionItemStatus
): ResolutionOption[] {
  switch (status) {
    case 'MISSING':
      return [
        {
          resolution: 'REGISTER_LOSS',
          label: 'Registrar Perda',
          icon: <FileX2 className="h-4 w-4" />,
          colorClass: 'text-rose-400',
          bgClass: 'bg-rose-500/10 border-rose-500/30 active:bg-rose-500/20',
        },
        {
          resolution: 'MOVED_TO_OTHER_BIN',
          label: 'Está em Outro Bin',
          icon: <ArrowRight className="h-4 w-4" />,
          colorClass: 'text-sky-400',
          bgClass: 'bg-sky-500/10 border-sky-500/30 active:bg-sky-500/20',
        },
        {
          resolution: 'FORWARD_SUPERVISOR',
          label: 'Encaminhar p/ Supervisor',
          icon: <UserCheck className="h-4 w-4" />,
          colorClass: 'text-amber-400',
          bgClass:
            'bg-amber-500/10 border-amber-500/30 active:bg-amber-500/20',
        },
      ];
    case 'EXTRA':
      return [
        {
          resolution: 'TRANSFER_TO_BIN',
          label: 'Transferir p/ Este Bin',
          icon: <MapPin className="h-4 w-4" />,
          colorClass: 'text-sky-400',
          bgClass: 'bg-sky-500/10 border-sky-500/30 active:bg-sky-500/20',
        },
        {
          resolution: 'KEEP_ORIGINAL',
          label: 'Manter Registro Original',
          icon: <Undo2 className="h-4 w-4" />,
          colorClass: 'text-indigo-400',
          bgClass:
            'bg-indigo-500/10 border-indigo-500/30 active:bg-indigo-500/20',
        },
        {
          resolution: 'FORWARD_SUPERVISOR',
          label: 'Encaminhar p/ Supervisor',
          icon: <UserCheck className="h-4 w-4" />,
          colorClass: 'text-amber-400',
          bgClass:
            'bg-amber-500/10 border-amber-500/30 active:bg-amber-500/20',
        },
      ];
    case 'WRONG_BIN':
      return [
        {
          resolution: 'UPDATE_LOCATION',
          label: 'Atualizar Localização',
          icon: <MapPin className="h-4 w-4" />,
          colorClass: 'text-green-400',
          bgClass: 'bg-green-500/10 border-green-500/30 active:bg-green-500/20',
        },
        {
          resolution: 'RETURN_TO_ORIGINAL',
          label: 'Devolver ao Bin Original',
          icon: <Undo2 className="h-4 w-4" />,
          colorClass: 'text-sky-400',
          bgClass: 'bg-sky-500/10 border-sky-500/30 active:bg-sky-500/20',
        },
        {
          resolution: 'FORWARD_SUPERVISOR',
          label: 'Encaminhar p/ Supervisor',
          icon: <UserCheck className="h-4 w-4" />,
          colorClass: 'text-amber-400',
          bgClass:
            'bg-amber-500/10 border-amber-500/30 active:bg-amber-500/20',
        },
      ];
    default:
      return [];
  }
}

export function DivergenceCard({
  item,
  onResolve,
  isPending,
}: DivergenceCardProps) {
  const statusConfig = getStatusConfig(item.status);
  const options = getResolutionOptions(item.status);

  const itemName =
    item.item?.productName || item.item?.variantName || item.item?.sku || 'Item';
  const itemCode = item.item?.sku || item.item?.barcode || '';

  return (
    <div
      className={cn(
        'rounded-xl border p-3 space-y-3',
        statusConfig.bg
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={cn('shrink-0', statusConfig.color)}>
          {statusConfig.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {itemName}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {itemCode && `${itemCode} · `}
            {statusConfig.label}
          </p>
        </div>
      </div>

      {/* Resolution options */}
      <div className="space-y-1.5">
        {options.map((option) => (
          <button
            key={option.resolution}
            onClick={() => onResolve(option.resolution)}
            disabled={isPending}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors disabled:opacity-50',
              option.bgClass,
              option.colorClass
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
