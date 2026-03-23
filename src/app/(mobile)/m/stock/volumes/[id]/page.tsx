'use client';

import { useState, useCallback, use } from 'react';
import dynamic from 'next/dynamic';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import {
  useVolume,
  useAddItemToVolume,
  useRemoveItemFromVolume,
  useCloseVolume,
} from '@/hooks/mobile/use-mobile-volumes';
import { useCodeLookup } from '@/hooks/mobile/use-code-lookup';
import { scanSuccess, scanError } from '@/lib/scan-feedback';
import {
  Loader2,
  AlertCircle,
  X,
  Lock,
  ScanLine,
  Package,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import type { VolumeItem } from '@/types/stock';

const ScannerCamera = dynamic(
  () =>
    import('@/components/mobile/scanner-camera').then(m => ({
      default: m.ScannerCamera,
    })),
  { ssr: false }
);

function ItemRow({
  volumeItem,
  onRemove,
  isRemoving,
  canRemove,
}: {
  volumeItem: VolumeItem;
  onRemove: () => void;
  isRemoving: boolean;
  canRemove: boolean;
}) {
  const item = volumeItem.item;
  const label =
    item?.variantSku || item?.uniqueCode || volumeItem.itemId.slice(0, 8);
  const subtitle = item?.productName;
  const addedAt = new Date(volumeItem.addedAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-slate-800">
        <Package className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-200">{label}</p>
        {subtitle && (
          <p className="truncate text-[11px] text-slate-400">{subtitle}</p>
        )}
        <p className="text-[11px] text-slate-500">Adicionado {addedAt}</p>
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 active:bg-rose-500/20 disabled:opacity-40"
        >
          {isRemoving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

export default function VolumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const { data: volume, isLoading, isError } = useVolume(id);
  const addItem = useAddItemToVolume(id);
  const removeItem = useRemoveItemFromVolume(id);
  const closeVolume = useCloseVolume(id);
  const lookup = useCodeLookup();

  const isOpen = volume?.status === 'OPEN';
  const items = volume?.items ?? [];

  // Compute stats
  const totalItems = items.length;
  const uniqueVariants = new Set(
    items.map(vi => vi.item?.variantId).filter(Boolean)
  ).size;
  const uniqueProducts = new Set(
    items.map(vi => vi.item?.productId).filter(Boolean)
  ).size;

  const handleScan = useCallback(
    async (code: string) => {
      setScanStatus(null);
      try {
        // Lookup the code to find the item
        const result = await lookup.mutateAsync(code);
        if (result.entityType === 'ITEM') {
          await addItem.mutateAsync(result.entityId);
          scanSuccess();
          setScanStatus({
            message: `Item adicionado: ${code}`,
            type: 'success',
          });
        } else {
          scanError();
          setScanStatus({
            message: `Código "${code}" não é um item`,
            type: 'error',
          });
        }
      } catch {
        scanError();
        setScanStatus({
          message: `Falha ao adicionar: ${code}`,
          type: 'error',
        });
      }
    },
    [lookup, addItem]
  );

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItemId(itemId);
    try {
      await removeItem.mutateAsync(itemId);
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleClose = async () => {
    try {
      await closeVolume.mutateAsync({});
      setConfirmClose(false);
    } catch {
      // Error handled by React Query
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-950">
        <MobileTopBar title="Volume" showBack />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !volume) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-950">
        <MobileTopBar title="Volume" showBack />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-sm text-slate-400">Erro ao carregar volume</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-950">
      <MobileTopBar
        title={volume.code}
        subtitle={
          volume.destinationRef ? `Pedido: ${volume.destinationRef}` : undefined
        }
        showBack
        rightContent={
          isOpen ? (
            <button
              onClick={() => setConfirmClose(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 active:bg-slate-600"
            >
              <Lock className="h-3 w-3" />
              Fechar
            </button>
          ) : null
        }
      />

      {/* Stats bar */}
      <div className="flex items-center justify-around border-b border-slate-800 bg-slate-900/50 py-2.5">
        <div className="flex items-center gap-1.5 text-xs">
          <Package className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400">Itens:</span>
          <span className="font-semibold text-slate-200">{totalItems}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Layers className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400">Variantes:</span>
          <span className="font-semibold text-slate-200">{uniqueVariants}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-slate-400">Produtos:</span>
          <span className="font-semibold text-slate-200">{uniqueProducts}</span>
        </div>
      </div>

      {/* Scanner area (when open) */}
      {scannerOpen && (
        <div className="relative border-b border-slate-800">
          <ScannerCamera
            onScan={handleScan}
            onError={() =>
              setScanStatus({
                message: 'Câmera indisponível',
                type: 'error',
              })
            }
            className="h-48"
          />
          <button
            onClick={() => setScannerOpen(false)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur-sm active:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
          {/* Scan status message */}
          {scanStatus && (
            <div
              className={`absolute inset-x-0 bottom-0 px-4 py-2 text-xs font-medium ${
                scanStatus.type === 'success'
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-rose-500/90 text-white'
              }`}
            >
              {scanStatus.message}
            </div>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
            <Package className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">Nenhum item neste volume</p>
            {isOpen && (
              <p className="text-xs text-slate-600">
                Use o scanner para adicionar itens
              </p>
            )}
          </div>
        ) : (
          items.map(vi => (
            <ItemRow
              key={vi.id}
              volumeItem={vi}
              onRemove={() => handleRemoveItem(vi.itemId)}
              isRemoving={removingItemId === vi.itemId}
              canRemove={isOpen}
            />
          ))
        )}
      </div>

      {/* Scan button (only if open) */}
      {isOpen && !scannerOpen && (
        <div className="border-t border-slate-800 bg-slate-900 p-4">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white active:bg-indigo-600"
          >
            <ScanLine className="h-5 w-5" />
            Escanear Item para Adicionar
          </button>
        </div>
      )}

      {/* Close confirmation dialog */}
      {confirmClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-6 w-full max-w-sm rounded-2xl bg-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-100">
              Fechar Volume
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Tem certeza que deseja fechar o volume{' '}
              <span className="font-medium text-slate-200">{volume.code}</span>?
              Após fechado, não será possível adicionar ou remover itens.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmClose(false)}
                className="flex-1 rounded-lg border border-slate-600 py-2.5 text-sm font-medium text-slate-300 active:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleClose}
                disabled={closeVolume.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500 py-2.5 text-sm font-medium text-white active:bg-indigo-600 disabled:opacity-50"
              >
                {closeVolume.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
