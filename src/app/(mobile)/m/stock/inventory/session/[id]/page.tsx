'use client';

import { useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import { InventoryProgressBar } from '@/components/mobile/inventory-progress-bar';
import { DivergenceCard } from '@/components/mobile/divergence-card';
import {
  useInventorySession,
  useScanInventoryItem,
  useResolveDivergence,
  usePauseSession,
  useCompleteSession,
  useCancelSession,
} from '@/hooks/mobile/use-inventory-sessions';
import type {
  InventorySessionItem,
  InventorySessionItemStatus,
  DivergenceResolution,
} from '@/types/stock';
import {
  ScanLine,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Pause,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ScannerCamera = dynamic(
  () =>
    import('@/components/mobile/scanner-camera').then((m) => ({
      default: m.ScannerCamera,
    })),
  { ssr: false }
);

// ============================================
// Item Status Icon
// ============================================

function ItemStatusIcon({ status }: { status: InventorySessionItemStatus }) {
  switch (status) {
    case 'CONFIRMED':
      return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    case 'MISSING':
      return <AlertTriangle className="h-4 w-4 text-rose-400" />;
    case 'EXTRA':
      return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case 'WRONG_BIN':
      return <AlertTriangle className="h-4 w-4 text-sky-400" />;
    case 'PENDING':
    default:
      return <HelpCircle className="h-4 w-4 text-slate-500" />;
  }
}

function getStatusBgClass(status: InventorySessionItemStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'border-green-500/20 bg-green-500/5';
    case 'MISSING':
      return 'border-rose-500/20 bg-rose-500/5';
    case 'EXTRA':
      return 'border-amber-500/20 bg-amber-500/5';
    case 'WRONG_BIN':
      return 'border-sky-500/20 bg-sky-500/5';
    case 'PENDING':
    default:
      return 'border-slate-700/50 bg-slate-800/40';
  }
}

// ============================================
// Item Row
// ============================================

function ItemRow({
  item,
  onResolve,
  isResolving,
}: {
  item: InventorySessionItem;
  onResolve: (resolution: DivergenceResolution, notes?: string) => void;
  isResolving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDivergent =
    item.status === 'MISSING' ||
    item.status === 'EXTRA' ||
    item.status === 'WRONG_BIN';

  const itemName =
    item.item?.productName || item.item?.variantName || item.item?.sku || 'Item';
  const itemCode = item.item?.sku || item.item?.barcode || '';

  return (
    <div className="space-y-0">
      <button
        onClick={() => isDivergent && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
          getStatusBgClass(item.status),
          isDivergent && 'cursor-pointer active:brightness-90'
        )}
      >
        <ItemStatusIcon status={item.status} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {itemName}
          </p>
          {itemCode && (
            <p className="truncate text-[11px] text-slate-500">{itemCode}</p>
          )}
        </div>
        {item.item?.quantity != null && (
          <span className="shrink-0 text-xs text-slate-500">
            Qtd: {item.item.quantity}
          </span>
        )}
      </button>

      {/* Divergence card (expanded) */}
      {expanded && isDivergent && (
        <div className="mt-1.5 ml-2">
          <DivergenceCard
            item={item}
            onResolve={onResolve}
            isPending={isResolving}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// Scan Overlay
// ============================================

function ScanOverlay({
  open,
  onClose,
  onScan,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  isPending: boolean;
}) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    onScan(code);
    setManualCode('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <MobileTopBar
        title="Escanear Item"
        subtitle="Aponte para o código do item"
        showBack
        rightContent={
          <div className="flex items-center gap-2">
            {isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
            )}
            <button
              onClick={onClose}
              className="text-xs text-slate-400 active:text-slate-200"
            >
              Fechar
            </button>
          </div>
        }
      />
      <div className="relative flex-1 overflow-hidden bg-black">
        {cameraError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
              <AlertCircle className="h-7 w-7 text-rose-400" />
            </div>
            <p className="text-sm font-medium text-slate-300">
              Câmera indisponível
            </p>
            <p className="text-xs text-slate-500">{cameraError}</p>
          </div>
        ) : (
          <ScannerCamera
            onScan={onScan}
            onError={setCameraError}
            enabled={open && !isPending}
            className="h-full"
          />
        )}
      </div>
      <form
        onSubmit={handleManualSubmit}
        className="flex items-center gap-2 border-t border-slate-800 bg-slate-900 px-4 py-3"
      >
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Código manual..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!manualCode.trim() || isPending}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white disabled:opacity-40 active:bg-indigo-600"
        >
          <ScanLine className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

// ============================================
// Session Action Bar
// ============================================

function SessionActionBar({
  sessionId,
  status,
}: {
  sessionId: string;
  status: string;
}) {
  const router = useRouter();
  const pauseSession = usePauseSession();
  const completeSession = useCompleteSession();
  const cancelSession = useCancelSession();

  if (status !== 'ACTIVE') return null;

  return (
    <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/95 px-4 py-2 backdrop-blur-sm">
      <button
        onClick={() =>
          cancelSession.mutate(sessionId, {
            onSuccess: () => router.push('/m/stock/inventory'),
          })
        }
        disabled={cancelSession.isPending}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-medium text-rose-400 active:bg-rose-500/20 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
        Cancelar
      </button>
      <button
        onClick={() =>
          pauseSession.mutate(sessionId, {
            onSuccess: () => router.push('/m/stock/inventory'),
          })
        }
        disabled={pauseSession.isPending}
        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs font-medium text-amber-400 active:bg-amber-500/20 disabled:opacity-50"
      >
        <Pause className="h-3.5 w-3.5" />
        Pausar
      </button>
      <button
        onClick={() =>
          completeSession.mutate(sessionId, {
            onSuccess: () => router.push('/m/stock/inventory'),
          })
        }
        disabled={completeSession.isPending}
        className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-500 text-xs font-medium text-white active:bg-green-600 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
        Concluir
      </button>
    </div>
  );
}

// ============================================
// Main Session Page
// ============================================

export default function InventorySessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [showScanner, setShowScanner] = useState(false);

  const sessionQuery = useInventorySession(sessionId);
  const scanItem = useScanInventoryItem(sessionId);
  const resolveDivergence = useResolveDivergence(sessionId);

  const session = sessionQuery.data?.session;
  const items = session?.items ?? [];

  const handleScan = useCallback(
    (code: string) => {
      scanItem.mutate(
        { code },
        {
          onSuccess: () => {
            // Keep scanner open for continuous scanning
          },
        }
      );
    },
    [scanItem]
  );

  const handleResolve = useCallback(
    (itemId: string, resolution: DivergenceResolution, notes?: string) => {
      resolveDivergence.mutate({ itemId, data: { resolution, notes } });
    },
    [resolveDivergence]
  );

  // Loading state
  if (sessionQuery.isLoading) {
    return (
      <div className="flex h-dvh flex-col bg-slate-950">
        <MobileTopBar title="Conferência" showBack />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      </div>
    );
  }

  // Error state
  if (sessionQuery.error || !session) {
    return (
      <div className="flex h-dvh flex-col bg-slate-950">
        <MobileTopBar title="Conferência" showBack />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
            <AlertCircle className="h-7 w-7 text-rose-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">
            Sessão não encontrada
          </p>
          <p className="text-xs text-slate-500">
            A sessão pode ter sido cancelada ou removida.
          </p>
        </div>
      </div>
    );
  }

  const progressLabel = `${session.scannedItems}/${session.totalItems}`;
  const isActive = session.status === 'ACTIVE';

  // Sort items: divergent first, then pending, then confirmed
  const statusOrder: Record<string, number> = {
    MISSING: 0,
    EXTRA: 1,
    WRONG_BIN: 2,
    PENDING: 3,
    CONFIRMED: 4,
  };
  const sortedItems = [...items].sort(
    (a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)
  );

  return (
    <div className="flex h-dvh flex-col bg-slate-950">
      <MobileTopBar
        title={session.binLabel || session.zoneName || 'Conferência'}
        subtitle={progressLabel}
        showBack
        rightContent={
          sessionQuery.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          ) : null
        }
      />

      {/* Progress bar */}
      <InventoryProgressBar
        scanned={session.scannedItems}
        total={session.totalItems}
      />

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {sortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 pt-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <ScanLine className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">Nenhum item ainda</p>
            <p className="text-xs text-slate-600">
              Escaneie itens para iniciar a conferência
            </p>
          </div>
        )}

        {sortedItems.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onResolve={(resolution, notes) =>
              handleResolve(item.id, resolution, notes)
            }
            isResolving={resolveDivergence.isPending}
          />
        ))}
      </div>

      {/* Scan button */}
      {isActive && (
        <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-3 backdrop-blur-sm">
          <button
            onClick={() => setShowScanner(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-3 text-sm font-semibold text-white active:bg-indigo-600"
          >
            <ScanLine className="h-5 w-5" />
            Escanear Próximo Item
          </button>
        </div>
      )}

      {/* Session action bar */}
      <SessionActionBar sessionId={sessionId} status={session.status} />

      {/* Scan overlay */}
      <ScanOverlay
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
        isPending={scanItem.isPending}
      />
    </div>
  );
}
