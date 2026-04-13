/**
 * Bank Account Detail Page
 * Follows pattern: PageLayout > PageActionBar > Identity Card > Content Cards
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { BankApiSetupModal } from '@/components/finance/bank-api-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useBankAccount, useDeleteBankAccount } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
  PIX_KEY_TYPE_LABELS,
} from '@/types/finance';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit,
  Plug,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// =============================================================================
// HELPERS
// =============================================================================

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300';
    case 'INACTIVE':
      return 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300';
    case 'BLOCKED':
      return 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300';
    default:
      return 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300';
  }
};

// =============================================================================
// PAGE
// =============================================================================

export default function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useBankAccount(id);
  const account = data?.bankAccount;
  const deleteMutation = useDeleteBankAccount();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [apiSetupOpen, setApiSetupOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.REMOVE);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.MODIFY);

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
    ...(account ? [{ label: account.name }] : []),
  ];

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
              { label: 'Carregando...' },
            ]}
          />
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
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-10 w-48" />
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // NOT FOUND
  // ============================================================================

  if (!account) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Conta bancária não encontrada
            </h2>
            <p className="text-muted-foreground mb-6">
              A conta bancária que você está procurando não existe ou foi
              removida.
            </p>
            <Button onClick={() => router.push('/finance/bank-accounts')}>
              Voltar para Contas Bancárias
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Conta bancária excluída com sucesso.');
      router.push('/finance/bank-accounts');
    } catch {
      toast.error('Erro ao excluir conta bancária.');
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(canDelete
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            id: 'edit',
            title: 'Editar',
            icon: Edit,
            onClick: () => router.push(`/finance/bank-accounts/${id}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

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
        <Card className="bg-white/5 p-5" data-testid="bank-account-identity">
          <div className="flex items-start gap-5">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{
                backgroundColor: account.color || '#3b82f6',
              }}
            >
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  data-testid="bank-account-name"
                >
                  {account.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn('text-xs', getStatusBadgeClass(account.status))}
                >
                  {BANK_ACCOUNT_STATUS_LABELS[account.status]}
                </Badge>
                {account.isDefault && (
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300"
                  >
                    Padrão
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {account.bankName} - {account.bankCode}
              </p>
            </div>
          </div>
        </Card>

        {/* Account Details */}
        <Card
          className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          data-testid="bank-account-details"
        >
          <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5" />
            Dados da Conta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Banco</p>
              <p className="font-medium">
                {account.bankName} ({account.bankCode})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Tipo de Conta
              </p>
              <p className="font-medium">
                {BANK_ACCOUNT_TYPE_LABELS[account.accountType]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Agência</p>
              <p className="font-medium">
                {account.agency}
                {account.agencyDigit && `-${account.agencyDigit}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conta</p>
              <p className="font-medium">
                {account.accountNumber}
                {account.accountDigit && `-${account.accountDigit}`}
              </p>
            </div>
          </div>
        </Card>

        {/* PIX Information */}
        {account.pixKey && (
          <Card
            className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
            data-testid="bank-account-pix"
          >
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
              Dados PIX
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tipo de Chave
                </p>
                <p className="font-medium">
                  {account.pixKeyType
                    ? PIX_KEY_TYPE_LABELS[account.pixKeyType]
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Chave PIX</p>
                <p className="font-medium">{account.pixKey}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Balance Card */}
        <Card
          className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          data-testid="bank-account-balance"
        >
          <h3 className="text-lg uppercase font-semibold flex items-center gap-2 mb-4">
            Saldo
          </h3>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(account.currentBalance)}
            </p>
          </div>
        </Card>

        {/* API Integration Card */}
        <Card
          className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          data-testid="bank-account-api"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg uppercase font-semibold">
                Integração API
              </h3>
            </div>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9 px-2.5"
                onClick={() => setApiSetupOpen(true)}
              >
                <Settings2 className="h-4 w-4" />
                Configurar
              </Button>
            )}
          </div>

          {account.apiEnabled ? (
            <div className="space-y-4">
              {/* Status: Connected */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Conectado
                </span>
                {account.apiProvider && (
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
                  >
                    {account.apiProvider}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {account.apiClientId && (
                  <div>
                    <p className="text-muted-foreground mb-1">Client ID</p>
                    <p className="font-mono text-xs">
                      {account.apiClientId.slice(0, 12)}...
                    </p>
                  </div>
                )}
                {account.autoEmitBoleto !== undefined && (
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Emissão automática de boleto
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs',
                        account.autoEmitBoleto
                          ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {account.autoEmitBoleto ? 'Ativada' : 'Desativada'}
                    </Badge>
                  </div>
                )}
                {account.apiLastSyncAt && (
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Última sincronização
                    </p>
                    <p className="font-medium">
                      {new Date(account.apiLastSyncAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Integração de API bancária não configurada.
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure as credenciais para habilitar emissão de boletos e
                  cobranças PIX diretamente pelo sistema.
                </p>
              </div>
            </div>
          )}
        </Card>
      </PageBody>

      {/* Delete PIN Confirmation */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Conta Bancária"
        description={`Digite seu PIN de Ação para confirmar a exclusão da conta bancária "${account.name}". Esta ação não pode ser desfeita.`}
      />

      <BankApiSetupModal
        open={apiSetupOpen}
        onOpenChange={setApiSetupOpen}
        bankAccountId={id}
        bankAccount={account}
        onSaved={() => {
          void queryClient.invalidateQueries({
            queryKey: ['bank-accounts', id],
          });
        }}
      />
    </PageLayout>
  );
}
