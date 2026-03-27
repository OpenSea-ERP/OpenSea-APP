'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  Loader2,
  MapPin,
  Search,
  List,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAllBins } from '@/app/(dashboard)/(modules)/stock/(entities)/locations/src/api/bins.queries';
import type { Bin } from '@/types/stock';
import { toast } from 'sonner';
import { RecentBinChips } from '@/components/mobile/recent-bin-chips';
import { useTransferItem } from '@/hooks/stock/use-items';
import { useRecentBins, type RecentBin } from '@/hooks/mobile/use-receiving';
import { useCodeLookup } from '@/hooks/mobile/use-code-lookup';
import { scanSuccess, scanError } from '@/lib/scan-feedback';
import type { LookupResult } from '@/services/stock/lookup.service';

const ScannerCamera = dynamic(
  () =>
    import('@/components/mobile/scanner-camera').then(m => ({
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
  const productName = entity.productName as string | undefined;
  const variantName = entity.variantName as string | undefined;
  const combined = [productName, variantName].filter(Boolean).join(' · ');
  return (
    combined ||
    (entity.name as string) ||
    (entity.title as string) ||
    (entity.label as string) ||
    item.entityId
  );
}

function getPatternStyle(
  colorHex: string,
  secondaryColorHex?: string,
  pattern?: string
): React.CSSProperties {
  const secondary = secondaryColorHex || colorHex;
  const p = pattern || 'SOLID';

  switch (p) {
    case 'STRIPED':
      return { background: `repeating-linear-gradient(135deg, ${colorHex}, ${colorHex} 4px, ${secondary} 4px, ${secondary} 8px)` };
    case 'PLAID':
      return { background: `repeating-linear-gradient(0deg, ${secondary}40 0px, ${secondary}40 2px, transparent 2px, transparent 7px), repeating-linear-gradient(90deg, ${secondary}40 0px, ${secondary}40 2px, transparent 2px, transparent 7px), ${colorHex}` };
    case 'GRADIENT':
      return { background: `linear-gradient(135deg, ${colorHex}, ${secondary})` };
    case 'PRINTED':
      return { background: `radial-gradient(circle at 25% 25%, ${secondary} 2px, transparent 2px), radial-gradient(circle at 75% 75%, ${secondary} 2px, transparent 2px), ${colorHex}` };
    case 'JACQUARD':
      return { background: `repeating-conic-gradient(${colorHex} 0% 25%, ${secondary} 0% 50%) 50% / 10px 10px` };
    default:
      if (secondaryColorHex && secondaryColorHex !== colorHex) {
        return { background: `linear-gradient(135deg, ${colorHex} 50%, ${secondaryColorHex} 50%)` };
      }
      return { backgroundColor: colorHex };
  }
}

function ItemColorSwatch({ entity }: { entity: Record<string, unknown> }) {
  const colorHex = entity.colorHex as string | undefined;

  if (!colorHex) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-slate-400">
        <MapPin className="h-4 w-4" />
      </div>
    );
  }

  return (
    <div
      className="h-9 w-9 shrink-0 rounded-lg border border-white/15"
      style={getPatternStyle(
        colorHex,
        entity.secondaryColorHex as string | undefined,
        (entity.pattern as string | undefined) || 'SOLID'
      )}
    />
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
    (entity.binLabel as string) || (entity.location as string) || undefined
  );
}

export function TransferFlow({ item, onClose, onSuccess }: TransferFlowProps) {
  const [step, setStep] = useState<TransferStep>('scan-bin');
  const [binMode, setBinMode] = useState<'list' | 'scan'>('list');
  const [binSearch, setBinSearch] = useState('');
  const [selectedBin, setSelectedBin] = useState<{
    id: string;
    address: string;
  } | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: allBins = [], isLoading: isLoadingBins } = useAllBins();
  const filteredBins = useMemo(() => {
    if (!binSearch.trim()) return allBins;
    const q = binSearch.toLowerCase();
    return allBins.filter(b => b.address.toLowerCase().includes(q));
  }, [allBins, binSearch]);

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
        onSuccess: result => {
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

  // Select from bin list
  const handleBinListSelect = useCallback((bin: Bin) => {
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
          toast.success(`${itemName} transferido para ${selectedBin.address}`);
          onSuccess();
        },
        onError: error => {
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
              ? 'Alterando a localização de um item.'
              : 'Confirmar transferência'}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-700 text-slate-300">
          <ArrowRightLeft className="h-4 w-4" />
        </div>
      </div>

      {/* Item summary */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <ItemColorSwatch entity={item.entity} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-200">
              {itemName}
            </p>
            <p className="truncate text-xs text-slate-500">
              {currentBin || 'Sem localização'}
            </p>
          </div>
        </div>
      </div>

      {step === 'scan-bin' && (
        <>
          {/* Mode toggle */}
          <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/80 px-4 py-2">
            <button
              onClick={() => setBinMode('list')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                binMode === 'list'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 active:bg-slate-700'
              )}
            >
              <List className="h-3.5 w-3.5" />
              Lista
            </button>
            <button
              onClick={() => setBinMode('scan')}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                binMode === 'scan'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-800 text-slate-400 active:bg-slate-700'
              )}
            >
              <Camera className="h-3.5 w-3.5" />
              Scanner
            </button>

            {/* Recent bins chips inline */}
            {recentBins.length > 0 && (
              <div className="ml-auto flex items-center gap-1 overflow-x-auto">
                {recentBins.slice(0, 3).map(bin => (
                  <button
                    key={bin.id}
                    onClick={() => handleRecentBinSelect(bin)}
                    className="shrink-0 rounded-full bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-400 active:bg-slate-700"
                  >
                    {bin.address}
                  </button>
                ))}
              </div>
            )}
          </div>

          {binMode === 'scan' ? (
            <>
              <div className="relative flex-1 overflow-hidden bg-black">
                <ScannerCamera
                  onScan={handleBinScan}
                  enabled={cameraEnabled && !binLookup.isPending}
                  className="h-full"
                />
                {binLookup.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                  </div>
                )}
              </div>
              <form
                onSubmit={handleManualSubmit}
                className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder="Endereço manual..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-base text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!manualAddress.trim() || binLookup.isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500 text-white disabled:opacity-40 active:bg-sky-600"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={binSearch}
                    onChange={e => setBinSearch(e.target.value.toUpperCase())}
                    placeholder="Buscar endereço..."
                    autoFocus
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 font-mono text-base text-slate-200 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {isLoadingBins ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                  </div>
                ) : filteredBins.length === 0 ? (
                  <div className="py-12 text-center text-sm text-slate-500">
                    Nenhum nicho encontrado
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredBins.map(bin => {
                      const isEmpty = bin.currentOccupancy === 0;
                      const isCurrent = currentBin === bin.address;
                      return (
                        <button
                          key={bin.id}
                          onClick={() => !isCurrent && handleBinListSelect(bin)}
                          disabled={isCurrent}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
                            isCurrent
                              ? 'bg-slate-800/40 border border-slate-700 opacity-60'
                              : 'bg-slate-800/40 active:bg-slate-700/60'
                          )}
                        >
                          <div
                            className={cn(
                              'h-2.5 w-2.5 shrink-0 rounded-full',
                              isCurrent
                                ? 'bg-slate-500'
                                : isEmpty
                                  ? 'bg-emerald-500'
                                  : 'bg-amber-500'
                            )}
                          />
                          <span className={cn(
                            'truncate font-mono text-sm font-medium',
                            isCurrent ? 'text-slate-400' : 'text-slate-200'
                          )}>
                            {bin.address}
                          </span>
                          {isCurrent && (
                            <span className="shrink-0 rounded-md bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              Atual
                            </span>
                          )}
                          <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-500">
                            {bin.currentOccupancy}
                            {bin.capacity ? `/${bin.capacity}` : ''} itens
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
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
