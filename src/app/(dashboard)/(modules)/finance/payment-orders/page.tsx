'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Header } from '@/components/layout/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  usePaymentOrders,
  useApprovePaymentOrder,
  useRejectPaymentOrder,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  PaymentOrder,
  PaymentOrderStatus,
  BankPaymentMethod,
} from '@/types/finance';
import {
  PAYMENT_ORDER_STATUS_LABELS,
  BANK_PAYMENT_METHOD_LABELS,
} from '@/types/finance';
import {
  AlertCircle,
  BanknoteIcon,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  PaymentOrderStatus,
  {
    label: string;
    color: string;
    icon: React.ElementType;
  }
> = {
  PENDING_APPROVAL: {
    label: PAYMENT_ORDER_STATUS_LABELS.PENDING_APPROVAL,
    color:
      'border border-teal-600/25 dark:border-teal-500/20 bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300',
    icon: Clock,
  },
  APPROVED: {
    label: PAYMENT_ORDER_STATUS_LABELS.APPROVED,
    color:
      'border border-sky-600/25 dark:border-sky-500/20 bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: PAYMENT_ORDER_STATUS_LABELS.REJECTED,
    color:
      'border border-slate-600/25 dark:border-slate-500/20 bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300',
    icon: XCircle,
  },
  PROCESSING: {
    label: PAYMENT_ORDER_STATUS_LABELS.PROCESSING,
    color:
      'border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
    icon: Loader2,
  },
  COMPLETED: {
    label: PAYMENT_ORDER_STATUS_LABELS.COMPLETED,
    color:
      'border border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  FAILED: {
    label: PAYMENT_ORDER_STATUS_LABELS.FAILED,
    color:
      'border border-rose-600/25 dark:border-rose-500/20 bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    icon: AlertCircle,
  },
};

const methodConfig: Record<
  BankPaymentMethod,
  { label: string; color: string }
> = {
  PIX: {
    label: BANK_PAYMENT_METHOD_LABELS.PIX,
    color:
      'border border-teal-600/25 dark:border-teal-500/20 bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300',
  },
  TED: {
    label: BANK_PAYMENT_METHOD_LABELS.TED,
    color:
      'border border-sky-600/25 dark:border-sky-500/20 bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300',
  },
  BOLETO: {
    label: BANK_PAYMENT_METHOD_LABELS.BOLETO,
    color:
      'border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
  },
};

const STATUS_TABS = [
  { id: undefined, label: 'Todas' },
  { id: 'PENDING_APPROVAL', label: 'Pendentes' },
  { id: 'APPROVED', label: 'Aprovadas' },
  { id: 'REJECTED', label: 'Rejeitadas' },
  { id: 'COMPLETED', label: 'Concluídas' },
  { id: 'FAILED', label: 'Falhas' },
] as const;

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// REJECT REASON MODAL
// ============================================================================

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

function RejectReasonModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: RejectReasonModalProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = useCallback(() => {
    if (!reason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    onConfirm(reason.trim());
  }, [reason, onConfirm]);

  useEffect(() => {
    if (!isOpen) setReason('');
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rejeitar Ordem de Pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="reject-reason">Motivo da rejeição</Label>
          <Textarea
            id="reject-reason"
            placeholder="Descreva o motivo pelo qual esta ordem está sendo rejeitada..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ORDER CARD
// ============================================================================

interface OrderCardProps {
  order: PaymentOrder;
  canApprove: boolean;
  onApprove: (order: PaymentOrder) => void;
  onReject: (order: PaymentOrder) => void;
}

function OrderCard({ order, canApprove, onApprove, onReject }: OrderCardProps) {
  const status = statusConfig[order.status];
  const method = methodConfig[order.method];
  const StatusIcon = status.icon;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/8 mt-0.5">
            <BanknoteIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge className={status.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <Badge className={method.color}>{method.label}</Badge>
            </div>
            <p className="font-semibold text-sm">
              {formatCurrency(order.amount)}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>Criado em {formatDate(order.createdAt)}</span>
              {order.approvedAt && (
                <span className="text-sky-600 dark:text-sky-400">
                  Aprovado em {formatDate(order.approvedAt)}
                </span>
              )}
              {order.rejectedReason && (
                <span className="text-slate-500 truncate max-w-xs">
                  Motivo: {order.rejectedReason}
                </span>
              )}
              {order.errorMessage && (
                <span className="text-rose-600 dark:text-rose-400 truncate max-w-xs">
                  Erro: {order.errorMessage}
                </span>
              )}
            </div>
          </div>
        </div>

        {order.status === 'PENDING_APPROVAL' && canApprove && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
              onClick={() => onReject(order)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Rejeitar
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onApprove(order)}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Aprovar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function PaymentOrdersPage() {
  const router = useRouter();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const canApprove = hasPermission(FINANCE_PERMISSIONS.PAYMENT_ORDERS.ADMIN);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.ENTRIES.REGISTER);

  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  // Pending order for action
  const [orderToApprove, setOrderToApprove] = useState<PaymentOrder | null>(
    null
  );
  const [orderToReject, setOrderToReject] = useState<PaymentOrder | null>(null);
  const [pendingRejectReason, setPendingRejectReason] = useState<string | null>(
    null
  );
  const [showApprovePin, setShowApprovePin] = useState(false);
  const [showRejectPin, setShowRejectPin] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const approveMutation = useApprovePaymentOrder();
  const rejectMutation = useRejectPaymentOrder();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaymentOrders({ status: activeTab });

  const orders = useMemo(
    () => data?.pages.flatMap(page => page.orders) ?? [],
    [data]
  );

  // Infinite scroll — observe sentinel as soon as it mounts
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, orders.length]);

  const handleApprove = useCallback((order: PaymentOrder) => {
    setOrderToApprove(order);
    setShowApprovePin(true);
  }, []);

  const handleApproveConfirmed = useCallback(async () => {
    if (!orderToApprove) return;
    try {
      await approveMutation.mutateAsync(orderToApprove.id);
      toast.success('Ordem de pagamento aprovada com sucesso');
      setShowApprovePin(false);
      setOrderToApprove(null);
    } catch {
      toast.error('Erro ao aprovar ordem de pagamento');
    }
  }, [orderToApprove, approveMutation]);

  const handleReject = useCallback((order: PaymentOrder) => {
    setOrderToReject(order);
  }, []);

  const handleRejectReasonSubmit = useCallback((reason: string) => {
    setPendingRejectReason(reason);
    setShowRejectPin(true);
  }, []);

  const handleRejectConfirmed = useCallback(async () => {
    if (!orderToReject || !pendingRejectReason) return;
    try {
      await rejectMutation.mutateAsync({
        id: orderToReject.id,
        reason: pendingRejectReason,
      });
      toast.success('Ordem de pagamento rejeitada');
      setOrderToReject(null);
      setPendingRejectReason(null);
      setShowRejectPin(false);
    } catch {
      toast.error('Erro ao rejeitar ordem de pagamento');
    }
  }, [orderToReject, pendingRejectReason, rejectMutation]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Ordens de Pagamento' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <Header
          title="Ordens de Pagamento"
          description="Aprovação e execução de pagamentos bancários"
        />

        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_TABS.map(tab => (
            <button
              key={String(tab.id)}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading || permissionsLoading ? (
          // Wait for permissions to resolve before rendering the list so
          // Aprovar/Rejeitar buttons don't flash in for users without the
          // PAYMENT_ORDERS.ADMIN permission on hard refresh (P2-44 FOUC).
          <GridLoading />
        ) : error ? (
          <GridError message="Erro ao carregar ordens de pagamento" />
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhuma ordem de pagamento
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              As ordens de pagamento bancário aparecem aqui para aprovação e
              acompanhamento.
            </p>
            {canCreate && (
              <Button
                size="sm"
                className="mt-6"
                onClick={() => router.push('/finance/payable?create=true')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar ordem
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                canApprove={canApprove}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}
      </PageBody>

      {/* Approve PIN confirmation */}
      <VerifyActionPinModal
        isOpen={showApprovePin}
        onClose={() => {
          setShowApprovePin(false);
          setOrderToApprove(null);
        }}
        onSuccess={handleApproveConfirmed}
        title="Confirmar Aprovação"
        description="Digite seu PIN de Ação para aprovar esta ordem de pagamento."
      />

      {/* Reject reason modal (step 1: capture reason) */}
      <RejectReasonModal
        isOpen={!!orderToReject && !showRejectPin}
        onClose={() => {
          setOrderToReject(null);
          setPendingRejectReason(null);
        }}
        onConfirm={handleRejectReasonSubmit}
        isLoading={rejectMutation.isPending}
      />

      {/* Reject PIN confirmation (step 2: verify PIN) */}
      <VerifyActionPinModal
        isOpen={showRejectPin}
        onClose={() => {
          setShowRejectPin(false);
          setPendingRejectReason(null);
        }}
        onSuccess={handleRejectConfirmed}
        title="Confirmar Rejeição"
        description="Digite seu PIN de Ação para rejeitar esta ordem de pagamento."
      />
    </PageLayout>
  );
}
