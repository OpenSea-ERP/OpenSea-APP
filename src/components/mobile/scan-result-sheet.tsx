'use client';

import { useState, useCallback } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer';
import {
  ArrowRightLeft,
  Tag,
  PackageMinus,
  PackagePlus,
  Package,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { TransferFlow } from '@/components/mobile/transfer-flow';
import type { LookupResult } from '@/services/stock/lookup.service';

interface ScanResultSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: LookupResult | null;
}

function getEntityName(result: LookupResult): string {
  const entity = result.entity;
  return (
    (entity.name as string) ||
    (entity.title as string) ||
    (entity.label as string) ||
    result.entityId
  );
}

function getEntityCode(result: LookupResult): string {
  const entity = result.entity;
  return (
    (entity.sku as string) ||
    (entity.barcode as string) ||
    (entity.code as string) ||
    ''
  );
}

function getEntityDetail(
  result: LookupResult,
  key: string
): string | undefined {
  const value = result.entity[key];
  if (value == null) return undefined;
  return String(value);
}

function getEntityTypeLabel(type: LookupResult['entityType']): string {
  const labels: Record<string, string> = {
    ITEM: 'Item',
    VARIANT: 'Variante',
    PRODUCT: 'Produto',
    BIN: 'Localização',
  };
  return labels[type] || type;
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  onClick?: () => void;
}

function ActionButton({ icon, label, colorClass, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 p-3 text-xs font-medium active:bg-slate-700/80 ${colorClass}`}
    >
      {icon}
      {label}
    </button>
  );
}

export function ScanResultSheet({
  open,
  onOpenChange,
  result,
}: ScanResultSheetProps) {
  const { hasPermission } = usePermissions();
  const [showTransfer, setShowTransfer] = useState(false);

  const handleTransferClose = useCallback(() => {
    setShowTransfer(false);
  }, []);

  const handleTransferSuccess = useCallback(() => {
    setShowTransfer(false);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!result) return null;

  const name = getEntityName(result);
  const code = getEntityCode(result);
  const typeLabel = getEntityTypeLabel(result.entityType);

  const canTransfer = hasPermission('stock.movements.register');
  const canLabel = hasPermission('stock.labels.register');
  const canExit = hasPermission('stock.movements.register');
  const canAddVolume = hasPermission('stock.items.register');

  const detailFields = [
    { label: 'Tipo', value: typeLabel },
    {
      label: 'Variante',
      value: getEntityDetail(result, 'variantName'),
    },
    {
      label: 'Localização',
      value:
        getEntityDetail(result, 'binLabel') ||
        getEntityDetail(result, 'location'),
    },
    { label: 'Lote', value: getEntityDetail(result, 'batch') },
    {
      label: 'Validade',
      value: getEntityDetail(result, 'expiresAt'),
    },
    {
      label: 'Fabricação',
      value: getEntityDetail(result, 'manufacturedAt'),
    },
    {
      label: 'Quantidade',
      value: getEntityDetail(result, 'quantity'),
    },
    {
      label: 'Status',
      value: getEntityDetail(result, 'status'),
    },
  ].filter((f) => f.value != null);

  const isTransferable =
    canTransfer && (result.entityType === 'ITEM' || result.entityType === 'VARIANT');

  return (
    <Drawer
      open={open}
      onOpenChange={(value) => {
        if (!value) setShowTransfer(false);
        onOpenChange(value);
      }}
      direction="bottom"
    >
      <DrawerContent className={showTransfer ? 'h-[95vh]' : 'max-h-[85vh]'}>
        {showTransfer && isTransferable ? (
          <TransferFlow
            item={result}
            onClose={handleTransferClose}
            onSuccess={handleTransferSuccess}
          />
        ) : (
          <>
            <DrawerHeader className="text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <DrawerTitle className="truncate text-base">
                    {name}
                  </DrawerTitle>
                  <DrawerDescription className="truncate text-xs">
                    {code && `${code} · `}
                    {typeLabel}
                  </DrawerDescription>
                </div>
              </div>
            </DrawerHeader>

            {/* Detail grid */}
            <div className="space-y-1 px-4 pb-3">
              {detailFields.map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span className="text-slate-500">{field.label}</span>
                  <span className="font-medium text-slate-200">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <DrawerFooter className="pb-6">
              <div className="grid grid-cols-2 gap-2">
                {isTransferable && (
                  <ActionButton
                    icon={<ArrowRightLeft className="h-5 w-5" />}
                    label="Transferir"
                    colorClass="text-sky-400"
                    onClick={() => setShowTransfer(true)}
                  />
                )}
                {canLabel && (
                  <ActionButton
                    icon={<Tag className="h-5 w-5" />}
                    label="Etiqueta"
                    colorClass="text-indigo-400"
                  />
                )}
                {canExit && (
                  <ActionButton
                    icon={<PackageMinus className="h-5 w-5" />}
                    label="Dar Saída"
                    colorClass="text-rose-400"
                  />
                )}
                {canAddVolume && (
                  <ActionButton
                    icon={<PackagePlus className="h-5 w-5" />}
                    label="Add Volume"
                    colorClass="text-green-400"
                  />
                )}
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
