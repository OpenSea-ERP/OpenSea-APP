/**
 * OpenSea OS - Contas Bancárias (Bank Accounts)
 * Listagem com infinite scroll e filtros server-side
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { LinkCompanyModal } from '@/components/modals/link-company-modal';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import type { EntityConfig } from '@/core/types';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useBankAccountsInfinite,
  useDeleteBankAccount,
  useUpdateBankAccount,
  useCreateBankAccount,
  type BankAccountsFilters,
} from '@/hooks/finance/use-bank-accounts';
import { cn } from '@/lib/utils';
import type {
  BankAccount,
  BankAccountStatus,
  BankAccountType,
} from '@/types/finance';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
} from '@/types/finance';
import {
  Building2,
  DollarSign,
  Landmark,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Unlink,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import { CreateBankAccountWizard } from './src';

// =============================================================================
// CONSTANTS
// =============================================================================

const STATUS_OPTIONS = [
  { id: 'ACTIVE', label: 'Ativa' },
  { id: 'INACTIVE', label: 'Inativa' },
  { id: 'CLOSED', label: 'Encerrada' },
];

const TYPE_OPTIONS = [
  { id: 'CHECKING', label: 'Conta Corrente' },
  { id: 'SAVINGS', label: 'Poupança' },
  { id: 'SALARY', label: 'Conta Salário' },
  { id: 'PAYMENT', label: 'Conta Pagamento' },
  { id: 'INVESTMENT', label: 'Investimento' },
  { id: 'DIGITAL', label: 'Conta Digital' },
  { id: 'OTHER', label: 'Outro' },
];

// =============================================================================
// ENTITY CONFIG
// =============================================================================

const bankAccountsConfig: EntityConfig<BankAccount> = {
  name: 'bank-account',
  namePlural: 'bank-accounts',
  icon: Landmark,
  api: {
    baseUrl: '/api/v1/bank-accounts',
    queryKey: 'bank-accounts',
  },
  routes: {
    list: '/finance/bank-accounts',
    detail: '/finance/bank-accounts/:id',
  },
  display: {
    titleField: 'name',
    subtitleField: 'bankName',
    labels: {
      singular: 'conta bancária',
      plural: 'contas bancárias',
      createButton: 'Nova Conta Bancária',
      emptyState: 'Nenhuma conta bancária cadastrada',
      searchPlaceholder: 'Buscar por nome, banco, agência ou conta...',
    },
  },
  permissions: {
    view: FINANCE_PERMISSIONS.BANK_ACCOUNTS.ACCESS,
    create: FINANCE_PERMISSIONS.BANK_ACCOUNTS.REGISTER,
    update: FINANCE_PERMISSIONS.BANK_ACCOUNTS.MODIFY,
    delete: FINANCE_PERMISSIONS.BANK_ACCOUNTS.REMOVE,
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getStatusColor(status: BankAccountStatus): string {
  const colors: Record<BankAccountStatus, string> = {
    ACTIVE:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    INACTIVE:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    CLOSED:
      'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  };
  return colors[status] ?? colors.ACTIVE;
}

function getTypeBadgeColor(): string {
  return 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300';
}

// =============================================================================
// TYPES
// =============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function BankAccountsPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <BankAccountsPageContent />
    </Suspense>
  );
}

function BankAccountsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const typeIds = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'name' | 'bankName' | 'currentBalance' | 'createdAt' | 'status'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<BankAccount | null>(null);
  const [linkMode, setLinkMode] = useState<'link' | 'unlink'>('link');

  // ============================================================================
  // DATA: Infinite scroll + mutations
  // ============================================================================

  const filters: BankAccountsFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status:
        statusIds.length === 1
          ? (statusIds[0] as BankAccountStatus)
          : undefined,
      accountType:
        typeIds.length === 1 ? (typeIds[0] as BankAccountType) : undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusIds, typeIds, sortBy, sortOrder]
  );

  const {
    bankAccounts,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useBankAccountsInfinite(filters);

  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      observerEntries => {
        if (
          observerEntries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[]; type?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      const typ = params.type !== undefined ? params.type : typeIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      if (typ.length > 0) parts.push(`type=${typ.join(',')}`);
      return parts.length > 0
        ? `/finance/bank-accounts?${parts.join('&')}`
        : '/finance/bank-accounts';
    },
    [statusIds, typeIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/bank-accounts/${ids[0]}`);
    }
  };

  const handleContextEdit = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/bank-accounts/${ids[0]}/edit`);
    }
  };

  const handleContextDelete = (ids: string[]) => {
    setItemsToDelete(ids);
    setDeleteModalOpen(true);
  };

  const handleLinkCompany = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        const account = bankAccounts.find(a => a.id === ids[0]);
        if (account) {
          setLinkTarget(account);
          setLinkMode(account.companyId ? 'unlink' : 'link');
          setLinkModalOpen(true);
        }
      }
    },
    [bankAccounts]
  );

  const handleDeleteConfirm = useCallback(async () => {
    for (const id of itemsToDelete) {
      await deleteMutation.mutateAsync(id);
    }
    setDeleteModalOpen(false);
    setItemsToDelete([]);
    toast.success(
      itemsToDelete.length === 1
        ? 'Conta bancária excluída com sucesso!'
        : `${itemsToDelete.length} contas bancárias excluídas!`
    );
  }, [itemsToDelete, deleteMutation]);

  const handleCreate = useCallback(
    async (data: Parameters<typeof createMutation.mutateAsync>[0]) => {
      try {
        await createMutation.mutateAsync(data);
        toast.success('Conta bancária criada com sucesso!');
        setCreateModalOpen(false);
      } catch {
        toast.error('Erro ao criar conta bancária.');
      }
    },
    [createMutation]
  );

  const handleLinkConfirm = useCallback(
    async (companyId: string | null) => {
      if (!linkTarget) return;
      try {
        await updateMutation.mutateAsync({
          id: linkTarget.id,
          data: { companyId } as Parameters<
            typeof updateMutation.mutateAsync
          >[0]['data'],
        });
        toast.success(
          companyId
            ? 'Empresa vinculada com sucesso.'
            : 'Empresa desvinculada com sucesso.'
        );
        setLinkModalOpen(false);
        setLinkTarget(null);
      } catch {
        toast.error('Erro ao atualizar vínculo da empresa.');
      }
    },
    [linkTarget, updateMutation]
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: BankAccount, isSelected: boolean) => {
    const hasCompany = !!item.companyId;

    const customActions: ContextMenuAction[] = [];

    if (canEdit) {
      customActions.push({
        id: hasCompany ? 'unlink-company' : 'link-company',
        label: hasCompany ? 'Desvincular Empresa' : 'Vincular Empresa',
        icon: hasCompany ? Unlink : Link2,
        onClick: handleLinkCompany,
        separator: 'before',
      });
    }

    if (canDelete) {
      customActions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive',
        separator: 'before',
      });
    }

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={customActions}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={
            item.bankName
              ? `${item.bankCode} - ${item.bankName}`
              : item.bankCode
          }
          icon={Landmark}
          iconBgStyle={{
            background: `linear-gradient(135deg, ${item.color || '#3b82f6'}, ${item.color || '#3b82f6'}dd)`,
          }}
          badges={[
            {
              label:
                BANK_ACCOUNT_TYPE_LABELS[item.accountType] ?? item.accountType,
              variant: 'outline',
              color: getTypeBadgeColor(),
            },
            {
              label: BANK_ACCOUNT_STATUS_LABELS[item.status] ?? item.status,
              variant: 'outline',
              color: getStatusColor(item.status),
            },
            ...(item.isDefault
              ? [
                  {
                    label: 'Padrão',
                    variant: 'outline' as const,
                    color:
                      'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
                  },
                ]
              : []),
          ]}
          footer={{
            type: 'single',
            button: {
              icon: DollarSign,
              label: formatCurrency(item.currentBalance),
              onClick: () => {},
              color: 'secondary',
            },
          }}
          metadata={
            <div className="flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-4">
                <span className="font-mono">
                  Ag: {item.agency}
                  {item.agencyDigit ? `-${item.agencyDigit}` : ''}
                </span>
                <span className="font-mono">
                  Cc: {item.accountNumber}
                  {item.accountDigit ? `-${item.accountDigit}` : ''}
                </span>
              </div>
              {item.companyName && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {item.companyName}
                </span>
              )}
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: BankAccount, isSelected: boolean) => {
    const hasCompany = !!item.companyId;

    const customActions: ContextMenuAction[] = [];

    if (canEdit) {
      customActions.push({
        id: hasCompany ? 'unlink-company' : 'link-company',
        label: hasCompany ? 'Desvincular Empresa' : 'Vincular Empresa',
        icon: hasCompany ? Unlink : Link2,
        onClick: handleLinkCompany,
        separator: 'before',
      });
    }

    if (canDelete) {
      customActions.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: handleContextDelete,
        variant: 'destructive',
        separator: 'before',
      });
    }

    const listBadges: {
      label: string;
      variant: 'outline';
      color: string;
    }[] = [
      {
        label: BANK_ACCOUNT_TYPE_LABELS[item.accountType] ?? item.accountType,
        variant: 'outline',
        color: getTypeBadgeColor(),
      },
      {
        label: BANK_ACCOUNT_STATUS_LABELS[item.status] ?? item.status,
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      ...(item.isDefault
        ? [
            {
              label: 'Padrão',
              variant: 'outline' as const,
              color:
                'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
            },
          ]
        : []),
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        onEdit={canEdit ? handleContextEdit : undefined}
        actions={customActions}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={item.name}
          icon={Landmark}
          iconBgStyle={{
            background: `linear-gradient(135deg, ${item.color || '#3b82f6'}, ${item.color || '#3b82f6'}dd)`,
          }}
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges.map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
                    badge.color
                  )}
                >
                  {badge.label}
                </span>
              ))}
              <span className="font-mono text-xs text-muted-foreground ml-1">
                Ag: {item.agency}
                {item.agencyDigit ? `-${item.agencyDigit}` : ''} | Cc:{' '}
                {item.accountNumber}
                {item.accountDigit ? `-${item.accountDigit}` : ''}
                {item.companyName ? ` | ${item.companyName}` : ''}
              </span>
            </div>
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        >
          {/* Right zone: balance */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.currentBalance)}
            </span>
            {item.bankName && (
              <span className="text-xs text-muted-foreground">
                {item.bankName}
              </span>
            )}
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => bankAccounts.map(a => a.id), [bankAccounts]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const handleCreateClick = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'create-bank-account',
        title: 'Nova Conta Bancária',
        icon: Plus,
        onClick: handleCreateClick,
        variant: 'default',
        permission: FINANCE_PERMISSIONS.BANK_ACCOUNTS.REGISTER,
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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'bank-accounts',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Contas Bancárias"
            description="Gerencie as contas bancárias da empresa"
          />
        </PageHeader>

        <PageBody>
          <div data-testid="bank-accounts-page" className="contents" />
          {/* Search Bar */}
          <div data-testid="bank-accounts-search">
            <SearchBar
              placeholder={bankAccountsConfig.display.labels.searchPlaceholder}
              value={searchQuery}
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery('')}
              showClear={true}
              size="md"
            />
          </div>

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="list" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar contas bancárias"
              message="Ocorreu um erro ao tentar carregar as contas bancárias. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={bankAccountsConfig}
                items={bankAccounts}
                showItemCount={false}
                toolbarStart={
                  <>
                    <div data-testid="bank-accounts-filter-status">
                      <FilterDropdown
                        label="Status"
                        icon={Landmark}
                        options={STATUS_OPTIONS}
                        selected={statusIds}
                        onSelectionChange={setStatusFilter}
                        activeColor="violet"
                        searchPlaceholder="Buscar status..."
                        emptyText="Nenhum status encontrado."
                      />
                    </div>
                    <div data-testid="bank-accounts-filter-type">
                      <FilterDropdown
                        label="Tipo"
                        icon={Building2}
                        options={TYPE_OPTIONS}
                        selected={typeIds}
                        onSelectionChange={setTypeFilter}
                        activeColor="cyan"
                        searchPlaceholder="Buscar tipo..."
                        emptyText="Nenhum tipo encontrado."
                      />
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-nowrap" data-testid="bank-accounts-count">
                      {total} {total === 1 ? 'conta' : 'contas'}
                      {bankAccounts.length < total &&
                        ` (${bankAccounts.length} carregadas)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/bank-accounts/${item.id}`)
                }
                showSorting={true}
                defaultSortField="name"
                defaultSortDirection="asc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(
                      field as
                        | 'name'
                        | 'bankName'
                        | 'currentBalance'
                        | 'createdAt'
                        | 'status'
                    );
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Create Wizard */}
          <CreateBankAccountWizard
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSubmit={handleCreate}
            isSubmitting={createMutation.isPending}
          />

          {/* Delete PIN Confirmation Modal */}
          <VerifyActionPinModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setItemsToDelete([]);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description={
              itemsToDelete.length === 1
                ? 'Digite seu PIN de Ação para confirmar a exclusão desta conta bancária. Esta ação não pode ser desfeita.'
                : `Digite seu PIN de Ação para excluir ${itemsToDelete.length} contas bancárias. Esta ação não pode ser desfeita.`
            }
          />

          {/* Link/Unlink Company Modal */}
          <LinkCompanyModal
            isOpen={linkModalOpen}
            onClose={() => {
              setLinkModalOpen(false);
              setLinkTarget(null);
            }}
            onConfirm={handleLinkConfirm}
            currentCompanyId={linkTarget?.companyId}
            currentCompanyName={linkTarget?.companyName}
            mode={linkMode}
            isLoading={updateMutation.isPending}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
