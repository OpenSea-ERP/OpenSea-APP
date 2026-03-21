/**
 * OpenSea OS - Loans Listing Page
 * Página de listagem de empréstimos com filtros, scroll infinito e ações RBAC.
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useDeleteLoan, useInfiniteLoans } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { Loan, LoanStatus } from '@/types/finance';
import { LOAN_STATUS_LABELS } from '@/types/finance';
import {
  AlertTriangle,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS: { value: LoanStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'PAID_OFF', label: 'Quitado' },
  { value: 'DEFAULTED', label: 'Inadimplente' },
  { value: 'RENEGOTIATED', label: 'Renegociado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

// =============================================================================
// HELPERS
// =============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return '0,00%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function getStatusVariant(
  status: LoanStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PAID_OFF':
      return 'default';
    case 'DEFAULTED':
      return 'destructive';
    case 'RENEGOTIATED':
      return 'warning';
    case 'CANCELLED':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-600';
  if (percentage >= 50) return 'text-blue-600';
  if (percentage >= 25) return 'text-amber-600';
  return 'text-muted-foreground';
}

// =============================================================================
// TABLE LOADING SKELETON
// =============================================================================

function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-0">
        <Table aria-label="Tabela de simulação de amortização">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Contrato</TableHead>
              <TableHead className="text-right hidden md:table-cell">
                Valor Principal
              </TableHead>
              <TableHead className="text-right">Saldo Devedor</TableHead>
              <TableHead className="text-center hidden lg:table-cell">
                Taxa
              </TableHead>
              <TableHead className="text-center hidden md:table-cell">
                Parcelas
              </TableHead>
              <TableHead className="hidden lg:table-cell">Progresso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-28 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28 ml-auto" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-2 w-full rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-6 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({
  canCreate,
  onCreate,
}: {
  canCreate: boolean;
  onCreate: () => void;
}) {
  return (
    <Card className="bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10">
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <XCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum empréstimo encontrado
        </h3>
        <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
          Não existem empréstimos cadastrados com os filtros selecionados.
          {canCreate &&
            ' Crie um novo empréstimo para começar a gerenciar suas operações de crédito.'}
        </p>
        {canCreate && (
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Empréstimo
          </Button>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// ROW ACTIONS MENU
// =============================================================================

function LoanRowActions({
  loan,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  loan: Loan;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (loan: Loan) => void;
}) {
  if (!canView && !canEdit && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Base actions */}
        {canView && (
          <DropdownMenuItem
            onClick={e => {
              e.stopPropagation();
              onView(loan.id);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
        )}
        {canEdit && (
          <DropdownMenuItem
            onClick={e => {
              e.stopPropagation();
              onEdit(loan.id);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        )}

        {/* Destructive actions */}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={e => {
                e.stopPropagation();
                onDelete(loan);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function LoansPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // --------------------------------------------------------------------------
  // Permissions
  // --------------------------------------------------------------------------
  const canList = hasPermission(FINANCE_PERMISSIONS.LOANS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.LOANS.REGISTER);
  const canView = hasPermission(FINANCE_PERMISSIONS.LOANS.ACCESS);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.LOANS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.LOANS.REMOVE);

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'ALL'>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Data Fetching (infinite scroll)
  // --------------------------------------------------------------------------
  const queryParams = useMemo(
    () => ({
      perPage: 20,
      search: searchQuery || undefined,
      status: statusFilter !== 'ALL' ? (statusFilter as LoanStatus) : undefined,
    }),
    [searchQuery, statusFilter]
  );

  const {
    data,
    isLoading,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteLoans(queryParams);
  const deleteLoan = useDeleteLoan();

  const loans = data?.pages.flatMap(p => p.loans) ?? [];

  // --------------------------------------------------------------------------
  // IntersectionObserver sentinel for infinite scroll
  // --------------------------------------------------------------------------
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as LoanStatus | 'ALL');
  }, []);

  const handleCreate = useCallback(() => {
    router.push('/finance/loans/new');
  }, [router]);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/finance/loans/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/finance/loans/${id}`);
    },
    [router]
  );

  const handleRowClick = useCallback(
    (loan: Loan) => {
      if (canView) {
        router.push(`/finance/loans/${loan.id}`);
      }
    },
    [router, canView]
  );

  const handleDeleteRequest = useCallback((loan: Loan) => {
    setDeleteTarget(loan);
    setPinModalOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteLoan.mutateAsync(deleteTarget.id);
      toast.success(`Empréstimo "${deleteTarget.name}" excluído com sucesso.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir empréstimo';
      toast.error(message);
    }
  }, [deleteTarget, deleteLoan, refetch]);

  // --------------------------------------------------------------------------
  // Header Action Buttons (permission-aware)
  // --------------------------------------------------------------------------
  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-loan',
        title: 'Novo Empréstimo',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.LOANS.REGISTER,
      },
    ],
    [handleCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // --------------------------------------------------------------------------
  // Active filters indicator
  // --------------------------------------------------------------------------
  const hasActiveFilters = statusFilter !== 'ALL';

  const handleClearFilters = useCallback(() => {
    setStatusFilter('ALL');
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Empréstimos', href: '/finance/loans' },
          ]}
          buttons={visibleActionButtons}
        />

        <Header
          title="Empréstimos"
          description="Gerencie empréstimos, financiamentos e linhas de crédito"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          placeholder="Buscar por nome, contrato ou tipo..."
          onSearch={handleSearch}
          onClear={() => handleSearch('')}
          showClear={true}
          size="md"
        />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {STATUS_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar empréstimos"
            message="Ocorreu um erro ao tentar carregar os empréstimos. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : !canList ? (
          <GridError
            type="forbidden"
            title="Acesso restrito"
            message="Você não possui permissão para visualizar empréstimos."
          />
        ) : loans.length === 0 ? (
          <EmptyState canCreate={canCreate} onCreate={handleCreate} />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table aria-label="Tabela de empréstimos">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nome</TableHead>
                    <TableHead className="min-w-[120px] hidden md:table-cell">
                      Contrato
                    </TableHead>
                    <TableHead className="text-right min-w-[140px] hidden md:table-cell">
                      Valor Principal
                    </TableHead>
                    <TableHead className="text-right min-w-[140px]">
                      Saldo Devedor
                    </TableHead>
                    <TableHead className="text-center min-w-[90px] hidden lg:table-cell">
                      Taxa
                    </TableHead>
                    <TableHead className="text-center min-w-[100px] hidden md:table-cell">
                      Parcelas
                    </TableHead>
                    <TableHead className="min-w-[140px] hidden lg:table-cell">
                      Progresso
                    </TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(loan => {
                    const progressPercentage =
                      loan.totalInstallments > 0
                        ? Math.round(
                            (loan.paidInstallments / loan.totalInstallments) *
                              100
                          )
                        : 0;

                    const isDefaulted = loan.status === 'DEFAULTED';

                    return (
                      <TableRow
                        key={loan.id}
                        className={canView ? 'cursor-pointer' : ''}
                        onClick={() => handleRowClick(loan)}
                      >
                        {/* Nome */}
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {loan.name}
                            {isDefaulted && (
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                          </div>
                        </TableCell>

                        {/* Contrato */}
                        <TableCell className="hidden md:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">
                            {loan.contractNumber || '\u2014'}
                          </span>
                        </TableCell>

                        {/* Valor Principal */}
                        <TableCell className="text-right font-mono text-sm hidden md:table-cell">
                          {formatCurrency(loan.principalAmount)}
                        </TableCell>

                        {/* Saldo Devedor */}
                        <TableCell className="text-right font-mono text-sm font-semibold">
                          <span
                            className={
                              loan.outstandingBalance > 0
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {formatCurrency(loan.outstandingBalance)}
                          </span>
                        </TableCell>

                        {/* Taxa de Juros */}
                        <TableCell className="text-center font-mono text-sm hidden lg:table-cell">
                          {formatPercent(loan.interestRate)}
                        </TableCell>

                        {/* Parcelas (pagas/total) */}
                        <TableCell className="text-center hidden md:table-cell">
                          <span className="font-mono text-sm">
                            {loan.paidInstallments}
                            <span className="text-muted-foreground">
                              /{loan.totalInstallments}
                            </span>
                          </span>
                        </TableCell>

                        {/* Progresso */}
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress
                              value={progressPercentage}
                              className="h-2 flex-1"
                            />
                            <span
                              className={`text-xs font-medium min-w-[36px] text-right ${getProgressColor(progressPercentage)}`}
                            >
                              {progressPercentage}%
                            </span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={getStatusVariant(loan.status)}>
                            {LOAN_STATUS_LABELS[loan.status]}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell
                          onClick={e => e.stopPropagation()}
                          className="text-center"
                        >
                          <LoanRowActions
                            loan={loan}
                            canView={canView}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDeleteRequest}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

          </Card>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        )}

        {/* Delete PIN Confirmation Modal */}
        <VerifyActionPinModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setDeleteTarget(null);
          }}
          onSuccess={handleDeleteConfirmed}
          title="Confirmar Exclusão"
          description={
            deleteTarget
              ? `Digite seu PIN de Ação para excluir o empréstimo "${deleteTarget.name}". Esta ação não pode ser desfeita.`
              : 'Digite seu PIN de Ação para autorizar esta operação.'
          }
        />
      </PageBody>
    </PageLayout>
  );
}
