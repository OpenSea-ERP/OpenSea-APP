/**
 * OpenSea OS - Consortium Detail Page
 * Follows the standard detail page pattern: PageLayout > PageHeader > PageBody
 * with Identity Card, info sections, payment tracking, contemplation management.
 */

'use client';

import { ConsortiumDetailCards } from '@/components/finance/consortia/consortium-detail-cards';
import { CostComparison } from '@/components/finance/consortia/cost-comparison';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useConsortium,
  useDeleteConsortium,
  useMarkContemplated,
  usePayConsortiumInstallment,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { ConsortiumPayment, ConsortiumStatus } from '@/types/finance';
import {
  CONSORTIUM_STATUS_LABELS,
  FINANCE_ENTRY_STATUS_LABELS,
} from '@/types/finance';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  FileText,
  Info,
  Landmark,
  Star,
  Trash2,
  Users,
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
  if (payment.status === 'OVERDUE') return 'bg-rose-50 dark:bg-rose-950/20';

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
// DUE SOON ALERT
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
// INFO ROW
// =============================================================================

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${className ?? ''}`}>{value}</span>
    </div>
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
  const { data, isLoading, error } = useConsortium(id);
  const deleteConsortium = useDeleteConsortium();

  const canEdit = hasPermission(FINANCE_PERMISSIONS.CONSORTIA.MODIFY);
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

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];

    if (canEdit) {
      buttons.push({
        id: 'edit-consortium',
        title: 'Editar',
        icon: Edit,
        onClick: () => router.push(`/finance/consortia/${id}/edit`),
        variant: 'outline',
      });
    }

    if (canDelete) {
      buttons.push({
        id: 'delete-consortium',
        title: 'Excluir',
        icon: Trash2,
        onClick: () => setDeleteModalOpen(true),
        variant: 'default',
        className:
          'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
      });
    }

    return buttons;
  }, [canEdit, canDelete, router, id]);

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Consórcios', href: '/finance/consortia' },
    { label: consortium?.name || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !consortium) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Consórcio não encontrado"
            message="O consórcio solicitado não foi encontrado."
            action={{
              label: 'Voltar para Consórcios',
              onClick: () => router.push('/finance/consortia'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-pink-600 shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">
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
              <p className="text-sm text-muted-foreground mt-0.5">
                Administradora: {consortium.administrator}
                {consortium.groupNumber &&
                  ` | Grupo: ${consortium.groupNumber}`}
                {consortium.quotaNumber && ` | Cota: ${consortium.quotaNumber}`}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Progresso</p>
                <p className="text-[11px] text-muted-foreground">
                  {consortium.paidInstallments}/{consortium.totalInstallments} ({progressPercentage}%)
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </Card>

        {/* Summary Cards */}
        <ConsortiumDetailCards consortium={consortium} />

        {/* Due-Soon Alert */}
        {consortium.payments && consortium.payments.length > 0 && (
          <DueSoonAlert payments={consortium.payments} />
        )}

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Dados do Consorcio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                Dados do Consórcio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Administradora" value={consortium.administrator} />
              {consortium.groupNumber && (
                <InfoRow label="Grupo" value={consortium.groupNumber} />
              )}
              {consortium.quotaNumber && (
                <InfoRow label="Cota" value={consortium.quotaNumber} />
              )}
              <InfoRow
                label="Valor do Crédito"
                value={formatCurrency(consortium.creditValue)}
              />
              <InfoRow
                label="Status"
                value={CONSORTIUM_STATUS_LABELS[consortium.status]}
              />
              {consortium.contractNumber && (
                <InfoRow label="Contrato" value={consortium.contractNumber} />
              )}
            </CardContent>
          </Card>

          {/* Card 2: Valores */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Parcela Mensal"
                value={formatCurrency(consortium.monthlyPayment)}
              />
              <InfoRow
                label="Total de Parcelas"
                value={String(consortium.totalInstallments)}
              />
              <InfoRow
                label="Parcelas Pagas"
                value={String(consortium.paidInstallments)}
              />
              <InfoRow
                label="Parcelas Restantes"
                value={String(
                  consortium.totalInstallments - consortium.paidInstallments
                )}
              />
              <div className="pt-2 border-t">
                <InfoRow
                  label="Total Estimado"
                  value={formatCurrency(
                    consortium.monthlyPayment * consortium.totalInstallments
                  )}
                  className="font-bold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Contemplacao */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" />
                Contemplação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Contemplado"
                value={consortium.isContemplated ? 'Sim' : 'Não'}
              />
              {consortium.isContemplated && consortium.contemplatedAt && (
                <InfoRow
                  label="Data"
                  value={formatDate(consortium.contemplatedAt)}
                />
              )}
              {consortium.isContemplated && consortium.contemplationType && (
                <InfoRow
                  label="Tipo"
                  value={
                    consortium.contemplationType === 'BID' ? 'Lance' : 'Sorteio'
                  }
                />
              )}
              {!consortium.isContemplated && consortium.status === 'ACTIVE' && canEdit && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setContemplationModalOpen(true)}
                    className="gap-2"
                  >
                    <Star className="h-4 w-4" />
                    Marcar como Contemplado
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 4: Vinculacao */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Vinculação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {consortium.bankAccountName && (
                <InfoRow label="Conta Bancária" value={consortium.bankAccountName} />
              )}
              {consortium.costCenterName && (
                <InfoRow label="Centro de Custo" value={consortium.costCenterName} />
              )}
              <InfoRow
                label="Data de Adesão"
                value={formatDate(consortium.startDate)}
              />
              {consortium.paymentDay && (
                <InfoRow
                  label="Dia de Vencimento"
                  value={`Dia ${consortium.paymentDay}`}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {consortium.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{consortium.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Cost Comparison */}
        <CostComparison consortium={consortium} />

        {/* Payment Tracking Table */}
        {consortium.payments && consortium.payments.length > 0 && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Histórico de Pagamentos
                <Badge variant="secondary">{consortium.payments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                          {payment.status !== 'PAID' && canEdit && (
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
            </CardContent>
          </Card>
        )}
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
        description={`Digite seu PIN de Ação para excluir o consórcio "${consortium.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
