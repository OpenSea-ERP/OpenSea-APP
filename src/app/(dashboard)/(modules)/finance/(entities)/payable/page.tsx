/**
 * OpenSea OS - Contas a Pagar (Accounts Payable)
 * Listagem de lançamentos financeiros do tipo PAYABLE
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { FilterPresets } from '@/components/finance/filter-presets';
import { BaixaModal } from '@/components/finance/baixa-modal';
import { useDeleteFinanceEntry, useFinanceEntries } from '@/hooks/finance';
import { useFinanceCategories } from '@/hooks/finance/use-finance-categories';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { normalizePagination } from '@/types/common/pagination';
import type {
  FinanceEntry,
  FinanceEntryStatus,
  FinanceEntriesQuery,
} from '@/types/finance';
import { FINANCE_ENTRY_STATUS_LABELS } from '@/types/finance';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarIcon,
  DollarSign,
  Eye,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { PayableWizardModal } from '@/components/finance/payable-wizard-modal';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS: { value: FinanceEntryStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'OVERDUE', label: 'Vencido' },
  { value: 'PAID', label: 'Pago' },
  { value: 'PARTIALLY_PAID', label: 'Parcialmente Pago' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'SCHEDULED', label: 'Agendado' },
];

const PAYABLE_STATUSES: FinanceEntryStatus[] = [
  'PENDING',
  'OVERDUE',
  'PARTIALLY_PAID',
];

const PERMISSION_CODES = {
  list: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
  create: FINANCE_PERMISSIONS.ENTRIES.REGISTER,
  read: FINANCE_PERMISSIONS.ENTRIES.ACCESS,
  update: FINANCE_PERMISSIONS.ENTRIES.MODIFY,
  delete: FINANCE_PERMISSIONS.ENTRIES.REMOVE,
} as const;

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusBadgeVariant(
  status: FinanceEntryStatus
): 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' {
  switch (status) {
    case 'PENDING':
      return 'secondary';
    case 'OVERDUE':
      return 'destructive';
    case 'PAID':
      return 'success';
    case 'RECEIVED':
      return 'success';
    case 'PARTIALLY_PAID':
      return 'warning';
    case 'CANCELLED':
      return 'outline';
    case 'SCHEDULED':
      return 'default';
    default:
      return 'secondary';
  }
}

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PayablePage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const deleteMutation = useDeleteFinanceEntry();

  // --------------------------------------------------------------------------
  // Permission flags
  // --------------------------------------------------------------------------

  const canCreate = hasPermission(PERMISSION_CODES.create);
  const canView = hasPermission(PERMISSION_CODES.read);
  const canEdit = hasPermission(PERMISSION_CODES.update);
  const canDelete = hasPermission(PERMISSION_CODES.delete);

  // --------------------------------------------------------------------------
  // Filter state
  // --------------------------------------------------------------------------

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FinanceEntryStatus | 'ALL'>(
    'ALL'
  );
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [dueDateFrom, setDueDateFrom] = useState<Date | undefined>(undefined);
  const [dueDateTo, setDueDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // --------------------------------------------------------------------------
  // Pagination state
  // --------------------------------------------------------------------------

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // --------------------------------------------------------------------------
  // Wizard modal state
  // --------------------------------------------------------------------------

  const [wizardOpen, setWizardOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Delete state
  // --------------------------------------------------------------------------

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Baixa modal state
  // --------------------------------------------------------------------------

  const [baixaEntry, setBaixaEntry] = useState<FinanceEntry | null>(null);
  const [baixaOpen, setBaixaOpen] = useState(false);

  // --------------------------------------------------------------------------
  // Categories for filter and rate lookup
  // --------------------------------------------------------------------------

  const { data: categoriesData } = useFinanceCategories();
  const categories = categoriesData?.categories ?? [];

  // --------------------------------------------------------------------------
  // Build query params for the hook
  // --------------------------------------------------------------------------

  const queryParams = useMemo<FinanceEntriesQuery>(() => {
    const params: FinanceEntriesQuery = {
      type: 'PAYABLE',
      page,
      perPage,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (statusFilter !== 'ALL') {
      params.status = statusFilter;
    }

    if (categoryFilter) {
      params.categoryId = categoryFilter;
    }

    if (supplierFilter.trim()) {
      params.supplierName = supplierFilter.trim();
    }

    if (dueDateFrom) {
      params.dueDateFrom = format(dueDateFrom, 'yyyy-MM-dd');
    }

    if (dueDateTo) {
      params.dueDateTo = format(dueDateTo, 'yyyy-MM-dd');
    }

    return params;
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    supplierFilter,
    dueDateFrom,
    dueDateTo,
    page,
    perPage,
  ]);

  // --------------------------------------------------------------------------
  // Data fetching
  // --------------------------------------------------------------------------

  const { data, isLoading, error, refetch } = useFinanceEntries(queryParams);

  const entries = data?.entries ?? [];
  const meta = data?.meta
    ? normalizePagination(data.meta)
    : {
        total: 0,
        page: 1,
        limit: perPage,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      };

  // --------------------------------------------------------------------------
  // Filters active badge count
  // --------------------------------------------------------------------------

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (categoryFilter) count++;
    if (supplierFilter.trim()) count++;
    if (dueDateFrom) count++;
    if (dueDateTo) count++;
    return count;
  }, [statusFilter, categoryFilter, supplierFilter, dueDateFrom, dueDateTo]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePerPageChange = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('ALL');
    setCategoryFilter('');
    setSupplierFilter('');
    setDueDateFrom(undefined);
    setDueDateTo(undefined);
    setPage(1);
  }, []);

  const handleView = useCallback(
    (id: string) => {
      router.push(`/finance/payable/${id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/finance/payable/${id}`);
    },
    [router]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTargetId(id);
    setPinModalOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTargetId) return;

    try {
      await deleteMutation.mutateAsync(deleteTargetId);
      toast.success('Conta a pagar excluída com sucesso.');
      setDeleteTargetId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao excluir conta a pagar.';
      toast.error(message);
    }
  }, [deleteTargetId, deleteMutation]);

  const handleRowClick = useCallback(
    (entry: FinanceEntry) => {
      if (canView) {
        router.push(`/finance/payable/${entry.id}`);
      }
    },
    [canView, router]
  );

  const handleOpenBaixa = useCallback((entry: FinanceEntry) => {
    setBaixaEntry(entry);
    setBaixaOpen(true);
  }, []);

  // Get category rates for the selected baixa entry
  const baixaCategoryRates = useMemo(() => {
    if (!baixaEntry) return { interestRate: undefined, penaltyRate: undefined };
    const cat = categories.find(c => c.id === baixaEntry.categoryId);
    return {
      interestRate: cat?.interestRate ?? undefined,
      penaltyRate: cat?.penaltyRate ?? undefined,
    };
  }, [baixaEntry, categories]);

  // --------------------------------------------------------------------------
  // Header action buttons (permission-gated)
  // --------------------------------------------------------------------------

  const handleCreateClick = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-payable',
        title: 'Nova Conta a Pagar',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: PERMISSION_CODES.create,
      },
    ],
    [handleCreateClick]
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
  // Pagination helpers
  // --------------------------------------------------------------------------

  const startItem = (meta.page - 1) * meta.limit + 1;
  const endItem = Math.min(meta.page * meta.limit, meta.total);

  const getPageNumbers = useCallback(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (meta.totalPages <= maxVisible + 2) {
      for (let i = 1; i <= meta.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (meta.page > 3) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, meta.page - 1);
      const end = Math.min(meta.totalPages - 1, meta.page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (meta.page < meta.totalPages - 2) {
        pages.push('ellipsis');
      }

      if (meta.totalPages > 1) {
        pages.push(meta.totalPages);
      }
    }

    return pages;
  }, [meta.page, meta.totalPages]);

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Contas a Pagar', href: '/finance/payable' },
          ]}
          buttons={visibleActionButtons}
        />

        <Header
          title="Contas a Pagar"
          description="Gerencie os pagamentos a fornecedores"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          placeholder="Buscar por descrição ou código..."
          onSearch={handleSearch}
          onClear={() => handleSearch('')}
          showClear={true}
          size="md"
        />

        {/* Filter Toggle & Active Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Filter Presets */}
        <FilterPresets
          pageKey="payable"
          currentFilters={{
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            categoryId: categoryFilter || undefined,
            supplierName: supplierFilter || undefined,
            dueDateFrom: dueDateFrom
              ? dueDateFrom.toISOString().split('T')[0]
              : undefined,
            dueDateTo: dueDateTo
              ? dueDateTo.toISOString().split('T')[0]
              : undefined,
          }}
          onApply={filters => {
            setStatusFilter((filters.status as FinanceEntryStatus) ?? 'ALL');
            setCategoryFilter(filters.categoryId ?? '');
            setSupplierFilter(filters.supplierName ?? '');
            setDueDateFrom(
              filters.dueDateFrom ? new Date(filters.dueDateFrom) : undefined
            );
            setDueDateTo(
              filters.dueDateTo ? new Date(filters.dueDateTo) : undefined
            );
            setPage(1);
          }}
          quickPresets={[
            { label: 'Vencidas', filters: { status: 'OVERDUE' } },
            { label: 'Pendentes', filters: { status: 'PENDING' } },
            {
              label: 'Próximos 7 dias',
              filters: {
                dueDateFrom: new Date().toISOString().split('T')[0],
                dueDateTo: new Date(Date.now() + 7 * 86400000)
                  .toISOString()
                  .split('T')[0],
              },
            },
          ]}
        />

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-1.5">
                <label
                  htmlFor="filter-status"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={value => {
                    setStatusFilter(value as FinanceEntryStatus | 'ALL');
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <label
                  htmlFor="filter-category"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Categoria
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={value => {
                    setCategoryFilter(value === 'ALL' ? '' : value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    {categories
                      .filter(c => c.type === 'EXPENSE' || c.type === 'BOTH')
                      .map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Name Filter */}
              <div className="space-y-1.5">
                <label
                  htmlFor="filter-supplier"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Fornecedor
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="filter-supplier"
                    placeholder="Nome do fornecedor..."
                    value={supplierFilter}
                    onChange={e => {
                      setSupplierFilter(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Due Date From */}
              <div className="space-y-1.5">
                <label
                  htmlFor="filter-due-from"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Vencimento de
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDateFrom
                        ? format(dueDateFrom, 'dd/MM/yyyy', { locale: ptBR })
                        : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDateFrom}
                      onSelect={date => {
                        setDueDateFrom(date ?? undefined);
                        setPage(1);
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due Date To */}
              <div className="space-y-1.5">
                <label
                  htmlFor="filter-due-to"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Vencimento até
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dueDateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDateTo
                        ? format(dueDateTo, 'dd/MM/yyyy', { locale: ptBR })
                        : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDateTo}
                      onSelect={date => {
                        setDueDateTo(date ?? undefined);
                        setPage(1);
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>
        )}

        {/* Table Content */}
        <Card>
          {isLoading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Erro ao carregar contas a pagar
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <DollarSign className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma conta a pagar encontrada
              </h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
                {activeFilterCount > 0 || searchQuery
                  ? 'Tente ajustar os filtros ou a busca.'
                  : 'Crie sua primeira conta a pagar para começar a gerenciar seus pagamentos.'}
              </p>
              {canCreate && !searchQuery && activeFilterCount === 0 && (
                <Button onClick={handleCreateClick}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Conta a Pagar
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table aria-label="Tabela de contas a pagar">
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px] hidden md:table-cell">
                      Código
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Fornecedor
                    </TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Vencimento
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map(entry => (
                    <TableRow
                      key={entry.id}
                      className={cn(
                        'transition-colors',
                        canView && 'cursor-pointer'
                      )}
                      onClick={() => handleRowClick(entry)}
                    >
                      <TableCell className="font-mono text-sm hidden md:table-cell">
                        {entry.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {entry.description}
                          </span>
                          {entry.currentInstallment != null &&
                            entry.totalInstallments != null &&
                            entry.totalInstallments > 1 && (
                              <Badge
                                variant="outline"
                                className="text-xs shrink-0"
                              >
                                Parcela {entry.currentInstallment}/
                                {entry.totalInstallments}
                              </Badge>
                            )}
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {entry.notes}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        {entry.supplierName || '\u2014'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(entry.expectedAmount)}
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        <span
                          className={cn(
                            entry.isOverdue &&
                              entry.status !== 'PAID' &&
                              entry.status !== 'CANCELLED'
                              ? 'text-destructive font-medium'
                              : ''
                          )}
                        >
                          {formatDate(entry.dueDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(entry.status)}>
                          {FINANCE_ENTRY_STATUS_LABELS[entry.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(canView || canEdit || canDelete) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={e => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Ações</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canView && (
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleView(entry.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Visualizar
                                </DropdownMenuItem>
                              )}
                              {canEdit &&
                                PAYABLE_STATUSES.includes(entry.status) && (
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleOpenBaixa(entry);
                                    }}
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Registrar Pagamento
                                  </DropdownMenuItem>
                                )}
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={e => {
                                    e.stopPropagation();
                                    handleEdit(entry.id);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteRequest(entry.id);
                                    }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                  {/* Results info */}
                  <div className="text-sm text-muted-foreground">
                    Mostrando <span className="font-medium">{startItem}</span> a{' '}
                    <span className="font-medium">{endItem}</span> de{' '}
                    <span className="font-medium">{meta.total}</span> resultados
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Per page selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Por página:
                      </span>
                      <Select
                        value={String(perPage)}
                        onValueChange={value =>
                          handlePerPageChange(Number(value))
                        }
                      >
                        <SelectTrigger className="w-[80px] h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 20, 50, 100].map(size => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Page navigation */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handlePageChange(1)}
                        disabled={!meta.hasPrev}
                        title="Primeira página"
                      >
                        <span className="text-xs font-bold">1</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handlePageChange(meta.page - 1)}
                        disabled={!meta.hasPrev}
                        title="Página anterior"
                      >
                        <span className="sr-only">Anterior</span>
                        &#8249;
                      </Button>

                      {/* Page numbers (desktop) */}
                      <div className="hidden sm:flex items-center gap-1">
                        {getPageNumbers().map((pageNum, index) =>
                          pageNum === 'ellipsis' ? (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 text-muted-foreground"
                            >
                              ...
                            </span>
                          ) : (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === meta.page ? 'default' : 'outline'
                              }
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        )}
                      </div>

                      {/* Mobile: Current page indicator */}
                      <span className="sm:hidden px-3 text-sm">
                        {meta.page} / {meta.totalPages}
                      </span>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handlePageChange(meta.page + 1)}
                        disabled={!meta.hasNext}
                        title="Próxima página"
                      >
                        <span className="sr-only">Próximo</span>
                        &#8250;
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => handlePageChange(meta.totalPages)}
                        disabled={!meta.hasNext}
                        title="Última página"
                      >
                        <span className="text-xs font-bold">
                          {meta.totalPages}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Single page info */}
              {meta.totalPages <= 1 && meta.total > 0 && (
                <div className="p-4 border-t text-sm text-muted-foreground text-center">
                  {meta.total} {meta.total === 1 ? 'resultado' : 'resultados'}
                </div>
              )}
            </>
          )}
        </Card>

        {/* Payable Wizard Modal */}
        <PayableWizardModal
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          onCreated={() => {
            refetch();
          }}
        />

        {/* Baixa Modal */}
        {baixaEntry && (
          <BaixaModal
            open={baixaOpen}
            onOpenChange={v => {
              setBaixaOpen(v);
              if (!v) setBaixaEntry(null);
            }}
            entry={baixaEntry}
            categoryInterestRate={baixaCategoryRates.interestRate}
            categoryPenaltyRate={baixaCategoryRates.penaltyRate}
          />
        )}

        {/* Delete PIN Confirmation Modal */}
        <VerifyActionPinModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setDeleteTargetId(null);
          }}
          onSuccess={handleDeleteConfirmed}
          title="Confirmar Exclusão"
          description="Digite seu PIN de Ação para confirmar a exclusão desta conta a pagar."
        />
      </PageBody>
    </PageLayout>
  );
}
