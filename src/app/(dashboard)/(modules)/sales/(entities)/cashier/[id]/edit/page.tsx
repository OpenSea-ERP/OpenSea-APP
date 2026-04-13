/**
 * OpenSea OS - Edit Cashier Session Page
 * Página de edição de notas da sessão (somente sessões abertas)
 */

'use client';

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
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useCashierSession,
  useCloseCashierSession,
} from '@/hooks/sales/use-cashier';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { CashierSession } from '@/types/sales';
import { CASHIER_SESSION_STATUS_LABELS } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  Calculator,
  Loader2,
  Lock,
  NotebookText,
  Save,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

export default function EditCashierSessionPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const sessionId = params.id as string;

  const {
    data: sessionData,
    isLoading: isLoadingSession,
    error,
  } = useCashierSession(sessionId);

  const session = sessionData?.session as CashierSession | undefined;

  const closeMutation = useCloseCashierSession();

  const [isSaving, setIsSaving] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [closingBalance, setClosingBalance] = useState('');

  useEffect(() => {
    if (session) {
      setNotes(session.notes || '');
    }
  }, [session]);

  const handleCloseSession = async () => {
    const balance = parseFloat(closingBalance);
    if (isNaN(balance) || balance < 0) {
      toast.error('Informe um saldo de fechamento válido');
      return;
    }

    try {
      setIsSaving(true);
      await closeMutation.mutateAsync({
        id: sessionId,
        data: {
          closingBalance: balance,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Caixa fechado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['cashier'],
      });
      router.push(`/sales/cashier/${sessionId}`);
    } catch (err) {
      logger.error(
        'Erro ao fechar caixa',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao fechar caixa', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const actionButtons: HeaderButton[] = [
    ...(session?.status === 'OPEN' &&
    hasPermission(SALES_PERMISSIONS.CASHIER.CLOSE)
      ? [
          {
            id: 'close-session',
            title: 'Fechar Caixa',
            icon: XCircle,
            onClick: () => setCloseModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    ...(session?.status === 'OPEN'
      ? [
          {
            id: 'save',
            title: isSaving ? 'Salvando...' : 'Salvar Notas',
            icon: isSaving ? Loader2 : Save,
            onClick: async () => {
              // Notes-only save would need a dedicated endpoint
              toast.info('As notas serão salvas ao fechar o caixa.');
            },
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Caixa', href: '/sales/cashier' },
    {
      label: session ? `Sessão #${session.id.substring(0, 8)}` : '...',
      href: `/sales/cashier/${sessionId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingSession) {
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

  if (error || !session) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Sessão não encontrada"
            message="A sessão solicitada não foi encontrada."
            action={{
              label: 'Voltar para Caixa',
              onClick: () => router.push('/sales/cashier'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const isClosed = session.status !== 'OPEN';
  const statusLabel =
    CASHIER_SESSION_STATUS_LABELS[session.status] || session.status;

  return (
    <PageLayout data-testid="cashier-edit">
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-teal-500 to-cyan-600">
              <Calculator className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {isClosed ? 'Sessão fechada' : 'Editando sessão'}
              </p>
              <h1 className="text-xl font-bold truncate">
                Sessão #{session.id.substring(0, 8)}
              </h1>
              <p className="text-sm text-muted-foreground">
                Abertura: {formatCurrency(session.openingBalance)}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  session.status === 'OPEN'
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {statusLabel}
              </div>
            </div>
          </div>
        </Card>

        {isClosed ? (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Lock className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-base font-semibold text-muted-foreground">
                  Sessão Fechada
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta sessão já foi fechada e não pode ser editada.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            {/* Form Card: Fechamento */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={Calculator}
                    title="Fechamento de Caixa"
                    subtitle="Informe o saldo para fechar o caixa"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="closingBalance">
                        Saldo de Fechamento{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="closingBalance"
                        type="number"
                        step="0.01"
                        min="0"
                        value={closingBalance}
                        onChange={e => setClosingBalance(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Card: Observações */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-8">
                <div className="space-y-5">
                  <SectionHeader
                    icon={NotebookText}
                    title="Observações"
                    subtitle="Notas sobre a sessão de caixa"
                  />
                  <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                    <div className="grid gap-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notas sobre a sessão de caixa..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </PageBody>

      {/* Close Session PIN Modal */}
      <VerifyActionPinModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onSuccess={handleCloseSession}
        title="Fechar Caixa"
        description={`Digite seu PIN de ação para fechar o caixa. Saldo de fechamento: ${closingBalance ? formatCurrency(parseFloat(closingBalance) || 0) : 'não informado'}.`}
      />
    </PageLayout>
  );
}
