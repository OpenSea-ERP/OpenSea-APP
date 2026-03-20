/**
 * OpenSea OS - Consortia Listing Page
 * Página de listagem de consórcios com filtros, paginação e ações RBAC.
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
import { useConsortia, useDeleteConsortium } from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { Consortium, ConsortiumStatus } from '@/types/finance';
import { CONSORTIUM_STATUS_LABELS } from '@/types/finance';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const PERMISSION_CODES = {
  list: FINANCE_PERMISSIONS.CONSORTIA.ACCESS,
  create: FINANCE_PERMISSIONS.CONSORTIA.REGISTER,
  read: FINANCE_PERMISSIONS.CONSORTIA.ACCESS,
  update: FINANCE_PERMISSIONS.CONSORTIA.MODIFY,
  delete: FINANCE_PERMISSIONS.CONSORTIA.REMOVE,
} as const;

const STATUS_OPTIONS: { value: ConsortiumStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'CONTEMPLATED', label: 'Contemplado' },
  { value: 'WITHDRAWN', label: 'Desistente' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

const PER_PAGE = 20;

// ============================================================================
// HELPERS
// ============================================================================

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

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return 'text-emerald-600';
  if (percentage >= 50) return 'text-blue-600';
  if (percentage >= 25) return 'text-amber-600';
  return 'text-muted-foreground';
}

// ============================================================================
// TABLE LOADING SKELETON
// ============================================================================

function TableSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-0">
        <Table aria-label="Tabela de comparação de custos">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Administradora</TableHead>
              <TableHead>Grupo/Cota</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead className="text-right">Parcela Mensal</TableHead>
              <TableHead className="text-center">Parcelas</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-center">Contemplado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16 mx-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-2 w-full rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-12 mx-auto rounded-full" />
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

// ============================================================================
// EMPTY STATE
// ============================================================================

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
          Nenhum consórcio encontrado
        </h3>
        <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
          Não existem consórcios cadastrados com os filtros selecionados.
          {canCreate &&
            ' Crie um novo consórcio para começar a gerenciar suas cotas.'}
        </p>
        {canCreate && (
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Consórcio
          </Button>
        )}
      </div>
    </Card>
  );
}

// ============================================================================
// ROW CONTEXT MENU
// ============================================================================

function ConsortiumRowActions({
  consortium,
  canView,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}: {
  consortium: Consortium;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (consortium: Consortium) => void;
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
              onView(consortium.id);
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
              onEdit(consortium.id);
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
                onDelete(consortium);
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

// ============================================================================
// PAGINATION
// ============================================================================

function TablePágination({
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
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="gap-1"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ConsortiaPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // ---- Permissions ----
  const canList = hasPermission(PERMISSION_CODES.list);
  const canCreate = hasPermission(PERMISSION_CODES.create);
  const canView = hasPermission(PERMISSION_CODES.read);
  const canEdit = hasPermission(PERMISSION_CODES.update);
  const canDelete = hasPermission(PERMISSION_CODES.delete);

  // ---- State ----
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConsortiumStatus | 'ALL'>(
    'ALL'
  );
  const [contemplatedFilter, setContemplatedFilter] = useState<
    'ALL' | 'YES' | 'NO'
  >('ALL');
  const [deleteTarget, setDeleteTarget] = useState<Consortium | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // ---- Data Fetching ----
  const queryParams = useMemo(
    () => ({
      page,
      perPage: PER_PAGE,
      search: searchQuery || undefined,
      status:
        statusFilter !== 'ALL' ? (statusFilter as ConsortiumStatus) : undefined,
      isContemplated:
        contemplatedFilter === 'ALL' ? undefined : contemplatedFilter === 'YES',
    }),
    [page, searchQuery, statusFilter, contemplatedFilter]
  );

  const { data, isLoading, error, refetch } = useConsortia(queryParams);
  const deleteConsortium = useDeleteConsortium();

  const consortia = data?.consortia ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  // ---- Handlers ----
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value as ConsortiumStatus | 'ALL');
    setPage(1);
  }, []);

  const handleContemplatedChange = useCallback((value: string) => {
    setContemplatedFilter(value as 'ALL' | 'YES' | 'NO');
    setPage(1);
  }, []);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/finance/consortia/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/finance/consortia/${id}`);
    },
    [router]
  );

  const handleCreate = useCallback(() => {
    router.push('/finance/consortia/new');
  }, [router]);

  const handleRowClick = useCallback(
    (consortium: Consortium) => {
      if (canView) {
        router.push(`/finance/consortia/${consortium.id}`);
      }
    },
    [router, canView]
  );

  const handleDeleteRequest = useCallback((consortium: Consortium) => {
    setDeleteTarget(consortium);
    setPinModalOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteConsortium.mutateAsync(deleteTarget.id);
      toast.success(`Consórcio "${deleteTarget.name}" excluído com sucesso.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir consórcio';
      toast.error(message);
    }
  }, [deleteTarget, deleteConsortium, refetch]);

  // ---- Header Action Buttons (permission-aware) ----
  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-consortium',
        title: 'Novo Consórcio',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
        permission: PERMISSION_CODES.create,
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

  // ---- Active Filters Indicator ----
  const hasActiveFilters =
    statusFilter !== 'ALL' || contemplatedFilter !== 'ALL';

  const handleClearFilters = useCallback(() => {
    setStatusFilter('ALL');
    setContemplatedFilter('ALL');
    setPage(1);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Consórcios', href: '/finance/consortia' },
          ]}
          buttons={visibleActionButtons}
        />

        <Header
          title="Consórcios"
          description="Gerencie suas cotas de consórcio, acompanhe parcelas e contemplações"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          placeholder="Buscar por nome, administradora ou contrato..."
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

          <Select
            value={contemplatedFilter}
            onValueChange={handleContemplatedChange}
          >
            <SelectTrigger className="w-[180px] h-9 text-sm">
              <SelectValue placeholder="Contemplado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="YES">Contemplados</SelectItem>
              <SelectItem value="NO">Não contemplados</SelectItem>
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
            title="Erro ao carregar consórcios"
            message="Ocorreu um erro ao tentar carregar os consórcios. Por favor, tente novamente."
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
            message="Você não possui permissão para visualizar consórcios."
          />
        ) : consortia.length === 0 ? (
          <EmptyState canCreate={canCreate} onCreate={handleCreate} />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table aria-label="Tabela de consórcios">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Nome</TableHead>
                    <TableHead className="min-w-[140px]">
                      Administradora
                    </TableHead>
                    <TableHead className="min-w-[100px]">Grupo/Cota</TableHead>
                    <TableHead className="text-right min-w-[130px]">
                      Crédito
                    </TableHead>
                    <TableHead className="text-right min-w-[130px]">
                      Parcela Mensal
                    </TableHead>
                    <TableHead className="text-center min-w-[100px]">
                      Parcelas
                    </TableHead>
                    <TableHead className="min-w-[130px]">Progresso</TableHead>
                    <TableHead className="text-center min-w-[110px]">
                      Contemplado
                    </TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consortia.map(consortium => {
                    const progressPercentage =
                      consortium.totalInstallments > 0
                        ? Math.round(
                            (consortium.paidInstallments /
                              consortium.totalInstallments) *
                              100
                          )
                        : 0;

                    return (
                      <TableRow
                        key={consortium.id}
                        className={canView ? 'cursor-pointer' : ''}
                        onClick={() => handleRowClick(consortium)}
                      >
                        {/* Nome */}
                        <TableCell className="font-medium">
                          {consortium.name}
                        </TableCell>

                        {/* Administradora */}
                        <TableCell className="text-muted-foreground">
                          {consortium.administrator}
                        </TableCell>

                        {/* Grupo/Cota */}
                        <TableCell>
                          <span className="font-mono text-xs">
                            {consortium.groupNumber || '—'}
                            {consortium.groupNumber && consortium.quotaNumber
                              ? '/'
                              : ''}
                            {consortium.quotaNumber || ''}
                          </span>
                        </TableCell>

                        {/* Crédito */}
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(consortium.creditValue)}
                        </TableCell>

                        {/* Parcela Mensal */}
                        <TableCell className="text-right font-mono text-sm text-blue-600 dark:text-blue-400 font-semibold">
                          {formatCurrency(consortium.monthlyPayment)}
                        </TableCell>

                        {/* Parcelas (pagas/total) */}
                        <TableCell className="text-center">
                          <span className="font-mono text-sm">
                            {consortium.paidInstallments}
                            <span className="text-muted-foreground">
                              /{consortium.totalInstallments}
                            </span>
                          </span>
                        </TableCell>

                        {/* Progresso */}
                        <TableCell>
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

                        {/* Contemplado */}
                        <TableCell className="text-center">
                          {consortium.isContemplated ? (
                            <Badge variant="success" className="gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              Sim
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Não
                            </Badge>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge variant={getStatusVariant(consortium.status)}>
                            {CONSORTIUM_STATUS_LABELS[consortium.status]}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell
                          onClick={e => e.stopPropagation()}
                          className="text-center"
                        >
                          <ConsortiumRowActions
                            consortium={consortium}
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

            {/* Págination */}
            {total > PER_PAGE && (
              <div className="border-t">
                <TablePágination
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
              ? `Digite seu PIN de Ação para excluir o consórcio "${deleteTarget.name}".`
              : 'Digite seu PIN de Ação para autorizar esta operação.'
          }
        />
      </PageBody>
    </PageLayout>
  );
}
