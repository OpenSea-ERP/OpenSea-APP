/**
 * Bank Account Detail Page
 */

'use client';

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
import { Skeleton } from '@/components/ui/skeleton';
import { useBankAccount, useDeleteBankAccount } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import PermissionCodes from '@/config/rbac/permission-codes';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
  PIX_KEY_TYPE_LABELS,
} from '@/types/finance';
import { ArrowLeft, Building2, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { toast } from 'sonner';

export default function BankAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useBankAccount(id);
  const account = data?.bankAccount;
  const deleteMutation = useDeleteBankAccount();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(PermissionCodes.FINANCE.BANK_ACCOUNTS.REMOVE);

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
          <Card className="p-12 text-center">
            <p className="text-destructive text-lg">
              Conta bancária não encontrada.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    toast.success('Conta bancária excluída com sucesso.');
    router.push('/finance/bank-accounts');
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'BLOCKED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/bank-accounts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar para contas bancárias
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(true)}
              className="gap-2"
            >
              <Trash className="h-4 w-4 text-rose-600" />
              Excluir
            </Button>
          )}

          <Link href={`/finance/bank-accounts/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit className="h-4 w-4 text-sky-500" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Info Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex gap-4 sm:flex-row items-center sm:gap-6">
          <div
            className="flex items-center justify-center h-10 w-10 md:h-16 md:w-16 rounded-lg shrink-0"
            style={{
              backgroundColor: account.color || '#3b82f6',
            }}
          >
            <Building2 className="md:h-8 md:w-8 text-white" />
          </div>
          <div className="flex justify-between flex-1 gap-4 flex-row items-center">
            <div>
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
                {account.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {account.bankName} - {account.bankCode}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={getStatusVariant(account.status)}>
                {BANK_ACCOUNT_STATUS_LABELS[account.status]}
              </Badge>
              {account.isDefault && <Badge variant="outline">Padrão</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Account Details */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Dados da Conta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Banco</p>
            <p className="font-medium">
              {account.bankName} ({account.bankCode})
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Tipo de Conta</p>
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
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Dados PIX</h2>
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
      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Saldo</h2>
        <div>
          <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
          <p className="text-3xl font-bold text-emerald-600">
            {formatCurrency(account.currentBalance)}
          </p>
        </div>
      </Card>

      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Conta Bancária"
        description={`Digite seu PIN de ação para excluir "${account.name}".`}
      />
    </div>
  );
}
