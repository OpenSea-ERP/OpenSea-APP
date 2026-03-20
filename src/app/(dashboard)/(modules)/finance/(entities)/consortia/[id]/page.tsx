/**
 * Consortium Detail Page - Rebuilt with cost comparison, payment tracking, and contemplation management.
 */

'use client';

import { ConsortiumDetailCards } from '@/components/finance/consortia/consortium-detail-cards';
import { CostComparison } from '@/components/finance/consortia/cost-comparison';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useConsortium,
  useDeleteConsortium,
  useMarkContemplated,
  usePayConsortiumInstallment,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { ConsortiumPayment, ConsortiumStatus } from '@/types/finance';
import {
  CONSORTIUM_STATUS_LABELS,
  FINANCE_ENTRY_STATUS_LABELS,
} from '@/types/finance';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Star,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusVariant(
  status: ConsortiumStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'CONTEMPLATED':
      return 'default';
    case 'WITHDRAWN':
      return 'warning';
    case 'COMPLETED':
      return 'secondary';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getPaymentStatusVariant(
  status: string
): 'success' | 'destructive' | 'secondary' {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'OVERDUE':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getPaymentRowClassName(payment: ConsortiumPayment): string {
  if (payment.status === 'PAID') return 'bg-emerald-50 dark:bg-emerald-950/20';
  if (payment.status === 'OVERDUE') return 'bg-red-50 dark:bg-red-950/20';

  const now = new Date();
  const dueDate = new Date(payment.dueDate);
  const diffDays = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays >= 0 && diffDays <= 7 && payment.status === 'PENDING') {
    return 'bg-amber-50 dark:bg-amber-950/20';
  }

  return '';
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function DetailSkeleton() {
  return (
    <PageLayout>
      <PageHeader>
        <div className="h-10" />
      </PageHeader>
      <PageBody>
        <Card className="p-6">
          <div className="flex gap-6 items-center">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </Card>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-48 w-full" />
        </Card>
      </PageBody>
    </PageLayout>
  );
}

// =============================================================================
// PAYMENT MODAL
// =============================================================================

function PaymentModal({
  payment,
  consortiumId,
  isOpen,
  onClose,
}: {
  payment: ConsortiumPayment | null;
  consortiumId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const payMutation = usePayConsortiumInstallment();
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);

  const handlePay = async () => {
    if (!payment) return;
    try {
      await payMutation.mutateAsync({
        consortiumId,
        data: {
          paidAmount: parseFloat(amount) || payment.expectedAmount,
          paidAt,
        },
      });
      toast.success(`Parcela ${payment.installmentNumber} paga com sucesso.`);
      onClose();
    } catch {
      toast.error('Erro ao registrar pagamento.');
    }
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Parcela {payment.installmentNumber} - Valor:{' '}
            {formatCurrency(payment.expectedAmount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="pay-amount">Valor Pago (R$)</Label>
            <Input
              id="pay-amount"
              type="number"
              step="0.01"
              placeholder={payment.expectedAmount.toFixed(2)}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pay-date">Data do Pagamento</Label>
            <Input
              id="pay-date"
              type="date"
              value={paidAt}
              onChange={e => setPaidAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handlePay} disabled={payMutation.isPending}>
            {payMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// CONTEMPLATION MODAL
// =============================================================================

function ContemplationModal({
  consortiumId,
  isOpen,
  onClose,
}: {
  consortiumId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const markMutation = useMarkContemplated();
  const [contemplationType, setContemplationType] = useState<'BID' | 'DRAW'>(
    'DRAW'
  );
  const [contemplatedAt, setContemplatedAt] = useState(
    new Date().toISOString().split('T')[0]
  );

  const handleMark = async () => {
    try {
      await markMutation.mutateAsync({
        id: consortiumId,
        data: {
          contemplationType,
          contemplatedAt,
        },
      });
      toast.success('Consórcio marcado como contemplado.');
      onClose();
    } catch {
      toast.error('Erro ao marcar contemplação.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar como Contemplado</DialogTitle>
          <DialogDescription>
            Informe os dados da contemplação do consórcio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="contemp-type">Tipo de Contemplação</Label>
            <Select
              value={contemplationType}
              onValueChange={v => setContemplationType(v as 'BID' | 'DRAW')}
            >
              <SelectTrigger id="contemp-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAW">Sorteio</SelectItem>
                <SelectItem value="BID">Lance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contemp-date">Data da Contemplação</Label>
            <Input
              id="contemp-date"
              type="date"
              value={contemplatedAt}
              onChange={e => setContemplatedAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleMark} disabled={markMutation.isPending}>
            {markMutation.isPending
              ? 'Processando...'
              : 'Confirmar Contemplação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// DUE SOON ALERT (CONS-04)
// =============================================================================

function DueSoonAlert({ payments }: { payments: ConsortiumPayment[] }) {
  const now = new Date();
  const dueSoon = payments.filter(p => {
    if (p.status !== 'PENDING') return false;
    const dueDate = new Date(p.dueDate);
    const diffDays = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays >= 0 && diffDays <= 7;
  });

  if (dueSoon.length === 0) return null;

  return (
    <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">
            Parcelas próximas do vencimento
          </h3>
        </div>
        <div className="space-y-1">
          {dueSoon.map(p => (
            <p
              key={p.id}
              className="text-sm text-amber-700 dark:text-amber-300"
            >
              Parcela {p.installmentNumber} - {formatCurrency(p.expectedAmount)}{' '}
              - vence em {formatDate(p.dueDate)}
            </p>
          ))}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ConsortiumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading } = useConsortium(id);
  const deleteConsortium = useDeleteConsortium();

  const canDelete = hasPermission(FINANCE_PERMISSIONS.CONSORTIA.REMOVE);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<ConsortiumPayment | null>(
    null
  );
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [contemplationModalOpen, setContemplationModalOpen] = useState(false);

  const consortium = data?.consortium;

  const progressPercentage = consortium
    ? consortium.totalInstallments > 0
      ? Math.round(
          (consortium.paidInstallments / consortium.totalInstallments) * 100
        )
      : 0
    : 0;

  const handleDelete = useCallback(async () => {
    if (!consortium) return;
    try {
      await deleteConsortium.mutateAsync(consortium.id);
      toast.success('Consórcio excluído com sucesso.');
      router.push('/finance/consortia');
    } catch {
      toast.error('Erro ao excluir consórcio.');
    }
  }, [consortium, deleteConsortium, router]);

  const handlePayPayment = useCallback((payment: ConsortiumPayment) => {
    setPaymentTarget(payment);
    setPaymentModalOpen(true);
  }, []);

  if (isLoading) return <DetailSkeleton />;

  if (!consortium) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Consórcios', href: '/finance/consortia' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-12 text-center">
            <p className="text-destructive text-lg">
              Consórcio não encontrado.
            </p>
            <Link href="/finance/consortia">
              <Button variant="outline" className="mt-4">
                Voltar para consórcios
              </Button>
            </Link>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Consórcios', href: '/finance/consortia' },
            { label: consortium.name },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete-consortium',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />

        <div className="flex items-center gap-4">
          <Link href="/finance/consortia">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
          </Link>
        </div>
      </PageHeader>

      <PageBody>
        {/* Consortium Header Card */}
        <Card className="p-4 sm:p-6">
          <div className="flex gap-4 sm:gap-6 items-center">
            <div className="flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shrink-0">
              <Building2 className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                  {consortium.name}
                </h1>
                <Badge variant={getStatusVariant(consortium.status)}>
                  {CONSORTIUM_STATUS_LABELS[consortium.status]}
                </Badge>
                {consortium.isContemplated && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Contemplado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Administradora: {consortium.administrator}
                {consortium.groupNumber &&
                  ` | Grupo: ${consortium.groupNumber}`}
                {consortium.quotaNumber && ` | Cota: ${consortium.quotaNumber}`}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">
                {consortium.paidInstallments} de {consortium.totalInstallments}{' '}
                parcelas pagas
              </span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </Card>

        {/* Summary Cards */}
        <ConsortiumDetailCards consortium={consortium} />

        {/* Due-Soon Alert (CONS-04) */}
        {consortium.payments && consortium.payments.length > 0 && (
          <DueSoonAlert payments={consortium.payments} />
        )}

        {/* Contemplation Details */}
        {consortium.isContemplated && (
          <Card className="p-4 sm:p-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                Dados da Contemplação
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {formatDate(consortium.contemplatedAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {consortium.contemplationType === 'BID' ? 'Lance' : 'Sorteio'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Valor do Crédito
                </p>
                <p className="font-medium font-mono">
                  {formatCurrency(consortium.creditValue)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Mark as Contemplated */}
        {!consortium.isContemplated && consortium.status === 'ACTIVE' && (
          <Card className="p-4 sm:p-6 border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Contemplação</h3>
                <p className="text-sm text-muted-foreground">
                  Este consórcio ainda não foi contemplado.
                </p>
              </div>
              <Button onClick={() => setContemplationModalOpen(true)}>
                <Star className="h-4 w-4 mr-2" />
                Marcar como Contemplado
              </Button>
            </div>
          </Card>
        )}

        {/* Cost Comparison (CONS-03) */}
        <CostComparison consortium={consortium} />

        {/* Payment Tracking Table */}
        {consortium.payments && consortium.payments.length > 0 && (
          <Card className="overflow-hidden">
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Parcelas
                <Badge variant="secondary">{consortium.payments.length}</Badge>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <Table aria-label="Tabela de parcelas do consórcio">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Parcela</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="w-[140px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consortium.payments.map(payment => (
                    <TableRow
                      key={payment.id}
                      className={getPaymentRowClassName(payment)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {payment.installmentNumber}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(payment.expectedAmount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(payment.dueDate)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.paidAt ? formatDate(payment.paidAt) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={getPaymentStatusVariant(payment.status)}
                        >
                          {FINANCE_ENTRY_STATUS_LABELS[payment.status] ??
                            payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.status !== 'PAID' && (
                          <Button
                            size="sm"
                            variant={
                              payment.status === 'OVERDUE'
                                ? 'destructive'
                                : 'outline'
                            }
                            onClick={() => handlePayPayment(payment)}
                          >
                            Registrar Pagamento
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Details */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Detalhes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {consortium.contractNumber && (
              <div>
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium font-mono">
                  {consortium.contractNumber}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Data de Adesão</p>
              <p className="font-medium">{formatDate(consortium.startDate)}</p>
            </div>
            {consortium.paymentDay && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Dia de Vencimento
                </p>
                <p className="font-medium">Dia {consortium.paymentDay}</p>
              </div>
            )}
            {consortium.bankAccountName && (
              <div>
                <p className="text-sm text-muted-foreground">Conta Bancária</p>
                <p className="font-medium">{consortium.bankAccountName}</p>
              </div>
            )}
            {consortium.costCenterName && (
              <div>
                <p className="text-sm text-muted-foreground">Centro de Custo</p>
                <p className="font-medium">{consortium.costCenterName}</p>
              </div>
            )}
          </div>
          {consortium.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{consortium.notes}</p>
            </div>
          )}
        </Card>
      </PageBody>

      {/* Payment Modal */}
      <PaymentModal
        payment={paymentTarget}
        consortiumId={id}
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPaymentTarget(null);
        }}
      />

      {/* Contemplation Modal */}
      <ContemplationModal
        consortiumId={id}
        isOpen={contemplationModalOpen}
        onClose={() => setContemplationModalOpen(false)}
      />

      {/* Delete Confirmation */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de Ação para excluir o consórcio "${consortium.name}".`}
      />
    </PageLayout>
  );
}
