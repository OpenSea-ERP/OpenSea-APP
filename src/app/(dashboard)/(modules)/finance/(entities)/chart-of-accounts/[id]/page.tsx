/**
 * Chart of Account Detail Page
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
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useChartOfAccount,
  useChartOfAccounts,
  useDeleteChartOfAccount,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { ChartOfAccount, ChartOfAccountType } from '@/types/finance';
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Edit,
  FolderTree,
  Info,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPE_LABELS: Record<ChartOfAccountType, string> = {
  ASSET: 'Ativo',
  LIABILITY: 'Passivo',
  EQUITY: 'Patrimonio Liquido',
  REVENUE: 'Receita',
  EXPENSE: 'Despesa',
};

const TYPE_COLORS: Record<ChartOfAccountType, string> = {
  ASSET:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  LIABILITY:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  EQUITY:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  REVENUE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  EXPENSE:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

const CLASS_LABELS: Record<string, string> = {
  CURRENT: 'Circulante',
  NON_CURRENT: 'Nao Circulante',
  OPERATIONAL: 'Operacional',
  FINANCIAL: 'Financeiro',
  OTHER: 'Outro',
};

const NATURE_LABELS: Record<string, string> = {
  DEBIT: 'Debito',
  CREDIT: 'Credito',
};

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5 text-foreground/70" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function ChartOfAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useChartOfAccount(id);
  const account = data?.chartOfAccount;
  const deleteMutation = useDeleteChartOfAccount();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.REMOVE);

  // Fetch all accounts to find parent and children
  const { data: allData } = useChartOfAccounts({ perPage: 100 });
  const allAccounts = allData?.chartOfAccounts ?? [];

  const parentAccount = useMemo(() => {
    if (!account?.parentId) return null;
    return allAccounts.find(a => a.id === account.parentId) ?? null;
  }, [account, allAccounts]);

  const childAccounts = useMemo(() => {
    if (!account) return [];
    return allAccounts
      .filter(a => a.parentId === account.id)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [account, allAccounts]);

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Plano de Contas', href: '/finance/chart-of-accounts' },
    ...(account ? [{ label: `${account.code} - ${account.name}` }] : []),
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
              { label: 'Plano de Contas', href: '/finance/chart-of-accounts' },
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
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
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
              { label: 'Plano de Contas', href: '/finance/chart-of-accounts' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-12 text-center">
            <p className="text-destructive text-lg">
              Conta contabil nao encontrada.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    toast.success('Conta contabil excluida com sucesso.');
    router.push('/finance/chart-of-accounts');
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(canDelete && !account.isSystem
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
            onClick: () => router.push(`/finance/chart-of-accounts/${id}/edit`),
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
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">{account.name}</h1>
                <Badge
                  variant="outline"
                  className={cn('text-xs', TYPE_COLORS[account.type])}
                >
                  {TYPE_LABELS[account.type]}
                </Badge>
                {account.isSystem && (
                  <Badge
                    variant="outline"
                    className="text-xs border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-600 dark:text-slate-300"
                  >
                    Sistema
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                Codigo: {account.code}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  account.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300'
                )}
              >
                {account.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* System Account Warning */}
        {account.isSystem && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/8 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Esta e uma conta de sistema. Ela nao pode ser excluida e algumas
              propriedades podem ser restritas.
            </p>
          </div>
        )}

        {/* Details Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4">
            <SectionHeader icon={Info} title="Classificacao" />
            <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', TYPE_COLORS[account.type])}
                  >
                    {TYPE_LABELS[account.type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Classe</p>
                  <p className="font-medium">
                    {CLASS_LABELS[account.accountClass] ?? account.accountClass}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Natureza</p>
                  <p className="font-medium">
                    {NATURE_LABELS[account.nature] ?? account.nature}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      account.isActive
                        ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {account.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Criado em
                  </p>
                  <p className="font-medium">
                    {new Date(account.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {account.updatedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Atualizado em
                    </p>
                    <p className="font-medium">
                      {new Date(account.updatedAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Parent Account */}
        {parentAccount && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4">
              <SectionHeader icon={FolderTree} title="Conta Pai" />
              <div className="w-full rounded-xl border border-border bg-white p-4 dark:bg-slate-800/60">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/finance/chart-of-accounts/${parentAccount.id}`
                    )
                  }
                  className="flex items-center gap-3 w-full text-left hover:bg-muted/50 rounded-lg p-2 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10">
                    <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{parentAccount.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {parentAccount.code}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Children Accounts */}
        {childAccounts.length > 0 && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4">
              <SectionHeader icon={FolderTree} title="Contas Filhas" />
              <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 divide-y divide-border">
                {childAccounts.map((child: ChartOfAccount) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() =>
                      router.push(`/finance/chart-of-accounts/${child.id}`)
                    }
                    className="flex items-center gap-3 w-full text-left hover:bg-muted/50 p-4 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700/50">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {child.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {child.code}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[11px] shrink-0',
                        TYPE_COLORS[child.type]
                      )}
                    >
                      {TYPE_LABELS[child.type]}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}
      </PageBody>

      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Conta Contabil"
        description={`Digite seu PIN de acao para excluir "${account.code} - ${account.name}".`}
      />
    </PageLayout>
  );
}
