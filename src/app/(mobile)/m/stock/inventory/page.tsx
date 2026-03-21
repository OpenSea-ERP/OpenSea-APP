'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useInventorySessions,
  useCreateInventorySession,
  useResumeSession,
} from '@/hooks/mobile/use-inventory-sessions';
import type {
  InventorySession,
  InventorySessionMode,
} from '@/types/stock';
import {
  MapPin,
  Map,
  Package,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanLine,
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
// Mode Card Component
// ============================================

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  onClick: () => void;
}

function ModeCard({
  icon,
  title,
  description,
  colorClass,
  bgClass,
  borderClass,
  onClick,
}: ModeCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors active:brightness-90',
        borderClass,
        bgClass
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          colorClass
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <p className="mt-0.5 text-xs text-slate-400">{description}</p>
      </div>
    </button>
  );
}

// ============================================
// Session History Card
// ============================================

function SessionCard({
  session,
  onResume,
  isResuming,
}: {
  session: InventorySession;
  onResume?: () => void;
  isResuming?: boolean;
}) {
  const router = useRouter();

  const statusConfig: Record<
    string,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    ACTIVE: {
      icon: <Play className="h-3.5 w-3.5" />,
      label: 'Em Andamento',
      color: 'text-green-400',
    },
    PAUSED: {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: 'Pausada',
      color: 'text-amber-400',
    },
    COMPLETED: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: 'Concluída',
      color: 'text-sky-400',
    },
    CANCELLED: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: 'Cancelada',
      color: 'text-slate-500',
    },
  };

  const modeLabels: Record<string, string> = {
    BIN: 'Por Nicho',
    ZONE: 'Por Zona',
    PRODUCT: 'Por Produto',
  };

  const config = statusConfig[session.status] || statusConfig.CANCELLED;
  const progress =
    session.totalItems > 0
      ? Math.round((session.scannedItems / session.totalItems) * 100)
      : 0;

  const isActive = session.status === 'ACTIVE';
  const isPaused = session.status === 'PAUSED';

  return (
    <div
      className={cn(
        'rounded-xl border p-3',
        isActive || isPaused
          ? 'border-indigo-500/30 bg-indigo-500/5'
          : 'border-slate-700/50 bg-slate-800/40'
      )}
    >
      <div className="flex items-center gap-2">
        <div className={cn('shrink-0', config.color)}>{config.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {session.binLabel || session.zoneName || modeLabels[session.mode]}
          </p>
          <p className="text-[11px] text-slate-500">
            {modeLabels[session.mode]} ·{' '}
            {config.label} · {progress}%
          </p>
        </div>
        {(isActive || isPaused) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPaused && onResume) {
                onResume();
              } else if (isActive) {
                router.push(`/m/stock/inventory/session/${session.id}`);
              }
            }}
            disabled={isResuming}
            className="shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white active:bg-indigo-600 disabled:opacity-50"
          >
            {isResuming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isPaused ? (
              'Retomar'
            ) : (
              'Continuar'
            )}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-700/50">
        <div
          className="h-full rounded-full bg-indigo-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
        <span>
          {session.scannedItems}/{session.totalItems} itens
        </span>
        {session.divergentItems > 0 && (
          <span className="text-amber-400">
            {session.divergentItems} divergência(s)
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// Scan Modal for BIN mode
// ============================================

function BinScanModal({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
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
        title="Escanear Etiqueta do Nicho"
        subtitle="Aponte para o QR Code do bin"
        showBack
        rightContent={
          <button
            onClick={onClose}
            className="text-xs text-slate-400 active:text-slate-200"
          >
            Cancelar
          </button>
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
            enabled={open}
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
          placeholder="Código do bin..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!manualCode.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white disabled:opacity-40 active:bg-indigo-600"
        >
          <ScanLine className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

// ============================================
// Main Hub Page
// ============================================

export default function InventoryHubPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(PERMISSIONS.STOCK.INVENTORY.access);

  const [showBinScan, setShowBinScan] = useState(false);
  const sessionsQuery = useInventorySessions();
  const createSession = useCreateInventorySession();
  const resumeSession = useResumeSession();

  const sessions = sessionsQuery.data?.sessions ?? [];
  const activeSessions = sessions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'PAUSED'
  );
  const historySessions = sessions.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'CANCELLED'
  );

  const handleModeSelect = useCallback(
    (mode: InventorySessionMode) => {
      if (mode === 'BIN') {
        setShowBinScan(true);
      } else if (mode === 'ZONE') {
        // For MVP, create zone session directly (zone selector would go here)
        createSession.mutate(
          { mode: 'ZONE' },
          {
            onSuccess: (data) => {
              router.push(
                `/m/stock/inventory/session/${data.session.id}`
              );
            },
          }
        );
      } else if (mode === 'PRODUCT') {
        // For MVP, create product session directly (product search would go here)
        createSession.mutate(
          { mode: 'PRODUCT' },
          {
            onSuccess: (data) => {
              router.push(
                `/m/stock/inventory/session/${data.session.id}`
              );
            },
          }
        );
      }
    },
    [createSession, router]
  );

  const handleBinScanned = useCallback(
    (code: string) => {
      setShowBinScan(false);
      createSession.mutate(
        { mode: 'BIN', binId: code },
        {
          onSuccess: (data) => {
            router.push(
              `/m/stock/inventory/session/${data.session.id}`
            );
          },
        }
      );
    },
    [createSession, router]
  );

  const handleResume = useCallback(
    (sessionId: string) => {
      resumeSession.mutate(sessionId, {
        onSuccess: () => {
          router.push(`/m/stock/inventory/session/${sessionId}`);
        },
      });
    },
    [resumeSession, router]
  );

  if (!canAccess) {
    return (
      <div className="flex h-dvh flex-col bg-slate-950">
        <MobileTopBar title="Conferência" showBack />
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-slate-500">
            Você não tem permissão para acessar esta funcionalidade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-950">
      <MobileTopBar title="Conferência de Estoque" />

      <div className="flex-1 space-y-6 px-4 py-4">
        {/* Active sessions banner */}
        {activeSessions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sessões Ativas
            </h2>
            {activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onResume={() => handleResume(session.id)}
                isResuming={resumeSession.isPending}
              />
            ))}
          </div>
        )}

        {/* Mode selection */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Nova Conferência
          </h2>
          <div className="space-y-2">
            <ModeCard
              icon={<MapPin className="h-5 w-5 text-sky-400" />}
              title="Por Nicho (Bin)"
              description="Escaneia a etiqueta do nicho e confere todos os itens"
              colorClass="bg-sky-500/10"
              bgClass="bg-sky-500/5"
              borderClass="border-sky-500/20"
              onClick={() => handleModeSelect('BIN')}
            />
            <ModeCard
              icon={<Map className="h-5 w-5 text-indigo-400" />}
              title="Por Zona"
              description="Confere uma zona inteira, percorrendo bin a bin"
              colorClass="bg-indigo-500/10"
              bgClass="bg-indigo-500/5"
              borderClass="border-indigo-500/20"
              onClick={() => handleModeSelect('ZONE')}
            />
            <ModeCard
              icon={<Package className="h-5 w-5 text-green-400" />}
              title="Por Produto"
              description="Seleciona produtos/variantes específicos"
              colorClass="bg-green-500/10"
              bgClass="bg-green-500/5"
              borderClass="border-green-500/20"
              onClick={() => handleModeSelect('PRODUCT')}
            />
          </div>
        </div>

        {/* Creating session loading */}
        {createSession.isPending && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Criando sessão...
          </div>
        )}

        {/* Session history */}
        {historySessions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Histórico
            </h2>
            {historySessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {sessions.length === 0 && !sessionsQuery.isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 pt-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
              <ScanLine className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm text-slate-400">
              Nenhuma sessão encontrada
            </p>
            <p className="text-xs text-slate-600">
              Selecione um modo acima para iniciar
            </p>
          </div>
        )}

        {/* Loading state */}
        {sessionsQuery.isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        )}
      </div>

      {/* Bin scan modal */}
      <BinScanModal
        open={showBinScan}
        onClose={() => setShowBinScan(false)}
        onScan={handleBinScanned}
      />
    </div>
  );
}
