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
import { LinkCompanyModal } from '@/components/modals/link-company-modal';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { EntityCard, EntityContextMenu, EntityGrid } from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import type { EntityConfig } from '@/core/types';
import {
  useBankAccounts,
  useCreateBankAccount,
  useDeleteBankAccount,
  useUpdateBankAccount,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { BankAccount } from '@/types/finance';
import {
  BANK_ACCOUNT_STATUS_LABELS,
  BANK_ACCOUNT_TYPE_LABELS,
} from '@/types/finance';
import { Building2, Landmark, Link2, Plus, Unlink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CreateBankAccountWizard } from './src';

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

function getStatusBadgeConfig(status: string) {
  switch (status) {
    case 'ACTIVE':
      return {
        variant: 'default' as const,
        color:
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
      };
    case 'INACTIVE':
      return {
        variant: 'secondary' as const,
        color:
          'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20',
      };
    case 'CLOSED':
      return {
        variant: 'destructive' as const,
        color:
          'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20',
      };
    default:
      return { variant: 'secondary' as const, color: '' };
  }
}

function getTypeBadgeColor() {
  return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20';
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function BankAccountsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Permissions
  const canView = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.BANK_ACCOUNTS.REMOVE);

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const bankAccounts = data?.bankAccounts;

  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<BankAccount | null>(null);
  const [linkMode, setLinkMode] = useState<'link' | 'unlink'>('link');

  // ============================================================================
  // FILTERED DATA
  // ============================================================================

  const filteredAccounts = useMemo(() => {
    if (!bankAccounts) return [];
    if (!searchQuery.trim()) return bankAccounts;

    const q = searchQuery.toLowerCase();
    return bankAccounts.filter(account => {
      const name = account.name?.toLowerCase() ?? '';
      const bankName = account.bankName?.toLowerCase() ?? '';
      const agency = account.agency?.toLowerCase() ?? '';
      const accountNumber = account.accountNumber?.toLowerCase() ?? '';
      return (
        name.includes(q) ||
        bankName.includes(q) ||
        agency.includes(q) ||
        accountNumber.includes(q)
      );
    });
  }, [bankAccounts, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

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

  const handleView = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        router.push(`/finance/bank-accounts/${ids[0]}`);
      }
    },
    [router]
  );

  const handleEdit = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        router.push(`/finance/bank-accounts/${ids[0]}`);
      }
    },
    [router]
  );

  const handleDeleteRequest = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        const account = bankAccounts?.find(a => a.id === ids[0]);
        if (account) {
          setDeleteTarget(account);
          setPinModalOpen(true);
        }
      }
    },
    [bankAccounts]
  );

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success(`Conta "${deleteTarget.name}" excluída com sucesso.`);
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao excluir conta bancária.');
    }
  }, [deleteTarget, deleteMutation]);

  const handleLinkCompany = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        const account = bankAccounts?.find(a => a.id === ids[0]);
        if (account) {
          setLinkTarget(account);
          setLinkMode(account.companyId ? 'unlink' : 'link');
          setLinkModalOpen(true);
        }
      }
    },
    [bankAccounts]
  );

  const handleLinkConfirm = useCallback(
    async (companyId: string | null) => {
      if (!linkTarget) return;
      try {
        // companyId is excluded from UpdateBankAccountData type but the
        // backend PATCH endpoint accepts it, so we use a type assertion.
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

  const renderGridCard = useCallback(
    (item: BankAccount, isSelected: boolean) => {
      const statusBadge = getStatusBadgeConfig(item.status);
      const typeBadgeColor = getTypeBadgeColor();
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
          icon: undefined,
          onClick: handleDeleteRequest,
          variant: 'destructive',
          separator: 'before',
        });
      }

      return (
        <EntityContextMenu
          itemId={item.id}
          onView={canView ? handleView : undefined}
          onEdit={canEdit ? handleEdit : undefined}
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
                  BANK_ACCOUNT_TYPE_LABELS[item.accountType] ??
                  item.accountType,
                variant: 'outline',
                color: typeBadgeColor,
              },
              {
                label: BANK_ACCOUNT_STATUS_LABELS[item.status] ?? item.status,
                variant: statusBadge.variant,
                color: statusBadge.color,
              },
              ...(item.isDefault
                ? [
                    {
                      label: 'Padrão',
                      variant: 'outline' as const,
                      color:
                        'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/20',
                    },
                  ]
                : []),
            ]}
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
            showStatusBadges={true}
          />
        </EntityContextMenu>
      );
    },
    [
      canView,
      canEdit,
      canDelete,
      handleView,
      handleEdit,
      handleDeleteRequest,
      handleLinkCompany,
    ]
  );

  const renderListCard = useCallback(
    (item: BankAccount, isSelected: boolean) => {
      const statusBadge = getStatusBadgeConfig(item.status);
      const typeBadgeColor = getTypeBadgeColor();
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
          icon: undefined,
          onClick: handleDeleteRequest,
          variant: 'destructive',
          separator: 'before',
        });
      }

      return (
        <EntityContextMenu
          itemId={item.id}
          onView={canView ? handleView : undefined}
          onEdit={canEdit ? handleEdit : undefined}
          actions={customActions}
        >
          <EntityCard
            id={item.id}
            variant="list"
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
                  BANK_ACCOUNT_TYPE_LABELS[item.accountType] ??
                  item.accountType,
                variant: 'outline',
                color: typeBadgeColor,
              },
              {
                label: BANK_ACCOUNT_STATUS_LABELS[item.status] ?? item.status,
                variant: statusBadge.variant,
                color: statusBadge.color,
              },
              ...(item.isDefault
                ? [
                    {
                      label: 'Padrão',
                      variant: 'outline' as const,
                      color:
                        'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/20',
                    },
                  ]
                : []),
            ]}
            metadata={
              <span className="font-mono text-xs">
                Ag: {item.agency}
                {item.agencyDigit ? `-${item.agencyDigit}` : ''} | Cc:{' '}
                {item.accountNumber}
                {item.accountDigit ? `-${item.accountDigit}` : ''}
                {item.companyName ? ` | ${item.companyName}` : ''}
              </span>
            }
            isSelected={isSelected}
            showSelection={false}
            clickable={false}
            createdAt={item.createdAt}
            updatedAt={item.updatedAt}
            showStatusBadges={true}
          />
        </EntityContextMenu>
      );
    },
    [
      canView,
      canEdit,
      canDelete,
      handleView,
      handleEdit,
      handleDeleteRequest,
      handleLinkCompany,
    ]
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons = useMemo(() => {
    const buttons = [];

    if (canCreate) {
      buttons.push({
        id: 'create-bank-account',
        title: 'Nova Conta Bancária',
        icon: Plus,
        onClick: () => setCreateModalOpen(true),
        variant: 'default' as const,
      });
    }

    return buttons;
  }, [canCreate]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Contas Bancárias', href: '/finance/bank-accounts' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Contas Bancárias"
          description="Gerencie as contas bancárias da empresa"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          placeholder={bankAccountsConfig.display.labels.searchPlaceholder}
          onSearch={handleSearch}
          onClear={() => handleSearch('')}
          showClear={true}
          size="md"
        />

        {/* Grid */}
        {isLoading ? (
          <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
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
          <EntityGrid
            config={bankAccountsConfig}
            items={filteredAccounts}
            renderGridItem={renderGridCard}
            renderListItem={renderListCard}
            isLoading={isLoading}
            isSearching={!!searchQuery}
            onItemDoubleClick={item => {
              if (canView) {
                router.push(`/finance/bank-accounts/${item.id}`);
              }
            }}
            showSorting={true}
            defaultSortField="name"
            defaultSortDirection="asc"
          />
        )}

        {/* Create Wizard */}
        <CreateBankAccountWizard
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
        />

        {/* Delete Confirmation via PIN */}
        <VerifyActionPinModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setDeleteTarget(null);
          }}
          onSuccess={handleDeleteConfirmed}
          title="Confirmar Exclusão"
          description={`Digite seu PIN de ação para excluir a conta "${deleteTarget?.name ?? ''}". Esta ação não pode ser desfeita.`}
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
  );
}
