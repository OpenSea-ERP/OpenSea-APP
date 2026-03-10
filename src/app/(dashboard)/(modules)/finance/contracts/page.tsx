/**
 * OpenSea OS - Contracts Listing Page
 * Pagina de listagem de contratos com filtros, paginacao e acoes RBAC.
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
import { useContracts, useDeleteContract } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { Contract, ContractStatus } from '@/types/finance';
import { CONTRACT_STATUS_LABELS, PAYMENT_FREQUENCY_LABELS } from '@/types/finance';
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'EXPIRED', label: 'Expirado' },
  { value: 'RENEWED', label: 'Renovado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PER_PAGE = 20;

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

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr));
}

function getStatusVariant(
  status: ContractStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'DRAFT':
      return 'secondary';
    case 'EXPIRED':
      return 'destructive';
    case 'RENEWED':
      return 'default';
    case 'CANCELLED':
      return 'warning';
    default:
      return 'secondary';
  }
}

// =============================================================================
// TABLE LOADING SKELETON
// =============================================================================

function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titulo</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Frequencia</TableHead>
              <TableHead className="text-center">Vigencia</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-36 mx-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-6 mx-auto" /></TableCell>
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
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nenhum contrato encontrado
        </h3>
        <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
          Nao existem contratos cadastrados com os filtros selecionados.
          {canCreate &&
            ' Crie um novo contrato para comecar a gerenciar seus fornecedores e pagamentos recorrentes.'}
        </p>
        {canCreate && (
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// ROW ACTIONS MENU
// =============================================================================

function ContractRowActions({
  contract,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  contract: Contract;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (contract: Contract) => void;
}) {
  if (!canView && !canEdit && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canView && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onView(contract.id);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Visualizar
          </DropdownMenuItem>
        )}
        {canEdit && !contract.isCancelled && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(contract.id);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
        )}
        {canDelete && !contract.isCancelled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(contract);
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
// PAGINATION
// =============================================================================

function TablePagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-muted-foreground">
        Exibindo <span className="font-medium">{from}</span> a{' '}
        <span className="font-medium">{to}</span> de{' '}
        <span className="font-medium">{total}</span> resultado
        {total !== 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Pagina {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="gap-1"
        >
          <span className="hidden sm:inline">Proxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function ContractsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Permissions
  const canList = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.LIST);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.CREATE);
  const canView = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.READ);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.UPDATE);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CONTRACTS.DELETE);

  // State
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'ALL'>(
    'ALL'
  );
  const [deleteTarget, setDeleteTarget] = useState<Contract | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // Data Fetching
  const queryParams = useMemo(
    () => ({
      page,
      perPage: PER_PAGE,
      search: searchQuery || undefined,
      status:
        statusFilter !== 'ALL'
          ? (statusFilter as ContractStatus)
          : undefined,
    }),
    [page, searchQuery, statusFilter]
  );

  const { data, isLoading, error, refetch } = useContracts(queryParams);
  const deleteContract = useDeleteContract();

  const contracts = data?.contracts ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  // Handlers
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as ContractStatus | 'ALL');
    setPage(1);
  }, []);

  const handleCreate = useCallback(() => {
    router.push('/finance/contracts/new');
  }, [router]);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/finance/contracts/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/finance/contracts/${id}`);
    },
    [router]
  );

  const handleRowClick = useCallback(
    (contract: Contract) => {
      if (canView) {
        router.push(`/finance/contracts/${contract.id}`);
      }
    },
    [router, canView]
  );

  const handleDeleteRequest = useCallback((contract: Contract) => {
    setDeleteTarget(contract);
    setPinModalOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteContract.mutateAsync(deleteTarget.id);
      toast.success(
        `Contrato "${deleteTarget.title}" excluido com sucesso.`
      );
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir contrato';
      toast.error(message);
    }
  }, [deleteTarget, deleteContract, refetch]);

  // Header action buttons
  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-contract',
        title: 'Novo Contrato',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.CONTRACTS.CREATE,
      },
    ],
    [handleCreate]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter((button) =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // Active filters
  const hasActiveFilters = statusFilter !== 'ALL';
  const handleClearFilters = useCallback(() => {
    setStatusFilter('ALL');
    setPage(1);
  }, []);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Contratos', href: '/finance/contracts' },
          ]}
          buttons={visibleActionButtons}
        />
        <Header
          title="Contratos"
          description="Gerencie contratos com fornecedores e pagamentos recorrentes"
        />
      </PageHeader>

      <PageBody>
        <SearchBar
          value={searchQuery}
          placeholder="Buscar por titulo, empresa ou codigo..."
          onSearch={handleSearch}
          onClear={() => handleSearch('')}
          showClear={true}
          size="md"
        />

        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
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
            title="Erro ao carregar contratos"
            message="Ocorreu um erro ao tentar carregar os contratos. Por favor, tente novamente."
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
            message="Voce nao possui permissao para visualizar contratos."
          />
        ) : contracts.length === 0 ? (
          <EmptyState canCreate={canCreate} onCreate={handleCreate} />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[60px]">Codigo</TableHead>
                    <TableHead className="min-w-[180px]">Titulo</TableHead>
                    <TableHead className="min-w-[150px]">Empresa</TableHead>
                    <TableHead className="text-right min-w-[130px]">
                      Valor Total
                    </TableHead>
                    <TableHead className="text-right min-w-[130px]">
                      Parcela
                    </TableHead>
                    <TableHead className="text-center min-w-[100px]">
                      Frequencia
                    </TableHead>
                    <TableHead className="text-center min-w-[100px]">
                      Vigencia
                    </TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => {
                    const isExpired = contract.isExpired;
                    const isNearExpiry =
                      contract.daysUntilExpiration > 0 &&
                      contract.daysUntilExpiration <= contract.alertDaysBefore;

                    return (
                      <TableRow
                        key={contract.id}
                        className={canView ? 'cursor-pointer' : ''}
                        onClick={() => handleRowClick(contract)}
                      >
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">
                            {contract.code}
                          </span>
                        </TableCell>

                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {contract.title}
                            {isNearExpiry && !isExpired && (
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            {isExpired && (
                              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {contract.companyName}
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(contract.totalValue)}
                        </TableCell>

                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(contract.paymentAmount)}
                        </TableCell>

                        <TableCell className="text-center text-sm">
                          {PAYMENT_FREQUENCY_LABELS[contract.paymentFrequency] ??
                            contract.paymentFrequency}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(contract.startDate)} -{' '}
                            {formatDate(contract.endDate)}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusVariant(contract.status)}>
                            {CONTRACT_STATUS_LABELS[contract.status]}
                          </Badge>
                        </TableCell>

                        <TableCell
                          onClick={(e) => e.stopPropagation()}
                          className="text-center"
                        >
                          <ContractRowActions
                            contract={contract}
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

            {total > PER_PAGE && (
              <div className="border-t">
                <TablePagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  perPage={PER_PAGE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        )}

        <VerifyActionPinModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setDeleteTarget(null);
          }}
          onSuccess={handleDeleteConfirmed}
          title="Confirmar Exclusao"
          description={
            deleteTarget
              ? `Digite seu PIN de Acao para excluir o contrato "${deleteTarget.title}". Esta acao nao pode ser desfeita.`
              : 'Digite seu PIN de Acao para autorizar esta operacao.'
          }
        />
      </PageBody>
    </PageLayout>
  );
}
