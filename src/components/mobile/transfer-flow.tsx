'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Loader2,
  MapPin,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { RecentBinChips } from '@/components/mobile/recent-bin-chips';
import { useTransferItem } from '@/hooks/stock/use-items';
import { useRecentBins, type RecentBin } from '@/hooks/mobile/use-receiving';
import { useCodeLookup } from '@/hooks/mobile/use-code-lookup';
import { scanSuccess, scanError } from '@/lib/scan-feedback';
import type { LookupResult } from '@/services/stock/lookup.service';

const ScannerCamera = dynamic(
  () =>
    import('@/components/mobile/scanner-camera').then((m) => ({
      default: m.ScannerCamera,
    })),
  { ssr: false }
);

type TransferStep = 'scan-bin' | 'confirm';

interface TransferFlowProps {
  item: LookupResult;
  onClose: () => void;
  onSuccess: () => void;
}

function getItemName(item: LookupResult): string {
  const entity = item.entity;
  return (
    (entity.name as string) ||
    (entity.title as string) ||
    (entity.label as string) ||
    item.entityId
  );
}

function getItemCode(item: LookupResult): string {
  const entity = item.entity;
  return (
    (entity.sku as string) ||
    (entity.barcode as string) ||
    (entity.code as string) ||
    ''
  );
}

function getItemBinLabel(item: LookupResult): string | undefined {
  const entity = item.entity;
  return (
    (entity.binLabel as string) ||
    (entity.location as string) ||
    undefined
  );
}

export function TransferFlow({ item, onClose, onSuccess }: TransferFlowProps) {
  const [step, setStep] = useState<TransferStep>('scan-bin');
  const [selectedBin, setSelectedBin] = useState<{
    id: string;
    address: string;
  } | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const transfer = useTransferItem();
  const { bins: recentBins, addBin } = useRecentBins();
  const binLookup = useCodeLookup();

  const itemName = getItemName(item);
  const itemCode = getItemCode(item);
  const currentBin = getItemBinLabel(item);

  // Handle scanning a bin barcode/QR
  const handleBinScan = useCallback(
    (code: string) => {
      setCameraEnabled(false);
      binLookup.mutate(code, {
        onSuccess: (result) => {
          if (result.entityType === 'BIN') {
            const address =
              (result.entity.label as string) ||
              (result.entity.address as string) ||
              code;
            scanSuccess();
            setSelectedBin({ id: result.entityId, address });
            setStep('confirm');
          } else {
            scanError();
            toast.error('Código escaneado não é uma localização');
            setCameraEnabled(true);
          }
        },
        onError: () => {
          scanError();
          toast.error('Localização não encontrada');
          setCameraEnabled(true);
        },
      });
    },
    [binLookup]
  );

  // Select from recent bins
  const handleRecentBinSelect = useCallback((bin: RecentBin) => {
    setSelectedBin({ id: bin.id, address: bin.address });
    setStep('confirm');
  }, []);

  // Manual address search
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualAddress.trim();
    if (!code) return;
    handleBinScan(code);
    setManualAddress('');
  };

  // Confirm transfer
  const handleConfirm = () => {
    if (!selectedBin) return;

    transfer.mutate(
      { itemId: item.entityId, destinationBinId: selectedBin.id },
      {
        onSuccess: () => {
          scanSuccess();
          addBin(selectedBin.id, selectedBin.address);
          toast.success(
            `${itemName} transferido para ${selectedBin.address}`
          );
          onSuccess();
        },
        onError: (error) => {
          scanError();
          const message =
            (error as { message?: string })?.message ||
            'Erro ao transferir item';
          toast.error(message);
        },
      }
    );
  };

  // Go back to scan step
  const handleBack = () => {
    setSelectedBin(null);
    setStep('scan-bin');
    setCameraEnabled(true);
  };

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
        <button
          onClick={step === 'confirm' ? handleBack : onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 active:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-slate-100">
            Transferir Item
          </h2>
          <p className="text-xs text-slate-500">
            {step === 'scan-bin'
              ? 'Escanear bin destino'
              : 'Confirmar transferência'}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
      </div>

      {/* Item summary */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {itemName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {itemCode && `${itemCode} · `}
              {currentBin ? `Atual: ${currentBin}` : 'Sem localização'}
            </p>
          </div>
        </div>
      </div>

      {step === 'scan-bin' && (
        <>
          {/* Camera for bin scanning */}
          <div className="relative flex-1 overflow-hidden bg-black">
            <ScannerCamera
              onScan={handleBinScan}
              enabled={cameraEnabled && !binLookup.isPending}
              className="h-full"
            />

            {/* Loading overlay */}
            {binLookup.isPending && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              </div>
            )}

            {/* Instruction overlay */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">
              <p className="text-center text-sm font-medium text-slate-200">
                Escaneie o código da localização destino
              </p>
            </div>
          </div>

          {/* Recent bins */}
          <div className="border-t border-slate-800 bg-slate-900/80 px-4 py-3">
            <RecentBinChips
              bins={recentBins}
              onSelect={handleRecentBinSelect}
            />
          </div>

          {/* Manual input */}
          <form
            onSubmit={handleManualSubmit}
            className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Endereço manual da bin..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!manualAddress.trim() || binLookup.isPending}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white disabled:opacity-40 active:bg-indigo-600"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </>
      )}

      {step === 'confirm' && selectedBin && (
        <div className="flex flex-1 flex-col">
          {/* Transfer visualization */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
            {/* From */}
            <div className="w-full rounded-xl border border-slate-700 bg-slate-800/60 p-4 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">
                Origem
              </p>
              <p className="text-base font-semibold text-slate-200">
                {currentBin || 'Sem localização'}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-400">
              <ArrowRightLeft className="h-5 w-5 rotate-90" />
            </div>

            {/* To */}
            <div className="w-full rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 text-center">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-sky-400">
                Destino
              </p>
              <p className="text-base font-semibold text-slate-200">
                {selectedBin.address}
              </p>
            </div>
          </div>

          {/* Confirm button */}
          <div className="border-t border-slate-800 bg-slate-900 px-4 py-4">
            <button
              onClick={handleConfirm}
              disabled={transfer.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-sm shadow-sky-500/20 disabled:opacity-60 active:bg-sky-600"
            >
              {transfer.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirmar Transferência
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
